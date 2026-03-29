import { Response } from 'express';
import { getAdminDashboard } from '../lib/adminDashboard';
import { logAudit } from '../lib/audit';
import { AuthenticatedRequest } from '../types';

export const getAdminDashboardHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    const dashboard = await getAdminDashboard(requester.academyId);

    logAudit(
      requester.userId,
      'ADMIN_DASHBOARD_VIEWED',
      'Dashboard',
      requester.academyId,
      requester.academyId,
      req.ip,
      { status: dashboard.status, complianceScore: dashboard.complianceScore }
    );

    return res.status(200).json(dashboard);
  } catch (error) {
    console.error('Error in getAdminDashboardHandler:', error);
    return res.status(500).json({ error: 'Erro ao carregar dashboard administrativo' });
  }
};