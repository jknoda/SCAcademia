import { Response } from 'express';
import { logAudit } from '../lib/audit';
import { getHealthMonitorHistory, getHealthMonitorSnapshot } from '../lib/adminHealthMonitor';
import { AuthenticatedRequest, HealthMonitorWindow } from '../types';

const parseWindow = (value: unknown): HealthMonitorWindow | null => {
  if (value === undefined) {
    return '24h';
  }

  if (value === '24h' || value === '30d') {
    return value;
  }

  return null;
};

export const getAdminHealthMonitorHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    const snapshot = await getHealthMonitorSnapshot(requester.academyId);

    logAudit(
      requester.userId,
      'ADMIN_HEALTH_MONITOR_VIEWED',
      'HealthMonitor',
      requester.academyId,
      requester.academyId,
      req.ip,
      {
        components: snapshot.components.length,
        alerts: snapshot.alerts.length,
      }
    );

    return res.status(200).json(snapshot);
  } catch (error) {
    console.error('Error in getAdminHealthMonitorHandler:', error);
    return res.status(500).json({ error: 'Erro ao carregar health monitor' });
  }
};

export const getAdminHealthMonitorHistoryHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    const window = parseWindow(req.query['window']);
    if (!window) {
      return res.status(400).json({ error: "Parâmetro 'window' inválido. Use '24h' ou '30d'." });
    }
    const history = await getHealthMonitorHistory(requester.academyId, window);

    logAudit(
      requester.userId,
      'ADMIN_HEALTH_MONITOR_HISTORY_VIEWED',
      'HealthMonitor',
      requester.academyId,
      requester.academyId,
      req.ip,
      { window }
    );

    return res.status(200).json(history);
  } catch (error) {
    console.error('Error in getAdminHealthMonitorHistoryHandler:', error);
    return res.status(500).json({ error: 'Erro ao carregar historico de health monitor' });
  }
};
