import request from 'supertest';
import app from '../app';

const baseAcademy = {
  name: 'Academia Teste',
  location: 'Sao Paulo',
  email: 'contato@academiateste.com',
  phone: '11999999999',
};

const strongPassword = 'SenhaForte1!';

describe('POST /api/auth/register', () => {
  let academyId = '';

  beforeEach(async () => {
    await request(app).post('/api/auth/test/reset').send({});
    const academyRes = await request(app).post('/api/auth/academies').send(baseAcademy);
    academyId = academyRes.body.academyId;
  });

  afterAll(async () => {
    await request(app).post('/api/auth/test/reset').send({});
  });

  it('registra professor valido com accessToken', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'professor1@academia.com',
      password: strongPassword,
      fullName: 'Professor Um',
      role: 'Professor',
      academyId,
    });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.requiresConsent).toBe(false);
    expect(res.body.userId).toBeDefined();
    expect(res.body.user?.email).toBe('professor1@academia.com');
  });

  it('registra aluno adulto com accessToken', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'aluno.adulto@academia.com',
      password: strongPassword,
      fullName: 'Aluno Adulto',
      role: 'Aluno',
      academyId,
      birthDate: '2000-01-10',
    });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.requiresConsent).toBe(false);
    expect(res.body.userId).toBeDefined();
    expect(res.body.user?.email).toBe('aluno.adulto@academia.com');
  });

  it('aluno menor retorna requiresConsent true sem accessToken', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'aluno.menor@academia.com',
      password: strongPassword,
      fullName: 'Aluno Menor',
      role: 'Aluno',
      academyId,
      birthDate: '2012-05-20',
      responsavelEmail: 'responsavel@familia.com',
    });

    expect(res.status).toBe(201);
    expect(res.body.requiresConsent).toBe(true);
    expect(res.body.accessToken).toBeUndefined();
  });

  it('retorna 400 para senha fraca', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'senha.fraca@academia.com',
      password: 'fraca',
      fullName: 'Usuario Fraco',
      role: 'Professor',
      academyId,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('retorna 409 para email duplicado na mesma academia', async () => {
    const payload = {
      email: 'duplicado@academia.com',
      password: strongPassword,
      fullName: 'Primeiro Usuario',
      role: 'Professor',
      academyId,
    };

    const first = await request(app).post('/api/auth/register').send(payload);
    const second = await request(app).post('/api/auth/register').send({
      ...payload,
      fullName: 'Segundo Usuario',
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(second.body.suggestions).toContain('Fazer login');
  });

  it('retorna 404 quando academyId nao existe', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'sem.academia@academia.com',
      password: strongPassword,
      fullName: 'Sem Academia',
      role: 'Professor',
      academyId: '11111111-1111-1111-1111-111111111111',
    });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Academia nao encontrada|Academia não encontrada/);
  });
});
