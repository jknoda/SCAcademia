import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { AthleteProgressDashboardComponent } from './athlete-progress-dashboard.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

describe('AthleteProgressDashboardComponent', () => {
  let component: AthleteProgressDashboardComponent;
  let fixture: ComponentFixture<AthleteProgressDashboardComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['getAthleteProgress']);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl'], {
      url: '/athlete-progress/student-1/dashboard',
    });

    authSpy.getCurrentUser.and.returnValue({ id: 'prof-1', role: 'Professor' } as any);
    apiSpy.getAthleteProgress.and.returnValue(of({
      athleteId: 'student-1',
      athleteName: 'Aluno Teste',
      summary: {
        totalAssessments: 2,
        lastAssessmentDate: '2026-04-17',
        attendancePercentage: 87,
        totalAttendance: 20,
        totalSessions: 23,
        streakCurrent: 3,
        streakLongest: 5,
      },
      assessments: [
        {
          assessmentId: 'a2',
          athleteId: 'student-1',
          assessmentDate: '2026-04-17',
          notes: 'Percepção geral: evolução boa',
          metrics: [
            { metricCode: 'overall_progress', metricName: 'Progresso Geral', category: 'training', value: 4, unit: 'score' },
            { metricCode: 'competition_count', metricName: 'Número de competições por período', category: 'competition', value: 3, unit: 'count' },
            { metricCode: 'competition_record', metricName: 'Saldo competitivo', category: 'competition', value: 10, unit: 'ratio', displayValue: '10:2' },
          ],
        },
        {
          assessmentId: 'a1',
          athleteId: 'student-1',
          assessmentDate: '2026-01-10',
          notes: 'Percepção geral: início',
          metrics: [
            { metricCode: 'overall_progress', metricName: 'Progresso Geral', category: 'training', value: 2, unit: 'score' },
          ],
        },
      ],
      comparisons: {
        '30d': {
          currentPeriodLabel: 'Últimos 30 dias',
          previousPeriodLabel: '30 dias anteriores',
          hasPartialData: false,
          changes: [
            { metricCode: 'overall_progress', metricName: 'Progresso Geral', currentValue: 4, previousValue: 2, delta: 2, deltaPercent: 100, trend: 'up' },
          ],
        },
      },
      alerts: [
        { alertId: 'alert-1', type: 'low-attendance', severity: 'high', title: 'Frequência baixa', message: 'A frequência do atleta está abaixo do esperado.' },
      ],
    }) as any);

    await TestBed.configureTestingModule({
      declarations: [AthleteProgressDashboardComponent],
      imports: [CommonModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ studentId: 'student-1' }),
              queryParamMap: convertToParamMap({ returnTo: '/home' }),
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AthleteProgressDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega o painel e preenche o resumo inicial', () => {
    expect(apiSpy.getAthleteProgress).toHaveBeenCalledWith('student-1');
    expect(component.dashboard?.athleteName).toBe('Aluno Teste');
    expect(component.filteredAssessments.length).toBe(1);
  });

  it('permite alternar para o histórico completo', () => {
    component.applyPeriodFilter('all');
    expect(component.filteredAssessments.length).toBe(2);
    expect(component.chartData.length).toBe(2);
  });

  it('expõe a comparação ativa do período selecionado', () => {
    component.applyPeriodFilter('30d');
    expect(component.getActiveComparison()?.changes[0].trend).toBe('up');
  });

  it('expõe os alertas principais para o painel', () => {
    expect(component.getVisibleAlerts().length).toBe(1);
    expect(component.getVisibleAlerts()[0].severity).toBe('high');
  });

  it('renderiza o banner principal sem nomenclatura interna do epic', () => {
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Acompanhamento do atleta');
    expect(content).not.toContain('Epic 10');
  });

  it('mostra o indicador de competição por período no painel', () => {
    expect(component.getSummaryValue('competition_count')).toContain('3');
    expect(component.getMetricDisplayValue(component.getLatestAssessment()!.metrics[2] as any)).toBe('10:2');
  });

  it('desliga o loading quando a chamada falha antes de retornar observable válido', () => {
    apiSpy.getAthleteProgress.and.callFake(() => {
      throw new Error('falha síncrona');
    });

    component.loadDashboard();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toContain('Erro ao carregar o painel individual de evolução');
  });
});
