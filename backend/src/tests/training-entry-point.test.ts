import request from 'supertest';
import app from '../app';
import { pool } from '../lib/db';

const strongPassword = 'SenhaForte1!';

type Ctx = {
  academyId: string;
  professorToken: string;
  professorId: string;
  adminToken: string;
};

const setupCtx = async (): Promise<Ctx> => {
  await request(app).post('/api/auth/test/reset').send({});

  const academyRes = await request(app).post('/api/auth/academies').send({
    name: 'Academia Treino Story 3.1',
    location: 'Sao Paulo',
    email: 'treino31@academia.com',
    phone: '11999990000',
  });
  const academyId = academyRes.body.academyId as string;

  await request(app)
    .post(`/api/auth/academies/${academyId}/init-admin`)
    .send({
      email: 'admin.treino31@academia.com',
      password: strongPassword,
      fullName: 'Admin Treino',
    });

  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin.treino31@academia.com',
    password: strongPassword,
  });
  const adminToken = adminLogin.body.accessToken as string;

  const profReg = await request(app).post('/api/auth/register').send({
    email: 'prof.treino31@academia.com',
    password: strongPassword,
    fullName: 'Professor Treino Story',
    role: 'Professor',
    academyId,
  });

  return {
    academyId,
    professorToken: profReg.body.accessToken as string,
    professorId: profReg.body.user.id as string,
    adminToken,
  };
};

const insertTurma = async (academyId: string, professorId: string, name: string): Promise<string> => {
  const res = await pool.query(
    `INSERT INTO turmas (
       academy_id, professor_id, name, description, schedule_json, capacity, is_active, created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5::jsonb, 30, true, NOW(), NOW()
     ) RETURNING turma_id`,
    [
      academyId,
      professorId,
      name,
      'Turma de entrada conversacional',
      JSON.stringify({ day: 'Terça-feira', time: '15:00-16:30', turn: 'Tarde' }),
    ]
  );

  return res.rows[0].turma_id as string;
};

describe('Story 3.1 - Entry Point Conversacional', () => {
  let ctx: Ctx;

  beforeEach(async () => {
    ctx = await setupCtx();
  });

  afterAll(async () => {
    await request(app).post('/api/auth/test/reset').send({});
  });

  it('retorna contexto com currentOrNextClass nulo quando professor não tem turma ativa', async () => {
    const res = await request(app)
      .get('/api/trainings/entry-point')
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.greeting).toMatch(/Prof\./i);
    expect(res.body.currentOrNextClass).toBeNull();
  });

  it('retorna contexto da turma para o professor logado', async () => {
    const turmaId = await insertTurma(ctx.academyId, ctx.professorId, 'Judô Iniciante');

    const res = await request(app)
      .get('/api/trainings/entry-point')
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.currentOrNextClass).toBeTruthy();
    expect(res.body.currentOrNextClass.turmaId).toBe(turmaId);
    expect(res.body.currentOrNextClass.turmaName).toBe('Judô Iniciante');
  });

  it('bloqueia acesso ao entry-point sem token', async () => {
    const res = await request(app).get('/api/trainings/entry-point');
    expect(res.status).toBe(401);
  });

  it('bloqueia start para papel não professor', async () => {
    const turmaId = await insertTurma(ctx.academyId, ctx.professorId, 'Judô Intermediário');

    const res = await request(app)
      .post('/api/trainings/start')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ turmaId });

    expect(res.status).toBe(403);
  });

  it('inicia sessão e mantém idempotência no mesmo dia/turma/professor', async () => {
    const turmaId = await insertTurma(ctx.academyId, ctx.professorId, 'Judô Avançado');

    const first = await request(app)
      .post('/api/trainings/start')
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ turmaId });

    expect(first.status).toBe(200);
    expect(first.body.sessionId).toBeTruthy();
    expect(first.body.created).toBe(true);

    const second = await request(app)
      .post('/api/trainings/start')
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ turmaId });

    expect(second.status).toBe(200);
    expect(second.body.sessionId).toBe(first.body.sessionId);
    expect(second.body.created).toBe(false);
  });

  it('mantém idempotência em chamadas simultâneas para mesma turma', async () => {
    const turmaId = await insertTurma(ctx.academyId, ctx.professorId, 'Judô Concorrente');

    const [first, second] = await Promise.all([
      request(app)
        .post('/api/trainings/start')
        .set('Authorization', `Bearer ${ctx.professorToken}`)
        .send({ turmaId }),
      request(app)
        .post('/api/trainings/start')
        .set('Authorization', `Bearer ${ctx.professorToken}`)
        .send({ turmaId }),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const sessionIds = new Set([first.body.sessionId, second.body.sessionId]);
    expect(sessionIds.size).toBe(1);

    const createdCount = [first.body.created, second.body.created].filter(Boolean).length;
    expect(createdCount).toBe(1);
  });

  it('retorna 400 quando turmaId não é UUID válido', async () => {
    const res = await request(app)
      .post('/api/trainings/start')
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ turmaId: 'nao-uuid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/UUID válido/i);
  });

  it('retorna 404 quando turma não pertence ao professor atual', async () => {
    await insertTurma(ctx.academyId, ctx.professorId, 'Judô Base');

    const fakeTurma = '00000000-0000-0000-0000-000000000001';

    const res = await request(app)
      .post('/api/trainings/start')
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ turmaId: fakeTurma });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Turma não encontrada/i);
  });
});
