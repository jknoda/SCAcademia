import request from 'supertest';
import app from '../app';

const adminPassword = 'AdminSenha1!';

describe('Story 9.3 - Cadastro e Edicao Completa do Professor', () => {
  let academyId = '';
  let adminToken = '';
  let academyIdB = '';
  let adminTokenB = '';

  beforeEach(async () => {
    await request(app).post('/api/auth/test/reset').send({});

    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const academyRes = await request(app).post('/api/auth/academies').send({
      name: 'Academia Professores A',
      location: 'Sao Paulo',
      email: `academia.a.${suffix}@test.com`,
      phone: '11999999999',
    });
    academyId = academyRes.body.academyId as string;

    const adminEmail = `admin.a.${suffix}@test.com`;
    await request(app).post(`/api/auth/academies/${academyId}/init-admin`).send({
      email: adminEmail,
      password: adminPassword,
      fullName: 'Admin A',
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password: adminPassword,
    });
    adminToken = loginRes.body.accessToken as string;

    const academyResB = await request(app).post('/api/auth/academies').send({
      name: 'Academia Professores B',
      location: 'Rio de Janeiro',
      email: `academia.b.${suffix}@test.com`,
      phone: '21999999999',
    });
    academyIdB = academyResB.body.academyId as string;

    const adminEmailB = `admin.b.${suffix}@test.com`;
    await request(app).post(`/api/auth/academies/${academyIdB}/init-admin`).send({
      email: adminEmailB,
      password: adminPassword,
      fullName: 'Admin B',
    });

    const loginResB = await request(app).post('/api/auth/login').send({
      email: adminEmailB,
      password: adminPassword,
    });
    adminTokenB = loginResB.body.accessToken as string;
  });

  it('AC1: lista professores com filtros por nome e status', async () => {
    const createAna = await request(app)
      .post('/api/users/professores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'ana.prof@test.com',
        password: 'ProfSenha1!',
        fullName: 'Ana Professora',
        phone: '11911112222',
      });

    const createBruno = await request(app)
      .post('/api/users/professores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'bruno.prof@test.com',
        password: 'ProfSenha1!',
        fullName: 'Bruno Sensei',
      });

    await request(app)
      .put(`/api/users/professores/${createBruno.body.professor.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    const allRes = await request(app)
      .get('/api/users/professores')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(allRes.status).toBe(200);
    expect(allRes.body.total).toBe(2);

    const byNameRes = await request(app)
      .get('/api/users/professores?name=ana')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(byNameRes.status).toBe(200);
    expect(byNameRes.body.total).toBe(1);
    expect(byNameRes.body.professors[0].fullName).toBe('Ana Professora');

    const inactiveRes = await request(app)
      .get('/api/users/professores?status=inactive')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(inactiveRes.status).toBe(200);
    expect(inactiveRes.body.total).toBe(1);
    expect(inactiveRes.body.professors[0].fullName).toBe('Bruno Sensei');
    expect(inactiveRes.body.professors[0].isActive).toBe(false);
  });

  it('AC3/AC6: cadastra professor e bloqueia email duplicado na mesma academia', async () => {
    const createRes = await request(app)
      .post('/api/users/professores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'joao.prof@test.com',
        password: 'ProfSenha1!',
        fullName: 'Joao Professor',
        documentId: '123.456.789-10',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.message).toContain('cadastrado com sucesso');
    expect(createRes.body.professor.role).toBe('Professor');
    expect(createRes.body.temporaryPassword).toBe('ProfSenha1!');

    const duplicateRes = await request(app)
      .post('/api/users/professores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'joao.prof@test.com',
        password: 'ProfSenha1!',
        fullName: 'Outro Nome',
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.error).toBe('Email ja cadastrado para outro usuario desta academia');

    const crossAcademyRes = await request(app)
      .post('/api/users/professores')
      .set('Authorization', `Bearer ${adminTokenB}`)
      .send({
        email: 'joao.prof@test.com',
        password: 'ProfSenha1!',
        fullName: 'Mesmo Email Outra Academia',
      });

    expect(crossAcademyRes.status).toBe(201);
  });

  it('AC4: edita professor sem permitir alteracao de email e redefine senha', async () => {
    const createRes = await request(app)
      .post('/api/users/professores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'maria.prof@test.com',
        password: 'ProfSenha1!',
        fullName: 'Maria Professora',
      });

    const professorId = createRes.body.professor.id as string;

    const updateRes = await request(app)
      .put(`/api/users/professores/${professorId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Maria Professora Atualizada',
        documentId: '123.456.789-10',
        phone: '11988887777',
        dataEntrada: '2025-01-10',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.professor.fullName).toBe('Maria Professora Atualizada');
    expect(updateRes.body.professor.email).toBe('maria.prof@test.com');

    const resetPasswordRes = await request(app)
      .put(`/api/users/professores/${professorId}/reset-password`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        newPassword: 'NovaProfSenha1@',
        confirmPassword: 'NovaProfSenha1@',
      });

    expect(resetPasswordRes.status).toBe(200);
    expect(resetPasswordRes.body.message).toBe('Senha do professor redefinida com sucesso');

    const oldLoginRes = await request(app).post('/api/auth/login').send({
      email: 'maria.prof@test.com',
      password: 'ProfSenha1!',
    });
    expect(oldLoginRes.status).toBe(401);

    const newLoginRes = await request(app).post('/api/auth/login').send({
      email: 'maria.prof@test.com',
      password: 'NovaProfSenha1@',
    });
    expect(newLoginRes.status).toBe(200);
  });

  it('AC5: desativa professor, preenche data_saida e bloqueia login', async () => {
    const createRes = await request(app)
      .post('/api/users/professores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'inativo.prof@test.com',
        password: 'ProfSenha1!',
        fullName: 'Professor Inativo',
      });

    const professorId = createRes.body.professor.id as string;

    const deactivateRes = await request(app)
      .put(`/api/users/professores/${professorId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.professor.isActive).toBe(false);
    expect(deactivateRes.body.professor.dataSaida).toBeTruthy();

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'inativo.prof@test.com',
      password: 'ProfSenha1!',
    });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.error).toContain('Usuário inativo');
  });

  it('RBAC/multi-tenant: professor nao acessa APIs admin e admin de outra academia nao altera professor', async () => {
    const createRes = await request(app)
      .post('/api/users/professores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'rbac.prof@test.com',
        password: 'ProfSenha1!',
        fullName: 'Professor RBAC',
      });

    const professorId = createRes.body.professor.id as string;

    const professorLoginRes = await request(app).post('/api/auth/login').send({
      email: 'rbac.prof@test.com',
      password: 'ProfSenha1!',
    });

    const professorToken = professorLoginRes.body.accessToken as string;

    const listAsProfessorRes = await request(app)
      .get('/api/users/professores')
      .set('Authorization', `Bearer ${professorToken}`);

    expect(listAsProfessorRes.status).toBe(403);

    const crossAcademyUpdateRes = await request(app)
      .put(`/api/users/professores/${professorId}`)
      .set('Authorization', `Bearer ${adminTokenB}`)
      .send({
        fullName: 'Tentativa Cross Academy',
      });

    expect(crossAcademyUpdateRes.status).toBe(404);
    expect(crossAcademyUpdateRes.body.error).toBe('Professor não encontrado');
  });
});
