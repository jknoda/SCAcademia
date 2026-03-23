import { Request } from 'express';
import { JWTPayload } from '../lib/jwt';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  academyId?: string;
}

export interface AcademyCreateRequest {
  name: string;
  location: string;
  email: string;
  phone: string;
}

export interface AdminRegistrationRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface JWTResponse {
  accessToken: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    academy: {
      id: string;
      name: string;
    };
  };
}
