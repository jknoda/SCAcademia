import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { TrainingAttendanceComponent } from './training-attendance.component';

describe('TrainingAttendanceComponent', () => {
  let component: TrainingAttendanceComponent;
  let fixture: ComponentFixture<TrainingAttendanceComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['getTrainingAttendance', 'saveTrainingAttendance']);
    apiSpy.getTrainingAttendance.and.returnValue(
      of({
        sessionId: 'session-1',
        turmaId: 'turma-1',
        turmaName: 'Turma Teste',
        totals: { total: 1, present: 0 },
        students: [
          {
            studentId: 'student-1',
            studentName: 'Aluno Teste',
            status: null,
            hasHealthScreening: false,
          },
        ],
      }) as any
    );
    apiSpy.saveTrainingAttendance.and.returnValue(
      of({
        message: 'Frequência atualizada com sucesso',
        sessionId: 'session-1',
        studentId: 'student-1',
        status: 'present',
        warning: 'Aluno sem anamnese preenchida. Recomendamos preencher antes de registrar treino.',
        totals: { total: 1, present: 1 },
      }) as any
    );

    await TestBed.configureTestingModule({
      declarations: [TrainingAttendanceComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: Location, useValue: jasmine.createSpyObj('Location', ['back']) },
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

    fixture = TestBed.createComponent(TrainingAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('mostra aviso não bloqueante ao marcar presença de aluno sem anamnese', () => {
    const student = component.students[0];

    component.onSelectStatus(student, 'present');

    expect(apiSpy.saveTrainingAttendance).toHaveBeenCalled();
    expect(component.infoMessage).toContain('sem anamnese preenchida');
  });
});