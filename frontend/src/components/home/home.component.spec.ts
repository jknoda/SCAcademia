import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { StudentProgressChartComponent } from '../student-progress-chart/student-progress-chart.component';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser', 'logout'], {
      currentUser$: new BehaviorSubject({
        id: 'guardian-1',
        email: 'responsavel@test.com',
        fullName: 'Responsavel',
        role: 'Responsavel',
        academy: { id: 'academy-1', name: 'Academia' },
      }),
    });
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'listLinkedStudents',
      'getStudentAttendanceHistory',
      'getStudentCommentHistory',
      'getStudentBadgesHistory',
      'getStudentMonthlyComparison',
      'getStudentNotifications',
      'markStudentNotificationRead',
      'markAllStudentNotificationsRead',
      'getStudentBeltHistory',
    ]);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    authSpy.getCurrentUser.and.returnValue({
      id: 'guardian-1',
      email: 'responsavel@test.com',
      fullName: 'Responsavel',
      role: 'Responsavel',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any);

    apiSpy.listLinkedStudents.and.returnValue(
      of({
        students: [
          {
            studentId: 'student-1',
            studentName: 'Filho Um',
            hasHealthScreening: false,
            healthScreeningUpdatedAt: null,
          },
        ],
      }) as any
    );

    apiSpy.getStudentAttendanceHistory.and.returnValue(
      of({
        studentName: 'Aluna',
        items: [
          { sessionDate: '2026-03-19', turmaName: 'Judo Iniciante', status: 'present' },
          { sessionDate: '2026-03-18', turmaName: 'Judo Iniciante', status: 'absent' },
        ],
        total: 2,
        limit: 20,
        offset: 0,
        attendancePercentage: 65,
        warningBelow70: true,
        currentStreak: 5,
        currentStreakDays: 35,
        generatedAt: '2026-03-27T16:00:00.000Z',
      }) as any
    );

    apiSpy.getStudentCommentHistory.and.returnValue(
      of({
        items: [
          {
            content: 'Parabéns pela execução do Osoto Gari! #OsotoGari',
            professorName: 'Prof. João',
            sessionDate: '2026-03-19',
            createdAt: '2026-03-19T15:47:00.000Z',
          },
          {
            content: 'Boa aula. Continue treinando a postura.',
            professorName: 'Prof. João',
            sessionDate: '2026-03-18',
            createdAt: '2026-03-18T10:00:00.000Z',
          },
        ],
        total: 2,
        limit: 20,
        offset: 0,
      }) as any
    );

    apiSpy.getStudentBadgesHistory.and.returnValue(
      of({
        unlocked: [
          {
            badgeId: 'badge-1',
            name: '🔥 Sequência de Fogo',
            description: 'Participou de 10 aulas consecutivas sem faltas',
            earnedAt: '2026-03-20T10:00:00.000Z',
            shareText: "🏅 Desbloqueei '🔥 Sequência de Fogo' em SCAcademia!",
          },
        ],
        upcoming: [
          {
            badgeId: 'badge-2',
            name: '⭐ Dedicado',
            description: 'Frequência de 90% ou mais',
            criteriaType: 'attendance_percentage',
            criteriaValue: 90,
            currentValue: 65,
            progressPercent: 72,
            remaining: 25,
            etaHint: 'Mantenha presença alta.',
          },
        ],
        totals: {
          unlocked: 1,
          upcoming: 1,
        },
      }) as any
    );

    apiSpy.getStudentMonthlyComparison.and.returnValue(
      of({
        currentMonth: {
          monthStart: '2026-03-01',
          monthLabel: 'Março 2026',
          frequencia: { presentCount: 16, totalCount: 20, pct: 80 },
          tecnicas: 12,
          comentarios: 5,
        },
        previousMonth: {
          monthStart: '2026-02-01',
          monthLabel: 'Fevereiro 2026',
          frequencia: { presentCount: 14, totalCount: 20, pct: 70 },
          tecnicas: 8,
          comentarios: 3,
        },
        history: [
          {
            monthStart: '2025-10-01',
            monthLabel: 'Outubro 2025',
            frequencia: { presentCount: 8, totalCount: 16, pct: 50 },
            tecnicas: 4,
            comentarios: 1,
          },
          {
            monthStart: '2026-03-01',
            monthLabel: 'Março 2026',
            frequencia: { presentCount: 16, totalCount: 20, pct: 80 },
            tecnicas: 12,
            comentarios: 5,
          },
        ],
        hasEnoughData: true,
      }) as any
    );

    apiSpy.getStudentNotifications.and.returnValue(
      of({
        items: [
          {
            notificationId: 'notif-1',
            type: 'badge_earned',
            category: 'badges',
            title: '🏅 Novo badge desbloqueado!',
            message: 'Você desbloqueou Faixa Amarela.',
            status: 'sent',
            createdAt: '2026-03-28T08:00:00.000Z',
            isRead: false,
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
        unreadCount: 1,
      }) as any
    );

    apiSpy.markStudentNotificationRead.and.returnValue(of({ success: true }) as any);
    apiSpy.markAllStudentNotificationsRead.and.returnValue(of({ success: true, affected: 1 }) as any);

    apiSpy.getStudentBeltHistory.and.returnValue(
      of({
        entries: [
          {
            beltHistoryId: 1,
            belt: 'branca',
            receivedDate: '2025-01-20',
            promotedBy: 'Prof. João',
            notes: 'Desempenho excelente',
            durationDays: 90,
            isCurrentBelt: false,
          },
          {
            beltHistoryId: 2,
            belt: 'azul',
            receivedDate: '2025-04-20',
            promotedBy: 'Prof. João',
            notes: null,
            durationDays: 45,
            isCurrentBelt: true,
          },
        ],
        stats: {
          totalBelts: 2,
          longestBeltName: 'branca',
          longestBeltDays: 90,
          lastBeltDate: '2025-04-20',
          dataEntrada: '2024-01-01',
        },
        judoProfile: {
          currentBelt: 'azul',
          isFederated: true,
          federationRegistration: 'FED-123',
          federationDate: '2025-06-01',
        },
      }) as any
    );

    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      imports: [FormsModule, StudentProgressChartComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('lista filhos com anamnese pendente para o responsável', () => {
    expect(component.studentsWithoutHealthScreening.length).toBe(1);
    expect(component.studentsWithoutHealthScreening[0].studentName).toBe('Filho Um');
  });

  it('navega para o formulário de anamnese com retorno para home', () => {
    component.goToStudentHealthScreening('student-1');

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/health-screening', 'student-1'], {
      queryParams: { returnTo: '/home' },
    });
  });

  it('carrega dashboard de progresso do cache quando aluno está offline', () => {
    const cachedDashboard = {
      heading: 'Olá, Aluna!',
      subheading: 'Seu progresso em judô',
      cards: {
        evolucaoMes: {
          currentMonthPresentCount: 4,
          previousMonthPresentCount: 3,
          delta: 1,
          monthlySeries: [],
          weeklySeries: [
            { weekNumber: 1, date: '2026-03-01', proficiencyPercent: 45 },
            { weekNumber: 2, date: '2026-03-08', proficiencyPercent: 52 },
          ],
        },
        frequencia: {
          presentCount90d: 4,
          totalCount90d: 5,
          attendancePercentage90d: 80,
          recentSessions: [],
        },
        comentariosProfessor: {
          totalComments: 0,
          timeline: [],
        },
        faixaConquistas: {
          isFederated: false,
          totalBadges: 0,
          latestBadges: [],
          currentStreak: 0,
          beltHistory: [],
        },
      },
      generatedAt: '2026-03-27T16:00:00.000Z',
    } as any;

    localStorage.setItem(
      'student-progress-dashboard:student-1',
      JSON.stringify({
        data: cachedDashboard,
        cachedAt: '2026-03-27T16:00:00.000Z',
      })
    );

    spyOnProperty(window.navigator, 'onLine', 'get').and.returnValue(false);

    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.loadStudentProgressDashboard();

    expect(component.studentProgressDashboard?.heading).toBe('Olá, Aluna!');
    expect(component.studentProgressWeeklyData.length).toBe(2);
    expect(component.isUsingCachedProgressData).toBeTrue();
    expect(component.hasStudentProgressError).toBeFalse();
  });

  it('exibe mensagem quando o aluno ainda nao possui dados para preencher os cards', () => {
    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.studentProgressDashboard = {
      heading: 'Olá, Aluna!',
      subheading: 'Seu progresso em judô',
      cards: {
        evolucaoMes: {
          currentMonthPresentCount: 0,
          previousMonthPresentCount: 0,
          delta: 0,
          monthlySeries: [],
          weeklySeries: [],
        },
        frequencia: {
          presentCount90d: 0,
          totalCount90d: 0,
          attendancePercentage90d: 0,
          recentSessions: [],
        },
        comentariosProfessor: {
          totalComments: 0,
          timeline: [],
        },
        faixaConquistas: {
          isFederated: false,
          totalBadges: 0,
          latestBadges: [],
          currentStreak: 0,
          beltHistory: [],
        },
      },
      generatedAt: '2026-03-28T10:00:00.000Z',
    } as any;
    component.studentProgressHasContent = false;
    component.isLoadingStudentProgress = false;
    component.hasStudentProgressError = false;

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Ainda não há dados para exibir');
    expect(compiled.querySelectorAll('.student-progress-card').length).toBe(0);
  });

  it('abre detalhes de frequencia e carrega historico paginado com streak e warning', () => {
    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.openStudentProgressDetails('frequencia');

    expect(apiSpy.getStudentAttendanceHistory).toHaveBeenCalled();
    expect(component.attendanceHistory.length).toBe(2);
    expect(component.attendanceHistoryWarningBelow70).toBeTrue();
    expect(component.attendanceCurrentStreak).toBe(5);
    expect(component.attendanceCurrentStreakDays).toBe(35);
  });

  it('abre detalhes de comentarios e carrega historico paginado (AC1)', () => {
    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.openStudentProgressDetails('comentarios');

    expect(apiSpy.getStudentCommentHistory).toHaveBeenCalled();
    expect(component.commentHistory.length).toBe(2);
    expect(component.commentHistoryTotal).toBe(2);
  });

  it('classifica comentário positivo com heurística de palavra-chave (AC4)', () => {
    expect(component.getCommentSentiment('Parabéns pela execução!')).toBe('positive');
    expect(component.getCommentSentiment('Boa aula. Continue treinando.')).toBe('neutral');
    expect(component.getCommentSentiment('Excelente postura hoje!')).toBe('positive');
    expect(component.getCommentSentiment('Precisa melhorar a entrada.')).toBe('neutral');
  });

  it('extrai tags de técnicas do conteúdo do comentário (AC2)', () => {
    const tags = component.getCommentTechniqueTags('Parabéns! #OsotoGari #Progresso');
    expect(tags).toContain('OsotoGari');
    expect(tags).toContain('Progresso');
    expect(tags.length).toBe(2);
  });

  it('retorna array vazio quando não há hashtags no conteúdo', () => {
    expect(component.getCommentTechniqueTags('Boa aula.')).toEqual([]);
  });

  it('agrupa comentários por data corretamente (AC3)', () => {
    const items = [
      { content: 'A', professorName: 'Prof. A', createdAt: '2026-03-19T15:47:00.000Z' },
      { content: 'B', professorName: 'Prof. A', createdAt: '2026-03-19T10:00:00.000Z' },
      { content: 'C', professorName: 'Prof. B', createdAt: '2026-03-18T09:00:00.000Z' },
    ];
    const groups = component.groupCommentsByDate(items as any);
    expect(groups.length).toBe(2);
    expect(groups[0].comments.length).toBe(2);
    expect(groups[1].comments.length).toBe(1);
  });

  it('highlight de busca envolve o termo em span (AC7)', () => {
    component.commentSearchKeyword = 'Osoto';
    const result = component.highlightSearchTerm('Parabéns pelo Osoto Gari!');
    expect(result).toContain('<span class="search-highlight">Osoto</span>');
  });

  it('retorna conteúdo sem alterar quando keyword está vazia', () => {
    component.commentSearchKeyword = '';
    const text = 'Parabéns pelo treino!';
    expect(component.highlightSearchTerm(text)).toBe(text);
  });

  it('erro ao carregar comentários seta mensagem de erro e limpa lista', () => {
    const { throwError } = require('rxjs');
    apiSpy.getStudentCommentHistory.and.returnValue(throwError(() => new Error('fail')));

    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.loadStudentCommentHistory(true);

    expect(component.commentHistory.length).toBe(0);
    expect(component.commentHistoryTotal).toBe(0);
    expect(component.commentHistoryErrorMessage).toBe('Erro ao carregar histórico de comentários');
  });

  it('abre detalhes de badges e carrega desbloqueados e próximos', () => {
    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.openStudentProgressDetails('badges');

    expect(apiSpy.getStudentBadgesHistory).toHaveBeenCalled();
    expect(component.unlockedBadges.length).toBe(1);
    expect(component.upcomingBadges.length).toBe(1);
    expect(component.totalUnlockedBadges).toBe(1);
  });

  it('gera label de progresso e faltante para próximos badges', () => {
    const badge = {
      badgeId: 'badge-2',
      criteriaType: 'attendance_percentage',
      criteriaValue: 90,
      currentValue: 65,
      progressPercent: 72,
      remaining: 25,
      name: '⭐ Dedicado',
      description: 'Frequência de 90% ou mais',
    } as any;

    expect(component.getUpcomingBadgeProgressLabel(badge)).toBe('Você está a 72% de desbloquear ⭐ Dedicado');
    expect(component.getUpcomingBadgeRemainingLabel(badge)).toContain('25 ponto(s) percentuais');
  });

  it('expande e recolhe dica de badge futuro no toggle', () => {
    const badge = { badgeId: 'badge-2' } as any;
    component.toggleUpcomingBadgeTip(badge);
    expect(component.isUpcomingBadgeTipExpanded(badge)).toBeTrue();

    component.toggleUpcomingBadgeTip(badge);
    expect(component.isUpcomingBadgeTipExpanded(badge)).toBeFalse();
  });

  it('compartilha badge usando estratégia disponível (Web Share ou clipboard)', async () => {
    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia Noda' },
    } as any;

    const nav = window.navigator as any;
    const clipboardSpy = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    spyOnProperty(nav, 'clipboard', 'get').and.returnValue({ writeText: clipboardSpy });

    let shareSpy: jasmine.Spy | null = null;
    if (typeof nav.share === 'function') {
      shareSpy = spyOn(nav, 'share').and.returnValue(Promise.resolve());
    }

    await component.shareBadge({
      badgeId: 'badge-1',
      name: '🔥 Sequência de Fogo',
      description: 'Participou de 10 aulas consecutivas sem faltas',
      earnedAt: '2026-03-20T10:00:00.000Z',
      shareText: "🏅 Desbloqueei '🔥 Sequência de Fogo' em SCAcademia!",
    } as any);

    if (shareSpy) {
      expect(shareSpy).toHaveBeenCalled();
    } else {
      expect(clipboardSpy).toHaveBeenCalled();
    }
    expect(component.badgeShareConfirmation).toBe('Badge compartilhado com sucesso!');
  });

  it('exibe estado vazio quando não há badges desbloqueados nem próximos', () => {
    const { of } = require('rxjs');
    apiSpy.getStudentBadgesHistory.and.returnValue(
      of({ unlocked: [], upcoming: [], totals: { unlocked: 0, upcoming: 0 } }) as any
    );

    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.openStudentProgressDetails('badges');

    expect(component.unlockedBadges.length).toBe(0);
    expect(component.upcomingBadges.length).toBe(0);
    expect(component.totalUnlockedBadges).toBe(0);
    expect(component.totalUpcomingBadges).toBe(0);
    expect(component.isLoadingBadgesHistory).toBeFalse();
    expect(component.badgesHistoryErrorMessage).toBe('');
  });

  it('erro ao carregar badges seta mensagem de erro e limpa listas', () => {
    const { throwError } = require('rxjs');
    apiSpy.getStudentBadgesHistory.and.returnValue(throwError(() => new Error('fail')));

    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.loadStudentBadgesHistory();

    expect(component.unlockedBadges.length).toBe(0);
    expect(component.upcomingBadges.length).toBe(0);
    expect(component.totalUnlockedBadges).toBe(0);
    expect(component.totalUpcomingBadges).toBe(0);
    expect(component.isLoadingBadgesHistory).toBeFalse();
    expect(component.badgesHistoryErrorMessage).toBe('Erro ao carregar badges e milestones');
  });

  it('abre detalhes de comparacao e carrega dados mês-a-mês', () => {
    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.openStudentProgressDetails('comparacao');

    expect(apiSpy.getStudentMonthlyComparison).toHaveBeenCalledWith({ months: 6 });
    expect(component.studentMonthlyComparison?.currentMonth.monthLabel).toBe('Março 2026');
    expect(component.comparacaoError).toBe('');
    expect(component.isLoadingComparacao).toBeFalse();
  });

  it('trend e delta de comparação funcionam para up/down/same', () => {
    expect(component.getComparacaoTrend(80, 70)).toBe('up');
    expect(component.getComparacaoTrend(70, 80)).toBe('down');
    expect(component.getComparacaoTrend(70, 70)).toBe('same');
    expect(component.getComparacaoDelta(80, 70)).toBe(10);
  });

  it('allMetricsImproved retorna true quando todas métricas melhoram', () => {
    const current = {
      frequencia: { pct: 80 },
      tecnicas: 12,
      comentarios: 5,
    } as any;
    const previous = {
      frequencia: { pct: 70 },
      tecnicas: 10,
      comentarios: 4,
    } as any;

    expect(component.allMetricsImproved(current, previous)).toBeTrue();
  });

  it('allMetricsImproved retorna false quando há queda em alguma métrica', () => {
    const current = {
      frequencia: { pct: 80 },
      tecnicas: 12,
      comentarios: 2,
    } as any;
    const previous = {
      frequencia: { pct: 70 },
      tecnicas: 10,
      comentarios: 4,
    } as any;

    expect(component.allMetricsImproved(current, previous)).toBeFalse();
  });

  it('getComparacaoDropLabels retorna todas as métricas que caíram', () => {
    const current = {
      frequencia: { pct: 70 },
      tecnicas: 8,
      comentarios: 2,
    } as any;
    const previous = {
      frequencia: { pct: 80 },
      tecnicas: 10,
      comentarios: 3,
    } as any;

    expect(component.getComparacaoDropLabels(current, previous)).toEqual([
      'Frequência',
      'Técnicas praticadas',
      'Comentários recebidos',
    ]);
  });

  it('getComparacaoDropLabels retorna vazio quando não há queda', () => {
    const current = {
      frequencia: { pct: 80 },
      tecnicas: 10,
      comentarios: 3,
    } as any;
    const previous = {
      frequencia: { pct: 70 },
      tecnicas: 9,
      comentarios: 2,
    } as any;

    expect(component.getComparacaoDropLabels(current, previous)).toEqual([]);
  });

  it('getMonthLabel formata corretamente para mês/ano em pt-BR', () => {
    const label = component.getMonthLabel('2026-03-01');
    expect(label).toContain('2026');
    expect(label.toLowerCase()).toContain('março');
  });

  it('estado de primeiro mês mantém hasEnoughData false', () => {
    const { of } = require('rxjs');
    apiSpy.getStudentMonthlyComparison.and.returnValue(
      of({
        currentMonth: {
          monthStart: '2026-03-01',
          monthLabel: 'Março 2026',
          frequencia: { presentCount: 3, totalCount: 6, pct: 50 },
          tecnicas: 2,
          comentarios: 1,
        },
        previousMonth: {
          monthStart: '2026-02-01',
          monthLabel: 'Fevereiro 2026',
          frequencia: { presentCount: 0, totalCount: 0, pct: 0 },
          tecnicas: 0,
          comentarios: 0,
        },
        history: [],
        hasEnoughData: false,
      }) as any
    );

    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.openStudentProgressDetails('comparacao');

    expect(component.studentMonthlyComparison?.hasEnoughData).toBeFalse();
  });

  it('erro ao carregar comparação mês-a-mês define mensagem de erro', () => {
    const { throwError } = require('rxjs');
    apiSpy.getStudentMonthlyComparison.and.returnValue(throwError(() => new Error('fail')));

    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.loadStudentMonthlyComparison();

    expect(component.studentMonthlyComparison).toBeNull();
    expect(component.comparacaoError).toBe('Erro ao carregar comparação mês-a-mês');
    expect(component.isLoadingComparacao).toBeFalse();
  });

  it('abre detalhes de notificações e carrega feed', () => {
    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.openStudentProgressDetails('notificacoes');

    expect(apiSpy.getStudentNotifications).toHaveBeenCalledWith({ limit: 20, offset: 0 });
    expect(component.studentNotifications.length).toBe(1);
    expect(component.notificationsUnreadCount).toBe(1);
  });

  it('salva preferência de notificação no localStorage', () => {
    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.setNotificationPreference('badges', false);
    expect(component.notificationPreferences.badges).toBeFalse();

    const raw = localStorage.getItem('notification-preferences:student-1');
    expect(raw).toContain('"badges":false');
  });

  it('isNotificationCategoryEnabled respeita preferências', () => {
    component.notificationPreferences = {
      badges: false,
      frequencia: true,
      comentarios: true,
      lembretes: true,
    };

    expect(component.isNotificationCategoryEnabled('badges')).toBeFalse();
    expect(component.isNotificationCategoryEnabled('comentarios')).toBeTrue();
  });

  it('marca notificação como lida e decrementa contador', () => {
    component.studentNotifications = [
      {
        notificationId: 'notif-1',
        type: 'badge_earned',
        category: 'badges',
        title: 'x',
        message: 'y',
        status: 'sent',
        createdAt: '2026-03-28T08:00:00.000Z',
        isRead: false,
      } as any,
    ];
    component.notificationsUnreadCount = 1;

    component.markNotificationAsRead('notif-1');

    expect(apiSpy.markStudentNotificationRead).toHaveBeenCalledWith('notif-1');
    expect(component.studentNotifications[0].isRead).toBeTrue();
    expect(component.notificationsUnreadCount).toBe(0);
  });

  it('marca todas notificações como lidas', () => {
    component.studentNotifications = [
      {
        notificationId: 'notif-1',
        type: 'badge_earned',
        category: 'badges',
        title: 'x',
        message: 'y',
        status: 'sent',
        createdAt: '2026-03-28T08:00:00.000Z',
        isRead: false,
      } as any,
    ];
    component.notificationsUnreadCount = 1;

    component.markAllNotificationsAsRead();

    expect(apiSpy.markAllStudentNotificationsRead).toHaveBeenCalled();
    expect(component.studentNotifications[0].isRead).toBeTrue();
    expect(component.notificationsUnreadCount).toBe(0);
  });

  it('toast de notificação limpa após 5 segundos', () => {
    jasmine.clock().install();
    component.notificationPreferences = {
      badges: true,
      frequencia: true,
      comentarios: true,
      lembretes: true,
    };

    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.loadStudentNotifications(true);
    expect(component.activeStudentToastMessage.length).toBeGreaterThan(0);

    jasmine.clock().tick(5000);
    expect(component.activeStudentToastMessage).toBe('');
    jasmine.clock().uninstall();
  });

  // Story 4-8: Belt History tests
  it('getBeltEmoji retorna emoji correto para faixas principais', () => {
    expect(component.getBeltEmoji('branca')).toBe('⚪');
    expect(component.getBeltEmoji('azul')).toBe('🔵');
    expect(component.getBeltEmoji('preta')).toBe('⚫');
    expect(component.getBeltEmoji('verde')).toBe('🟢');
    expect(component.getBeltEmoji('desconhecida')).toBe('🥋');
  });

  it('formatBeltDurationFull retorna dias para < 30 e meses para >= 30', () => {
    expect(component.formatBeltDurationFull(15)).toBe('15 dia(s)');
    expect(component.formatBeltDurationFull(29)).toBe('29 dia(s)');
    expect(component.formatBeltDurationFull(30)).toBe('1 mes(es)');
    expect(component.formatBeltDurationFull(90)).toBe('3 mes(es)');
  });

  it('formatPracticingTime retorna string formatada com anos quando > 12 meses', () => {
    const today = new Date();
    const pastDate = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
    const dateStr = pastDate.toISOString().slice(0, 10);
    const result = component.formatPracticingTime(dateStr);
    expect(result).toContain('ano');
  });

  it('formatPracticingTime retorna apenas meses quando < 1 ano', () => {
    const today = new Date();
    const pastDate = new Date(today.getFullYear(), today.getMonth() - 5, today.getDate());
    const dateStr = pastDate.toISOString().slice(0, 10);
    const result = component.formatPracticingTime(dateStr);
    expect(result).toContain('mes');
    expect(result).not.toContain('ano');
  });

  it('openStudentProgressDetails faixa chama getStudentBeltHistory e preenche dados', () => {
    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.openStudentProgressDetails('faixa');

    expect(apiSpy.getStudentBeltHistory).toHaveBeenCalled();
    expect(component.beltHistoryData).not.toBeNull();
    expect(component.beltHistoryData!.entries.length).toBe(2);
    expect(component.beltHistoryData!.stats.totalBelts).toBe(2);
    expect(component.beltHistoryData!.judoProfile.isFederated).toBeTrue();
  });

  it('toggleBeltExpand alterna expandedBeltId corretamente', () => {
    expect(component.expandedBeltId).toBeNull();

    component.toggleBeltExpand(1);
    expect(component.expandedBeltId).toBe(1);

    component.toggleBeltExpand(1);
    expect(component.expandedBeltId).toBeNull();

    component.toggleBeltExpand(2);
    expect(component.expandedBeltId).toBe(2);

    component.toggleBeltExpand(1);
    expect(component.expandedBeltId).toBe(1);
  });

  it('closeStudentProgressDetails reseta expandedBeltId e beltHistoryErrorMessage', () => {
    component.expandedBeltId = 5;
    component.beltHistoryErrorMessage = 'Algum erro';

    component.closeStudentProgressDetails();

    expect(component.expandedBeltId).toBeNull();
    expect(component.beltHistoryErrorMessage).toBe('');
  });

  it('loadBeltHistory salva dados em localStorage e define cacheTimestamp', () => {
    component.currentUser = {
      id: 'student-1',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.loadBeltHistory();

    expect(component.beltHistoryCacheTimestamp).not.toBeNull();
    const raw = localStorage.getItem('belt-history:student-1');
    expect(raw).not.toBeNull();
    const cached = JSON.parse(raw!);
    expect(cached.data.entries.length).toBe(2);
  });

  it('loadBeltHistory exibe mensagem de erro quando API falha e sem cache', () => {
    const { throwError } = require('rxjs');
    apiSpy.getStudentBeltHistory.and.returnValue(throwError(() => new Error('network')));

    component.currentUser = {
      id: 'student-no-cache',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.loadBeltHistory();

    expect(component.beltHistoryErrorMessage).toBe('Erro ao carregar histórico de faixas');
  });

  it('loadBeltHistory usa cache do localStorage quando API falha', () => {
    const { throwError } = require('rxjs');
    apiSpy.getStudentBeltHistory.and.returnValue(throwError(() => new Error('network')));

    const cachedData = {
      data: {
        entries: [{ beltHistoryId: 99, belt: 'azul', receivedDate: '2024-01-01', durationDays: 10, isCurrentBelt: true }],
        stats: { totalBelts: 1, longestBeltName: 'azul', longestBeltDays: 10 },
        judoProfile: { isFederated: false },
      },
      timestamp: '2026-03-01T00:00:00.000Z',
    };
    localStorage.setItem('belt-history:student-cache', JSON.stringify(cachedData));

    component.currentUser = {
      id: 'student-cache',
      email: 'aluno@test.com',
      fullName: 'Aluna',
      role: 'Aluno',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any;

    component.loadBeltHistory();

    expect(component.beltHistoryData!.entries[0].belt).toBe('azul');
    expect(component.beltHistoryErrorMessage).toBe('');
  });
});