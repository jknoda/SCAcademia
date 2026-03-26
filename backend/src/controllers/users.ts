import { Response } from 'express';
import {
  AuthenticatedRequest,
  AcademyProfileUpdateRequest,
  UserProfileUpdateRequest,
  ProfessorCreateRequest,
  ProfessorUpdateRequest,
  ProfessorStatusUpdateRequest,
  AdminResetProfessorPasswordRequest,
  StudentCreateRequest,
  StudentUpdateRequest,
  StudentStatusUpdateRequest,
  CreateAndLinkGuardianRequest,
  LinkGuardianRequest,
} from '../types';
import {
  getUserByIdIncludingDeleted,
  getUsersByAcademy,
  getAcademyById,
  updateAcademyProfile,
  updateUserProfile,
  getUserByEmail,
  createUser,
  listAcademyProfessors,
  updateProfessorProfile,
  updateProfessorStatus,
  getProfessorById,
  revokeAuthTokensByUser,
  updateUserPassword,
  listAcademyStudents,
  listProfessorStudents,
  getStudentById,
  getStudentByIdForProfessor,
  updateStudentProfile,
  updateStudentStatus,
  assignStudentToTurma,
  getTurmaByIdInAcademy,
  getStudentProfileView,
  searchGuardianByEmail,
  getGuardianById,
  getGuardianByEmail,
  linkGuardianToStudent,
  unlinkGuardianFromStudent,
  listMinorsWithoutGuardian,
  listStudentsWithoutHealthScreening,
} from '../lib/database';
import { hashPassword, validatePasswordStrength } from '../lib/password';
import { logAudit } from '../lib/audit';

const calculateAge = (birthDate: Date | string | null | undefined): number | null => {
  if (!birthDate) return null;

  const date = birthDate instanceof Date ? birthDate : new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age;
};

const isMinorFromBirthDate = (birthDate: string): boolean => {
  const age = calculateAge(birthDate);
  return age !== null && age < 18;
};

const buildTemporaryGuardianPassword = (): string => {
  const nonce = Math.floor(Math.random() * 9000 + 1000);
  return `RespTemp!${nonce}`;
};

const toUserProfileResponse = (user: any) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  academyId: user.academyId,
  documentId: user.documentId || '',
  birthDate: user.birthDate || null,
  phone: user.phone || '',
  addressStreet: user.addressStreet || '',
  addressNumber: user.addressNumber || '',
  addressComplement: user.addressComplement || '',
  addressNeighborhood: user.addressNeighborhood || '',
  addressPostalCode: user.addressPostalCode || '',
  addressCity: user.addressCity || '',
  addressState: user.addressState || '',
  dataEntrada: user.dataEntrada || null,
  dataSaida: user.dataSaida || null,
  isActive: typeof user.isActive === 'boolean' ? user.isActive : true,
});

const toStudentListItemResponse = (student: any) => ({
  ...toUserProfileResponse(student),
  age: calculateAge(student.birthDate),
  isMinor: student.necessitaConsentimentoResponsavel === true,
  faixa: student.faixa || '-',
  consentSignedAt: student.consentSignedAt || null,
});

const toStudentListItem = (student: any) => {
  const profile = toUserProfileResponse(student);
  const missingItems: string[] = [];

  if (student.hasHealthScreening !== true) {
    missingItems.push('anamnese');
  }

  if (student.necessitaConsentimentoResponsavel === true && student.hasGuardian !== true) {
    missingItems.push('responsavel');
  }

  return {
    ...profile,
    idade: calculateAge(student.birthDate),
    faixa: student.faixa || null,
    isMinor: typeof student.necessitaConsentimentoResponsavel === 'boolean'
      ? student.necessitaConsentimentoResponsavel
      : false,
    operationalStatus: {
      isReady: missingItems.length === 0,
      hasHealthScreening: student.hasHealthScreening === true,
      hasGuardian: student.hasGuardian === true,
      missingItems,
    },
  };
};

export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.params['userId'] as string;
    const callerAcademyId = req.user!.academyId;

    const user = await getUserByIdIncludingDeleted(userId);
    if (!user || user.academyId !== callerAcademyId) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.deletedAt) {
      return res.status(410).json({
        error: `Perfil deletado em ${new Date(user.deletedAt).toLocaleDateString('pt-BR')}`,
      });
    }

    res.json(toUserProfileResponse(user));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perfil do usuário' });
  }
};

