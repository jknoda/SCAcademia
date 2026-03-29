import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
	listAcademyUsers,
	createManagedUserHandler,
	updateManagedUserHandler,
	softDeleteManagedUserHandler,
	exportManagedUsersCsvHandler,
	getAcademyInfo,
	getAcademyProfile,
	updateAcademyProfileHandler,
	listMinorsWithoutGuardianHandler,
	listStudentsWithoutHealthScreeningHandler,
} from '../controllers/users';
import { listConsentTemplatesHandler, publishConsentTemplatesHandler } from '../controllers/adminConsent';
import {
	getAuditLogsHandler,
	exportAuditLogsCsvHandler,
	exportAuditLogsPdfHandler,
} from '../controllers/adminAudit';
import {
	applyAdminAlertActionHandler,
	getAdminAlertCountsHandler,
	getAdminAlertPreferencesHandler,
	listAdminAlertsHandler,
	silenceAdminAlertsHandler,
	updateAdminAlertPreferencesHandler,
} from '../controllers/adminAlerts';
import { getAdminDashboardHandler } from '../controllers/adminDashboard';
import {
	getAdminHealthMonitorHandler,
	getAdminHealthMonitorHistoryHandler,
} from '../controllers/adminHealthMonitor';
import {
	cancelDeletionRequestHandler,
	listPendingDeletionRequestsHandler,
	processDueDeletionRequestsHandler,
} from '../controllers/deletion';
import {
	downloadComplianceReportHandler,
	generateComplianceReportHandler,
	getComplianceReportScheduleHandler,
	getComplianceReportStatusHandler,
	listComplianceReportHistoryHandler,
	upsertComplianceReportScheduleHandler,
} from '../controllers/compliance';
import {
	deleteBackupJobHandler,
	downloadBackupHandler,
	getBackupJobStatusHandler,
	getBackupScheduleHandler,
	listBackupJobsHandler,
	restoreBackupHandler,
	triggerBackupHandler,
	upsertBackupScheduleHandler,
	verifyBackupHandler,
} from '../controllers/adminBackup';
import { validate } from '../middleware/validate';
import {
	publishConsentTemplatesSchema,
	academyProfileUpdateSchema,
	adminManagedUserCreateSchema,
	adminManagedUserUpdateSchema,
	adminManagedUserDeleteSchema,
	backupRestoreSchema,
	backupScheduleUpsertSchema,
	backupTriggerSchema,
} from '../lib/validators';

const router = Router();

// GET /api/admin/dashboard — resumo executivo do dashboard administrativo (Admin only)
router.get('/dashboard', authMiddleware, requireRole(['Admin']), getAdminDashboardHandler);

// GET /api/admin/health-monitor — monitor de saude consolidado (Admin only)
router.get('/health-monitor', authMiddleware, requireRole(['Admin']), getAdminHealthMonitorHandler);

// GET /api/admin/health-monitor/history?window=24h|30d — series historicas de saude (Admin only)
router.get('/health-monitor/history', authMiddleware, requireRole(['Admin']), getAdminHealthMonitorHistoryHandler);

// GET /api/admin/alerts — feed de alertas administrativos (Admin only)
router.get('/alerts', authMiddleware, requireRole(['Admin']), listAdminAlertsHandler);

// GET /api/admin/alerts/count — contadores de alertas pendentes (Admin only)
router.get('/alerts/count', authMiddleware, requireRole(['Admin']), getAdminAlertCountsHandler);

// PATCH /api/admin/alerts/:alertId/action — executa acao rapida de alerta (Admin only)
router.patch('/alerts/:alertId/action', authMiddleware, requireRole(['Admin']), applyAdminAlertActionHandler);

// GET /api/admin/alerts/preferences — consulta preferencias de notificacao (Admin only)
router.get('/alerts/preferences', authMiddleware, requireRole(['Admin']), getAdminAlertPreferencesHandler);

// POST /api/admin/alerts/preferences — atualiza preferencias de notificacao (Admin only)
router.post('/alerts/preferences', authMiddleware, requireRole(['Admin']), updateAdminAlertPreferencesHandler);

// POST /api/admin/alerts/silence — silencia alertas temporariamente (Admin only)
router.post('/alerts/silence', authMiddleware, requireRole(['Admin']), silenceAdminAlertsHandler);

// GET /api/admin/backup/schedule — consulta agendamento atual de backup (Admin only)
router.get('/backup/schedule', authMiddleware, requireRole(['Admin']), getBackupScheduleHandler);

// PUT /api/admin/backup/schedule — salva agendamento de backup (Admin only)
router.put(
	'/backup/schedule',
	authMiddleware,
	requireRole(['Admin']),
	validate(backupScheduleUpsertSchema),
	upsertBackupScheduleHandler
);

// POST /api/admin/backup/trigger — inicia backup manual (Admin only)
router.post(
	'/backup/trigger',
	authMiddleware,
	requireRole(['Admin']),
	validate(backupTriggerSchema),
	triggerBackupHandler
);

// GET /api/admin/backup/jobs — lista jobs de backup (Admin only)
router.get('/backup/jobs', authMiddleware, requireRole(['Admin']), listBackupJobsHandler);

// GET /api/admin/backup/download/:jobId — download do backup gerado (Admin only)
router.get('/backup/download/:jobId', authMiddleware, requireRole(['Admin']), downloadBackupHandler);

// POST /api/admin/backup/verify/:jobId — verifica integridade do backup (Admin only)
router.post('/backup/verify/:jobId', authMiddleware, requireRole(['Admin']), verifyBackupHandler);

// POST /api/admin/backup/restore/:jobId — inicia restore de backup (Admin only)
router.post(
	'/backup/restore/:jobId',
	authMiddleware,
	requireRole(['Admin']),
	validate(backupRestoreSchema),
	restoreBackupHandler
);

