import fs from 'fs';
import path from 'path';
import { pool } from './db';
import {
  AdminAlertActionType,
  AdminAlertCountResponse,
  AdminAlertFeedResponse,
  AdminAlertItem,
  AdminAlertPreferences,
} from '../types';
import { blockIpForAcademy, findFirstIpv4 } from './securityBlocklist';

type AlertSeverityDb = 'info' | 'warning' | 'critical';
type AlertTypeDb = 'system' | 'compliance' | 'performance' | 'security';
type AlertStatusDb = 'active' | 'acknowledged' | 'resolved';

type AlertPreferencesStorage = {
  academyId: string;
  channels: {
    inApp: boolean;
    push: boolean;
    email: boolean;
  };
  severity: {
    critical: boolean;
    preventive: boolean;
    informative: boolean;
  };
  digestWindowMinutes: number;
  silencedUntil: string | null;
  updatedAt: string;
};

const STORAGE_PATH = path.resolve(process.cwd(), 'storage', 'admin-alert-preferences.json');

const isMissingSchemaError = (error: any): boolean => {
  const code = String(error?.code || '');
  return code === '42P01' || code === '42703';
};

const ensureStorage = (): void => {
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(STORAGE_PATH)) {
    fs.writeFileSync(STORAGE_PATH, '[]', 'utf-8');
  }
};

const loadPreferencesStorage = (): AlertPreferencesStorage[] => {
  ensureStorage();
  return JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf-8')) as AlertPreferencesStorage[];
};

const savePreferencesStorage = (items: AlertPreferencesStorage[]): void => {
  ensureStorage();
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(items, null, 2), 'utf-8');
};

const defaultPreferences = (academyId: string): AdminAlertPreferences => ({
  academyId,
  channels: {
    inApp: true,
    push: true,
    email: true,
  },
  severity: {
    critical: true,
    preventive: true,
    informative: true,
  },
  digestWindowMinutes: 60,
  silencedUntil: null,
  updatedAt: new Date().toISOString(),
});

const toDbSeverity = (severity: AdminAlertItem['severity']): AlertSeverityDb => {
  switch (severity) {
    case 'high':
      return 'critical';
    case 'medium':
      return 'warning';
    default:
      return 'info';
  }
};

const fromDbSeverity = (severity: AlertSeverityDb): AdminAlertItem['severity'] => {
  switch (severity) {
    case 'critical':
      return 'high';
    case 'warning':
      return 'medium';
    default:
      return 'low';
  }
};

const fromDbCategory = (alertType: AlertTypeDb): AdminAlertItem['category'] => {
  switch (alertType) {
    case 'security':
      return 'audit';
    case 'compliance':
      return 'compliance';
    case 'performance':
      return 'operations';
    default:
      return 'backup';
  }
};

const toStatus = (status: AlertStatusDb): AdminAlertItem['status'] => {
  if (status === 'acknowledged') {
    return 'acknowledged';
  }
  if (status === 'resolved') {
    return 'resolved';
  }
  return 'active';
};

const buildAvailableActions = (status: AlertStatusDb): AdminAlertActionType[] => {
  if (status === 'resolved') {
    return [];
  }

  if (status === 'acknowledged') {
    return ['resolve', 'ignore'];
  }

  return ['acknowledge', 'resolve', 'ignore', 'block-ip'];
};

const isSilenced = (silencedUntil: string | null): boolean => {
  if (!silencedUntil) {
    return false;
  }
  return new Date(silencedUntil).getTime() > Date.now();
};

const bitmaskChannels = (prefs: AdminAlertPreferences): number => {
  let channels = 0;
  if (prefs.channels.inApp) channels += 1;
  if (prefs.channels.push) channels += 2;
  if (prefs.channels.email) channels += 4;
  return channels;
};

const shouldDispatchBySeverity = (
  preferences: AdminAlertPreferences,
  severity: AdminAlertItem['severity']
): boolean => {
  if (severity === 'high') {
    return preferences.severity.critical;
  }

  if (severity === 'medium') {
    return preferences.severity.preventive;
  }

  return preferences.severity.informative;
};

