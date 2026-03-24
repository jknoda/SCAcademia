import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { getUserById } from '../lib/database';
import { logAudit } from '../lib/audit';
import {
  cancelDeletionRequest,
  createDeletionRequest,
  getStudentDeletionStatus,
  hasPendingDeletionRequest,
  isGuardianOfStudent,
  listGuardianStudents,
  listPendingDeletionRequests,
  processDueDeletionRequests,
} from '../lib/deletionRequests';

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export const requestStudentDeletionHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    const studentId = asString(req.params.studentId);
    const reason = asString(req.body?.reason);

    if (!studentId) {
      return res.status(400).json({ error: 'studentId é obrigatório' });
    }

    if (!['Admin', 'Responsavel'].includes(requester.role)) {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const student = await getUserById(studentId);
    if (!student || student.academyId !== requester.academyId || student.role !== 'Aluno') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    if (requester.role === 'Responsavel') {
      const allowed = await isGuardianOfStudent(requester.academyId, requester.userId, studentId);
      if (!allowed) {
        return res.status(403).json({ error: 'Acesso negado. Responsável não vinculado ao aluno.' });
      }
    }

    if (await hasPendingDeletionRequest(requester.academyId, studentId)) {
      return res.status(409).json({ error: 'Já existe solicitação de deleção pendente para este aluno.' });
    }

    const created = await createDeletionRequest(requester.academyId, studentId, requester.userId, reason || undefined);

    logAudit(
      requester.userId,
      'DATA_DELETION_REQUESTED',
      'User',
      studentId,
      requester.academyId,
      req.ip,
      {
        deletionRequestId: created.deletionRequestId,
        deletionScheduledAt: created.deletionScheduledAt,
        reason: created.reason || null,
      }
    );

    return res.status(201).json({
      message: 'Solicitação de deleção registrada com sucesso',
      request: created,
    });
  } catch (error) {
    console.error('Erro ao solicitar deleção de aluno:', error);
    return res.status(500).json({ error: 'Erro ao registrar solicitação de deleção' });
  }
};

export const listPendingDeletionRequestsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== 'Admin') {
      return res.status(403).json({ error: 'Acesso negado. Privilégios de administrador necessários' });
    }

    const items = await listPendingDeletionRequests(req.user!.academyId);
    return res.json({ requests: items });
  } catch (error) {
    console.error('Erro ao listar solicitações de deleção:', error);
    return res.status(500).json({ error: 'Erro ao listar solicitações de deleção' });
  }
};

export const getStudentDeletionStatusHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    const studentId = asString(req.params.studentId);

    if (!studentId) {
      return res.status(400).json({ error: 'studentId é obrigatório' });
    }

    if (!['Admin', 'Responsavel'].includes(requester.role)) {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    if (requester.role === 'Responsavel') {
      const allowed = await isGuardianOfStudent(requester.academyId, requester.userId, studentId);
      if (!allowed) {
        return res.status(403).json({ error: 'Acesso negado. Responsável não vinculado ao aluno.' });
      }
    }

    const status = await getStudentDeletionStatus(requester.academyId, studentId);
    if (!status) {
      return res.status(404).json({ error: 'Nenhuma solicitação de deleção encontrada para este aluno.' });
    }

    return res.json({ request: status });
  } catch (error) {
    console.error('Erro ao obter status de deleção:', error);
    return res.status(500).json({ error: 'Erro ao obter status de deleção' });
  }
};

export const listLinkedStudentsForGuardianHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Responsavel') {
      return res.status(403).json({ error: 'Acesso negado. Apenas responsáveis podem consultar filhos vinculados.' });
    }

    const students = await listGuardianStudents(requester.academyId, requester.userId);
    return res.json({ students });
  } catch (error) {
    console.error('Erro ao listar filhos vinculados do responsável:', error);
    return res.status(500).json({ error: 'Erro ao listar filhos vinculados' });
  }
};

export const cancelDeletionRequestHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== 'Admin') {
      return res.status(403).json({ error: 'Acesso negado. Privilégios de administrador necessários' });
    }

    const deletionRequestId = asString(req.params.requestId);
    if (!deletionRequestId) {
      return res.status(400).json({ error: 'requestId é obrigatório' });
    }

    const cancelled = await cancelDeletionRequest(req.user!.academyId, deletionRequestId);
    if (!cancelled) {
      return res.status(404).json({ error: 'Solicitação pendente não encontrada ou prazo expirado para cancelamento' });
    }

    logAudit(
      req.user!.userId,
      'DATA_DELETION_CANCELLED',
      'User',
      cancelled.studentId,
      req.user!.academyId,
      req.ip,
      {
        deletionRequestId,
      }
    );

    return res.json({ message: 'Solicitação de deleção cancelada com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar solicitação de deleção:', error);
    return res.status(500).json({ error: 'Erro ao cancelar solicitação de deleção' });
  }
};

export const processDueDeletionRequestsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== 'Admin') {
      return res.status(403).json({ error: 'Acesso negado. Privilégios de administrador necessários' });
    }

    const processed = await processDueDeletionRequests(req.user!.academyId, req.user!.userId);

    for (const item of processed) {
      logAudit(
        req.user!.userId,
        'DATA_DELETION_PROCESSED',
        'User',
        item.studentId,
        req.user!.academyId,
        req.ip,
        {
          deletionRequestId: item.deletionRequestId,
          processedAt: item.processedAt,
        }
      );
    }

    return res.json({
      message: 'Processamento concluído',
      processedCount: processed.length,
      processed,
    });
  } catch (error) {
    console.error('Erro ao processar solicitações vencidas de deleção:', error);
    return res.status(500).json({ error: 'Erro ao processar solicitações de deleção' });
  }
};
