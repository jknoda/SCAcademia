import request from 'supertest';
import app from '../app';

const adminPassword = 'AdminSenha1!';

describe('Story 5.5 - Gestao Unificada de Usuarios (Admin)', () => {
  let academyIdA = '';
  let academyIdB = '';
  let adminTokenA = '';
  let adminTokenB = '';

  beforeEach(async () => {
    await request(app).post('/api/auth/test/reset').send({});

    const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const academyARes = await request(app).post('/api/auth/academies').send({
      name: 'Academia Gestao A',
      location: 'Sao Paulo',
      email: `academia.gestao.a.${suffix}@test.com`,
      phone: '11999999999',
    });
    academyIdA = academyARes.body.academyId as string;

    const academyBRes = await request(app).post('/api/auth/academies').send({
      name: 'Academia Gestao B',
      location: 'Rio de Janeiro',
      email: `academia.gestao.b.${suffix}@test.com`,
      phone: '21999999999',
    });
    academyIdB = academyBRes.body.academyId as string;

    const adminEmailA = `admin.gestao.a.${suffix}@test.com`;
    await request(app).post(`/api/auth/academies/${academyIdA}/init-admin`).send({
      email: adminEmailA,
      password: adminPassword,
      fullName: 'Admin A',
    });

    const loginA = await request(app).post('/api/auth/login').send({
      email: adminEmailA,
      password: adminPassword,
    });
    adminTokenA = loginA.body.accessToken as string;

    const adminEmailB = `admin.gestao.b.${suffix}@test.com`;
    await request(app).post(`/api/auth/academies/${academyIdB}/init-admin`).send({
      email: adminEmailB,
      password: adminPassword,
      fullName: 'Admin B',
    });

    const loginB = await request(app).post('/api/auth/login').send({
      email: adminEmailB,
      password: adminPassword,
    });
    adminTokenB = loginB.body.accessToken as string;
  });

  it('lista usuarios com paginacao e filtros', async () => {
    await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminTokenA}`)
      .send({
        email: 'prof.list@test.com',
        fullName: 'Professor Lista',
        role: 'Professor',
        sendInvite: false,
      })
      .expect(201);

    await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminTokenA}`)
      .send({
        email: 'aluno.list@test.com',
        fullName: 'Aluno Lista',
        role: 'Aluno',
        sendInvite: false,
      })
      .expect(201);

    const allRes = await request(app)
      .get('/api/admin/users?page=1&limit=20')
      .set('Authorization', `Bearer ${adminTokenA}`)
      .expect(200);

    expect(allRes.body.pagination.limit).toBe(20);
    expect(allRes.body.pagination.total).toBeGreaterThanOrEqual(3);

    const byRoleRes = await request(app)
      .get('/api/admin/users?role=Professor')
      .set('Authorization', `Bearer ${adminTokenA}`)
      .expect(200);

    expect(byRoleRes.body.users.some((u: any) => u.role === 'Professor')).toBe(true);

    const bySearchRes = await request(app)
      .get('/api/admin/users?search=aluno')
      .set('Authorization', `Bearer ${adminTokenA}`)
      .expect(200);

    expect(bySearchRes.body.users.some((u: any) => String(u.fullName).toLowerCase().includes('aluno'))).toBe(true);
  });

  it('cria usuario com convite, atualiza role/status e bloqueia login quando inativo', async () => {
    const createRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminTokenA}`)
      .send({
        email: 'convite.user@test.com',
        fullName: 'Usuario Convite',
        role: 'Aluno',
        sendInvite: true,
      })
      .expect(201);

    expect(createRes.body.user.email).toBe('convite.user@test.com');
    expect(createRes.body.inviteSent).toBeDefined();
    expect(createRes.body.inviteLink).toContain('/reset-password?token=');

    const userId = createRes.body.user.id as string;

    const roleUpdateRes = await request(app)
      .put(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminTokenA}`)
      .send({ role: 'Professor', reason: 'Promocao de acesso' })
      .expect(200);

    expect(roleUpdateRes.body.user.role).toBe('Professor');

    const statusUpdateRes = await request(app)
      .put(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminTokenA}`)
      .send({ isActive: false, reason: 'Seguranca' })
      .expect(200);

    expect(statusUpdateRes.body.user.isActive).toBe(false);

    const loginBlocked = await request(app).post('/api/auth/login').send({
      email: 'convite.user@test.com',
      password: 'SenhaInexistente1@',
    });

    expect(loginBlocked.status).toBe(403);
  });

  it('realiza soft delete e remove acesso ao login', async () => {
    const createRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminTokenA}`)
      .send({
        email: 'deletar.user@test.com',
        fullName: 'Usuario Deletado',
        role: 'Aluno',
        sendInvite: false,
      })
      .expect(201);

    const userId = createRes.body.user.id as string;

    const deleteRes = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminTokenA}`)
      .send({ reason: 'Saiu da academia' })
      .expect(200);

    expect(deleteRes.body.user.deletedAt).toBeTruthy();

    const listRes = await request(app)
      .get('/api/admin/users?search=deletado')
      .set('Authorization', `Bearer ${adminTokenA}`)
      .expect(200);

    expect(listRes.body.users.some((u: any) => u.id === userId)).toBe(false);

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'deletar.user@test.com',
      password: 'SenhaInexistente1@',
    });

    expect(loginRes.status).toBe(401);
  });

  it('exporta CSV e aplica isolamento multi-tenant', async () => {
    const createRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminTokenA}`)
      .send({
        email: 'tenant.user@test.com',
        fullName: 'Tenant User',
        role: 'Professor',
        sendInvite: false,
      })
      .expect(201);

    const userId = createRes.body.user.id as string;

    const exportRes = await request(app)
      .get('/api/admin/users/export?status=active')
      .set('Authorization', `Bearer ${adminTokenA}`)
      .expect(200);

    expect(String(exportRes.headers['content-type'] || '')).toContain('text/csv');
    expect(String(exportRes.headers['content-disposition'] || '')).toContain('Usuarios_');

    const crossTenantUpdate = await request(app)
      .put(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminTokenB}`)
      .send({ fullName: 'Tentativa Cross Tenant' })
      .expect(404);

    expect(crossTenantUpdate.body.error).toBe('Usuário não encontrado');
  });
});
