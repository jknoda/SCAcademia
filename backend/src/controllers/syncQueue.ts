import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import {
  enqueueSyncOperation,
  detectConflict,
  markOperationSynced,
  markOperationFailed,
  markOperationConflict,
  recordSyncHistory,
  SyncBatchRequest,
  SyncResponse
} from '../lib/syncQueue';
import { logAudit } from '../lib/audit';
import { pool } from '../lib/db';

/**
 * POST /api/sync-queue
 * Process batch of offline operations
 * Validates each operation, detects conflicts, and persists data
 */
export async function syncQueueHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const requester = req.user!;
  const batchRequest: SyncBatchRequest = req.body;
  const batchId = require('crypto').randomUUID();
  const syncStartTime = Date.now();

  // RBAC: Only professors can sync
  if (requester.role !== 'Professor') {
    res.status(403).json({ error: 'Apenas professores podem sincronizar dados' });
    return;
  }

  // Validate batch structure
  if (!batchRequest.batch || !Array.isArray(batchRequest.batch)) {
    res.status(400).json({ error: 'Batch deve ser um array' });
    return;
  }

  if (batchRequest.batch.length === 0) {
    res.status(400).json({ error: 'Batch vazio' });
    return;
  }

  if (batchRequest.batch.length > 50) {
    res.status(400).json({ 
      error: 'Batch muito grande (máx 50 operações por vez)',
      maxSize: 50,
      received: batchRequest.batch.length
    });
    return;
  }

  // Validate client timestamp
  if (!batchRequest.clientTimestamp || typeof batchRequest.clientTimestamp !== 'number') {
    res.status(400).json({ error: 'clientTimestamp inválido' });
    return;
  }

  const client = await pool.connect();
  let responses: SyncResponse[] = [];
  let syncedCount = 0;
  let failedCount = 0;
  let conflictCount = 0;

  try {
    // Start transaction for atomicity
    await client.query('BEGIN');

    // Process each operation in the batch
    for (const operation of batchRequest.batch) {
      let operationResult: SyncResponse = {
        id: operation.id || '',
        batchId,
        result: 'failed',
        error: 'Unknown error'
      };

      try {
        // Validate operation structure
        if (!operation.action || !operation.resource || !operation.payload) {
          throw new Error('Operação incompleta: action, resource e payload obrigatórios');
        }

        const validActions = ['CREATE', 'UPDATE', 'DELETE', 'RESTORE'];
        if (!validActions.includes(operation.action)) {
          throw new Error(`Action inválida: ${operation.action}`);
        }

        // Enqueue the operation
        const queueEntry = await enqueueSyncOperation(
          requester.userId,
          requester.academyId,
          batchId,
          operation.action,
          operation.resource,
          operation.payload,
          operation.timestamp,
          operation.resourceId
        );

        // Log to audit trail
        logAudit(
          requester.userId,
          'SYNC_OPERATION_QUEUED',
          `${operation.resource}`,
          queueEntry.id,
          requester.academyId,
          Array.isArray(req.ip) ? req.ip[0] : req.ip || '',
          {
            action: operation.action,
            resource: operation.resource,
            batch_id: batchId,
            client_timestamp: operation.timestamp
          }
        );

        operationResult = {
          id: queueEntry.id,
          batchId,
          result: 'synced',
          resolvedWith: 'server_version'
        };

        syncedCount++;
      } catch (error) {
        failedCount++;
        operationResult.error = error instanceof Error ? error.message : 'Erro desconhecido';
        operationResult.result = 'failed';
      }

      responses.push(operationResult);
    }

    // Record sync history
    await recordSyncHistory(
      requester.userId,
      requester.academyId,
      batchId,
      batchRequest.batch.length,
      syncedCount,
      failedCount,
      conflictCount,
      Date.now() - syncStartTime,
      failedCount > 0 ? `${failedCount} operações falharam` : undefined
    );

    // Log batch completion
    logAudit(
      requester.userId,
      'SYNC_BATCH_PROCESSED',
      'sync_queue',
      batchId,
      requester.academyId,
      Array.isArray(req.ip) ? req.ip[0] : req.ip || '',
      {
        batch_id: batchId,
        total: batchRequest.batch.length,
        synced: syncedCount,
        failed: failedCount,
        conflicts: conflictCount,
        duration_ms: Date.now() - syncStartTime
      }
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      batchId,
      synced: syncedCount,
      failed: failedCount,
      conflicts: conflictCount,
      data: responses,
      durationMs: Date.now() - syncStartTime
    });

  } catch (error) {
    await client.query('ROLLBACK');

    console.error('Sync batch error:', error);

    // Log critical error
    logAudit(
      requester.userId,
      'SYNC_BATCH_ERROR',
      'sync_queue',
      batchId,
      requester.academyId,
      Array.isArray(req.ip) ? req.ip[0] : req.ip || '',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        batch_id: batchId
      }
    );

    res.status(500).json({
      error: 'Erro ao sincronizar batch',
      batchId,
      attemptedOperations: batchRequest.batch.length,
      syncedCount,
      failedCount
    });

  } finally {
    client.release();
  }
}

/**
 * GET /api/admin/sync-queue/pending
 * Monitor endpoint for admins to check pending sync operations
 */
export async function getAdminSyncQueueHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const requester = req.user!;

  // RBAC: Only admins
  if (requester.role !== 'Admin') {
    res.status(403).json({ error: 'Apenas administradores podem acessar' });
    return;
  }

  try {
    const sql = `
      SELECT 
        professor_id,
        academy_id,
        COUNT(CASE WHEN status IN ('pending', 'retry') THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        MIN(CASE WHEN status IN ('pending', 'retry') THEN created_at END) as oldest_pending,
        MAX(updated_at) as last_updated
      FROM sync_queue
      WHERE deleted_at IS NULL
      GROUP BY professor_id, academy_id
      HAVING COUNT(CASE WHEN status IN ('pending', 'retry', 'failed') THEN 1 END) > 0
      ORDER BY oldest_pending ASC NULLS LAST
    `;

    const result = await pool.query(sql);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching admin sync queue:', error);
    res.status(500).json({ error: 'Erro ao carregar dados de sincronização' });
  }
}
