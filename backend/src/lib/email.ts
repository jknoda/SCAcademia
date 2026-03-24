import nodemailer from 'nodemailer';

type EmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const hasSmtpConfig = (): boolean => {
  if (process.env.SMTP_SERVICE && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return true;
  }

  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
};

const getTransporter = () => {
  const smtpService = process.env.SMTP_SERVICE?.trim().toLowerCase();
  if (smtpService) {
    return nodemailer.createTransport({
      service: smtpService,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
};

const getFrom = (): string => {
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@scacademia.local';
  const fromName = process.env.SMTP_FROM_NAME || 'SCAcademia';
  return `${fromName} <${fromEmail}>`;
};

export const sendEmail = async (input: EmailInput): Promise<boolean> => {
  if (!hasSmtpConfig()) {
    console.log(`[EMAIL SIMULADO] Para: ${input.to}`);
    console.log(`[EMAIL SIMULADO] Assunto: ${input.subject}`);
    console.log(`[EMAIL SIMULADO] Conteudo: ${input.text}`);
    return false;
  }

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFrom(),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return true;
  } catch (error) {
    console.error('[EMAIL ERROR] Falha ao enviar email:', error);
    console.error('[EMAIL ERROR] Verifique SMTP_SERVICE/SMTP_HOST, credenciais e se a senha de app está ativa.');
    return false;
  }
};

export const sendConsentEmail = async (
  to: string,
  studentName: string,
  consentLink: string
): Promise<boolean> => {
  return sendEmail({
    to,
    subject: `Consentimento LGPD para ${studentName}`,
    text:
      `Olá,\n\n` +
      `Foi solicitado consentimento para o aluno ${studentName}.\n` +
      `Acesse o link abaixo para assinar:\n${consentLink}\n\n` +
      `Se você não reconhece esta solicitação, ignore este email.`,
    html:
      `<p>Olá,</p>` +
      `<p>Foi solicitado consentimento para o aluno <strong>${studentName}</strong>.</p>` +
      `<p>Acesse o link abaixo para assinar:</p>` +
      `<p><a href="${consentLink}" target="_blank" rel="noopener noreferrer">${consentLink}</a></p>` +
      `<p>Se você não reconhece esta solicitação, ignore este email.</p>`,
  });
};

export const sendWelcomeEmail = async (to: string, fullName: string): Promise<boolean> => {
  return sendEmail({
    to,
    subject: 'Bem-vindo(a) à SCAcademia',
    text:
      `Olá ${fullName},\n\n` +
      `Seu cadastro foi concluído com sucesso na SCAcademia.\n` +
      `Você já pode acessar a plataforma com seu email e senha.`,
    html:
      `<p>Olá ${fullName},</p>` +
      `<p>Seu cadastro foi concluído com sucesso na SCAcademia.</p>` +
      `<p>Você já pode acessar a plataforma com seu email e senha.</p>`,
  });
};

export const sendPasswordResetEmail = async (to: string, resetLink: string): Promise<boolean> => {
  return sendEmail({
    to,
    subject: 'Redefinição de senha - SCAcademia',
    text:
      `Olá,\n\n` +
      `Recebemos uma solicitação para redefinir sua senha.\n` +
      `Use o link abaixo (válido por 1 hora):\n${resetLink}\n\n` +
      `Se você não solicitou este reset, ignore este email.`,
    html:
      `<p>Olá,</p>` +
      `<p>Recebemos uma solicitação para redefinir sua senha.</p>` +
      `<p>Use o link abaixo (válido por 1 hora):</p>` +
      `<p><a href="${resetLink}" target="_blank" rel="noopener noreferrer">${resetLink}</a></p>` +
      `<p>Se você não solicitou este reset, ignore este email.</p>`,
  });
};

export const sendReconsentEmail = async (
  to: string,
  studentName: string,
  previousVersion: string,
  newVersion: string,
  consentLink: string
): Promise<boolean> => {
  return sendEmail({
    to,
    subject: `Atualização: Novo Consentimento LGPD para ${studentName}`,
    text:
      `Olá,\n\n` +
      `Os termos de consentimento para o aluno ${studentName} foram atualizados.\n\n` +
      `Versão anterior: ${previousVersion}\n` +
      `Versão atual: ${newVersion}\n\n` +
      `Por favor, acesse o link abaixo para revisar e assinar os novos termos:\n${consentLink}\n\n` +
      `O link é válido por 7 dias. Obrigado!`,
    html:
      `<p>Olá,</p>` +
      `<p>Os termos de consentimento para o aluno <strong>${studentName}</strong> foram atualizados.</p>` +
      `<p><strong>Versão anterior:</strong> ${previousVersion}<br/>` +
      `<strong>Versão atual:</strong> ${newVersion}</p>` +
      `<p>Por favor, acesse o link abaixo para revisar e assinar os novos termos:</p>` +
      `<p><a href="${consentLink}" target="_blank" rel="noopener noreferrer" style="color: #0f3460; text-decoration: none; font-weight: bold;">Revisar e Assinar Novos Termos</a></p>` +
      `<p style="font-size: 0.9em; color: #666;">O link é válido por 7 dias. Obrigado!</p>`,
  });
};
