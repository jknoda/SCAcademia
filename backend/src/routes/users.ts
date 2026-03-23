import { Router } from 'express';
import { authMiddleware, requireSelf } from '../middleware/auth';
import { getUserProfile } from '../controllers/users';

const router = Router();

// GET /api/users/:userId/profile — acessível pelo próprio usuário ou Admin
router.get('/:userId/profile', authMiddleware, requireSelf, getUserProfile);

export default router;
