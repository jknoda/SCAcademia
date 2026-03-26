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
  professor2Token: string;
  otherAcademyProfessorToken: string;
  sessionId: string;
  techniqueBasicId: string;
  techniqueAdvancedId: string;
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
      'Turma Técnicas Story 3.3',
      'Turma para teste de técnicas',
      JSON.stringify({ day: 'Quinta-feira', time: '19:00-20:00', turn: 'Noite' }),
    ]
  );

  return res.rows[0].turma_id as string;
};

const insertTechniques = async (academyId: string): Promise<{ basicId: string; advancedId: string }> => {
  const basic = await pool.query(
    `INSERT INTO techniques (
       academy_id, name, category, display_order, is_pending, created_at, updated_at
     ) VALUES (
       $1, $2, 'Básica', 1, FALSE, NOW(), NOW()
     ) RETURNING technique_id`,
    [academyId, 'Osoto Gari']
  );

  const advanced = await pool.query(
    `INSERT INTO techniques (
       academy_id, name, category, display_order, is_pending, created_at, updated_at
     ) VALUES (
       $1, $2, 'Avançada', 10, FALSE, NOW(), NOW()
     ) RETURNING technique_id`,
    [academyId, 'Uchi Mata']
  );

  return {
    basicId: basic.rows[0].technique_id as string,
    advancedId: advanced.rows[0].technique_id as string,
  };
};

const setupCtx = async (): Promise<Ctx> => {
  await request(app).post('/api/auth/test/reset').send({});

  const academyRes = await request(app).post('/api/auth/academies').send({
    name: 'Academia Técnicas',
    location: 'Sao Paulo',
    email: 'tecnicas@academia.com',
    phone: '11997776666',
  });
  const academyId = academyRes.body.academyId as string;

  await request(app)
    .post(`/api/auth/academies/${academyId}/init-admin`)
    .send({
      email: 'admin.tecnicas@academia.com',
      password: strongPassword,
      fullName: 'Admin Técnicas',
    });

  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin.tecnicas@academia.com',
    password: strongPassword,
  });
  const adminToken = adminLogin.body.accessToken as string;

  const profReg = await request(app).post('/api/auth/register').send({
    email: 'prof.tecnicas@academia.com',
    password: strongPassword,
    fullName: 'Professor Técnicas',
    role: 'Professor',
    academyId,
  });
  const professorToken = profReg.body.accessToken as string;
  const professorId = profReg.body.user.id as string;

  const prof2Reg = await request(app).post('/api/auth/register').send({
    email: 'prof2.tecnicas@academia.com',
    password: strongPassword,
    fullName: 'Professor Técnicas 2',
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
    'aluno.a.tecnicas@academia.com',
    'Aluno A Técnicas',
    studentPasswordHash,
    academyId,
    'Aluno'
  );

  const turmaId = await insertTurma(academyId, professorId);

  await pool.query(
    `INSERT INTO turma_students (enrollment_id, turma_id, student_id, academy_id, status, enrolled_at)
     VALUES (gen_random_uuid(), $1, $2, $3, 'active', NOW())`,
    [turmaId, studentA.id, academyId]
  );

  const startRes = await request(app)
    .post('/api/trainings/start')
    .set('Authorization', `Bearer ${professorToken}`)
    .send({ turmaId });

  const sessionId = startRes.body.sessionId as string;
  const techniques = await insertTechniques(academyId);

  return {
    academyId,
    adminToken,
    professorToken,
    professor2Token,
    otherAcademyProfessorToken,
    sessionId,
    techniqueBasicId: techniques.basicId,
    techniqueAdvancedId: techniques.advancedId,
  };
};

