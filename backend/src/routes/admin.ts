import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
	listAcademyUsers,
	getAcademyInfo,
	getAcademyProfile,
	updateAcademyProfileHandler,
	listMinorsWithoutGuardianHandler,
	listStudentsWithoutHealthScreeningHandler,
} from '../controllers/users';
import { listConsentTemplatesHandler, publishConsentTemplatesHandler } from '../controllers/adminConsent';
import { getAuditLogsHandler, exportAuditLogsCsvHandler } from '../controllers/adminAudit';
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
import { validate } from '../middleware/validate';
import { publishConsentTemplatesSchema, academyProfileUpdateSchema } from '../lib/validators';

const router = Router();

// GET /api/admin/users — lista todos os usuários da academia (Admin only)
router.get('/users', authMiddleware, requireRole(['Admin']), listAcademyUsers);

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
