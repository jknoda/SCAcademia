import { pool } from './db';
import {
  listMinorsWithoutGuardian,
  listStudentsWithoutHealthScreening,
} from './database';
import { listPendingDeletionRequests } from './deletionRequests';
import {
  collectAuditData,
  collectDeletionData,
  collectStatistics,
  generateComplianceAlerts,
} from './complianceReport';
import { listComplianceReports } from './complianceReports';
import {
  AdminDashboardAlert,
  AdminDashboardBackupMetric,
  AdminDashboardHistoryPoint,
  AdminDashboardResponse,
  AdminDashboardStatus,
  AdminDashboardUsersMetric,
} from '../types';

type RecentAuditSignals = {
  logsLast24h: number;
  failedLoginsLastHour: number;
  unauthorizedAttemptsLast24h: number;
  lastAuditAt: string | null;
};

type DailyAuditSignal = {
  day: string;
  failedLogins: number;
  unauthorizedAttempts: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const asInt = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const severityRank: Record<AdminDashboardAlert['severity'], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const getStatusLabel = (status: AdminDashboardStatus): string => {
  switch (status) {
    case 'critical':
      return 'CRITICO';
    case 'attention':
      return 'ATENCAO REQUERIDA';
    default:
      return 'OPERACIONAL';
  }
};

const getHistoryUptime = (status: AdminDashboardStatus): number => {
  switch (status) {
    case 'critical':
      return 98.4;
    case 'attention':
      return 99.2;
    default:
      return 100;
  }
};

const createIsoDayLabel = (date: Date): string =>
  date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });

const safeListPendingDeletionRequests = async (academyId: string) => {
  try {
    return await listPendingDeletionRequests(academyId);
  } catch (error: any) {
    if (error?.code === '42P01') {
      return [];
    }
    throw error;
  }
};

const safeListComplianceReports = async (academyId: string) => {
  try {
    return await listComplianceReports(academyId);
  } catch (error: any) {
    if (error?.code === '42P01') {
      return [];
    }
    throw error;
  }
};

const queryUsersMetric = async (academyId: string): Promise<AdminDashboardUsersMetric> => {
  const res = await pool.query(
    `SELECT
       role,
       COUNT(*) FILTER (WHERE is_active = true AND deleted_at IS NULL) AS active_count,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days' AND deleted_at IS NULL) AS weekly_new_count
     FROM users
     WHERE academy_id = $1
       AND deleted_at IS NULL
     GROUP BY role`,
    [academyId]
  );

  const metric: AdminDashboardUsersMetric = {
    total: 0,
    students: 0,
    professors: 0,
    admins: 0,
    guardians: 0,
    weeklyNewUsers: 0,
  };

  res.rows.forEach((row) => {
    const role = String(row.role || '');
    const activeCount = asInt(row.active_count);
    const weeklyNewCount = asInt(row.weekly_new_count);

    metric.weeklyNewUsers += weeklyNewCount;
    metric.total += activeCount;

    if (role === 'Aluno') metric.students = activeCount;
    if (role === 'Professor') metric.professors = activeCount;
    if (role === 'Admin') metric.admins = activeCount;
    if (role === 'Responsavel') metric.guardians = activeCount;
  });

  return metric;
};

const queryTrainingsMetric = async (academyId: string): Promise<{ total: number; dailyAverage: number }> => {
  try {
    const res = await pool.query(
      `SELECT COUNT(*) AS total
       FROM training_sessions ts
       WHERE ts.academy_id = $1
         AND ts.deleted_at IS NULL
         AND ts.session_date >= date_trunc('month', CURRENT_DATE)::date
         AND ts.session_date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date`,
      [academyId]
    );

    const total = asInt(res.rows[0]?.total);
    const dayOfMonth = Math.max(1, new Date().getDate());
    return {
      total,
      dailyAverage: Number((total / dayOfMonth).toFixed(1)),
    };
  } catch (error: any) {
    if (error?.code === '42P01') {
      return { total: 0, dailyAverage: 0 };
    }
    throw error;
  }
};

