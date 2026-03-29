import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { AdminDashboardComponent } from './admin-dashboard.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { AdminDashboardResponse, User } from '../../types';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let authSpy: jasmine.SpyObj<AuthService> & { currentUser$: BehaviorSubject<User | null> };
  let routerSpy: jasmine.SpyObj<Router>;

  const currentUser: User = {
    id: 'admin-1',
    email: 'admin@scacademia.com',
    fullName: 'Admin Dashboard',
    role: 'Admin',
    academy: {
      id: 'academy-1',
      name: 'Academia Central',
      fantasyName: 'Academia Central',
    },
  };

  const dashboardResponse: AdminDashboardResponse = {
    status: 'attention',
    statusLabel: 'ATENCAO REQUERIDA',
    title: 'Saude da Academia',
    complianceScore: 96,
    complianceExplanation: 'Score baseado em consentimentos, pendencias LGPD e sinais de auditoria.',
    lastRefreshAt: '2026-01-15T10:00:00.000Z',
    lastAuditAt: '2026-01-15T09:00:00.000Z',
    metrics: {
      usersActive: {
        total: 18,
        students: 12,
        professors: 3,
        admins: 1,
        guardians: 2,
        weeklyNewUsers: 4,
      },
      consents: {
        valid: 11,
        total: 12,
        percentage: 92,
        expired: 1,
      },
      trainingsMonth: {
        total: 24,
        dailyAverage: 1.7,
      },
      backup: {
        status: 'ok',
        statusLabel: 'Backup agendado',
        lastKnownBackupAt: '2026-01-15T02:30:00.000Z',
        nextScheduledAt: '2026-01-16T02:30:00.000Z',
        isEstimated: true,
        detail: 'Resumo operacional estimado ate a Story 5.6.',
      },
    },
    alerts: [
      {
        severity: 'high',
        category: 'audit',
        message: '3 tentativa(s) de acesso nao autorizado nas ultimas 24h',
        recommendation: 'Revisar auditoria imediatamente.',
        actionLabel: 'Auditoria completa',
        targetPath: '/admin/audit-logs',
      },
    ],
    systemStatus: {
      currentStatus: 'attention',
      currentLabel: 'ATENCAO REQUERIDA',
      uptimeLast7Days: 99.3,
      history7d: [
        {
          date: '2026-01-15',
          label: 'qua., 15/01',
          status: 'attention',
          uptimePercentage: 99.2,
        },
      ],
      logsLast24h: 32,
      failedLoginsLastHour: 1,
      unauthorizedAttemptsLast24h: 3,
    },
  };

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getAdminDashboard',
      'getAdminAlerts',
      'getAdminAlertCounts',
      'executeAdminAlertAction',
      'getAdminAlertPreferences',
      'updateAdminAlertPreferences',
      'silenceAdminAlerts',
      'listPendingDeletionRequests',
      'getComplianceReportStatus',
      'listComplianceReports',
      'listMinorsWithoutGuardian',
      'downloadComplianceReport',
      'generateComplianceReport',
      'requestStudentDeletion',
      'cancelDeletionRequest',
      'processDueDeletionRequests',
    ]);

    authSpy = Object.assign(jasmine.createSpyObj<AuthService>('AuthService', ['logout']), {
      currentUser$: new BehaviorSubject<User | null>(currentUser),
    });
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    apiSpy.getAdminDashboard.and.returnValue(of(dashboardResponse));
    apiSpy.getAdminAlerts.and.returnValue(
      of({
        items: [
          {
            id: 'alert-1',
            academyId: 'academy-1',
            severity: 'high',
            category: 'audit',
            title: 'ALERTA DE SEGURANCA',
            message: '5 tentativas de login negado para IP 203.0.113.10',
            status: 'active',
            createdAt: '2026-01-15T10:00:00.000Z',
            acknowledgedAt: null,
            resolvedAt: null,
            acknowledgedByUserId: null,
            availableActions: ['acknowledge', 'resolve', 'ignore', 'block-ip'],
          },
        ],
        total: 1,
        unreadCount: 1,
        criticalCount: 1,
        silencedUntil: null,
      })
    );
    apiSpy.getAdminAlertCounts.and.returnValue(of({ total: 1, unread: 1, critical: 1, silencedUntil: null }));
    apiSpy.getAdminAlertPreferences.and.returnValue(
      of({
        academyId: 'academy-1',
        channels: { inApp: true, push: true, email: true },
        severity: { critical: true, preventive: true, informative: true },
        digestWindowMinutes: 60,
        silencedUntil: null,
        updatedAt: '2026-01-15T10:00:00.000Z',
      })
    );
    apiSpy.updateAdminAlertPreferences.and.returnValue(
      of({
        academyId: 'academy-1',
        channels: { inApp: true, push: false, email: true },
        severity: { critical: true, preventive: true, informative: false },
        digestWindowMinutes: 30,
        silencedUntil: null,
        updatedAt: '2026-01-15T10:10:00.000Z',
      })
    );
    apiSpy.silenceAdminAlerts.and.returnValue(
      of({
        academyId: 'academy-1',
        channels: { inApp: true, push: true, email: true },
        severity: { critical: true, preventive: true, informative: true },
        digestWindowMinutes: 60,
        silencedUntil: '2026-01-15T11:00:00.000Z',
        updatedAt: '2026-01-15T10:00:00.000Z',
      })
    );
    apiSpy.executeAdminAlertAction.and.returnValue(
      of({
        message: 'ok',
        alert: {
          id: 'alert-1',
        },
      })
    );
    apiSpy.listPendingDeletionRequests.and.returnValue(of({ requests: [] }));
    apiSpy.getComplianceReportStatus.and.returnValue(
      of({ status: 'idle', message: 'Nenhum relatorio recente', latestReport: null })
    );
    apiSpy.listComplianceReports.and.returnValue(of({ reports: [] }));
    apiSpy.listMinorsWithoutGuardian.and.returnValue(
      of({ students: [], total: 0, filter: 'minors-without-guardian' })
    );
    apiSpy.downloadComplianceReport.and.returnValue(of(new Blob()));
    apiSpy.generateComplianceReport.and.returnValue(
      of({
        message: 'ok',
        reportId: 'report-1',
        format: 'pdf',
        periodLabel: 'Este mês',
        complianceStatus: 'COMPLIANT',
        isSigned: true,
        downloadUrl: '/api/admin/compliance-report/download/report-1',
        fileName: 'LGPD_Compliance_academy-1_2026-01-01_2026-01-31_report-1.pdf',
        report: {
          generatedAt: '2026-01-15T10:00:00.000Z',
          academyId: 'academy-1',
          version: '1.0.0',
          period: {
            preset: 'current-month',
            label: 'Este mês',
            dateFrom: '2026-01-01T00:00:00.000Z',
            dateTo: '2026-01-31T23:59:59.000Z',
          },
          statistics: {
            totalStudents: 12,
            minorStudents: 2,
            adultStudents: 10,
            consentedStudents: 11,
            expiredConsentCount: 1,
          },
          consents: {
            versions: [],
            totalConsentApproved: 11,
            totalConsentPending: 1,
          },
          deletions: {
            processedRequests: 0,
            pendingRequests: 0,
            totalHardDeleted: 0,
          },
          audit: {
            last90DaysAccess: 32,
            unauthorizedAttempts: 3,
            anomalies: [],
          },
          alerts: [],
          complianceStatus: 'COMPLIANT',
          export: {
            format: 'pdf',
            fileName: 'LGPD_Compliance_academy-1_2026-01-01_2026-01-31_report-1.pdf',
            contentType: 'application/pdf',
            isSigned: true,
            complianceStatus: 'COMPLIANT',
          },
        },
        pdfUrl: '',
        alerts: [],
      })
    );
    apiSpy.requestStudentDeletion.and.returnValue(
      of({
        message: 'ok',
        request: {
          deletionRequestId: 'deletion-1',
          academyId: 'academy-1',
          studentId: 'student-1',
          requestedById: 'admin-1',
          status: 'pending',
          reason: null,
          requestedAt: '2026-01-15T10:00:00.000Z',
          deletionScheduledAt: '2026-02-14T10:00:00.000Z',
        },
      })
    );
    apiSpy.cancelDeletionRequest.and.returnValue(of({ message: 'ok' }));
    apiSpy.processDueDeletionRequests.and.returnValue(of({ message: 'ok', processedCount: 0 }));

    await TestBed.configureTestingModule({
      declarations: [AdminDashboardComponent],
      imports: [CommonModule, FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('carrega o dashboard agregado e os paines auxiliares ao iniciar com admin autenticado', () => {
    expect(apiSpy.getAdminDashboard).toHaveBeenCalled();
    expect(apiSpy.listPendingDeletionRequests).toHaveBeenCalled();
    expect(apiSpy.getAdminAlertCounts).toHaveBeenCalled();
    expect(apiSpy.getAdminAlerts).toHaveBeenCalled();
    expect(apiSpy.getAdminAlertPreferences).toHaveBeenCalled();
    expect(apiSpy.getComplianceReportStatus).toHaveBeenCalled();
    expect(apiSpy.listComplianceReports).toHaveBeenCalled();
    expect(apiSpy.listMinorsWithoutGuardian).toHaveBeenCalled();
    expect(component.adminDashboard?.title).toBe('Saude da Academia');
    expect(component.dashboardLoading).toBeFalse();
  });

  it('redireciona alertas com filtro para a lista de alunos', () => {
    component.handleAlertAction({
      severity: 'medium',
      category: 'users',
      message: '2 menores sem responsavel',
      recommendation: 'Vincular responsavel.',
      actionLabel: 'Ver alunos',
      targetPath: '/admin/alunos',
      targetFilter: 'minors-without-guardian',
    });

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/alunos'], {
      queryParams: { filter: 'minors-without-guardian' },
    });
  });

  it('descarta o onboarding e persiste a decisao no localStorage', () => {
    component.dismissOnboarding();

    expect(component.onboardingVisible).toBeFalse();
    expect(localStorage.getItem('admin-dashboard-tour-dismissed:v1')).toBe('dismissed');
  });

  it('executa refresh completo recarregando dashboard e secoes operacionais', () => {
    apiSpy.getAdminDashboard.calls.reset();
    apiSpy.getAdminAlertCounts.calls.reset();
    apiSpy.getAdminAlerts.calls.reset();
    apiSpy.getAdminAlertPreferences.calls.reset();
    apiSpy.listPendingDeletionRequests.calls.reset();
    apiSpy.getComplianceReportStatus.calls.reset();
    apiSpy.listComplianceReports.calls.reset();
    apiSpy.listMinorsWithoutGuardian.calls.reset();

    component.refreshDashboard();

    expect(apiSpy.getAdminDashboard).toHaveBeenCalledTimes(1);
    expect(apiSpy.getAdminAlertCounts).toHaveBeenCalledTimes(1);
    expect(apiSpy.getAdminAlerts).toHaveBeenCalledTimes(1);
    expect(apiSpy.getAdminAlertPreferences).toHaveBeenCalledTimes(1);
    expect(apiSpy.listPendingDeletionRequests).toHaveBeenCalledTimes(1);
    expect(apiSpy.getComplianceReportStatus).toHaveBeenCalledTimes(1);
    expect(apiSpy.listComplianceReports).toHaveBeenCalledTimes(1);
    expect(apiSpy.listMinorsWithoutGuardian).toHaveBeenCalledTimes(1);
  });

  it('abre modal critico quando ha alerta high ativo no feed', () => {
    component.loadAlertFeed();

    expect(component.showCriticalModal).toBeTrue();
    expect(component.criticalModalAlert?.title).toBe('ALERTA DE SEGURANCA');
  });

  it('silencia alertas por 1 hora e salva preferencias de notificacao', () => {
    component.loadAlertPreferences();
    component.alertPreferences!.channels.push = false;
    component.alertPreferences!.severity.informative = false;
    component.alertPreferences!.digestWindowMinutes = 30;

    component.saveAlertPreferences();
    component.silenceAlertsForOneHour();

    expect(apiSpy.updateAdminAlertPreferences).toHaveBeenCalled();
    expect(apiSpy.silenceAdminAlerts).toHaveBeenCalledWith(60);
    expect(component.alertPreferencesMessage).toContain('silenciados por 1 hora');
  });
});