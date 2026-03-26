import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../lib/audit';
import { getRecentTrainings } from '../lib/trainingSuccess';

export const getRecentTrainingsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const rawLimit = req.query['limit'];
    if (Array.isArray(rawLimit)) {
      return res.status(400).json({ error: 'Parâmetro limit duplicado ou múltiplo não permitido' });
    }
    const limit = rawLimit ? parseInt(String(rawLimit), 10) : 3;
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({ error: 'Parâmetro limit deve ser um número inteiro entre 1 e 50' });
    }

    const trainings = await getRecentTrainings(requester.academyId, requester.userId, limit);

    logAudit(
      requester.userId,
      'TRAINING_RECENT_VIEWED',
      'TrainingSession',
      '',
      requester.academyId,
      req.ip
    );

    return res.status(200).json({ trainings });
  } catch (error: any) {
    console.error('Erro ao buscar treinos recentes:', error);
    return res.status(500).json({ error: 'Erro ao buscar treinos recentes' });
  }
};
