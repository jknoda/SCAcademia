import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { listAcademyUsers, getAcademyInfo } from '../controllers/users';

const router = Router();

// GET /api/admin/users — lista todos os usuários da academia (Admin only)
router.get('/users', authMiddleware, requireRole(['Admin']), listAcademyUsers);

// GET /api/admin/academy-info — acessível por Admin ou Professor
router.get('/academy-info', authMiddleware, requireRole(['Admin', 'Professor']), getAcademyInfo);

export default router;
