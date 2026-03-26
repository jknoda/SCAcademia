import { QueryResult } from 'pg';
import { pool } from './db';

export interface SyncQueueEntry {
  id: string;
  batch_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  resource: string;
  resource_id?: string;
  payload: Record<string, unknown>;
  client_timestamp: number;
  status: 'pending' | 'synced' | 'failed' | 'retry';
  retry_count: number;
  server_timestamp: string;
}

export interface SyncBatchRequest {
  batch: Array<{
    id?: string;
    action: string;
    resource: string;
    resourceId?: string;
    payload: Record<string, unknown>;
    timestamp: number;
  }>;
  clientTimestamp: number;
}

export interface ConflictResolution {
  hasConflict: boolean;
  winner: 'client' | 'server';
  resolvedData?: Record<string, unknown>;
  reason?: string;
}

export interface SyncResponse {
  id: string;
  batchId: string;
  result: 'synced' | 'conflict' | 'failed';
  resolvedWith?: 'server_version' | 'client_version';
  serverVersion?: Record<string, unknown>;
  error?: string;
}

/**
 * Detectconflict between client and server versions
 * Last-Write-Wins strategy: server timestamp wins if later than client timestamp
 */
export function detectConflict(
  clientTimestamp: number,
  serverTimestamp: number,
  _clientData: Record<string, unknown>,
  _serverData?: Record<string, unknown>
): ConflictResolution {
  // Convert server timestamp to milliseconds if needed (stored as ISO string)
  const serverMs = typeof serverTimestamp === 'number' 
    ? serverTimestamp 
    : new Date(serverTimestamp as any as string).getTime();

  if (serverMs > clientTimestamp) {
    return {
      hasConflict: true,
      winner: 'server',
      reason: `Server edit (${new Date(serverMs).toISOString()}) is newer than client (${new Date(clientTimestamp).toISOString()})`
    };
  }

  return {
    hasConflict: false,
    winner: 'client'
  };
}

/**
 * Store sync queue entry in database
 * Used when offline operation completes locally and needs to be synced
 */
export async function enqueueSyncOperation(
  professorId: string,
  academyId: string,
  batchId: string,
  action: string,
  resource: string,
  payload: Record<string, unknown>,
  clientTimestamp: number,
  resourceId?: string
): Promise<SyncQueueEntry> {
  const sql = `
    INSERT INTO sync_queue (
      professor_id, academy_id, batch_id, action, resource, 
      resource_id, payload, client_timestamp, status, retry_count
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 0)
    RETURNING *
  `;

  try {
    const result = await pool.query(sql, [
      professorId,
      academyId,
      batchId,
      action,
      resource,
      resourceId || null,
      JSON.stringify(payload),
      clientTimestamp
    ]);

    return result.rows[0];
  } catch (error) {
    console.error('Error enqueuing sync operation:', error);
    throw error;
  }
}

/**
 * Get all pending sync operations for a professor
 */
export async function getPendingOperations(
  professorId: string,
  academyId: string
): Promise<SyncQueueEntry[]> {
  const sql = `
    SELECT * FROM sync_queue
    WHERE professor_id = $1 
      AND academy_id = $2
      AND status IN ('pending', 'retry')
      AND deleted_at IS NULL
    ORDER BY created_at ASC
    LIMIT 100
  `;

  const result = await pool.query(sql, [professorId, academyId]);
  return result.rows.map(row => ({
    ...row,
    payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload
  }));
}

/**
 * Mark sync operation as successful
 */
export async function markOperationSynced(
  queueId: string,
  professorId: string
): Promise<void> {
  const sql = `
    UPDATE sync_queue
    SET status = 'synced', 
        synced_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        retry_count = 0
    WHERE id = $1 AND professor_id = $2
  `;

  await pool.query(sql, [queueId, professorId]);
}

/**
 * Mark sync operation as failed and schedule retry with exponential backoff
 */
export async function markOperationFailed(
  queueId: string,
  professorId: string,
  errorMessage: string
): Promise<void> {
  const sql = `
    UPDATE sync_queue
    SET status = CASE 
          WHEN retry_count < max_retries THEN 'retry'
          ELSE 'failed'
        END,
        retry_count = retry_count + 1,
        next_retry = CASE
          WHEN retry_count < max_retries 
          THEN CURRENT_TIMESTAMP + (INTERVAL '1 second' * POWER(2, retry_count))
          ELSE NULL
        END,
        error_message = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND professor_id = $2
  `;

  await pool.query(sql, [queueId, professorId, errorMessage]);
}

/**
 * Mark operation as having a conflict and store server version
 */
export async function markOperationConflict(
  queueId: string,
  professorId: string,
  serverVersion: Record<string, unknown>
): Promise<void> {
  const sql = `
    UPDATE sync_queue
    SET status = 'synced',
        conflict_detected = true,
        resolved_with = 'server_version',
        server_version = $3,
        synced_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND professor_id = $2
  `;

  await pool.query(sql, [queueId, professorId, JSON.stringify(serverVersion)]);
}

/**
 * Record completed sync in history
 */
export async function recordSyncHistory(
  professorId: string,
  academyId: string,
  batchId: string,
  totalRecords: number,
  syncedCount: number,
  failedCount: number,
  conflictCount: number,
  durationMs: number,
  errorSummary?: string
): Promise<void> {
  const sql = `
    INSERT INTO sync_history (
      professor_id, academy_id, batch_id, total_records, 
      synced_count, failed_count, conflict_count, duration_ms, error_summary
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `;

  await pool.query(sql, [
    professorId,
    academyId,
    batchId,
    totalRecords,
    syncedCount,
    failedCount,
    conflictCount,
    durationMs,
    errorSummary || null
  ]);
}

/**
 * Get admin monitoring data: pending sync operations across all professors
 */
export async function getPendingSyncQueueForAdmin(): Promise<Array<{
  professor_id: string;
  academy_id: string;
  pending_count: number;
  failed_count: number;
  oldest_pending: string | null;
}>> {
  const sql = `
    SELECT 
      professor_id,
      academy_id,
      COUNT(CASE WHEN status IN ('pending', 'retry') THEN 1 END) as pending_count,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
      MIN(CASE WHEN status IN ('pending', 'retry') THEN created_at END) as oldest_pending
    FROM sync_queue
    WHERE deleted_at IS NULL
    GROUP BY professor_id, academy_id
    HAVING COUNT(CASE WHEN status IN ('pending', 'retry', 'failed') THEN 1 END) > 0
    ORDER BY oldest_pending ASC
  `;

  const result = await pool.query(sql);
  return result.rows;
}

/**
 * Clean up sync_history older than 30 days
 * Run this periodically (e.g., daily cron job)
 */
export async function cleanupSyncHistory(): Promise<number> {
  const sql = `
    DELETE FROM sync_history
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
      AND deleted_at IS NULL
  `;

  const result = await pool.query(sql);
  return result.rowCount || 0;
}