export const updateOwnUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.params['userId'] as string;
    const academyId = req.user!.academyId;
    const payload = req.body as UserProfileUpdateRequest;

    const updated = await updateUserProfile(userId, academyId, {
      fullName: payload.fullName,
      documentId: payload.documentId,
      birthDate: payload.birthDate,
      phone: payload.phone,
      addressStreet: payload.addressStreet,
      addressNumber: payload.addressNumber,
      addressComplement: payload.addressComplement,
      addressNeighborhood: payload.addressNeighborhood,
      addressPostalCode: payload.addressPostalCode,
      addressCity: payload.addressCity,
      addressState: payload.addressState,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.json({
      message: 'Perfil atualizado',
      user: toUserProfileResponse(updated),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar perfil do usuário' });
  }
};

export const listAcademyUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const users = await getUsersByAcademy(academyId);

    res.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        academyId: u.academyId,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};

export const listProfessorsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const queryName = (req.query['name'] as string | undefined) || '';
    const queryStatus = ((req.query['status'] as string | undefined) || 'all').toLowerCase();

    const status = queryStatus === 'active' || queryStatus === 'inactive' ? queryStatus : 'all';

    const professors = await listAcademyProfessors(academyId, {
      name: queryName,
      status,
    });

    return res.json({
      professors: professors.map((professor) => toUserProfileResponse(professor)),
      filters: {
        name: queryName,
        status,
      },
      total: professors.length,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar professores' });
  }
};

export const createProfessorHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const adminUserId = req.user!.userId;
    const payload = req.body as ProfessorCreateRequest;

    const existingUser = await getUserByEmail(payload.email, academyId);
    if (existingUser) {
      return res.status(409).json({
        error: 'Email ja cadastrado para outro usuario desta academia',
        details: [{ field: 'email', message: 'Email ja cadastrado para outro usuario desta academia' }],
      });
    }

    const passwordValidation = validatePasswordStrength(payload.password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Senha não atende aos requisitos de segurança',
        details: passwordValidation.errors,
      });
    }

    const passwordHash = await hashPassword(payload.password);
    const professor = await createUser(
      payload.email,
      payload.fullName,
      passwordHash,
      academyId,
      'Professor',
      payload.birthDate ? new Date(payload.birthDate) : undefined,
      undefined,
      payload.dataEntrada ? new Date(payload.dataEntrada) : new Date()
    );

    const updatedProfessor = await updateProfessorProfile(professor.id, academyId, {
      fullName: payload.fullName,
      documentId: payload.documentId,
      birthDate: payload.birthDate,
      phone: payload.phone,
      addressStreet: payload.addressStreet,
      addressNumber: payload.addressNumber,
      addressComplement: payload.addressComplement,
      addressNeighborhood: payload.addressNeighborhood,
      addressPostalCode: payload.addressPostalCode,
      addressCity: payload.addressCity,
      addressState: payload.addressState,
      dataEntrada: payload.dataEntrada || new Date().toISOString().slice(0, 10),
    });

    const createdProfessor = updatedProfessor || professor;

    logAudit(adminUserId, 'USER_CREATED', 'User', createdProfessor.id, academyId, undefined, {
      role: 'Professor',
      fullName: createdProfessor.fullName,
      email: createdProfessor.email,
    });

    return res.status(201).json({
      message: `Professor ${createdProfessor.fullName} cadastrado com sucesso`,
      professor: toUserProfileResponse(createdProfessor),
      temporaryPassword: payload.password,
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({
        error: 'Email ja cadastrado para outro usuario desta academia',
        details: [{ field: 'email', message: 'Email ja cadastrado para outro usuario desta academia' }],
      });
    }

    return res.status(500).json({ error: 'Erro ao cadastrar professor' });
  }
};

