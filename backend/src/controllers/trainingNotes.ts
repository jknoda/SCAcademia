import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../lib/audit';
import {
  getSessionNotes,
  saveGeneralNotes,
  saveStudentNote,
} from '../lib/trainingNotes';

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getSessionNotesHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const sessionId = asString(req.params.sessionId);
    if (!sessionId || !uuidRegex.test(sessionId)) {
      return res.status(400).json({ error: 'sessionId deve ser um UUID válido' });
    }

    const response = await getSessionNotes(requester.academyId, requester.userId, sessionId);

    logAudit(
      requester.userId,
      'SESSION_NOTES_VIEWED',
      'TrainingNotes',
      sessionId,
      requester.academyId,
      req.ip
    );

    return res.status(200).json(response);
  } catch (error: any) {
    const message = error?.message || 'Erro ao carregar notas da sessão';
    const status = message.includes('não encontrada') ? 404 : 500;
    console.error('Erro ao carregar notas da sessão:', error);
    return res.status(status).json({ error: message });
  }
};

export const saveGeneralNotesHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const sessionId = asString(req.params.sessionId);
    const notesRaw = req.body?.notes;

    if (!sessionId || !uuidRegex.test(sessionId)) {
      return res.status(400).json({ error: 'sessionId deve ser um UUID válido' });
    }

    if (typeof notesRaw !== 'string') {
      return res.status(400).json({ error: 'notes deve ser string' });
    }

    await saveGeneralNotes({
      academyId: requester.academyId,
      professorId: requester.userId,
      sessionId,
      notes: notesRaw,
    });

    logAudit(
      requester.userId,
      'SESSION_GENERAL_NOTES_SAVED',
      'TrainingNotes',
      sessionId,
      requester.academyId,
      req.ip,
      { length: notesRaw.length }
    );

    return res.status(200).json({ success: true });
  } catch (error: any) {
    const message = error?.message || 'Erro ao salvar notas da sessão';
    const status = message.includes('não encontrada')
      ? 404
      : message.includes('não podem exceder')
        ? 400
        : 500;

    console.error('Erro ao salvar notas da sessão:', error);
    return res.status(status).json({ error: message });
  }
};

export const saveStudentNoteHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const sessionId = asString(req.params.sessionId);
    const studentId = asString(req.params.studentId);
    const contentRaw = req.body?.content;

    if (!sessionId || !uuidRegex.test(sessionId)) {
      return res.status(400).json({ error: 'sessionId deve ser um UUID válido' });
    }

    if (!studentId || !uuidRegex.test(studentId)) {
      return res.status(400).json({ error: 'studentId deve ser um UUID válido' });
    }

    if (typeof contentRaw !== 'string') {
      return res.status(400).json({ error: 'content deve ser string' });
    }

    await saveStudentNote({
      academyId: requester.academyId,
      professorId: requester.userId,
      sessionId,
      studentId,
      content: contentRaw,
    });

    logAudit(
      requester.userId,
      'SESSION_STUDENT_NOTE_SAVED',
      'TrainingNotes',
      sessionId,
      requester.academyId,
      req.ip,
      { studentId, length: contentRaw.length }
    );

    return res.status(200).json({ success: true });
  } catch (error: any) {
    const message = error?.message || 'Erro ao salvar anotação do aluno';
    const status = message.includes('não encontrada')
      ? 404
      : message.includes('não está presente')
        ? 403
        : message.includes('não pode exceder')
          ? 400
          : 500;

    console.error('Erro ao salvar anotação do aluno:', error);
    return res.status(status).json({ error: message });
  }
};
