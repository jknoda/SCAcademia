import { pool } from './db';

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  academyId: string;
  timestamp: Date;
  ipAddress?: string;
  details?: Record<string, any>;
}

const isValidUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// Fire-and-forget audit log — writes to audit_logs table asynchronously
export const logAudit = (
  userId: string | undefined,
  action: string,
  entity: string,
  entityId: string,
  academyId: string,
  ipAddress?: string,
  details?: Record<string, any>
): void => {
  const safeAcademyId = isValidUUID(academyId) ? academyId : null;
  const safeUserId = userId && isValidUUID(userId) ? userId : null;
  const safeEntityId = entityId && entityId.trim().length > 0 ? entityId : 'unknown';

  pool
    .query(
      `INSERT INTO audit_logs
         (academy_id, resource_type, resource_id, action, actor_user_id,
          changes_json, ip_address, timestamp, retention_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW() + INTERVAL '7 years')`,
      [
        safeAcademyId,
        entity,
        safeEntityId,
        action,
        safeUserId,
        details ? JSON.stringify(details) : null,
        ipAddress || null,
      ]
    )
    .catch((err: Error) => console.error('[AUDIT ERROR]', err.message));

  console.log(`[AUDIT] ${action} - ${entity} (${entityId}) by ${userId || 'SYSTEM'}`);
};

export const getAuditLogsByAcademy = async (academyId: string): Promise<AuditLog[]> => {
  const res = await pool.query(
    'SELECT * FROM audit_logs WHERE academy_id = $1 ORDER BY timestamp DESC',
    [academyId]
  );
  return res.rows.map((row: any) => ({
    id: String(row.log_id),
    userId: row.actor_user_id,
    action: row.action,
    entity: row.resource_type,
    entityId: row.resource_id,
    academyId: row.academy_id,
    timestamp: row.timestamp,
    ipAddress: row.ip_address,
    details: row.changes_json,
  }));
};

export const getAuditLogsByUser = async (userId: string): Promise<AuditLog[]> => {
  const res = await pool.query(
    'SELECT * FROM audit_logs WHERE actor_user_id = $1 ORDER BY timestamp DESC',
    [userId]
  );
  return res.rows.map((row: any) => ({
    id: String(row.log_id),
    userId: row.actor_user_id,
    action: row.action,
    entity: row.resource_type,
    entityId: row.resource_id,
    academyId: row.academy_id,
    timestamp: row.timestamp,
    ipAddress: row.ip_address,
    details: row.changes_json,
  }));
};
