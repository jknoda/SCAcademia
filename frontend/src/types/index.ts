export interface Academy {
  id: string;
  name: string;
  fantasyName?: string;
  location: string;
  email: string;
  phone: string;
  logoUrl?: string;
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
  fantasyName?: string;
  logoUrl?: string;
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

export interface User {
  id: string;
  email: string;
  fullName: string;
  photoUrl?: string;
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
    fantasyName?: string;
    logoUrl?: string;
  };
}

export interface AdminProfileUpdatePayload {
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

export interface ProfessorProfile {
  id: string;
  email: string;
  fullName: string;
  photoUrl?: string;
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

export interface UpdateProfessorPayload {
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
  photoUrl?: string;
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
  photoUrl?: string;
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
  photoUrl?: string;
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

export interface AdminManagedUserListItem {
  id: string;
  fullName: string;
  email: string;
  role: AdminManagedUserRole;
  isActive: boolean;
  status: AdminManagedUserStatus;
  createdAt: string;
  deletedAt: string | null;
}

export interface ListAdminUsersResponse {
  users: AdminManagedUserListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    role: AdminManagedUserRole | 'all';
    status: 'active' | 'blocked' | 'pending' | 'all';
    search: string;
  };
}

export interface CreateAdminManagedUserPayload {
  email: string;
  fullName: string;
  role: AdminManagedUserRole;
  isActive?: boolean;
  sendInvite?: boolean;
}

export interface UpdateAdminManagedUserPayload {
  fullName?: string;
  role?: AdminManagedUserRole;
  isActive?: boolean;
  reason?: string;
}

export interface DeleteAdminManagedUserPayload {
  reason?: string;
}

export interface AdminManagedUserMutationResponse {
  message: string;
  user: AdminManagedUserListItem;
  inviteSent?: boolean;
  inviteLink?: string;
}

export type BackupJobType = 'auto' | 'manual';

export type BackupJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'deleted';

export interface BackupJob {
  id: string;
  academyId: string;
  type: BackupJobType;
  status: BackupJobStatus;
  fileName: string | null;
  filePath: string | null;
  fileSizeBytes: number;
  includeHistory: boolean;
  isEncrypted: boolean;
  initiatedBy: string | null;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  downloadExpiresAt: string | null;
  retentionDays: number;
  archivedAt: string | null;
  createdAt: string;
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

export interface TriggerBackupPayload {
  includeHistory?: boolean;
  isEncrypted?: boolean;
  encryptionPassword?: string;
}

export interface RestoreBackupPayload {
  adminPassword: string;
  encryptionPassword?: string;
}

export interface BackupScheduleUpdatePayload {
  hour: number;
  minute: number;
  enabled: boolean;
  retentionDays: number;
}

export interface BackupListResponse {
  jobs: BackupJob[];
  schedule: BackupScheduleConfig;
  lastAutoBackup: BackupJob | null;
}

export interface BackupJobResponse {
  job: BackupJob;
}

export interface BackupIntegrityResponse {
  valid: boolean;
  sizeBytes: number;
  reason?: string;
}

export interface BackupTriggerResponse {
  jobId: string;
  message: string;
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

export type AdminManagedUserRole = 'Admin' | 'Professor' | 'Aluno' | 'Responsavel';

export type AdminManagedUserStatus = 'active' | 'blocked' | 'pending';

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
  actorRole?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome?: 'SUCCESS' | 'DENIED';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  anomalyFlag?: boolean;
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
  outcome?: 'SUCCESS' | 'DENIED';
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

export type ComplianceReportFormat = 'pdf' | 'excel' | 'json';

export type ComplianceReportPeriodPreset = 'current-month' | 'last-3-months' | 'custom';

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
  period: {
    preset: ComplianceReportPeriodPreset;
    label: string;
    dateFrom: string;
    dateTo: string;
  };
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
  complianceStatus: 'COMPLIANT' | 'NAO_COMPLIANT';
  export: {
    format: ComplianceReportFormat;
    fileName: string;
    contentType: string;
    isSigned: boolean;
    complianceStatus: 'COMPLIANT' | 'NAO_COMPLIANT';
  };
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
  format: ComplianceReportFormat;
  periodLabel: string;
  complianceStatus: string;
  isSigned: boolean;
}

export interface GenerateComplianceReportRequest {
  format: ComplianceReportFormat;
  periodPreset: ComplianceReportPeriodPreset;
  dateFrom?: string;
  dateTo?: string;
  signDigital: boolean;
}

export interface ComplianceReportGenerationProgress {
  status: 'idle' | 'processing' | 'completed' | 'error';
  percentage: number;
  message: string;
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
  format: ComplianceReportFormat;
  periodLabel: string;
  complianceStatus: string;
  isSigned: boolean;
  downloadUrl: string;
  fileName: string;
  pdfUrl: string;
  alerts: ComplianceReportAlert[];
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

export interface AdminAlertPreferences {
  academyId: string;
  channels: {
    inApp: boolean;
    push: boolean;
    email: boolean;
  };
  severity: {
    critical: boolean;
    preventive: boolean;
    informative: boolean;
  };
  digestWindowMinutes: number;
  silencedUntil: string | null;
  updatedAt: string;
}

export type HealthComponentStatus = 'ok' | 'degraded' | 'offline' | 'warning';

export type HealthMonitorWindow = '24h' | '30d';

export interface HealthTimeseriesPoint {
  timestamp: string;
  value: number;
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

export interface HealthAlertHint {
  component: 'api' | 'database' | 'cache' | 'email' | 'storage';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  recommendation: string;
  targetPath: string;
}

export interface HealthSnapshotResponse {
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

export interface AdminDashboardQuickAction {
  key: 'audit' | 'export-report' | 'manage-users' | 'settings' | 'backup' | 'health-monitor' | 'professors' | 'profile' | 'consent-templates';
  label: string;
  description: string;
  icon: string;
  secondary?: boolean;
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

export interface CreateProfessorTurmaPayload {
  turmaName: string;
  description?: string;
  scheduleJson?: TurmaScheduleEntry[];
  studentIds?: string[];
}

export interface TurmaScheduleEntry {
  day: string;
  startTime?: string;
  endTime?: string;
  time?: string;
  turn?: string;
}

export interface CreateProfessorTurmaResponse {
  message: string;
  turma: {
    turmaId: string;
    turmaName: string;
    description?: string;
    scheduleJson?: TurmaScheduleEntry[];
    isActive?: boolean;
  };
}

export interface ProfessorTurmaItem {
  turmaId: string;
  turmaName: string;
  description?: string;
  scheduleJson?: TurmaScheduleEntry[];
  studentIds?: string[];
  isActive: boolean;
}

export interface ListProfessorTurmasResponse {
  turmas: ProfessorTurmaItem[];
  total: number;
}

export interface UpdateProfessorTurmaPayload {
  turmaName?: string;
  description?: string;
  scheduleJson?: TurmaScheduleEntry[];
  studentIds?: string[];
  isActive?: boolean;
}

export interface TurmaEligibleStudentItem {
  studentId: string;
  fullName: string;
}

export interface ListTurmaEligibleStudentsResponse {
  students: TurmaEligibleStudentItem[];
  filters: {
    name?: string;
  };
  total: number;
}

export interface UpdateProfessorTurmaResponse {
  message: string;
  turma: ProfessorTurmaItem;
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

export interface EnrollTrainingStudentResponse {
  message: string;
  attendance: TrainingAttendanceResponse;
}

export interface PresentStudent {
  userId: string;
  fullName: string;
  avatarInitials: string;
}

export interface StudentNote {
  studentId: string;
  content: string;
  updatedAt: string;
}

export interface GetSessionNotesResponse {
  generalNotes: string | null;
  presentStudents: PresentStudent[];
  studentNotes: StudentNote[];
}

export interface SaveNotesPayload {
  notes: string;
}

export interface SaveStudentNotePayload {
  content: string;
}

export interface SaveNotesResponse {
  success: boolean;
}

export interface TrainingReviewSummaryResponse {
  session: {
    sessionId: string;
    turmaId: string;
    turmaName: string;
    sessionDate: string;
    sessionTime: string;
    durationMinutes: number;
  };
  attendance: {
    total: number;
    present: number;
    absentNames: string[];
  };
  techniques: {
    count: number;
    names: string[];
  };
  notes: {
    general: string;
  };
}

export interface ConfirmTrainingResponse {
  success: boolean;
  message: string;
  sessionId: string;
  confirmedAt: string;
  studentsNotified: boolean;
}

export interface Technique {
  techniqueId: string;
  name: string;
  description?: string;
  category: 'Básica' | 'Avançada';
  iconUrl?: string;
  displayOrder: number;
}

export interface GetTechniquesResponse {
  byId: Record<string, Technique>;
  categories: Record<string, string[]>;
}

export interface GetSessionTechniquesResponse {
  selectedTechniqueIds: string[];
  summary: {
    count: number;
    names: string[];
  };
  allTechniques: GetTechniquesResponse;
}

export interface SelectTechniqueResponse {
  message: string;
  sessionId: string;
  techniqueId: string;
  selectedTechniqueIds: string[];
  summary: {
    count: number;
    names: string[];
  };
}

export interface DeselectTechniqueResponse {
  message: string;
  sessionId: string;
  techniqueId: string;
  selectedTechniqueIds: string[];
  summary: {
    count: number;
    names: string[];
  };
}

export interface CustomTechniqueRequest {
  name: string;
}

export interface AddCustomTechniqueResponse {
  message: string;
  technique: Technique;
}

export interface CreateAcademyTechniquePayload {
  name: string;
  description?: string;
  category: 'Básica' | 'Avançada';
}

export interface CreateAcademyTechniqueResponse {
  message: string;
  technique: Technique;
}

export interface DeleteAcademyTechniqueResponse {
  message: string;
  technique: Technique;
}

export interface TechniquePreset {
  presetId: string;
  name: string;
  techniqueCount: number;
  createdAt: Date;
}

export interface SaveTechniquePresetPayload {
  name: string;
  techniqueIds: string[];
}

export interface SaveTechniquePresetResponse {
  message: string;
  preset: TechniquePreset;
}

export interface GetPresetsResponse {
  presets: TechniquePreset[];
}

export interface ApplyPresetResponse {
  message: string;
  sessionId: string;
  presetId: string;
  presetName: string;
  selectedTechniqueIds: string[];
  summary: {
    count: number;
    names: string[];
  };
}

export interface ReorderSessionTechniquesResponse {
  message: string;
  sessionId: string;
  selectedTechniqueIds: string[];
  summary: {
    count: number;
    names: string[];
  };
}

export interface RecentTrainingSummary {
  sessionId: string;
  sessionDate: string;
  turmaName: string;
  presentCount: number;
  techniquePreview: string[];
}

export interface GetRecentTrainingsResponse {
  trainings: RecentTrainingSummary[];
}

export interface StudentProgressMonthlyItem {
  monthStart: string;
  presentCount: number;
  totalCount: number;
}

export interface StudentProgressCommentItem {
  content: string;
  professorName: string;
  sessionDate?: string;
  createdAt: string;
}

export interface StudentProgressBeltHistoryItem {
  belt: string;
  receivedDate: string;
  promotedBy?: string;
  notes?: string;
  durationDays: number;
}

// Story 4-2: Card 1 Expandido - Chart Data
export interface StudentProgressWeekly {
  weekNumber: number;
  date: string;
  proficiencyPercent: number;
}

export interface StudentProgressChartData {
  weeklyEvolution: StudentProgressWeekly[];
  minValue: number;
  maxValue: number;
  trend: 'up' | 'down' | 'flat';
}

export interface StudentAttendanceHistoryItem {
  sessionDate: string;
  turmaName: string;
  status: 'present' | 'absent' | 'justified';
  absenceReason?: string;
}

export interface StudentAttendanceHistoryResponse {
  studentName: string;
  items: StudentAttendanceHistoryItem[];
  total: number;
  limit: number;
  offset: number;
  attendancePercentage: number;
  warningBelow70: boolean;
  currentStreak: number;
  currentStreakDays: number;
  generatedAt: string;
}

// Story 4-4: Comment History types
export interface StudentCommentHistoryItem {
  content: string;
  professorName: string;
  sessionDate?: string;
  createdAt: string;
}

export interface StudentCommentHistoryResponse {
  items: StudentCommentHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

// Story 4-5: Badges and milestones detailed history
export interface StudentBadgeUnlockedItem {
  badgeId: string;
  name: string;
  description: string;
  iconUrl?: string;
  earnedAt: string;
  shareText: string;
}

export interface StudentBadgeUpcomingItem {
  badgeId: string;
  name: string;
  description: string;
  iconUrl?: string;
  criteriaType: 'streak' | 'attendance_percentage' | 'sessions_total' | 'milestone';
  criteriaValue: number;
  currentValue: number;
  progressPercent: number;
  remaining: number;
  etaHint?: string;
}

export interface StudentBadgesHistoryResponse {
  unlocked: StudentBadgeUnlockedItem[];
  upcoming: StudentBadgeUpcomingItem[];
  totals: {
    unlocked: number;
    upcoming: number;
  };
}

export interface StudentMonthlyStats {
  monthStart: string;
  monthLabel: string;
  frequencia: {
    presentCount: number;
    totalCount: number;
    pct: number;
  };
  tecnicas: number;
  comentarios: number;
}

export interface StudentMonthlyComparisonResponse {
  currentMonth: StudentMonthlyStats;
  previousMonth: StudentMonthlyStats | null;
  history: StudentMonthlyStats[];
  hasEnoughData: boolean;
}

export interface StudentNotificationItem {
  notificationId: string;
  type: 'badge_earned' | 'attendance_reminder' | 'alert_system' | 'comment_received';
  category: 'badges' | 'frequencia' | 'comentarios' | 'lembretes';
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  createdAt: string;
  sentAt?: string;
  readAt?: string;
  isRead: boolean;
}

export interface StudentNotificationFeedResponse {
  items: StudentNotificationItem[];
  total: number;
  limit: number;
  offset: number;
  unreadCount: number;
}

export interface StudentNotificationPreferences {
  badges: boolean;
  frequencia: boolean;
  comentarios: boolean;
  lembretes: boolean;
}

// Story 4-8: Belt History types
export interface StudentBeltHistoryEntry {
  beltHistoryId: number;
  belt: string;
  receivedDate: string;
  promotedBy?: string;
  notes?: string;
  durationDays: number;
  isCurrentBelt: boolean;
}

export interface StudentBeltHistoryResponse {
  entries: StudentBeltHistoryEntry[];
  stats: {
    totalBelts: number;
    longestBeltName: string;
    longestBeltDays: number;
    lastBeltDate?: string;
    dataEntrada?: string;
  };
  judoProfile: {
    currentBelt?: string;
    isFederated: boolean;
    federationRegistration?: string;
    federationDate?: string;
  };
}

export interface StudentProgressDashboardResponse {
  heading: string;
  subheading: string;
  cards: {
    evolucaoMes: {
      currentMonthPresentCount: number;
      previousMonthPresentCount: number;
      delta: number;
      monthlySeries: StudentProgressMonthlyItem[];
      weeklySeries: StudentProgressWeekly[];
    };
    frequencia: {
      presentCount90d: number;
      totalCount90d: number;
      attendancePercentage90d: number;
      nextClass?: {
        turmaName: string;
        sessionDate: string;
        sessionTime: string;
      };
      recentSessions: Array<{
        sessionDate: string;
        status: 'present' | 'absent' | 'justified';
      }>;
    };
    comentariosProfessor: {
      latest?: StudentProgressCommentItem;
      totalComments: number;
      timeline: StudentProgressCommentItem[];
    };
    faixaConquistas: {
      currentBelt?: string;
      beltDate?: string;
      isFederated: boolean;
      federationDate?: string;
      federationRegistration?: string;
      totalBadges: number;
      latestBadges: Array<{
        name: string;
        earnedAt: string;
      }>;
      currentStreak: number;
      beltHistory: StudentProgressBeltHistoryItem[];
    };
  };
  generatedAt: string;
}

// Story 3-7: Training History types
export interface TrainingHistoryItem {
  session_id: string;
  session_date: string;
  session_time: string;
  turma_name: string;
  present_count: number;
  total_count: number;
  technique_names: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingHistoryFilters {
  dateFrom?: string;
  dateTo?: string;
  turmaId?: string;
  keyword?: string;
}

export interface TrainingHistoryResponse {
  trainings: TrainingHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TrainingAttendanceRecord {
  student_id: string;
  student_name: string;
  status: 'present' | 'absent' | 'justified';
}

export interface TrainingDetailsResponse {
  session_id: string;
  turma_id: string;
  professor_id: string;
  session_date: string;
  session_time: string;
  duration_minutes: number;
  notes: string | null;
  turma_name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  attendance: TrainingAttendanceRecord[];
  techniques?: Array<{ technique_id: string; name: string; category: string }>;
}

export interface UpdateTrainingPayload {
  notes?: string;
}

export interface UpdateTrainingResponse {
  success: boolean;
  data: TrainingDetailsResponse;
}

export interface DeleteTrainingResponse {
  success: boolean;
  data: {
    undo_deadline: string;
  };
}

export interface RestoreTrainingResponse {
  success: boolean;
  data: TrainingDetailsResponse;
}
