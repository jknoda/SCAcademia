import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { healthScreeningCreateSchema, healthScreeningNotesSchema, healthScreeningUpdateSchema } from '../lib/validators';
import {
  getHealthScreeningHandler,
  createHealthScreeningHandler,
  updateHealthScreeningHandler,
} from '../controllers/healthScreening';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/health-screening/:studentId
router.get('/:studentId', getHealthScreeningHandler);

// POST /api/health-screening/:studentId
router.post('/:studentId', validate(healthScreeningCreateSchema), createHealthScreeningHandler);

// PUT /api/health-screening/:studentId  (schema chosen dynamically inside handler, validate broadly)
router.put('/:studentId', validate(healthScreeningUpdateSchema), updateHealthScreeningHandler);

export default router;
