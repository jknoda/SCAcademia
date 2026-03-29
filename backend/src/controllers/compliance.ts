import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../lib/audit';
import {
  GenerateComplianceReportOptions,
  generateAndStoreComplianceReport,
  getComplianceReportById,
  listComplianceReports,
} from '../lib/complianceReports';
import {
  getComplianceSchedule,
  upsertComplianceSchedule,
} from '../lib/complianceSchedule';

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const asNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseReportDate = (value?: string, endOfDay: boolean = false): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`)
    : new Date(value);

  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

const parseGenerateOptions = (body: any): GenerateComplianceReportOptions => ({
  format: body?.format === 'excel' || body?.format === 'json' ? body.format : 'pdf',
  periodPreset:
    body?.periodPreset === 'last-3-months' || body?.periodPreset === 'custom'
      ? body.periodPreset
      : 'current-month',
  dateFrom: asString(body?.dateFrom) || undefined,
  dateTo: asString(body?.dateTo) || undefined,
  signDigital: body?.signDigital !== false,
});

/**
 * POST /api/admin/compliance-report/generate
 * Inicia geração assíncrona de relatório de conformidade LGPD
 * AC1: Interface de geração exibe "Gerando relatório... (pode levar 2-3 min)"
 */
export const generateComplianceReportHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;

    // Role check: only Admin can generate compliance reports
    if (requester.role !== 'Admin') {
      return res.status(403).json({ error: 'Acesso negado. Privilégios de administrador necessários' });
    }

    const options = parseGenerateOptions(req.body);

    if (options.periodPreset === 'custom') {
      const fromDate = parseReportDate(options.dateFrom, false);
      const toDate = parseReportDate(options.dateTo, true);

      if (!fromDate || !toDate) {
        return res.status(400).json({ error: 'Período custom requer dateFrom e dateTo válidos' });
      }

      const from = fromDate.getTime();
      const to = toDate.getTime();
      if (from > to) {
        return res.status(400).json({ error: 'dateFrom deve ser menor ou igual a dateTo' });
      }
    }

    // Log audit event for report generation request
    logAudit(
      requester.userId,
      'COMPLIANCE_REPORT_REQUESTED',
      'ComplianceReport',
      requester.academyId,
      requester.academyId,
      req.ip,
      {
        format: options.format,
        periodPreset: options.periodPreset,
        signDigital: options.signDigital,
      }
    );

    const reportRecord = await generateAndStoreComplianceReport({
      academyId: requester.academyId,
      generatedBy: requester.userId,
      trigger: 'manual',
      options,
    });

    const downloadUrl = `/api/admin/compliance-report/download/${reportRecord.id}`;

    return res.status(200).json({
      message: 'Gerando relatório... (pode levar 2-3 min). Relatório já consolidado para download.',
      reportId: reportRecord.id,
      report: reportRecord.reportData,
      format: reportRecord.format,
      periodLabel: reportRecord.periodLabel,
      complianceStatus: reportRecord.complianceStatus,
      isSigned: reportRecord.isSigned,
      downloadUrl,
      fileName: reportRecord.reportData.export.fileName,
      pdfUrl: downloadUrl,
      alerts: reportRecord.reportData.alerts,
    });
  } catch (error) {
    console.error('Error in generateComplianceReportHandler:', error);
    return res.status(500).json({ error: 'Erro ao processar solicitação de relatório' });
  }
};

/**
 * GET /api/admin/compliance-report/status
 * Check status of compliance report generation
 */
export const getComplianceReportStatusHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;

    if (requester.role !== 'Admin') {
      return res.status(403).json({ error: 'Acesso negado. Privilégios de administrador necessários' });
    }

    const reports = await listComplianceReports(requester.academyId);
    const latest = reports[0] || null;

    return res.status(200).json({
      status: latest ? 'completed' : 'idle',
      message: latest
        ? 'Relatório de conformidade disponível para download'
        : 'Nenhum relatório de conformidade gerado ainda',
      latestReport: latest,
    });
  } catch (error) {
    console.error('Error in getComplianceReportStatusHandler:', error);
    return res.status(500).json({ error: 'Erro ao verificar status do relatório' });
  }
};

export const downloadComplianceReportHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Admin') {
      return res.status(403).json({ error: 'Acesso negado. Privilégios de administrador necessários' });
    }

    const reportId = asString(req.params.reportId);
    if (!reportId) {
      return res.status(400).json({ error: 'reportId é obrigatório' });
    }

    const report = await getComplianceReportById(requester.academyId, reportId);
    if (!report || !report.filePath || !fs.existsSync(report.filePath)) {
      return res.status(404).json({ error: 'Relatório não encontrado para download' });
    }

    const contentType = report.reportData.export?.contentType || 'application/octet-stream';
    const fallbackName = path.basename(report.filePath);
    const fileName = report.reportData.export?.fileName || fallbackName;

    res.setHeader('Content-Type', contentType);
    return res.download(report.filePath, fileName);
  } catch (error) {
    console.error('Error in downloadComplianceReportHandler:', error);
    return res.status(500).json({ error: 'Erro ao baixar relatório de conformidade' });
  }
};

export const listComplianceReportHistoryHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Admin') {
      return res.status(403).json({ error: 'Acesso negado. Privilégios de administrador necessários' });
    }

    const reports = await listComplianceReports(requester.academyId);
    return res.status(200).json({ reports });
  } catch (error) {
    console.error('Error in listComplianceReportHistoryHandler:', error);
    return res.status(500).json({ error: 'Erro ao listar histórico de relatórios' });
  }
};

export const getComplianceReportScheduleHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Admin') {
      return res.status(403).json({ error: 'Acesso negado. Privilégios de administrador necessários' });
    }

    const schedule = getComplianceSchedule(requester.academyId);
    return res.status(200).json({ schedule });
  } catch (error) {
    console.error('Error in getComplianceReportScheduleHandler:', error);
    return res.status(500).json({ error: 'Erro ao consultar agendamento de relatórios' });
  }
};

export const upsertComplianceReportScheduleHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Admin') {
      return res.status(403).json({ error: 'Acesso negado. Privilégios de administrador necessários' });
    }

    const dayOfMonth = asNumber(req.body?.dayOfMonth, 1);
    const hour = asNumber(req.body?.hour, 9);
    const minute = asNumber(req.body?.minute, 0);
    const enabled = req.body?.enabled !== false;

    if (dayOfMonth < 1 || dayOfMonth > 28) {
      return res.status(400).json({ error: 'dayOfMonth deve estar entre 1 e 28' });
    }
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return res.status(400).json({ error: 'Horário inválido para o agendamento' });
    }

    const schedule = upsertComplianceSchedule({
      academyId: requester.academyId,
      generatedBy: requester.userId,
      dayOfMonth,
      hour,
      minute,
      enabled,
    });

    logAudit(
      requester.userId,
      'COMPLIANCE_REPORT_SCHEDULED',
      'ComplianceReportSchedule',
      requester.academyId,
      requester.academyId,
      req.ip,
      schedule
    );

    return res.status(200).json({
      message: 'Agendamento de relatório LGPD atualizado com sucesso',
      schedule,
    });
  } catch (error) {
    console.error('Error in upsertComplianceReportScheduleHandler:', error);
    return res.status(500).json({ error: 'Erro ao salvar agendamento de relatórios' });
  }
};
