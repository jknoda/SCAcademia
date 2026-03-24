import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ApiService } from './api.service';
import { AdminProfileUpdatePayload, UpdateAcademyProfilePayload } from '../types';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('envia GET para academy-profile com Authorization quando token existe', () => {
    localStorage.setItem('accessToken', 'token-123');

    service.getAdminAcademyProfile().subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/admin/academy-profile');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    req.flush({});
  });

  it('envia PUT para academy-profile com payload e header de auth', () => {
    localStorage.setItem('accessToken', 'token-456');

    const payload: UpdateAcademyProfilePayload = {
      name: 'Academia X',
      description: 'Descricao',
      documentId: '12.345.678/0001-90',
      contactEmail: 'contato@academia.com',
      contactPhone: '11999999999',
      addressStreet: 'Rua A',
      addressNumber: '1',
      addressComplement: '',
      addressNeighborhood: 'Centro',
      addressPostalCode: '01001-000',
      addressCity: 'Sao Paulo',
      addressState: 'SP',
    };

    service.updateAdminAcademyProfile(payload).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/admin/academy-profile');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-456');
    req.flush({ message: 'ok', academy: {} });
  });

  it('envia GET para perfil do usuario autenticado', () => {
    localStorage.setItem('accessToken', 'token-user');

    service.getUserProfile('user-1').subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/users/user-1/profile');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-user');
    req.flush({});
  });

  it('envia PUT para atualizar perfil do usuario', () => {
    localStorage.setItem('accessToken', 'token-user');

    const payload: AdminProfileUpdatePayload = {
      fullName: 'Admin Atualizado',
      documentId: '123.456.789-00',
      birthDate: '1990-05-20',
      phone: '11999999999',
      addressStreet: 'Rua A',
      addressNumber: '100',
      addressComplement: '',
      addressNeighborhood: 'Centro',
      addressPostalCode: '01001-000',
      addressCity: 'Sao Paulo',
      addressState: 'SP',
    };

    service.updateUserProfile('user-1', payload).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/users/user-1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-user');
    req.flush({ message: 'ok', user: {} });
  });

  it('envia PUT para alterar senha do usuario autenticado', () => {
    localStorage.setItem('accessToken', 'token-user');

    service
      .changePassword({
        currentPassword: 'SenhaAtual@1',
        newPassword: 'NovaSenha@2',
        confirmPassword: 'NovaSenha@2',
      })
      .subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/auth/change-password');
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-user');
    req.flush({ message: 'ok' });
  });

  it('envia GET para listar professores com filtros', () => {
    localStorage.setItem('accessToken', 'token-admin');

    service.listProfessors({ name: 'ana', status: 'active' }).subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === 'http://localhost:3000/api/users/professores' &&
        r.params.get('name') === 'ana' &&
        r.params.get('status') === 'active'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-admin');
    req.flush({ professors: [], filters: { name: 'ana', status: 'active' }, total: 0 });
  });

  it('envia POST para cadastrar professor', () => {
    localStorage.setItem('accessToken', 'token-admin');

    service
      .createProfessor({
        email: 'novo.prof@test.com',
        password: 'ProfSenha1!',
        fullName: 'Novo Professor',
      })
      .subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/users/professores');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-admin');
    expect(req.request.body.fullName).toBe('Novo Professor');
    req.flush({ message: 'ok', professor: {} });
  });

  it('envia PUT para atualizar status de professor', () => {
    localStorage.setItem('accessToken', 'token-admin');

    service.updateProfessorStatus('prof-1', { isActive: false }).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/users/professores/prof-1/status');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ isActive: false });
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-admin');
    req.flush({ message: 'ok', professor: {} });
  });

  it('envia PUT para redefinir senha do professor', () => {
    localStorage.setItem('accessToken', 'token-admin');

    service
      .resetProfessorPassword('prof-1', {
        newPassword: 'NovaSenha1@',
        confirmPassword: 'NovaSenha1@',
      })
      .subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/users/professores/prof-1/reset-password');
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-admin');
    req.flush({ message: 'ok' });
  });
});
