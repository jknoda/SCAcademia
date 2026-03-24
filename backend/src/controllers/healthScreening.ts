import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../lib/audit';
import { getUserById } from '../lib/database';
import {
  createHealthRecord,
  getHealthRecordByStudent,
  updateHealthRecord,
  HealthRecord,
} from '../lib/healthRecords';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Returns a partial view of the health record shown to professors. */
const maskForProfessor = (r: HealthRecord) => ({
  healthRecordId: r.healthRecordId,
  userId: r.userId,
  bloodType: r.bloodType,
  weightKg: r.weightKg,
  heightCm: r.heightCm,
  hypertension: r.hypertension,
  diabetes: r.diabetes,
  cardiac: r.cardiac,
  labyrinthitis: r.labyrinthitis,
  asthmaBronchitis: r.asthmaBronchitis,
  epilepsySeizures: r.epilepsySeizures,
  stressDepression: r.stressDepression,
  allergies: r.allergies,
  healthScreeningNotes: r.healthScreeningNotes,
  updatedAt: r.updatedAt,
});

// ── Handlers ───────────────────────────────────────────────────────────────────

/**
 * GET /api/health-screening/:studentId
 * Allowed roles: Admin, Professor (limited fields), Responsavel
 */
export const getHealthScreeningHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { studentId } = req.params as { studentId: string };
    const { role, academyId, userId } = req.user!;

    if (!['Admin', 'Professor', 'Responsavel'].includes(role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const student = await getUserById(studentId);
    if (!student || student.academyId !== academyId || student.role !== 'Aluno') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    const record = await getHealthRecordByStudent(studentId);
    if (!record) {
      return res.status(404).json({ error: 'Anamnese não encontrada' });
    }

    logAudit(userId, 'HEALTH_RECORD_VIEWED', 'HealthRecord', record.healthRecordId, academyId, req.ip);

    const data = role === 'Professor' ? maskForProfessor(record) : record;
    return res.json({ healthRecord: data });
  } catch (error) {
    console.error('Erro ao buscar anamnese:', error);
    return res.status(500).json({ error: 'Erro ao buscar anamnese' });
  }
};

/**
 * POST /api/health-screening/:studentId
 * Allowed roles: Admin, Responsavel
 */
export const createHealthScreeningHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { studentId } = req.params as { studentId: string };
    const { role, academyId, userId } = req.user!;

    if (!['Admin', 'Responsavel'].includes(role)) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores e responsáveis podem criar anamnese.' });
    }

    const student = await getUserById(studentId);
    if (!student || student.academyId !== academyId || student.role !== 'Aluno') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    const existing = await getHealthRecordByStudent(studentId);
    if (existing) {
      return res.status(409).json({
        error: 'Anamnese já existe para este aluno. Use PUT para atualizar.',
        healthRecordId: existing.healthRecordId,
      });
    }

    const {
      bloodType, weightKg, heightCm,
      hypertension, diabetes, cardiac, labyrinthitis,
      asthmaBronchitis, epilepsySeizures, stressDepression,
      healthScreeningNotes, allergies, medications,
      existingConditions, emergencyContactName, emergencyContactPhone,
    } = req.body;

    const record = await createHealthRecord({
      userId: studentId,
      academyId,
      bloodType,
      weightKg,
      heightCm,
      hypertension,
      diabetes,
      cardiac,
      labyrinthitis,
      asthmaBronchitis,
      epilepsySeizures,
      stressDepression,
      healthScreeningNotes,
      allergies,
      medications,
      existingConditions,
      emergencyContactName,
      emergencyContactPhone,
      createdByUserId: userId,
    });

    logAudit(userId, 'HEALTH_RECORD_CREATED', 'HealthRecord', record.healthRecordId, academyId, req.ip, { studentId });

    return res.status(201).json({
      healthRecordId: record.healthRecordId,
      message: 'Anamnese criada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao criar anamnese:', error);
    return res.status(500).json({ error: 'Erro ao criar anamnese' });
  }
};

/**
 * PUT /api/health-screening/:studentId
 * Allowed roles: Admin (full update), Professor (notes only)
 */
export const updateHealthScreeningHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { studentId } = req.params as { studentId: string };
    const { role, academyId, userId } = req.user!;

    if (!['Admin', 'Professor'].includes(role)) {
      return res.status(403).json({ error: 'Acesso negado. Responsáveis não podem editar a anamnese.' });
    }

    const student = await getUserById(studentId);
    if (!student || student.academyId !== academyId || student.role !== 'Aluno') {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    const record = await getHealthRecordByStudent(studentId);
    if (!record) {
      return res.status(404).json({ error: 'Anamnese não encontrada. Use POST para criar.' });
    }

    // Professor only updates notes
    const updateInput =
      role === 'Professor'
        ? { healthScreeningNotes: req.body.healthScreeningNotes }
        : req.body;

    const updated = await updateHealthRecord(record.healthRecordId, updateInput);
    if (!updated) {
      return res.status(500).json({ error: 'Erro ao atualizar anamnese' });
    }

    logAudit(userId, 'HEALTH_RECORD_UPDATED', 'HealthRecord', record.healthRecordId, academyId, req.ip, {
      role,
      fieldsChanged: Object.keys(updateInput).filter(k => updateInput[k as keyof typeof updateInput] !== undefined),
    });

    return res.json({ message: 'Anamnese atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar anamnese:', error);
    return res.status(500).json({ error: 'Erro ao atualizar anamnese' });
  }
};