const queryRecentAuditSignals = async (academyId: string): Promise<RecentAuditSignals> => {
  const res = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '24 hours') AS logs_last_24h,
       COUNT(*) FILTER (WHERE action = 'LOGIN_FAILED' AND timestamp >= NOW() - INTERVAL '1 hour') AS failed_logins_last_hour,
       COUNT(*) FILTER (
         WHERE timestamp >= NOW() - INTERVAL '24 hours'
           AND (
             action = 'UNAUTHORIZED_ACCESS'
             OR action ILIKE '%forbidden%'
             OR action ILIKE '%denied%'
           )
       ) AS unauthorized_attempts_last_24h,
       MAX(timestamp) AS last_audit_at
     FROM audit_logs
     WHERE academy_id = $1`,
    [academyId]
  );

  return {
    logsLast24h: asInt(res.rows[0]?.logs_last_24h),
    failedLoginsLastHour: asInt(res.rows[0]?.failed_logins_last_hour),
    unauthorizedAttemptsLast24h: asInt(res.rows[0]?.unauthorized_attempts_last_24h),
    lastAuditAt: res.rows[0]?.last_audit_at ? new Date(res.rows[0].last_audit_at).toISOString() : null,
  };
};

const queryDailyAuditSignals = async (academyId: string): Promise<Map<string, DailyAuditSignal>> => {
  const res = await pool.query(
    `SELECT
       date_trunc('day', timestamp)::date::text AS day,
       COUNT(*) FILTER (WHERE action = 'LOGIN_FAILED') AS failed_logins,
       COUNT(*) FILTER (
         WHERE action = 'UNAUTHORIZED_ACCESS'
           OR action ILIKE '%forbidden%'
           OR action ILIKE '%denied%'
       ) AS unauthorized_attempts
     FROM audit_logs
     WHERE academy_id = $1
       AND timestamp >= (CURRENT_DATE - INTERVAL '6 days')
     GROUP BY date_trunc('day', timestamp)
     ORDER BY day ASC`,
    [academyId]
  );

  const map = new Map<string, DailyAuditSignal>();
  res.rows.forEach((row) => {
    map.set(String(row.day), {
      day: String(row.day),
      failedLogins: asInt(row.failed_logins),
      unauthorizedAttempts: asInt(row.unauthorized_attempts),
    });
  });

  return map;
};

const buildBackupMetric = (referenceDate: Date = new Date()): AdminDashboardBackupMetric => {
  const lastKnownBackupAt = new Date(referenceDate);
  lastKnownBackupAt.setUTCHours(2, 30, 0, 0);

  if (lastKnownBackupAt.getTime() > referenceDate.getTime()) {
    lastKnownBackupAt.setUTCDate(lastKnownBackupAt.getUTCDate() - 1);
  }

  const nextScheduledAt = new Date(lastKnownBackupAt);
  nextScheduledAt.setUTCDate(nextScheduledAt.getUTCDate() + 1);

  return {
    status: 'ok',
    statusLabel: 'Backup agendado',
    lastKnownBackupAt: lastKnownBackupAt.toISOString(),
    nextScheduledAt: nextScheduledAt.toISOString(),
    isEstimated: true,
    detail:
      'Resumo inicial baseado na politica operacional diaria de backup as 02:30 UTC, ate a implantacao completa da Story 5.6.',
  };
};

const calculateComplianceScore = (input: {
  totalStudents: number;
  consentedStudents: number;
  expiredConsentCount: number;
  minorsWithoutGuardianCount: number;
  studentsWithoutHealthCount: number;
  pendingDeletionRequestsCount: number;
  failedLoginsLastHour: number;
  unauthorizedAttemptsLast24h: number;
  backupStatus: AdminDashboardBackupMetric['status'];
}): number => {
  // Formula explicita para evitar numeros magicos no dashboard admin:
  // 1. cobertura de consentimentos e a base do score
  // 2. pendencias LGPD e sinais de risco reduzem a nota com teto por categoria
  const consentCoverage = input.totalStudents === 0
    ? 100
    : Math.round((input.consentedStudents / input.totalStudents) * 100);

  const guardianPenalty = Math.min(15, input.minorsWithoutGuardianCount * 5);
  const healthPenalty = Math.min(12, input.studentsWithoutHealthCount * 3);
  const expiredPenalty = Math.min(25, input.expiredConsentCount * 10);
  const deletionPenalty = Math.min(8, input.pendingDeletionRequestsCount * 2);
  const auditPenalty = Math.min(
    15,
    input.unauthorizedAttemptsLast24h * 8 + Math.min(7, input.failedLoginsLastHour * 2)
  );
  const backupPenalty = input.backupStatus === 'ok' ? 0 : 10;

  return clamp(
    consentCoverage - guardianPenalty - healthPenalty - expiredPenalty - deletionPenalty - auditPenalty - backupPenalty,
    0,
    100
  );
};

const buildAlerts = (input: {
  complianceAlerts: Awaited<ReturnType<typeof generateComplianceAlerts>>;
  minorsWithoutGuardianCount: number;
  studentsWithoutHealthCount: number;
  pendingDeletionRequestsCount: number;
  failedLoginsLastHour: number;
  unauthorizedAttemptsLast24h: number;
}): AdminDashboardAlert[] => {
  const alerts: AdminDashboardAlert[] = input.complianceAlerts.map((alert) => ({
    severity: alert.severity,
    category: 'compliance',
    message: alert.message,
    recommendation: alert.recommendation,
    actionLabel: 'Abrir conformidade',
    targetPath: '/admin/compliance-reports',
  }));

  if (input.minorsWithoutGuardianCount > 0) {
    alerts.push({
      severity: 'medium',
      category: 'users',
      message: `${input.minorsWithoutGuardianCount} aluno(s) menor(es) sem responsavel vinculado`,
      recommendation: 'Priorize a vinculacao de responsavel para evitar bloqueios de consentimento.',
      actionLabel: 'Ver alunos',
      targetPath: '/admin/alunos',
      targetFilter: 'minors-without-guardian',
    });
  }

  if (input.studentsWithoutHealthCount > 0) {
    alerts.push({
      severity: 'medium',
      category: 'users',
      message: `${input.studentsWithoutHealthCount} aluno(s) ativo(s) sem anamnese preenchida`,
      recommendation: 'Conclua a anamnese para manter o cadastro operacional e reduzir risco.',
      actionLabel: 'Revisar pendencias',
      targetPath: '/admin/alunos',
      targetFilter: 'students-without-health-screening',
    });
  }

  if (input.pendingDeletionRequestsCount > 0) {
    alerts.push({
      severity: 'low',
      category: 'compliance',
      message: `${input.pendingDeletionRequestsCount} solicitacao(oes) de delecao aguardando janela LGPD`,
      recommendation: 'Monitore as janelas de 30 dias e processe as solicitacoes vencidas.',
      actionLabel: 'Abrir conformidade',
      targetPath: '/admin/compliance-reports',
    });
  }

  if (input.failedLoginsLastHour > 0) {
    alerts.push({
      severity: input.failedLoginsLastHour >= 3 ? 'high' : 'medium',
      category: 'audit',
      message: `${input.failedLoginsLastHour} tentativa(s) de login falhada(s) na ultima hora`,
      recommendation: 'Revise o log de auditoria para confirmar se houve comportamento suspeito.',
      actionLabel: 'Ver logs',
      targetPath: '/admin/audit-logs',
    });
  }

  if (input.unauthorizedAttemptsLast24h > 0) {
    alerts.push({
      severity: 'high',
      category: 'audit',
      message: `${input.unauthorizedAttemptsLast24h} tentativa(s) de acesso nao autorizado nas ultimas 24h`,
      recommendation: 'Audite imediatamente os acessos e confirme se ha necessidade de bloqueio adicional.',
      actionLabel: 'Auditoria completa',
      targetPath: '/admin/audit-logs',
    });
  }

  return alerts.sort((left, right) => severityRank[right.severity] - severityRank[left.severity]);
};

const resolveOverallStatus = (
  complianceScore: number,
  alerts: AdminDashboardAlert[],
  unauthorizedAttemptsLast24h: number
): AdminDashboardStatus => {
  if (unauthorizedAttemptsLast24h > 0) {
    return 'critical';
  }

  if (alerts.some((alert) => alert.severity === 'high') || complianceScore < 97) {
    return 'attention';
  }

  return 'operational';
};

const buildHistory = (
  dailySignals: Map<string, DailyAuditSignal>,
  overallStatus: AdminDashboardStatus
): { history7d: AdminDashboardHistoryPoint[]; uptimeLast7Days: number } => {
  const history7d: AdminDashboardHistoryPoint[] = [];
  const today = new Date();

  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    const signal = dailySignals.get(key);

    let status: AdminDashboardStatus;
    if (offset === 0) {
      status = overallStatus;
    } else if ((signal?.unauthorizedAttempts || 0) > 0) {
      status = 'critical';
    } else if ((signal?.failedLogins || 0) >= 3) {
      status = 'attention';
    } else {
      status = 'operational';
    }

    history7d.push({
      date: key,
      label: createIsoDayLabel(date),
      status,
      uptimePercentage: getHistoryUptime(status),
    });
  }

  const uptimeLast7Days = Number(
    (history7d.reduce((sum, item) => sum + item.uptimePercentage, 0) / history7d.length).toFixed(1)
  );

  return { history7d, uptimeLast7Days };
};

export const getAdminDashboard = async (academyId: string): Promise<AdminDashboardResponse> => {
  const [
    usersMetric,
    statistics,
    deletionData,
    auditData,
    recentAuditSignals,
    dailyAuditSignals,
    trainingsMonth,
    minorsWithoutGuardian,
    studentsWithoutHealthScreening,
    pendingDeletionRequests,
    complianceReports,
  ] = await Promise.all([
    queryUsersMetric(academyId),
    collectStatistics(academyId),
    collectDeletionData(academyId),
    collectAuditData(academyId),
    queryRecentAuditSignals(academyId),
    queryDailyAuditSignals(academyId),
    queryTrainingsMetric(academyId),
    listMinorsWithoutGuardian(academyId),
    listStudentsWithoutHealthScreening(academyId),
    safeListPendingDeletionRequests(academyId),
    safeListComplianceReports(academyId),
  ]);

  const complianceAlerts = await generateComplianceAlerts(statistics, {
    versions: [],
    totalConsentApproved: statistics.consentedStudents,
    totalConsentPending: Math.max(statistics.totalStudents - statistics.consentedStudents, 0),
  }, deletionData);

  const backupMetric = buildBackupMetric();
  const alerts = buildAlerts({
    complianceAlerts,
    minorsWithoutGuardianCount: minorsWithoutGuardian.length,
    studentsWithoutHealthCount: studentsWithoutHealthScreening.length,
    pendingDeletionRequestsCount: pendingDeletionRequests.length,
    failedLoginsLastHour: recentAuditSignals.failedLoginsLastHour,
    unauthorizedAttemptsLast24h: recentAuditSignals.unauthorizedAttemptsLast24h,
  });

  const complianceScore = calculateComplianceScore({
    totalStudents: statistics.totalStudents,
    consentedStudents: statistics.consentedStudents,
    expiredConsentCount: statistics.expiredConsentCount,
    minorsWithoutGuardianCount: minorsWithoutGuardian.length,
    studentsWithoutHealthCount: studentsWithoutHealthScreening.length,
    pendingDeletionRequestsCount: pendingDeletionRequests.length,
    failedLoginsLastHour: recentAuditSignals.failedLoginsLastHour,
    unauthorizedAttemptsLast24h: recentAuditSignals.unauthorizedAttemptsLast24h,
    backupStatus: backupMetric.status,
  });

  const status = resolveOverallStatus(
    complianceScore,
    alerts,
    recentAuditSignals.unauthorizedAttemptsLast24h
  );
  const { history7d, uptimeLast7Days } = buildHistory(dailyAuditSignals, status);
  const latestComplianceReport = complianceReports[0] || null;

  return {
    status,
    statusLabel: getStatusLabel(status),
    title: 'Saude da Academia',
    complianceScore,
    complianceExplanation:
      'Mede conformidade LGPD considerando consentimentos validos, responsaveis vinculados, anamnese pendente, delecoes e sinais de auditoria.',
    lastRefreshAt: new Date().toISOString(),
    lastAuditAt: latestComplianceReport?.createdAt || recentAuditSignals.lastAuditAt,
    metrics: {
      usersActive: usersMetric,
      consents: {
        valid: statistics.consentedStudents,
        total: statistics.totalStudents,
        percentage:
          statistics.totalStudents === 0
            ? 100
            : Math.round((statistics.consentedStudents / statistics.totalStudents) * 100),
        expired: statistics.expiredConsentCount,
      },
      trainingsMonth,
      backup: backupMetric,
    },
    alerts,
    systemStatus: {
      currentStatus: status,
      currentLabel: getStatusLabel(status),
      uptimeLast7Days,
      history7d,
      logsLast24h: Math.max(recentAuditSignals.logsLast24h, auditData.last90DaysAccess > 0 ? recentAuditSignals.logsLast24h : 0),
      failedLoginsLastHour: recentAuditSignals.failedLoginsLastHour,
      unauthorizedAttemptsLast24h: recentAuditSignals.unauthorizedAttemptsLast24h,
    },
  };
};