// GET /api/admin/backup/jobs/:jobId — status de um job de backup (Admin only)
router.get('/backup/jobs/:jobId', authMiddleware, requireRole(['Admin']), getBackupJobStatusHandler);

// DELETE /api/admin/backup/jobs/:jobId — remove job/arquivo de backup (Admin only)
router.delete('/backup/jobs/:jobId', authMiddleware, requireRole(['Admin']), deleteBackupJobHandler);

// GET /api/admin/users — lista todos os usuários da academia (Admin only)
router.get('/users', authMiddleware, requireRole(['Admin']), listAcademyUsers);

// GET /api/admin/users/export — exporta lista consolidada de usuários em CSV (Admin only)
router.get('/users/export', authMiddleware, requireRole(['Admin']), exportManagedUsersCsvHandler);

// POST /api/admin/users — cria usuário em fluxo unificado de gestão (Admin only)
router.post('/users', authMiddleware, requireRole(['Admin']), validate(adminManagedUserCreateSchema), createManagedUserHandler);

// PUT /api/admin/users/:userId — edita role/status/dados básicos em fluxo unificado (Admin only)
router.put('/users/:userId', authMiddleware, requireRole(['Admin']), validate(adminManagedUserUpdateSchema), updateManagedUserHandler);

// DELETE /api/admin/users/:userId — soft delete de usuário (Admin only)
router.delete('/users/:userId', authMiddleware, requireRole(['Admin']), validate(adminManagedUserDeleteSchema), softDeleteManagedUserHandler);

// GET /api/admin/academy-info — acessível por Admin ou Professor
router.get('/academy-info', authMiddleware, requireRole(['Admin', 'Professor']), getAcademyInfo);

// GET /api/admin/academy-profile — perfil completo da academia (Admin only)
router.get('/academy-profile', authMiddleware, requireRole(['Admin']), getAcademyProfile);

// PUT /api/admin/academy-profile — atualiza perfil completo da academia (Admin only)
router.put(
	'/academy-profile',
	authMiddleware,
	requireRole(['Admin']),
	validate(academyProfileUpdateSchema),
	updateAcademyProfileHandler
);

// GET /api/admin/consent-templates — lista templates ativos da academia (Admin only)
router.get('/consent-templates', authMiddleware, requireRole(['Admin']), listConsentTemplatesHandler);

// POST /api/admin/consent-templates/publish — publica nova versão dos termos (Admin only)
router.post(
	'/consent-templates/publish',
	authMiddleware,
	requireRole(['Admin']),
	validate(publishConsentTemplatesSchema),
	publishConsentTemplatesHandler
);

// GET /api/admin/audit-logs/export — exporta CSV de auditoria LGPD (Admin only)
router.get('/audit-logs/export', authMiddleware, requireRole(['Admin']), exportAuditLogsCsvHandler);

// GET /api/admin/audit-logs/export-pdf — exporta PDF de auditoria LGPD (Admin only)
router.get('/audit-logs/export-pdf', authMiddleware, requireRole(['Admin']), exportAuditLogsPdfHandler);

// GET /api/admin/audit-logs — consulta logs de auditoria com filtros e paginação (Admin only)
router.get('/audit-logs', authMiddleware, requireRole(['Admin']), getAuditLogsHandler);

// GET /api/admin/lgpd/minors-without-guardian — lista menores sem responsável vinculado (Admin only)
router.get('/lgpd/minors-without-guardian', authMiddleware, requireRole(['Admin']), listMinorsWithoutGuardianHandler);

// GET /api/admin/lgpd/students-without-health-screening — lista alunos ativos sem anamnese (Admin only)
router.get('/lgpd/students-without-health-screening', authMiddleware, requireRole(['Admin']), listStudentsWithoutHealthScreeningHandler);

// GET /api/admin/deletion-requests — lista solicitações pendentes de deleção (Admin only)
router.get('/deletion-requests', authMiddleware, requireRole(['Admin']), listPendingDeletionRequestsHandler);

// DELETE /api/admin/deletion-requests/:requestId — cancela deleção pendente (Admin only)
router.delete('/deletion-requests/:requestId', authMiddleware, requireRole(['Admin']), cancelDeletionRequestHandler);

// POST /api/admin/deletion-requests/process-due — processa solicitações vencidas (Admin only)
router.post('/deletion-requests/process-due', authMiddleware, requireRole(['Admin']), processDueDeletionRequestsHandler);

// GET /api/admin/compliance-report/generate — gera relatório de conformidade LGPD (Admin only)
router.post('/compliance-report/generate', authMiddleware, requireRole(['Admin']), generateComplianceReportHandler);

// GET /api/admin/compliance-report/status — verifica status de geração do relatório (Admin only)
router.get('/compliance-report/status', authMiddleware, requireRole(['Admin']), getComplianceReportStatusHandler);

// GET /api/admin/compliance-report/history — histórico de relatórios gerados (Admin only)
router.get('/compliance-report/history', authMiddleware, requireRole(['Admin']), listComplianceReportHistoryHandler);

// GET /api/admin/compliance-report/download/:reportId — download seguro do PDF gerado (Admin only)
router.get('/compliance-report/download/:reportId', authMiddleware, requireRole(['Admin']), downloadComplianceReportHandler);

// GET /api/admin/compliance-report/schedule — consulta agendamento automático (Admin only)
router.get('/compliance-report/schedule', authMiddleware, requireRole(['Admin']), getComplianceReportScheduleHandler);

// POST /api/admin/compliance-report/schedule — configura agendamento automático (Admin only)
router.post('/compliance-report/schedule', authMiddleware, requireRole(['Admin']), upsertComplianceReportScheduleHandler);

export default router;
