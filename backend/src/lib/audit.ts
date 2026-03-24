import { pool } from './db';

export interface AuditLog {
  id: string;
  userId?: string;
  actorName?: string;
  action: string;
  entity: string;
  entityId: string;
  academyId: string;
  timestamp: Date;
  ipAddress?: string;
  details?: Record<string, any>;
}

export interface AuditFilters {
  userId?: string;
  userSearch?: string;
  action?: string;
  resourceType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AuditCsvRow {
  timestamp: string;
  actorName: string;
  actorId: string;
  action: string;
  entityId: string;
  entity: string;
  ipAddress: string;
  details: string;
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

const rowToAuditLog = (row: any): AuditLog => ({
  id: String(row.log_id),
  userId: row.actor_user_id,
  actorName: row.actor_name || undefined,
  action: row.action,
  entity: row.resource_type,
  entityId: row.resource_id,
  academyId: row.academy_id,
  timestamp: row.timestamp,
  ipAddress: row.ip_address,
  details: row.changes_json,
});

export const getAuditLogsFiltered = async (
  academyId: string,
  filters: AuditFilters,
  pagination: { page: number; limit: number }
): Promise<{ logs: AuditLog[]; total: number }> => {
  const conditions: string[] = ['al.academy_id = $1'];
  const params: any[] = [academyId];
  let paramIdx = 2;

  if (filters.userId) {
    conditions.push(`al.actor_user_id = $${paramIdx++}`);
    params.push(filters.userId);
  }
  if (filters.userSearch) {
    if (isValidUUID(filters.userSearch)) {
      conditions.push(`(al.actor_user_id = $${paramIdx} OR u.full_name ILIKE $${paramIdx + 1})`);
      params.push(filters.userSearch, `%${filters.userSearch}%`);
      paramIdx += 2;
    } else {
      conditions.push(`u.full_name ILIKE $${paramIdx++}`);
      params.push(`%${filters.userSearch}%`);
    }
  }
  if (filters.action) {
    conditions.push(`al.action = $${paramIdx++}`);
    params.push(filters.action);
  }
  if (filters.resourceType) {
    conditions.push(`al.resource_type = $${paramIdx++}`);
    params.push(filters.resourceType);
  }
  if (filters.dateFrom) {
    conditions.push(`al.timestamp >= $${paramIdx++}`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push(`al.timestamp <= $${paramIdx++}`);
    params.push(filters.dateTo);
  }

  const where = conditions.join(' AND ');
  const offset = (pagination.page - 1) * pagination.limit;
  const fromClause = 'FROM audit_logs al LEFT JOIN users u ON u.user_id = al.actor_user_id';

  const [dataRes, countRes] = await Promise.all([
    pool.query(
      `SELECT al.*, u.full_name AS actor_name
       ${fromClause}
       WHERE ${where}
       ORDER BY al.timestamp DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, pagination.limit, offset]
    ),
    pool.query(`SELECT COUNT(*) ${fromClause} WHERE ${where}`, params),
  ]);

  const total = parseInt(countRes.rows[0].count, 10);
  return { logs: dataRes.rows.map(rowToAuditLog), total };
};

export const getAuditLogsCsv = async (
  academyId: string,
  filters: AuditFilters
): Promise<AuditCsvRow[]> => {
  const conditions: string[] = ['al.academy_id = $1'];
  const params: any[] = [academyId];
  let paramIdx = 2;

  if (filters.userId) {
    conditions.push(`al.actor_user_id = $${paramIdx++}`);
    params.push(filters.userId);
  }
  if (filters.userSearch) {
    if (isValidUUID(filters.userSearch)) {
      conditions.push(`(al.actor_user_id = $${paramIdx} OR u.full_name ILIKE $${paramIdx + 1})`);
      params.push(filters.userSearch, `%${filters.userSearch}%`);
      paramIdx += 2;
    } else {
      conditions.push(`u.full_name ILIKE $${paramIdx++}`);
      params.push(`%${filters.userSearch}%`);
    }
  }
  if (filters.action) {
    conditions.push(`al.action = $${paramIdx++}`);
    params.push(filters.action);
  }
  if (filters.resourceType) {
    conditions.push(`al.resource_type = $${paramIdx++}`);
    params.push(filters.resourceType);
  }
  if (filters.dateFrom) {
    conditions.push(`al.timestamp >= $${paramIdx++}`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push(`al.timestamp <= $${paramIdx++}`);
    params.push(filters.dateTo);
  }

  const where = conditions.join(' AND ');

  const res = await pool.query(
    `SELECT al.*, u.full_name AS actor_name
     FROM audit_logs al
     LEFT JOIN users u ON u.user_id = al.actor_user_id
     WHERE ${where}
     ORDER BY al.timestamp DESC
     LIMIT 10000`,
    params
  );

  return res.rows.map((row: any): AuditCsvRow => ({
    timestamp: new Date(row.timestamp).toLocaleString('pt-BR'),
    actorName: row.actor_name || '',
    actorId: row.actor_user_id || '',
    action: row.action,
    entityId: row.resource_id,
    entity: row.resource_type,
    ipAddress: row.ip_address || '',
    details: row.changes_json ? JSON.stringify(row.changes_json) : '',
  }));
};
