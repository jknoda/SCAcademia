import { Response } from 'express';
import { AuthenticatedRequest, AcademyCreateRequest, AdminRegistrationRequest, LoginRequest } from '../types';
import {
  createAcademy,
  getAcademyById,
  academyExists,
  createUser,
  getUserByEmail,
  getUserByEmailAcrossAcademies,
  getUserById,
  getValidAuthToken,
  revokeAuthToken,
  revokeAuthTokensByUser,
  storeAuthToken,
  updateUserPassword,
} from '../lib/database';
import { logAudit } from '../lib/audit';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../lib/password';
import { sign, verify } from '../lib/jwt';

const toExpiresAt = (seconds: number): Date => new Date(Date.now() + seconds * 1000);

export const checkSetupNeeded = async (req: any, res: Response) => {
  try {
    const needsSetup = !(await academyExists());
    res.json({ needsSetup });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar status de setup' });
  }
};

export const createAcademyHandler = async (req: any, res: Response) => {
  try {
    const { name, location, email, phone } = req.body as AcademyCreateRequest;

    if (await academyExists()) {
      return res.status(409).json({ error: 'Academia já existe. Setup já foi realizado.' });
    }

    const academy = await createAcademy(name, location, email, phone);

    logAudit(undefined, 'ACADEMY_CREATED', 'Academy', academy.id, academy.id, undefined, {
      name,
      location,
      email,
    });

    res.status(201).json({
      academyId: academy.id,
      message: 'Academia criada com sucesso',
      nextStep: 'admin-registration',
    });
  } catch (error) {
    console.error('Erro ao criar academia:', error);
    res.status(500).json({ error: 'Erro ao criar academia' });
  }
};

export const initAdminHandler = async (req: any, res: Response) => {
  try {
    const { academyId } = req.params;
    const { email, password, fullName } = req.body as AdminRegistrationRequest;

    const academy = await getAcademyById(academyId);
    if (!academy) {
      return res.status(404).json({ error: 'Academia não encontrada' });
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Senha não atende aos requisitos de segurança',
        details: passwordValidation.errors,
      });
    }

    const existingUser = await getUserByEmail(email, academyId);
    if (existingUser) {
      return res.status(409).json({ error: 'Email já está registrado nesta academia' });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(email, fullName, passwordHash, academyId, 'Admin');

    logAudit(user.id, 'USER_CREATED', 'User', user.id, academyId, undefined, {
      email,
      fullName,
      role: 'Admin',
    });

    res.status(201).json({
      userId: user.id,
      email: user.email,
      message: 'Admin registrado com sucesso. Faça login para continuar.',
    });
  } catch (error) {
    console.error('Erro ao registrar admin:', error);
    res.status(500).json({ error: 'Erro ao registrar admin' });
  }
};

