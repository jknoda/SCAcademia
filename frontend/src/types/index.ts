export interface Academy {
  id: string;
  name: string;
  location: string;
  email: string;
  phone: string;
  description?: string;
  documentId?: string;
  contactEmail?: string;
  contactPhone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
  isActive?: boolean;
  maxUsers?: number;
  storageLimitGb?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademyProfile {
  academyId: string;
  name: string;
  description: string;
  documentId: string;
  contactEmail: string;
  contactPhone: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressPostalCode: string;
  addressCity: string;
  addressState: string;
  isActive?: boolean;
  maxUsers?: number;
  storageLimitGb?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateAcademyProfilePayload {
  name: string;
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

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  documentId?: string;
  birthDate?: string | Date | null;
  phone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
  academy: {
    id: string;
    name: string;
  };
}

export interface AdminProfileUpdatePayload {
  fullName: string;
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

export interface ProfessorProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'Professor';
  academyId: string;
  documentId?: string;
  birthDate?: string | Date | null;
  phone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
  dataEntrada?: string | Date | null;
  dataSaida?: string | Date | null;
  isActive?: boolean;
}

export interface ListProfessorsResponse {
  professors: ProfessorProfile[];
  filters: {
    name?: string;
    status?: 'active' | 'inactive' | 'all';
  };
  total: number;
}

export interface CreateProfessorPayload {
  email: string;
  password: string;
  fullName: string;
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

export interface UpdateProfessorPayload {
  fullName: string;
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

export interface UpdateProfessorStatusPayload {
  isActive: boolean;
}

export interface ResetProfessorPasswordPayload {
  newPassword: string;
  confirmPassword: string;
}

export interface ProfessorMutationResponse {
  message: string;
  professor: ProfessorProfile;
  temporaryPassword?: string;
}

export interface StudentProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'Aluno';
  academyId: string;
  documentId?: string;
  birthDate?: string | Date | null;
  phone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
  dataEntrada?: string | Date | null;
  dataSaida?: string | Date | null;
  isActive?: boolean;
  idade?: number | null;
  faixa?: string | null;
  isMinor?: boolean;
  operationalStatus?: {
    isReady: boolean;
    hasHealthScreening: boolean;
    hasGuardian: boolean;
    missingItems: string[];
  };
}

export interface ListStudentsResponse {
  students: StudentProfile[];
  filters: {
    name?: string;
    status?: 'active' | 'inactive' | 'all';
  };
  total: number;
}

export interface CreateStudentPayload {
  email: string;
  password: string;
  fullName: string;
  birthDate: string;
  documentId?: string;
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

export interface UpdateStudentPayload {
  fullName: string;
  birthDate: string;
  documentId?: string;
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

export interface UpdateStudentStatusPayload {
  isActive: boolean;
}

export interface StudentMutationResponse {
  message: string;
  student: StudentProfile;
  temporaryPassword?: string;
  pendingGuardianLink?: boolean;
  warning?: string | null;
}

export interface StudentFichaResponse {
  student: StudentProfile;
  lgpd: {
    consentSigned: boolean;
    consentSignedAt: string | Date | null;
  };
  health: {
    anamnesePreenchida: boolean;
    lastUpdatedAt?: string | Date | null;
  };
  responsavel: {
    guardianId: string | null;
    guardianName: string | null;
    guardianEmail: string | null;
    relationship: string | null;
    isPrimary: boolean;
    pendenteVinculacao: boolean;
    onboardingLink?: string;
  };
  turmas: Array<{
    turmaId: string;
    turmaName: string;
    isActive: boolean;
  }>;
}

export interface GuardianSearchResult {
  guardianId: string;
  fullName: string;
  email: string;
  phone?: string;
  linkedStudentsCount: number;
}

export interface LinkGuardianPayload {
  guardianId: string;
  relationship?: string;
  isPrimary?: boolean;
}

export interface CreateAndLinkGuardianPayload {
  email: string;
  fullName: string;
  relationship?: string;
  isPrimary?: boolean;
  documentId?: string;
  phone?: string;
}

export interface GuardianMutationResponse {
  message: string;
  guardian: {
    guardianId: string;
    fullName: string;
    email: string;
    relationship?: string | null;
    isPrimary: boolean;
  };
  temporaryPassword?: string;
}

export interface MinorWithoutGuardianItem {
  studentId: string;
  fullName: string;
  birthDate: string | null;
  idade: number | null;
  isActive: boolean;
}

export interface StudentWithoutHealthScreeningItem {
  studentId: string;
  fullName: string;
  birthDate: string | null;
  idade: number | null;
  faixa: string | null;
  isMinor: boolean;
  isActive: boolean;
  operationalStatus: {
    isReady: boolean;
    hasHealthScreening: boolean;
    hasGuardian: boolean;
    missingItems: string[];
  };
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface JWTResponse {
  accessToken: string;
  user?: User;
}

export interface SetupState {
  step: number;
  academyId?: string;
  academyData?: Academy;
  userData?: User;
}

export interface PasswordStrengthResult {
  score: number; // 0-100
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

export interface HealthRecord {
  healthRecordId: string;
  userId: string;
  bloodType: string | null;
  weightKg: number | null;
  heightCm: number | null;
  hypertension: boolean;
  diabetes: boolean;
  cardiac: boolean;
  labyrinthitis: boolean;
  asthmaBronchitis: boolean;
  epilepsySeizures: boolean;
  stressDepression: boolean;
  healthScreeningNotes: string | null;
  allergies: string | null;
  medications: string | null;
  existingConditions: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthScreeningPayload {
  bloodType: string;
  weightKg?: number;
  heightCm?: number;
  hypertension?: boolean;
  diabetes?: boolean;
  cardiac?: boolean;
  labyrinthitis?: boolean;
  asthmaBronchitis?: boolean;
  epilepsySeizures?: boolean;
  stressDepression?: boolean;
  healthScreeningNotes?: string;
  allergies?: string;
  medications?: string;
  existingConditions?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface ConsentValidation {
  isValid: boolean;
  studentName: string;
  academyName: string;
  expiresAt: Date;
  isReconsent?: boolean;
  previousVersion?: number;
  newVersion?: number;
}

export interface ConsentTemplate {
  version: number;
  consentType: 'privacy' | 'health' | 'ethics';
  content: string;
}

export interface AdminConsentTemplate {
  consentType: 'privacy' | 'health' | 'ethics';
  version: string;
  content: string;
  effectiveAt?: Date | null;
}

export interface AdminConsentTemplatesResponse {
  academyId: string;
  academyName: string;
  templates: AdminConsentTemplate[];
}

export interface PublishConsentTemplatesPayload {
  healthContent: string;
  ethicsContent: string;
  privacyContent: string;
  bumpType: 'minor' | 'major';
}

export interface ReconsentAffectedStudent {
  studentId: string;
  studentName: string;
  previousVersion: string;
  newVersion: string;
  consentLink: string;

}

export interface AuditLogEntry {
  logId: string;
  actorId?: string;
  actorName?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
  ipAddress?: string;
  changesJson?: any;
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  resourceType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface DeletionRequestItem {
  deletionRequestId: string;
  academyId: string;
  studentId: string;
  requestedById: string;
  status: 'pending' | 'processed' | 'cancelled' | string;
  reason?: string | null;
  requestedAt: string;
  deletionScheduledAt: string;
  processedAt?: string | null;
  studentName?: string;
  requestedByName?: string;
}

export interface DeletionRequestResponse {
  message: string;
  request: DeletionRequestItem;
}

export interface LinkedStudentItem {
  studentId: string;
  studentName: string;
  hasHealthScreening: boolean;
  healthScreeningUpdatedAt?: string | null;
}

export interface ComplianceReportAlert {
  severity: 'high' | 'medium' | 'low';
  message: string;
  recommendation: string;
}

export interface ComplianceReportStatistics {
  totalStudents: number;
  minorStudents: number;
  adultStudents: number;
  consentedStudents: number;
  expiredConsentCount: number;
}

export interface ComplianceReportConsentItem {
  consentType: 'Saúde' | 'Ética' | 'Privacidade';
  totalApproved: number;
  totalPending: number;
}

export interface ComplianceReportPayload {
  generatedAt: string;
  academyId: string;
  version: string;
  statistics: ComplianceReportStatistics;
  consents: {
    versions: ComplianceReportConsentItem[];
    totalConsentApproved: number;
    totalConsentPending: number;
  };
  deletions: {
    processedRequests: number;
    pendingRequests: number;
    totalHardDeleted: number;
  };
  audit: {
    last90DaysAccess: number;
    unauthorizedAttempts: number;
    anomalies: string[];
  };
  alerts: ComplianceReportAlert[];
  signedBy?: string;
  signatureDate?: string;
}

export interface ComplianceReportHistoryItem {
  id: string;
  academyId: string;
  generatedBy: string;
  reportData: ComplianceReportPayload;
  filePath: string | null;
  signedAt: string | null;
  signatureHash: string | null;
  createdAt: string;
}

export interface ComplianceReportSchedule {
  academyId: string;
  generatedBy: string;
  frequency: 'monthly';
  dayOfMonth: number;
  hour: number;
  minute: number;
  enabled: boolean;
  nextRunAt: string;
  updatedAt: string;
}

export interface GenerateComplianceReportResponse {
  message: string;
  reportId: string;
  report: ComplianceReportPayload;
  pdfUrl: string;
  alerts: ComplianceReportAlert[];
}

export interface TrainingEntryPointClass {
  turmaId: string;
  turmaName: string;
  description?: string;
  label: string;
  scheduledAtText: string;
}

export interface TrainingEntryPointResponse {
  greeting: string;
  isOfflineCapable: boolean;
  currentOrNextClass: TrainingEntryPointClass | null;
}

export interface StartTrainingSessionResponse {
  message: string;
  sessionId: string;
  created: boolean;
  nextStep: string;
}

export type TrainingAttendanceStatus = 'present' | 'absent' | 'justified';

export interface TrainingAttendanceStudent {
  studentId: string;
  studentName: string;
  status: TrainingAttendanceStatus | null;
  hasHealthScreening: boolean;
}

export interface TrainingAttendanceResponse {
  sessionId: string;
  turmaId: string;
  turmaName: string;
  totals: {
    total: number;
    present: number;
  };
  students: TrainingAttendanceStudent[];
}

export interface SaveTrainingAttendancePayload {
  studentId: string;
  status: TrainingAttendanceStatus;
}

export interface SaveTrainingAttendanceResponse {
  message: string;
  sessionId: string;
  studentId: string;
  status: TrainingAttendanceStatus;
  warning?: string | null;
  totals: {
    total: number;
    present: number;
  };
}
