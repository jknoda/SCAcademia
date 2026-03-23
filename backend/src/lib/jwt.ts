import jwt, { SignOptions } from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  academyId: string;
  role: string;
}

const normalizeExpiresIn = (expiresIn: string | number): string | number => {
  if (typeof expiresIn === 'string' && /^\d+$/.test(expiresIn)) {
    return Number(expiresIn);
  }
  return expiresIn;
};

const getJwtSecret = (): string => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    return 'default-secret-change-in-production';
  }
  return secret;
};

export const sign = (payload: JWTPayload, expiresIn: string | number = '1h'): string => {
  const options: SignOptions = {
    expiresIn: normalizeExpiresIn(expiresIn) as any,
  };
  return jwt.sign(payload, getJwtSecret(), options);
};

export const verify = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const decode = (token: string): JWTPayload | null => {
  return jwt.decode(token) as JWTPayload | null;
};
