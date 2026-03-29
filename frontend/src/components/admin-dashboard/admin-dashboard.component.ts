import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import {
  AdminAlertActionType,
  AdminAlertItem,
  AdminAlertPreferences,
  AdminDashboardAlert,
  AdminDashboardQuickAction,
  AdminDashboardResponse,
  AdminDashboardStatus,
  ComplianceReportAlert,
  ComplianceReportHistoryItem,
  DeletionRequestItem,
  MinorWithoutGuardianItem,
  User,
} from '../../types';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly onboardingStorageKey = 'admin-dashboard-tour-dismissed:v1';
  private readonly alertPollingMs = 20000;
  private alertPollingSub: Subscription | null = null;

  currentUser: User | null = null;
  adminDashboard: AdminDashboardResponse | null = null;
  dashboardLoading = false;
  dashboardRefreshing = false;
  dashboardError = '';
  onboardingVisible = false;
  complianceTooltipVisible = false;
  showSystemStatusDetail = false;
  showAlertPanel = false;
  alertPanelLoading = false;
  alertPanelError = '';
  alertFeed: AdminAlertItem[] = [];
  criticalAlertCount = 0;
  unreadAlertCount = 0;
  silencedUntil: string | null = null;
  showCriticalModal = false;
  criticalModalAlert: AdminAlertItem | null = null;
  alertPreferencesLoading = false;
  alertPreferencesSaving = false;
  alertPreferencesError = '';
  alertPreferencesMessage = '';
  alertPreferences: AdminAlertPreferences | null = null;
  private lastAutoScrollRefreshAt: string | null = null;

  deletionStudentId = '';
  deletionReason = '';
  deletionConfirm = false;
  deletionMessage = '';
  deletionError = '';
  deletionLoading = false;
  pendingDeletionRequests: DeletionRequestItem[] = [];
  processingDue = false;
  complianceLoading = false;
  complianceMessage = '';
  complianceError = '';
  complianceAlerts: ComplianceReportAlert[] = [];
  complianceHistory: ComplianceReportHistoryItem[] = [];
  latestComplianceReport: ComplianceReportHistoryItem | null = null;
  minorsWithoutGuardianLoading = false;
  minorsWithoutGuardianError = '';
  minorsWithoutGuardian: MinorWithoutGuardianItem[] = [];

  readonly quickActions: AdminDashboardQuickAction[] = [
    {
      key: 'audit',
      label: 'Ver Logs Auditoria',
      description: 'Abrir timeline de acessos e filtros LGPD.',
      icon: '🔍',
    },
    {
      key: 'export-report',
      label: 'Exportar Relatório LGPD',
      description: 'Baixar o último PDF ou abrir a central de relatórios.',
      icon: '📄',
    },
    {
      key: 'manage-users',
      label: 'Gerenciar Usuários',
      description: 'Abrir a gestão administrativa de alunos.',
      icon: '👥',
    },
    {
      key: 'settings',
      label: 'Configurações',
      description: 'Acessar perfil da academia e parâmetros administrativos.',
      icon: '⚙️',
    },
    {
      key: 'backup',
      label: 'Backup & Recovery',
      description: 'Controlar backups, restore e agendamento automático.',
      icon: '💾',
    },
    {
      key: 'health-monitor',
      label: 'Health Monitor',
      description: 'Monitorar API, banco, cache, email e storage em tempo real.',
      icon: '🩺',
    },
    {
      key: 'professors',
      label: 'Professores',
      description: 'Gerenciar professores da academia.',
      icon: '👨‍🏫',
      secondary: true,
    },
    {
      key: 'profile',
      label: 'Meu Perfil',
      description: 'Editar dados do administrador autenticado.',
      icon: '👤',
      secondary: true,
    },
    {
      key: 'consent-templates',
      label: 'Termos de Consentimento',
      description: 'Revisar templates e publicar novas versões.',
      icon: '🧾',
      secondary: true,
    },
  ];

  constructor(private auth: AuthService, private router: Router, private api: ApiService) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      if (user.role === 'Admin') {
        this.loadAdminDashboard(false);
        this.loadAlertCounts();
        this.loadAlertFeed();
        this.loadAlertPreferences();
        this.startAlertPolling();
        this.loadPendingDeletionRequests();
        this.loadComplianceStatus();
        this.loadComplianceHistory();
        this.loadMinorsWithoutGuardian();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAlertPolling();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  getAcademyLogo(): string {
    return this.currentUser?.academy?.logoUrl || 'assets/default-academy-logo.svg';
  }

  getUserPhoto(): string {
    return this.currentUser?.photoUrl || 'assets/default-user-photo.svg';
  }

  loadAdminDashboard(isManualRefresh: boolean): void {
    if (isManualRefresh) {
      this.dashboardRefreshing = true;
    } else {
      this.dashboardLoading = true;
    }

    this.dashboardError = '';

    this.api.getAdminDashboard().subscribe({
      next: (dashboard) => {
        this.adminDashboard = dashboard;
        this.dashboardLoading = false;
        this.dashboardRefreshing = false;

        if (!localStorage.getItem(this.onboardingStorageKey)) {
          this.onboardingVisible = true;
        }

        this.queueCriticalAlertScroll();
      },
      error: (error) => {
        this.dashboardLoading = false;
        this.dashboardRefreshing = false;
        this.dashboardError = this.getApiError(error, 'Erro ao carregar dashboard administrativo.');
      },
    });
  }

  refreshDashboard(): void {
    this.loadAdminDashboard(true);
    this.loadAlertCounts();
    this.loadAlertFeed();
    this.loadAlertPreferences();
    this.loadPendingDeletionRequests();
    this.loadComplianceStatus();
    this.loadComplianceHistory();
    this.loadMinorsWithoutGuardian();
  }

  dismissOnboarding(): void {
    this.onboardingVisible = false;
    localStorage.setItem(this.onboardingStorageKey, 'dismissed');
  }

  toggleSystemStatusDetail(): void {
    this.showSystemStatusDetail = !this.showSystemStatusDetail;
  }

  handleQuickAction(action: AdminDashboardQuickAction): void {
    switch (action.key) {
      case 'audit':
        this.goToAuditLogs();
        break;
      case 'export-report':
        this.exportOrOpenComplianceReport();
        break;
      case 'manage-users':
        this.goToStudents();
        break;
      case 'settings':
        this.goToAcademyProfile();
        break;
      case 'backup':
        this.goToBackupRecovery();
        break;
      case 'health-monitor':
        this.goToHealthMonitor();
        break;
      case 'professors':
        this.goToProfessors();
        break;
      case 'profile':
        this.goToMyProfile();
        break;
      case 'consent-templates':
        this.goToConsentTemplates();
        break;
    }
  }

  handleAlertAction(alert: AdminDashboardAlert): void {
    if (alert.targetPath === '/admin/alunos' && alert.targetFilter) {
      this.router.navigate([alert.targetPath], {
        queryParams: { filter: alert.targetFilter },
      });
      return;
    }

    this.router.navigate([alert.targetPath]);
  }

  toggleAlertPanel(): void {
    this.showAlertPanel = !this.showAlertPanel;
    if (this.showAlertPanel) {
      this.loadAlertFeed();
    }
  }

  loadAlertFeed(silent: boolean = false): void {
    if (!silent) {
      this.alertPanelLoading = true;
      this.alertPanelError = '';
    }

    this.api.getAdminAlerts({ limit: 20, offset: 0 }).subscribe({
      next: (res) => {
        this.alertPanelLoading = false;
        this.alertFeed = res.items || [];
        this.unreadAlertCount = res.unreadCount || 0;
        this.criticalAlertCount = res.criticalCount || 0;
        this.silencedUntil = res.silencedUntil || null;
        this.openCriticalModalIfNeeded();
      },
      error: (error) => {
        this.alertPanelLoading = false;
        if (!silent) {
          this.alertPanelError = this.getApiError(error, 'Erro ao carregar alertas em tempo real.');
        }
      },
    });
  }

  loadAlertCounts(): void {
    this.api.getAdminAlertCounts().subscribe({
      next: (res) => {
        this.unreadAlertCount = res.unread || 0;
        this.criticalAlertCount = res.critical || 0;
        this.silencedUntil = res.silencedUntil || null;
      },
      error: () => {
        this.unreadAlertCount = 0;
        this.criticalAlertCount = 0;
      },
    });
  }

  executeAlertAction(alert: AdminAlertItem, action: AdminAlertActionType): void {
    this.alertPanelError = '';
    this.api.executeAdminAlertAction(alert.id, action).subscribe({
      next: () => {
        this.loadAlertFeed();
        this.loadAlertCounts();
      },
      error: (error) => {
        this.alertPanelError = this.getApiError(error, 'Erro ao executar acao de alerta.');
      },
    });
  }

  closeCriticalModal(): void {
    this.showCriticalModal = false;
    this.criticalModalAlert = null;
  }

  getAlertCategoryLabel(category: AdminAlertItem['category']): string {
    switch (category) {
      case 'audit':
        return 'Seguranca';
      case 'compliance':
        return 'Conformidade';
      case 'backup':
        return 'Backup';
      case 'users':
        return 'Usuarios';
      default:
        return 'Operacoes';
    }
  }

  isSilencedActive(): boolean {
    if (!this.silencedUntil) {
      return false;
    }
    return new Date(this.silencedUntil).getTime() > Date.now();
  }

  silenceAlertsForOneHour(): void {
    this.alertPreferencesMessage = '';
    this.alertPreferencesError = '';
    this.api.silenceAdminAlerts(60).subscribe({
      next: (res) => {
        this.silencedUntil = res.silencedUntil;
        this.alertPreferences = res;
        this.alertPreferencesMessage = 'Alertas silenciados por 1 hora.';
        this.loadAlertFeed();
        this.loadAlertCounts();
      },
      error: (error) => {
        this.alertPreferencesError = this.getApiError(error, 'Erro ao silenciar alertas.');
      },
    });
  }

  loadAlertPreferences(): void {
    this.alertPreferencesLoading = true;
    this.alertPreferencesError = '';

    this.api.getAdminAlertPreferences().subscribe({
      next: (prefs) => {
        this.alertPreferencesLoading = false;
        this.alertPreferences = {
          ...prefs,
          channels: { ...prefs.channels },
          severity: { ...prefs.severity },
        };
        this.silencedUntil = prefs.silencedUntil;
      },
      error: (error) => {
        this.alertPreferencesLoading = false;
        this.alertPreferencesError = this.getApiError(error, 'Erro ao carregar preferencias de alerta.');
      },
    });
  }

  saveAlertPreferences(): void {
    if (!this.alertPreferences) {
      return;
    }

    this.alertPreferencesSaving = true;
    this.alertPreferencesError = '';
    this.alertPreferencesMessage = '';

    this.api.updateAdminAlertPreferences({
      channels: this.alertPreferences.channels,
      severity: this.alertPreferences.severity,
      digestWindowMinutes: this.alertPreferences.digestWindowMinutes,
    }).subscribe({
      next: (updated) => {
        this.alertPreferencesSaving = false;
        this.alertPreferences = {
          ...updated,
          channels: { ...updated.channels },
          severity: { ...updated.severity },
        };
        this.silencedUntil = updated.silencedUntil;
        this.alertPreferencesMessage = 'Preferencias de alertas salvas com sucesso.';
      },
      error: (error) => {
        this.alertPreferencesSaving = false;
        this.alertPreferencesError = this.getApiError(error, 'Erro ao salvar preferencias de alerta.');
      },
    });
  }

  exportOrOpenComplianceReport(): void {
    if (this.latestComplianceReport?.id) {
      this.downloadComplianceReport(this.latestComplianceReport.id);
      return;
    }

    this.goToComplianceReports();
  }

  goToBackupRecovery(): void {
    this.router.navigate(['/admin/backup']);
  }

  goToHealthMonitor(): void {
    this.router.navigate(['/admin/health-monitor']);
  }

  showComplianceTooltip(): void {
    this.complianceTooltipVisible = true;
  }

  hideComplianceTooltip(): void {
    this.complianceTooltipVisible = false;
  }

  hasCriticalAlert(): boolean {
    return !!this.adminDashboard?.alerts.some((alert) => alert.severity === 'high');
  }

  getStatusEmoji(status: AdminDashboardStatus | undefined): string {
    switch (status) {
      case 'critical':
        return '🔴';
      case 'attention':
        return '🟡';
      default:
        return '🟢';
    }
  }

  getStatusClass(status: AdminDashboardStatus | undefined): string {
    switch (status) {
      case 'critical':
        return 'status-critical';
      case 'attention':
        return 'status-attention';
      default:
        return 'status-operational';
    }
  }

  getAlertClass(severity: AdminDashboardAlert['severity']): string {
    switch (severity) {
      case 'high':
        return 'alert-high';
      case 'medium':
        return 'alert-medium';
      default:
        return 'alert-low';
    }
  }

  getConsentTrendText(): string {
    const percentage = this.adminDashboard?.metrics.consents.percentage ?? 0;
    const expired = this.adminDashboard?.metrics.consents.expired ?? 0;

    if (expired > 0) {
      return `${expired} expirado(s)`;
    }

    if (percentage >= 100) {
      return '0 expirados';
    }

    return 'Monitorar renovacoes';
  }

  getUsersTrendText(): string {
    const weeklyNewUsers = this.adminDashboard?.metrics.usersActive.weeklyNewUsers ?? 0;
    return `↑ +${weeklyNewUsers} novo(s) esta semana`;
  }

  getBackupCardLabel(): string {
    if (!this.adminDashboard) {
      return 'Backup sem sinal';
    }

    return this.adminDashboard.metrics.backup.status === 'ok' ? '✓ Backup OK' : '⚠ Backup requer atencao';
  }

  private queueCriticalAlertScroll(): void {
    if (!this.adminDashboard || !this.hasCriticalAlert()) {
      return;
    }

    if (this.lastAutoScrollRefreshAt === this.adminDashboard.lastRefreshAt) {
      return;
    }

    this.lastAutoScrollRefreshAt = this.adminDashboard.lastRefreshAt;

    window.setTimeout(() => {
      document.getElementById('critical-alerts')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  }

  goToConsentTemplates(): void {
    this.router.navigate(['/admin/consent-templates']);
  }

  goToAuditLogs(): void {
    this.router.navigate(['/admin/audit-logs']);
  }

  goToComplianceReports(): void {
    this.router.navigate(['/admin/compliance-reports']);
  }

  goToAcademyProfile(): void {
    this.router.navigate(['/admin/perfil-academia']);
  }

  goToProfessors(): void {
    this.router.navigate(['/admin/professores']);
  }

  goToStudents(): void {
    this.router.navigate(['/admin/users']);
  }

  goToMinorsWithoutGuardian(): void {
    this.router.navigate(['/admin/alunos'], {
      queryParams: { filter: 'minors-without-guardian' },
    });
  }

  goToMyProfile(): void {
    this.router.navigate(['/admin/meu-perfil']);
  }

  requestDeletion(): void {
    if (!this.deletionConfirm) {
      this.deletionError = 'Confirme que entende o impacto antes de solicitar a deleção.';
      return;
    }

    const studentId = this.deletionStudentId.trim();
    if (!studentId) {
      this.deletionError = 'Informe o ID do aluno.';
      return;
    }

    this.deletionLoading = true;
    this.deletionError = '';
    this.deletionMessage = '';

    this.api.requestStudentDeletion(studentId, this.deletionReason).subscribe({
      next: (res) => {
        this.deletionLoading = false;
        this.deletionMessage = res.message;
        this.deletionStudentId = '';
        this.deletionReason = '';
        this.deletionConfirm = false;
        this.loadPendingDeletionRequests();
      },
      error: (error) => {
        this.deletionLoading = false;
        this.deletionError = error?.error?.error || 'Erro ao solicitar deleção.';
      },
    });
  }

  loadPendingDeletionRequests(): void {
    this.api.listPendingDeletionRequests().subscribe({
      next: (res) => {
        this.pendingDeletionRequests = res.requests || [];
      },
      error: () => {
        this.pendingDeletionRequests = [];
      },
    });
  }

  cancelDeletionRequest(requestId: string): void {
    this.api.cancelDeletionRequest(requestId).subscribe({
      next: (res) => {
        this.deletionMessage = res.message;
        this.deletionError = '';
        this.loadPendingDeletionRequests();
      },
      error: (error) => {
        this.deletionError = error?.error?.error || 'Erro ao cancelar solicitação.';
      },
    });
  }

  processDueRequests(): void {
    this.processingDue = true;
    this.api.processDueDeletionRequests().subscribe({
      next: (res) => {
        this.processingDue = false;
        this.deletionMessage = `${res.message}. Processadas: ${res.processedCount}`;
        this.deletionError = '';
        this.loadPendingDeletionRequests();
      },
      error: (error) => {
        this.processingDue = false;
        this.deletionError = error?.error?.error || 'Erro ao processar solicitações vencidas.';
      },
    });
  }

  generateComplianceReport(): void {
    this.complianceLoading = true;
    this.complianceError = '';
    this.complianceMessage = 'Gerando relatório... (pode levar 2-3 min)';

    this.api.generateComplianceReport().subscribe({
      next: (res) => {
        this.complianceLoading = false;
        this.complianceMessage = res.message;
        this.complianceAlerts = res.alerts || [];
        this.loadComplianceStatus();
        this.loadComplianceHistory();
      },
      error: (error) => {
        this.complianceLoading = false;
        this.complianceError = this.getApiError(error, 'Erro ao gerar relatório de conformidade.');
      },
    });
  }

  loadComplianceStatus(): void {
    this.api.getComplianceReportStatus().subscribe({
      next: (res) => {
        this.latestComplianceReport = res.latestReport || null;
      },
      error: () => {
        this.latestComplianceReport = null;
      },
    });
  }

  loadComplianceHistory(): void {
    this.api.listComplianceReports().subscribe({
      next: (res) => {
        this.complianceHistory = res.reports || [];
      },
      error: () => {
        this.complianceHistory = [];
      },
    });
  }

  loadMinorsWithoutGuardian(): void {
    this.minorsWithoutGuardianLoading = true;
    this.minorsWithoutGuardianError = '';

    this.api.listMinorsWithoutGuardian().subscribe({
      next: (res) => {
        this.minorsWithoutGuardianLoading = false;
        this.minorsWithoutGuardian = res.students || [];
      },
      error: (error) => {
        this.minorsWithoutGuardianLoading = false;
        this.minorsWithoutGuardianError = this.getApiError(error, 'Erro ao carregar menores sem responsável.');
        this.minorsWithoutGuardian = [];
      },
    });
  }

  downloadComplianceReport(reportId: string): void {
    this.api.downloadComplianceReport(reportId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `LGPD_Conformidade_${reportId}.pdf`;
        anchor.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.complianceError = this.getApiError(error, 'Erro ao baixar relatório de conformidade.');
      },
    });
  }

  private openCriticalModalIfNeeded(): void {
    if (this.isSilencedActive()) {
      this.showCriticalModal = false;
      this.criticalModalAlert = null;
      return;
    }

    const critical = this.alertFeed.find((item) => item.severity === 'high' && item.status === 'active');
    if (!critical) {
      return;
    }

    this.criticalModalAlert = critical;
    this.showCriticalModal = true;
  }

  private startAlertPolling(): void {
    if (this.alertPollingSub) {
      return;
    }

    this.alertPollingSub = interval(this.alertPollingMs).subscribe(() => {
      if (document.hidden) {
        return;
      }

      this.loadAlertCounts();
      this.loadAlertFeed(true);
    });
  }

  private stopAlertPolling(): void {
    this.alertPollingSub?.unsubscribe();
    this.alertPollingSub = null;
  }

  getApiError(error: any, fallback: string): string {
    return error?.error?.error || error?.error?.message || fallback;
  }

  formatDateTime(value: string): string {
    return new Date(value).toLocaleString('pt-BR');
  }
}
