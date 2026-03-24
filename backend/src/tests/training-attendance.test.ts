import request from 'supertest';
import app from '../app';
import { pool } from '../lib/db';
import { createUser } from '../lib/database';
import { hashPassword } from '../lib/password';
import { sign } from '../lib/jwt';

const strongPassword = 'SenhaForte1!';

process.env['DATA_ENCRYPTION_KEY'] = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

type Ctx = {
  academyId: string;
  adminToken: string;
  professorToken: string;
  professorId: string;
  professor2Token: string;
  otherAcademyProfessorToken: string;
  sessionId: string;
  studentAId: string;
  studentBId: string;
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
      'Turma Frequência Story 3.2',
      'Turma para teste da frequência',
      JSON.stringify({ day: 'Quarta-feira', time: '19:00-20:00', turn: 'Noite' }),
    ]
  );

  return res.rows[0].turma_id as string;
};

const setupCtx = async (): Promise<Ctx> => {
  await request(app).post('/api/auth/test/reset').send({});

  const academyRes = await request(app).post('/api/auth/academies').send({
    name: 'Academia Frequência',
    location: 'Sao Paulo',
    email: 'frequencia@academia.com',
    phone: '11998887777',
  });
  const academyId = academyRes.body.academyId as string;

  await request(app)
    .post(`/api/auth/academies/${academyId}/init-admin`)
    .send({
      email: 'admin.frequencia@academia.com',
      password: strongPassword,
      fullName: 'Admin Frequência',
    });

  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin.frequencia@academia.com',
    password: strongPassword,
  });
  const adminToken = adminLogin.body.accessToken as string;

  const profReg = await request(app).post('/api/auth/register').send({
    email: 'prof.frequencia@academia.com',
    password: strongPassword,
    fullName: 'Professor Frequência',
    role: 'Professor',
    academyId,
  });
  const professorToken = profReg.body.accessToken as string;
  const professorId = profReg.body.user.id as string;

  const prof2Reg = await request(app).post('/api/auth/register').send({
    email: 'prof2.frequencia@academia.com',
    password: strongPassword,
    fullName: 'Professor Frequência 2',
    role: 'Professor',
    academyId,
  });
  const professor2Token = prof2Reg.body.accessToken as string;

  const otherAcademyProfessorToken = sign(
    {
      userId: '11111111-1111-1111-1111-111111111111',
      email: 'prof.externo@academia.com',
      academyId: '22222222-2222-2222-2222-222222222222',
      role: 'Professor',
    },
    '1h'
  );

  const studentPasswordHash = await hashPassword(strongPassword);
  const studentA = await createUser(
    'aluno.a.frequencia@academia.com',
    'Aluno A Frequência',
    studentPasswordHash,
    academyId,
    'Aluno'
  );
  const studentB = await createUser(
    'aluno.b.frequencia@academia.com',
    'Aluno B Frequência',
    studentPasswordHash,
    academyId,
    'Aluno'
  );

  const turmaId = await insertTurma(academyId, professorId);

  await pool.query(
    `INSERT INTO turma_students (enrollment_id, turma_id, student_id, academy_id, status, enrolled_at)
     VALUES
      (gen_random_uuid(), $1, $2, $3, 'active', NOW()),
      (gen_random_uuid(), $1, $4, $3, 'active', NOW())`,
    [turmaId, studentA.id, academyId, studentB.id]
  );

  const startRes = await request(app)
    .post('/api/trainings/start')
    .set('Authorization', `Bearer ${professorToken}`)
    .send({ turmaId });

  const sessionId = startRes.body.sessionId as string;

  return {
    academyId,
    adminToken,
    professorToken,
    professorId,
    professor2Token,
    otherAcademyProfessorToken,
    sessionId,
    studentAId: studentA.id,
    studentBId: studentB.id,
  };
};

