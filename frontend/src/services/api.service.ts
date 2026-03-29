import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Academy,
  AcademyProfile,
  AdminProfileUpdatePayload,
  ChangePasswordPayload,
  User,
  JWTResponse,
  ListProfessorsResponse,
  CreateProfessorPayload,
  UpdateProfessorPayload,
  UpdateProfessorStatusPayload,
  ResetProfessorPasswordPayload,
  ProfessorMutationResponse,
  ProfessorProfile,
  ListStudentsResponse,
  CreateStudentPayload,
  UpdateStudentPayload,
  UpdateStudentStatusPayload,
  StudentMutationResponse,
  ListAdminUsersResponse,
  CreateAdminManagedUserPayload,
  UpdateAdminManagedUserPayload,
  DeleteAdminManagedUserPayload,
  AdminManagedUserMutationResponse,
  BackupIntegrityResponse,
  BackupJobResponse,
  BackupListResponse,
  BackupScheduleConfig,
  BackupScheduleUpdatePayload,
  BackupTriggerResponse,
  RestoreBackupPayload,
  TriggerBackupPayload,
  StudentFichaResponse,
  StudentProfile,
  GuardianSearchResult,
  LinkGuardianPayload,
  CreateAndLinkGuardianPayload,
  GuardianMutationResponse,
  MinorWithoutGuardianItem,
  StudentWithoutHealthScreeningItem,
  HealthRecord,
  HealthScreeningPayload,
  ConsentValidation,
  ConsentTemplate,
  AdminConsentTemplatesResponse,
  PublishConsentTemplatesPayload,
  ReconsentAffectedStudent,
  AuditLogsResponse,
  AuditLogFilter,
  AdminAlertActionType,
  AdminAlertCountResponse,
  AdminAlertFeedResponse,
  AdminAlertPreferences,
  AdminDashboardResponse,
  HealthHistoryResponse,
  HealthMonitorWindow,
  HealthSnapshotResponse,
  DeletionRequestItem,
  DeletionRequestResponse,
  LinkedStudentItem,
  ComplianceReportHistoryItem,
  GenerateComplianceReportRequest,
  ComplianceReportSchedule,
  GenerateComplianceReportResponse,
  TrainingEntryPointResponse,
  CreateProfessorTurmaPayload,
  CreateProfessorTurmaResponse,
  ListTurmaEligibleStudentsResponse,
  ListProfessorTurmasResponse,
  StartTrainingSessionResponse,
  TrainingAttendanceResponse,
  SaveTrainingAttendancePayload,
  SaveTrainingAttendanceResponse,
  EnrollTrainingStudentResponse,
  GetSessionNotesResponse,
  SaveNotesPayload,
  SaveStudentNotePayload,
  SaveNotesResponse,
  TrainingReviewSummaryResponse,
  ConfirmTrainingResponse,
  UpdateAcademyProfilePayload,
  GetTechniquesResponse,
  GetSessionTechniquesResponse,
  SelectTechniqueResponse,
  DeselectTechniqueResponse,
  AddCustomTechniqueResponse,
  CreateAcademyTechniquePayload,
  CreateAcademyTechniqueResponse,
  DeleteAcademyTechniqueResponse,
  TechniquePreset,
  SaveTechniquePresetPayload,
  SaveTechniquePresetResponse,
  GetPresetsResponse,
  ApplyPresetResponse,
  ReorderSessionTechniquesResponse,
  RecentTrainingSummary,
  GetRecentTrainingsResponse,
  StudentProgressDashboardResponse,
  StudentAttendanceHistoryResponse,
  StudentBadgesHistoryResponse,
  StudentMonthlyComparisonResponse,
  StudentNotificationFeedResponse,
  StudentCommentHistoryResponse,
  StudentBeltHistoryResponse,
  StudentProgressWeekly,
  TrainingHistoryFilters,
  TrainingHistoryResponse,
  TrainingDetailsResponse,
  UpdateTrainingPayload,
  UpdateTrainingResponse,
  DeleteTrainingResponse,
  RestoreTrainingResponse,
  UpdateProfessorTurmaPayload,
  UpdateProfessorTurmaResponse,
} from '../types';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  lookupAddressByCep(cep: string): Observable<{
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
    erro?: boolean | string;
  }> {
    const sanitizedCep = (cep || '').replace(/\D/g, '').slice(0, 8);
    return this.http.get<{
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
      erro?: boolean | string;
    }>(`https://viacep.com.br/ws/${sanitizedCep}/json/`);
  }

  checkSetupNeeded(): Observable<{ needsSetup: boolean; academyId?: string }> {
    return this.http.get<{ needsSetup: boolean; academyId?: string }>(`${this.apiUrl}/auth/setup/init`);
  }

  createAcademy(data: {
    name: string;
    fantasyName?: string;
    location: string;
    email: string;
    phone: string;
    logoUrl?: string;
  }): Observable<{ academyId: string; message: string; nextStep: string }> {
    return this.http.post<any>(`${this.apiUrl}/auth/academies`, data);
  }

  getAdminAcademyProfile(): Observable<AcademyProfile> {
    return this.http.get<AcademyProfile>(`${this.apiUrl}/admin/academy-profile`, {
      headers: this.getHeaders(),
    });
  }

  getAdminDashboard(): Observable<AdminDashboardResponse> {
    return this.http.get<AdminDashboardResponse>(`${this.apiUrl}/admin/dashboard`, {
      headers: this.getHeaders(),
    });
  }

  getAdminHealthMonitor(): Observable<HealthSnapshotResponse> {
    return this.http.get<HealthSnapshotResponse>(`${this.apiUrl}/admin/health-monitor`, {
      headers: this.getHeaders(),
    });
  }

  getAdminHealthMonitorHistory(window: HealthMonitorWindow = '24h'): Observable<HealthHistoryResponse> {
    return this.http.get<HealthHistoryResponse>(`${this.apiUrl}/admin/health-monitor/history`, {
      headers: this.getHeaders(),
      params: { window },
    });
  }

  getAdminAlerts(params?: { limit?: number; offset?: number }): Observable<AdminAlertFeedResponse> {
    const queryParams: Record<string, string> = {};
    if (typeof params?.limit === 'number') queryParams['limit'] = String(params.limit);
    if (typeof params?.offset === 'number') queryParams['offset'] = String(params.offset);

    return this.http.get<AdminAlertFeedResponse>(`${this.apiUrl}/admin/alerts`, {
      headers: this.getHeaders(),
      params: queryParams,
    });
  }

  getAdminAlertCounts(): Observable<AdminAlertCountResponse> {
    return this.http.get<AdminAlertCountResponse>(`${this.apiUrl}/admin/alerts/count`, {
      headers: this.getHeaders(),
    });
  }

  executeAdminAlertAction(
    alertId: string,
    action: AdminAlertActionType
  ): Observable<{ message: string; alert: any }> {
    return this.http.patch<{ message: string; alert: any }>(
      `${this.apiUrl}/admin/alerts/${alertId}/action`,
      { action },
      { headers: this.getHeaders() }
    );
  }

  getAdminAlertPreferences(): Observable<AdminAlertPreferences> {
    return this.http.get<AdminAlertPreferences>(`${this.apiUrl}/admin/alerts/preferences`, {
      headers: this.getHeaders(),
    });
  }

  updateAdminAlertPreferences(payload: {
    channels: AdminAlertPreferences['channels'];
    severity: AdminAlertPreferences['severity'];
    digestWindowMinutes: number;
  }): Observable<AdminAlertPreferences> {
    return this.http.post<AdminAlertPreferences>(`${this.apiUrl}/admin/alerts/preferences`, payload, {
      headers: this.getHeaders(),
    });
  }

  silenceAdminAlerts(durationMinutes: number = 60): Observable<AdminAlertPreferences> {
    return this.http.post<AdminAlertPreferences>(
      `${this.apiUrl}/admin/alerts/silence`,
      { durationMinutes },
      { headers: this.getHeaders() }
    );
  }

  updateAdminAcademyProfile(
    payload: UpdateAcademyProfilePayload
  ): Observable<{ message: string; academy: AcademyProfile }> {
    return this.http.put<{ message: string; academy: AcademyProfile }>(
      `${this.apiUrl}/admin/academy-profile`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  getUserProfile(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}/profile`, {
      headers: this.getHeaders(),
    });
  }

  updateUserProfile(
    userId: string,
    payload: AdminProfileUpdatePayload
  ): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(
      `${this.apiUrl}/users/${userId}`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  listAdminUsers(filters?: {
    page?: number;
    limit?: number;
    role?: 'Admin' | 'Professor' | 'Aluno' | 'Responsavel' | 'all';
    status?: 'active' | 'blocked' | 'pending' | 'all';
    search?: string;
  }): Observable<ListAdminUsersResponse> {
    const params: Record<string, string> = {};
    if (typeof filters?.page === 'number') params['page'] = String(filters.page);
    if (typeof filters?.limit === 'number') params['limit'] = String(filters.limit);
    if (filters?.role && filters.role !== 'all') params['role'] = filters.role;
    if (filters?.status && filters.status !== 'all') params['status'] = filters.status;
    if (filters?.search) params['search'] = filters.search;

    return this.http.get<ListAdminUsersResponse>(`${this.apiUrl}/admin/users`, {
      headers: this.getHeaders(),
      params,
    });
  }

  createAdminManagedUser(payload: CreateAdminManagedUserPayload): Observable<AdminManagedUserMutationResponse> {
    return this.http.post<AdminManagedUserMutationResponse>(`${this.apiUrl}/admin/users`, payload, {
      headers: this.getHeaders(),
    });
  }

  updateAdminManagedUser(
    userId: string,
    payload: UpdateAdminManagedUserPayload
  ): Observable<AdminManagedUserMutationResponse> {
    return this.http.put<AdminManagedUserMutationResponse>(`${this.apiUrl}/admin/users/${userId}`, payload, {
      headers: this.getHeaders(),
    });
  }

  deleteAdminManagedUser(
    userId: string,
    payload?: DeleteAdminManagedUserPayload
  ): Observable<AdminManagedUserMutationResponse> {
    return this.http.delete<AdminManagedUserMutationResponse>(`${this.apiUrl}/admin/users/${userId}`, {
      headers: this.getHeaders(),
      body: payload || {},
    });
  }

  exportAdminUsersCsv(filters?: {
    role?: 'Admin' | 'Professor' | 'Aluno' | 'Responsavel' | 'all';
    status?: 'active' | 'blocked' | 'pending' | 'all';
    search?: string;
  }): Observable<HttpResponse<Blob>> {
    const params: Record<string, string> = {};
    if (filters?.role && filters.role !== 'all') params['role'] = filters.role;
    if (filters?.status && filters.status !== 'all') params['status'] = filters.status;
    if (filters?.search) params['search'] = filters.search;

    return this.http.get(`${this.apiUrl}/admin/users/export`, {
      headers: this.getHeaders(),
      params,
      observe: 'response',
      responseType: 'blob',
    });
  }

  listAdminBackups(): Observable<BackupListResponse> {
    return this.http.get<BackupListResponse>(`${this.apiUrl}/admin/backup/jobs`, {
      headers: this.getHeaders(),
    });
  }

  getAdminBackupJobStatus(jobId: string): Observable<BackupJobResponse> {
    return this.http.get<BackupJobResponse>(`${this.apiUrl}/admin/backup/jobs/${jobId}`, {
      headers: this.getHeaders(),
    });
  }

  triggerAdminBackup(payload: TriggerBackupPayload): Observable<BackupTriggerResponse> {
    return this.http.post<BackupTriggerResponse>(`${this.apiUrl}/admin/backup/trigger`, payload, {
      headers: this.getHeaders(),
    });
  }

  downloadAdminBackup(jobId: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/admin/backup/download/${jobId}`, {
      headers: this.getHeaders(),
      observe: 'response',
      responseType: 'blob',
    });
  }

  verifyAdminBackup(jobId: string): Observable<BackupIntegrityResponse> {
    return this.http.post<BackupIntegrityResponse>(`${this.apiUrl}/admin/backup/verify/${jobId}`, {}, {
      headers: this.getHeaders(),
    });
  }

  restoreAdminBackup(jobId: string, payload: RestoreBackupPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/admin/backup/restore/${jobId}`, payload, {
      headers: this.getHeaders(),
    });
  }

  deleteAdminBackupJob(jobId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/admin/backup/jobs/${jobId}`, {
      headers: this.getHeaders(),
    });
  }

  getAdminBackupSchedule(): Observable<BackupScheduleConfig> {
    return this.http.get<BackupScheduleConfig>(`${this.apiUrl}/admin/backup/schedule`, {
      headers: this.getHeaders(),
    });
  }

  upsertAdminBackupSchedule(payload: BackupScheduleUpdatePayload): Observable<BackupScheduleConfig> {
    return this.http.put<BackupScheduleConfig>(`${this.apiUrl}/admin/backup/schedule`, payload, {
      headers: this.getHeaders(),
    });
  }

  listProfessors(filters?: { name?: string; status?: 'active' | 'inactive' | 'all' }): Observable<ListProfessorsResponse> {
    const params: Record<string, string> = {};
    if (filters?.name) params['name'] = filters.name;
    if (filters?.status) params['status'] = filters.status;

    return this.http.get<ListProfessorsResponse>(`${this.apiUrl}/users/professores`, {
      headers: this.getHeaders(),
      params,
    });
  }

  createProfessor(payload: CreateProfessorPayload): Observable<ProfessorMutationResponse> {
    return this.http.post<ProfessorMutationResponse>(`${this.apiUrl}/users/professores`, payload, {
      headers: this.getHeaders(),
    });
  }

  updateProfessor(userId: string, payload: UpdateProfessorPayload): Observable<ProfessorMutationResponse> {
    return this.http.put<ProfessorMutationResponse>(`${this.apiUrl}/users/professores/${userId}`, payload, {
      headers: this.getHeaders(),
    });
  }

  updateProfessorStatus(
    userId: string,
    payload: UpdateProfessorStatusPayload
  ): Observable<ProfessorMutationResponse> {
    return this.http.put<ProfessorMutationResponse>(`${this.apiUrl}/users/professores/${userId}/status`, payload, {
      headers: this.getHeaders(),
    });
  }

  resetProfessorPassword(userId: string, payload: ResetProfessorPasswordPayload): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/users/professores/${userId}/reset-password`, payload, {
      headers: this.getHeaders(),
    });
  }

  getProfessorById(userId: string): Observable<ProfessorProfile> {
    return this.http.get<ProfessorProfile>(`${this.apiUrl}/users/${userId}/profile`, {
      headers: this.getHeaders(),
    });
  }

  listStudents(filters?: { name?: string; status?: 'active' | 'inactive' | 'all' }): Observable<ListStudentsResponse> {
    const params: Record<string, string> = {};
    if (filters?.name) params['name'] = filters.name;
    if (filters?.status) params['status'] = filters.status;

    return this.http.get<ListStudentsResponse>(`${this.apiUrl}/users/alunos`, {
      headers: this.getHeaders(),
      params,
    });
  }

  listMyStudents(filters?: { name?: string; status?: 'active' | 'inactive' | 'all' }): Observable<ListStudentsResponse> {
    const params: Record<string, string> = {};
    if (filters?.name) params['name'] = filters.name;
    if (filters?.status) params['status'] = filters.status;

    return this.http.get<ListStudentsResponse>(`${this.apiUrl}/users/professores/meus-alunos`, {
      headers: this.getHeaders(),
      params,
    });
  }

  createStudent(payload: CreateStudentPayload): Observable<StudentMutationResponse> {
    return this.http.post<StudentMutationResponse>(`${this.apiUrl}/users/alunos`, payload, {
      headers: this.getHeaders(),
    });
  }

  updateStudent(userId: string, payload: UpdateStudentPayload): Observable<StudentMutationResponse> {
    return this.http.put<StudentMutationResponse>(`${this.apiUrl}/users/alunos/${userId}`, payload, {
      headers: this.getHeaders(),
    });
  }

  updateStudentStatus(userId: string, payload: UpdateStudentStatusPayload): Observable<StudentMutationResponse> {
    return this.http.put<StudentMutationResponse>(`${this.apiUrl}/users/alunos/${userId}/status`, payload, {
      headers: this.getHeaders(),
    });
  }

  getStudentById(userId: string): Observable<StudentProfile> {
    return this.http.get<StudentProfile>(`${this.apiUrl}/users/${userId}/profile`, {
      headers: this.getHeaders(),
    });
  }

  getStudentFicha(userId: string): Observable<StudentFichaResponse> {
    return this.http.get<StudentFichaResponse>(`${this.apiUrl}/users/alunos/${userId}/ficha`, {
      headers: this.getHeaders(),
    });
  }

  searchGuardianByEmail(email: string): Observable<{ guardian: GuardianSearchResult }> {
    return this.http.get<{ guardian: GuardianSearchResult }>(`${this.apiUrl}/users/responsaveis/search`, {
      headers: this.getHeaders(),
      params: { email },
    });
  }

  linkGuardianToStudent(studentId: string, payload: LinkGuardianPayload): Observable<GuardianMutationResponse> {
    return this.http.post<GuardianMutationResponse>(
      `${this.apiUrl}/users/alunos/${studentId}/responsavel/link`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  createAndLinkGuardian(
    studentId: string,
    payload: CreateAndLinkGuardianPayload
  ): Observable<GuardianMutationResponse> {
    return this.http.post<GuardianMutationResponse>(
      `${this.apiUrl}/users/alunos/${studentId}/responsavel`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  unlinkGuardianFromStudent(studentId: string, guardianId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/users/alunos/${studentId}/responsavel/${guardianId}`,
      { headers: this.getHeaders() }
    );
  }

  changePassword(payload: ChangePasswordPayload): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/auth/change-password`, payload, {
      headers: this.getHeaders(),
    });
  }

  initAdmin(
    academyId: string,
    data: {
      email: string;
      password: string;
      fullName: string;
      photoUrl?: string;
    }
  ): Observable<{ userId: string; email: string; message: string }> {
    return this.http.post<any>(`${this.apiUrl}/auth/academies/${academyId}/init-admin`, data);
  }

  login(credentials: { email: string; password: string }): Observable<JWTResponse> {
    return this.http.post<JWTResponse>(`${this.apiUrl}/auth/login`, credentials, {
      withCredentials: true,
    });
  }

  refreshToken(): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>(
      `${this.apiUrl}/auth/refresh`,
      {},
      { withCredentials: true }
    );
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/auth/logout`,
      {},
      { withCredentials: true }
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string; redirectTo: string }> {
    return this.http.post<{ message: string; redirectTo: string }>(`${this.apiUrl}/auth/reset-password`, {
      token,
      newPassword,
    });
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/users/@me`, {
      headers: this.getHeaders(),
    });
  }

  registerUser(data: {
    email: string;
    password: string;
    fullName: string;
    role: 'Professor' | 'Aluno';
    academyId: string;
    birthDate?: string;
    responsavelEmail?: string;
    photoUrl?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, data, {
      withCredentials: true,
    });
  }

  setAccessToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  clearTokens(): void {
    localStorage.removeItem('accessToken');
  }

  getHealthScreening(studentId: string): Observable<{ healthRecord: HealthRecord }> {
    return this.http.get<{ healthRecord: HealthRecord }>(
      `${this.apiUrl}/health-screening/${studentId}`,
      { headers: this.getHeaders() }
    );
  }

  createHealthScreening(
    studentId: string,
    data: HealthScreeningPayload
  ): Observable<{ healthRecordId: string; message: string }> {
    return this.http.post<{ healthRecordId: string; message: string }>(
      `${this.apiUrl}/health-screening/${studentId}`,
      data,
      { headers: this.getHeaders() }
    );
  }

  updateHealthScreening(
    studentId: string,
    data: Partial<HealthScreeningPayload>
  ): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.apiUrl}/health-screening/${studentId}`,
      data,
      { headers: this.getHeaders() }
    );
  }

  validateConsentToken(token: string): Observable<ConsentValidation> {
    return this.http.get<ConsentValidation>(`${this.apiUrl}/consent/${token}/validate`);
  }

  getConsentTemplate(
    token: string,
    type: 'privacy' | 'health' | 'ethics'
  ): Observable<ConsentTemplate> {
    return this.http.get<ConsentTemplate>(`${this.apiUrl}/consent/${token}/template/${type}`);
  }

  getConsentTemplateByVersion(
    token: string,
    type: 'privacy' | 'health' | 'ethics',
    version: number
  ): Observable<ConsentTemplate> {
    return this.http.get<ConsentTemplate>(
      `${this.apiUrl}/consent/${token}/template/${type}/version/${version}`
    );
  }

  signConsent(
    token: string,
    signatureBase64: string
  ): Observable<{ message: string; studentName: string }> {
    return this.http.post<{ message: string; studentName: string }>(
      `${this.apiUrl}/consent/${token}/sign`,
      { signatureBase64 }
    );
  }

  resendConsent(studentId: string): Observable<{ message: string; consentLink: string }> {
    return this.http.post<{ message: string; consentLink: string }>(
      `${this.apiUrl}/consent/admin/students/${studentId}/resend`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getAdminConsentTemplates(): Observable<AdminConsentTemplatesResponse> {
    return this.http.get<AdminConsentTemplatesResponse>(
      `${this.apiUrl}/admin/consent-templates`,
      {
        headers: this.getHeaders().set('Cache-Control', 'no-cache').set('Pragma', 'no-cache'),
        params: { _t: Date.now().toString() },
      }
    );
  }

  publishAdminConsentTemplates(
    data: PublishConsentTemplatesPayload
  ): Observable<{
    message: string;
    version: string;
    templates: AdminConsentTemplatesResponse['templates'];
    affectedStudents: ReconsentAffectedStudent[];
  }> {
    return this.http.post<{
      message: string;
      version: string;
      templates: AdminConsentTemplatesResponse['templates'];
      affectedStudents: ReconsentAffectedStudent[];
    }>(`${this.apiUrl}/admin/consent-templates/publish`, data, {
      headers: this.getHeaders(),
    });
  }

  // ── Auditoria LGPD ─────────────────────────────────────────────────────────

  private buildAuditQueryParams(
    filter: AuditLogFilter,
    extra?: Record<string, string>
  ): Record<string, string> {
    const params: Record<string, string> = {};
    if (filter.userId) params['userId'] = filter.userId;
    if (filter.action) params['action'] = filter.action;
    if (filter.resourceType) params['resourceType'] = filter.resourceType;
    if (filter.outcome) params['outcome'] = filter.outcome;
    if (filter.dateFrom) params['dateFrom'] = filter.dateFrom;
    if (filter.dateTo) params['dateTo'] = filter.dateTo;
    return { ...params, ...extra };
  }

  getAuditLogs(
    filter: AuditLogFilter,
    page: number = 1,
    limit: number = 50
  ): Observable<AuditLogsResponse> {
    const params = this.buildAuditQueryParams(filter, {
      page: String(page),
      limit: String(limit),
    });
    return this.http.get<AuditLogsResponse>(`${this.apiUrl}/admin/audit-logs`, {
      headers: this.getHeaders(),
      params,
    });
  }

  exportAuditLogsCsv(filter: AuditLogFilter): Observable<Blob> {
    const params = this.buildAuditQueryParams(filter);
    return this.http.get(`${this.apiUrl}/admin/audit-logs/export`, {
      headers: this.getHeaders(),
      responseType: 'blob',
      params,
    });
  }

  exportAuditLogsPdf(filter: AuditLogFilter): Observable<Blob> {
    const params = this.buildAuditQueryParams(filter);
    return this.http.get(`${this.apiUrl}/admin/audit-logs/export-pdf`, {
      headers: this.getHeaders(),
      responseType: 'blob',
      params,
    });
  }

  getTrainingEntryPoint(): Observable<TrainingEntryPointResponse> {
    return this.http.get<TrainingEntryPointResponse>(`${this.apiUrl}/trainings/entry-point`, {
      headers: this.getHeaders(),
    });
  }

  createProfessorTurma(payload: CreateProfessorTurmaPayload): Observable<CreateProfessorTurmaResponse> {
    return this.http.post<CreateProfessorTurmaResponse>(
      `${this.apiUrl}/trainings/turmas`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  listProfessorTurmas(): Observable<ListProfessorTurmasResponse> {
    return this.http.get<ListProfessorTurmasResponse>(
      `${this.apiUrl}/trainings/turmas`,
      { headers: this.getHeaders() }
    );
  }

  listEligibleTurmaStudents(filters?: { name?: string }): Observable<ListTurmaEligibleStudentsResponse> {
    const params: Record<string, string> = {};
    if (filters?.name) params['name'] = filters.name;

    return this.http.get<ListTurmaEligibleStudentsResponse>(
      `${this.apiUrl}/trainings/turmas/eligible-students`,
      { headers: this.getHeaders(), params }
    );
  }

  updateProfessorTurma(
    turmaId: string,
    payload: UpdateProfessorTurmaPayload
  ): Observable<UpdateProfessorTurmaResponse> {
    return this.http.put<UpdateProfessorTurmaResponse>(
      `${this.apiUrl}/trainings/turmas/${turmaId}`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  startTrainingSession(turmaId: string, sessionDate?: string, sessionTime?: string): Observable<StartTrainingSessionResponse> {
    const body: Record<string, string> = { turmaId };
    if (sessionDate) body['sessionDate'] = sessionDate;
    if (sessionTime) body['sessionTime'] = sessionTime;
    return this.http.post<StartTrainingSessionResponse>(
      `${this.apiUrl}/trainings/start`,
      body,
      { headers: this.getHeaders() }
    );
  }

  getTrainingAttendance(sessionId: string): Observable<TrainingAttendanceResponse> {
    return this.http.get<TrainingAttendanceResponse>(
      `${this.apiUrl}/trainings/${sessionId}/attendance`,
      { headers: this.getHeaders() }
    );
  }

  saveTrainingAttendance(
    sessionId: string,
    payload: SaveTrainingAttendancePayload
  ): Observable<SaveTrainingAttendanceResponse> {
    return this.http.post<SaveTrainingAttendanceResponse>(
      `${this.apiUrl}/trainings/${sessionId}/attendance`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  enrollStudentInTrainingTurma(
    sessionId: string,
    studentId: string
  ): Observable<EnrollTrainingStudentResponse> {
    return this.http.post<EnrollTrainingStudentResponse>(
      `${this.apiUrl}/trainings/${sessionId}/enroll-student`,
      { studentId },
      { headers: this.getHeaders() }
    );
  }

  getSessionNotes(sessionId: string): Observable<GetSessionNotesResponse> {
    return this.http.get<GetSessionNotesResponse>(
      `${this.apiUrl}/trainings/${sessionId}/notes`,
      { headers: this.getHeaders() }
    );
  }

  saveSessionNotes(sessionId: string, notes: string): Observable<SaveNotesResponse> {
    return this.http.put<SaveNotesResponse>(
      `${this.apiUrl}/trainings/${sessionId}/notes`,
      { notes } as SaveNotesPayload,
      { headers: this.getHeaders() }
    );
  }

  saveStudentNote(sessionId: string, studentId: string, content: string): Observable<SaveNotesResponse> {
    return this.http.put<SaveNotesResponse>(
      `${this.apiUrl}/trainings/${sessionId}/notes/${studentId}`,
      { content } as SaveStudentNotePayload,
      { headers: this.getHeaders() }
    );
  }

  getTrainingReviewSummary(sessionId: string): Observable<TrainingReviewSummaryResponse> {
    return this.http.get<TrainingReviewSummaryResponse>(
      `${this.apiUrl}/trainings/${sessionId}/review`,
      { headers: this.getHeaders() }
    );
  }

  confirmTrainingSession(sessionId: string): Observable<ConfirmTrainingResponse> {
    return this.http.post<ConfirmTrainingResponse>(
      `${this.apiUrl}/trainings/${sessionId}/confirm`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // ── Técnicas de Treinamento ────────────────────────────────────────────────

  getAcademyTechniques(academyId: string): Observable<GetTechniquesResponse> {
    return this.http.get<GetTechniquesResponse>(`${this.apiUrl}/academies/${academyId}/techniques`, {
      headers: this.getHeaders(),
    });
  }

  createAcademyTechnique(
    academyId: string,
    payload: CreateAcademyTechniquePayload
  ): Observable<CreateAcademyTechniqueResponse> {
    return this.http.post<CreateAcademyTechniqueResponse>(
      `${this.apiUrl}/academies/${academyId}/techniques`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  deleteAcademyTechnique(
    academyId: string,
    techniqueId: string
  ): Observable<DeleteAcademyTechniqueResponse> {
    return this.http.delete<DeleteAcademyTechniqueResponse>(
      `${this.apiUrl}/academies/${academyId}/techniques/${techniqueId}`,
      { headers: this.getHeaders() }
    );
  }

  getSessionTechniques(sessionId: string): Observable<GetSessionTechniquesResponse> {
    return this.http.get<GetSessionTechniquesResponse>(
      `${this.apiUrl}/trainings/${sessionId}/techniques`,
      { headers: this.getHeaders() }
    );
  }

  selectTechnique(sessionId: string, techniqueId: string): Observable<SelectTechniqueResponse> {
    return this.http.post<SelectTechniqueResponse>(
      `${this.apiUrl}/trainings/${sessionId}/techniques`,
      { techniqueId },
      { headers: this.getHeaders() }
    );
  }

  deselectTechnique(sessionId: string, techniqueId: string): Observable<DeselectTechniqueResponse> {
    return this.http.delete<DeselectTechniqueResponse>(
      `${this.apiUrl}/trainings/${sessionId}/techniques/${techniqueId}`,
      { headers: this.getHeaders() }
    );
  }

  addCustomTechnique(sessionId: string, name: string): Observable<AddCustomTechniqueResponse> {
    return this.http.post<AddCustomTechniqueResponse>(
      `${this.apiUrl}/trainings/${sessionId}/techniques/custom`,
      { name },
      { headers: this.getHeaders() }
    );
  }

  getProfessorTechniquePresets(): Observable<GetPresetsResponse> {
    return this.http.get<GetPresetsResponse>(`${this.apiUrl}/trainings/presets`, {
      headers: this.getHeaders(),
    });
  }

  saveTechniquePreset(payload: SaveTechniquePresetPayload): Observable<SaveTechniquePresetResponse> {
    return this.http.post<SaveTechniquePresetResponse>(
      `${this.apiUrl}/trainings/presets`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  applyTechniquePreset(sessionId: string, presetId: string): Observable<ApplyPresetResponse> {
    return this.http.post<ApplyPresetResponse>(
      `${this.apiUrl}/trainings/${sessionId}/apply-preset/${presetId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  reorderSessionTechniques(
    sessionId: string,
    techniqueIds: string[]
  ): Observable<ReorderSessionTechniquesResponse> {
    return this.http.post<ReorderSessionTechniquesResponse>(
      `${this.apiUrl}/trainings/${sessionId}/techniques/reorder`,
      { techniqueIds },
      { headers: this.getHeaders() }
    );
  }

  // ── Direito ao Esquecimento (LGPD) ────────────────────────────────────────

  requestStudentDeletion(studentId: string, reason?: string): Observable<DeletionRequestResponse> {
    return this.http.post<DeletionRequestResponse>(
      `${this.apiUrl}/users/students/${studentId}/deletion-request`,
      { reason: reason || '' },
      { headers: this.getHeaders() }
    );
  }

  getStudentDeletionStatus(studentId: string): Observable<{ request: DeletionRequestItem | null }> {
    return this.http.get<{ request: DeletionRequestItem | null }>(
      `${this.apiUrl}/users/students/${studentId}/deletion-status`,
      { headers: this.getHeaders() }
    );
  }

  listLinkedStudents(): Observable<{ students: LinkedStudentItem[] }> {
    return this.http.get<{ students: LinkedStudentItem[] }>(
      `${this.apiUrl}/users/students/linked`,
      { headers: this.getHeaders() }
    );
  }

  listPendingDeletionRequests(): Observable<{ requests: DeletionRequestItem[] }> {
    return this.http.get<{ requests: DeletionRequestItem[] }>(
      `${this.apiUrl}/admin/deletion-requests`,
      { headers: this.getHeaders() }
    );
  }

  listMinorsWithoutGuardian(): Observable<{ students: MinorWithoutGuardianItem[]; total: number; filter: string }> {
    return this.http.get<{ students: MinorWithoutGuardianItem[]; total: number; filter: string }>(
      `${this.apiUrl}/admin/lgpd/minors-without-guardian`,
      { headers: this.getHeaders() }
    );
  }

  listStudentsWithoutHealthScreening(): Observable<{ students: StudentWithoutHealthScreeningItem[]; total: number; filter: string }> {
    return this.http.get<{ students: StudentWithoutHealthScreeningItem[]; total: number; filter: string }>(
      `${this.apiUrl}/admin/lgpd/students-without-health-screening`,
      { headers: this.getHeaders() }
    );
  }

  cancelDeletionRequest(requestId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/admin/deletion-requests/${requestId}`,
      { headers: this.getHeaders() }
    );
  }

  processDueDeletionRequests(): Observable<{ message: string; processedCount: number }> {
    return this.http.post<{ message: string; processedCount: number }>(
      `${this.apiUrl}/admin/deletion-requests/process-due`,
      {},
      { headers: this.getHeaders() }
    );
  }

  generateComplianceReport(payload?: GenerateComplianceReportRequest): Observable<GenerateComplianceReportResponse> {
    return this.http.post<GenerateComplianceReportResponse>(
      `${this.apiUrl}/admin/compliance-report/generate`,
      payload || {},
      { headers: this.getHeaders() }
    );
  }

  getComplianceReportStatus(): Observable<{ status: string; message: string; latestReport?: ComplianceReportHistoryItem | null }> {
    return this.http.get<{ status: string; message: string; latestReport?: ComplianceReportHistoryItem | null }>(
      `${this.apiUrl}/admin/compliance-report/status`,
      { headers: this.getHeaders() }
    );
  }

  listComplianceReports(): Observable<{ reports: ComplianceReportHistoryItem[] }> {
    return this.http.get<{ reports: ComplianceReportHistoryItem[] }>(
      `${this.apiUrl}/admin/compliance-report/history`,
      { headers: this.getHeaders() }
    );
  }

  downloadComplianceReport(reportId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/admin/compliance-report/download/${reportId}`, {
      headers: this.getHeaders(),
      responseType: 'blob',
    });
  }

  getComplianceReportSchedule(): Observable<{ schedule: ComplianceReportSchedule | null }> {
    return this.http.get<{ schedule: ComplianceReportSchedule | null }>(
      `${this.apiUrl}/admin/compliance-report/schedule`,
      { headers: this.getHeaders() }
    );
  }

  saveComplianceReportSchedule(payload: {
    dayOfMonth: number;
    hour: number;
    minute: number;
    enabled: boolean;
  }): Observable<{ message: string; schedule: ComplianceReportSchedule }> {
    return this.http.post<{ message: string; schedule: ComplianceReportSchedule }>(
      `${this.apiUrl}/admin/compliance-report/schedule`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  getRecentTrainings(limit: number = 3): Observable<GetRecentTrainingsResponse> {
    return this.http.get<GetRecentTrainingsResponse>(
      `${this.apiUrl}/trainings/recent`,
      { headers: this.getHeaders(), params: { limit: String(limit) } }
    );
  }

  getStudentProgressDashboard(): Observable<StudentProgressDashboardResponse> {
    return this.http.get<StudentProgressDashboardResponse>(
      `${this.apiUrl}/users/alunos/me/progresso`,
      { headers: this.getHeaders() }
    );
  }

  getStudentProgressChart(): Observable<StudentProgressWeekly[]> {
    return this.getStudentProgressDashboard().pipe(
      map((response) => response.cards.evolucaoMes.weeklySeries || [])
    );
  }

  getStudentAttendanceHistory(filters?: {
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Observable<StudentAttendanceHistoryResponse> {
    const params: Record<string, string> = {};
    if (filters?.dateFrom) params['dateFrom'] = filters.dateFrom;
    if (filters?.dateTo) params['dateTo'] = filters.dateTo;
    if (filters?.limit !== undefined) params['limit'] = String(filters.limit);
    if (filters?.offset !== undefined) params['offset'] = String(filters.offset);

    return this.http.get<StudentAttendanceHistoryResponse>(
      `${this.apiUrl}/users/alunos/me/frequencia`,
      { headers: this.getHeaders(), params }
    );
  }

  // Story 4-4: Comment history with pagination + keyword search
  getStudentCommentHistory(filters?: {
    keyword?: string;
    limit?: number;
    offset?: number;
  }): Observable<StudentCommentHistoryResponse> {
    const params: Record<string, string> = {};
    if (filters?.keyword) params['keyword'] = filters.keyword;
    if (filters?.limit !== undefined) params['limit'] = String(filters.limit);
    if (filters?.offset !== undefined) params['offset'] = String(filters.offset);

    return this.http.get<StudentCommentHistoryResponse>(
      `${this.apiUrl}/users/alunos/me/comentarios`,
      { headers: this.getHeaders(), params }
    );
  }

  getStudentBadgesHistory(filters?: {
    limitUnlocked?: number;
    limitUpcoming?: number;
  }): Observable<StudentBadgesHistoryResponse> {
    const params: Record<string, string> = {};
    if (filters?.limitUnlocked !== undefined) params['limitUnlocked'] = String(filters.limitUnlocked);
    if (filters?.limitUpcoming !== undefined) params['limitUpcoming'] = String(filters.limitUpcoming);

    return this.http.get<StudentBadgesHistoryResponse>(
      `${this.apiUrl}/users/alunos/me/badges`,
      { headers: this.getHeaders(), params }
    );
  }

  getStudentMonthlyComparison(filters?: {
    months?: number;
  }): Observable<StudentMonthlyComparisonResponse> {
    const params: Record<string, string> = {};
    if (filters?.months !== undefined) params['months'] = String(filters.months);

    return this.http.get<StudentMonthlyComparisonResponse>(
      `${this.apiUrl}/users/alunos/me/comparacao-mensal`,
      { headers: this.getHeaders(), params }
    );
  }

  getStudentNotifications(filters?: {
    status?: 'pending' | 'sent' | 'failed' | 'bounced';
    limit?: number;
    offset?: number;
  }): Observable<StudentNotificationFeedResponse> {
    const params: Record<string, string> = {};
    if (filters?.status) params['status'] = filters.status;
    if (filters?.limit !== undefined) params['limit'] = String(filters.limit);
    if (filters?.offset !== undefined) params['offset'] = String(filters.offset);

    return this.http.get<StudentNotificationFeedResponse>(
      `${this.apiUrl}/users/alunos/me/notificacoes`,
      { headers: this.getHeaders(), params }
    );
  }

  markStudentNotificationRead(notificationId: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(
      `${this.apiUrl}/users/alunos/me/notificacoes/${notificationId}/read`,
      {},
      { headers: this.getHeaders() }
    );
  }

  markAllStudentNotificationsRead(): Observable<{ success: boolean; affected: number }> {
    return this.http.patch<{ success: boolean; affected: number }>(
      `${this.apiUrl}/users/alunos/me/notificacoes/read-all`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getStudentBeltHistory(): Observable<StudentBeltHistoryResponse> {
    return this.http.get<StudentBeltHistoryResponse>(
      `${this.apiUrl}/users/alunos/me/historico-faixas`,
      { headers: this.getHeaders() }
    );
  }

  // Story 3-7: Training History
  getTrainingHistory(filters?: TrainingHistoryFilters, limit = 20, offset = 0): Observable<{ success: boolean; data: TrainingHistoryResponse }> {
    const params: Record<string, string> = { limit: String(limit), offset: String(offset) };
    if (filters?.dateFrom) params['dateFrom'] = filters.dateFrom;
    if (filters?.dateTo) params['dateTo'] = filters.dateTo;
    if (filters?.turmaId) params['turmaId'] = filters.turmaId;
    if (filters?.keyword) params['keyword'] = filters.keyword;
    return this.http.get<{ success: boolean; data: TrainingHistoryResponse }>(
      `${this.apiUrl}/trainings/history`,
      { headers: this.getHeaders(), params }
    );
  }

  getTrainingDetails(sessionId: string): Observable<{ success: boolean; data: TrainingDetailsResponse }> {
    return this.http.get<{ success: boolean; data: TrainingDetailsResponse }>(
      `${this.apiUrl}/trainings/${sessionId}`,
      { headers: this.getHeaders() }
    );
  }

  updateTraining(sessionId: string, payload: UpdateTrainingPayload): Observable<UpdateTrainingResponse> {
    return this.http.put<UpdateTrainingResponse>(
      `${this.apiUrl}/trainings/${sessionId}`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  deleteTraining(sessionId: string): Observable<DeleteTrainingResponse> {
    return this.http.delete<DeleteTrainingResponse>(
      `${this.apiUrl}/trainings/${sessionId}`,
      { headers: this.getHeaders() }
    );
  }

  restoreTraining(sessionId: string): Observable<RestoreTrainingResponse> {
    return this.http.patch<RestoreTrainingResponse>(
      `${this.apiUrl}/trainings/${sessionId}/restore`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Offline Sync Endpoints
  syncBatch(payload: {
    batch: Array<{
      id?: string;
      action: string;
      resource: string;
      resourceId?: string;
      payload: Record<string, unknown>;
      timestamp: number;
    }>;
    clientTimestamp: number;
  }): Observable<{
    success: boolean;
    batchId: string;
    synced: number;
    failed: number;
    conflicts: number;
    data: Array<{
      id: string;
      batchId: string;
      result: 'synced' | 'conflict' | 'failed';
      resolvedWith?: 'server_version' | 'client_version';
      serverVersion?: Record<string, unknown>;
      error?: string;
    }>;
    durationMs: number;
  }> {
    return this.http.post<any>(
      `${this.apiUrl}/trainings/sync-queue`,
      payload,
      { headers: this.getHeaders() }
    );
  }

  getAdminSyncQueue(): Observable<{
    success: boolean;
    data: Array<{
      professor_id: string;
      academy_id: string;
      pending_count: number;
      failed_count: number;
      oldest_pending: string | null;
    }>;
  }> {
    return this.http.get<any>(
      `${this.apiUrl}/trainings/admin/sync-queue/pending`,
      { headers: this.getHeaders() }
    );
  }
}
