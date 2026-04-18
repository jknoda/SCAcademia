import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createAthleteAssessmentHandler,
  getAthleteProgressConfigurationHandler,
  getAthleteProgressHandler,
  updateAthleteAssessmentHandler,
  updateAthleteProgressConfigurationHandler,
} from '../controllers/athleteProgress';
import { athleteAssessmentSchema, athleteIndicatorConfigurationSchema } from '../lib/validators';

const router = Router();

router.get(
  '/configuration',
  authMiddleware,
  requireRole(['Professor', 'Admin']),
  getAthleteProgressConfigurationHandler
);

router.put(
  '/configuration',
  authMiddleware,
  requireRole(['Professor', 'Admin']),
  validate(athleteIndicatorConfigurationSchema),
  updateAthleteProgressConfigurationHandler
);

router.post(
  '/assessments',
  authMiddleware,
  requireRole(['Professor', 'Admin']),
  validate(athleteAssessmentSchema),
  createAthleteAssessmentHandler
);

router.put(
  '/assessments/:assessmentId',
  authMiddleware,
  requireRole(['Professor', 'Admin']),
  validate(athleteAssessmentSchema),
  updateAthleteAssessmentHandler
);

router.get(
  '/athletes/:athleteId/summary',
  authMiddleware,
  requireRole(['Professor', 'Admin', 'Responsavel', 'Aluno']),
  getAthleteProgressHandler
);

router.get(
  '/athletes/:athleteId/history',
  authMiddleware,
  requireRole(['Professor', 'Admin', 'Responsavel', 'Aluno']),
  getAthleteProgressHandler
);

router.get(
  '/athletes/:athleteId',
  authMiddleware,
  requireRole(['Professor', 'Admin', 'Responsavel', 'Aluno']),
  getAthleteProgressHandler
);

export default router;
