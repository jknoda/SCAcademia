import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { getUserById } from '../lib/database';
import { logAudit } from '../lib/audit';
import {
  createProfessorTurma,
  findOrCreateTrainingDraft,
  getProfessorTrainingEntryPointContext,
  getProfessorTurmaById,
  listEligibleTurmaStudents,
  listProfessorTurmas,
  updateProfessorTurma,
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

    // Optional custom date/time for registering past trainings
    const rawDate = asString(req.body?.sessionDate);
    const rawTime = asString(req.body?.sessionTime);

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

    if (rawDate && !dateRegex.test(rawDate)) {
      return res.status(400).json({ error: 'sessionDate deve estar no formato YYYY-MM-DD' });
    }
    if (rawTime && !timeRegex.test(rawTime)) {
      return res.status(400).json({ error: 'sessionTime deve estar no formato HH:MM ou HH:MM:SS' });
    }

    const sessionDate = rawDate || undefined;
    const sessionTime = rawTime ? (rawTime.length === 5 ? rawTime + ':00' : rawTime) : undefined;

    const turma = await getProfessorTurmaById(requester.academyId, requester.userId, turmaId);
    if (!turma) {
      return res.status(404).json({ error: 'Turma não encontrada para o professor atual' });
    }

    const result = await findOrCreateTrainingDraft({
      academyId: requester.academyId,
      professorId: requester.userId,
      turmaId,
      sessionDate,
      sessionTime,
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

export const createProfessorTurmaHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const turmaName = asString(req.body?.turmaName || req.body?.name);
    if (!turmaName) {
      return res.status(400).json({ error: 'turmaName é obrigatório' });
    }

    const description = asString(req.body?.description) || undefined;
    const rawScheduleJson = req.body?.scheduleJson;
    if (
      rawScheduleJson !== undefined &&
      (typeof rawScheduleJson !== 'object' || rawScheduleJson === null)
    ) {
      return res.status(400).json({ error: 'scheduleJson deve ser objeto ou array válido' });
    }

    const scheduleJson = rawScheduleJson;

    const rawStudentIds = req.body?.studentIds;
    const studentIds = rawStudentIds === undefined ? [] : rawStudentIds;
    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ error: 'studentIds deve ser um array de UUIDs' });
    }

    const normalizedStudentIds = [...new Set(
      studentIds
        .map((value: unknown) => asString(value))
        .filter((value: string) => value.length > 0)
    )];

    if (normalizedStudentIds.some((value) => !uuidRegex.test(value))) {
      return res.status(400).json({ error: 'studentIds deve conter apenas UUIDs válidos' });
    }

    const turma = await createProfessorTurma({
      academyId: requester.academyId,
      professorId: requester.userId,
      turmaName,
      description,
      scheduleJson,
      studentIds: normalizedStudentIds,
    });

    logAudit(
      requester.userId,
      'TURMA_CREATED',
      'Turma',
      turma.turmaId,
      requester.academyId,
      req.ip,
      { turmaName: turma.turmaName }
    );

    return res.status(201).json({
      message: 'Turma cadastrada com sucesso',
      turma,
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Já existe uma turma com esse nome para este professor' });
    }

    if (error?.code === '23514') {
      return res.status(400).json({ error: 'Dados da turma inválidos' });
    }

    if (error?.code === '23503') {
      return res.status(400).json({ error: 'Professor ou academia inválidos para cadastro da turma' });
    }

    if (error?.code === '22P02') {
      return res.status(400).json({ error: 'Formato inválido em scheduleJson' });
    }

    if (error?.message === 'studentIds inválidos para vínculo na turma') {
      return res.status(400).json({ error: 'Há alunos inválidos ou inativos na seleção da turma' });
    }

    if (error?.code === '42703') {
      return res.status(500).json({ error: 'Schema de turmas desatualizado. Execute as migrations de treinamento.' });
    }

    console.error('Erro ao cadastrar turma do professor:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      constraint: error?.constraint,
    });
    return res.status(500).json({ error: 'Erro ao cadastrar turma' });
  }
};

export const listProfessorTurmasHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const turmas = await listProfessorTurmas(requester.academyId, requester.userId);
    return res.json({
      turmas,
      total: turmas.length,
    });
  } catch (error) {
    console.error('Erro ao listar turmas do professor:', error);
    return res.status(500).json({ error: 'Erro ao listar turmas' });
  }
};

export const listEligibleTurmaStudentsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const queryName = asString(req.query?.['name']);
    const students = await listEligibleTurmaStudents(requester.academyId, queryName || undefined);

    return res.json({
      students,
      total: students.length,
      filters: {
        name: queryName || undefined,
      },
    });
  } catch (error) {
    console.error('Erro ao listar alunos elegíveis para turma:', error);
    return res.status(500).json({ error: 'Erro ao listar alunos elegíveis para turma' });
  }
};

export const updateProfessorTurmaHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const turmaId = asString(req.params?.turmaId);
    if (!turmaId || !uuidRegex.test(turmaId)) {
      return res.status(400).json({ error: 'turmaId deve ser um UUID válido' });
    }

    const turmaName = req.body?.turmaName === undefined ? undefined : asString(req.body?.turmaName);
    const description = req.body?.description === undefined ? undefined : asString(req.body?.description);
    const rawScheduleJson = req.body?.scheduleJson;
    const scheduleJson = rawScheduleJson === undefined
      ? undefined
      : (typeof rawScheduleJson === 'object' && rawScheduleJson !== null ? rawScheduleJson : undefined);
    const isActive = typeof req.body?.isActive === 'boolean' ? req.body.isActive : undefined;
    const rawStudentIds = req.body?.studentIds as unknown;
    const studentIds = rawStudentIds === undefined ? undefined : rawStudentIds;

    if (studentIds !== undefined && !Array.isArray(studentIds)) {
      return res.status(400).json({ error: 'studentIds deve ser um array de UUIDs' });
    }

    const normalizedStudentIds: string[] | undefined = studentIds === undefined
      ? undefined
      : [...new Set(
        (studentIds as unknown[])
          .map((value: unknown) => asString(value))
          .filter((value: string) => value.length > 0)
      )];

    if (normalizedStudentIds && normalizedStudentIds.some((value) => !uuidRegex.test(value))) {
      return res.status(400).json({ error: 'studentIds deve conter apenas UUIDs válidos' });
    }

    const updated = await updateProfessorTurma({
      academyId: requester.academyId,
      professorId: requester.userId,
      turmaId,
      turmaName,
      description,
      scheduleJson,
      isActive,
      studentIds: normalizedStudentIds,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Turma não encontrada para o professor atual' });
    }

    logAudit(
      requester.userId,
      'TURMA_UPDATED',
      'Turma',
      updated.turmaId,
      requester.academyId,
      req.ip,
      { isActive: updated.isActive }
    );

    return res.status(200).json({
      message: 'Turma atualizada com sucesso',
      turma: updated,
    });
  } catch (error: any) {
    if (error?.message === 'turmaName inválido') {
      return res.status(400).json({ error: 'turmaName inválido' });
    }

    if (error?.message === 'studentIds inválidos para vínculo na turma') {
      return res.status(400).json({ error: 'Há alunos inválidos ou inativos na seleção da turma' });
    }

    console.error('Erro ao atualizar turma do professor:', error);
    return res.status(500).json({ error: 'Erro ao atualizar turma' });
  }
};
