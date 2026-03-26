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
  sessionId: string;
  studentId: string;
  techniqueId: string;
};

const insertTurma = async (academyId: string, professorId: string): Promise<string> => {
  const res = await pool.query(
    `INSERT INTO turmas (
       academy_id, professor_id, name, description, schedule_json, capacity, is_active, created_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5::jsonb, 30, true, NOW(), NOW()
     ) RETURNING turma_id`,
    [
      academyId,
      professorId,
      'Turma Revisao Story 3.5',
      'Turma para teste de revisão',
      JSON.stringify({ day: 'Terça-feira', time: '19:00-20:30', turn: 'Noite' }),
    ]
  );

  return res.rows[0].turma_id as string;
};

const insertTechnique = async (academyId: string): Promise<string> => {
  const res = await pool.query(
    `INSERT INTO techniques (
       academy_id, name, category, display_order, is_pending, created_at, updated_at
     ) VALUES (
       $1, 'Osoto Gari', 'Básica', 1, FALSE, NOW(), NOW()
     ) RETURNING technique_id`,
    [academyId]
  );

  return res.rows[0].technique_id as string;
};

const setupCtx = async (): Promise<Ctx> => {
  await request(app).post('/api/auth/test/reset').send({});

  const runId = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  const academyRes = await request(app).post('/api/auth/academies').send({
    name: `Academia Review ${runId}`,
    location: 'Sao Paulo',
    email: `review.${runId}@academia.com`,
    phone: '11997776666',
  });
  const academyId = academyRes.body.academyId as string;

  await request(app)
    .post(`/api/auth/academies/${academyId}/init-admin`)
    .send({
      email: `admin.review.${runId}@academia.com`,
      password: strongPassword,
      fullName: 'Admin Review',
    });

  const adminLogin = await request(app).post('/api/auth/login').send({
    email: `admin.review.${runId}@academia.com`,
    password: strongPassword,
  });
  const adminToken = adminLogin.body.accessToken as string;

  const profReg = await request(app).post('/api/auth/register').send({
    email: `prof.review.${runId}@academia.com`,
    password: strongPassword,
    fullName: 'Professor Review',
    role: 'Professor',
    academyId,
  });

  const professorToken = profReg.body.accessToken as string;
  const professorId = profReg.body.user.id as string;

  const prof2Reg = await request(app).post('/api/auth/register').send({
    email: `prof2.review.${runId}@academia.com`,
    password: strongPassword,
    fullName: 'Professor Review 2',
    role: 'Professor',
    academyId,
  });
  const professor2Token = prof2Reg.body.accessToken as string;

  const studentPasswordHash = await hashPassword(strongPassword);
  const student = await createUser(
    `aluno.review.${runId}@academia.com`,
    'Aluno Review',
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

  const startRes = await request(app)
    .post('/api/trainings/start')
    .set('Authorization', `Bearer ${professorToken}`)
    .send({ turmaId });

  const sessionId = startRes.body.sessionId as string;
  const techniqueId = await insertTechnique(academyId);

  return {
    academyId,
    professorToken,
    professor2Token,
    adminToken,
    sessionId,
    studentId: student.id,
    techniqueId,
  };
};

describe('Story 3.5 - Revisar & Confirmar Registro', () => {
  let ctx: Ctx;

  beforeEach(async () => {
    ctx = await setupCtx();
  });

  afterAll(async () => {
    await request(app).post('/api/auth/test/reset').send({});
  });

  it('retorna resumo da sessão para revisão', async () => {
    await request(app)
      .post(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ studentId: ctx.studentId, status: 'present' });

    await request(app)
      .post(`/api/trainings/${ctx.sessionId}/techniques`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ techniqueId: ctx.techniqueId });

    await request(app)
      .put(`/api/trainings/${ctx.sessionId}/notes`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ notes: 'Aula produtiva e com boa disciplina.' });

    const res = await request(app)
      .get(`/api/trainings/${ctx.sessionId}/review`)
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.session.sessionId).toBe(ctx.sessionId);
    expect(res.body.attendance.present).toBe(1);
    expect(res.body.techniques.count).toBe(1);
    expect(res.body.notes.general).toContain('Aula produtiva');
  });

  it('confirma sessão quando pré-condições estão válidas', async () => {
    await request(app)
      .post(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ studentId: ctx.studentId, status: 'present' });

    await request(app)
      .post(`/api/trainings/${ctx.sessionId}/techniques`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ techniqueId: ctx.techniqueId });

    const confirm = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/confirm`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({});

    expect(confirm.status).toBe(200);
    expect(confirm.body.success).toBe(true);
    expect(typeof confirm.body.confirmedAt).toBe('string');

    const db = await pool.query(
      `SELECT offline_synced_at
       FROM training_sessions
       WHERE session_id = $1`,
      [ctx.sessionId]
    );

    expect(db.rows[0].offline_synced_at).not.toBeNull();
  });

  it('permite confirmação sem presença marcada quando há aluno vinculado e técnica', async () => {
    await request(app)
      .post(`/api/trainings/${ctx.sessionId}/techniques`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ techniqueId: ctx.techniqueId });

    const confirm = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/confirm`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({});

    expect(confirm.status).toBe(200);
    expect(confirm.body.success).toBe(true);
  });

  it('bloqueia confirmação sem técnica selecionada', async () => {
    await request(app)
      .post(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ studentId: ctx.studentId, status: 'present' });

    const confirm = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/confirm`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({});

    expect(confirm.status).toBe(400);
    expect(confirm.body.error).toContain('técnica');
  });

  it('isola sessão por professor e bloqueia papel não Professor', async () => {
    const otherProfessor = await request(app)
      .get(`/api/trainings/${ctx.sessionId}/review`)
      .set('Authorization', `Bearer ${ctx.professor2Token}`);

    expect(otherProfessor.status).toBe(404);

    const admin = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/confirm`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({});

    expect(admin.status).toBe(403);
  });

  it('bloqueia acesso sem token', async () => {
    const noToken = await request(app)
      .get(`/api/trainings/${ctx.sessionId}/review`);

    expect(noToken.status).toBe(401);
  });
});
