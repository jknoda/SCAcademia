import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import {
  getTrainingsForProfessor,
  getTrainingDetails,
  getSessionAttendance,
  getSessionDetailTechniques,
  updateTrainingSession,
  softDeleteTrainingSession,
  restoreTrainingSession,
  TrainingHistoryFilters
} from '../lib/trainingHistory';
import { logAudit } from '../lib/audit';

/**
 * TASK 2: GET /api/trainings/history
 * List trainings for authenticated professor with pagination and filters
 */
export async function getTrainingHistoryHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const requester = req.user!;
    const ipAddress = Array.isArray(req.ip) ? req.ip[0] : (req.ip || '');

    // RBAC check
    if (requester.role !== 'Professor') {
      res.status(403).json({ error: 'Only professors can access training history' });
      logAudit(requester.userId, 'IP_HISTORY_RBAC_DENIED', 'TrainingHistory', '', requester.academyId, ipAddress);
      return;
    }

    // Parse query params
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    // Validation
    if (isNaN(limit) || limit < 1 || limit > 100) {
      res.status(400).json({ error: 'Invalid limit parameter (must be 1-100)' });
      return;
    }

    if (isNaN(offset) || offset < 0) {
      res.status(400).json({ error: 'Invalid offset parameter' });
      return;
    }

    // Handle duplicate limit parameter
    if (Array.isArray(req.query.limit)) {
      res.status(400).json({ error: 'Duplicate limit parameter' });
      return;
    }

    // Build filters
    const filters: TrainingHistoryFilters = {};

    if (req.query.dateFrom) {
      filters.dateFrom = req.query.dateFrom as string;
    }
    if (req.query.dateTo) {
      filters.dateTo = req.query.dateTo as string;
    }
    if (req.query.turmaId) {
      filters.turmaId = req.query.turmaId as string;
    }
    if (req.query.keyword) {
      filters.noteKeyword = req.query.keyword as string;
    }

    // Query
    const result = await getTrainingsForProfessor(
      requester.userId,
      requester.academyId,
      limit,
      offset,
      filters
    );

    logAudit(requester.userId, 'TRAINING_HISTORY_LISTED', 'TrainingHistory', '', requester.academyId, ipAddress, {
      limit,
      offset,
      total: result.total
    });

    res.json({
      success: true,
      data: {
        trainings: result.trainings,
        total: result.total,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit
      }
    });
  } catch (error) {
    console.error('[trainingHistory] getTrainingHistoryHandler error:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de treinos' });
    const ipAddress = Array.isArray(req.ip) ? req.ip[0] : (req.ip || '');
    logAudit('', 'TRAINING_HISTORY_ERROR', 'TrainingHistory', '', '', ipAddress);
  }
}

/**
 * TASK 3: GET /api/trainings/:sessionId
 * Get full details of a single training session
 */
export async function getTrainingDetailsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const requester = req.user!;
    const ipAddress = Array.isArray(req.ip) ? req.ip[0] : (req.ip || '');
    const sessionId = typeof req.params.sessionId === 'string' ? req.params.sessionId : '';

    // RBAC check
    if (requester.role !== 'Professor') {
      res.status(403).json({ error: 'Only professors can access training details' });
      return;
    }

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      res.status(400).json({ error: 'Invalid session ID format' });
      return;
    }

    // Get training details
    const training = await getTrainingDetails(sessionId, requester.userId, requester.academyId);

    if (!training) {
      res.status(404).json({ error: 'Treino não encontrado' });
      logAudit(requester.userId, 'TRAINING_DETAILS_NOT_FOUND', 'TrainingSession', sessionId, requester.academyId, ipAddress);
      return;
    }

    // Get attendance records
    const attendance = await getSessionAttendance(sessionId);
    const techniques = await getSessionDetailTechniques(sessionId);

    res.json({
      success: true,
      data: {
        ...training,
        attendance,
        techniques,
      }
    });

    logAudit(requester.userId, 'TRAINING_DETAILS_VIEWED', 'TrainingSession', sessionId, requester.academyId, ipAddress);
  } catch (error) {
    console.error('[trainingHistory] getTrainingDetailsHandler error:', error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do treino' });
  }
}