export const loginHandler = async (req: any, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequest;

    const user = await getUserByEmailAcrossAcademies(email);

    if (!user) {
      logAudit(undefined, 'LOGIN_FAILURE', 'Auth', 'login', 'unknown', undefined, {
        email,
        reason: 'User not found',
      });
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const passwordMatch = await verifyPassword(password, user.passwordHash);
    if (!passwordMatch) {
      logAudit(user.id, 'LOGIN_FAILURE', 'Auth', 'login', user.academyId, undefined, {
        email,
        reason: 'Invalid password',
      });
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const academy = await getAcademyById(user.academyId);
    if (!academy) {
      return res.status(500).json({ error: 'Academia associada não encontrada' });
    }

    const accessToken = sign(
      {
        userId: user.id,
        email: user.email,
        academyId: user.academyId,
        role: user.role,
      },
      process.env.JWT_ACCESS_EXPIRES || '3600'
    );

    const refreshToken = sign(
      {
        userId: user.id,
        email: user.email,
        academyId: user.academyId,
        role: user.role,
      },
      process.env.JWT_REFRESH_EXPIRES || '604800'
    );

    await storeAuthToken(
      user.id,
      user.academyId,
      'refresh',
      refreshToken,
      toExpiresAt(parseInt(process.env.JWT_REFRESH_EXPIRES || '604800', 10)),
      req.ip,
      req.get('user-agent')
    );

    logAudit(user.id, 'LOGIN_SUCCESS', 'Auth', 'login', user.academyId, undefined, {
      email,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.JWT_REFRESH_EXPIRES || '604800', 10) * 1000,
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        academy: {
          id: academy.id,
          name: academy.name,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

export const refreshTokenHandler = async (req: any, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token não fornecido' });
    }

    const decoded = verify(refreshToken);
    const persistedToken = await getValidAuthToken('refresh', refreshToken);
    if (!persistedToken || persistedToken.userId !== decoded.userId) {
      return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }

    const newAccessToken = sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        academyId: decoded.academyId,
        role: decoded.role,
      },
      process.env.JWT_ACCESS_EXPIRES || '3600'
    );

    const newRefreshToken = sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        academyId: decoded.academyId,
        role: decoded.role,
      },
      process.env.JWT_REFRESH_EXPIRES || '604800'
    );

    await revokeAuthToken(refreshToken);
    await storeAuthToken(
      decoded.userId,
      decoded.academyId,
      'refresh',
      newRefreshToken,
      toExpiresAt(parseInt(process.env.JWT_REFRESH_EXPIRES || '604800', 10)),
      req.ip,
      req.get('user-agent')
    );

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: parseInt(process.env.JWT_REFRESH_EXPIRES || '604800', 10) * 1000,
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: 'Refresh token inválido ou expirado' });
  }
};

export const getCurrentUserHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const academy = await getAcademyById(user.academyId);
    if (!academy) {
      return res.status(500).json({ error: 'Academia não encontrada' });
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      academy: {
        id: academy.id,
        name: academy.name,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar usuário atual:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
};

export const logoutHandler = async (req: any, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const decoded = verify(token);
        await revokeAuthToken(token);
        logAudit(decoded.userId, 'LOGOUT_SUCCESS', 'Auth', 'logout', decoded.academyId, undefined, {
          email: decoded.email,
        });
      } catch {
        logAudit(undefined, 'LOGOUT_SUCCESS', 'Auth', 'logout', 'unknown', undefined, {
          reason: 'Invalid token on logout',
        });
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao realizar logout' });
  }
};

export const registerUserHandler = async (req: any, res: Response) => {
  try {
    const { email, password, fullName, role, academyId, birthDate, responsavelEmail } = req.body;

    const academy = await getAcademyById(academyId);
    if (!academy) {
      return res.status(404).json({ error: 'Academia não encontrada' });
    }

    const existingUser = await getUserByEmail(email, academyId);
    if (existingUser) {
      return res.status(409).json({
        error: 'Email já registrado',
        suggestions: ['Fazer login', 'Recuperar senha'],
      });
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Senha não atende aos requisitos de segurança',
        details: passwordValidation.errors,
      });
    }

    const passwordHash = await hashPassword(password);
    const parsedBirthDate = birthDate ? new Date(birthDate) : undefined;

    const user = await createUser(email, fullName, passwordHash, academyId, role, parsedBirthDate, responsavelEmail);

    logAudit(user.id, 'USER_REGISTERED', 'User', user.id, academyId, undefined, {
      email,
      fullName,
      role,
    });

    if (user.necessitaConsentimentoResponsavel) {
      console.log(`[EMAIL] Enviando email de consentimento para ${user.responsavelEmail} - aluno menor de idade: ${user.fullName}`);
      logAudit(user.id, 'CONSENT_EMAIL_SENT', 'User', user.id, academyId, undefined, {
        responsavelEmail: user.responsavelEmail,
        reason: 'Aluno menor de idade',
      });
    }

    if (role === 'Professor') {
      console.log(`[EMAIL] Enviando email de boas-vindas para professor: ${email}`);
      logAudit(user.id, 'WELCOME_EMAIL_SENT', 'User', user.id, academyId, undefined, {
        email,
        role: 'Professor',
      });
    }

    if (role === 'Professor' || (role === 'Aluno' && !user.necessitaConsentimentoResponsavel)) {
      const accessToken = sign(
        { userId: user.id, email: user.email, academyId: user.academyId, role: user.role },
        process.env.JWT_ACCESS_EXPIRES || '3600'
      );
      const refreshToken = sign(
        { userId: user.id, email: user.email, academyId: user.academyId, role: user.role },
        process.env.JWT_REFRESH_EXPIRES || '604800'
      );

      await storeAuthToken(
        user.id,
        user.academyId,
        'refresh',
        refreshToken,
        toExpiresAt(parseInt(process.env.JWT_REFRESH_EXPIRES || '604800', 10)),
        req.ip,
        req.get('user-agent')
      );

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: parseInt(process.env.JWT_REFRESH_EXPIRES || '604800', 10) * 1000,
      });

      return res.status(201).json({
        message: '✓ Registro realizado com sucesso',
        userId: user.id,
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          academy: { id: academy.id, name: academy.name },
        },
        requiresConsent: false,
      });
    }

    return res.status(201).json({
      message: '✓ Registro realizado com sucesso. Aguardando consentimento do responsável.',
      userId: user.id,
      requiresConsent: true,
      consentStatus: 'pendente',
    });
  } catch (error) {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    console.error('Erro ao registrar usuário:', error);
    logAudit(undefined, 'REGISTER_ERROR', 'User', 'register', req.body?.academyId || 'unknown', undefined, {
      error: String(error),
      ip,
      email: req.body?.email,
    });
    res.status(500).json({ error: 'Erro ao registrar. Dados não foram salvos. Tente novamente' });
  }
};

