import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  createProfessorTurmaHandler,
  getTrainingEntryPointHandler,
  listEligibleTurmaStudentsHandler,
  listProfessorTurmasHandler,
  startTrainingSessionHandler,
  updateProfessorTurmaHandler,
} from '../controllers/trainings';
import {
  enrollStudentInSessionTurmaHandler,
  getTrainingAttendanceHandler,
  upsertTrainingAttendanceHandler,
} from '../controllers/trainingAttendance';
import {
  getSessionTechniquesHandler,
  selectTechniqueHandler,
  deselectTechniqueHandler,
  addCustomTechniqueHandler,
  saveTechniquePresetHandler,
  getProfessorPresetsHandler,
  applyPresetHandler,
  reorderSessionTechniquesHandler,
} from '../controllers/trainingTechniques';
import {
  getSessionNotesHandler,
  saveGeneralNotesHandler,
  saveStudentNoteHandler,
} from '../controllers/trainingNotes';
import {
  getTrainingReviewSummaryHandler,
  confirmTrainingSessionHandler,
} from '../controllers/trainingReview';
import { getRecentTrainingsHandler } from '../controllers/trainingSuccess';
import {
  getTrainingHistoryHandler,
  getTrainingDetailsHandler,
  updateTrainingHandler,
  deleteTrainingHandler,
  restoreTrainingHandler,
} from '../controllers/trainingHistory';
import {
  syncQueueHandler,
  getAdminSyncQueueHandler,
} from '../controllers/syncQueue';

const router = Router();

router.get('/entry-point', authMiddleware, requireRole(['Professor']), getTrainingEntryPointHandler);
router.post('/turmas', authMiddleware, requireRole(['Professor']), createProfessorTurmaHandler);
router.get('/turmas', authMiddleware, requireRole(['Professor']), listProfessorTurmasHandler);
router.get('/turmas/eligible-students', authMiddleware, requireRole(['Professor']), listEligibleTurmaStudentsHandler);
router.put('/turmas/:turmaId', authMiddleware, requireRole(['Professor']), updateProfessorTurmaHandler);
router.post('/start', authMiddleware, requireRole(['Professor']), startTrainingSessionHandler);

// Recent trainings (success/dashboard) — must be before /:sessionId/* routes
router.get('/recent', authMiddleware, requireRole(['Professor']), getRecentTrainingsHandler);

// History routes — must be before /:sessionId/* routes
router.get('/history', authMiddleware, requireRole(['Professor']), getTrainingHistoryHandler);

// Sync queue routes — must be before /:sessionId/* routes
router.post('/sync-queue', authMiddleware, requireRole(['Professor']), syncQueueHandler);
router.get('/admin/sync-queue/pending', authMiddleware, requireRole(['Admin']), getAdminSyncQueueHandler);

// Preset routes — must be before /:sessionId/* routes
router.post('/presets', authMiddleware, requireRole(['Professor']), saveTechniquePresetHandler);
router.get('/presets', authMiddleware, requireRole(['Professor']), getProfessorPresetsHandler);

router.get('/:sessionId/attendance', authMiddleware, requireRole(['Professor']), getTrainingAttendanceHandler);
router.post('/:sessionId/attendance', authMiddleware, requireRole(['Professor']), upsertTrainingAttendanceHandler);
router.post('/:sessionId/enroll-student', authMiddleware, requireRole(['Professor']), enrollStudentInSessionTurmaHandler);

// Techniques routes
router.get('/:sessionId/techniques', authMiddleware, requireRole(['Professor']), getSessionTechniquesHandler);
router.post('/:sessionId/techniques', authMiddleware, requireRole(['Professor']), selectTechniqueHandler);
router.delete('/:sessionId/techniques/:techniqueId', authMiddleware, requireRole(['Professor']), deselectTechniqueHandler);
router.post('/:sessionId/techniques/custom', authMiddleware, requireRole(['Professor']), addCustomTechniqueHandler);
router.post('/:sessionId/techniques/reorder', authMiddleware, requireRole(['Professor']), reorderSessionTechniquesHandler);
router.post('/:sessionId/apply-preset/:presetId', authMiddleware, requireRole(['Professor']), applyPresetHandler);

// Notes routes
router.get('/:sessionId/notes', authMiddleware, requireRole(['Professor']), getSessionNotesHandler);
router.put('/:sessionId/notes', authMiddleware, requireRole(['Professor']), saveGeneralNotesHandler);
router.put('/:sessionId/notes/:studentId', authMiddleware, requireRole(['Professor']), saveStudentNoteHandler);

// Review routes
router.get('/:sessionId/review', authMiddleware, requireRole(['Professor']), getTrainingReviewSummaryHandler);
router.post('/:sessionId/confirm', authMiddleware, requireRole(['Professor']), confirmTrainingSessionHandler);

// History management routes
router.get('/:sessionId', authMiddleware, requireRole(['Professor']), getTrainingDetailsHandler);
router.put('/:sessionId', authMiddleware, requireRole(['Professor']), updateTrainingHandler);
router.delete('/:sessionId', authMiddleware, requireRole(['Professor']), deleteTrainingHandler);
router.patch('/:sessionId/restore', authMiddleware, requireRole(['Professor']), restoreTrainingHandler);

export default router;
