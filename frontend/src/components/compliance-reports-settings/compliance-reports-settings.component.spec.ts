import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ComplianceReportsSettingsComponent } from './compliance-reports-settings.component';
import { ApiService } from '../../services/api.service';
import { ComplianceReportHistoryItem, GenerateComplianceReportResponse } from '../../types';

describe('ComplianceReportsSettingsComponent', () => {
  let component: ComplianceReportsSettingsComponent;
  let fixture: ComponentFixture<ComplianceReportsSettingsComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const reportResponse: GenerateComplianceReportResponse = {
    message: 'ok',
    reportId: 'report-1',
    format: 'pdf',
    periodLabel: 'Este mês',
    complianceStatus: 'COMPLIANT',
    isSigned: true,
    downloadUrl: '/api/admin/compliance-report/download/report-1',
    fileName: 'LGPD_Compliance_Academia_2026-01-01_2026-01-31_report-1.pdf',
    pdfUrl: '/api/admin/compliance-report/download/report-1',
    alerts: [],
    report: {
      generatedAt: '2026-01-31T10:00:00.000Z',
      academyId: 'academy-1',
      version: '1.0.0',
      period: {
        preset: 'current-month',
        label: 'Este mês',
        dateFrom: '2026-01-01T00:00:00.000Z',
        dateTo: '2026-01-31T23:59:59.000Z',
      },
      statistics: {
        totalStudents: 40,
        minorStudents: 10,
        adultStudents: 30,
        consentedStudents: 35,
        expiredConsentCount: 1,
      },
      consents: {
        versions: [],
        totalConsentApproved: 35,
        totalConsentPending: 5,
      },
      deletions: {
        processedRequests: 2,
        pendingRequests: 1,
        totalHardDeleted: 2,
      },
      audit: {
        last90DaysAccess: 10,
        unauthorizedAttempts: 0,
        anomalies: [],
      },
      alerts: [],
      complianceStatus: 'COMPLIANT',
      export: {
        format: 'pdf',
        fileName: 'LGPD_Compliance_Academia_2026-01-01_2026-01-31_report-1.pdf',
        contentType: 'application/pdf',
        isSigned: true,
        complianceStatus: 'COMPLIANT',
      },
      signedBy: 'Admin',
      signatureDate: '2026-01-31T10:00:00.000Z',
    },
  };

  const historyItem: ComplianceReportHistoryItem = {
    id: 'report-1',
    academyId: 'academy-1',
    generatedBy: 'admin-1',
    reportData: reportResponse.report,
    filePath: '/tmp/report.pdf',
    signedAt: '2026-01-31T10:00:00.000Z',
    signatureHash: 'abc123',
    createdAt: '2026-01-31T10:00:00.000Z',
    format: 'pdf',
    periodLabel: 'Este mês',
    complianceStatus: 'COMPLIANT',
    isSigned: true,
  };

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getComplianceReportSchedule',
      'getComplianceReportStatus',
      'listComplianceReports',
      'saveComplianceReportSchedule',
      'generateComplianceReport',
      'downloadComplianceReport',
    ]);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    apiSpy.getComplianceReportSchedule.and.returnValue(of({ schedule: null }));
    apiSpy.getComplianceReportStatus.and.returnValue(
      of({ status: 'completed', message: 'Relatório de conformidade disponível para download', latestReport: historyItem })
    );
    apiSpy.listComplianceReports.and.returnValue(of({ reports: [historyItem] }));
    apiSpy.saveComplianceReportSchedule.and.returnValue(
      of({
        message: 'ok',
        schedule: {
          academyId: 'academy-1',
          generatedBy: 'admin-1',
          frequency: 'monthly',
          dayOfMonth: 1,
          hour: 8,
          minute: 0,
          enabled: true,
          nextRunAt: '2026-02-01T11:00:00.000Z',
          updatedAt: '2026-01-31T10:00:00.000Z',
        },
      })
    );
    apiSpy.generateComplianceReport.and.returnValue(of(reportResponse));
    apiSpy.downloadComplianceReport.and.returnValue(of(new Blob()));

    await TestBed.configureTestingModule({
      declarations: [ComplianceReportsSettingsComponent],
      imports: [CommonModule, FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ComplianceReportsSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega agenda e histórico ao iniciar', () => {
    expect(apiSpy.getComplianceReportSchedule).toHaveBeenCalled();
    expect(apiSpy.getComplianceReportStatus).toHaveBeenCalled();
    expect(apiSpy.listComplianceReports).toHaveBeenCalled();
    expect(component.history.length).toBe(1);
  });

  it('abre modal e gera relatório com payload avançado', fakeAsync(() => {
    component.openGenerateModal();
    component.generationFormat = 'excel';
    component.generationPeriodPreset = 'last-3-months';
    component.generationSignDigital = false;

    component.generateReport();
    tick(300);

    expect(apiSpy.generateComplianceReport).toHaveBeenCalledWith(
      jasmine.objectContaining({
        format: 'excel',
        periodPreset: 'last-3-months',
        signDigital: false,
      })
    );

    expect(component.generationState.status).toBe('completed');
    expect(component.lastGeneratedReport?.fileName).toContain('.pdf');
  }));

  it('valida intervalo custom antes de enviar', () => {
    component.generationPeriodPreset = 'custom';
    component.generationDateFrom = '';
    component.generationDateTo = '';

    component.generateReport();

    expect(component.error).toContain('Informe dateFrom e dateTo');
    expect(apiSpy.generateComplianceReport).not.toHaveBeenCalled();
  });

  it('exibe erro amigável quando geração falha', () => {
    apiSpy.generateComplianceReport.and.returnValue(
      throwError(() => ({ error: { error: 'Falha ao gerar' } }))
    );

    component.generateReport();

    expect(component.generationState.status).toBe('error');
    expect(component.error).toBe('Falha ao gerar');
  });

  it('fornece labels corretos para formato e status', () => {
    expect(component.getFormatLabel('pdf')).toBe('PDF');
    expect(component.getFormatLabel('excel')).toBe('Excel');
    expect(component.getComplianceStatusLabel('Não-Compliant - Ação Requerida')).toContain('Não-Compliant');
  });
});
