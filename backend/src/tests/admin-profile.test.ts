import request from 'supertest';
import app from '../app';
import { sign } from '../lib/jwt';

const strongPassword = 'SenhaForte1!';

describe('Story 9.2 - Perfil Completo do Administrador', () => {
  let academyId = '';
  let adminId = '';
  let adminToken = '';
  let adminEmail = '';

  beforeEach(async () => {
    await request(app).post('/api/auth/test/reset').send({});

    const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const academyRes = await request(app).post('/api/auth/academies').send({
      name: 'Academia Perfil Admin',
      location: 'Sao Paulo',
      email: 'perfil.admin@academia.com',
      phone: '11999998888',
    });

    academyId = academyRes.body.academyId as string;
    adminEmail = `admin.perfil.${unique}@academia.com`;

    await request(app)
      .post(`/api/auth/academies/${academyId}/init-admin`)
      .send({
        email: adminEmail,
        password: strongPassword,
        fullName: 'Admin Perfil',
      });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password: strongPassword,
    });

    adminId = loginRes.body.user.id as string;
    adminToken = loginRes.body.accessToken as string;
  });

  it('AC1: carrega perfil completo do admin logado', async () => {
    const res = await request(app)
      .get(`/api/users/${adminId}/profile`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(adminId);
    expect(res.body.email).toBe(adminEmail);
    expect(res.body).toHaveProperty('documentId');
    expect(res.body).toHaveProperty('addressPostalCode');
  });

  it('AC4: atualiza perfil do admin mantendo email inalterado', async () => {
    const payload = {
      fullName: 'Admin Perfil Atualizado',
      documentId: '123.456.789-09',
      birthDate: '1990-08-20',
      phone: '11911112222',
      addressStreet: 'Rua Central',
      addressNumber: '100',
      addressComplement: 'Sala 5',
      addressNeighborhood: 'Centro',
      addressPostalCode: '01001-000',
      addressCity: 'Sao Paulo',
      addressState: 'SP',
    };

    const updateRes = await request(app)
      .put(`/api/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.message).toBe('Perfil atualizado');
    expect(updateRes.body.user.fullName).toBe(payload.fullName);
    expect(updateRes.body.user.email).toBe(adminEmail);

    const profileRes = await request(app)
      .get(`/api/users/${adminId}/profile`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.fullName).toBe(payload.fullName);
    expect(profileRes.body.documentId).toBe(payload.documentId);
    expect(profileRes.body.addressPostalCode).toBe(payload.addressPostalCode);
  });

  it('AC5: bloqueia update cross-academy por isolamento de academy_id', async () => {
    const foreignToken = sign(
      {
        userId: adminId,
        email: adminEmail,
        academyId: '11111111-1111-1111-1111-111111111111',
        role: 'Admin',
      },
      '1h'
    );

    const res = await request(app)
      .put(`/api/users/${adminId}`)
      .set('Authorization', `Bearer ${foreignToken}`)
      .send({
        fullName: 'Tentativa Cross Academy',
        documentId: '123.456.789-09',
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Usuário não encontrado');
  });

  it('AC3: altera senha com sucesso e mantém sessão válida', async () => {
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        currentPassword: strongPassword,
        newPassword: 'NovaSenha1@',
        confirmPassword: 'NovaSenha1@',
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Senha alterada com sucesso');

    const oldLogin = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password: strongPassword,
    });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password: 'NovaSenha1@',
    });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.accessToken).toBeTruthy();
  });

  it('AC3: rejeita troca de senha com senha atual incorreta', async () => {
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        currentPassword: 'SenhaErrada1!',
        newPassword: 'NovaSenha1@',
        confirmPassword: 'NovaSenha1@',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Senha atual incorreta');
  });
});
