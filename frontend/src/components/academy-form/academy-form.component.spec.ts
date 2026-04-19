import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { AcademyFormComponent } from './academy-form.component';
import { ApiService } from '../../services/api.service';

describe('AcademyFormComponent', () => {
  let component: AcademyFormComponent;
  let fixture: ComponentFixture<AcademyFormComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiService = jasmine.createSpyObj<ApiService>('ApiService', ['createAcademy']);
    apiService.createAcademy.and.returnValue(of({ academyId: '1', message: 'ok', nextStep: 'admin-registration' }));

    await TestBed.configureTestingModule({
      declarations: [AcademyFormComponent],
      imports: [ReactiveFormsModule],
      providers: [
        {
          provide: ApiService,
          useValue: apiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AcademyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve iniciar nome fantasia vazio e mantê-lo vazio ao digitar o nome da academia', () => {
    const nameControl = component.academyForm.get('name');
    const fantasyNameControl = component.academyForm.get('fantasyName');

    expect(fantasyNameControl?.value).toBe('');

    nameControl?.setValue('Academia Judo Rei');

    expect(fantasyNameControl?.value).toBe('');
  });

  it('deve exibir mensagem genérica quando ocorrer erro inesperado ao criar academia', () => {
    apiService.createAcademy.and.returnValue(
      throwError(() => ({ status: 500, error: { detail: 'db exploded' } }))
    );

    component.academyForm.patchValue({
      name: 'Academia Yamazaki',
      fantasyName: 'Yamazaki Judô',
      location: 'Clube Recreativo Orion',
      email: 'yamazakijudo@hotmail.com',
      phone: '12982574433',
      logoUrl: '',
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('Ocorreu um erro ao criar a academia. Tente novamente.');
  });
});