export const forgotPasswordHandler = async (req: any, res: Response) => {
  try {
    const { email } = req.body as { email: string };
    const genericMessage = 'Se o email existir, enviaremos um link para redefinicao de senha';

    const user = await getUserByEmailAcrossAcademies(email);
    if (!user) {
      logAudit(undefined, 'PASSWORD_RESET_REQUESTED', 'Auth', 'forgot-password', 'unknown', undefined, {
        email,
        userFound: false,
      });
      return res.json({ message: genericMessage });
    }

    await revokeAuthTokensByUser(user.id, 'password_reset');

    const resetToken = sign(
      {
        userId: user.id,
        email: user.email,
        academyId: user.academyId,
        role: user.role,
      },
      60 * 60
    );

    await storeAuthToken(
      user.id,
      user.academyId,
      'password_reset',
      resetToken,
      toExpiresAt(60 * 60),
      req.ip,
      req.get('user-agent')
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    console.log(`[EMAIL] Enviando reset de senha para ${email}: ${resetLink}`);
    logAudit(user.id, 'PASSWORD_RESET_REQUESTED', 'Auth', 'forgot-password', user.academyId, undefined, {
      email,
      userFound: true,
    });
    logAudit(user.id, 'PASSWORD_RESET_EMAIL_SENT', 'Auth', 'forgot-password', user.academyId, undefined, {
      email,
    });

    if (process.env.NODE_ENV === 'test') {
      return res.json({ message: genericMessage, debugToken: resetToken });
    }

    return res.json({ message: genericMessage });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao processar recuperacao de senha' });
  }
};

export const resetPasswordHandler = async (req: any, res: Response) => {
  try {
    const { token, newPassword } = req.body as { token: string; newPassword: string };

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Senha não atende aos requisitos de segurança',
        details: passwordValidation.errors,
      });
    }

    let decoded;
    try {
      decoded = verify(token);
    } catch {
      return res.status(400).json({ error: 'Link expirado. Solicite novo reset' });
    }

    const storedResetToken = await getValidAuthToken('password_reset', token);
    if (!storedResetToken || storedResetToken.userId !== decoded.userId) {
      return res.status(400).json({ error: 'Link expirado. Solicite novo reset' });
    }

    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(400).json({ error: 'Link expirado. Solicite novo reset' });
    }

    const passwordHash = await hashPassword(newPassword);
    await updateUserPassword(user.id, passwordHash);

    await revokeAuthToken(token);
    await revokeAuthTokensByUser(user.id, 'refresh');

    logAudit(user.id, 'PASSWORD_RESET_SUCCESS', 'Auth', 'reset-password', user.academyId, undefined, {
      email: user.email,
    });

    return res.json({
      message: 'Senha redefinida com sucesso',
      redirectTo: '/login',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
};
