import request from 'supertest';
import app from '../app';
import { pool } from '../lib/db';
import { createUser } from '../lib/database';
import { hashPassword } from '../lib/password';
import { sign } from '../lib/jwt';

const strongPassword = 'SenhaForte1!';

process.env['DATA_ENCRYPTION_KEY'] =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

type Ctx = {
  academyId: string;
  adminToken: string;
  professorToken: string;
  professor2Token: string;
  otherAcademyProfessorToken: string;
  sessionId: string;
  studentPresentId: string;
  studentAbsentId: string;
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
      'Turma Notas Story 3.4',
      'Turma para teste de notas',
      JSON.stringify({ day: 'Quinta-feira', time: '19:00-20:00', turn: 'Noite' }),
    ]
  );

  return res.rows[0].turma_id as string;
};

const setupCtx = async (): Promise<Ctx> => {
  await request(app).post('/api/auth/test/reset').send({});

  const runId = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  const academyRes = await request(app).post('/api/auth/academies').send({
    name: `Academia Notas ${runId}`,
    location: 'Sao Paulo',
    email: `notas.${runId}@academia.com`,
    phone: '11997776666',
  });
  const academyId = academyRes.body.academyId as string;

  await request(app)
    .post(`/api/auth/academies/${academyId}/init-admin`)
    .send({
      email: `admin.notas.${runId}@academia.com`,
      password: strongPassword,
      fullName: 'Admin Notas',
    });

  const adminLogin = await request(app).post('/api/auth/login').send({
    email: `admin.notas.${runId}@academia.com`,
    password: strongPassword,
  });
  const adminToken = adminLogin.body.accessToken as string;

  const profReg = await request(app).post('/api/auth/register').send({
    email: `prof.notas.${runId}@academia.com`,
    password: strongPassword,
    fullName: 'Professor Notas',
    role: 'Professor',
    academyId,
  });
  const professorToken = profReg.body.accessToken as string;
  const professorId = profReg.body.user.id as string;

  const prof2Reg = await request(app).post('/api/auth/register').send({
    email: `prof2.notas.${runId}@academia.com`,
    password: strongPassword,
    fullName: 'Professor Notas 2',
    role: 'Professor',
    academyId,
  });
  const professor2Token = prof2Reg.body.accessToken as string;

  const otherAcademyProfessorToken = sign(
    {
      userId: '11111111-1111-1111-1111-111111111111',
      email: `prof.externo.${runId}@academia.com`,
      academyId: '22222222-2222-2222-2222-222222222222',
      role: 'Professor',
    },
    '1h'
  );

  const studentPasswordHash = await hashPassword(strongPassword);
  const studentPresent = await createUser(
    `aluno.presente.${runId}@academia.com`,
    'Aluno Presente Notas',
    studentPasswordHash,
    academyId,
    'Aluno'
  );
  const studentAbsent = await createUser(
    `aluno.ausente.${runId}@academia.com`,
    'Aluno Ausente Notas',
    studentPasswordHash,
    academyId,
    'Aluno'
  );

  const turmaId = await insertTurma(academyId, professorId);

  await pool.query(
    `INSERT INTO turma_students (enrollment_id, turma_id, student_id, academy_id, status, enrolled_at)
     VALUES (gen_random_uuid(), $1, $2, $3, 'active', NOW())`,
    [turmaId, studentPresent.id, academyId]
  );

  await pool.query(
    `INSERT INTO turma_students (enrollment_id, turma_id, student_id, academy_id, status, enrolled_at)
     VALUES (gen_random_uuid(), $1, $2, $3, 'active', NOW())`,
    [turmaId, studentAbsent.id, academyId]
  );

  const startRes = await request(app)
    .post('/api/trainings/start')
    .set('Authorization', `Bearer ${professorToken}`)
    .send({ turmaId });

  const sessionId = startRes.body.sessionId as string;

  await request(app)
    .post(`/api/trainings/${sessionId}/attendance`)
    .set('Authorization', `Bearer ${professorToken}`)
    .send({ studentId: studentPresent.id, status: 'present' });

  await request(app)
    .post(`/api/trainings/${sessionId}/attendance`)
    .set('Authorization', `Bearer ${professorToken}`)
    .send({ studentId: studentAbsent.id, status: 'absent' });

  return {
    academyId,
    adminToken,
    professorToken,
    professor2Token,
    otherAcademyProfessorToken,
    sessionId,
    studentPresentId: studentPresent.id,
    studentAbsentId: studentAbsent.id,
  };
};

