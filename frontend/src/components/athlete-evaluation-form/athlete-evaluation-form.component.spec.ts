import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { AthleteEvaluationFormComponent } from './athlete-evaluation-form.component';
import { ApiService } from '../../services/api.service';

describe('AthleteEvaluationFormComponent', () => {
  let component: AthleteEvaluationFormComponent;
  let fixture: ComponentFixture<AthleteEvaluationFormComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getAthleteProgress',
      'createAthleteAssessment',
      'updateAthleteAssessment',
    ]);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);

    apiSpy.getAthleteProgress.and.returnValue(
      of({
        athleteId: 'student-1',
        athleteName: 'Aluno Teste',
        summary: { totalAssessments: 0, lastAssessmentDate: null },
        assessments: [],
        indicatorGroups: [
          {
            code: 'competition',
            name: 'Competição',
            description: 'Indicadores competitivos',
            displayOrder: 1,
            isActive: true,
            indicators: [
              {
                code: 'competition_count',
                name: 'Número de competições por período',
                category: 'competition',
                unit: 'count',
                valueType: 'integer',
                displayFormat: 'integer',
                inputInstruction: 'Informe quantas competições o atleta disputou no período',
                allowPeriodAggregation: true,
                isActive: true,
                displayOrder: 1,
              },
              {
                code: 'competition_record',
                name: 'Saldo competitivo',
                category: 'competition',
                unit: 'ratio',
                valueType: 'structured',
                displayFormat: 'ratio',
                inputInstruction: 'Use o formato vitórias:derrotas',
                allowPeriodAggregation: false,
                isActive: true,
                displayOrder: 2,
              },
            ],
          },
        ],
      }) as any
    );

    apiSpy.createAthleteAssessment.and.returnValue(
      of({
        success: true,
        data: {
          assessmentId: 'assessment-1',
          athleteId: 'student-1',
          assessmentDate: '2026-04-18',
          metrics: [],
        },
      }) as any
    );

    await TestBed.configureTestingModule({
      declarations: [AthleteEvaluationFormComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ studentId: 'student-1' }),
              queryParamMap: convertToParamMap({ returnTo: '/professores/meus-alunos/student-1/ficha' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AthleteEvaluationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('monta controles dinâmicos a partir da configuração recebida', () => {
    expect(component.form.get('metric_competition_count')).not.toBeNull();
    expect(component.form.get('metric_competition_record')).not.toBeNull();
  });

  it('envia avaliacao preenchida para a api com payload estruturado de competição', () => {
    component.form.patchValue({
      assessmentDate: '2026-04-18',
      generalNotes: 'Boa evolução geral',
      metric_competition_count: 3,
      metric_competition_record: '10:2',
    });

    component.onSubmit();

    expect(apiSpy.createAthleteAssessment).toHaveBeenCalled();
    const payload = apiSpy.createAthleteAssessment.calls.mostRecent().args[1] as any;
    expect(payload.metrics.some((metric: any) => metric.metricCode === 'competition_count')).toBeTrue();
    expect(payload.metrics.some((metric: any) => metric.metricCode === 'competition_record' && metric.displayValue === '10:2')).toBeTrue();
    expect(component.successMessage).toContain('salva com sucesso');
  });
});
