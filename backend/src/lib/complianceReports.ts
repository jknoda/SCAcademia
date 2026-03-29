import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import PDFDocument from 'pdfkit';
import NodeRSA from 'node-rsa';
import * as XLSX from 'xlsx';
import { pool } from './db';
import { getUserById } from './database';
import {
  ComplianceReportAlert,
  ComplianceReportData,
  ComplianceReportFormat,
  ComplianceReportPeriod,
  ComplianceReportPeriodPreset,
} from '../types';
import { ComplianceReportPeriodRange, generateComplianceReportDataForPeriod } from './complianceReport';

export interface ComplianceReportRecord {
  id: string;
  academyId: string;
  generatedBy: string;
  reportData: ComplianceReportData;
  filePath: string | null;
  signedAt: string | null;
  signatureHash: string | null;
  createdAt: string;
  format: ComplianceReportFormat;
  periodLabel: string;
  complianceStatus: string;
  isSigned: boolean;
}

export interface GenerateComplianceReportOptions {
  format: ComplianceReportFormat;
  periodPreset: ComplianceReportPeriodPreset;
  dateFrom?: string;
  dateTo?: string;
  signDigital: boolean;
}

type GenerateStoredComplianceReportInput = {
  academyId: string;
  generatedBy: string;
  generatedByName?: string;
  trigger: 'manual' | 'scheduled';
  options: GenerateComplianceReportOptions;
};

