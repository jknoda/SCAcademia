import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { getUserById } from '../lib/database';
import { logAudit } from '../lib/audit';
import {
  findOrCreateTrainingDraft,
  getProfessorTrainingEntryPointContext,
  getProfessorTurmaById,
} from '../lib/trainings';

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getTrainingEntryPointHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const user = await getUserById(requester.userId);
    const fullName = user?.fullName || 'Professor';

    const context = await getProfessorTrainingEntryPointContext(
      requester.academyId,
      requester.userId,
      fullName
    );

    logAudit(
      requester.userId,
      'TRAINING_ENTRYPOINT_VIEWED',
      'TrainingEntryPoint',
      context.currentOrNextClass?.turmaId || requester.academyId,
      requester.academyId,
      req.ip
    );

    return res.json(context);
  } catch (error) {
    console.error('Erro ao carregar contexto de entrada do treino:', error);
    return res.status(500).json({ error: 'Erro ao carregar entrada do treino' });
  }
};

export const startTrainingSessionHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const turmaId = asString(req.body?.turmaId);
    if (!turmaId) {
      return res.status(400).json({ error: 'turmaId é obrigatório' });
    }
    if (!uuidRegex.test(turmaId)) {
      return res.status(400).json({ error: 'turmaId deve ser um UUID válido' });
    }

    const turma = await getProfessorTurmaById(requester.academyId, requester.userId, turmaId);
    if (!turma) {
      return res.status(404).json({ error: 'Turma não encontrada para o professor atual' });
    }

    const result = await findOrCreateTrainingDraft({
      academyId: requester.academyId,
      professorId: requester.userId,
      turmaId,
    });

    logAudit(
      requester.userId,
      'TRAINING_SESSION_STARTED',
      'TrainingSession',
      result.sessionId,
      requester.academyId,
      req.ip,
      { turmaId, created: result.created }
    );

    return res.status(200).json({
      message: result.created
        ? 'Treino iniciado com sucesso'
        : 'Sessão de treino em andamento reutilizada com sucesso',
      sessionId: result.sessionId,
      created: result.created,
      nextStep: `/training/session/${result.sessionId}/attendance`,
    });
  } catch (error) {
    console.error('Erro ao iniciar sessão de treino:', error);
    return res.status(500).json({ error: 'Erro ao iniciar treino' });
  }
};
