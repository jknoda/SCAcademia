import { Response } from 'express';
import { logAudit } from '../lib/audit';
import {
  AthleteIndicatorConfigurationInput,
  AthleteProgressQueryOptions,
  createAthleteAssessment,
  getAthleteProgressHistory,
  listAthleteIndicatorConfiguration,
  updateAthleteAssessment,
  upsertAthleteIndicatorConfiguration,
} from '../lib/athleteProgress';
import { isGuardianOfStudent } from '../lib/deletionRequests';
import { AuthenticatedRequest } from '../types';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const parseProgressQuery = (query: AuthenticatedRequest['query']): { options?: AthleteProgressQueryOptions; error?: string } => {
  const invalidArrayField = ['period', 'from', 'to', 'limit', 'offset', 'groupBy'].find((field) => Array.isArray(query[field]));
  if (invalidArrayField) {
    return { error: `Parâmetro duplicado: ${invalidArrayField}` };
  }

  const period = typeof query.period === 'string' ? query.period : undefined;
  const groupBy = typeof query.groupBy === 'string' ? query.groupBy : undefined;
  const from = typeof query.from === 'string' ? query.from : undefined;
  const to = typeof query.to === 'string' ? query.to : undefined;

  if (period && !['7d', '30d', '90d', 'all', 'week', 'month'].includes(period)) {
    return { error: 'Parâmetro period inválido' };
  }

  if (groupBy && !['day', 'week', 'month'].includes(groupBy)) {
    return { error: 'Parâmetro groupBy inválido' };
  }

  if (from && !isoDateRegex.test(from)) {
    return { error: 'Parâmetro from deve estar no formato YYYY-MM-DD' };
  }

  if (to && !isoDateRegex.test(to)) {
    return { error: 'Parâmetro to deve estar no formato YYYY-MM-DD' };
  }

  const limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : undefined;
  const offset = typeof query.offset === 'string' ? parseInt(query.offset, 10) : undefined;

  if (typeof limit === 'number' && (Number.isNaN(limit) || limit < 1 || limit > 100)) {
    return { error: 'Parâmetro limit deve estar entre 1 e 100' };
  }

  if (typeof offset === 'number' && (Number.isNaN(offset) || offset < 0)) {
    return { error: 'Parâmetro offset inválido' };
  }

  return {
    options: {
      period: period as AthleteProgressQueryOptions['period'],
      from,
      to,
      limit,
      offset,
      groupBy: groupBy as AthleteProgressQueryOptions['groupBy'],
    },
  };
};

async function authorizeAthleteProgressAccess(
  req: AuthenticatedRequest,
  res: Response
): Promise<{ requester: NonNullable<AuthenticatedRequest['user']>; athleteId: string; ipAddress: string } | null> {
  const requester = req.user!;
  const ipAddress = Array.isArray(req.ip) ? req.ip[0] : (req.ip || '');
  const athleteId = typeof req.params.athleteId === 'string' ? req.params.athleteId : '';

  if (!requester || !['Professor', 'Admin', 'Responsavel', 'Aluno'].includes(requester.role)) {
    res.status(403).json({ error: 'Perfil sem acesso ao progresso do atleta' });
    return null;
  }

  if (!uuidRegex.test(athleteId)) {
    res.status(400).json({ error: 'Identificador de atleta inválido' });
    return null;
  }

  if (requester.role === 'Aluno' && requester.userId !== athleteId) {
    res.status(403).json({ error: 'Aluno só pode visualizar a própria evolução' });
    return null;
  }

  if (requester.role === 'Responsavel') {
    const canAccessStudent = await isGuardianOfStudent(requester.academyId, requester.userId, athleteId);
    if (!canAccessStudent) {
      res.status(403).json({ error: 'Responsável sem vínculo com este atleta' });
      return null;
    }
  }

  return { requester, athleteId, ipAddress };
}

export async function createAthleteAssessmentHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const requester = req.user!;
    const ipAddress = Array.isArray(req.ip) ? req.ip[0] : (req.ip || '');

    if (!requester || !['Professor', 'Admin'].includes(requester.role)) {
      res.status(403).json({ error: 'Apenas professores ou administradores podem registrar avaliações' });
      return;
    }

    const { athleteId, assessmentDate, notes, metrics } = req.body;
    const payload = await createAthleteAssessment({
      academyId: requester.academyId,
      athleteId,
      assessmentDate,
      notes,
      metrics,
      recordedByUserId: requester.userId,
      source: 'manual',
    });

    if (!payload) {
      res.status(404).json({ error: 'Atleta não encontrado' });
      return;
    }

    logAudit(
      requester.userId,
      'ATHLETE_ASSESSMENT_CREATED',
      'AthleteProgress',
      payload.assessmentId,
      requester.academyId,
      ipAddress,
      { athleteId: payload.athleteId, metricsCount: payload.metrics.length }
    );

    res.status(201).json({ success: true, data: payload });
  } catch (error) {
    console.error('[athleteProgress] createAthleteAssessmentHandler error:', error);
    res.status(500).json({ error: 'Erro ao registrar avaliação do atleta' });
  }
}