describe('Story 3.3 - Adicionar Técnicas', () => {
  let ctx: Ctx;

  beforeEach(async () => {
    ctx = await setupCtx();
  });

  afterAll(async () => {
    await request(app).post('/api/auth/test/reset').send({});
  });

  it('lista técnicas por categoria para a academia do professor', async () => {
    const res = await request(app)
      .get(`/api/academies/${ctx.academyId}/techniques`)
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.byId[ctx.techniqueBasicId].name).toBe('Osoto Gari');
    expect(res.body.categories['Básica']).toContain(ctx.techniqueBasicId);
    expect(res.body.categories['Avançada']).toContain(ctx.techniqueAdvancedId);
  });

  it('bloqueia exclusão de técnica vinculada a treino ativo', async () => {
    await request(app)
      .post(`/api/trainings/${ctx.sessionId}/techniques`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ techniqueId: ctx.techniqueBasicId });

    const deleteRes = await request(app)
      .delete(`/api/academies/${ctx.academyId}/techniques/${ctx.techniqueBasicId}`)
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(deleteRes.status).toBe(409);
    expect(deleteRes.body.error).toContain('vinculada a treinos ativos');

    const checkRes = await request(app)
      .get(`/api/academies/${ctx.academyId}/techniques`)
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(checkRes.status).toBe(200);
    expect(checkRes.body.byId[ctx.techniqueBasicId].name).toBe('Osoto Gari');
  });

  it('permite excluir técnica não vinculada a treino ativo', async () => {
    const deleteRes = await request(app)
      .delete(`/api/academies/${ctx.academyId}/techniques/${ctx.techniqueAdvancedId}`)
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.technique.techniqueId).toBe(ctx.techniqueAdvancedId);

    const checkRes = await request(app)
      .get(`/api/academies/${ctx.academyId}/techniques`)
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(checkRes.status).toBe(200);
    expect(checkRes.body.byId[ctx.techniqueAdvancedId]).toBeUndefined();
    expect(checkRes.body.categories['Avançada']).not.toContain(ctx.techniqueAdvancedId);
  });

  it('seleciona e desseleciona técnicas na sessão', async () => {
    const selectRes = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/techniques`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ techniqueId: ctx.techniqueBasicId });

    expect(selectRes.status).toBe(200);
    expect(selectRes.body.selectedTechniqueIds).toContain(ctx.techniqueBasicId);
    expect(selectRes.body.summary.count).toBe(1);

    const deselectRes = await request(app)
      .delete(`/api/trainings/${ctx.sessionId}/techniques/${ctx.techniqueBasicId}`)
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(deselectRes.status).toBe(200);
    expect(deselectRes.body.selectedTechniqueIds).toEqual([]);
    expect(deselectRes.body.summary.count).toBe(0);

    const reselectRes = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/techniques`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ techniqueId: ctx.techniqueBasicId });

    expect(reselectRes.status).toBe(200);
    expect(reselectRes.body.selectedTechniqueIds).toContain(ctx.techniqueBasicId);

    const row = await pool.query(
      `SELECT deleted_at
       FROM session_techniques
       WHERE session_id = $1
         AND technique_id = $2`,
      [ctx.sessionId, ctx.techniqueBasicId]
    );
    expect(row.rows[0].deleted_at).toBeNull();
  });

  it('adiciona técnica customizada direto no catálogo e inclui na sessão', async () => {
    const addRes = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/techniques/custom`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ name: 'Sasae Tsurikomi Ashi Custom' });

    expect(addRes.status).toBe(201);
    expect(addRes.body.technique.name).toBe('Sasae Tsurikomi Ashi Custom');

    const pendingCheck = await pool.query(
      `SELECT is_pending, created_by_professor_id
       FROM techniques
       WHERE technique_id = $1`,
      [addRes.body.technique.techniqueId]
    );

    expect(pendingCheck.rows[0].is_pending).toBe(false);
    expect(typeof pendingCheck.rows[0].created_by_professor_id).toBe('string');
  });

  it('salva e aplica preset na sessão', async () => {
    const savePreset = await request(app)
      .post('/api/trainings/presets')
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({
        name: 'Treino Básico Segunda',
        techniqueIds: [ctx.techniqueBasicId, ctx.techniqueAdvancedId],
      });

    expect(savePreset.status).toBe(201);
    expect(savePreset.body.preset.techniqueCount).toBe(2);

    const listPresets = await request(app)
      .get('/api/trainings/presets')
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(listPresets.status).toBe(200);
    expect(listPresets.body.presets.length).toBeGreaterThan(0);

    const presetId = listPresets.body.presets[0].presetId as string;

    const applyPreset = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/apply-preset/${presetId}`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({});

    expect(applyPreset.status).toBe(200);
    expect(applyPreset.body.selectedTechniqueIds).toEqual(
      expect.arrayContaining([ctx.techniqueBasicId, ctx.techniqueAdvancedId])
    );
  });

  it('reaplica preset e reativa técnica removida da sessão', async () => {
    const savePreset = await request(app)
      .post('/api/trainings/presets')
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({
        name: 'Preset Reativacao',
        techniqueIds: [ctx.techniqueAdvancedId],
      });

    expect(savePreset.status).toBe(201);

    const listPresets = await request(app)
      .get('/api/trainings/presets')
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    const presetId = listPresets.body.presets[0].presetId as string;

    await request(app)
      .post(`/api/trainings/${ctx.sessionId}/techniques`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({ techniqueId: ctx.techniqueAdvancedId });

    await request(app)
      .delete(`/api/trainings/${ctx.sessionId}/techniques/${ctx.techniqueAdvancedId}`)
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    const applyPreset = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/apply-preset/${presetId}`)
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .send({});

    expect(applyPreset.status).toBe(200);
    expect(applyPreset.body.selectedTechniqueIds).toContain(ctx.techniqueAdvancedId);

    const sessionState = await request(app)
      .get(`/api/trainings/${ctx.sessionId}/techniques`)
      .set('Authorization', `Bearer ${ctx.professorToken}`);

    expect(sessionState.status).toBe(200);
    expect(sessionState.body.selectedTechniqueIds).toContain(ctx.techniqueAdvancedId);
  });

  it('bloqueia acesso sem token ou papel não Professor', async () => {
    const noToken = await request(app).get(`/api/trainings/${ctx.sessionId}/techniques`);
    expect(noToken.status).toBe(401);

    const adminRole = await request(app)
      .get(`/api/trainings/${ctx.sessionId}/techniques`)
      .set('Authorization', `Bearer ${ctx.adminToken}`);
    expect(adminRole.status).toBe(403);
  });

  it('isola sessão por professor e academia', async () => {
    const sameAcademyOtherProfessor = await request(app)
      .get(`/api/trainings/${ctx.sessionId}/techniques`)
      .set('Authorization', `Bearer ${ctx.professor2Token}`);

    expect(sameAcademyOtherProfessor.status).toBe(404);

    const otherAcademyProfessor = await request(app)
      .post(`/api/trainings/${ctx.sessionId}/techniques`)
      .set('Authorization', `Bearer ${ctx.otherAcademyProfessorToken}`)
      .send({ techniqueId: ctx.techniqueBasicId });

    expect(otherAcademyProfessor.status).toBe(401);
  });
});
