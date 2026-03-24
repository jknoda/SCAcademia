import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../lib/audit';
import {
  AttendanceStatus,
  getTrainingAttendance,
  upsertTrainingAttendance,
} from '../lib/trainingAttendance';

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const allowedStatus: AttendanceStatus[] = ['present', 'absent', 'justified'];

export const getTrainingAttendanceHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const sessionId = asString(req.params.sessionId);
    if (!sessionId || !uuidRegex.test(sessionId)) {
      return res.status(400).json({ error: 'sessionId deve ser um UUID válido' });
    }

    const attendance = await getTrainingAttendance(
      requester.academyId,
      requester.userId,
      sessionId
    );

    if (!attendance) {
      return res.status(404).json({ error: 'Sessão não encontrada para o professor atual' });
    }

    logAudit(
      requester.userId,
      'TRAINING_ATTENDANCE_VIEWED',
      'TrainingAttendance',
      sessionId,
      requester.academyId,
      req.ip
    );

    return res.status(200).json(attendance);
  } catch (error) {
    console.error('Erro ao carregar frequência da sessão:', error);
    return res.status(500).json({ error: 'Erro ao carregar frequência da sessão' });
  }
};

export const upsertTrainingAttendanceHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const sessionId = asString(req.params.sessionId);
    const studentId = asString(req.body?.studentId);
    const status = asString(req.body?.status) as AttendanceStatus;

    if (!sessionId || !uuidRegex.test(sessionId)) {
      return res.status(400).json({ error: 'sessionId deve ser um UUID válido' });
    }

    if (!studentId || !uuidRegex.test(studentId)) {
      return res.status(400).json({ error: 'studentId deve ser um UUID válido' });
    }

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ error: 'status deve ser present, absent ou justified' });
    }

    const updated = await upsertTrainingAttendance({
      academyId: requester.academyId,
      professorId: requester.userId,
      sessionId,
      studentId,
      status,
    });

    if (!updated) {
      return res.status(404).json({
        error: 'Sessão ou aluno não encontrado para o professor atual',
      });
    }

    logAudit(
      requester.userId,
      'TRAINING_ATTENDANCE_MARKED',
      'TrainingAttendance',
      sessionId,
      requester.academyId,
      req.ip,
      { studentId, status }
    );

    return res.status(200).json({
      message: 'Frequência atualizada com sucesso',
      sessionId: updated.sessionId,
      studentId: updated.studentId,
      status: updated.status,
      warning: updated.status === 'present' && updated.hasHealthScreening !== true
        ? 'Aluno sem anamnese preenchida. Recomendamos preencher antes de registrar treino.'
        : null,
      totals: updated.totals,
    });
  } catch (error) {
    console.error('Erro ao salvar frequência da sessão:', error);
    return res.status(500).json({ error: 'Erro ao salvar frequência da sessão' });
  }
};