const CONTENT_TYPES: Record<ComplianceReportFormat, string> = {
  pdf: 'application/pdf',
  json: 'application/json',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const FILE_EXTENSIONS: Record<ComplianceReportFormat, string> = {
  pdf: 'pdf',
  json: 'json',
  excel: 'xlsx',
};

let rsaKey: NodeRSA | null = null;

const rowToComplianceReport = (row: any): ComplianceReportRecord => {
  const reportData = row.report_data as ComplianceReportData;
  const complianceStatus =
    reportData?.complianceStatus === 'NAO_COMPLIANT'
      ? 'Não-Compliant - Ação Requerida'
      : 'COMPLIANT';

  return {
    id: row.id,
    academyId: row.academy_id,
    generatedBy: row.generated_by,
    reportData,
    filePath: row.file_path || null,
    signedAt: row.signed_at ? new Date(row.signed_at).toISOString() : null,
    signatureHash: row.signature_hash || null,
    createdAt: new Date(row.created_at).toISOString(),
    format: reportData?.export?.format || 'pdf',
    periodLabel: reportData?.period?.label || 'Este mês',
    complianceStatus,
    isSigned: Boolean(reportData?.export?.isSigned),
  };
};

const getReportsDirectory = (): string => {
  const dir = path.resolve(process.cwd(), 'storage', 'compliance-reports');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const getRsaKey = (): NodeRSA => {
  if (rsaKey) {
    return rsaKey;
  }

  const privateKey = process.env['COMPLIANCE_REPORT_PRIVATE_KEY'];
  rsaKey = privateKey ? new NodeRSA(privateKey) : new NodeRSA({ b: 2048 });
  rsaKey.setOptions({ signingScheme: 'pkcs1-sha256' });
  return rsaKey;
};

const formatConsentLine = (label: string, approved: number, pending: number): string =>
  `${label}: ${approved} aprovados / ${pending} pendentes`;

const addAlertBlock = (doc: PDFKit.PDFDocument, alert: ComplianceReportAlert): void => {
  const top = doc.y;
  const background = alert.severity === 'high' ? '#fde2e1' : '#fff2cc';
  const titleColor = alert.severity === 'high' ? '#9f1c1c' : '#7c2d12';

  doc.save();
  doc.roundedRect(50, top, 495, 52, 8).fill(background);
  doc.fillColor(titleColor).font('Helvetica-Bold').fontSize(11).text(alert.message, 64, top + 10);
  doc.fillColor('#4b5563').font('Helvetica').fontSize(10).text(alert.recommendation, 64, top + 28);
  doc.restore();
  doc.moveDown(2.8);
};

const normalizeForFileName = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'Academia';

const toPeriodFileTag = (period: ComplianceReportPeriod): string =>
  `${period.dateFrom.slice(0, 10)}_${period.dateTo.slice(0, 10)}`;

const parseReportDate = (value?: string, endOfDay: boolean = false): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`)
    : new Date(value);

  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

const buildFileName = (
  academyTag: string,
  period: ComplianceReportPeriod,
  format: ComplianceReportFormat,
  reportId: string
): string => {
  const periodTag = toPeriodFileTag(period);
  return `LGPD_Compliance_${normalizeForFileName(academyTag)}_${periodTag}_${reportId}.${FILE_EXTENSIONS[format]}`;
};

const resolvePeriod = (options: GenerateComplianceReportOptions): ComplianceReportPeriodRange => {
  const now = new Date();

  if (options.periodPreset === 'custom') {
    const dateFrom = parseReportDate(options.dateFrom, false);
    const dateTo = parseReportDate(options.dateTo, true);
    if (!dateFrom || !dateTo) {
      throw new Error('Período custom inválido. Use formato YYYY-MM-DD.');
    }

    return {
      preset: 'custom',
      label: `${options.dateFrom?.slice(0, 10)} a ${options.dateTo?.slice(0, 10)}`,
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    };
  }

  if (options.periodPreset === 'last-3-months') {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
    return {
      preset: 'last-3-months',
      label: 'Últimos 3 meses',
      dateFrom: start.toISOString(),
      dateTo: now.toISOString(),
    };
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  return {
    preset: 'current-month',
    label: 'Este mês',
    dateFrom: monthStart.toISOString(),
    dateTo: now.toISOString(),
  };
};

const buildCompliancePdf = async (
  filePath: string,
  data: ComplianceReportData,
  signatureHash: string,
  signedAt: string | null,
  signedByName: string,
  isSigned: boolean
): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, info: { Title: 'Relatório de Conformidade LGPD' } });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(24).fillColor('#0b3c5d').text('Relatório de Conformidade LGPD');
    doc.moveDown(0.4);
    doc.fontSize(12).fillColor('#1f2937').text('Seção: Capa');
    doc.fontSize(11).fillColor('#4b5563').text(`Academia: ${data.academyId}`);
    doc.text(`Período consolidado: ${data.period.label} (${data.period.dateFrom.slice(0, 10)} até ${data.period.dateTo.slice(0, 10)})`);
    doc.text(`Gerado em: ${new Date(data.generatedAt).toLocaleString('pt-BR')}`);
    doc.text(`Status executivo: ${data.complianceStatus === 'NAO_COMPLIANT' ? 'Não-Compliant - Ação Requerida' : 'COMPLIANT'}`);
    doc.text(`Integridade (SHA-256): ${signatureHash}`);
    doc.text(
      isSigned
        ? `Assinatura digital RSA-2048: aplicada por ${signedByName} em ${new Date(signedAt as string).toLocaleString('pt-BR')}`
        : 'Assinatura digital: não aplicada (somente hash de integridade)'
    );

    doc.addPage();
    doc.fontSize(16).fillColor('#111827').text('Seção: Resumo Executivo');
    doc.moveDown(0.4);
    doc.fontSize(11).text(`Total de alunos: ${data.statistics.totalStudents}`);
    doc.text(`Consentimentos válidos: ${data.statistics.consentedStudents}`);
    doc.text(`Solicitações de deleção pendentes: ${data.deletions.pendingRequests}`);
    doc.text(`Tentativas indevidas registradas: ${data.audit.unauthorizedAttempts}`);
    doc.moveDown(0.6);

    if (data.alerts.length > 0) {
      doc.fontSize(14).fillColor('#9f1c1c').text('Seções Críticas e Recomendações');
      doc.moveDown(0.4);
      data.alerts.forEach((alert) => addAlertBlock(doc, alert));
    }

    doc.fillColor('#111827').fontSize(14).text('Seção: Consentimentos');
    doc.fontSize(11);
    data.consents.versions.forEach((item) => {
      doc.text(formatConsentLine(item.consentType, item.totalApproved, item.totalPending));
    });
    doc.text(`Total aprovados: ${data.consents.totalConsentApproved}`);
    doc.text(`Total pendentes: ${data.consents.totalConsentPending}`);
    doc.moveDown();

    doc.fontSize(14).text('Seção: Auditoria de Acessos');
    doc.fontSize(11).text(`Acessos no período: ${data.audit.last90DaysAccess}`);
    doc.text(`Tentativas indevidas: ${data.audit.unauthorizedAttempts}`);
    doc.text(
      `Anomalias detectadas: ${data.audit.anomalies.length > 0 ? data.audit.anomalies.join('; ') : 'Nenhuma'}`
    );
    doc.moveDown();

    doc.fontSize(14).text('Seção: Dados Deletados');
    doc.fontSize(11).text(`Solicitações processadas: ${data.deletions.processedRequests}`);
    doc.text(`Solicitações pendentes: ${data.deletions.pendingRequests}`);
    doc.text(`Registros anonimizados/hard delete: ${data.deletions.totalHardDeleted}`);
    doc.moveDown();

    doc.fontSize(14).text('Seção: Segurança Técnica');
    doc.fontSize(11).list([
      'AES-256 para dados sensíveis em repouso',
      'HTTPS/TLS para transporte seguro',
      'Rate limiting em endpoints críticos',
      'Backups encriptados e retenção controlada',
    ]);
    doc.moveDown();

    doc.fontSize(14).text('Seção: Assinatura Legal');
    doc.fontSize(11).text(`Admin responsável: ${signedByName}`);
    doc.text(`Data de assinatura: ${signedAt ? new Date(signedAt).toLocaleString('pt-BR') : 'Não aplicável'}`);
    doc.text(`Tipo de proteção: ${isSigned ? 'RSA-2048 + SHA-256' : 'SHA-256 (integridade)'}`);
    doc.text(`Hash final: ${signatureHash}`);

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });
};

const buildComplianceJson = async (filePath: string, data: ComplianceReportData): Promise<void> => {
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const buildComplianceExcel = async (filePath: string, data: ComplianceReportData): Promise<void> => {
  const workbook = XLSX.utils.book_new();

  const summaryRows = [
    { metrica: 'Status de Conformidade', valor: data.complianceStatus === 'NAO_COMPLIANT' ? 'Não-Compliant - Ação Requerida' : 'COMPLIANT' },
    { metrica: 'Período', valor: data.period.label },
    { metrica: 'Data Inicial', valor: data.period.dateFrom },
    { metrica: 'Data Final', valor: data.period.dateTo },
    { metrica: 'Total de Alunos', valor: data.statistics.totalStudents },
    { metrica: 'Consentimentos Válidos', valor: data.statistics.consentedStudents },
    { metrica: 'Consentimentos Expirados', valor: data.statistics.expiredConsentCount },
    { metrica: 'Tentativas Indevidas', valor: data.audit.unauthorizedAttempts },
  ];

  const consentRows = data.consents.versions.map((item) => ({
    tipo: item.consentType,
    aprovados: item.totalApproved,
    pendentes: item.totalPending,
  }));

  const auditRows = [
    {
      acessosNoPeriodo: data.audit.last90DaysAccess,
      tentativasIndevidas: data.audit.unauthorizedAttempts,
      anomalias: data.audit.anomalies.join(' | ') || 'Nenhuma',
    },
  ];

  const deletionRows = [
    {
      processadas: data.deletions.processedRequests,
      pendentes: data.deletions.pendingRequests,
      hardDeleted: data.deletions.totalHardDeleted,
    },
  ];

  const alertRows = data.alerts.map((alert) => ({
    severidade: alert.severity,
    mensagem: alert.message,
    recomendacao: alert.recommendation,
  }));

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'Resumo');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(consentRows), 'Consentimentos');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(auditRows), 'Auditoria');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(deletionRows), 'Deleções');
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(alertRows.length > 0 ? alertRows : [{ severidade: 'info', mensagem: 'Sem alertas', recomendacao: '-' }]),
    'Alertas'
  );

  XLSX.writeFile(workbook, filePath);
};

const resolveAcademyNameTag = async (academyId: string): Promise<string> => {
  const res = await pool.query(
    `SELECT COALESCE(fantasy_name, name, $2) AS display_name
     FROM academies
     WHERE academy_id = $1::uuid
     LIMIT 1`,
    [academyId, academyId]
  );

  return String(res.rows[0]?.display_name || academyId);
};

const buildReportArtifact = async (
  filePath: string,
  format: ComplianceReportFormat,
  data: ComplianceReportData,
  signatureHash: string,
  signedAt: string | null,
  signer: string,
  isSigned: boolean
): Promise<void> => {
  if (format === 'json') {
    await buildComplianceJson(filePath, data);
    return;
  }

  if (format === 'excel') {
    await buildComplianceExcel(filePath, data);
    return;
  }

  await buildCompliancePdf(filePath, data, signatureHash, signedAt, signer, isSigned);
};

export const generateAndStoreComplianceReport = async (
  input: GenerateStoredComplianceReportInput
): Promise<ComplianceReportRecord> => {
  const period = resolvePeriod(input.options);
  const baseReport = await generateComplianceReportDataForPeriod(input.academyId, period);

  const signer = input.generatedByName || (await getUserById(input.generatedBy))?.fullName || 'Admin';
  const isSigned = input.options.signDigital;
  const signedAt = isSigned ? new Date().toISOString() : null;

  const complianceStatus = baseReport.complianceStatus;
  const reportData: ComplianceReportData = {
    ...baseReport,
    signedBy: isSigned ? signer : undefined,
    signatureDate: isSigned ? signedAt || undefined : undefined,
    export: {
      format: input.options.format,
      fileName: '',
      contentType: CONTENT_TYPES[input.options.format],
      isSigned,
      complianceStatus,
    },
  };

  const rawPayload = JSON.stringify({ ...reportData, trigger: input.trigger, format: input.options.format });
  let signatureHash = '';

  if (isSigned) {
    const rsa = getRsaKey();
    const signature = rsa.sign(Buffer.from(rawPayload), 'base64', 'buffer');
    signatureHash = createHash('sha256').update(signature).digest('hex');
  } else {
    signatureHash = createHash('sha256').update(rawPayload).digest('hex');
  }

  const insertRes = await pool.query(
    `INSERT INTO compliance_reports (
       id,
       academy_id,
       generated_by,
       report_data,
       signed_at,
       signature_hash,
       created_at
     ) VALUES (
       gen_random_uuid(),
       $1,
       $2,
       $3::jsonb,
       $4,
       $5,
       NOW()
     ) RETURNING *`,
    [input.academyId, input.generatedBy, JSON.stringify(reportData), signedAt, signatureHash]
  );

  const inserted = insertRes.rows[0];
  const academyTag = await resolveAcademyNameTag(input.academyId);
  const fileName = buildFileName(academyTag, reportData.period, input.options.format, inserted.id);
  const filePath = path.join(getReportsDirectory(), fileName);

  reportData.export.fileName = fileName;
  reportData.export.complianceStatus = complianceStatus;

  await buildReportArtifact(filePath, input.options.format, reportData, signatureHash, signedAt, signer, isSigned);

  const updateRes = await pool.query(
    `UPDATE compliance_reports
     SET file_path = $2,
         report_data = $3::jsonb
     WHERE id = $1
     RETURNING *`,
    [inserted.id, filePath, JSON.stringify(reportData)]
  );

  return rowToComplianceReport(updateRes.rows[0]);
};

export const getComplianceReportById = async (
  academyId: string,
  reportId: string
): Promise<ComplianceReportRecord | null> => {
  const res = await pool.query(
    `SELECT *
     FROM compliance_reports
     WHERE id = $1 AND academy_id = $2 AND deleted_at IS NULL
     LIMIT 1`,
    [reportId, academyId]
  );
  return res.rows.length > 0 ? rowToComplianceReport(res.rows[0]) : null;
};

export const listComplianceReports = async (academyId: string): Promise<ComplianceReportRecord[]> => {
  const res = await pool.query(
    `SELECT *
     FROM compliance_reports
     WHERE academy_id = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [academyId]
  );
  return res.rows.map(rowToComplianceReport);
};
