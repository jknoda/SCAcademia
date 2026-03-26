import request from 'supertest';
import app from '../app';
import { pool } from '../lib/db';
import { createUser } from '../lib/database';
import { hashPassword } from '../lib/password';

const strongPassword = 'SenhaForte1!';

process.env['DATA_ENCRYPTION_KEY'] =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

type Ctx = {
  academyId: string;
  professorToken: string;
  professor2Token: string;
  adminToken: string;
  turmaId: string;
  studentId: string;
  techniqueId: string;
};

const insertTurma = async (academyId: string, professorId: string, name = 'Turma Success 3.6'): Promise<string> => {
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
      'Turma para teste de sucesso Story 3.6',
      JSON.stringify({ day: 'Quarta-feira', time: '19:00-20:30', turn: 'Noite' }),
    ]
  );
  return res.rows[0].turma_id as string;
};

const insertTechnique = async (academyId: string, name = 'Osoto Gari'): Promise<string> => {
  const res = await pool.query(
    `INSERT INTO techniques (
       academy_id, name, category, display_order, is_pending, created_at, updated_at
     ) VALUES (
       $1, $2, 'Básica', 1, FALSE, NOW(), NOW()
     ) RETURNING technique_id`,
    [academyId, name]
  );
  return res.rows[0].technique_id as string;
};

const setupCtx = async (): Promise<Ctx> => {
  await request(app).post('/api/auth/test/reset').send({});

  const runId = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  const academyRes = await request(app).post('/api/auth/academies').send({
    name: `Academia Success ${runId}`,
    location: 'Rio de Janeiro',
    email: `success.${runId}@academia.com`,
    phone: '21999998888',
  });
  const academyId = academyRes.body.academyId as string;

  await request(app)
    .post(`/api/auth/academies/${academyId}/init-admin`)
    .send({
      email: `admin.success.${runId}@academia.com`,
      password: strongPassword,
      fullName: 'Admin Success',
    });

  const adminLogin = await request(app).post('/api/auth/login').send({
    email: `admin.success.${runId}@academia.com`,
    password: strongPassword,
  });
  const adminToken = adminLogin.body.accessToken as string;

  const profReg = await request(app).post('/api/auth/register').send({
    email: `prof.success.${runId}@academia.com`,
    password: strongPassword,
    fullName: 'Professor Success',
    role: 'Professor',
    academyId,
  });
  const professorToken = profReg.body.accessToken as string;
  const professorId = profReg.body.user.id as string;

  const prof2Reg = await request(app).post('/api/auth/register').send({
    email: `prof2.success.${runId}@academia.com`,
    password: strongPassword,
    fullName: 'Professor Success 2',
    role: 'Professor',
    academyId,
  });
  const professor2Token = prof2Reg.body.accessToken as string;

  const studentPasswordHash = await hashPassword(strongPassword);
  const student = await createUser(
    `aluno.success.${runId}@academia.com`,
    'Aluno Success',
    studentPasswordHash,
    academyId,
    'Aluno'
  );

  const turmaId = await insertTurma(academyId, professorId);
  await pool.query(
    `INSERT INTO turma_students (enrollment_id, turma_id, student_id, academy_id, status, enrolled_at)
     VALUES (gen_random_uuid(), $1, $2, $3, 'active', NOW())`,
    [turmaId, student.id, academyId]
  );

  const techniqueId = await insertTechnique(academyId);

  return { academyId, professorToken, professor2Token, adminToken, turmaId, studentId: student.id, techniqueId };
};

/** Cria e confirma uma sessão completa, retornando o sessionId */
const createConfirmedSession = async (ctx: Ctx): Promise<string> => {
  const startRes = await request(app)
    .post('/api/trainings/start')
    .set('Authorization', `Bearer ${ctx.professorToken}`)
    .send({ turmaId: ctx.turmaId });
  const sessionId = startRes.body.sessionId as string;

  await request(app)
    .post(`/api/trainings/${sessionId}/attendance`)
    .set('Authorization', `Bearer ${ctx.professorToken}`)
    .send({ studentId: ctx.studentId, status: 'present' });

  await request(app)
    .post(`/api/trainings/${sessionId}/techniques`)
    .set('Authorization', `Bearer ${ctx.professorToken}`)
    .send({ techniqueId: ctx.techniqueId });

  await request(app)
    .post(`/api/trainings/${sessionId}/confirm`)
    .set('Authorization', `Bearer ${ctx.professorToken}`)
    .send({});

  return sessionId;
};

describe('Story 3.6 - Endpoint GET /api/trainings/recent', () => {
  let ctx: Ctx;

  beforeEach(async () => {
    ctx = await setupCtx();
  });

  afterAll(async () => {
    await request(app).post('/api/auth/test/reset').send({});
  });

  it('retorna lista vazia quando professor não tem treinos confirmados', async () => {
    const res = await request(app)
      .get('/api/trainings/recent')
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trainings).toEqual([]);
  });

  it('retorna treino confirmado com campos corretos', async () => {
    await createConfirmedSession(ctx);

    const res = await request(app)
      .get('/api/trainings/recent')
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trainings).toHaveLength(1);

    const t = res.body.trainings[0];
    expect(t.sessionId).toBeTruthy();
    expect(t.sessionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(t.turmaName).toBe('Turma Success 3.6');
    expect(t.presentCount).toBe(1);
    expect(Array.isArray(t.techniquePreview)).toBe(true);
    expect(t.techniquePreview[0]).toBe('Osoto Gari');
  });

  it('retorna no máximo limit=3 treinos por padrão', async () => {
    await createConfirmedSession(ctx);
    await createConfirmedSession(ctx);
    await createConfirmedSession(ctx);
    await createConfirmedSession(ctx); // 4 total - deve retornar só 3

    const res = await request(app)
      .get('/api/trainings/recent')
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trainings.length).toBeLessThanOrEqual(3);
  });

  it('respeita parâmetro limit personalizado', async () => {
    await createConfirmedSession(ctx);
    await createConfirmedSession(ctx);

    const res = await request(app)
      .get('/api/trainings/recent?limit=1')
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trainings).toHaveLength(1);
  });

  it('isola treinos por professor — professor2 não vê treinos do professor1', async () => {
    await createConfirmedSession(ctx);

    const res = await request(app)
      .get('/api/trainings/recent')
      .set('Authorization', `Bearer ${ctx.professor2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.trainings).toEqual([]);
  });

  it('bloqueia acesso de Admin (RBAC)', async () => {
    const res = await request(app)
      .get('/api/trainings/recent')
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(res.status).toBe(403);
  });

  it('bloqueia acesso sem token', async () => {
    const res = await request(app).get('/api/trainings/recent');
    expect(res.status).toBe(401);
  });

  it('retorna 400 para limit inválido', async () => {
    const res = await request(app)
      .get('/api/trainings/recent?limit=abc')
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(res.status).toBe(400);
  });
});
