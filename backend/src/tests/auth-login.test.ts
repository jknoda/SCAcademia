import request from 'supertest';
import app from '../app';

describe('Auth login/jwt flow', () => {
  let academyId = '';
  let adminPayload: { email: string; password: string; fullName: string };

  beforeEach(async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const baseAcademy = {
      name: `Academia Login Teste ${suffix}`,
      location: 'Sao Paulo',
      email: `contato.login.${suffix}@academiateste.com`,
      phone: '11988887777',
    };
    adminPayload = {
      email: `admin.login.${suffix}@academia.com`,
      password: 'AdminForte1!',
      fullName: 'Admin Login',
    };

    await request(app).post('/api/auth/test/reset').send({});
    const academyRes = await request(app).post('/api/auth/academies').send(baseAcademy);
    academyId = academyRes.body.academyId;

    await request(app)
      .post(`/api/auth/academies/${academyId}/init-admin`)
      .send(adminPayload);
  });

  it('login valido retorna accessToken e seta refreshToken cookie', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: adminPayload.email,
      password: adminPayload.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user?.email).toBe(adminPayload.email);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(String(res.headers['set-cookie'][0])).toContain('refreshToken=');
  });

  it('login invalido retorna 401 com mensagem padrao', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: adminPayload.email,
      password: 'SenhaErrada1!',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Email ou senha incorretos');
  });

  it('nao bloqueia login apos 3 tentativas invalidas', async () => {
    const email = 'rate.limit@academia.com';

    // cria um usuario valido para que as falhas sejam apenas por senha
    await request(app).post('/api/auth/register').send({
      email,
      password: 'ProfessorForte1!',
      fullName: 'Professor Rate Limit',
      role: 'Professor',
      academyId,
    });

    for (let i = 0; i < 3; i++) {
      const fail = await request(app).post('/api/auth/login').send({
        email,
        password: 'SenhaErrada1!',
      });
      expect(fail.status).toBe(401);
    }

    const fourthAttempt = await request(app).post('/api/auth/login').send({
      email,
      password: 'SenhaErrada1!',
    });

    expect(fourthAttempt.status).toBe(401);
    expect(fourthAttempt.body.error).toBe('Email ou senha incorretos');
  });

  it('refresh valido retorna novo accessToken', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: adminPayload.email,
      password: adminPayload.password,
    });

    const cookieHeader = login.headers['set-cookie'];
    expect(cookieHeader).toBeDefined();

    const refresh = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookieHeader)
      .send({});

    expect(refresh.status).toBe(200);
    expect(refresh.body.accessToken).toBeDefined();
  });

  it('refresh sem cookie retorna 401', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});

    expect(res.status).toBe(401);
  });

  it('logout limpa cookie refreshToken', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: adminPayload.email,
      password: adminPayload.password,
    });

    const cookieHeader = login.headers['set-cookie'];

    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookieHeader)
      .send({});

    expect(logout.status).toBe(200);
    expect(logout.body.message).toBe('Logout realizado com sucesso');
    expect(logout.headers['set-cookie']).toBeDefined();
    expect(String(logout.headers['set-cookie'][0])).toContain('refreshToken=;');
  });
});
