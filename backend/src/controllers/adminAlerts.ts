import { Response } from 'express';
import {
  applyAdminAlertAction,
  getAdminAlertCounts,
  getAdminAlertPreferences,
  listAdminAlerts,
  silenceAdminAlerts,
  updateAdminAlertPreferences,
} from '../lib/adminAlerts';
import { logAudit } from '../lib/audit';
import { AdminAlertActionType, AuthenticatedRequest } from '../types';

const isValidAction = (value: string): value is AdminAlertActionType => {
  return value === 'acknowledge' || value === 'resolve' || value === 'ignore' || value === 'block-ip';
};

const isCanonicalUuid = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

export const listAdminAlertsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    const limit = Number(req.query['limit'] || 20);
    const offset = Number(req.query['offset'] || 0);

    const payload = await listAdminAlerts(requester.academyId, { limit, offset });
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Error in listAdminAlertsHandler:', error);
    return res.status(500).json({ error: 'Erro ao listar alertas administrativos' });
  }
};

export const getAdminAlertCountsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    const payload = await getAdminAlertCounts(requester.academyId);
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Error in getAdminAlertCountsHandler:', error);
    return res.status(500).json({ error: 'Erro ao carregar contadores de alertas' });
  }
};

export const applyAdminAlertActionHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    const alertId = String(req.params['alertId'] || '').trim();
    const action = String(req.body?.action || '').trim();

    if (!alertId) {
      return res.status(400).json({ error: 'alertId é obrigatório' });
    }

    if (!isCanonicalUuid(alertId)) {
      return res.status(400).json({ error: 'alertId inválido (UUID esperado)' });
    }

    if (!isValidAction(action)) {
      return res.status(400).json({
        error: 'Ação inválida. Use: acknowledge, resolve, ignore ou block-ip',
      });
    }

    const updated = await applyAdminAlertAction({
      academyId: requester.academyId,
      alertId,
      action,
      actorUserId: requester.userId,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Alerta não encontrado para a academia' });
    }

    logAudit(
      requester.userId,
      action === 'block-ip' ? 'ADMIN_ALERT_BLOCK_IP_REQUESTED' : `ADMIN_ALERT_${action.toUpperCase()}`,
      'AdminAlert',
      alertId,
      requester.academyId,
      req.ip,
      { action, alertStatus: updated.alert.status, blockedIp: updated.blockedIp || null }
    );

    const message = action === 'block-ip'
      ? (updated.blockedIp
        ? `IP ${updated.blockedIp} bloqueado e alerta encerrado.`
        : 'IP não identificado no alerta; alerta marcado para investigação manual.')
      : 'Ação aplicada com sucesso';

    return res.status(200).json({ message, alert: updated.alert, blockedIp: updated.blockedIp || null });
  } catch (error) {
    console.error('Error in applyAdminAlertActionHandler:', error);
    return res.status(500).json({ error: 'Erro ao aplicar ação de alerta' });
  }
};

export const getAdminAlertPreferencesHandler = (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    const preferences = getAdminAlertPreferences(requester.academyId);
    return res.status(200).json(preferences);
  } catch (error) {
    console.error('Error in getAdminAlertPreferencesHandler:', error);
    return res.status(500).json({ error: 'Erro ao carregar preferências de alertas' });
  }
};

export const updateAdminAlertPreferencesHandler = (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    const channels = req.body?.channels;
    const severity = req.body?.severity;
    const digestWindowMinutes = Number(req.body?.digestWindowMinutes || 60);

    if (!channels || !severity) {
      return res.status(400).json({ error: 'channels e severity são obrigatórios' });
    }

    const updated = updateAdminAlertPreferences({
      academyId: requester.academyId,
      channels: {
        inApp: Boolean(channels.inApp),
        push: Boolean(channels.push),
        email: Boolean(channels.email),
      },
      severity: {
        critical: Boolean(severity.critical),
        preventive: Boolean(severity.preventive),
        informative: Boolean(severity.informative),
      },
      digestWindowMinutes,
    });

    logAudit(
      requester.userId,
      'ADMIN_ALERT_PREFERENCES_UPDATED',
      'AdminAlertPreferences',
      requester.academyId,
      requester.academyId,
      req.ip,
      { digestWindowMinutes: updated.digestWindowMinutes }
    );

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error in updateAdminAlertPreferencesHandler:', error);
    return res.status(500).json({ error: 'Erro ao atualizar preferências de alertas' });
  }
};

export const silenceAdminAlertsHandler = (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    const durationMinutes = Number(req.body?.durationMinutes || 60);
    const updated = silenceAdminAlerts(requester.academyId, durationMinutes);

    logAudit(
      requester.userId,
      'ADMIN_ALERTS_SILENCED',
      'AdminAlertPreferences',
      requester.academyId,
      requester.academyId,
      req.ip,
      { durationMinutes, silencedUntil: updated.silencedUntil }
    );

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Error in silenceAdminAlertsHandler:', error);
    return res.status(500).json({ error: 'Erro ao silenciar alertas' });
  }
};
