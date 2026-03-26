import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { EMPTY, of, throwError } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { TrainingReviewComponent } from './training-review.component';

describe('TrainingReviewComponent', () => {
  let component: TrainingReviewComponent;
  let fixture: ComponentFixture<TrainingReviewComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getTrainingReviewSummary',
      'confirmTrainingSession',
    ]);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate'], {
      events: EMPTY,
    });

    apiSpy.getTrainingReviewSummary.and.returnValue(
      of({
        session: {
          sessionId: 'session-1',
          turmaId: 'turma-1',
          turmaName: 'Turma Teste',
          sessionDate: '2026-03-25',
          sessionTime: '19:00:00',
          durationMinutes: 90,
        },
        attendance: {
          total: 2,
          present: 1,
          absentNames: ['Aluno B'],
        },
        techniques: {
          count: 1,
          names: ['Osoto Gari'],
        },
        notes: {
          general: 'Aula boa',
        },
      }) as any
    );

    apiSpy.confirmTrainingSession.and.returnValue(
      of({
        success: true,
        message: 'ok',
        sessionId: 'session-1',
        confirmedAt: new Date().toISOString(),
        studentsNotified: true,
      }) as any
    );

    await TestBed.configureTestingModule({
      declarations: [TrainingReviewComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ sessionId: 'session-1' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainingReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega resumo da revisão ao iniciar', () => {
    expect(apiSpy.getTrainingReviewSummary).toHaveBeenCalledWith('session-1');
    expect(component.summary?.session.turmaName).toBe('Turma Teste');
  });

  it('navega para notas ao editar', () => {
    component.onBackToNotes();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/training/session', 'session-1', 'notes']);
  });

  it('desabilita confirmação sem pré-condições', () => {
    component.summary = {
      session: {
        sessionId: 'session-1',
        turmaId: 'turma-1',
        turmaName: 'Turma Teste',
        sessionDate: '2026-03-25',
        sessionTime: '19:00:00',
        durationMinutes: 90,
      },
      attendance: { total: 0, present: 0, absentNames: [] },
      techniques: { count: 1, names: ['X'] },
      notes: { general: '' },
    };

    component.onConfirm();

    expect(apiSpy.confirmTrainingSession).not.toHaveBeenCalled();
    expect(component.errorMessage).toContain('vincule alunos e técnicas');
  });

  it('confirma sessão com sucesso e navega para tela de sucesso', () => {
    component.onConfirm();

    expect(apiSpy.confirmTrainingSession).toHaveBeenCalledWith('session-1');
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/training/session', 'session-1', 'success'],
      jasmine.objectContaining({ queryParams: jasmine.objectContaining({ studentsNotified: 'true' }) })
    );
  });

  it('não congela loading em erro de carregamento', () => {
    apiSpy.getTrainingReviewSummary.and.returnValue(throwError(() => ({ status: 500 })) as any);

    const secondFixture = TestBed.createComponent(TrainingReviewComponent);
    const secondComponent = secondFixture.componentInstance;
    secondFixture.detectChanges();

    expect(secondComponent.isLoading).toBeFalse();
    expect(secondComponent.errorMessage).toContain('Não foi possível carregar o resumo');
  });

  it('exibe retry após tentativas de confirmação falharem', fakeAsync(() => {
    apiSpy.confirmTrainingSession.and.returnValue(throwError(() => ({ status: 500 })) as any);

    component.onConfirm();
    tick(3700);

    expect(component.showRetry).toBeTrue();
  }));
});
