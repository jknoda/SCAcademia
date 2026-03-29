import { pool } from './db';
import {
  ComplianceReportData,
  ComplianceReportPeriod,
  ComplianceReportStatistics,
  ComplianceReportConsentSection,
  ComplianceReportDeletionSection,
  ComplianceReportAuditSection,
  ComplianceReportAlert,
} from '../types';

export interface ComplianceReportPeriodRange {
  dateFrom: string;
  dateTo: string;
  label: string;
  preset: ComplianceReportPeriod['preset'];
}

const withPeriodBounds = (
  baseQuery: string,
  baseValues: any[],
  period: ComplianceReportPeriodRange | undefined,
  dateColumn: string
): { query: string; values: any[] } => {
  if (!period) {
    return { query: baseQuery, values: baseValues };
  }

  const values = [...baseValues, period.dateFrom, period.dateTo];
  const fromParam = `$${baseValues.length + 1}`;
  const toParam = `$${baseValues.length + 2}`;
  return {
    query: `${baseQuery}\n        AND ${dateColumn} >= ${fromParam}::timestamptz\n        AND ${dateColumn} <= ${toParam}::timestamptz`,
    values,
  };
};

/**
 * Collect statistics for compliance report (AC2 - Statistics Section)
 */
export async function collectStatistics(
  academyId: string,
  period?: ComplianceReportPeriodRange
): Promise<ComplianceReportStatistics> {
  try {
    const studentsQuery = withPeriodBounds(
      `
      SELECT
        COUNT(*) AS total_students,
        SUM(CASE WHEN is_minor = true THEN 1 ELSE 0 END) AS minor_students,
        SUM(CASE WHEN is_minor = false THEN 1 ELSE 0 END) AS adult_students
      FROM users
      WHERE academy_id = $1 AND role = $2 AND deleted_at IS NULL
      `,
      [academyId, 'Aluno'],
      period,
      'created_at'
    );
    const result = await pool.query(studentsQuery.query, studentsQuery.values);

    const row = result.rows[0] || {};

    // Count expired consents
    const expiredQuery = withPeriodBounds(
      `
      SELECT COUNT(DISTINCT user_id) AS expired_count,
             COUNT(DISTINCT CASE WHEN status = 'accepted' THEN user_id END) AS consented_students
      FROM consents
      WHERE academy_id = $1 
        AND expires_at < NOW()
        AND status IN ('accepted', 'expired')
      `,
      [academyId],
      period,
      'created_at'
    );
    const consentResult = await pool.query(expiredQuery.query, expiredQuery.values);

    const activeQuery = withPeriodBounds(
      `
      SELECT COUNT(DISTINCT user_id) AS consented_students
      FROM consents
      WHERE academy_id = $1
        AND status = 'accepted'
      `,
      [academyId],
      period,
      'created_at'
    );
    const activeConsentResult = await pool.query(activeQuery.query, activeQuery.values);

    return {
      totalStudents: parseInt(row.total_students || '0'),
      minorStudents: parseInt(row.minor_students || '0'),
      adultStudents: parseInt(row.adult_students || '0'),
      consentedStudents: parseInt(activeConsentResult.rows[0]?.consented_students || '0'),
      expiredConsentCount: parseInt(consentResult.rows[0].expired_count || '0'),
    };
  } catch (error) {
    console.error('Error collecting statistics:', error);
    throw error;
  }
}

/**
 * Collect consents data for compliance report (AC2 - Consents Section)
 */
export async function collectConsentData(
  academyId: string,
  period?: ComplianceReportPeriodRange
): Promise<ComplianceReportConsentSection> {
  try {
    let query = `
      SELECT
        consent_type,
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status IN ('pending', 'expired') THEN 1 ELSE 0 END) AS pending
      FROM consents
      WHERE academy_id = $1
    `;
    const values: any[] = [academyId];

    if (period) {
      values.push(period.dateFrom, period.dateTo);
      query += `
        AND created_at >= $2::timestamptz
        AND created_at <= $3::timestamptz
      `;
    }

    query += ` GROUP BY consent_type`;

    const result = await pool.query(query, values);

    const versions = result.rows.map((row: any) => ({
      consentType: (
        row.consent_type === 'health'
          ? 'Saúde'
          : row.consent_type === 'ethics'
            ? 'Ética'
            : 'Privacidade'
      ) as 'Saúde' | 'Ética' | 'Privacidade',
      totalApproved: parseInt(row.approved || '0'),
      totalPending: parseInt(row.pending || '0'),
    }));

    const totalApproved = versions.reduce((sum: number, v: any) => sum + v.totalApproved, 0);
    const totalPending = versions.reduce((sum: number, v: any) => sum + v.totalPending, 0);

    return {
      versions,
      totalConsentApproved: totalApproved,
      totalConsentPending: totalPending,
    };
  } catch (error) {
    console.error('Error collecting consent data:', error);
    throw error;
  }
}

/**
 * Collect deletion data for compliance report (AC2 - Deletions Section)
 */
