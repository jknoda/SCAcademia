import { Response, NextFunction } from 'express';
import { verify } from '../lib/jwt';
import { getUserById } from '../lib/database';
import { AuthenticatedRequest } from '../types';

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    if (token.length > 2048) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    const decoded = verify(token);
    if (!decoded.academyId) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    const user = await getUserById(decoded.userId);
    if (!user || user.academyId !== decoded.academyId || user.isActive === false) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    req.user = decoded;
    req.academyId = decoded.academyId;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ error: 'Acesso negado. Privilégios de administrador necessários' });
  }
  next();
};

export const requireRole = (roles: string[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }
    next();
  };

export const requireSelf = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Admin pode acessar qualquer profile; outros só o próprio
  if (!req.user) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  if (req.user.role === 'Admin') {
    return next();
  }
  if (req.params.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Acesso negado. Acesso restrito ao próprio perfil.' });
  }
  next();
};