const ensureAlertsBootstrap = async (academyId: string): Promise<void> => {
  try {
    const failedLoginsRes = await pool.query(
      `SELECT COALESCE(ip_address, 'desconhecido') AS ip_address, COUNT(*)::int AS attempts
       FROM audit_logs
       WHERE academy_id = $1
         AND action = 'LOGIN_FAILED'
         AND timestamp >= NOW() - INTERVAL '1 hour'
       GROUP BY COALESCE(ip_address, 'desconhecido')
       HAVING COUNT(*) >= 5
       ORDER BY attempts DESC
       LIMIT 1`,
      [academyId]
    );

    if (failedLoginsRes.rowCount && failedLoginsRes.rows[0]) {
      const row = failedLoginsRes.rows[0];
      const attempts = Number(row.attempts || 0);
      const ipAddress = String(row.ip_address || 'desconhecido');
      await createAlertIfNotRecent({
        academyId,
        severity: 'high',
        alertType: 'security',
        title: 'ALERTA DE SEGURANCA',
        description: `Detectadas ${attempts} tentativas de login negado na ultima hora para o IP ${ipAddress}.`,
        dedupeWindowMinutes: 30,
      });
    }

    const expiringConsentRes = await pool.query(
      `SELECT COUNT(*)::int AS expiring_count
       FROM consents
       WHERE academy_id = $1
         AND status = 'accepted'
         AND expires_at IS NOT NULL
         AND expires_at >= NOW()
         AND expires_at < NOW() + INTERVAL '7 days'`,
      [academyId]
    );

    const expiringCount = Number(expiringConsentRes.rows[0]?.expiring_count || 0);
    if (expiringCount > 0) {
      await createAlertIfNotRecent({
        academyId,
        severity: 'medium',
        alertType: 'compliance',
        title: 'Consentimento proximo do vencimento',
        description: `${expiringCount} consentimento(s) vencem nos proximos 7 dias. Priorize contato com responsaveis.`,
        dedupeWindowMinutes: 720,
      });
    }

    const backupFailureRes = await pool.query(
      `SELECT COUNT(*)::int AS failure_count
       FROM system_health
       WHERE academy_id = $1
         AND component IN ('storage', 'database')
         AND status = 'red'
         AND timestamp >= NOW() - INTERVAL '24 hours'`,
      [academyId]
    );

    const backupFailureCount = Number(backupFailureRes.rows[0]?.failure_count || 0);
    if (backupFailureCount > 0) {
      await createAlertIfNotRecent({
        academyId,
        severity: 'high',
        alertType: 'system',
        title: 'Falha de backup detectada',
        description: 'Sistema detectou falha recente de backup. Execute retry imediato e acione suporte se persistir.',
        dedupeWindowMinutes: 60,
      });
    }
  } catch (error: any) {
    if (isMissingSchemaError(error)) {
      return;
    }
    throw error;
  }
};

const createAlertIfNotRecent = async (input: {
  academyId: string;
  severity: AdminAlertItem['severity'];
  alertType: AlertTypeDb;
  title: string;
  description: string;
  dedupeWindowMinutes: number;
}): Promise<void> => {
  const duplicateRes = await pool.query(
    `SELECT alert_id
     FROM alerts
     WHERE academy_id = $1
       AND title = $2
       AND alert_type = $3
       AND created_at >= NOW() - ($4::text || ' minutes')::interval
       AND status IN ('active', 'acknowledged')
     LIMIT 1`,
    [input.academyId, input.title, input.alertType, String(input.dedupeWindowMinutes)]
  );

  if (duplicateRes.rowCount) {
    return;
  }

  await pool.query(
    `INSERT INTO alerts (academy_id, severity, title, description, alert_type, status)
     VALUES ($1, $2, $3, $4, $5, 'active')
     RETURNING alert_id, severity`,
    [input.academyId, toDbSeverity(input.severity), input.title, input.description, input.alertType]
  );

  const preferences = getAdminAlertPreferences(input.academyId);
  if (isSilenced(preferences.silencedUntil)) {
    return;
  }

  if (!shouldDispatchBySeverity(preferences, input.severity)) {
    return;
  }

  const channels = bitmaskChannels(preferences);
  if (channels === 0) {
    return;
  }

  try {
    const adminsRes = await pool.query(
      `SELECT user_id
       FROM users
       WHERE academy_id = $1
         AND role = 'Admin'
         AND is_active = true
         AND deleted_at IS NULL`,
      [input.academyId]
    );

    if (!adminsRes.rowCount) {
      return;
    }

    await Promise.all(
      adminsRes.rows.map((row) =>
        pool.query(
          `INSERT INTO notifications (user_id, academy_id, type, title, message, channels, status, sent_at)
           VALUES ($1, $2, 'alert_system', $3, $4, $5, 'sent', NOW())`,
          [String(row.user_id), input.academyId, input.title, input.description, channels]
        )
      )
    );
  } catch (error: any) {
    if (isMissingSchemaError(error)) {
      return;
    }
    throw error;
  }
};