export const updateProfessorHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const adminUserId = req.user!.userId;
    const userId = req.params['userId'] as string;
    const payload = req.body as ProfessorUpdateRequest;

    const existingProfessor = await getProfessorById(userId, academyId);
    if (!existingProfessor) {
      return res.status(404).json({ error: 'Professor não encontrado' });
    }

    const updated = await updateProfessorProfile(userId, academyId, {
      fullName: payload.fullName,
      documentId: payload.documentId,
      birthDate: payload.birthDate,
      phone: payload.phone,
      addressStreet: payload.addressStreet,
      addressNumber: payload.addressNumber,
      addressComplement: payload.addressComplement,
      addressNeighborhood: payload.addressNeighborhood,
      addressPostalCode: payload.addressPostalCode,
      addressCity: payload.addressCity,
      addressState: payload.addressState,
      dataEntrada: payload.dataEntrada,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Professor não encontrado' });
    }

    logAudit(adminUserId, 'USER_UPDATED', 'User', updated.id, academyId, undefined, {
      role: 'Professor',
      fullName: updated.fullName,
    });

    return res.json({
      message: 'Professor atualizado com sucesso',
      professor: toUserProfileResponse(updated),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar professor' });
  }
};

export const updateProfessorStatusHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const adminUserId = req.user!.userId;
    const userId = req.params['userId'] as string;
    const payload = req.body as ProfessorStatusUpdateRequest;

    const updated = await updateProfessorStatus(userId, academyId, payload.isActive);

    if (!updated) {
      return res.status(404).json({ error: 'Professor não encontrado' });
    }

    if (!payload.isActive) {
      await revokeAuthTokensByUser(updated.id);
    }

    logAudit(adminUserId, 'USER_STATUS_UPDATED', 'User', updated.id, academyId, undefined, {
      role: 'Professor',
      isActive: payload.isActive,
    });

    return res.json({
      message: payload.isActive ? 'Professor ativado com sucesso' : 'Professor desativado com sucesso',
      professor: toUserProfileResponse(updated),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar status do professor' });
  }
};

export const resetProfessorPasswordByAdminHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const adminUserId = req.user!.userId;
    const userId = req.params['userId'] as string;
    const payload = req.body as AdminResetProfessorPasswordRequest;

    const professor = await getProfessorById(userId, academyId);
    if (!professor) {
      return res.status(404).json({ error: 'Professor não encontrado' });
    }

    const passwordValidation = validatePasswordStrength(payload.newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Senha não atende aos requisitos de segurança',
        details: passwordValidation.errors,
      });
    }

    const passwordHash = await hashPassword(payload.newPassword);
    await updateUserPassword(professor.id, passwordHash);
    await revokeAuthTokensByUser(professor.id);

    logAudit(adminUserId, 'USER_PASSWORD_RESET', 'User', professor.id, academyId, undefined, {
      role: 'Professor',
      email: professor.email,
    });

    return res.json({ message: 'Senha do professor redefinida com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao redefinir senha do professor' });
  }
};

export const listStudentsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const queryName = (req.query['name'] as string | undefined) || '';
    const queryStatus = ((req.query['status'] as string | undefined) || 'all').toLowerCase();
    const status = queryStatus === 'active' || queryStatus === 'inactive' ? queryStatus : 'all';

    const students = await listAcademyStudents(academyId, {
      name: queryName,
      status,
    });

    return res.json({
      students: students.map(toStudentListItem),
      filters: {
        name: queryName,
        status,
      },
      total: students.length,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar alunos' });
  }
};

export const listMyStudentsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const professorId = req.user!.userId;
    const queryName = (req.query['name'] as string | undefined) || '';
    const queryStatus = ((req.query['status'] as string | undefined) || 'all').toLowerCase();
    const status = queryStatus === 'active' || queryStatus === 'inactive' ? queryStatus : 'all';

    const students = await listProfessorStudents(academyId, professorId, {
      name: queryName,
      status,
    });

    return res.json({
      students: students.map(toStudentListItem),
      filters: {
        name: queryName,
        status,
      },
      total: students.length,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar alunos do professor' });
  }
};