describe('Story 3.2 - Marcar Frequência', () => {
  let ctx: Ctx;

  beforeEach(async () => {
    ctx = await setupCtx();
  });

  afterAll(async () => {
    await request(app).post('/api/auth/test/reset').send({});
  });

  it('carrega a lista de alunos da sessão com totais iniciais', async () => {
    const res = await request(app)
      .get(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe(ctx.sessionId);
    expect(res.body.students).toHaveLength(2);
    expect(res.body.totals.total).toBe(2);
    expect(res.body.totals.present).toBe(0);
  });

  it('faz upsert de presença e reflete no carregamento seguinte', async () => {
    const markRes = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ studentId: ctx.studentAId, status: 'present' });

    expect(markRes.status).toBe(200);
    expect(markRes.body.studentId).toBe(ctx.studentAId);
    expect(markRes.body.status).toBe('present');
    expect(markRes.body.totals.total).toBe(2);
    expect(markRes.body.totals.present).toBe(1);

    const reload = await request(app)
      .get(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    const studentA = reload.body.students.find((s: any) => s.studentId === ctx.studentAId);
    expect(studentA.status).toBe('present');
    expect(reload.body.totals.present).toBe(1);
  });

  it('atualiza presença para ausência no mesmo aluno sem duplicar', async () => {
    await request(app)
      .post(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ studentId: ctx.studentAId, status: 'present' });

    const updateRes = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ studentId: ctx.studentAId, status: 'absent' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe('absent');
    expect(updateRes.body.totals.present).toBe(0);
  });

  it('aceita status justified e mantém valor no carregamento', async () => {
    const saveRes = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ studentId: ctx.studentBId, status: 'justified' });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.status).toBe('justified');
    expect(saveRes.body.totals.total).toBe(2);
    expect(saveRes.body.totals.present).toBe(0);

    const reload = await request(app)
      .get(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(reload.status).toBe(200);
    const studentB = reload.body.students.find((s: any) => s.studentId === ctx.studentBId);
    expect(studentB.status).toBe('justified');
    expect(reload.body.totals.present).toBe(0);
  });

  it('bloqueia acesso sem token e para papel não professor', async () => {
    const noToken = await request(app).get(`/api/trainings/${ctx.sessionId}/attendance`);
    expect(noToken.status).toBe(401);

    const adminRole = await request(app)
      .get(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.adminToken}`);
    expect(adminRole.status).toBe(403);
  });

  it('isola sessão por professor e academia', async () => {
    const sameAcademyOtherProfessor = await request(app)
      .get(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.professor2Token}`);

    expect(sameAcademyOtherProfessor.status).toBe(404);

    const otherAcademyProfessor = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.otherAcademyProfessorToken}`)
      .send({ studentId: ctx.studentAId, status: 'present' });

    expect(otherAcademyProfessor.status).toBe(401);
  });

  it('retorna 400 para payload inválido de status', async () => {
    const res = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ studentId: ctx.studentAId, status: 'invalido' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/status deve ser present, absent ou justified/i);
  });

  it('Story 9.6: inclui flag de anamnese na frequência e aviso não bloqueante ao marcar presente', async () => {
    await request(app)
      .post(`/api/health-screening/${ctx.studentBId}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        bloodType: 'AB+',
        emergencyContactName: 'Contato Emergencia',
        emergencyContactPhone: '11999998888',
      })
      .expect(201);

    const attendanceRes = await request(app)
      .get(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .expect(200);

    const studentWithoutHealth = attendanceRes.body.students.find((student: any) => student.studentId === ctx.studentAId);
    const studentWithHealth = attendanceRes.body.students.find((student: any) => student.studentId === ctx.studentBId);

    expect(studentWithoutHealth.hasHealthScreening).toBe(false);
    expect(studentWithHealth.hasHealthScreening).toBe(true);

    const saveWithoutHealth = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ studentId: ctx.studentAId, status: 'present' })
      .expect(200);

    expect(saveWithoutHealth.body.warning).toMatch(/sem anamnese preenchida/i);

    const saveWithHealth = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/attendance`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ studentId: ctx.studentBId, status: 'present' })
      .expect(200);

    expect(saveWithHealth.body.warning).toBeNull();
  });
});
