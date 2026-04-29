import { Router } from 'express';

import {
  initAiChatHandler,
  lookupAiUserHandler,
  sendAiChatMessageHandler,
} from '../controllers/aiChat';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.post('/users', authMiddleware, requireRole(['Aluno']), lookupAiUserHandler);
router.post('/chat/init', authMiddleware, requireRole(['Aluno']), initAiChatHandler);
router.post('/chat', authMiddleware, requireRole(['Aluno']), sendAiChatMessageHandler);

export default router;