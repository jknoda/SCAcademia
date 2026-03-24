import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { StudentsListComponent } from './students-list.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

describe('StudentsListComponent', () => {
  let component: StudentsListComponent;
  let fixture: ComponentFixture<StudentsListComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let queryParamMap$: BehaviorSubject<any>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['listStudents', 'listMyStudents', 'updateStudentStatus', 'listStudentsWithoutHealthScreening']);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate'], { url: '/admin/alunos' });
    queryParamMap$ = new BehaviorSubject(convertToParamMap({}));

    authSpy.getCurrentUser.and.returnValue({
      id: 'admin-1',
      email: 'admin@test.com',
      fullName: 'Admin',
      role: 'Admin',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any);

    apiSpy.listStudents.and.returnValue(
      of({
        students: [
          {
            id: 'student-1',
            email: 'aluno@test.com',
            fullName: 'Aluno Teste',
            role: 'Aluno',
            academyId: 'academy-1',
            isActive: true,
            isMinor: false,
            idade: 20,
          },
        ],
        filters: { status: 'all' },
        total: 1,
      })
    );

    apiSpy.listStudentsWithoutHealthScreening.and.returnValue(
      of({
        students: [
          {
            studentId: 'student-2',
            fullName: 'Aluno Sem Anamnese',
            birthDate: null,
            idade: 17,
            faixa: null,
            isMinor: true,
            isActive: true,
            operationalStatus: {
              isReady: false,
              hasHealthScreening: false,
              hasGuardian: false,
              missingItems: ['anamnese', 'responsavel'],
            },
          },
        ],
        total: 1,
        filter: 'students-without-health-screening',
      }) as any
    );

    await TestBed.configureTestingModule({
      declarations: [StudentsListComponent],
      imports: [FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamMap$.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega lista de alunos no init', () => {
    expect(apiSpy.listStudents).toHaveBeenCalled();
    expect(component.students.length).toBe(1);
    expect(component.students[0].fullName).toBe('Aluno Teste');
  });

  it('navega para novo aluno no contexto admin', () => {
    component.goToNewStudent();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/alunos/novo']);
  });

  it('carrega filtro especial de alunos sem anamnese', () => {
    queryParamMap$.next(convertToParamMap({ filter: 'students-without-health-screening' }));

    expect(apiSpy.listStudentsWithoutHealthScreening).toHaveBeenCalled();
    expect(component.specialFilterTotal).toBe(1);
    expect(component.students[0].operationalStatus?.hasHealthScreening).toBe(false);
  });
});