export const getAdminAlertPreferences = (academyId: string): AdminAlertPreferences => {
  const items = loadPreferencesStorage();
  const found = items.find((item) => item.academyId === academyId);

  if (found) {
    return {
      academyId: found.academyId,
      channels: found.channels,
      severity: found.severity,
      digestWindowMinutes: found.digestWindowMinutes,
      silencedUntil: found.silencedUntil,
      updatedAt: found.updatedAt,
    };
  }

  const defaults = defaultPreferences(academyId);
  items.push({
    academyId,
    channels: defaults.channels,
    severity: defaults.severity,
    digestWindowMinutes: defaults.digestWindowMinutes,
    silencedUntil: defaults.silencedUntil,
    updatedAt: defaults.updatedAt,
  });
  savePreferencesStorage(items);
  return defaults;
};

export const updateAdminAlertPreferences = (input: {
  academyId: string;
  channels: AdminAlertPreferences['channels'];
  severity: AdminAlertPreferences['severity'];
  digestWindowMinutes: number;
}): AdminAlertPreferences => {
  const items = loadPreferencesStorage();
  const next: AlertPreferencesStorage = {
    academyId: input.academyId,
    channels: input.channels,
    severity: input.severity,
    digestWindowMinutes: Math.max(5, Math.min(1440, Math.floor(input.digestWindowMinutes || 60))),
    silencedUntil: getAdminAlertPreferences(input.academyId).silencedUntil,
    updatedAt: new Date().toISOString(),
  };

  const index = items.findIndex((item) => item.academyId === input.academyId);
  if (index >= 0) {
    items[index] = next;
  } else {
    items.push(next);
  }

  savePreferencesStorage(items);
  return {
    academyId: next.academyId,
    channels: next.channels,
    severity: next.severity,
    digestWindowMinutes: next.digestWindowMinutes,
    silencedUntil: next.silencedUntil,
    updatedAt: next.updatedAt,
  };
};

export const silenceAdminAlerts = (academyId: string, durationMinutes: number = 60): AdminAlertPreferences => {
  const current = getAdminAlertPreferences(academyId);
  const until = new Date(Date.now() + Math.max(1, durationMinutes) * 60_000).toISOString();

  const items = loadPreferencesStorage();
  const next: AlertPreferencesStorage = {
    academyId,
    channels: current.channels,
    severity: current.severity,
    digestWindowMinutes: current.digestWindowMinutes,
    silencedUntil: until,
    updatedAt: new Date().toISOString(),
  };

  const index = items.findIndex((item) => item.academyId === academyId);
  if (index >= 0) {
    items[index] = next;
  } else {
    items.push(next);
  }

  savePreferencesStorage(items);
  return next;
};

