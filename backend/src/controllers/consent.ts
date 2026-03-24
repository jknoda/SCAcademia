import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import {
  validateConsentToken,
  ensureActiveTemplateByType,
  getTemplateByVersion,
  signConsents,
  createConsentRequest,
  getConsentStatus,
  seedDefaultTemplates,
} from '../lib/consents';
import { getUserById } from '../lib/database';
import { logAudit } from '../lib/audit';
import { sendConsentEmail } from '../lib/email';

const paramAsString = (value: string | string[] | undefined): string | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
};

// GET /api/consent/:token/validate — público (guest flow)
export const validateTokenHandler = async (req: Request, res: Response) => {
  try {
    const token = paramAsString(req.params.token);
    if (!token) {
      return res.status(400).json({ error: 'Token inválido' });
    }

    const data = await validateConsentToken(token);

    if (!data) {
      return res.status(404).json({ error: 'Link inválido ou expirado. Solicite um novo link à academia.' });
    }

    return res.json({
      isValid: true,
      studentName: data.studentName,
      academyName: data.academyName,
      expiresAt: data.expiresAt,
      isReconsent: data.isReconsent || false,
      previousVersion: data.previousVersion,
      newVersion: data.newVersion,
    });
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return res.status(500).json({ error: 'Erro ao validar link de consentimento' });
  }
};

// GET /api/consent/:token/template/:type — público
export const getTemplateHandler = async (req: Request, res: Response) => {
  try {
    const token = paramAsString(req.params.token);
    const type = paramAsString(req.params.type);

    if (!token || !type) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    if (!['health', 'ethics', 'privacy'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de template inválido' });
    }

    const tokenData = await validateConsentToken(token);
    if (!tokenData) {
      return res.status(404).json({ error: 'Link inválido ou expirado' });
    }

    const template = await ensureActiveTemplateByType(
      tokenData.academyId,
      type as 'health' | 'ethics' | 'privacy'
    );

    if (!template) {
      return res.status(404).json({ error: 'Template de consentimento não encontrado' });
    }

    return res.json({
      version: template.version,
      consentType: template.consentType,
      content: template.content,
    });
  } catch (error) {
    console.error('Erro ao carregar template:', error);
    return res.status(500).json({ error: 'Erro ao carregar termos de consentimento' });
  }
};

// GET /api/consent/:token/template/:type/version/:version — público (for re-consent comparison)
export const getTemplateByVersionHandler = async (req: Request, res: Response) => {
  try {
    const token = paramAsString(req.params.token);
    const type = paramAsString(req.params.type);
    const version = paramAsString(req.params.version);

    if (!token || !type || !version) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    if (!['health', 'ethics', 'privacy'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de template inválido' });
    }

    const tokenData = await validateConsentToken(token);
    if (!tokenData) {
      return res.status(404).json({ error: 'Link inválido ou expirado' });
    }

    const versionNum = parseFloat(version);
    if (isNaN(versionNum)) {
      return res.status(400).json({ error: 'Versão inválida' });
    }

    const template = await getTemplateByVersion(
      tokenData.academyId,
      type as 'health' | 'ethics' | 'privacy',
      versionNum
    );

    if (!template) {
      return res.status(404).json({ error: 'Versão do template não encontrada' });
    }

    return res.json({
      version: template.version,
      consentType: template.consentType,
      content: template.content,
    });
  } catch (error) {
    console.error('Erro ao carregar versão do template:', error);
    return res.status(500).json({ error: 'Erro ao carregar versão do template' });
  }
};

// POST /api/consent/:token/sign — público (guest flow)
export const signConsentHandler = async (req: Request, res: Response) => {
  try {
    const token = paramAsString(req.params.token);
    if (!token) {
      return res.status(400).json({ error: 'Token inválido' });
    }

    const { signatureBase64 } = req.body;

    const tokenData = await validateConsentToken(token);
    if (!tokenData) {
      return res.status(404).json({ error: 'Link inválido ou expirado' });
    }

    const result = await signConsents(token, signatureBase64, null);

    logAudit(
      tokenData.studentId,
      'CONSENT_SIGNED',
      'Consent',
      tokenData.studentId,
      tokenData.academyId,
      req.ip,
      { consentTypes: ['privacy', 'health', 'ethics'] }
    );

    return res.json({
      message: 'Consentimento registrado com sucesso',
      studentName: result.studentName,
    });
  } catch (error: any) {
    if (error.message === 'TOKEN_INVALID') {
      return res.status(404).json({ error: 'Link inválido ou expirado' });
    }
    console.error('Erro ao registrar consentimento:', error);
    return res.status(500).json({ error: 'Erro ao registrar consentimento' });
  }
};

// POST /api/admin/students/:studentId/resend-consent — Auth: Admin
export const resendConsentHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== 'Admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const studentId = paramAsString(req.params.studentId);
    if (!studentId) {
      return res.status(400).json({ error: 'Parâmetro studentId inválido' });
    }

    const student = await getUserById(studentId);

    if (!student) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    if (student.academyId !== req.user!.academyId) {
      return res.status(403).json({ error: 'Aluno não pertence a esta academia' });
    }

    if (!student.necessitaConsentimentoResponsavel) {
      return res.status(400).json({ error: 'Aluno não é menor de idade ou não precisa de consentimento' });
    }

    if (!student.responsavelEmail) {
      return res.status(400).json({ error: 'Email do responsável não cadastrado' });
    }

    const token = await createConsentRequest(studentId, student.academyId);

    const consentLink = `http://localhost:4200/consent/${token}`;
    await sendConsentEmail(student.responsavelEmail, student.fullName, consentLink);

    logAudit(
      req.user!.userId,
      'CONSENT_EMAIL_SENT',
      'Consent',
      studentId,
      req.user!.academyId,
      req.ip,
      { responsavelEmail: student.responsavelEmail, studentName: student.fullName }
    );

    return res.json({
      message: 'Link de consentimento enviado com sucesso',
      consentLink, // Retornar para facilitar testes (remover em produção)
    });
  } catch (error) {
    console.error('Erro ao reenviar consentimento:', error);
    return res.status(500).json({ error: 'Erro ao reenviar link de consentimento' });
  }
};

// GET /api/admin/students/:studentId/consent-status — Auth: Admin
export const getConsentStatusHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== 'Admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const studentId = paramAsString(req.params.studentId);
    if (!studentId) {
      return res.status(400).json({ error: 'Parâmetro studentId inválido' });
    }

    const status = await getConsentStatus(studentId);

    return res.json({ studentId, status });
  } catch (error) {
    console.error('Erro ao obter status de consentimento:', error);
    return res.status(500).json({ error: 'Erro ao obter status de consentimento' });
  }
};