export const createStudentHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const actorUserId = req.user!.userId;
    const actorRole = req.user!.role;
    const payload = req.body as StudentCreateRequest;

    const expectedIsMinor = isMinorFromBirthDate(payload.birthDate);
    if (typeof payload.isMinor === 'boolean' && payload.isMinor !== expectedIsMinor) {
      return res.status(400).json({
        error: 'Inconsistencia entre birthDate e isMinor informado',
      });
    }

    const existingUser = await getUserByEmail(payload.email, academyId);
    if (existingUser) {
      return res.status(409).json({
        error: 'Email ja cadastrado para outro usuario desta academia',
        details: [{ field: 'email', message: 'Email ja cadastrado para outro usuario desta academia' }],
      });
    }

    const passwordValidation = validatePasswordStrength(payload.password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Senha não atende aos requisitos de segurança',
        details: passwordValidation.errors,
      });
    }

    if (payload.turmaId) {
      const turma = await getTurmaByIdInAcademy(academyId, payload.turmaId);
      if (!turma) {
        return res.status(400).json({
          error: 'Turma informada nao existe ou esta inativa',
        });
      }

      if (actorRole === 'Professor' && turma.professorId !== actorUserId) {
        return res.status(403).json({ error: 'Professor só pode vincular alunos às próprias turmas' });
      }
    }

    const passwordHash = await hashPassword(payload.password);
    const student = await createUser(
      payload.email,
      payload.fullName,
      passwordHash,
      academyId,
      'Aluno',
      new Date(payload.birthDate),
      payload.responsavelEmail,
      payload.dataEntrada ? new Date(payload.dataEntrada) : new Date()
    );

    const updatedStudent = await updateStudentProfile(student.id, academyId, {
      fullName: payload.fullName,
      documentId: payload.documentId,
      birthDate: payload.birthDate,
      phone: payload.phone,
      addressStreet: payload.addressStreet,
      addressNumber: payload.addressNumber,
      addressComplement: payload.addressComplement,
      addressNeighborhood: payload.addressNeighborhood,
      addressPostalCode: payload.addressPostalCode,
      addressCity: payload.addressCity,
      addressState: payload.addressState,
      dataEntrada: payload.dataEntrada || new Date().toISOString().slice(0, 10),
    });

    if (payload.turmaId) {
      await assignStudentToTurma(academyId, payload.turmaId, student.id);
    }

    const createdStudent = updatedStudent || student;
    const needsGuardianLink = createdStudent.necessitaConsentimentoResponsavel && !payload.responsavelEmail;

    logAudit(actorUserId, 'USER_CREATED', 'User', createdStudent.id, academyId, undefined, {
      role: 'Aluno',
      fullName: createdStudent.fullName,
      email: createdStudent.email,
      isMinor: createdStudent.necessitaConsentimentoResponsavel,
    });

    return res.status(201).json({
      message: `Aluno ${createdStudent.fullName} cadastrado com sucesso`,
      student: {
        ...toUserProfileResponse(createdStudent),
        idade: calculateAge(createdStudent.birthDate),
        isMinor: createdStudent.necessitaConsentimentoResponsavel,
      },
      temporaryPassword: payload.password,
      pendingGuardianLink: needsGuardianLink,
      warning: needsGuardianLink
        ? 'Aluno menor de idade - sera necessario vincular responsavel na Story 9.5'
        : null,
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({
        error: 'Email ja cadastrado para outro usuario desta academia',
        details: [{ field: 'email', message: 'Email ja cadastrado para outro usuario desta academia' }],
      });
    }

    return res.status(500).json({ error: 'Erro ao cadastrar aluno' });
  }
};

