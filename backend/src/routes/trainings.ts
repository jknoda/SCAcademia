import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  getTrainingEntryPointHandler,
  startTrainingSessionHandler,
} from '../controllers/trainings';
import {
  getTrainingAttendanceHandler,
  upsertTrainingAttendanceHandler,
} from '../controllers/trainingAttendance';

const router = Router();

router.get('/entry-point', authMiddleware, requireRole(['Professor']), getTrainingEntryPointHandler);
router.post('/start', authMiddleware, requireRole(['Professor']), startTrainingSessionHandler);
router.get('/:sessionId/attendance', authMiddleware, requireRole(['Professor']), getTrainingAttendanceHandler);
router.post('/:sessionId/attendance', authMiddleware, requireRole(['Professor']), upsertTrainingAttendanceHandler);

export default router;
