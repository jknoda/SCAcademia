import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { ProfessorFormComponent } from './professor-form.component';
import { ApiService } from '../../services/api.service';

describe('ProfessorFormComponent', () => {
  let component: ProfessorFormComponent;
  let fixture: ComponentFixture<ProfessorFormComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getProfessorById',
      'createProfessor',
      'updateProfessor',
      'resetProfessorPassword',
    ]);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    apiSpy.createProfessor.and.returnValue(
      of({
        message: 'Professor cadastrado com sucesso',
        temporaryPassword: 'Gerada@123',
        professor: {
          id: 'prof-1',
          email: 'novo@test.com',
          fullName: 'Novo Professor',
          role: 'Professor',
          academyId: 'academy-1',
        },
      })
    );

    await TestBed.configureTestingModule({
      declarations: [ProfessorFormComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('cria professor em modo cadastro e abre modal de senha temporaria', () => {
    component.form.patchValue({
      email: 'novo@test.com',
      password: 'SenhaNova1!',
      fullName: 'Novo Professor',
      documentId: '123.456.789-00',
      addressState: 'sp',
    });

    component.save();

    expect(apiSpy.createProfessor).toHaveBeenCalled();
    expect(component.successMessage).toContain('cadastrado com sucesso');
    expect(component.generatedPasswordModalOpen).toBeTrue();
    expect(component.generatedPassword).toBe('Gerada@123');
  });

  it('gera senha forte para o cadastro', () => {
    component.generateStrongPassword('password');

    const generated = component.form.get('password')?.value as string;
    expect(generated.length).toBe(12);
    expect(/[A-Z]/.test(generated)).toBeTrue();
    expect(/[0-9]/.test(generated)).toBeTrue();
    expect(/[^A-Za-z0-9]/.test(generated)).toBeTrue();
  });

  it('marca erro de CPF invalido no campo documentId', () => {
    component.form.get('documentId')?.setValue('123');
    component.form.get('documentId')?.markAsTouched();

    expect(component.getFieldError('documentId')).toBe('CPF invalido');
  });
});