describe('Story 3.4 - Anotações e Notas', () => {
  let ctx: Ctx;

  beforeEach(async () => {
    ctx = await setupCtx();
  });

  afterAll(async () => {
    await request(app).post('/api/auth/test/reset').send({});
  });

  it('carrega nota geral e lista apenas alunos presentes', async () => {
    await pool.query(
      `UPDATE training_sessions
       SET notes = $1
       WHERE session_id = $2`,
      ['Treino com boa evolução no geral', ctx.sessionId]
    );

    await pool.query(
      `INSERT INTO session_comments (
         comment_id, session_id, student_id, professor_id, academy_id, content, created_at, updated_at
       ) VALUES (
         gen_random_uuid(), $1, $2,
         (SELECT professor_id FROM training_sessions WHERE session_id = $1),
         $3,
         $4,
         NOW(),
         NOW()
       )`,
      [ctx.sessionId, ctx.studentPresentId, ctx.academyId, 'Aluno evoluiu no ukemi']
    );

    const res = await request(app)
      .get(`/api/trainings/${ctx.sessionId}/notes`)
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.generalNotes).toBe('Treino com boa evolução no geral');
    expect(res.body.presentStudents).toHaveLength(1);
    expect(res.body.presentStudents[0].userId).toBe(ctx.studentPresentId);
    expect(res.body.studentNotes[0].studentId).toBe(ctx.studentPresentId);
  });

  it('salva nota geral da sessão', async () => {
    const res = await request(app)
      .put(`/api/trainings/${ctx.sessionId}/notes`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ notes: 'Aula fluida e com boa disciplina.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const db = await pool.query(
      `SELECT notes
       FROM training_sessions
       WHERE session_id = $1`,
      [ctx.sessionId]
    );

    expect(db.rows[0].notes).toBe('Aula fluida e com boa disciplina.');
  });

  it('valida limite de 400 caracteres para nota geral', async () => {
    const notes = 'a'.repeat(401);

    const res = await request(app)
      .put(`/api/trainings/${ctx.sessionId}/notes`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ notes });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('400 caracteres');
  });

  it('faz upsert de nota por aluno presente', async () => {
    const save1 = await request(app)
      .put(`/api/trainings/${ctx.sessionId}/notes/${ctx.studentPresentId}`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ content: 'Aluno com melhora no timing.' });

    expect(save1.status).toBe(200);
    expect(save1.body.success).toBe(true);

    const save2 = await request(app)
      .put(`/api/trainings/${ctx.sessionId}/notes/${ctx.studentPresentId}`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ content: 'Aluno consolidou a base e postura.' });

    expect(save2.status).toBe(200);

    const db = await pool.query(
      `SELECT content
       FROM session_comments
       WHERE session_id = $1
         AND student_id = $2`,
      [ctx.sessionId, ctx.studentPresentId]
    );

    expect(db.rowCount).toBe(1);
    expect(db.rows[0].content).toBe('Aluno consolidou a base e postura.');
  });

  it('bloqueia professor sem vínculo com a sessão', async () => {
    const sameAcademyOtherProfessor = await request(app)
      .put(`/api/trainings/${ctx.sessionId}/notes`)
      .set('Authorization', `Bearer ${ctx.professor2Token}`)
      .send({ notes: 'Tentativa indevida' });

    expect(sameAcademyOtherProfessor.status).toBe(404);

    const otherAcademyProfessor = await request(app)
      .put(`/api/trainings/${ctx.sessionId}/notes`)
      .set('Authorization', `Bearer ${ctx.otherAcademyProfessorToken}`)
      .send({ notes: 'Tentativa externa' });

    expect(otherAcademyProfessor.status).toBe(401);
  });

  it('bloqueia nota por aluno ausente e acesso sem token', async () => {
    const absentRes = await request(app)
      .put(`/api/trainings/${ctx.sessionId}/notes/${ctx.studentAbsentId}`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ content: 'Não deveria salvar' });

    expect(absentRes.status).toBe(403);

    const noToken = await request(app)
      .get(`/api/trainings/${ctx.sessionId}/notes`);

    expect(noToken.status).toBe(401);
  });

  it('bloqueia papel não Professor', async () => {
    const res = await request(app)
      .get(`/api/trainings/${ctx.sessionId}/notes`)
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(res.status).toBe(403);
  });
});
