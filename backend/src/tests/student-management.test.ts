import request from 'supertest';
import app from '../app';
import { pool } from '../lib/db';

const adminPassword = 'AdminSenha1!';

process.env['DATA_ENCRYPTION_KEY'] = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

type SetupContext = {
  academyId: string;
  adminToken: string;
  adminTokenB: string;
  professorToken: string;
  professorTokenB: string;
  turmaIdProfessorA: string;
  turmaIdProfessorB: string;
};

const asDateInput = (date: Date): string => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
};

const yearsAgo = (years: number, dayOffset: number = 0): string => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  date.setDate(date.getDate() + dayOffset);
  return asDateInput(date);
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
      'Turma para Story 9.4',
      JSON.stringify({ day: 'Segunda-feira', time: '19:00-20:00', turn: 'Noite' }),
    ]
  );

  return res.rows[0].turma_id as string;
};

const setup = async (): Promise<SetupContext> => {
  await request(app).post('/api/auth/test/reset').send({});

  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  const academyResA = await request(app).post('/api/auth/academies').send({
    name: 'Academia Alunos A',
    location: 'Sao Paulo',
    email: `academia.alunos.a.${suffix}@test.com`,
    phone: '11999999999',
  });
  const academyId = academyResA.body.academyId as string;

  const academyResB = await request(app).post('/api/auth/academies').send({
    name: 'Academia Alunos B',
    location: 'Rio de Janeiro',
    email: `academia.alunos.b.${suffix}@test.com`,
    phone: '21999999999',
  });
  const academyIdB = academyResB.body.academyId as string;

  const adminEmailA = `admin.alunos.a.${suffix}@test.com`;
  await request(app).post(`/api/auth/academies/${academyId}/init-admin`).send({
    email: adminEmailA,
    password: adminPassword,
    fullName: 'Admin Alunos A',
  });

  const adminLoginA = await request(app).post('/api/auth/login').send({
    email: adminEmailA,
    password: adminPassword,
  });
  const adminToken = adminLoginA.body.accessToken as string;

  const adminEmailB = `admin.alunos.b.${suffix}@test.com`;
  await request(app).post(`/api/auth/academies/${academyIdB}/init-admin`).send({
    email: adminEmailB,
    password: adminPassword,
    fullName: 'Admin Alunos B',
  });

  const adminLoginB = await request(app).post('/api/auth/login').send({
    email: adminEmailB,
    password: adminPassword,
  });
  const adminTokenB = adminLoginB.body.accessToken as string;

  const profARes = await request(app).post('/api/auth/register').send({
    email: `prof.alunos.a.${suffix}@test.com`,
    password: 'ProfSenha1!',
    fullName: 'Professor A',
    role: 'Professor',
    academyId,
  });

  const profBRes = await request(app).post('/api/auth/register').send({
    email: `prof.alunos.b.${suffix}@test.com`,
    password: 'ProfSenha1!',
    fullName: 'Professor B',
    role: 'Professor',
    academyId,
  });

  const turmaIdProfessorA = await insertTurma(academyId, profARes.body.user.id, 'Turma Professor A');
  const turmaIdProfessorB = await insertTurma(academyId, profBRes.body.user.id, 'Turma Professor B');

  return {
    academyId,
    adminToken,
    adminTokenB,
    professorToken: profARes.body.accessToken as string,
    professorTokenB: profBRes.body.accessToken as string,
    turmaIdProfessorA,
    turmaIdProfessorB,
  };
};

