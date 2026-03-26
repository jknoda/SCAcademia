import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../lib/audit';
import {
  getTrainingReviewSummary,
  confirmTrainingSession,
} from '../lib/trainingReview';

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getTrainingReviewSummaryHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const sessionId = asString(req.params.sessionId);
    if (!sessionId || !uuidRegex.test(sessionId)) {
      return res.status(400).json({ error: 'sessionId deve ser um UUID válido' });
    }

    const summary = await getTrainingReviewSummary(
      requester.academyId,
      requester.userId,
      sessionId
    );

    logAudit(
      requester.userId,
      'TRAINING_REVIEW_VIEWED',
      'TrainingReview',
      sessionId,
      requester.academyId,
      req.ip
    );

    return res.status(200).json(summary);
  } catch (error: any) {
    const message = error?.message || 'Erro ao carregar revisão do treino';
    const status = message.includes('não encontrada') ? 404 : 500;
    console.error('Erro ao carregar revisão do treino:', error);
    return res.status(status).json({ error: message });
  }
};

export const confirmTrainingSessionHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const sessionId = asString(req.params.sessionId);
    if (!sessionId || !uuidRegex.test(sessionId)) {
      return res.status(400).json({ error: 'sessionId deve ser um UUID válido' });
    }

    const confirmation = await confirmTrainingSession({
      academyId: requester.academyId,
      professorId: requester.userId,
      sessionId,
    });

    logAudit(
      requester.userId,
      'TRAINING_SESSION_CONFIRMED',
      'TrainingSession',
      sessionId,
      requester.academyId,
      req.ip,
      {
        confirmedAt: confirmation.confirmedAt,
        studentsNotified: confirmation.studentsNotified,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Treino confirmado com sucesso',
      sessionId,
      confirmedAt: confirmation.confirmedAt,
      studentsNotified: confirmation.studentsNotified,
    });
  } catch (error: any) {
    const message = error?.message || 'Erro ao confirmar treino';
    const status = message.includes('não encontrada')
      ? 404
      : message.includes('Não é possível confirmar')
        ? 400
        : 500;

    console.error('Erro ao confirmar treino:', error);
    return res.status(status).json({ error: message });
  }
};