export async function collectDeletionData(
  academyId: string,
  period?: ComplianceReportPeriodRange
): Promise<ComplianceReportDeletionSection> {
  try {
    const deletionQuery = withPeriodBounds(
      `
      SELECT
        COUNT(*) AS total_requests,
        SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) AS processed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
      FROM deletion_requests
      WHERE academy_id = $1
      `,
      [academyId],
      period,
      'requested_at'
    );
    const result = await pool.query(deletionQuery.query, deletionQuery.values).catch((error: any) => {
      if (error?.code === '42P01') {
        return { rows: [{ total_requests: '0', processed: '0', pending: '0' }] };
      }
      throw error;
    });

    const row = result.rows[0] || {};

    // Count hard-deleted users
    const deletedQuery = withPeriodBounds(
      `
      SELECT COUNT(*) AS hard_deleted_count
      FROM users
      WHERE academy_id = $1 AND deleted_at IS NOT NULL
      `,
      [academyId],
      period,
      'deleted_at'
    );
    const deletedResult = await pool.query(deletedQuery.query, deletedQuery.values);

    return {
      processedRequests: parseInt(row.processed || '0'),
      pendingRequests: parseInt(row.pending || '0'),
      totalHardDeleted: parseInt(deletedResult.rows[0].hard_deleted_count || '0'),
    };
  } catch (error) {
    console.error('Error collecting deletion data:', error);
    throw error;
  }
}

/**
 * Collect audit data for compliance report (AC2 - Audit Section)
 */
export async function collectAuditData(
  academyId: string,
  period?: ComplianceReportPeriodRange
): Promise<ComplianceReportAuditSection> {
  try {
    const accessQuery = withPeriodBounds(
      `
      SELECT COUNT(*) AS total_access
      FROM audit_logs
      WHERE academy_id = $1
      `,
      [academyId],
      period,
      'timestamp'
    );
    const accessResult = await pool.query(accessQuery.query, accessQuery.values);

    const unauthorizedQuery = withPeriodBounds(
      `
      SELECT COUNT(*) AS unauthorized_attempts
      FROM audit_logs
      WHERE academy_id = $1
        AND (action = 'UNAUTHORIZED_ACCESS' OR action LIKE '%forbidden%')
      `,
      [academyId],
      period,
      'timestamp'
    );
    const unauthorizedResult = await pool.query(unauthorizedQuery.query, unauthorizedQuery.values);

    const anomalies: string[] = [];

    // Detect potential anomalies (example: multiple failed logins)
    const failedLoginsQuery = withPeriodBounds(
      `
      SELECT COUNT(*) AS failed_logins
      FROM audit_logs
      WHERE academy_id = $1
        AND action = 'LOGIN_FAILED'
      `,
      [academyId],
      period,
      'timestamp'
    );
    const failedLoginsResult = await pool.query(failedLoginsQuery.query, failedLoginsQuery.values);

    if (parseInt(failedLoginsResult.rows[0]?.failed_logins || '0') > 50) {
      anomalies.push('Alta taxa de falhas de login detectada nos últimos 7 dias');
    }

    return {
      last90DaysAccess: parseInt(accessResult.rows[0].total_access || '0'),
      unauthorizedAttempts: parseInt(unauthorizedResult.rows[0].unauthorized_attempts || '0'),
      anomalies,
    };
  } catch (error) {
    console.error('Error collecting audit data:', error);
    throw error;
  }
}

/**
 * Generate compliance alerts (AC4 - Alerts)
 */
export async function generateComplianceAlerts(
  stats: ComplianceReportStatistics,
  consents: ComplianceReportConsentSection,
  deletions: ComplianceReportDeletionSection
): Promise<ComplianceReportAlert[]> {
  const alerts: ComplianceReportAlert[] = [];

  // Check for expired consents
  if (stats.expiredConsentCount > 0) {
    alerts.push({
      severity: 'high',
      message: `⚠️ ALERTA: ${stats.expiredConsentCount} alunos com consentimento expirado`,
      recommendation: 'Contate responsáveis para renovar consentimentos expirados imediatamente',
    });
  }

  // Check for pending consents
  if (consents.totalConsentPending > 0) {
    alerts.push({
      severity: 'medium',
      message: `⚠️ AVISO: ${consents.totalConsentPending} consentimentos pendentes`,
      recommendation: 'Envie lembretes aos responsáveis para completar consentimento',
    });
  }

  // Check for pending deletion requests
  if (deletions.pendingRequests > 0) {
    alerts.push({
      severity: 'medium',
      message: `⚠️ AVISO: ${deletions.pendingRequests} solicitações de deleção pendentes`,
      recommendation: 'Processe solicitações de deleção conforme prazos da LGPD (graça é 30 dias)',
    });
  }

  return alerts;
}

/**
 * Generate complete compliance report data (AC1, AC2)
 */
export async function generateComplianceReportData(academyId: string): Promise<ComplianceReportData> {
  return generateComplianceReportDataForPeriod(academyId, {
    preset: 'current-month',
    label: 'Este mês',
    dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0, 0).toISOString(),
    dateTo: new Date().toISOString(),
  });
}

export async function generateComplianceReportDataForPeriod(
  academyId: string,
  period: ComplianceReportPeriodRange
): Promise<ComplianceReportData> {
  try {
    const statistics = await collectStatistics(academyId, period);
    const consents = await collectConsentData(academyId, period);
    const deletions = await collectDeletionData(academyId, period);
    const audit = await collectAuditData(academyId, period);
    const alerts = await generateComplianceAlerts(statistics, consents, deletions);
    const complianceStatus = alerts.length > 0 ? 'NAO_COMPLIANT' : 'COMPLIANT';

    return {
      generatedAt: new Date().toISOString(),
      academyId,
      version: '1.0.0',
      period: {
        preset: period.preset,
        label: period.label,
        dateFrom: period.dateFrom,
        dateTo: period.dateTo,
      },
      statistics,
      consents,
      deletions,
      audit,
      alerts,
      complianceStatus,
      export: {
        format: 'pdf',
        fileName: '',
        contentType: 'application/pdf',
        isSigned: true,
        complianceStatus,
      },
    };
  } catch (error) {
    console.error('Error generating compliance report data:', error);
    throw error;
  }
}
