import { pool } from './db';
import PDFDocument from 'pdfkit';
import NodeRSA from 'node-rsa';
import crypto from 'crypto';

export interface AuditLog {
  id: string;
  userId?: string;
  actorName?: string;
  actorRole?: string;
  action: string;
  entity: string;
  entityId: string;
  academyId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export interface AuditFilters {
  userId?: string;
  userSearch?: string;
  action?: string;
  resourceType?: string;
  outcome?: 'SUCCESS' | 'DENIED';
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AuditCsvRow {
  timestamp: string;
  actorName: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityId: string;
  entity: string;
  outcome: 'SUCCESS' | 'DENIED';
  ipAddress: string;
  userAgent: string;
  details: string;
}

const DENIED_ACTION_SUFFIXES = ['_FAILED', '_DENIED', '_BLOCKED', '_REJECTED', '_UNAUTHORIZED'];

export const inferAuditOutcome = (action: string): 'SUCCESS' | 'DENIED' => {
  const normalized = action.toUpperCase();
  return DENIED_ACTION_SUFFIXES.some((suffix) => normalized.endsWith(suffix))
    ? 'DENIED'
    : 'SUCCESS';
};

const deniedActionsPredicate = (column: string): string => {
  const predicates = DENIED_ACTION_SUFFIXES.map((suffix) => `${column} ILIKE '%${suffix}'`);
  return `(${predicates.join(' OR ')})`;
};

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
  details?: Record<string, any>,
  userAgent?: string
): void => {
  const safeAcademyId = isValidUUID(academyId) ? academyId : null;
  const safeUserId = userId && isValidUUID(userId) ? userId : null;
  const safeEntityId = entityId && entityId.trim().length > 0 ? entityId : 'unknown';

  pool
    .query(
      `INSERT INTO audit_logs
         (academy_id, resource_type, resource_id, action, actor_user_id,
          changes_json, ip_address, user_agent, timestamp, retention_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW() + INTERVAL '7 years')`,
      [
        safeAcademyId,
        entity,
        safeEntityId,
        action,
        safeUserId,
        details ? JSON.stringify(details) : null,
        ipAddress || null,
        userAgent || null,
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
    userAgent: row.user_agent,
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
    userAgent: row.user_agent,
    details: row.changes_json,
  }));
};

const rowToAuditLog = (row: any): AuditLog => ({
  id: String(row.log_id),
  userId: row.actor_user_id,
  actorName: row.actor_name || undefined,
  actorRole: row.actor_role || undefined,
  action: row.action,
  entity: row.resource_type,
  entityId: row.resource_id,
  academyId: row.academy_id,
  timestamp: row.timestamp,
  ipAddress: row.ip_address,
  userAgent: row.user_agent,
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
  if (filters.outcome === 'DENIED') {
    conditions.push(deniedActionsPredicate('al.action'));
  }
  if (filters.outcome === 'SUCCESS') {
    conditions.push(`NOT ${deniedActionsPredicate('al.action')}`);
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
      `SELECT al.*, u.full_name AS actor_name, u.role AS actor_role
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
  if (filters.outcome === 'DENIED') {
    conditions.push(deniedActionsPredicate('al.action'));
  }
  if (filters.outcome === 'SUCCESS') {
    conditions.push(`NOT ${deniedActionsPredicate('al.action')}`);
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
    `SELECT al.*, u.full_name AS actor_name, u.role AS actor_role
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
    actorRole: row.actor_role || '',
    action: row.action,
    entityId: row.resource_id,
    entity: row.resource_type,
    outcome: inferAuditOutcome(row.action),
    ipAddress: row.ip_address || '',
    userAgent: row.user_agent || '',
    details: row.changes_json ? JSON.stringify(row.changes_json) : '',
  }));
};

export const getAuditAnomalyLogIds = async (
  academyId: string,
  pageLogIds: string[]
): Promise<Set<string>> => {
  if (pageLogIds.length === 0) {
    return new Set();
  }

  const numericLogIds = pageLogIds
    .map((logId) => Number.parseInt(logId, 10))
    .filter((logId) => Number.isFinite(logId));

  if (numericLogIds.length === 0) {
    return new Set();
  }

  const res = await pool.query(
    `WITH grouped AS (
       SELECT
         array_agg(al.log_id) AS log_ids
       FROM audit_logs al
       WHERE al.academy_id = $1
         AND al.log_id = ANY($2::bigint[])
         AND (al.action ILIKE '%DELETE%' OR al.action ILIKE '%EXPORT%')
       GROUP BY
         COALESCE(al.actor_user_id::text, ''),
         COALESCE(al.ip_address, ''),
         date_trunc('minute', al.timestamp)
       HAVING COUNT(*) >= 10
     )
     SELECT DISTINCT unnest(log_ids)::text AS log_id
     FROM grouped`,
    [academyId, numericLogIds]
  );

  return new Set(res.rows.map((row: { log_id: string }) => row.log_id));
};

export const getAuditLogsPdfBuffer = async (
  academyId: string,
  academyName: string,
  filters: AuditFilters
): Promise<Buffer> => {
  const rows = await getAuditLogsCsv(academyId, filters);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err: Error) => reject(err));

    doc.fontSize(16).text('Auditoria LGPD - Timeline de Acessos', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(10).text(`Academia: ${academyName}`);
    doc.text(`Periodo: ${filters.dateFrom?.toISOString() || 'inicio'} ate ${filters.dateTo?.toISOString() || 'agora'}`);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
    doc.moveDown(0.6);

    doc.fontSize(9).text('Data/Hora | Usuario | Perfil | Acao | Recurso | Resultado | IP | Navegador');
    doc.moveDown(0.2);

    for (const row of rows) {
      const browser = row.userAgent ? row.userAgent.slice(0, 60) : '-';
      const line = [
        row.timestamp,
        row.actorName || '-',
        row.actorRole || '-',
        row.action,
        row.entity,
        row.outcome,
        row.ipAddress || '-',
        browser,
      ].join(' | ');

      doc.text(line, { width: 520 });
      doc.moveDown(0.15);
    }

    const payloadHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(rows))
      .digest('hex');

    const signer = new NodeRSA({ b: 2048 });
    signer.setOptions({ signingScheme: 'pkcs1-sha256' });
    const signature = signer.sign(Buffer.from(payloadHash, 'utf8'), 'base64').slice(0, 64);

    doc.moveDown(0.8);
    doc.text(`Hash SHA-256: ${payloadHash}`);
    doc.text(`Assinatura RSA-2048 (resumo): ${signature}...`);
    doc.text('Versao: SCAcademia Audit Export v1');

    doc.end();
  });
};
