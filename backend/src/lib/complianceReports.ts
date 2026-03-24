import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import PDFDocument from 'pdfkit';
import NodeRSA from 'node-rsa';
import { pool } from './db';
import { getUserById } from './database';
import { ComplianceReportAlert, ComplianceReportData } from '../types';
import { generateComplianceReportData } from './complianceReport';

export interface ComplianceReportRecord {
  id: string;
  academyId: string;
  generatedBy: string;
  reportData: ComplianceReportData;
  filePath: string | null;
  signedAt: string | null;
  signatureHash: string | null;
  createdAt: string;
}

type GenerateStoredComplianceReportInput = {
  academyId: string;
  generatedBy: string;
  generatedByName?: string;
  trigger: 'manual' | 'scheduled';
};

let rsaKey: NodeRSA | null = null;

const rowToComplianceReport = (row: any): ComplianceReportRecord => ({
  id: row.id,
  academyId: row.academy_id,
  generatedBy: row.generated_by,
  reportData: row.report_data,
  filePath: row.file_path || null,
  signedAt: row.signed_at ? new Date(row.signed_at).toISOString() : null,
  signatureHash: row.signature_hash || null,
  createdAt: new Date(row.created_at).toISOString(),
});

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
  doc.save();
  doc.roundedRect(50, top, 495, 48, 8).fill('#fde2e1');
  doc.fillColor('#9f1c1c').font('Helvetica-Bold').fontSize(11).text(alert.message, 64, top + 10);
  doc.fillColor('#7c2d12').font('Helvetica').fontSize(10).text(alert.recommendation, 64, top + 26);
  doc.restore();
  doc.moveDown(2.6);
};

const buildCompliancePdf = async (
  reportId: string,
  data: ComplianceReportData,
  signatureHash: string,
  signedAt: string,
  signedByName: string
): Promise<string> => {
  const fileName = `LGPD_Conformidade_SCAcademia_${data.generatedAt.slice(0, 10)}_${reportId}.pdf`;
  const filePath = path.join(getReportsDirectory(), fileName);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, info: { Title: 'Relatório de Conformidade LGPD' } });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(22).fillColor('#0b3c5d').text('Relatório de Conformidade LGPD');
    doc.moveDown(0.4);
    doc.fontSize(11).fillColor('#4b5563').text(`Academia: ${data.academyId}`);
    doc.text(`Gerado em: ${new Date(data.generatedAt).toLocaleString('pt-BR')}`);
    doc.text(`Assinado por: ${signedByName}`);
    doc.text(`Assinatura RSA-2048: ${signatureHash}`);
    doc.text('Documento emitido em modo somente leitura (NFE lógico) para fins de auditoria.');
    doc.moveDown();

    if (data.alerts.length > 0) {
      doc.fontSize(14).fillColor('#9f1c1c').text('Alertas de Conformidade');
      doc.moveDown(0.4);
      data.alerts.forEach((alert) => addAlertBlock(doc, alert));
    }

    doc.fillColor('#111827').fontSize(14).text('1. Estatísticas Gerais');
    doc.fontSize(11).text(`Total de alunos: ${data.statistics.totalStudents}`);
    doc.text(`Menores de idade: ${data.statistics.minorStudents}`);
    doc.text(`Maiores de idade: ${data.statistics.adultStudents}`);
    doc.text(`Alunos com consentimento registrado: ${data.statistics.consentedStudents}`);
    doc.text(`Consentimentos expirados: ${data.statistics.expiredConsentCount}`);
    doc.moveDown();

    doc.fontSize(14).text('2. Consentimentos');
    doc.fontSize(11);
    data.consents.versions.forEach((item) => {
      doc.text(formatConsentLine(item.consentType, item.totalApproved, item.totalPending));
    });
    doc.text(`Total aprovados: ${data.consents.totalConsentApproved}`);
    doc.text(`Total pendentes: ${data.consents.totalConsentPending}`);
    doc.moveDown();

    doc.fontSize(14).text('3. Dados Deletados');
    doc.fontSize(11).text(`Solicitações processadas: ${data.deletions.processedRequests}`);
    doc.text(`Solicitações pendentes: ${data.deletions.pendingRequests}`);
    doc.text(`Registros anonimizados/hard delete: ${data.deletions.totalHardDeleted}`);
    doc.moveDown();

    doc.fontSize(14).text('4. Auditoria de Acesso');
    doc.fontSize(11).text(`Acessos nos últimos 90 dias: ${data.audit.last90DaysAccess}`);
    doc.text(`Tentativas indevidas: ${data.audit.unauthorizedAttempts}`);
    doc.text(
      `Anomalias detectadas: ${data.audit.anomalies.length > 0 ? data.audit.anomalies.join('; ') : 'Nenhuma'}`
    );
    doc.moveDown();

    doc.fontSize(14).text('5. Encriptação & Segurança');
    doc.fontSize(11).list([
      'AES-256 para dados sensíveis em repouso',
      'HTTPS/TLS para transporte seguro',
      'Rate limiting em endpoints críticos',
      'Backups encriptados e retenção controlada',
    ]);
    doc.moveDown();

    doc.fontSize(14).text('6. Assinatura Legal');
    doc.fontSize(11).text(`Admin signatário: ${signedByName}`);
    doc.text(`Data da assinatura: ${new Date(signedAt).toLocaleString('pt-BR')}`);
    doc.text('Algoritmo: RSA-2048 / SHA-256');
    doc.text(`Hash de integridade: ${signatureHash}`);

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });

  return filePath;
};

export const generateAndStoreComplianceReport = async (
  input: GenerateStoredComplianceReportInput
): Promise<ComplianceReportRecord> => {
  const baseReport = await generateComplianceReportData(input.academyId);
  const signer = input.generatedByName || (await getUserById(input.generatedBy))?.fullName || 'Admin';
  const signedAt = new Date().toISOString();

  const reportData: ComplianceReportData = {
    ...baseReport,
    signedBy: signer,
    signatureDate: signedAt,
  };

  const rawPayload = JSON.stringify({ ...reportData, trigger: input.trigger });
  const rsa = getRsaKey();
  const signature = rsa.sign(Buffer.from(rawPayload), 'base64', 'buffer');
  const signatureHash = createHash('sha256').update(signature).digest('hex');

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
  const filePath = await buildCompliancePdf(inserted.id, reportData, signatureHash, signedAt, signer);

  const updateRes = await pool.query(
    `UPDATE compliance_reports
     SET file_path = $2
     WHERE id = $1
     RETURNING *`,
    [inserted.id, filePath]
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
