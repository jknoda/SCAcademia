import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { AdminHealthMonitorComponent } from './admin-health-monitor.component';

describe('AdminHealthMonitorComponent', () => {
  let component: AdminHealthMonitorComponent;
  let fixture: ComponentFixture<AdminHealthMonitorComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getAdminHealthMonitor',
      'getAdminHealthMonitorHistory',
    ]);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    apiSpy.getAdminHealthMonitor.and.returnValue(
      of({
        generatedAt: '2026-03-29T12:00:00.000Z',
        uptimePercentage: 99.8,
        components: [
          {
            id: 'storage',
            label: 'Storage',
            status: 'warning',
            statusLabel: 'ATENCAO',
            details: 'Backup em atraso',
            metrics: {
              primaryLabel: 'Used',
              primaryValue: '256MB / 1TB',
            },
          },
        ],
        alerts: [
          {
            component: 'storage',
            severity: 'medium',
            title: 'Storage em atencao',
            message: 'Backup em atraso',
            recommendation: 'Executar backup manual',
            targetPath: '/admin/backup',
          },
        ],
        timeseries24h: {
          apiResponseMs: new Array(24).fill(null).map((_, index) => ({ timestamp: String(index), value: 45 })),
          cpuUsage: new Array(24).fill(null).map((_, index) => ({ timestamp: String(index), value: 50 })),
          memoryUsage: new Array(24).fill(null).map((_, index) => ({ timestamp: String(index), value: 60 })),
          databaseConnections: new Array(24).fill(null).map((_, index) => ({ timestamp: String(index), value: 12 })),
        },
      }) as any
    );

    apiSpy.getAdminHealthMonitorHistory.and.returnValue(
      of({
        window: '24h',
        generatedAt: '2026-03-29T12:00:00.000Z',
        patterns: ['Sem padroes criticos'],
        series: {
          apiResponseMs: new Array(24).fill(null).map((_, index) => ({ timestamp: String(index), value: 45 })),
          cpuUsage: new Array(24).fill(null).map((_, index) => ({ timestamp: String(index), value: 50 })),
          memoryUsage: new Array(24).fill(null).map((_, index) => ({ timestamp: String(index), value: 60 })),
          databaseConnections: new Array(24).fill(null).map((_, index) => ({ timestamp: String(index), value: 12 })),
        },
      }) as any
    );

    await TestBed.configureTestingModule({
      declarations: [AdminHealthMonitorComponent],
      imports: [CommonModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminHealthMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega snapshot e historico no init', () => {
    expect(apiSpy.getAdminHealthMonitor).toHaveBeenCalled();
    expect(apiSpy.getAdminHealthMonitorHistory).toHaveBeenCalledWith('24h');
    expect(component.components.length).toBe(1);
  });

  it('permite trocar janela para 30d e recarrega historico', () => {
    component.selectWindow('30d');
    expect(component.selectedWindow).toBe('30d');
    expect(apiSpy.getAdminHealthMonitorHistory).toHaveBeenCalledWith('30d');
  });

  it('sinaliza CTA de backup quando storage esta em atencao', () => {
    expect(component.hasBackupAttention()).toBeTrue();
  });

  it('entra em estado de refresh durante recarga silenciosa', () => {
    const snapshotSubject = new Subject<any>();
    apiSpy.getAdminHealthMonitor.and.returnValue(snapshotSubject.asObservable());

    component.refresh();

    expect(component.isRefreshing).toBeTrue();
    snapshotSubject.next({
      generatedAt: '2026-03-29T12:00:00.000Z',
      uptimePercentage: 99.8,
      components: [],
      alerts: [],
      timeseries24h: {
        apiResponseMs: [],
        cpuUsage: [],
        memoryUsage: [],
        databaseConnections: [],
      },
    });
    snapshotSubject.complete();
  });
});