export const listAdminAlerts = async (
  academyId: string,
  pagination?: { limit?: number; offset?: number }
): Promise<AdminAlertFeedResponse> => {
  const preferences = getAdminAlertPreferences(academyId);

  await ensureAlertsBootstrap(academyId);

  const countRes = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status IN ('active', 'acknowledged'))::int AS total,
       COUNT(*) FILTER (WHERE status = 'active')::int AS unread,
       COUNT(*) FILTER (WHERE status = 'active' AND severity = 'critical')::int AS critical
     FROM alerts
     WHERE academy_id = $1`,
    [academyId]
  );

  const total = Number(countRes.rows[0]?.total || 0);
  const unread = Number(countRes.rows[0]?.unread || 0);
  const critical = Number(countRes.rows[0]?.critical || 0);

  if (isSilenced(preferences.silencedUntil)) {
    return {
      items: [],
      total,
      unreadCount: unread,
      criticalCount: critical,
      silencedUntil: preferences.silencedUntil,
    };
  }

  const limit = Math.max(1, Math.min(100, Number(pagination?.limit || 20)));
  const offset = Math.max(0, Number(pagination?.offset || 0));

  const listRes = await pool.query(
    `SELECT
       alert_id,
       academy_id,
       severity,
       title,
       description,
       alert_type,
       status,
       acknowledged_by_user_id,
       created_at,
       acknowledged_at,
       resolved_at
     FROM alerts
     WHERE academy_id = $1
       AND status IN ('active', 'acknowledged')
     ORDER BY
       CASE severity
         WHEN 'critical' THEN 1
         WHEN 'warning' THEN 2
         ELSE 3
       END,
       created_at DESC
     LIMIT $2 OFFSET $3`,
    [academyId, limit, offset]
  );

  const items: AdminAlertItem[] = listRes.rows.map((row) => {
    const status = String(row.status || 'active') as AlertStatusDb;
    return {
      id: String(row.alert_id),
      academyId: String(row.academy_id),
      severity: fromDbSeverity(String(row.severity || 'info') as AlertSeverityDb),
      category: fromDbCategory(String(row.alert_type || 'system') as AlertTypeDb),
      title: String(row.title || 'Alerta'),
      message: String(row.description || ''),
      status: toStatus(status),
      createdAt: new Date(row.created_at).toISOString(),
      acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at).toISOString() : null,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
      acknowledgedByUserId: row.acknowledged_by_user_id ? String(row.acknowledged_by_user_id) : null,
      availableActions: buildAvailableActions(status),
    };
  });

  return {
    items,
    total,
    unreadCount: unread,
    criticalCount: critical,
    silencedUntil: preferences.silencedUntil,
  };
};

export const getAdminAlertCounts = async (academyId: string): Promise<AdminAlertCountResponse> => {
  const feed = await listAdminAlerts(academyId, { limit: 1, offset: 0 });
  return {
    total: feed.total,
    unread: feed.unreadCount,
    critical: feed.criticalCount,
    silencedUntil: feed.silencedUntil,
  };
};

export const applyAdminAlertAction = async (input: {
  academyId: string;
  alertId: string;
  action: AdminAlertActionType;
  actorUserId: string;
}): Promise<{ alert: AdminAlertItem; blockedIp?: string | null } | null> => {
  const mapAlertRow = (row: any): AdminAlertItem => ({
    id: String(row.alert_id),
    academyId: String(row.academy_id),
    severity: fromDbSeverity(String(row.severity || 'info') as AlertSeverityDb),
    category: fromDbCategory(String(row.alert_type || 'system') as AlertTypeDb),
    title: String(row.title || 'Alerta'),
    message: String(row.description || ''),
    status: toStatus(String(row.status || 'active') as AlertStatusDb),
    createdAt: new Date(row.created_at).toISOString(),
    acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at).toISOString() : null,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
    acknowledgedByUserId: row.acknowledged_by_user_id ? String(row.acknowledged_by_user_id) : null,
    availableActions: buildAvailableActions(String(row.status || 'active') as AlertStatusDb),
  });

  if (input.action === 'acknowledge') {
    const res = await pool.query(
      `UPDATE alerts
       SET status = 'acknowledged',
           acknowledged_by_user_id = $3,
           acknowledged_at = NOW()
       WHERE academy_id = $1
         AND alert_id = $2::uuid
         AND status IN ('active', 'acknowledged')
       RETURNING
         alert_id, academy_id, severity, title, description, alert_type, status,
         acknowledged_by_user_id, created_at, acknowledged_at, resolved_at`,
      [input.academyId, input.alertId, input.actorUserId]
    );

    if (!res.rowCount) {
      return null;
    }

    return {
      alert: mapAlertRow(res.rows[0]),
      blockedIp: null,
    };
  }

  if (input.action === 'block-ip') {
    const currentRes = await pool.query(
      `SELECT
         alert_id, academy_id, severity, title, description, alert_type, status,
         acknowledged_by_user_id, created_at, acknowledged_at, resolved_at
       FROM alerts
       WHERE academy_id = $1
         AND alert_id = $2::uuid
         AND status IN ('active', 'acknowledged')
       LIMIT 1`,
      [input.academyId, input.alertId]
    );

    if (!currentRes.rowCount) {
      return null;
    }

    const current = currentRes.rows[0];
    const ip = findFirstIpv4(String(current.description || ''));

    if (!ip) {
      const ackRes = await pool.query(
        `UPDATE alerts
         SET status = 'acknowledged',
             acknowledged_by_user_id = $3,
             acknowledged_at = COALESCE(acknowledged_at, NOW())
         WHERE academy_id = $1
           AND alert_id = $2::uuid
           AND status IN ('active', 'acknowledged')
         RETURNING
           alert_id, academy_id, severity, title, description, alert_type, status,
           acknowledged_by_user_id, created_at, acknowledged_at, resolved_at`,
        [input.academyId, input.alertId, input.actorUserId]
      );

      return {
        alert: mapAlertRow(ackRes.rows[0]),
        blockedIp: null,
      };
    }

    const blocked = blockIpForAcademy({
      academyId: input.academyId,
      ip,
      blockedByUserId: input.actorUserId,
      reason: `Alert ${input.alertId}`,
    });

    const resolveRes = await pool.query(
      `UPDATE alerts
       SET status = 'resolved',
           acknowledged_by_user_id = COALESCE(acknowledged_by_user_id, $3),
           acknowledged_at = COALESCE(acknowledged_at, NOW()),
           resolved_at = NOW()
       WHERE academy_id = $1
         AND alert_id = $2::uuid
         AND status IN ('active', 'acknowledged')
       RETURNING
         alert_id, academy_id, severity, title, description, alert_type, status,
         acknowledged_by_user_id, created_at, acknowledged_at, resolved_at`,
      [input.academyId, input.alertId, input.actorUserId]
    );

    if (!resolveRes.rowCount) {
      return null;
    }

    return {
      alert: mapAlertRow(resolveRes.rows[0]),
      blockedIp: blocked.ip || null,
    };
  }

  if (input.action !== 'resolve' && input.action !== 'ignore') {
    return null;
  }

  const resolveRes = await pool.query(
    `UPDATE alerts
     SET status = 'resolved',
         acknowledged_by_user_id = COALESCE(acknowledged_by_user_id, $3),
         acknowledged_at = COALESCE(acknowledged_at, NOW()),
         resolved_at = NOW()
     WHERE academy_id = $1
       AND alert_id = $2::uuid
       AND status IN ('active', 'acknowledged')
     RETURNING
       alert_id, academy_id, severity, title, description, alert_type, status,
       acknowledged_by_user_id, created_at, acknowledged_at, resolved_at`,
    [input.academyId, input.alertId, input.actorUserId]
  );

  if (!resolveRes.rowCount) {
    return null;
  }

  return {
    alert: mapAlertRow(resolveRes.rows[0]),
    blockedIp: null,
  };
};

export const createOperationalAdminAlert = async (input: {
  academyId: string;
  severity: AdminAlertItem['severity'];
  title: string;
  message: string;
  dedupeWindowMinutes?: number;
  category?: 'system' | 'performance';
}): Promise<void> => {
  await createAlertIfNotRecent({
    academyId: input.academyId,
    severity: input.severity,
    alertType: input.category || 'system',
    title: input.title,
    description: input.message,
    dedupeWindowMinutes: Math.max(5, Number(input.dedupeWindowMinutes || 30)),
  });
};
