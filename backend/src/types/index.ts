import { Request } from 'express';
import { JWTPayload } from '../lib/jwt';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  academyId?: string;
}

export interface AcademyCreateRequest {
  name: string;
  fantasyName?: string;
  location: string;
  email: string;
  phone: string;
  logoUrl?: string;
}

export interface AcademyProfileUpdateRequest {
  name: string;
  fantasyName?: string;
  logoUrl?: string;
  description?: string;
  documentId: string;
  contactEmail: string;
  contactPhone: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
}

export interface UserProfileUpdateRequest {
  fullName: string;
  photoUrl?: string;
  documentId?: string;
  birthDate?: string;
  phone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfessorCreateRequest {
  email: string;
  password: string;
  fullName: string;
  photoUrl?: string;
  documentId?: string;
  birthDate?: string;
  phone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
  dataEntrada?: string;
}

export interface ProfessorUpdateRequest {
  fullName: string;
  photoUrl?: string;
  documentId?: string;
  birthDate?: string;
  phone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
  dataEntrada?: string;
}

export interface ProfessorStatusUpdateRequest {
  isActive: boolean;
}

export interface AdminResetProfessorPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

export interface StudentCreateRequest {
  email: string;
  password: string;
  fullName: string;
  photoUrl?: string;
  isMinor?: boolean;
  documentId?: string;
  birthDate: string;
  phone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
  dataEntrada?: string;
  turmaId?: string;
  responsavelEmail?: string;
}

export interface StudentUpdateRequest {
  fullName: string;
  photoUrl?: string;
  isMinor?: boolean;
  documentId?: string;
  birthDate: string;
  phone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
  dataEntrada?: string;
}

export interface StudentStatusUpdateRequest {
  isActive: boolean;
}

export interface GuardianSearchQuery {
  email: string;
}

export interface LinkGuardianRequest {
  guardianId: string;
  relationship?: string;
  isPrimary?: boolean;
}

export interface CreateAndLinkGuardianRequest {
  email: string;
  fullName: string;
  relationship?: string;
  isPrimary?: boolean;
  documentId?: string;
  phone?: string;
}

export interface AdminRegistrationRequest {
  email: string;
  password: string;
  fullName: string;
  photoUrl?: string;
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
    photoUrl?: string;
    academy: {
      id: string;
      name: string;
      logoUrl?: string;
    };
  };
}

export interface ComplianceReportStatistics {
  totalStudents: number;
  minorStudents: number;
  adultStudents: number;
  consentedStudents: number;
  expiredConsentCount: number;
}

export interface ComplianceReportConsentSection {
  versions: Array<{
    consentType: 'Saúde' | 'Ética' | 'Privacidade';
    totalApproved: number;
    totalPending: number;
  }>;
  totalConsentApproved: number;
  totalConsentPending: number;
}

export interface ComplianceReportDeletionSection {
  processedRequests: number;
  pendingRequests: number;
  totalHardDeleted: number;
}

export interface ComplianceReportAuditSection {
  last90DaysAccess: number;
  unauthorizedAttempts: number;
  anomalies: string[];
}

export interface ComplianceReportAlert {
  severity: 'high' | 'medium' | 'low';
  message: string;
  recommendation: string;
}

export interface ComplianceReportData {
  generatedAt: string;
  academyId: string;
  version: string;
  statistics: ComplianceReportStatistics;
  consents: ComplianceReportConsentSection;
  deletions: ComplianceReportDeletionSection;
  audit: ComplianceReportAuditSection;
  alerts: ComplianceReportAlert[];
  signedBy?: string;
  signatureDate?: string;
}