export const updateStudentHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const actorUserId = req.user!.userId;
    const actorRole = req.user!.role;
    const userId = req.params['userId'] as string;
    const payload = req.body as StudentUpdateRequest;

    const expectedIsMinor = isMinorFromBirthDate(payload.birthDate);
    if (typeof payload.isMinor === 'boolean' && payload.isMinor !== expectedIsMinor) {
      return res.status(400).json({
        error: 'Inconsistencia entre birthDate e isMinor informado',
      });
    }

    const existingStudent = actorRole === 'Professor'
      ? await getStudentByIdForProfessor(userId, academyId, actorUserId)
      : await getStudentById(userId, academyId);

    if (!existingStudent) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    const updated = await updateStudentProfile(userId, academyId, {
      fullName: payload.fullName,
      documentId: payload.documentId,
      birthDate: payload.birthDate,
      phone: payload.phone,
      addressStreet: payload.addressStreet,
      addressNumber: payload.addressNumber,
      addressComplement: payload.addressComplement,
      addressNeighborhood: payload.addressNeighborhood,
      addressPostalCode: payload.addressPostalCode,
      addressCity: payload.addressCity,
      addressState: payload.addressState,
      dataEntrada: payload.dataEntrada,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    logAudit(actorUserId, 'USER_UPDATED', 'User', updated.id, academyId, undefined, {
      role: 'Aluno',
      fullName: updated.fullName,
    });

    return res.json({
      message: 'Aluno atualizado com sucesso',
      student: {
        ...toUserProfileResponse(updated),
        idade: calculateAge(updated.birthDate),
        isMinor: updated.necessitaConsentimentoResponsavel,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar aluno' });
  }
};

export const updateStudentStatusHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const adminUserId = req.user!.userId;
    const userId = req.params['userId'] as string;
    const payload = req.body as StudentStatusUpdateRequest;

    const updated = await updateStudentStatus(userId, academyId, payload.isActive);

    if (!updated) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    if (!payload.isActive) {
      await revokeAuthTokensByUser(updated.id);
    }

    logAudit(adminUserId, 'USER_STATUS_UPDATED', 'User', updated.id, academyId, undefined, {
      role: 'Aluno',
      isActive: payload.isActive,
    });

    return res.json({
      message: payload.isActive ? 'Aluno ativado com sucesso' : 'Aluno desativado com sucesso',
      student: {
        ...toUserProfileResponse(updated),
        idade: calculateAge(updated.birthDate),
        isMinor: updated.necessitaConsentimentoResponsavel,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar status do aluno' });
  }
};

export const getStudentProfileViewHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const actorRole = req.user!.role;
    const actorUserId = req.user!.userId;
    const studentId = req.params['userId'] as string;

    const allowedStudent = actorRole === 'Professor'
      ? await getStudentByIdForProfessor(studentId, academyId, actorUserId)
      : await getStudentById(studentId, academyId);

    if (!allowedStudent) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    const profile = await getStudentProfileView(academyId, studentId);
    if (!profile) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    const student = toUserProfileResponse(profile.user);
    const isMinor = profile.user.necessitaConsentimentoResponsavel === true;

    return res.json({
      student: {
        ...student,
        idade: calculateAge(profile.user.birthDate),
        faixa: profile.faixa || null,
        isMinor,
      },
      lgpd: {
        consentSigned: Boolean(profile.consentSignedAt),
        consentSignedAt: profile.consentSignedAt || null,
      },
      health: {
        anamnesePreenchida: profile.healthRecordExists,
        lastUpdatedAt: profile.healthRecordUpdatedAt || null,
      },
      responsavel: profile.guardian
        ? {
          ...profile.guardian,
          pendenteVinculacao: false,
        }
        : {
          guardianId: null,
          guardianName: null,
          guardianEmail: null,
          relationship: null,
          isPrimary: false,
          pendenteVinculacao: isMinor,
          onboardingLink: '/stories/9-5-vinculacao-responsavel',
        },
      turmas: profile.turmas,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar ficha completa do aluno' });
  }
};

export const searchGuardianByEmailHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const email = String(req.query['email'] || '').trim();

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    const guardian = await searchGuardianByEmail(academyId, email);
    if (!guardian) {
      return res.status(404).json({ error: 'Responsável não encontrado' });
    }

    return res.json({ guardian });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar responsável por email' });
  }
};

export const linkGuardianToStudentHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const actorUserId = req.user!.userId;
    const studentId = req.params['userId'] as string;
    const payload = req.body as LinkGuardianRequest;

    const student = await getStudentById(studentId, academyId);
    if (!student) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    if (!student.necessitaConsentimentoResponsavel) {
      return res.status(400).json({ error: 'Vinculação de responsável permitida apenas para alunos menores de idade' });
    }

    const guardian = await getGuardianById(payload.guardianId, academyId);
    if (!guardian) {
      return res.status(404).json({ error: 'Responsável não encontrado' });
    }

    const link = await linkGuardianToStudent(
      academyId,
      studentId,
      guardian.id,
      payload.relationship,
      payload.isPrimary !== false
    );

    logAudit(actorUserId, 'GUARDIAN_LINKED', 'User', studentId, academyId, req.ip, {
      guardianId: guardian.id,
      guardianEmail: guardian.email,
      relationship: link.relationship || null,
      isPrimary: link.isPrimary,
      consentStatus: 'pending',
    });

    return res.status(201).json({
      message: 'Responsável vinculado com sucesso. Consentimento do aluno marcado como pendente de assinatura.',
      guardian: {
        guardianId: guardian.id,
        fullName: guardian.fullName,
        email: guardian.email,
        relationship: link.relationship || null,
        isPrimary: link.isPrimary,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao vincular responsável ao aluno' });
  }
};

export const createAndLinkGuardianHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const actorUserId = req.user!.userId;
    const studentId = req.params['userId'] as string;
    const payload = req.body as CreateAndLinkGuardianRequest;

    const student = await getStudentById(studentId, academyId);
    if (!student) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    if (!student.necessitaConsentimentoResponsavel) {
      return res.status(400).json({ error: 'Vinculação de responsável permitida apenas para alunos menores de idade' });
    }

    const existingByEmail = await getUserByEmail(payload.email, academyId);
    if (existingByEmail && existingByEmail.role !== 'Responsavel') {
      return res.status(409).json({
        error: 'Email já cadastrado para outro perfil na academia',
      });
    }

    let guardian = await getGuardianByEmail(academyId, payload.email);
    let temporaryPassword: string | undefined;

    if (!guardian) {
      temporaryPassword = buildTemporaryGuardianPassword();
      const passwordHash = await hashPassword(temporaryPassword);

      guardian = await createUser(
        payload.email,
        payload.fullName,
        passwordHash,
        academyId,
        'Responsavel'
      );

      await updateUserProfile(guardian.id, academyId, {
        fullName: payload.fullName,
        documentId: payload.documentId,
        phone: payload.phone,
      });
    }

    const link = await linkGuardianToStudent(
      academyId,
      studentId,
      guardian.id,
      payload.relationship,
      payload.isPrimary !== false
    );

    logAudit(actorUserId, 'GUARDIAN_CREATED_AND_LINKED', 'User', studentId, academyId, req.ip, {
      guardianId: guardian.id,
      guardianEmail: guardian.email,
      createdGuardian: Boolean(temporaryPassword),
      relationship: link.relationship || null,
      isPrimary: link.isPrimary,
      consentStatus: 'pending',
    });

    return res.status(201).json({
      message: temporaryPassword
        ? 'Responsável criado e vinculado com sucesso. Consentimento do aluno marcado como pendente de assinatura.'
        : 'Responsável existente vinculado com sucesso. Consentimento do aluno marcado como pendente de assinatura.',
      guardian: {
        guardianId: guardian.id,
        fullName: guardian.fullName,
        email: guardian.email,
        relationship: link.relationship || null,
        isPrimary: link.isPrimary,
      },
      temporaryPassword,
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Este responsável já está vinculado ao aluno informado' });
    }

    return res.status(500).json({ error: 'Erro ao criar e vincular responsável' });
  }
};

export const unlinkGuardianFromStudentHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const actorUserId = req.user!.userId;
    const studentId = req.params['userId'] as string;
    const guardianId = req.params['guardianId'] as string;

    const student = await getStudentById(studentId, academyId);
    if (!student) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    if (!student.necessitaConsentimentoResponsavel) {
      return res.status(400).json({ error: 'Desvinculação de responsável permitida apenas para alunos menores de idade' });
    }

    const removed = await unlinkGuardianFromStudent(academyId, studentId, guardianId);
    if (!removed) {
      return res.status(404).json({ error: 'Vínculo de responsável não encontrado para este aluno' });
    }

    logAudit(actorUserId, 'GUARDIAN_UNLINKED', 'User', studentId, academyId, req.ip, {
      guardianId,
      consentStatus: 'pending',
    });

    return res.json({
      message: 'Responsável desvinculado com sucesso. Consentimento do aluno retornou para pendente.',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao desvincular responsável do aluno' });
  }
};

export const listMinorsWithoutGuardianHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const students = await listMinorsWithoutGuardian(academyId);

    return res.json({
      students: students.map((student) => ({
        studentId: student.studentId,
        fullName: student.fullName,
        birthDate: student.birthDate || null,
        idade: calculateAge(student.birthDate),
        isActive: student.isActive,
      })),
      total: students.length,
      filter: 'minors-without-guardian',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar menores sem responsável vinculado' });
  }
};

export const listStudentsWithoutHealthScreeningHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const students = await listStudentsWithoutHealthScreening(academyId);

    return res.json({
      students: students.map((student) => {
        const idade = calculateAge(student.birthDate);
        const isMinor = idade !== null && idade < 18;

        return {
          studentId: student.studentId,
          fullName: student.fullName,
          birthDate: student.birthDate || null,
          idade,
          faixa: student.faixa || null,
          isMinor,
          isActive: student.isActive,
          operationalStatus: {
            isReady: false,
            hasHealthScreening: false,
            hasGuardian: student.hasGuardian,
            missingItems: isMinor && !student.hasGuardian ? ['anamnese', 'responsavel'] : ['anamnese'],
          },
        };
      }),
      total: students.length,
      filter: 'students-without-health-screening',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar alunos sem anamnese preenchida' });
  }
};

export const getAcademyInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const academy = await getAcademyById(academyId);
    if (!academy) {
      return res.status(404).json({ error: 'Academia não encontrada' });
    }
    res.json({ id: academy.id, name: academy.name });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar informações da academia' });
  }
};

