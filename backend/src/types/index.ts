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

export type AdminManagedUserRole = 'Admin' | 'Professor' | 'Aluno' | 'Responsavel';

export type BackupJobType = 'auto' | 'manual';

export type BackupJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'deleted';

export interface BackupJob {
  id: string;
  academyId: string;
  type: BackupJobType;
  status: BackupJobStatus;
  fileName?: string;
  filePath?: string;
  fileSizeBytes?: number;
  includeHistory: boolean;
  isEncrypted: boolean;
  initiatedBy?: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  downloadExpiresAt?: string;
  retentionDays: number;
  archivedAt?: string;
  createdAt: string;
}

export interface TriggerBackupRequest {
  includeHistory?: boolean;
  isEncrypted?: boolean;
  encryptionPassword?: string;
}

export interface RestoreBackupRequest {
  adminPassword: string;
  encryptionPassword?: string;
}

export interface BackupScheduleConfig {
  academyId: string;
  generatedBy: string;
  frequency: 'daily';
  hour: number;
  minute: number;
  enabled: boolean;
  retentionDays: number;
  nextRunAt: string;
  updatedAt: string;
}

export interface BackupJobListResponse {
  jobs: BackupJob[];
  schedule: BackupScheduleConfig;
  lastAutoBackup?: BackupJob;
}

export interface BackupJobResponse {
  job: BackupJob;
}

export type HealthComponentStatus = 'ok' | 'degraded' | 'offline' | 'warning';

export type HealthMonitorWindow = '24h' | '30d';

export interface HealthTimeseriesPoint {
  timestamp: string;
  value: number;
}

export interface HealthAlertHint {
  component: 'api' | 'database' | 'cache' | 'email' | 'storage';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  recommendation: string;
  targetPath: string;
}

export interface HealthComponentSnapshot {
  id: 'api' | 'database' | 'cache' | 'email' | 'storage';
  label: string;
  status: HealthComponentStatus;
  statusLabel: string;
  details: string;
  metrics: {
    primaryLabel: string;
    primaryValue: string;
    secondaryLabel?: string;
    secondaryValue?: string;
    tertiaryLabel?: string;
    tertiaryValue?: string;
  };
}

export interface HealthSnapshot {
  generatedAt: string;
  uptimePercentage: number;
  components: HealthComponentSnapshot[];
  alerts: HealthAlertHint[];
  timeseries24h: {
    apiResponseMs: HealthTimeseriesPoint[];
    cpuUsage: HealthTimeseriesPoint[];
    memoryUsage: HealthTimeseriesPoint[];
    databaseConnections: HealthTimeseriesPoint[];
  };
}

export interface HealthHistoryResponse {
  window: HealthMonitorWindow;
  generatedAt: string;
  patterns: string[];
  series: {
    apiResponseMs: HealthTimeseriesPoint[];
    cpuUsage: HealthTimeseriesPoint[];
    memoryUsage: HealthTimeseriesPoint[];
    databaseConnections: HealthTimeseriesPoint[];
  };
}

export interface AdminManagedUserCreateRequest {
  email: string;
  fullName: string;
  role: AdminManagedUserRole;
  isActive?: boolean;
  sendInvite?: boolean;
}

export interface AdminManagedUserUpdateRequest {
  fullName?: string;
  role?: AdminManagedUserRole;
  isActive?: boolean;
  reason?: string;
}