/**
 * TASK 4: PUT /api/trainings/:sessionId
 * Update training session (attendance, techniques, notes)
 */
export async function updateTrainingHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const requester = req.user!;
    const ipAddress = Array.isArray(req.ip) ? req.ip[0] : (req.ip || '');
    const sessionId = typeof req.params.sessionId === 'string' ? req.params.sessionId : '';
    const { attendance, techniques, notes } = req.body;

    // RBAC check
    if (requester.role !== 'Professor') {
      res.status(403).json({ error: 'Only professors can update training records' });
      return;
    }

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      res.status(400).json({ error: 'Invalid session ID format' });
      return;
    }

    // Validate body
    if (!attendance && !techniques && notes === undefined) {
      res.status(400).json({ error: 'No updates provided' });
      return;
    }

    // Update
    const updated = await updateTrainingSession(sessionId, requester.userId, requester.academyId, {
      attendance,
      techniques,
      notes
    });

    if (!updated) {
      res.status(404).json({ error: 'Treino não encontrado' });
      return;
    }

    logAudit(requester.userId, 'TRAINING_UPDATED', 'TrainingSession', sessionId, requester.academyId, ipAddress, {
      fieldsUpdated: Object.keys({ attendance, techniques, notes }).filter(k => req.body[k] !== undefined)
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('[trainingHistory] updateTrainingHandler error:', error);
    res.status(500).json({ error: 'Erro ao atualizar treino' });
  }
}

/**
 * TASK 5: DELETE /api/trainings/:sessionId
 * Soft-delete training session
 */
export async function deleteTrainingHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const requester = req.user!;
    const ipAddress = Array.isArray(req.ip) ? req.ip[0] : (req.ip || '');
    const sessionId = typeof req.params.sessionId === 'string' ? req.params.sessionId : '';

    // RBAC check
    if (requester.role !== 'Professor') {
      res.status(403).json({ error: 'Only professors can delete training records' });
      return;
    }

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      res.status(400).json({ error: 'Invalid session ID format' });
      return;
    }

    // Soft delete
    const deleted = await softDeleteTrainingSession(sessionId, requester.userId, requester.academyId);

    if (!deleted) {
      res.status(404).json({ error: 'Treino não encontrado' });
      return;
    }

    logAudit(requester.userId, 'TRAINING_DELETED', 'TrainingSession', sessionId, requester.academyId, ipAddress);

    // Return undo deadline (10 seconds from now)
    const undoDeadline = new Date(Date.now() + 10000).toISOString();

    res.json({
      success: true,
      message: 'Treino deletado',
      data: {
        undo_deadline: undoDeadline
      }
    });
  } catch (error) {
    console.error('[trainingHistory] deleteTrainingHandler error:', error);
    res.status(500).json({ error: 'Erro ao deletar treino' });
  }
}

/**
 * TASK 6: PATCH /api/trainings/:sessionId/restore
 * Restore soft-deleted training session (undo delete)
 */
export async function restoreTrainingHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const requester = req.user!;
    const ipAddress = Array.isArray(req.ip) ? req.ip[0] : (req.ip || '');
    const sessionId = typeof req.params.sessionId === 'string' ? req.params.sessionId : '';

    // RBAC check
    if (requester.role !== 'Professor') {
      res.status(403).json({ error: 'Only professors can restore training records' });
      return;
    }

    // Validate UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      res.status(400).json({ error: 'Invalid session ID format' });
      return;
    }

    // Restore
    const restored = await restoreTrainingSession(sessionId, requester.userId, requester.academyId);

    if (!restored) {
      res.status(404).json({ error: 'Treino não encontrado ou não foi deletado' });
      return;
    }

    logAudit(requester.userId, 'TRAINING_RESTORED', 'TrainingSession', sessionId, requester.academyId, ipAddress);

    res.json({
      success: true,
      message: 'Treino restaurado'
    });
  } catch (error) {
    console.error('[trainingHistory] restoreTrainingHandler error:', error);
    res.status(500).json({ error: 'Erro ao restaurar treino' });
  }
}
