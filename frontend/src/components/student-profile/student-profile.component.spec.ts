import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { StudentProfileComponent } from './student-profile.component';
import { ApiService } from '../../services/api.service';

describe('StudentProfileComponent', () => {
  let component: StudentProfileComponent;
  let fixture: ComponentFixture<StudentProfileComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['getStudentFicha']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate'], {
      url: '/admin/alunos/student-1/ficha',
    });

    apiSpy.getStudentFicha.and.returnValue(
      of({
        student: {
          id: 'student-1',
          email: 'aluno@test.com',
          fullName: 'Aluno Teste',
          role: 'Aluno',
          academyId: 'academy-1',
          isActive: true,
          isMinor: true,
        },
        lgpd: { consentSigned: false, consentSignedAt: null },
        health: { anamnesePreenchida: false, lastUpdatedAt: null },
        responsavel: {
          guardianId: null,
          guardianName: null,
          guardianEmail: null,
          relationship: null,
          isPrimary: false,
          pendenteVinculacao: true,
        },
        turmas: [],
      }) as any
    );

    await TestBed.configureTestingModule({
      declarations: [StudentProfileComponent],
      imports: [FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'student-1' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega ficha no init', () => {
    expect(apiSpy.getStudentFicha).toHaveBeenCalledWith('student-1');
    expect(component.ficha?.student.fullName).toBe('Aluno Teste');
  });

  it('navega para a anamnese com retorno para a ficha', () => {
    component.goToHealthScreening();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/health-screening', 'student-1'], {
      queryParams: { returnTo: '/admin/alunos/student-1/ficha' },
    });
  });
});
