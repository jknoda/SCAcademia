import { ChangeDetectorRef, Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, Subject } from 'rxjs';
import { finalize, takeUntil, timeout } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import {
  DeletionRequestItem,
  LinkedStudentItem,
  ProfessorTurmaItem,
  RecentTrainingSummary,
  StudentAttendanceHistoryItem,
  StudentAttendanceHistoryResponse,
  StudentBadgeUpcomingItem,
  StudentBadgesHistoryResponse,
  StudentBadgeUnlockedItem,
  StudentBeltHistoryEntry,
  StudentBeltHistoryResponse,
  StudentCommentHistoryItem,
  StudentCommentHistoryResponse,
  StudentMonthlyComparisonResponse,
  StudentNotificationFeedResponse,
  StudentNotificationItem,
  StudentNotificationPreferences,
  StudentMonthlyStats,
  StudentProgressDashboardResponse,
  StudentProgressWeekly,
  User,
} from '../../types';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  linkedStudents: LinkedStudentItem[] = [];
  recentTrainings: RecentTrainingSummary[] = [];
  isLoadingRecentTrainings = false;
  hasRecentTrainingsError = false;
  isStartingTraining = false;
  startTrainingErrorMessage = '';
  showTrainingStarter = false;
  turmasForTraining: ProfessorTurmaItem[] = [];
  selectedTurmaIdForTraining = '';
  isLoadingTurmasForTraining = false;
  trainingStarterError = '';
  trainingSessionDate = '';
  trainingSessionTime = '';
  selectedStudentId = '';
  deletionReason = '';
  confirmDeletionRequest = false;
  deletionStatus: DeletionRequestItem | null = null;
  deletionSuccessMessage = '';
  deletionErrorMessage = '';
  linkedStudentsErrorMessage = '';
  isSubmittingDeletion = false;
  isLoadingStatus = false;
  isLoadingLinkedStudents = false;
  studentProgressDashboard: StudentProgressDashboardResponse | null = null;
  studentProgressHasContent = false;
  isLoadingStudentProgress = false;
  hasStudentProgressError = false;
  studentProgressErrorMessage = '';
  isUsingCachedProgressData = false;
  lastProgressSyncAt: string | null = null;
  selectedStudentProgressDetail: 'evolucao' | 'frequencia' | 'comentarios' | 'faixa' | 'badges' | 'comparacao' | 'notificacoes' | null = null;
  studentProgressWeeklyData: StudentProgressWeekly[] = [];
  attendanceHistory: StudentAttendanceHistoryItem[] = [];
  attendanceHistoryTotal = 0;
  attendanceHistoryLimit = 20;
  attendanceHistoryOffset = 0;
  attendanceHistoryPercentage = 0;
  attendanceHistoryWarningBelow70 = false;
  attendanceCurrentStreak = 0;
  attendanceCurrentStreakDays = 0;
  attendanceFilterFrom = '';
  attendanceFilterTo = '';
  isLoadingAttendanceHistory = false;
  attendanceHistoryErrorMessage = '';

  // Story 4-4: Comment History state
  commentHistory: StudentCommentHistoryItem[] = [];
  commentHistoryTotal = 0;
  commentHistoryLimit = 20;
  commentHistoryOffset = 0;
  commentSearchKeyword = '';
  isLoadingCommentHistory = false;
  commentHistoryErrorMessage = '';
  commentShareConfirmation = '';

  // Story 4-5: Badges history state
  unlockedBadges: StudentBadgeUnlockedItem[] = [];
  upcomingBadges: StudentBadgeUpcomingItem[] = [];
  totalUnlockedBadges = 0;
  totalUpcomingBadges = 0;
  isLoadingBadgesHistory = false;
  badgesHistoryErrorMessage = '';
  badgeShareConfirmation = '';
  selectedUnlockedBadge: StudentBadgeUnlockedItem | null = null;
  expandedUpcomingBadgeId: string | null = null;

  // Story 4-6: Month-over-month comparison state
  studentMonthlyComparison: StudentMonthlyComparisonResponse | null = null;
  isLoadingComparacao = false;
  comparacaoError = '';
  showComparacaoHistory = false;

  // Story 4-7: Notifications state
  studentNotifications: StudentNotificationItem[] = [];
  notificationsTotal = 0;
  notificationsLimit = 20;
  notificationsOffset = 0;
  notificationsUnreadCount = 0;
  isLoadingNotifications = false;
  notificationsErrorMessage = '';
  activeStudentToastMessage = '';
  notificationPreferences: StudentNotificationPreferences = {
    badges: true,
    frequencia: true,
    comentarios: true,
    lembretes: true,
  };
  private notificationToastTimer: ReturnType<typeof setTimeout> | null = null;
  private lastToastNotificationId: string | null = null;

  // Story 4-8: Belt History state
  beltHistoryData: StudentBeltHistoryResponse | null = null;
  isLoadingBeltHistory = false;
  beltHistoryErrorMessage = '';
  expandedBeltId: number | null = null;
  beltHistoryCacheTimestamp: string | null = null;

  private destroy$ = new Subject<void>();
  private studentProgressRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly STUDENT_PROGRESS_RETRY_MS = 2000;
  private readonly STUDENT_PROGRESS_TIMEOUT_MS = 10000;

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isResponsavel()) {
      this.loadLinkedStudents();
    }

    if (this.isProfessor()) {
      this.loadRecentTrainings();
    }

    if (this.isAluno()) {
      this.loadNotificationPreferences();
      this.loadStudentProgressDashboard();
    }
  }

  isResponsavel(): boolean {
    return this.currentUser?.role === 'Responsavel';
  }

  isProfessor(): boolean {
    return this.currentUser?.role === 'Professor';
  }

  isAluno(): boolean {
    return this.currentUser?.role === 'Aluno';
  }

  goToProfessorProfile(): void {
    this.router.navigate(['/professor/meu-perfil']);
  }

  goToProfessorTurmas(): void {
    this.router.navigate(['/professor/turmas']);
  }

  goToCreateProfessorTurma(): void {
    this.router.navigate(['/professor/turmas/nova']);
  }

  goToProfessorTechniques(): void {
    this.router.navigate(['/professor/tecnicas']);
  }

  openTrainingStarter(): void {
    this.ngZone.run(() => {
      this.showTrainingStarter = true;
      this.trainingStarterError = '';
      this.startTrainingErrorMessage = '';
      this.selectedTurmaIdForTraining = '';
      this.turmasForTraining = [];
      this.trainingSessionDate = '';
      this.trainingSessionTime = '';
      this.isLoadingTurmasForTraining = true;
      this.cdr.detectChanges();
    });

    this.api.listProfessorTurmas().pipe(
      timeout(10000),
      takeUntil(this.destroy$),
      finalize(() => this.setLoadingTurmasState(false))
    ).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.turmasForTraining = (response.turmas || []).filter((t: ProfessorTurmaItem) => t.isActive);
          if (this.turmasForTraining.length === 1) {
            this.selectedTurmaIdForTraining = this.turmasForTraining[0].turmaId;
          }
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          this.trainingStarterError = error?.error?.error || 'Não foi possível carregar as turmas.';
          this.cdr.detectChanges();
        });
      },
    });
  }

  cancelTrainingStarter(): void {
    this.showTrainingStarter = false;
  }

  confirmStartTraining(): void {
    if (!this.selectedTurmaIdForTraining) {
      this.trainingStarterError = 'Selecione uma turma para continuar.';
      return;
    }
    if (this.isStartingTraining) {
      return;
    }

    this.setStartingTrainingState(true);
    this.trainingStarterError = '';

    this.api.startTrainingSession(
      this.selectedTurmaIdForTraining,
      this.trainingSessionDate || undefined,
      this.trainingSessionTime || undefined
    ).pipe(
      timeout(10000),
      takeUntil(this.destroy$),
      finalize(() => this.setStartingTrainingState(false))
    ).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.showTrainingStarter = false;
          this.router.navigate(['/training/session', response.sessionId, 'techniques']);
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          this.trainingStarterError = error?.error?.error || 'Não foi possível iniciar o treino.';
          this.cdr.detectChanges();
        });
      },
    });
  }

  goToMyProfile(): void {
    this.router.navigate(['/aluno/meu-perfil']);
  }

  goToMyHealthScreening(): void {
    if (!this.currentUser) {
      return;
    }

    this.router.navigate(['/health-screening', this.currentUser.id], {
      queryParams: { returnTo: '/home' },
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    if (this.studentProgressRetryTimer) {
      clearTimeout(this.studentProgressRetryTimer);
      this.studentProgressRetryTimer = null;
    }
    if (this.notificationToastTimer) {
      clearTimeout(this.notificationToastTimer);
      this.notificationToastTimer = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  getRoleLabel(): string {
    const roleMap: Record<string, string> = {
      Admin: 'Administrador',
      Professor: 'Professor',
      Aluno: 'Aluno',
      Responsavel: 'Responsável',
    };
    return this.currentUser ? (roleMap[this.currentUser.role] ?? this.currentUser.role) : '';
  }

  getAcademyLogo(): string {
    return this.currentUser?.academy?.logoUrl || 'assets/default-academy-logo.svg';
  }

  getUserPhoto(): string {
    return this.currentUser?.photoUrl || 'assets/default-user-photo.svg';
  }

  getHomeTitle(): string {
    if (this.isProfessor()) {
      return 'Painel do Professor';
    }
    if (this.isAluno()) {
      return `Olá, ${this.currentUser?.fullName || 'Aluno'}!`;
    }
    if (this.isResponsavel()) {
      return 'Área do Responsável';
    }
    return 'Painel inicial';
  }

  getHomeSubtitle(): string {
    if (this.isProfessor()) {
      return 'Acompanhe seus treinos, organize turmas e acesse o histórico recente em um só lugar.';
    }
    if (this.isAluno()) {
      return 'Seu progresso em judô';
    }
    if (this.isResponsavel()) {
      return 'Gerencie pendências de saúde e acompanhe solicitações LGPD dos alunos vinculados.';
    }
    return 'Consulte os recursos disponíveis para o seu perfil.';
  }

  goToTrainingHistory(): void {
    this.router.navigate(['/training/history']);
  }

  private getApiError(error: any, fallback: string): string {
    return error?.error?.error || error?.error?.message || fallback;
  }

  loadLinkedStudents(): void {
    this.isLoadingLinkedStudents = true;
    this.linkedStudentsErrorMessage = '';

    this.api.listLinkedStudents().subscribe({
      next: (response) => {
        this.isLoadingLinkedStudents = false;
        this.linkedStudents = response.students || [];
        if (this.linkedStudents.length > 0 && !this.selectedStudentId) {
          this.selectedStudentId = this.linkedStudents[0].studentId;
        }
      },
      error: (error) => {
        this.isLoadingLinkedStudents = false;
        this.linkedStudents = [];
        this.linkedStudentsErrorMessage = this.getApiError(error, 'Nao foi possivel carregar filhos vinculados.');
      },
    });
  }

  get studentsWithoutHealthScreening(): LinkedStudentItem[] {
    return this.linkedStudents.filter((student) => !student.hasHealthScreening);
  }

  goToStudentHealthScreening(studentId: string): void {
    this.router.navigate(['/health-screening', studentId], {
      queryParams: { returnTo: '/home' },
    });
  }

  get selectedStudentName(): string {
    return this.linkedStudents.find((student) => student.studentId === this.selectedStudentId)?.studentName || 'o aluno selecionado';
  }

  requestDeletion(): void {
    if (!this.selectedStudentId) {
      this.deletionErrorMessage = 'Selecione um filho vinculado para solicitar a delecao.';
      this.deletionSuccessMessage = '';
      return;
    }
    if (!this.confirmDeletionRequest) {
      this.deletionErrorMessage = 'Confirme que entende o impacto da exclusão.';
      this.deletionSuccessMessage = '';
      return;
    }

    this.deletionErrorMessage = '';
    this.deletionSuccessMessage = '';
    this.isSubmittingDeletion = true;

    this.api
      .requestStudentDeletion(this.selectedStudentId, this.deletionReason.trim())
      .subscribe({
        next: (response) => {
          this.deletionStatus = response.request;
          this.deletionSuccessMessage = response.message;
          this.deletionReason = '';
          this.confirmDeletionRequest = false;
          this.isSubmittingDeletion = false;
        },
        error: (error) => {
          this.deletionErrorMessage = this.getApiError(error, 'Nao foi possivel registrar a solicitacao.');
          this.isSubmittingDeletion = false;
        },
      });
  }

  loadDeletionStatus(): void {
    if (!this.selectedStudentId) {
      this.deletionErrorMessage = 'Selecione um filho vinculado para consultar o status.';
      this.deletionSuccessMessage = '';
      return;
    }

    this.deletionErrorMessage = '';
    this.deletionSuccessMessage = '';
    this.isLoadingStatus = true;

    this.api.getStudentDeletionStatus(this.selectedStudentId).subscribe({
      next: (response) => {
        this.deletionStatus = response.request;
        this.isLoadingStatus = false;
      },
      error: (error) => {
        this.deletionStatus = null;
        this.deletionErrorMessage = this.getApiError(error, 'Nao foi possivel consultar o status.');
        this.isLoadingStatus = false;
      },
    });
  }

  loadRecentTrainings(): void {
    this.isLoadingRecentTrainings = true;
    this.hasRecentTrainingsError = false;
    this.api.getRecentTrainings(3)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.isLoadingRecentTrainings = false;
            this.recentTrainings = response.trainings || [];
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.ngZone.run(() => {
            this.isLoadingRecentTrainings = false;
            this.hasRecentTrainingsError = true;
            this.recentTrainings = [];
            this.cdr.detectChanges();
          });
        },
      });
  }

  loadStudentProgressDashboard(forceRefresh: boolean = false): void {
    if (!this.currentUser || !this.isAluno()) {
      return;
    }

    if (this.studentProgressRetryTimer) {
      clearTimeout(this.studentProgressRetryTimer);
      this.studentProgressRetryTimer = null;
    }

    const cacheKey = this.getStudentProgressCacheKey();
    const cached = this.readStudentProgressCache(cacheKey);

    if (!navigator.onLine && cached) {
      this.studentProgressDashboard = cached.data;
      this.studentProgressHasContent = this.hasStudentProgressContent(cached.data);
      this.studentProgressWeeklyData = cached.data.cards.evolucaoMes.weeklySeries || [];
      this.lastProgressSyncAt = cached.cachedAt;
      this.isUsingCachedProgressData = true;
      this.isLoadingStudentProgress = false;
      this.hasStudentProgressError = false;
      this.studentProgressErrorMessage = '';
      return;
    }

    this.isLoadingStudentProgress = true;
    this.hasStudentProgressError = false;
    this.studentProgressErrorMessage = '';
    this.isUsingCachedProgressData = false;

    if (!forceRefresh && cached?.cachedAt) {
      this.lastProgressSyncAt = cached.cachedAt;
    }

    const startedAt = Date.now();

    const tryFetch = () => {
      this.api.getStudentProgressDashboard().pipe(
        timeout(3000),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.studentProgressDashboard = response;
            this.studentProgressHasContent = this.hasStudentProgressContent(response);
            this.studentProgressWeeklyData = response.cards.evolucaoMes.weeklySeries || [];
            this.isLoadingStudentProgress = false;
            this.hasStudentProgressError = false;
            this.studentProgressErrorMessage = '';
            this.isUsingCachedProgressData = false;
            this.lastProgressSyncAt = new Date().toISOString();
            this.writeStudentProgressCache(cacheKey, response, this.lastProgressSyncAt);
            this.cdr.detectChanges();
          });
        },
        error: () => {
          const elapsed = Date.now() - startedAt;
          if (elapsed < this.STUDENT_PROGRESS_TIMEOUT_MS && navigator.onLine) {
            this.studentProgressRetryTimer = setTimeout(() => {
              tryFetch();
            }, this.STUDENT_PROGRESS_RETRY_MS);
            return;
          }

          this.ngZone.run(() => {
            this.isLoadingStudentProgress = false;
            this.studentProgressHasContent = false;
            this.hasStudentProgressError = true;
            this.studentProgressErrorMessage = 'Erro ao carregar. Tentar novamente';
            this.cdr.detectChanges();
          });
        },
      });
    };

    tryFetch();
  }

  openStudentProgressDetails(detail: 'evolucao' | 'frequencia' | 'comentarios' | 'faixa' | 'badges' | 'comparacao' | 'notificacoes'): void {
    this.selectedStudentProgressDetail = detail;

    if (detail === 'frequencia') {
      this.loadStudentAttendanceHistory(true);
    }

    if (detail === 'comentarios') {
      this.loadStudentCommentHistory(true);
    }

    if (detail === 'badges') {
      this.loadStudentBadgesHistory();
    }

    if (detail === 'comparacao') {
      this.loadStudentMonthlyComparison();
    }

    if (detail === 'notificacoes') {
      this.loadStudentNotifications(true);
    }

    if (detail === 'faixa') {
      this.loadBeltHistory();
    }
  }

  closeStudentProgressDetails(): void {
    this.selectedStudentProgressDetail = null;
    this.selectedUnlockedBadge = null;
    this.expandedUpcomingBadgeId = null;
    this.badgeShareConfirmation = '';
    this.showComparacaoHistory = false;
    this.notificationsErrorMessage = '';
    this.expandedBeltId = null;
    this.beltHistoryErrorMessage = '';
  }

  private getNotificationPreferencesKey(): string {
    return `notification-preferences:${this.currentUser?.id || 'unknown'}`;
  }

  loadNotificationPreferences(): void {
    const raw = localStorage.getItem(this.getNotificationPreferencesKey());
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<StudentNotificationPreferences>;
      this.notificationPreferences = {
        badges: parsed.badges !== false,
        frequencia: parsed.frequencia !== false,
        comentarios: parsed.comentarios !== false,
        lembretes: parsed.lembretes !== false,
      };
    } catch {
      this.notificationPreferences = {
        badges: true,
        frequencia: true,
        comentarios: true,
        lembretes: true,
      };
    }
  }

  saveNotificationPreferences(): void {
    localStorage.setItem(this.getNotificationPreferencesKey(), JSON.stringify(this.notificationPreferences));
  }

  setNotificationPreference(category: keyof StudentNotificationPreferences, enabled: boolean): void {
    this.notificationPreferences = {
      ...this.notificationPreferences,
      [category]: enabled,
    };
    this.saveNotificationPreferences();
  }

  isNotificationCategoryEnabled(category: StudentNotificationItem['category']): boolean {
    return this.notificationPreferences[category] === true;
  }

  private maybeShowNotificationToast(items: StudentNotificationItem[]): void {
    const firstUnread = items.find((item) => !item.isRead && this.isNotificationCategoryEnabled(item.category));
    if (!firstUnread || this.lastToastNotificationId === firstUnread.notificationId) {
      return;
    }

    this.lastToastNotificationId = firstUnread.notificationId;
    this.activeStudentToastMessage = `${firstUnread.title} ${firstUnread.message}`.trim();

    if (this.notificationToastTimer) {
      clearTimeout(this.notificationToastTimer);
    }

    this.notificationToastTimer = setTimeout(() => {
      this.activeStudentToastMessage = '';
    }, 5000);
  }

  loadStudentNotifications(resetOffset: boolean = false): void {
    if (!this.currentUser || !this.isAluno()) {
      return;
    }

    if (resetOffset) {
      this.notificationsOffset = 0;
    }

    this.isLoadingNotifications = true;
    this.notificationsErrorMessage = '';

    this.api.getStudentNotifications({
      limit: this.notificationsLimit,
      offset: this.notificationsOffset,
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: StudentNotificationFeedResponse) => {
        this.studentNotifications = response.items || [];
        this.notificationsTotal = response.total || 0;
        this.notificationsLimit = response.limit || 20;
        this.notificationsOffset = response.offset || 0;
        this.notificationsUnreadCount = response.unreadCount || 0;
        this.isLoadingNotifications = false;
        if (resetOffset) {
          this.maybeShowNotificationToast(this.studentNotifications);
        }
      },
      error: () => {
        this.studentNotifications = [];
        this.notificationsTotal = 0;
        this.notificationsUnreadCount = 0;
        this.isLoadingNotifications = false;
        this.notificationsErrorMessage = 'Erro ao carregar notificações';
      },
    });
  }

  markNotificationAsRead(notificationId: string): void {
    if (!notificationId) {
      return;
    }

    this.api.markStudentNotificationRead(notificationId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.studentNotifications = this.studentNotifications.map((item) => (
          item.notificationId === notificationId
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item
        ));
        this.notificationsUnreadCount = Math.max(0, this.notificationsUnreadCount - 1);
      },
      error: () => {
        this.notificationsErrorMessage = 'Erro ao marcar notificação como lida';
      },
    });
  }

  markAllNotificationsAsRead(): void {
    const prevNotifications = this.studentNotifications;
    const prevUnreadCount = this.notificationsUnreadCount;
    const nowIso = new Date().toISOString();
    this.studentNotifications = this.studentNotifications.map((item) => ({
      ...item,
      isRead: true,
      readAt: item.readAt || nowIso,
    }));
    this.notificationsUnreadCount = 0;

    this.api.markAllStudentNotificationsRead().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      error: () => {
        this.studentNotifications = prevNotifications;
        this.notificationsUnreadCount = prevUnreadCount;
        this.notificationsErrorMessage = 'Erro ao marcar notificações como lidas';
      },
    });
  }

  get canLoadPreviousNotificationsPage(): boolean {
    return this.notificationsOffset > 0;
  }

  get canLoadNextNotificationsPage(): boolean {
    return this.notificationsOffset + this.notificationsLimit < this.notificationsTotal;
  }

  goToPreviousNotificationsPage(): void {
    if (!this.canLoadPreviousNotificationsPage) {
      return;
    }

    this.notificationsOffset = Math.max(0, this.notificationsOffset - this.notificationsLimit);
    this.loadStudentNotifications(false);
  }

  goToNextNotificationsPage(): void {
    if (!this.canLoadNextNotificationsPage) {
      return;
    }

    this.notificationsOffset += this.notificationsLimit;
    this.loadStudentNotifications(false);
  }

  getNotificationsRangeLabel(): string {
    if (this.notificationsTotal === 0 || this.studentNotifications.length === 0) {
      return '0 de 0';
    }
    const start = this.notificationsOffset + 1;
    const end = this.notificationsOffset + this.studentNotifications.length;
    return `${start}-${end} de ${this.notificationsTotal}`;
  }

  openNotificationTarget(item: StudentNotificationItem): void {
    if (item.category === 'comentarios') {
      this.openStudentProgressDetails('comentarios');
      return;
    }
    if (item.category === 'badges') {
      this.openStudentProgressDetails('badges');
      return;
    }
    this.openStudentProgressDetails('frequencia');
  }

  formatNotificationDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  loadStudentMonthlyComparison(): void {
    if (!this.currentUser || !this.isAluno()) {
      return;
    }

    this.isLoadingComparacao = true;
    this.comparacaoError = '';
    this.showComparacaoHistory = false;

    this.api.getStudentMonthlyComparison({ months: 6 }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: StudentMonthlyComparisonResponse) => {
        this.studentMonthlyComparison = response;
        this.isLoadingComparacao = false;
      },
      error: () => {
        this.studentMonthlyComparison = null;
        this.isLoadingComparacao = false;
        this.comparacaoError = 'Erro ao carregar comparação mês-a-mês';
      },
    });
  }

  toggleComparacaoHistory(): void {
    this.showComparacaoHistory = !this.showComparacaoHistory;
  }

  getMonthLabel(monthStart: string): string {
    const date = new Date(`${monthStart}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return monthStart;
    }
    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    }).replace(/^./, (char) => char.toUpperCase());
  }

  getComparacaoTrend(current: number, previous: number): 'up' | 'down' | 'same' {
    if (current > previous) {
      return 'up';
    }
    if (current < previous) {
      return 'down';
    }
    return 'same';
  }

  getComparacaoDelta(current: number, previous: number): number {
    return current - previous;
  }

  allMetricsImproved(current: StudentMonthlyStats, previous: StudentMonthlyStats): boolean {
    return current.frequencia.pct >= previous.frequencia.pct
      && current.tecnicas >= previous.tecnicas
      && current.comentarios >= previous.comentarios;
  }

  getComparacaoDropLabels(current: StudentMonthlyStats, previous: StudentMonthlyStats): string[] {
    const labels: string[] = [];

    if (current.frequencia.pct < previous.frequencia.pct) {
      labels.push('Frequência');
    }
    if (current.tecnicas < previous.tecnicas) {
      labels.push('Técnicas praticadas');
    }
    if (current.comentarios < previous.comentarios) {
      labels.push('Comentários recebidos');
    }

    return labels;
  }

  getComparacaoTrendIcon(current: number, previous: number): string {
    const trend = this.getComparacaoTrend(current, previous);
    if (trend === 'up') {
      return '↑';
    }
    if (trend === 'down') {
      return '↓';
    }
    return '→';
  }

  getComparacaoTrendClass(current: number, previous: number): string {
    const trend = this.getComparacaoTrend(current, previous);
    if (trend === 'up') {
      return 'trend-up';
    }
    if (trend === 'down') {
      return 'trend-down';
    }
    return 'trend-same';
  }

  getStudentProgressHeading(): string {
    if (this.studentProgressDashboard?.heading) {
      return this.studentProgressDashboard.heading;
    }
    return `Olá, ${this.currentUser?.fullName || 'Aluno'}!`;
  }

  getStudentProgressSubheading(): string {
    return this.studentProgressDashboard?.subheading || 'Seu progresso em judô';
  }

  getFormattedLastProgressSync(): string {
    if (!this.lastProgressSyncAt) {
      return '';
    }

    return new Date(this.lastProgressSyncAt).toLocaleString('pt-BR');
  }

  formatBeltDuration(days: number): string {
    if (days <= 0) {
      return 'Recente';
    }

    const months = Math.floor(days / 30);
    if (months >= 1) {
      return `${months} mes(es)`;
    }

    return `${days} dia(s)`;
  }

  // Story 4-8: Belt History methods
  private readonly BELT_HISTORY_CACHE_KEY_PREFIX = 'belt-history:';

  private getBeltHistoryCacheKey(): string {
    return `${this.BELT_HISTORY_CACHE_KEY_PREFIX}${this.currentUser?.id || 'unknown'}`;
  }

  loadBeltHistory(): void {
    if (!this.currentUser || !this.isAluno()) {
      return;
    }

    this.isLoadingBeltHistory = true;
    this.beltHistoryErrorMessage = '';

    this.api.getStudentBeltHistory().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: StudentBeltHistoryResponse) => {
        this.beltHistoryData = response;
        this.isLoadingBeltHistory = false;
        this.beltHistoryCacheTimestamp = new Date().toISOString();
        try {
          localStorage.setItem(
            this.getBeltHistoryCacheKey(),
            JSON.stringify({ data: response, timestamp: this.beltHistoryCacheTimestamp })
          );
        } catch {
          // localStorage quota exceeded — silently ignore
        }
      },
      error: () => {
        this.isLoadingBeltHistory = false;
        try {
          const raw = localStorage.getItem(this.getBeltHistoryCacheKey());
          if (raw) {
            const cached = JSON.parse(raw) as { data: StudentBeltHistoryResponse; timestamp: string };
            this.beltHistoryData = cached.data;
            this.beltHistoryCacheTimestamp = cached.timestamp;
            return;
          }
        } catch {
          // cache unreadable
        }
        this.beltHistoryErrorMessage = 'Erro ao carregar histórico de faixas';
      },
    });
  }

  toggleBeltExpand(id: number): void {
    this.expandedBeltId = this.expandedBeltId === id ? null : id;
  }

  getBeltEmoji(belt: string): string {
    const map: Record<string, string> = {
      'branca': '⚪',
      'branca_ponta_bordô': '⚪🟣',
      'bordô': '🟣',
      'branca_ponta_cinza': '⚪🩶',
      'cinza': '🩶',
      'cinza_ponta_azul': '🩶🔵',
      'azul': '🔵',
      'azul_ponta_amarela': '🔵🟡',
      'amarela': '🟡',
      'amarela_ponta_laranja': '🟡🟠',
      'laranja': '🟠',
      'verde': '🟢',
      'roxa': '🟣',
      'marrom': '🟤',
      'preta': '⚫',
      'coral': '🔴',
      'vermelha': '🔴',
    };
    return map[belt.toLowerCase()] || '🥋';
  }

  formatBeltDurationFull(days: number): string {
    if (days < 30) {
      return `${days} dia(s)`;
    }
    const months = Math.round(days / 30);
    return `${months} mes(es)`;
  }

  formatPracticingTime(dataEntrada?: string): string {
    if (!dataEntrada) {
      return '';
    }
    const start = new Date(dataEntrada);
    const now = new Date();
    const totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (totalMonths <= 0) {
      return 'menos de 1 mês';
    }
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (years === 0) {
      return `${months} mes(es)`;
    }
    if (months === 0) {
      return `${years} ano(s)`;
    }
    return `${years} ano(s) e ${months} mes(es)`;
  }

  formatDaysAgo(dateStr?: string): string {
    if (!dateStr) {
      return '';
    }
    const past = new Date(dateStr);
    const days = Math.floor((Date.now() - past.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) {
      return 'hoje';
    }
    return `${days} dia(s) atrás`;
  }

  formatBeltDate(dateStr: string): string {
    const monthNames = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
    ];
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()} de ${monthNames[d.getMonth()]} de ${d.getFullYear()}`;
  }

  get canLoadPreviousAttendancePage(): boolean {
    return this.attendanceHistoryOffset > 0;
  }

  get canLoadNextAttendancePage(): boolean {
    return this.attendanceHistoryOffset + this.attendanceHistoryLimit < this.attendanceHistoryTotal;
  }

  loadStudentAttendanceHistory(resetOffset: boolean = false): void {
    if (!this.currentUser || !this.isAluno()) {
      return;
    }

    if (resetOffset) {
      this.attendanceHistoryOffset = 0;
    }

    this.isLoadingAttendanceHistory = true;
    this.attendanceHistoryErrorMessage = '';

    this.api.getStudentAttendanceHistory({
      dateFrom: this.attendanceFilterFrom || undefined,
      dateTo: this.attendanceFilterTo || undefined,
      limit: this.attendanceHistoryLimit,
      offset: this.attendanceHistoryOffset,
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: StudentAttendanceHistoryResponse) => {
        this.attendanceHistory = response.items || [];
        this.attendanceHistoryTotal = response.total || 0;
        this.attendanceHistoryLimit = response.limit || 20;
        this.attendanceHistoryOffset = response.offset || 0;
        this.attendanceHistoryPercentage = response.attendancePercentage || 0;
        this.attendanceHistoryWarningBelow70 = response.warningBelow70 === true;
        this.attendanceCurrentStreak = response.currentStreak || 0;
        this.attendanceCurrentStreakDays = response.currentStreakDays || 0;
        this.isLoadingAttendanceHistory = false;
      },
      error: () => {
        this.attendanceHistory = [];
        this.attendanceHistoryTotal = 0;
        this.attendanceHistoryPercentage = 0;
        this.attendanceHistoryWarningBelow70 = false;
        this.attendanceCurrentStreak = 0;
        this.attendanceCurrentStreakDays = 0;
        this.isLoadingAttendanceHistory = false;
        this.attendanceHistoryErrorMessage = 'Erro ao carregar histórico de frequência';
      },
    });
  }

  applyAttendanceFilter(): void {
    this.loadStudentAttendanceHistory(true);
  }

  clearAttendanceFilter(): void {
    this.attendanceFilterFrom = '';
    this.attendanceFilterTo = '';
    this.loadStudentAttendanceHistory(true);
  }

  goToPreviousAttendancePage(): void {
    if (!this.canLoadPreviousAttendancePage) {
      return;
    }
    this.attendanceHistoryOffset = Math.max(0, this.attendanceHistoryOffset - this.attendanceHistoryLimit);
    this.loadStudentAttendanceHistory(false);
  }

  goToNextAttendancePage(): void {
    if (!this.canLoadNextAttendancePage) {
      return;
    }
    this.attendanceHistoryOffset += this.attendanceHistoryLimit;
    this.loadStudentAttendanceHistory(false);
  }

  getAttendanceStatusLabel(status: 'present' | 'absent' | 'justified'): string {
    if (status === 'present') {
      return '✓ Presente';
    }
    if (status === 'justified') {
      return '⚪ Justificada';
    }
    return '✗ Ausente';
  }

  getAttendanceStatusClass(status: 'present' | 'absent' | 'justified'): string {
    if (status === 'present') {
      return 'status-present';
    }
    if (status === 'justified') {
      return 'status-justified';
    }
    return 'status-absent';
  }

  getAttendanceRangeLabel(): string {
    if (this.attendanceHistoryTotal === 0 || this.attendanceHistory.length === 0) {
      return '0 de 0';
    }
    const start = this.attendanceHistoryOffset + 1;
    const end = this.attendanceHistoryOffset + this.attendanceHistory.length;
    return `${start}-${end} de ${this.attendanceHistoryTotal}`;
  }

  async exportAttendanceCsv(): Promise<void> {
    if (!this.currentUser || !this.isAluno()) {
      return;
    }

    const allItems: StudentAttendanceHistoryItem[] = [];
    let total = 0;
    let offset = 0;
    const limit = 100;

    try {
      do {
        const response = await firstValueFrom(this.api.getStudentAttendanceHistory({
          dateFrom: this.attendanceFilterFrom || undefined,
          dateTo: this.attendanceFilterTo || undefined,
          limit,
          offset,
        }));

        const chunk = response.items || [];
        total = response.total || chunk.length;
        allItems.push(...chunk);

        if (chunk.length === 0) {
          break;
        }

        offset += response.limit || limit;
      } while (offset < total);
    } catch {
      this.attendanceHistoryErrorMessage = 'Erro ao exportar histórico de frequência';
      return;
    }

    if (!allItems.length) {
      return;
    }

    const header = 'Data,Turma,Status\n';
    const rows = allItems.map((item) => {
      const date = new Date(item.sessionDate).toLocaleDateString('pt-BR');
      const turma = `"${item.turmaName.replace(/"/g, '""')}"`;
      const status = this.getAttendanceStatusLabel(item.status);
      return `${date},${turma},${status}`;
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const studentName = (this.currentUser?.fullName || 'Aluno').replace(/\s+/g, '_');
    link.href = url;
    link.download = `Frequencia_${studentName}_2026.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Story 4-4: Comment History methods

  loadStudentCommentHistory(resetOffset: boolean = false): void {
    if (!this.currentUser || !this.isAluno()) {
      return;
    }

    if (resetOffset) {
      this.commentHistoryOffset = 0;
    }

    this.isLoadingCommentHistory = true;
    this.commentHistoryErrorMessage = '';

    this.api.getStudentCommentHistory({
      keyword: this.commentSearchKeyword.trim() || undefined,
      limit: this.commentHistoryLimit,
      offset: this.commentHistoryOffset,
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: StudentCommentHistoryResponse) => {
        this.commentHistory = response.items || [];
        this.commentHistoryTotal = response.total || 0;
        this.commentHistoryLimit = response.limit || 20;
        this.commentHistoryOffset = response.offset || 0;
        this.isLoadingCommentHistory = false;
      },
      error: () => {
        this.commentHistory = [];
        this.commentHistoryTotal = 0;
        this.isLoadingCommentHistory = false;
        this.commentHistoryErrorMessage = 'Erro ao carregar histórico de comentários';
      },
    });
  }

  applyCommentSearch(): void {
    this.loadStudentCommentHistory(true);
  }

  clearCommentSearch(): void {
    this.commentSearchKeyword = '';
    this.loadStudentCommentHistory(true);
  }

  get canLoadPreviousCommentPage(): boolean {
    return this.commentHistoryOffset > 0;
  }

  get canLoadNextCommentPage(): boolean {
    return this.commentHistoryOffset + this.commentHistoryLimit < this.commentHistoryTotal;
  }

  goToPreviousCommentPage(): void {
    if (!this.canLoadPreviousCommentPage) {
      return;
    }
    this.commentHistoryOffset = Math.max(0, this.commentHistoryOffset - this.commentHistoryLimit);
    this.loadStudentCommentHistory(false);
  }

  goToNextCommentPage(): void {
    if (!this.canLoadNextCommentPage) {
      return;
    }
    this.commentHistoryOffset += this.commentHistoryLimit;
    this.loadStudentCommentHistory(false);
  }

  getCommentRangeLabel(): string {
    if (this.commentHistoryTotal === 0 || this.commentHistory.length === 0) {
      return '0 de 0';
    }
    const start = this.commentHistoryOffset + 1;
    const end = this.commentHistoryOffset + this.commentHistory.length;
    return `${start}-${end} de ${this.commentHistoryTotal}`;
  }

  getCommentSentiment(content: string): 'positive' | 'neutral' {
    const positiveKeywords = [
      'parabéns', 'excelente', 'ótimo', 'ótima', 'muito bem', 'progresso',
      'evoluiu', 'melhorou', 'sensacional', 'incrível', 'superou', 'mandou bem',
      'perfeito', 'perfeita', 'show', 'boa execução', 'evoluindo',
    ];
    const lower = content.toLowerCase();
    return positiveKeywords.some((kw) => lower.includes(kw)) ? 'positive' : 'neutral';
  }

  getCommentTechniqueTags(content: string): string[] {
    const matches = content.match(/#(\w+)/g);
    return matches ? matches.map((t) => t.slice(1)) : [];
  }

  highlightSearchTerm(content: string): string {
    // HTML-escape raw content first to prevent injection via professor-authored text
    const safe = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const keyword = this.commentSearchKeyword.trim();
    if (!keyword) {
      return safe;
    }
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe.replace(
      new RegExp(`(${escaped})`, 'gi'),
      '<span class="search-highlight">$1</span>'
    );
  }

  formatCommentDate(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
    }) + ' - ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  groupCommentsByDate(items: StudentCommentHistoryItem[]): Array<{ date: string; label: string; comments: StudentCommentHistoryItem[] }> {
    const groups: Map<string, StudentCommentHistoryItem[]> = new Map();
    for (const item of items) {
      const dateKey = item.createdAt.slice(0, 10);
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(item);
    }
    return Array.from(groups.entries()).map(([date, comments]) => ({
      date,
      label: new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      }),
      comments,
    }));
  }

  async shareComment(item: StudentCommentHistoryItem): Promise<void> {
    const text = `Prof. ${item.professorName} disse: ${item.content}`;
    this.commentShareConfirmation = '';
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.commentShareConfirmation = 'Copiado para a área de transferência!';
      setTimeout(() => { this.commentShareConfirmation = ''; }, 3000);
    } catch {
      this.commentShareConfirmation = 'Não foi possível copiar.';
      setTimeout(() => { this.commentShareConfirmation = ''; }, 3000);
    }
  }

  loadStudentBadgesHistory(): void {
    if (!this.currentUser || !this.isAluno()) {
      return;
    }

    this.isLoadingBadgesHistory = true;
    this.badgesHistoryErrorMessage = '';
    this.badgeShareConfirmation = '';

    this.api.getStudentBadgesHistory({
      limitUnlocked: 20,
      limitUpcoming: 5,
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: StudentBadgesHistoryResponse) => {
        this.unlockedBadges = response.unlocked || [];
        this.upcomingBadges = response.upcoming || [];
        this.totalUnlockedBadges = response.totals?.unlocked ?? this.unlockedBadges.length;
        this.totalUpcomingBadges = response.totals?.upcoming ?? this.upcomingBadges.length;
        this.isLoadingBadgesHistory = false;
      },
      error: () => {
        this.unlockedBadges = [];
        this.upcomingBadges = [];
        this.totalUnlockedBadges = 0;
        this.totalUpcomingBadges = 0;
        this.isLoadingBadgesHistory = false;
        this.badgesHistoryErrorMessage = 'Erro ao carregar badges e milestones';
      },
    });
  }

  openUnlockedBadgeDetails(item: StudentBadgeUnlockedItem): void {
    this.selectedUnlockedBadge = item;
  }

  closeUnlockedBadgeDetails(): void {
    this.selectedUnlockedBadge = null;
  }

  getUpcomingBadgeProgressLabel(item: StudentBadgeUpcomingItem): string {
    return `Você está a ${item.progressPercent}% de desbloquear ${item.name}`;
  }

  getUpcomingBadgeRemainingLabel(item: StudentBadgeUpcomingItem): string {
    if (item.criteriaType === 'attendance_percentage') {
      return `Faltam: ${item.remaining} ponto(s) percentuais`;
    }
    if (item.criteriaType === 'streak') {
      return `Faltam: ${item.remaining} dia(s)`;
    }
    return `Faltam: ${item.remaining} aula(s)`;
  }

  getUpcomingBadgeTooltip(item: StudentBadgeUpcomingItem): string {
    const eta = item.etaHint ? ` - ${item.etaHint}` : '';
    return `Progresso: ${item.currentValue}/${item.criteriaValue} - Faltam ${item.remaining}${eta}`;
  }

  toggleUpcomingBadgeTip(item: StudentBadgeUpcomingItem): void {
    this.expandedUpcomingBadgeId = this.expandedUpcomingBadgeId === item.badgeId
      ? null
      : item.badgeId;
  }

  isUpcomingBadgeTipExpanded(item: StudentBadgeUpcomingItem): boolean {
    return this.expandedUpcomingBadgeId === item.badgeId;
  }

  async shareBadge(item: StudentBadgeUnlockedItem): Promise<void> {
    const academyName = this.currentUser?.academy?.name || 'SCAcademia';
    const text = `🏅 Desbloqueei '${item.name}' em SCAcademia! Treino 🥋 em ${academyName}.`;
    this.badgeShareConfirmation = '';

    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      this.badgeShareConfirmation = 'Badge compartilhado com sucesso!';
      setTimeout(() => { this.badgeShareConfirmation = ''; }, 3000);
    } catch {
      this.badgeShareConfirmation = 'Não foi possível compartilhar o badge.';
      setTimeout(() => { this.badgeShareConfirmation = ''; }, 3000);
    }
  }

  async copyBadgeToClipboard(item: StudentBadgeUnlockedItem): Promise<void> {
    const academyName = this.currentUser?.academy?.name || 'SCAcademia';
    const text = `🏅 Desbloqueei '${item.name}' em SCAcademia! Treino 🥋 em ${academyName}.`;
    this.badgeShareConfirmation = '';
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      this.badgeShareConfirmation = 'Mensagem copiada para a área de transferência!';
      setTimeout(() => { this.badgeShareConfirmation = ''; }, 3000);
    } catch {
      this.badgeShareConfirmation = 'Não foi possível copiar a mensagem.';
      setTimeout(() => { this.badgeShareConfirmation = ''; }, 3000);
    }
  }

  private getStudentProgressCacheKey(): string {
    return `student-progress-dashboard:${this.currentUser?.id || 'unknown'}`;
  }

  private readStudentProgressCache(cacheKey: string): {
    data: StudentProgressDashboardResponse;
    cachedAt: string;
  } | null {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as { data: StudentProgressDashboardResponse; cachedAt: string };
      if (!parsed?.data || !parsed?.cachedAt) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  private writeStudentProgressCache(
    cacheKey: string,
    data: StudentProgressDashboardResponse,
    cachedAt: string | null
  ): void {
    if (!cachedAt) {
      return;
    }

    localStorage.setItem(cacheKey, JSON.stringify({ data, cachedAt }));
  }

  private hasStudentProgressContent(dashboard: StudentProgressDashboardResponse | null): boolean {
    if (!dashboard) {
      return false;
    }

    const { evolucaoMes, frequencia, comentariosProfessor, faixaConquistas } = dashboard.cards;

    return (
      evolucaoMes.currentMonthPresentCount > 0 ||
      evolucaoMes.previousMonthPresentCount > 0 ||
      evolucaoMes.monthlySeries.length > 0 ||
      evolucaoMes.weeklySeries.length > 0 ||
      frequencia.presentCount90d > 0 ||
      frequencia.totalCount90d > 0 ||
      frequencia.recentSessions.length > 0 ||
      Boolean(frequencia.nextClass) ||
      comentariosProfessor.totalComments > 0 ||
      comentariosProfessor.timeline.length > 0 ||
      Boolean(comentariosProfessor.latest) ||
      Boolean(faixaConquistas.currentBelt) ||
      Boolean(faixaConquistas.beltDate) ||
      faixaConquistas.isFederated ||
      faixaConquistas.totalBadges > 0 ||
      faixaConquistas.latestBadges.length > 0 ||
      faixaConquistas.currentStreak > 0 ||
      faixaConquistas.beltHistory.length > 0
    );
  }

  formatTrainingDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
  }

  private setStartingTrainingState(value: boolean): void {
    this.ngZone.run(() => {
      this.isStartingTraining = value;
      this.cdr.detectChanges();
    });
  }

  private setLoadingTurmasState(value: boolean): void {
    this.ngZone.run(() => {
      this.isLoadingTurmasForTraining = value;
      this.cdr.detectChanges();
    });
  }

}

