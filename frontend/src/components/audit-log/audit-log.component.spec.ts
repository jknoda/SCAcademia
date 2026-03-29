import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuditLogComponent } from './audit-log.component';
import { ApiService } from '../../services/api.service';
import { AuditLogEntry, AuditLogsResponse } from '../../types';

describe('AuditLogComponent', () => {
  let component: AuditLogComponent;
  let fixture: ComponentFixture<AuditLogComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const response: AuditLogsResponse = {
    logs: [],
    total: 0,
    page: 1,
    totalPages: 1,
  };

  const anomalyLog: AuditLogEntry = {
    logId: 'log-1',
    actorId: 'user-1',
    actorName: 'Admin QA',
    actorRole: 'Admin',
    action: 'DATA_DELETE',
    resourceType: 'user',
    resourceId: 'user-1',
    outcome: 'DENIED',
    timestamp: '2026-01-15T10:00:00.000Z',
    ipAddress: '10.0.0.1',
    userAgent: 'Jest Agent',
    anomalyFlag: true,
    changesJson: { reason: 'Muitas tentativas de delecao.' },
  };

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['getAuditLogs', 'exportAuditLogsCsv', 'exportAuditLogsPdf']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    apiSpy.getAuditLogs.and.returnValue(of(response));
    apiSpy.exportAuditLogsCsv.and.returnValue(of(new Blob()));
    apiSpy.exportAuditLogsPdf.and.returnValue(of(new Blob()));

    await TestBed.configureTestingModule({
      declarations: [AuditLogComponent],
      imports: [CommonModule, FormsModule, ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega logs ao iniciar o componente', () => {
    expect(apiSpy.getAuditLogs).toHaveBeenCalled();
    expect(component.logs).toEqual([]);
    expect(component.loading).toBeFalse();
  });

  it('envia filtro outcome para a API ao aplicar filtros', () => {
    component.filterForm.patchValue({
      outcome: 'DENIED',
      action: 'DATA_DELETE',
    });

    component.applyFilters();

    expect(apiSpy.getAuditLogs).toHaveBeenCalledWith(
      jasmine.objectContaining({
        outcome: 'DENIED',
        action: 'DATA_DELETE',
      }),
      1,
      50
    );
  });

  it('retorna label e classe corretas para outcome', () => {
    expect(component.getOutcomeLabel('DENIED')).toBe('Denied');
    expect(component.getOutcomeClass('DENIED')).toBe('outcome-denied');
    expect(component.getOutcomeLabel('SUCCESS')).toBe('Success');
    expect(component.getOutcomeClass('SUCCESS')).toBe('outcome-success');
  });

  it('alterna detalhes do log no toggle', () => {
    component.toggleLogDetail('log-123');
    expect(component.expandedLogId).toBe('log-123');

    component.toggleLogDetail('log-123');
    expect(component.expandedLogId).toBeNull();
  });

  it('aciona exportPdf quando formato selecionado for pdf', () => {
    const pdfSpy = spyOn(component, 'exportPdf');
    component.exportFormat = 'pdf';

    component.exportSelected();

    expect(pdfSpy).toHaveBeenCalled();
  });

  it('renderiza destaque e acoes para logs anomalos', () => {
    component.logs = [anomalyLog];
    component.loading = false;
    fixture.detectChanges();

    const timelineItem = fixture.nativeElement.querySelector('.timeline-item--anomaly');
    const actionButtons = Array.from(fixture.nativeElement.querySelectorAll('.timeline-actions button')) as HTMLButtonElement[];
    const labels = actionButtons.map((btn) => btn.textContent?.trim());

    expect(timelineItem).toBeTruthy();
    expect(labels).toContain('Investigar');
    expect(labels).toContain('Bloquear Usuário?');
  });
});