export async function updateAthleteAssessmentHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const requester = req.user!;
    const ipAddress = Array.isArray(req.ip) ? req.ip[0] : (req.ip || '');
    const assessmentId = typeof req.params.assessmentId === 'string' ? req.params.assessmentId : '';

    if (!requester || !['Professor', 'Admin'].includes(requester.role)) {
      res.status(403).json({ error: 'Apenas professores ou administradores podem editar avaliações' });
      return;
    }

    if (!uuidRegex.test(assessmentId)) {
      res.status(400).json({ error: 'Identificador de avaliação inválido' });
      return;
    }

    const { athleteId, assessmentDate, notes, metrics } = req.body;
    const payload = await updateAthleteAssessment(assessmentId, {
      academyId: requester.academyId,
      athleteId,
      assessmentDate,
      notes,
      metrics,
      recordedByUserId: requester.userId,
      source: 'manual',
    });

    if (!payload) {
      res.status(404).json({ error: 'Avaliação não encontrada' });
      return;
    }

    logAudit(
      requester.userId,
      'ATHLETE_ASSESSMENT_UPDATED',
      'AthleteProgress',
      assessmentId,
      requester.academyId,
      ipAddress,
      { athleteId: payload.athleteId, metricsCount: payload.metrics.length }
    );

    res.json({ success: true, data: payload });
  } catch (error) {
    console.error('[athleteProgress] updateAthleteAssessmentHandler error:', error);
    res.status(500).json({ error: 'Erro ao atualizar avaliação do atleta' });
  }
}

export async function getAthleteProgressConfigurationHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const requester = req.user!;

    if (!requester || !['Professor', 'Admin'].includes(requester.role)) {
      res.status(403).json({ error: 'Apenas professores ou administradores podem visualizar a configuração' });
      return;
    }

    const groups = await listAthleteIndicatorConfiguration(requester.academyId);
    res.json({ success: true, data: { groups } });
  } catch (error) {
    console.error('[athleteProgress] getAthleteProgressConfigurationHandler error:', error);
    res.status(500).json({ error: 'Erro ao consultar configuração dos indicadores' });
  }
}

export async function updateAthleteProgressConfigurationHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const requester = req.user!;
    const ipAddress = Array.isArray(req.ip) ? req.ip[0] : (req.ip || '');

    if (!requester || !['Professor', 'Admin'].includes(requester.role)) {
      res.status(403).json({ error: 'Apenas professores ou administradores podem editar a configuração' });
      return;
    }

    const payload = req.body as AthleteIndicatorConfigurationInput;
    const groups = await upsertAthleteIndicatorConfiguration(requester.academyId, payload);

    logAudit(
      requester.userId,
      'ATHLETE_PROGRESS_CONFIGURATION_UPDATED',
      'AthleteProgress',
      requester.academyId,
      requester.academyId,
      ipAddress,
      { groups: groups.length }
    );

    res.json({ success: true, data: { groups } });
  } catch (error) {
    console.error('[athleteProgress] updateAthleteProgressConfigurationHandler error:', error);
    res.status(500).json({ error: 'Erro ao atualizar configuração dos indicadores' });
  }
}

export async function getAthleteProgressHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const access = await authorizeAthleteProgressAccess(req, res);
    if (!access) {
      return;
    }

    const parsed = parseProgressQuery(req.query);
    if (parsed.error) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const { requester, athleteId, ipAddress } = access;
    const payload = await getAthleteProgressHistory(requester.academyId, athleteId, parsed.options);
    if (!payload) {
      res.status(404).json({ error: 'Atleta não encontrado' });
      return;
    }

    logAudit(
      requester.userId,
      'ATHLETE_PROGRESS_VIEWED',
      'AthleteProgress',
      athleteId,
      requester.academyId,
      ipAddress,
      parsed.options || {}
    );

    res.json({ success: true, data: payload });
  } catch (error) {
    console.error('[athleteProgress] getAthleteProgressHandler error:', error);
    res.status(500).json({ error: 'Erro ao consultar evolução do atleta' });
  }
}
