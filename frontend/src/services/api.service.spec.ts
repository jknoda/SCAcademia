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

  it('envia GET para dashboard admin com Authorization quando token existe', () => {
    localStorage.setItem('accessToken', 'token-dashboard');

    service.getAdminDashboard().subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/admin/dashboard');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-dashboard');
    req.flush({});
  });

  it('envia GET para health monitor admin com Authorization quando token existe', () => {
    localStorage.setItem('accessToken', 'token-health');

    service.getAdminHealthMonitor().subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/admin/health-monitor');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-health');
    req.flush({
      generatedAt: new Date().toISOString(),
      uptimePercentage: 99.8,
      components: [],
      alerts: [],
      timeseries24h: {
        apiResponseMs: [],
        cpuUsage: [],
        memoryUsage: [],
        databaseConnections: [],
      },
    });
  });

  it('envia GET para historico do health monitor com janela selecionada', () => {
    localStorage.setItem('accessToken', 'token-health');

    service.getAdminHealthMonitorHistory('30d').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:3000/api/admin/health-monitor/history' && r.params.get('window') === '30d'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-health');
    req.flush({
      window: '30d',
      generatedAt: new Date().toISOString(),
      patterns: [],
      series: {
        apiResponseMs: [],
        cpuUsage: [],
        memoryUsage: [],
        databaseConnections: [],
      },
    });
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

  it('envia GET para listar usuarios admin com paginacao e filtros', () => {
    localStorage.setItem('accessToken', 'token-admin');

    service
      .listAdminUsers({ page: 2, limit: 20, role: 'Professor', status: 'active', search: 'ana' })
      .subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === 'http://localhost:3000/api/admin/users' &&
        r.params.get('page') === '2' &&
        r.params.get('limit') === '20' &&
        r.params.get('role') === 'Professor' &&
        r.params.get('status') === 'active' &&
        r.params.get('search') === 'ana'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-admin');
    req.flush({ users: [], pagination: { page: 2, limit: 20, total: 0, totalPages: 1 }, filters: {} });
  });

  it('envia POST para criar usuario gerenciado no admin', () => {
    localStorage.setItem('accessToken', 'token-admin');

    service
      .createAdminManagedUser({
        email: 'novo.user@test.com',
        fullName: 'Novo Usuario',
        role: 'Professor',
        sendInvite: true,
      })
      .subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/admin/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-admin');
    expect(req.request.body.role).toBe('Professor');
    req.flush({ message: 'ok', user: {} });
  });

  it('envia PUT para atualizar usuario gerenciado no admin', () => {
    localStorage.setItem('accessToken', 'token-admin');

    service
      .updateAdminManagedUser('user-1', { fullName: 'Nome Atualizado', isActive: false, reason: 'Seguranca' })
      .subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/admin/users/user-1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-admin');
    expect(req.request.body).toEqual({ fullName: 'Nome Atualizado', isActive: false, reason: 'Seguranca' });
    req.flush({ message: 'ok', user: {} });
  });

  it('envia DELETE para soft delete de usuario gerenciado no admin', () => {
    localStorage.setItem('accessToken', 'token-admin');

    service.deleteAdminManagedUser('user-1', { reason: 'Saiu da academia' }).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/admin/users/user-1');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-admin');
    expect(req.request.body).toEqual({ reason: 'Saiu da academia' });
    req.flush({ message: 'ok', user: {} });
  });

  it('envia GET para exportar usuarios admin em CSV', () => {
    localStorage.setItem('accessToken', 'token-admin');

    service.exportAdminUsersCsv({ status: 'blocked', search: 'joao' }).subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === 'http://localhost:3000/api/admin/users/export' &&
        r.params.get('status') === 'blocked' &&
        r.params.get('search') === 'joao'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-admin');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['ok'], { type: 'text/csv' }));
  });

  it('envia GET para listar backups administrativos', () => {
    localStorage.setItem('accessToken', 'token-admin');

    service.listAdminBackups().subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/admin/backup/jobs');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-admin');
    req.flush({ jobs: [], schedule: null, lastAutoBackup: null });
  });

  it('envia POST para disparar backup administrativo', () => {
    localStorage.setItem('accessToken', 'token-admin');

    service.triggerAdminBackup({ includeHistory: true, isEncrypted: true, encryptionPassword: 'Cripto@123' }).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/admin/backup/trigger');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-admin');
    expect(req.request.body.isEncrypted).toBeTrue();
    req.flush({ jobId: 'job-1', message: 'ok' });
  });

  it('envia GET blob para download de backup administrativo', () => {
    localStorage.setItem('accessToken', 'token-admin');

    service.downloadAdminBackup('job-1').subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/admin/backup/download/job-1');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-admin');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['ok'], { type: 'application/gzip' }));
  });

  it('envia POST para restore de backup administrativo', () => {
    localStorage.setItem('accessToken', 'token-admin');

    service.restoreAdminBackup('job-1', { adminPassword: 'SenhaForte1!' }).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/admin/backup/restore/job-1');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-admin');
    expect(req.request.body).toEqual({ adminPassword: 'SenhaForte1!' });
    req.flush({ message: 'ok' });
  });

  it('envia PUT para salvar agendamento de backup administrativo', () => {
    localStorage.setItem('accessToken', 'token-admin');

    service.upsertAdminBackupSchedule({ hour: 3, minute: 15, enabled: true, retentionDays: 45 }).subscribe();

    const req = httpMock.expectOne('http://localhost:3000/api/admin/backup/schedule');
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-admin');
    expect(req.request.body).toEqual({ hour: 3, minute: 15, enabled: true, retentionDays: 45 });
    req.flush({ academyId: 'academy-1', generatedBy: 'admin-1', frequency: 'daily', hour: 3, minute: 15, enabled: true, retentionDays: 45, nextRunAt: '2026-03-30T06:15:00.000Z', updatedAt: '2026-03-29T12:00:00.000Z' });
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
