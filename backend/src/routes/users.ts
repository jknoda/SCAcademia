import { Router } from 'express';
import { authMiddleware, requireRole, requireSelf } from '../middleware/auth';
import {
  getUserProfile,
  updateOwnUserProfile,
  listProfessorsHandler,
  createProfessorHandler,
  updateProfessorHandler,
  updateProfessorStatusHandler,
  resetProfessorPasswordByAdminHandler,
  listStudentsHandler,
  listMyStudentsHandler,
  createStudentHandler,
  updateStudentHandler,
  updateStudentStatusHandler,
  getStudentProfileViewHandler,
  searchGuardianByEmailHandler,
  linkGuardianToStudentHandler,
  createAndLinkGuardianHandler,
  unlinkGuardianFromStudentHandler,
  listMinorsWithoutGuardianHandler,
} from '../controllers/users';
import {
  getStudentDeletionStatusHandler,
  listLinkedStudentsForGuardianHandler,
  requestStudentDeletionHandler,
} from '../controllers/deletion';
import { validate } from '../middleware/validate';
import {
  deletionRequestSchema,
  userProfileUpdateSchema,
  professorCreateSchema,
  professorUpdateSchema,
  professorStatusSchema,
  adminResetProfessorPasswordSchema,
  studentCreateSchema,
  studentUpdateSchema,
  studentStatusSchema,
  linkGuardianSchema,
  createAndLinkGuardianSchema,
} from '../lib/validators';

const router = Router();

// GET /api/users/professores — lista professores da academia com filtros (Admin only)
router.get('/professores', authMiddleware, requireRole(['Admin']), listProfessorsHandler);

// POST /api/users/professores — cadastra professor com dados completos (Admin only)
router.post('/professores', authMiddleware, requireRole(['Admin']), validate(professorCreateSchema), createProfessorHandler);

// PUT /api/users/professores/:userId — atualiza dados de professor (Admin only)
router.put('/professores/:userId', authMiddleware, requireRole(['Admin']), validate(professorUpdateSchema), updateProfessorHandler);

// PUT /api/users/professores/:userId/status — ativa/desativa professor (Admin only)
router.put('/professores/:userId/status', authMiddleware, requireRole(['Admin']), validate(professorStatusSchema), updateProfessorStatusHandler);

// PUT /api/users/professores/:userId/reset-password — redefine senha do professor (Admin only)
router.put(
  '/professores/:userId/reset-password',
  authMiddleware,
  requireRole(['Admin']),
  validate(adminResetProfessorPasswordSchema),
  resetProfessorPasswordByAdminHandler
);

// GET /api/users/alunos — lista alunos da academia com filtros (Admin only)
router.get('/alunos', authMiddleware, requireRole(['Admin']), listStudentsHandler);

// GET /api/users/professores/meus-alunos — lista alunos vinculados ao professor
router.get('/professores/meus-alunos', authMiddleware, requireRole(['Professor']), listMyStudentsHandler);

// POST /api/users/alunos — cadastra aluno com dados completos (Admin/Professor)
router.post('/alunos', authMiddleware, requireRole(['Admin', 'Professor']), validate(studentCreateSchema), createStudentHandler);

// PUT /api/users/alunos/:userId — atualiza dados de aluno (Admin/Professor)
router.put('/alunos/:userId', authMiddleware, requireRole(['Admin', 'Professor']), validate(studentUpdateSchema), updateStudentHandler);

// PUT /api/users/alunos/:userId/status — ativa/desativa aluno (Admin only)
router.put('/alunos/:userId/status', authMiddleware, requireRole(['Admin']), validate(studentStatusSchema), updateStudentStatusHandler);

// GET /api/users/alunos/:userId/ficha — ficha completa do aluno (Admin/Professor)
router.get('/alunos/:userId/ficha', authMiddleware, requireRole(['Admin', 'Professor']), getStudentProfileViewHandler);

// GET /api/users/responsaveis/search?email=... — busca responsável por email (Admin only)
router.get(
  '/responsaveis/search',
  authMiddleware,
  requireRole(['Admin']),
  searchGuardianByEmailHandler
);

// POST /api/users/alunos/:userId/responsavel/link — vincula responsável existente (Admin only)
router.post(
  '/alunos/:userId/responsavel/link',
  authMiddleware,
  requireRole(['Admin']),
  validate(linkGuardianSchema),
  linkGuardianToStudentHandler
);

// POST /api/users/alunos/:userId/responsavel — cria responsável e vincula ao aluno (Admin only)
router.post(
  '/alunos/:userId/responsavel',
  authMiddleware,
  requireRole(['Admin']),
  validate(createAndLinkGuardianSchema),
  createAndLinkGuardianHandler
);

// DELETE /api/users/alunos/:userId/responsavel/:guardianId — desfaz vínculo responsável-aluno (Admin only)
router.delete(
  '/alunos/:userId/responsavel/:guardianId',
  authMiddleware,
  requireRole(['Admin']),
  unlinkGuardianFromStudentHandler
);

// GET /api/users/lgpd/minors-without-guardian — menores sem responsável vinculado (Admin only)
router.get('/lgpd/minors-without-guardian', authMiddleware, requireRole(['Admin']), listMinorsWithoutGuardianHandler);

// GET /api/users/students/linked — lista filhos vinculados ao responsável
router.get('/students/linked', authMiddleware, requireRole(['Responsavel']), listLinkedStudentsForGuardianHandler);

// POST /api/users/students/:studentId/deletion-request — solicita deleção (Admin/Responsavel)
router.post(
  '/students/:studentId/deletion-request',
  authMiddleware,
  requireRole(['Admin', 'Responsavel']),
  validate(deletionRequestSchema),
  requestStudentDeletionHandler
);

// GET /api/users/students/:studentId/deletion-status — status da solicitação (Admin/Responsavel)
router.get(
  '/students/:studentId/deletion-status',
  authMiddleware,
  requireRole(['Admin', 'Responsavel']),
  getStudentDeletionStatusHandler
);

// GET /api/users/:userId/profile — acessível pelo próprio usuário ou Admin
router.get('/:userId/profile', authMiddleware, requireSelf, getUserProfile);

// PUT /api/users/:userId — atualiza perfil do próprio usuário (ou Admin com requireSelf)
router.put('/:userId', authMiddleware, requireSelf, validate(userProfileUpdateSchema), updateOwnUserProfile);

export default router;