describe('Story 9.4 - Cadastro e Edicao Completa do Aluno', () => {
  let ctx: SetupContext;

  beforeEach(async () => {
    ctx = await setup();
  });

  it('AC1: lista alunos para Admin e Professor com filtros e isolamento por turma', async () => {
    await request(app)
      .post('/api/users/alunos')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'aluno.a1@test.com',
        password: 'AlunoSenha1!',
        fullName: 'Aluno Turma A',
        birthDate: yearsAgo(16),
        turmaId: ctx.turmaIdProfessorA,
      })
      .expect(201);

    await request(app)
      .post('/api/users/alunos')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'aluno.b1@test.com',
        password: 'AlunoSenha1!',
        fullName: 'Aluno Turma B',
        birthDate: yearsAgo(20),
        turmaId: ctx.turmaIdProfessorB,
      })
      .expect(201);

    const adminList = await request(app)
      .get('/api/users/alunos?name=aluno&status=all')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(adminList.body.total).toBe(2);
    expect(adminList.body.students[0]).toHaveProperty('idade');
    expect(adminList.body.students[0]).toHaveProperty('isMinor');

    const professorAList = await request(app)
      .get('/api/users/professores/meus-alunos')
      .set('Authorization', `Bearer ${ctx.professorToken}`)
      .expect(200);

    expect(professorAList.body.total).toBe(1);
    expect(professorAList.body.students[0].fullName).toBe('Aluno Turma A');

    const professorBList = await request(app)
      .get('/api/users/professores/meus-alunos')
      .set('Authorization', `Bearer ${ctx.professorTokenB}`)
      .expect(200);

    expect(professorBList.body.total).toBe(1);
    expect(professorBList.body.students[0].fullName).toBe('Aluno Turma B');
  });

  it('AC3/AC4: cria aluno com menoridade automatica e valida inconsistência de isMinor', async () => {
    const createMinor = await request(app)
      .post('/api/users/alunos')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'aluno.menor@test.com',
        password: 'AlunoSenha1!',
        fullName: 'Aluno Menor',
        birthDate: yearsAgo(17, 1),
      })
      .expect(201);

    expect(createMinor.body.student.role).toBe('Aluno');
    expect(createMinor.body.student.isMinor).toBe(true);
    expect(createMinor.body.pendingGuardianLink).toBe(true);

    const exactly18 = await request(app)
      .post('/api/users/alunos')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'aluno.18@test.com',
        password: 'AlunoSenha1!',
        fullName: 'Aluno Dezoito',
        birthDate: yearsAgo(18),
      })
      .expect(201);

    expect(exactly18.body.student.isMinor).toBe(false);

    const older = await request(app)
      .post('/api/users/alunos')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'aluno.20@test.com',
        password: 'AlunoSenha1!',
        fullName: 'Aluno Vinte',
        birthDate: yearsAgo(20),
      })
      .expect(201);

    expect(older.body.student.isMinor).toBe(false);

    const inconsistent = await request(app)
      .post('/api/users/alunos')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'aluno.inconsistente@test.com',
        password: 'AlunoSenha1!',
        fullName: 'Aluno Inconsistente',
        birthDate: yearsAgo(17),
        isMinor: false,
      })
      .expect(400);

    expect(inconsistent.body.error).toContain('Inconsistencia');
  });

  it('AC5: edita aluno mantendo email e recalculando menoridade', async () => {
    const createRes = await request(app)
      .post('/api/users/alunos')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'aluno.edicao@test.com',
        password: 'AlunoSenha1!',
        fullName: 'Aluno Edicao',
        birthDate: yearsAgo(16),
      })
      .expect(201);

    const studentId = createRes.body.student.id as string;

    const updateRes = await request(app)
      .put(`/api/users/alunos/${studentId}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        fullName: 'Aluno Edicao Atualizado',
        birthDate: yearsAgo(19),
        phone: '11988887777',
      })
      .expect(200);

    expect(updateRes.body.student.fullName).toBe('Aluno Edicao Atualizado');
    expect(updateRes.body.student.email).toBe('aluno.edicao@test.com');
    expect(updateRes.body.student.isMinor).toBe(false);
  });

  it('AC6: desativa aluno, preenche data_saida e bloqueia login', async () => {
    const createRes = await request(app)
      .post('/api/users/alunos')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'aluno.status@test.com',
        password: 'AlunoSenha1!',
        fullName: 'Aluno Status',
        birthDate: yearsAgo(20),
      })
      .expect(201);

    const studentId = createRes.body.student.id as string;

    const loginBefore = await request(app).post('/api/auth/login').send({
      email: 'aluno.status@test.com',
      password: 'AlunoSenha1!',
    });
    expect(loginBefore.status).toBe(200);

    const deactivateRes = await request(app)
      .put(`/api/users/alunos/${studentId}/status`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ isActive: false })
      .expect(200);

    expect(deactivateRes.body.student.isActive).toBe(false);
    expect(deactivateRes.body.student.dataSaida).toBeTruthy();

    const loginAfter = await request(app).post('/api/auth/login').send({
      email: 'aluno.status@test.com',
      password: 'AlunoSenha1!',
    });

    expect(loginAfter.status).toBe(403);
    expect(loginAfter.body.error).toContain('Usuário inativo');
  });

  it('AC7: retorna ficha completa consolidada e respeita RBAC', async () => {
    const createRes = await request(app)
      .post('/api/users/alunos')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'aluno.ficha@test.com',
        password: 'AlunoSenha1!',
        fullName: 'Aluno Ficha',
        birthDate: yearsAgo(15),
        turmaId: ctx.turmaIdProfessorA,
      })
      .expect(201);

    const studentId = createRes.body.student.id as string;

    const profileRes = await request(app)
      .get(`/api/users/alunos/${studentId}/ficha`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(profileRes.body).toHaveProperty('student');
    expect(profileRes.body).toHaveProperty('lgpd');
    expect(profileRes.body).toHaveProperty('health');
    expect(profileRes.body).toHaveProperty('responsavel');
    expect(profileRes.body).toHaveProperty('turmas');
    expect(Array.isArray(profileRes.body.turmas)).toBe(true);

    const forbiddenProfessor = await request(app)
      .get(`/api/users/alunos/${studentId}/ficha`)
      .set('Authorization', `Bearer ${ctx.professorTokenB}`)
      .expect(404);

    expect(forbiddenProfessor.body.error).toBe('Aluno não encontrado');
  });

  it('RBAC/multi-tenant: bloqueia acesso cross-tenant e professor fora da turma', async () => {
    const createRes = await request(app)
      .post('/api/users/alunos')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'aluno.rbac@test.com',
        password: 'AlunoSenha1!',
        fullName: 'Aluno RBAC',
        birthDate: yearsAgo(20),
        turmaId: ctx.turmaIdProfessorA,
      })
      .expect(201);

    const studentId = createRes.body.student.id as string;

    const professorOtherTurmaUpdate = await request(app)
      .put(`/api/users/alunos/${studentId}`)
      .set('Authorization', `Bearer ${ctx.professorTokenB}`)
      .send({
        fullName: 'Tentativa Indevida',
        birthDate: yearsAgo(20),
      })
      .expect(404);

    expect(professorOtherTurmaUpdate.body.error).toBe('Aluno não encontrado');

    const crossTenantAdminUpdate = await request(app)
      .put(`/api/users/alunos/${studentId}`)
      .set('Authorization', `Bearer ${ctx.adminTokenB}`)
      .send({
        fullName: 'Tentativa Cross Tenant',
        birthDate: yearsAgo(20),
      })
      .expect(404);

    expect(crossTenantAdminUpdate.body.error).toBe('Aluno não encontrado');
  });

  it('Story 9.5: cria responsável, vincula ao aluno menor e permite desvincular', async () => {
    const createMinor = await request(app)
      .post('/api/users/alunos')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'aluno.vinculo1@test.com',
        password: 'AlunoSenha1!',
        fullName: 'Aluno Vinculo Um',
        birthDate: yearsAgo(14),
      })
      .expect(201);

    const studentId = createMinor.body.student.id as string;

    await request(app)
      .get('/api/users/responsaveis/search?email=responsavel.1@test.com')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(404);

    const createAndLink = await request(app)
      .post(`/api/users/alunos/${studentId}/responsavel`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'responsavel.1@test.com',
        fullName: 'Responsavel Um',
        relationship: 'Mae',
      })
      .expect(201);

    expect(createAndLink.body.guardian.email).toBe('responsavel.1@test.com');
    expect(createAndLink.body.temporaryPassword).toBeTruthy();

    const fichaLinked = await request(app)
      .get(`/api/users/alunos/${studentId}/ficha`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(fichaLinked.body.responsavel.guardianEmail).toBe('responsavel.1@test.com');
    expect(fichaLinked.body.responsavel.pendenteVinculacao).toBe(false);

    await request(app)
      .delete(`/api/users/alunos/${studentId}/responsavel/${createAndLink.body.guardian.guardianId}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    const fichaUnlinked = await request(app)
      .get(`/api/users/alunos/${studentId}/ficha`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(fichaUnlinked.body.responsavel.guardianEmail).toBeNull();
    expect(fichaUnlinked.body.responsavel.pendenteVinculacao).toBe(true);
  });

  it('Story 9.5: vincula responsável existente e lista menores sem responsável no painel LGPD', async () => {
    const studentOneRes = await request(app)
      .post('/api/users/alunos')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'aluno.vinculo2@test.com',
        password: 'AlunoSenha1!',
        fullName: 'Aluno Vinculo Dois',
        birthDate: yearsAgo(13),
      })
      .expect(201);

    const studentTwoRes = await request(app)
      .post('/api/users/alunos')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'aluno.vinculo3@test.com',
        password: 'AlunoSenha1!',
        fullName: 'Aluno Vinculo Tres',
        birthDate: yearsAgo(12),
      })
      .expect(201);

    const studentOneId = studentOneRes.body.student.id as string;
    const studentTwoId = studentTwoRes.body.student.id as string;

    const firstLink = await request(app)
      .post(`/api/users/alunos/${studentOneId}/responsavel`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'responsavel.2@test.com',
        fullName: 'Responsavel Dois',
        relationship: 'Pai',
      })
      .expect(201);

    const searchGuardian = await request(app)
      .get('/api/users/responsaveis/search?email=responsavel.2@test.com')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(searchGuardian.body.guardian.guardianId).toBe(firstLink.body.guardian.guardianId);

    await request(app)
      .post(`/api/users/alunos/${studentTwoId}/responsavel/link`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        guardianId: searchGuardian.body.guardian.guardianId,
        relationship: 'Pai',
      })
      .expect(201);

    const unlinkedMinors = await request(app)
      .get('/api/admin/lgpd/minors-without-guardian')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(unlinkedMinors.body.filter).toBe('minors-without-guardian');
    expect(unlinkedMinors.body.total).toBe(0);
  });

  it('Story 9.6: consolida status de anamnese na ficha, prontidão na lista e filtro admin sem anamnese', async () => {
    const readyStudentRes = await request(app)
      .post('/api/users/alunos')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'aluno.saude.pronto@test.com',
        password: 'AlunoSenha1!',
        fullName: 'Aluno Pronto',
        birthDate: yearsAgo(14),
      })
      .expect(201);

    const pendingStudentRes = await request(app)
      .post('/api/users/alunos')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'aluno.saude.pendente@test.com',
        password: 'AlunoSenha1!',
        fullName: 'Aluno Pendente',
        birthDate: yearsAgo(20),
      })
      .expect(201);

    const readyStudentId = readyStudentRes.body.student.id as string;
    const pendingStudentId = pendingStudentRes.body.student.id as string;

    await request(app)
      .post(`/api/users/alunos/${readyStudentId}/responsavel`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'responsavel.saude.pronto@test.com',
        fullName: 'Responsavel Pronto',
        relationship: 'Mae',
      })
      .expect(201);

    await request(app)
      .post(`/api/health-screening/${readyStudentId}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        bloodType: 'O+',
        emergencyContactName: 'Responsavel Pronto',
        emergencyContactPhone: '11988887777',
      })
      .expect(201);

    const fichaRes = await request(app)
      .get(`/api/users/alunos/${readyStudentId}/ficha`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(fichaRes.body.health.anamnesePreenchida).toBe(true);
    expect(fichaRes.body.health.lastUpdatedAt).toBeTruthy();

    const listRes = await request(app)
      .get('/api/users/alunos?status=all')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    const readyStudent = listRes.body.students.find((student: any) => student.id === readyStudentId);
    const pendingStudent = listRes.body.students.find((student: any) => student.id === pendingStudentId);

    expect(readyStudent.operationalStatus.isReady).toBe(true);
    expect(readyStudent.operationalStatus.hasHealthScreening).toBe(true);
    expect(pendingStudent.operationalStatus.isReady).toBe(false);
    expect(pendingStudent.operationalStatus.missingItems).toContain('anamnese');

    const noHealthRes = await request(app)
      .get('/api/admin/lgpd/students-without-health-screening')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .expect(200);

    expect(noHealthRes.body.filter).toBe('students-without-health-screening');
    expect(noHealthRes.body.total).toBe(1);
    expect(noHealthRes.body.students[0].studentId).toBe(pendingStudentId);
  });

  it('Story 9.6: responsável vê filhos com pendência de anamnese e o status atualiza após salvar', async () => {
    const studentRes = await request(app)
      .post('/api/users/alunos')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'aluno.home.saude@test.com',
        password: 'AlunoSenha1!',
        fullName: 'Aluno Home Saude',
        birthDate: yearsAgo(11),
      })
      .expect(201);

    const studentId = studentRes.body.student.id as string;

    const guardianRes = await request(app)
      .post(`/api/users/alunos/${studentId}/responsavel`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        email: 'responsavel.home.saude@test.com',
        fullName: 'Responsavel Home Saude',
        relationship: 'Pai',
      })
      .expect(201);

    const guardianLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'responsavel.home.saude@test.com',
        password: guardianRes.body.temporaryPassword,
      })
      .expect(200);

    const guardianToken = guardianLogin.body.accessToken as string;

    const linkedBefore = await request(app)
      .get('/api/users/students/linked')
      .set('Authorization', `Bearer ${guardianToken}`)
      .expect(200);

    expect(linkedBefore.body.students[0].studentId).toBe(studentId);
    expect(linkedBefore.body.students[0].hasHealthScreening).toBe(false);

    await request(app)
      .post(`/api/health-screening/${studentId}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        bloodType: 'A+',
        emergencyContactName: 'Responsavel Home Saude',
        emergencyContactPhone: '11977776666',
      })
      .expect(201);

    const linkedAfter = await request(app)
      .get('/api/users/students/linked')
      .set('Authorization', `Bearer ${guardianToken}`)
      .expect(200);

    expect(linkedAfter.body.students[0].hasHealthScreening).toBe(true);
    expect(linkedAfter.body.students[0].healthScreeningUpdatedAt).toBeTruthy();
  });
});