export const getAcademyProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const academy = await getAcademyById(academyId);

    if (!academy) {
      return res.status(404).json({ error: 'Academia não encontrada' });
    }

    return res.json({
      academyId: academy.id,
      name: academy.name,
      description: academy.description || '',
      documentId: academy.documentId || '',
      contactEmail: academy.contactEmail || academy.email || '',
      contactPhone: academy.contactPhone || academy.phone || '',
      addressStreet: academy.addressStreet || '',
      addressNumber: academy.addressNumber || '',
      addressComplement: academy.addressComplement || '',
      addressNeighborhood: academy.addressNeighborhood || '',
      addressPostalCode: academy.addressPostalCode || '',
      addressCity: academy.addressCity || '',
      addressState: academy.addressState || '',
      isActive: academy.isActive,
      maxUsers: academy.maxUsers,
      storageLimitGb: academy.storageLimitGb,
      createdAt: academy.createdAt,
      updatedAt: academy.updatedAt,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar perfil da academia' });
  }
};

export const updateAcademyProfileHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const payload = req.body as AcademyProfileUpdateRequest;

    const academy = await updateAcademyProfile(academyId, {
      name: payload.name,
      description: payload.description,
      documentId: payload.documentId,
      contactEmail: payload.contactEmail,
      contactPhone: payload.contactPhone,
      addressStreet: payload.addressStreet,
      addressNumber: payload.addressNumber,
      addressComplement: payload.addressComplement,
      addressNeighborhood: payload.addressNeighborhood,
      addressPostalCode: payload.addressPostalCode,
      addressCity: payload.addressCity,
      addressState: payload.addressState,
    });

    if (!academy) {
      return res.status(404).json({ error: 'Academia não encontrada' });
    }

    return res.json({
      message: 'Dados da academia atualizados',
      academy: {
        academyId: academy.id,
        name: academy.name,
        description: academy.description || '',
        documentId: academy.documentId || '',
        contactEmail: academy.contactEmail || academy.email || '',
        contactPhone: academy.contactPhone || academy.phone || '',
        addressStreet: academy.addressStreet || '',
        addressNumber: academy.addressNumber || '',
        addressComplement: academy.addressComplement || '',
        addressNeighborhood: academy.addressNeighborhood || '',
        addressPostalCode: academy.addressPostalCode || '',
        addressCity: academy.addressCity || '',
        addressState: academy.addressState || '',
        isActive: academy.isActive,
        maxUsers: academy.maxUsers,
        storageLimitGb: academy.storageLimitGb,
        createdAt: academy.createdAt,
        updatedAt: academy.updatedAt,
      },
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({
        error: 'Documento já cadastrado no sistema',
        details: [{ field: 'documentId', message: 'Documento já cadastrado no sistema' }],
      });
    }

    return res.status(500).json({ error: 'Erro ao atualizar perfil da academia' });
  }
};
