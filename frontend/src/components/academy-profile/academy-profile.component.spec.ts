import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { AcademyProfileComponent } from './academy-profile.component';
import { ApiService } from '../../services/api.service';
import { AcademyProfile } from '../../types';

describe('AcademyProfileComponent', () => {
  let component: AcademyProfileComponent;
  let fixture: ComponentFixture<AcademyProfileComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;

  const mockProfile: AcademyProfile = {
    academyId: 'academy-1',
    name: 'Academia Teste',
    description: 'Descricao',
    documentId: '12.345.678/0001-90',
    contactEmail: 'contato@academia.com',
    contactPhone: '11999999999',
    addressStreet: 'Rua A',
    addressNumber: '10',
    addressComplement: 'Sala 1',
    addressNeighborhood: 'Centro',
    addressPostalCode: '01001-000',
    addressCity: 'Sao Paulo',
    addressState: 'sp',
    maxUsers: 150,
    storageLimitGb: 40,
  };

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getAdminAcademyProfile',
      'updateAdminAcademyProfile',
    ]);

    apiSpy.getAdminAcademyProfile.and.returnValue(of(mockProfile));
    apiSpy.updateAdminAcademyProfile.and.returnValue(
      of({
        message: 'ok',
        academy: { ...mockProfile, maxUsers: 200, storageLimitGb: 60 },
      })
    );

    await TestBed.configureTestingModule({
      declarations: [AcademyProfileComponent],
      imports: [ReactiveFormsModule],
      providers: [{ provide: ApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AcademyProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega perfil no ngOnInit e normaliza UF em maiusculo', () => {
    expect(apiSpy.getAdminAcademyProfile).toHaveBeenCalled();
    expect(component.form.get('name')?.value).toBe('Academia Teste');
    expect(component.form.get('addressState')?.value).toBe('SP');
    expect(component.isLoading).toBeFalse();
  });

  it('mostra erro ao falhar no carregamento do perfil', () => {
    apiSpy.getAdminAcademyProfile.and.returnValue(
      throwError(() => ({ error: { error: 'Falha API' } }))
    );

    component.loadProfile();

    expect(component.errorMessage).toBe('Falha API');
    expect(component.isLoading).toBeFalse();
  });

  it('nao salva quando formulario esta invalido', () => {
    component.form.patchValue({ name: '' });

    component.save();

    expect(apiSpy.updateAdminAcademyProfile).not.toHaveBeenCalled();
    expect(component.isSaving).toBeFalse();
  });

  it('salva com sucesso e atualiza limites de plataforma', () => {
    component.form.patchValue({
      name: 'Academia Atualizada',
      description: 'Descricao atualizada',
      documentId: '12.345.678/0001-90',
      contactEmail: 'novo@academia.com',
      contactPhone: '11999999999',
      addressStreet: 'Rua B',
      addressNumber: '22',
      addressComplement: '',
      addressNeighborhood: 'Bairro',
      addressPostalCode: '01001-000',
      addressCity: 'Sao Paulo',
      addressState: 'sp',
    });

    component.save();

    expect(apiSpy.updateAdminAcademyProfile).toHaveBeenCalled();
    expect(component.successMessage).toBe('Dados da academia atualizados');
    expect(component.form.get('maxUsers')?.value).toBe(200);
    expect(component.form.get('storageLimitGb')?.value).toBe(60);
    expect(component.isSaving).toBeFalse();
  });

  it('mapeia erros de campo do backend no save', () => {
    apiSpy.updateAdminAcademyProfile.and.returnValue(
      throwError(() => ({
        error: {
          error: 'Validacao falhou',
          details: [{ field: 'documentId', message: 'Documento duplicado' }],
        },
      }))
    );

    component.form.patchValue({
      name: 'Academia Atualizada',
      description: 'Descricao atualizada',
      documentId: '12.345.678/0001-90',
      contactEmail: 'novo@academia.com',
      contactPhone: '11999999999',
      addressStreet: 'Rua B',
      addressNumber: '22',
      addressComplement: '',
      addressNeighborhood: 'Bairro',
      addressPostalCode: '01001-000',
      addressCity: 'Sao Paulo',
      addressState: 'sp',
    });

    component.save();

    expect(component.errorMessage).toBe('Validacao falhou');
    expect(component.serverErrors['documentId']).toBe('Documento duplicado');
    expect(component.isSaving).toBeFalse();
  });
});
