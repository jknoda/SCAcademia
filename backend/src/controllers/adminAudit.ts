import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { getAuditLogsFiltered, getAuditLogsCsv, logAudit, AuditFilters } from '../lib/audit';

const parsePagination = (query: any): { page: number; limit: number } => {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit as string, 10) || 50));
  return { page, limit };
};

const parseFilters = (query: any): { filters: AuditFilters; error?: string } => {
  const filters: AuditFilters = {};

  if (query.userId && typeof query.userId === 'string') {
    filters.userSearch = query.userId.trim();
  }
  if (query.action && typeof query.action === 'string') {
    filters.action = query.action;
  }
  if (query.resourceType && typeof query.resourceType === 'string') {
    filters.resourceType = query.resourceType;
  }
  if (query.dateFrom && typeof query.dateFrom === 'string') {
    const d = new Date(query.dateFrom);
    if (isNaN(d.getTime())) {
      return { filters, error: 'dateFrom inválida. Use formato ISO 8601.' };
    }
    filters.dateFrom = d;
  }
  if (query.dateTo && typeof query.dateTo === 'string') {
    const d = new Date(query.dateTo);
    if (isNaN(d.getTime())) {
      return { filters, error: 'dateTo inválida. Use formato ISO 8601.' };
    }
    filters.dateTo = d;
  }

  return { filters };
};

const escapeCsvField = (value: string): string =>
  `"${String(value ?? '').replace(/"/g, '""')}"`;

export const getAuditLogsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const { filters, error } = parseFilters(req.query);
    if (error) {
      return res.status(400).json({ error });
    }
    const pagination = parsePagination(req.query);

    const { logs, total } = await getAuditLogsFiltered(academyId, filters, pagination);

    logAudit(req.user!.userId, 'AUDIT_LOG_VIEWED', 'AuditLog', academyId, academyId, req.ip, {
      filters,
      page: pagination.page,
    });

    const totalPages = Math.ceil(total / pagination.limit);

    return res.json({
      logs: logs.map((log) => ({
        logId: log.id,
        actorId: log.userId,
        actorName: log.actorName,
        action: log.action,
        resourceType: log.entity,
        resourceId: log.entityId,
        ipAddress: log.ipAddress,
        timestamp: log.timestamp,
        changesJson: log.details,
      })),
      total,
      page: pagination.page,
      totalPages,
    });
  } catch (error) {
    console.error('Erro ao consultar audit logs:', error);
    return res.status(500).json({ error: 'Erro ao consultar audit logs' });
  }
};

export const exportAuditLogsCsvHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const { filters, error } = parseFilters(req.query);
    if (error) {
      return res.status(400).json({ error });
    }

    const rows = await getAuditLogsCsv(academyId, filters);

    logAudit(req.user!.userId, 'AUDIT_LOG_EXPORTED', 'AuditLog', academyId, academyId, req.ip, {
      filters,
      rowCount: rows.length,
    });

    const headers = ['Data/Hora', 'Usuário', 'ID Usuário', 'Ação', 'Recurso', 'Tipo Recurso', 'IP', 'Detalhes'];
    const csvLines = [
      headers.map(escapeCsvField).join(','),
      ...rows.map((row) =>
        [
          row.timestamp,
          row.actorName,
          row.actorId,
          row.action,
          row.entityId,
          row.entity,
          row.ipAddress,
          row.details,
        ]
          .map(escapeCsvField)
          .join(',')
      ),
    ];

    const csv = csvLines.join('\n');
    const filename = `auditoria-lgpd-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // BOM for Excel PT-BR UTF-8 recognition
    return res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('Erro ao exportar audit logs CSV:', error);
    return res.status(500).json({ error: 'Erro ao exportar audit logs' });
  }
};