export interface AdminManagedUserDeleteRequest {
  reason?: string;
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

export type ComplianceReportFormat = 'pdf' | 'excel' | 'json';

export type ComplianceReportPeriodPreset = 'current-month' | 'last-3-months' | 'custom';

export interface ComplianceReportPeriod {
  preset: ComplianceReportPeriodPreset;
  label: string;
  dateFrom: string;
  dateTo: string;
}

export interface ComplianceReportExportMetadata {
  format: ComplianceReportFormat;
  fileName: string;
  contentType: string;
  isSigned: boolean;
  complianceStatus: 'COMPLIANT' | 'NAO_COMPLIANT';
}

export interface ComplianceReportData {
  generatedAt: string;
  academyId: string;
  version: string;
  period: ComplianceReportPeriod;
  statistics: ComplianceReportStatistics;
  consents: ComplianceReportConsentSection;
  deletions: ComplianceReportDeletionSection;
  audit: ComplianceReportAuditSection;
  alerts: ComplianceReportAlert[];
  complianceStatus: 'COMPLIANT' | 'NAO_COMPLIANT';
  export: ComplianceReportExportMetadata;
  signedBy?: string;
  signatureDate?: string;
}

export type AdminDashboardStatus = 'operational' | 'attention' | 'critical';

export interface AdminDashboardUsersMetric {
  total: number;
  students: number;
  professors: number;
  admins: number;
  guardians: number;
  weeklyNewUsers: number;
}

export interface AdminDashboardConsentsMetric {
  valid: number;
  total: number;
  percentage: number;
  expired: number;
}

export interface AdminDashboardTrainingsMetric {
  total: number;
  dailyAverage: number;
}

export interface AdminDashboardBackupMetric {
  status: 'ok' | 'attention';
  statusLabel: string;
  lastKnownBackupAt: string | null;
  nextScheduledAt: string | null;
  isEstimated: boolean;
  detail: string;
}

export interface AdminDashboardAlert {
  severity: 'high' | 'medium' | 'low';
  category: 'compliance' | 'audit' | 'users' | 'backup' | 'operations';
  message: string;
  recommendation: string;
  actionLabel: string;
  targetPath: string;
  targetFilter?: string;
}

export interface AdminDashboardHistoryPoint {
  date: string;
  label: string;
  status: AdminDashboardStatus;
  uptimePercentage: number;
}

export interface AdminDashboardSystemStatus {
  currentStatus: AdminDashboardStatus;
  currentLabel: string;
  uptimeLast7Days: number;
  history7d: AdminDashboardHistoryPoint[];
  logsLast24h: number;
  failedLoginsLastHour: number;
  unauthorizedAttemptsLast24h: number;
}

export interface AdminDashboardResponse {
  status: AdminDashboardStatus;
  statusLabel: string;
  title: string;
  complianceScore: number;
  complianceExplanation: string;
  lastRefreshAt: string;
  lastAuditAt: string | null;
  metrics: {
    usersActive: AdminDashboardUsersMetric;
    consents: AdminDashboardConsentsMetric;
    trainingsMonth: AdminDashboardTrainingsMetric;
    backup: AdminDashboardBackupMetric;
  };
  alerts: AdminDashboardAlert[];
  systemStatus: AdminDashboardSystemStatus;
}

export type AdminAlertStatus = 'active' | 'acknowledged' | 'resolved';

export type AdminAlertActionType = 'acknowledge' | 'resolve' | 'ignore' | 'block-ip';

export interface AdminAlertChannelPreferences {
  inApp: boolean;
  push: boolean;
  email: boolean;
}

export interface AdminAlertSeverityPreferences {
  critical: boolean;
  preventive: boolean;
  informative: boolean;
}

export interface AdminAlertPreferences {
  academyId: string;
  channels: AdminAlertChannelPreferences;
  severity: AdminAlertSeverityPreferences;
  digestWindowMinutes: number;
  silencedUntil: string | null;
  updatedAt: string;
}

export interface AdminAlertItem {
  id: string;
  academyId: string;
  severity: AdminDashboardAlert['severity'];
  category: AdminDashboardAlert['category'];
  title: string;
  message: string;
  status: AdminAlertStatus;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  acknowledgedByUserId: string | null;
  availableActions: AdminAlertActionType[];
}

export interface AdminAlertFeedResponse {
  items: AdminAlertItem[];
  total: number;
  unreadCount: number;
  criticalCount: number;
  silencedUntil: string | null;
}

export interface AdminAlertCountResponse {
  total: number;
  unread: number;
  critical: number;
  silencedUntil: string | null;
}
