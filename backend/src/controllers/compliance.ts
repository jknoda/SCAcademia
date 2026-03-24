import fs from 'fs';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../lib/audit';
import {
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

    // Log audit event for report generation request
    logAudit(
      requester.userId,
      'COMPLIANCE_REPORT_REQUESTED',
      'ComplianceReport',
      requester.academyId,
      requester.academyId,
      req.ip
    );

    const reportRecord = await generateAndStoreComplianceReport({
      academyId: requester.academyId,
      generatedBy: requester.userId,
      trigger: 'manual',
    });

    return res.status(200).json({
      message: 'Gerando relatório... (pode levar 2-3 min). Relatório já consolidado para download.',
      reportId: reportRecord.id,
      report: reportRecord.reportData,
      pdfUrl: `/api/admin/compliance-report/download/${reportRecord.id}`,
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

    return res.download(report.filePath);
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
