import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AdminProfileComponent } from './admin-profile.component';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../types';

describe('AdminProfileComponent', () => {
  let component: AdminProfileComponent;
  let fixture: ComponentFixture<AdminProfileComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const currentUser: User = {
    id: 'user-1',
    email: 'admin@scacademia.com',
    fullName: 'Admin Teste',
    role: 'Admin',
    academy: {
      id: 'academy-1',
      name: 'Academia Teste',
    },
  };

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getUserProfile',
      'updateUserProfile',
      'changePassword',
    ]);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'getCurrentUser',
      'updateCurrentUserProfile',
    ]);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    authSpy.getCurrentUser.and.returnValue(currentUser);
    apiSpy.getUserProfile.and.returnValue(
      of({
        ...currentUser,
        documentId: '123.456.789-00',
        addressState: 'sp',
      })
    );
    apiSpy.updateUserProfile.and.returnValue(
      of({
        message: 'ok',
        user: {
          ...currentUser,
          fullName: 'Admin Atualizado',
        },
      })
    );
    apiSpy.changePassword.and.returnValue(of({ message: 'ok' }));

    await TestBed.configureTestingModule({
      declarations: [AdminProfileComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carrega perfil no init quando usuario admin autenticado', () => {
    expect(authSpy.getCurrentUser).toHaveBeenCalled();
    expect(apiSpy.getUserProfile).toHaveBeenCalledWith('user-1');
    expect(component.profileForm.get('fullName')?.value).toBe('Admin Teste');
    expect(component.profileForm.get('addressState')?.value).toBe('SP');
  });

  it('redireciona para login quando usuario nao esta autenticado', () => {
    authSpy.getCurrentUser.and.returnValue(null);

    component.ngOnInit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    expect(apiSpy.getUserProfile).toHaveBeenCalledTimes(1);
  });

  it('salva perfil valido e atualiza usuario em memoria', () => {
    component.profileForm.patchValue({
      fullName: 'Admin Atualizado',
      documentId: '123.456.789-00',
      birthDate: '1990-05-20',
      phone: '11999999999',
      addressStreet: 'Rua A',
      addressNumber: '10',
      addressComplement: '',
      addressNeighborhood: 'Centro',
      addressPostalCode: '01001-000',
      addressCity: 'Sao Paulo',
      addressState: 'sp',
    });

    component.saveProfile();

    expect(apiSpy.updateUserProfile).toHaveBeenCalled();
    expect(authSpy.updateCurrentUserProfile).toHaveBeenCalledWith({
      fullName: 'Admin Atualizado',
      photoUrl: undefined,
    });
    expect(component.successMessage).toBe('Perfil atualizado');
    expect(component.isSaving).toBeFalse();
  });

  it('nao salva com formulario invalido', () => {
    component.profileForm.patchValue({ fullName: '' });

    component.saveProfile();

    expect(apiSpy.updateUserProfile).not.toHaveBeenCalled();
  });

  it('troca senha com sucesso quando confirmacao confere', () => {
    component.passwordForm.patchValue({
      currentPassword: 'SenhaAtual@1',
      newPassword: 'NovaSenha@2',
      confirmPassword: 'NovaSenha@2',
    });

    component.changePassword();

    expect(apiSpy.changePassword).toHaveBeenCalled();
    expect(component.passwordSuccessMessage).toBe('Senha alterada com sucesso');
    expect(component.passwordForm.get('currentPassword')?.value).toBeNull();
    expect(component.isChangingPassword).toBeFalse();
  });

  it('nao envia troca de senha quando confirmacao diverge', () => {
    component.passwordForm.patchValue({
      currentPassword: 'SenhaAtual@1',
      newPassword: 'NovaSenha@2',
      confirmPassword: 'OutraSenha@2',
    });

    component.changePassword();

    expect(apiSpy.changePassword).not.toHaveBeenCalled();
    expect(component.passwordErrorMessage).toBe('Confirmação de senha deve ser igual à nova senha');
  });

  it('exibe mensagem de erro no loadProfile quando API falha', () => {
    apiSpy.getUserProfile.and.returnValue(
      throwError(() => ({
        error: { error: 'Falha ao carregar' },
      }))
    );

    component.loadProfile();

    expect(component.errorMessage).toBe('Falha ao carregar');
    expect(component.isLoading).toBeFalse();
  });

  it('nao renderiza trocar senha enquanto perfil principal esta carregando', () => {
    component.isLoading = true;

    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Carregando perfil...');
    expect(content).not.toContain('Trocar Senha');
  });

  it('abre o caminho da evolução conforme o perfil autenticado', () => {
    component.openEpic10();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/alunos'], {
      queryParams: { highlight: 'athlete-progress' },
    });

    routerSpy.navigate.calls.reset();
    component.currentUser = { ...currentUser, role: 'Professor' } as User;
    component.openEpic10();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/professores/meus-alunos'], {
      queryParams: { highlight: 'athlete-progress' },
    });

    routerSpy.navigate.calls.reset();
    component.currentUser = { ...currentUser, id: 'student-1', role: 'Aluno' } as User;
    component.openEpic10();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/athlete-progress', 'student-1', 'dashboard'], {
      queryParams: { returnTo: '/aluno/meu-perfil' },
    });
  });

  it('exibe o acesso à evolução sem mostrar o nome interno do epic', () => {
    const content = fixture.nativeElement.textContent as string;

    expect(content).toContain('Evolução do atleta');
    expect(content).not.toContain('Epic 10');
  });
});
