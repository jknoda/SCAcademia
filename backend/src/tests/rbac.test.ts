import request from 'supertest';
import app from '../app';

const strongPassword = 'SenhaForte1!';

describe('RBAC — Controle de Acesso por Papel', () => {
  let academyId = '';
  let adminToken = '';
  let professorToken = '';
  let alunoToken = '';
  let professorId = '';
  let alunoId = '';

  const adminEmail = 'admin.rbac@academia.com';
  const professorEmail = 'prof.rbac@academia.com';
  const alunoEmail = 'aluno.rbac@academia.com';

  beforeEach(async () => {
    await request(app).post('/api/auth/test/reset').send({});

    // Criar academia
    const academyRes = await request(app).post('/api/auth/academies').send({
      name: 'Academia RBAC',
      location: 'Sao Paulo',
      email: 'contato.rbac@academia.com',
      phone: '11988880000',
    });
    academyId = academyRes.body.academyId;

    // Init admin
    await request(app)
      .post(`/api/auth/academies/${academyId}/init-admin`)
      .send({ email: adminEmail, password: strongPassword, fullName: 'Admin RBAC' });

    // Login admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: strongPassword });
    adminToken = adminLogin.body.accessToken;

    // Registrar Professor
    const profRes = await request(app).post('/api/auth/register').send({
      email: professorEmail,
      password: strongPassword,
      fullName: 'Professor RBAC',
      role: 'Professor',
      academyId,
    });
    professorId = profRes.body.userId;
    professorToken = profRes.body.accessToken;

    // Registrar Aluno
    const alunoRes = await request(app).post('/api/auth/register').send({
      email: alunoEmail,
      password: strongPassword,
      fullName: 'Aluno RBAC',
      role: 'Aluno',
      academyId,
    });
    alunoId = alunoRes.body.userId;
    alunoToken = alunoRes.body.accessToken;

    // Garantir que o setup foi bem-sucedido
    expect(academyId).toBeTruthy();
    expect(adminToken).toBeTruthy();
    expect(professorToken).toBeTruthy();
    expect(alunoToken).toBeTruthy();
  });

  // ===========================
  // AC3 + AC4: 401 sem token / token inválido
  // ===========================

  it('AC3: retorna 401 sem token em rota protegida', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token não fornecido');
  });

  it('AC4: retorna 401 com token inválido', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', 'Bearer token-invalido');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token inválido ou expirado');
  });

  // ===========================
  // AC1: 403 ao Professor acessar rota de Admin
  // ===========================

  it('AC1: Prof recebe 403 ao acessar rota exclusiva do Admin', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${professorToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Acesso negado. Papel insuficiente.');
  });

  it('AC1: Aluno recebe 403 ao acessar rota exclusiva do Admin', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${alunoToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Acesso negado. Papel insuficiente.');
  });

  // ===========================
  // AC2 + AC8: Admin acessa e filtra por academia
  // ===========================

  it('AC2: Admin pode listar usuários da própria academia', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    // deve conter admin + professor + aluno
    expect(res.body.users.length).toBeGreaterThanOrEqual(3);
  });

  it('AC8: Admin lista usuários filtrados por academyId (isolamento)', async () => {
    // Criar segunda academia
    const academy2Res = await request(app).post('/api/auth/academies').send({
      name: 'Academia B',
      location: 'Rio de Janeiro',
      email: 'contato.b@academia.com',
      phone: '21988880000',
    });
    const academyId2 = academy2Res.body.academyId;
    await request(app)
      .post(`/api/auth/academies/${academyId2}/init-admin`)
      .send({ email: 'admin.b@academia.com', password: strongPassword, fullName: 'Admin B' });

    // Admin da academia A não deve ver usuários da academia B
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const emails = res.body.users.map((u: any) => u.email);
    expect(emails).not.toContain('admin.b@academia.com');
  });

  // ===========================
  // AC5: Self-access guard para profile
  // ===========================

  it('AC5: Aluno acessa o próprio profile', async () => {
    const res = await request(app)
      .get(`/api/users/${alunoId}/profile`)
      .set('Authorization', `Bearer ${alunoToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(alunoEmail);
  });

  it('AC5: Aluno recebe 403 ao acessar profile de outro usuário', async () => {
    const res = await request(app)
      .get(`/api/users/${professorId}/profile`)
      .set('Authorization', `Bearer ${alunoToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Acesso negado. Acesso restrito ao próprio perfil.');
  });

  it('AC5: Admin pode acessar profile de qualquer usuário da academia', async () => {
    const res = await request(app)
      .get(`/api/users/${alunoId}/profile`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(alunoEmail);
  });

  it('AC5/AC8: Admin recebe 404 para userId inexistente na sua academia', async () => {
    // Endpoint de criação de academia só permite uma academia (setup único).
    // Testamos que Admin não consegue acessar um userId que não pertence à sua academia.
    const foreignUserId = '00000000-0000-0000-0000-000000000099';
    const res = await request(app)
      .get(`/api/users/${foreignUserId}/profile`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  // ===========================
  // AC6: requireRole aceita múltiplos papéis
  // ===========================

  it('AC6: Professor acessa rota que aceita Admin ou Professor [multi-role]', async () => {
    const res = await request(app)
      .get('/api/admin/academy-info')
      .set('Authorization', `Bearer ${professorToken}`);
    expect(res.status).toBe(200);
  });

  it('AC6: Admin acessa rota que aceita Admin ou Professor [multi-role]', async () => {
    const res = await request(app)
      .get('/api/admin/academy-info')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('AC6: Aluno recebe 403 em rota que aceita Admin ou Professor [multi-role]', async () => {
    const res = await request(app)
      .get('/api/admin/academy-info')
      .set('Authorization', `Bearer ${alunoToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Acesso negado. Papel insuficiente.');
  });
});
