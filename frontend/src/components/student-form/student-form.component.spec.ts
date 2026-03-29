import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { StudentFormComponent } from './student-form.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

describe('StudentFormComponent', () => {
  let component: StudentFormComponent;
  let fixture: ComponentFixture<StudentFormComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['createStudent', 'updateStudent', 'getStudentById']);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUser']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    authSpy.getCurrentUser.and.returnValue({
      id: 'admin-1',
      email: 'admin@test.com',
      fullName: 'Admin',
      role: 'Admin',
      academy: { id: 'academy-1', name: 'Academia' },
    } as any);

    apiSpy.createStudent.and.returnValue(
      of({
        message: 'Aluno cadastrado com sucesso',
        warning: 'Aluno menor de idade - sera necessario vincular responsavel na Story 9.5',
        temporaryPassword: 'Gerada@123',
        student: {
          id: 'student-1',
          email: 'novo.aluno@test.com',
          fullName: 'Novo Aluno',
          role: 'Aluno',
          academyId: 'academy-1',
          isMinor: true,
        },
      })
    );

    await TestBed.configureTestingModule({
      declarations: [StudentFormComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('cria aluno e abre modal da senha temporaria', () => {
    component.form.patchValue({
      email: 'novo.aluno@test.com',
      password: 'SenhaNova1!',
      fullName: 'Novo Aluno',
      birthDate: '2010-01-10',
    });

    component.save();

    expect(apiSpy.createStudent).toHaveBeenCalled();
    expect(component.successMessage).toContain('cadastrado com sucesso');
    expect(component.generatedPasswordModalOpen).toBeTrue();
    expect(component.generatedPassword).toBe('Gerada@123');
  });

  it('recalcula menoridade ao mudar birthDate', () => {
    component.form.get('birthDate')?.setValue('2012-01-01');
    expect(component.calculatedAge).not.toBeNull();
    expect(component.isMinorCalculated).toBeTrue();
  });
});
