import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { getAcademyById } from '../lib/database';
import { getActiveTemplatesByAcademy, publishConsentTemplateVersion } from '../lib/consents';
import { logAudit } from '../lib/audit';
import { sendReconsentEmail } from '../lib/email';

export const listConsentTemplatesHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const academy = await getAcademyById(academyId);

    if (!academy) {
      return res.status(404).json({ error: 'Academia não encontrada' });
    }

    const templates = await getActiveTemplatesByAcademy(academyId);

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    return res.json({
      academyId,
      academyName: academy.name,
      templates: templates.map((template) => ({
        consentType: template.consentType,
        version: template.version.toFixed(1),
        content: template.content,
        effectiveAt: template.effectiveAt,
      })),
    });
  } catch (error) {
    console.error('Erro ao listar templates de consentimento:', error);
    return res.status(500).json({ error: 'Erro ao listar templates de consentimento' });
  }
};

export const publishConsentTemplatesHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const academy = await getAcademyById(academyId);

    if (!academy) {
      return res.status(404).json({ error: 'Academia não encontrada' });
    }

    const { healthContent, ethicsContent, privacyContent, bumpType } = req.body;

    const result = await publishConsentTemplateVersion(academyId, {
      healthContent,
      ethicsContent,
      privacyContent,
      bumpType,
    });

    logAudit(req.user!.userId, 'CONSENT_TEMPLATE_PUBLISHED', 'ConsentTemplate', academyId, academyId, req.ip, {
      version: result.version.toFixed(1),
      bumpType: bumpType || 'minor',
      affectedStudents: result.affectedStudents.length,
    });

    // Send re-consent emails to guardians (when guardian emails are available)
    let emailsSent = 0;
    let emailsSkipped = 0;
    for (const student of result.affectedStudents) {
      if (student.guardianEmail) {
        const emailSent = await sendReconsentEmail(
          student.guardianEmail,
          student.studentName,
          student.previousVersion.toFixed(1),
          student.newVersion.toFixed(1),
          student.consentLink
        );
        if (emailSent) {
          emailsSent++;
          logAudit(req.user!.userId, 'RECONSENT_EMAIL_SENT', 'ConsentEmail', student.studentId, academyId, req.ip, {
            studentName: student.studentName,
            to: student.guardianEmail,
            version: `${student.previousVersion.toFixed(1)} -> ${student.newVersion.toFixed(1)}`,
          });
        } else {
          logAudit(req.user!.userId, 'RECONSENT_EMAIL_FAILED', 'ConsentEmail', student.studentId, academyId, req.ip, {
            studentName: student.studentName,
            to: student.guardianEmail,
          });
        }
      } else {
        emailsSkipped++;
        logAudit(req.user!.userId, 'RECONSENT_NO_EMAIL', 'ConsentEmail', student.studentId, academyId, req.ip, {
          studentName: student.studentName,
          reason: 'Guardian email not on file',
        });
      }
    }

    return res.status(201).json({
      message: `✓ Nova versão publicada. ${result.affectedStudents.length} aluno(s)/responsável(eis) necessitam reconsentimento.`,
      version: result.version.toFixed(1),
      templates: result.templates.map((template) => ({
        consentType: template.consentType,
        version: template.version.toFixed(1),
        content: template.content,
        effectiveAt: template.effectiveAt,
      })),
      affectedStudents: result.affectedStudents.map((student) => ({
        studentId: student.studentId,
        studentName: student.studentName,
        previousVersion: student.previousVersion.toFixed(1),
        newVersion: student.newVersion.toFixed(1),
        consentLink: student.consentLink,
        email: student.guardianEmail || 'não cadastrado',
        emailStatus: student.guardianEmail ? 'enviado' : 'sem_email',
      })),
      emailStats: {
        sent: emailsSent,
        skipped: emailsSkipped,
        total: result.affectedStudents.length,
      },
    });
  } catch (error) {
    console.error('Erro ao publicar templates de consentimento:', error);
    return res.status(500).json({ error: 'Erro ao publicar templates de consentimento' });
  }
};