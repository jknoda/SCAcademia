import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { TrainingNotesComponent } from './training-notes.component';

describe('TrainingNotesComponent', () => {
  let component: TrainingNotesComponent;
  let fixture: ComponentFixture<TrainingNotesComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getSessionNotes',
      'saveSessionNotes',
      'saveStudentNote',
    ]);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    apiSpy.getSessionNotes.and.returnValue(
      of({
        generalNotes: 'Nota inicial',
        presentStudents: [
          {
            userId: 'student-1',
            fullName: 'Ana Silva',
            avatarInitials: 'AS',
          },
        ],
        studentNotes: [
          {
            studentId: 'student-1',
            content: 'Evolução boa',
            updatedAt: new Date().toISOString(),
          },
        ],
      }) as any
    );

    apiSpy.saveSessionNotes.and.returnValue(of({ success: true }) as any);
    apiSpy.saveStudentNote.and.returnValue(of({ success: true }) as any);

    await TestBed.configureTestingModule({
      declarations: [TrainingNotesComponent],
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

    fixture = TestBed.createComponent(TrainingNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega notas existentes ao iniciar', () => {
    expect(apiSpy.getSessionNotes).toHaveBeenCalledWith('session-1');
    expect(component.generalNotes).toBe('Nota inicial');
    expect(component.studentNoteMap['student-1']).toBe('Evolução boa');
  });

  it('atualiza contador de caracteres ao digitar', () => {
    const textarea = document.createElement('textarea');
    component.onGeneralNotesInput('abc', textarea);

    expect(component.charCount).toBe(3);
    expect(component.generalNotes).toBe('abc');
  });

  it('alterna contador entre caracteres e palavras', () => {
    expect(component.counterMode).toBe('chars');

    component.toggleCounterMode();
    expect(component.counterMode).toBe('words');

    component.toggleCounterMode();
    expect(component.counterMode).toBe('chars');
  });

  it('faz auto-save após debounce de 5s', fakeAsync(() => {
    const textarea = document.createElement('textarea');

    component.onGeneralNotesInput('Nota auto-save', textarea);
    tick(4999);
    expect(apiSpy.saveSessionNotes).not.toHaveBeenCalled();

    tick(1);
    expect(apiSpy.saveSessionNotes).toHaveBeenCalledWith('session-1', 'Nota auto-save');
  }));

  it('permite navegar para revisão sem nota preenchida', () => {
    component.generalNotes = '';
    component.onNextToReview();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/training/session', 'session-1', 'review']);
  });

  it('não congela loading quando falha ao carregar', () => {
    apiSpy.getSessionNotes.and.returnValue(throwError(() => ({ status: 500 })) as any);

    const secondFixture = TestBed.createComponent(TrainingNotesComponent);
    const secondComponent = secondFixture.componentInstance;
    secondFixture.detectChanges();

    expect(secondComponent.isLoading).toBeFalse();
    expect(secondComponent.errorMessage).toContain('Não foi possível carregar as anotações');
  });
});
