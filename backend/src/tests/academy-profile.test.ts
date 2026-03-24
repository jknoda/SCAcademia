import request from 'supertest';
import app from '../app';
import { pool } from '../lib/db';

const strongPassword = 'SenhaForte1!';

jest.setTimeout(30000);

describe('Academy Profile API', () => {
  let academyId = '';
  let adminToken = '';
  let professorToken = '';
  let alunoToken = '';

  beforeEach(async () => {
    const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    await request(app).post('/api/auth/test/reset').send({});

    const academyRes = await request(app).post('/api/auth/academies').send({
      name: 'Academia Perfil',
      location: 'São Paulo',
      email: 'contato.perfil@academia.com',
      phone: '11988887777',
    });

    academyId = academyRes.body.academyId as string;

    await request(app)
      .post(`/api/auth/academies/${academyId}/init-admin`)
      .send({
        email: `admin.perfil.${unique}@academia.com`,
        password: strongPassword,
        fullName: 'Admin Perfil',
      });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: `admin.perfil.${unique}@academia.com`, password: strongPassword });

    adminToken = adminLogin.body.accessToken as string;

    const professorRes = await request(app).post('/api/auth/register').send({
      email: `prof.perfil.${unique}@academia.com`,
      password: strongPassword,
      fullName: 'Professor Perfil',
      role: 'Professor',
      academyId,
    });

    professorToken = professorRes.body.accessToken as string;

    const alunoRes = await request(app).post('/api/auth/register').send({
      email: `aluno.perfil.${unique}@academia.com`,
      password: strongPassword,
      fullName: 'Aluno Perfil',
      role: 'Aluno',
      academyId,
    });

    alunoToken = alunoRes.body.accessToken as string;

    expect(adminToken).toBeTruthy();
    expect(professorToken).toBeTruthy();
    expect(alunoToken).toBeTruthy();
  });

  it('AC1: Admin consegue obter perfil completo da academia', async () => {
    const res = await request(app)
      .get('/api/admin/academy-profile')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('academyId', academyId);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('contactEmail');
    expect(res.body).toHaveProperty('documentId');
  });

  it('AC6: Professor recebe 403 ao acessar perfil completo da academia', async () => {
    const res = await request(app)
      .get('/api/admin/academy-profile')
      .set('Authorization', `Bearer ${professorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Acesso negado. Papel insuficiente.');
  });

  it('AC6: Aluno recebe 403 ao acessar perfil completo da academia', async () => {
    const res = await request(app)
      .get('/api/admin/academy-profile')
      .set('Authorization', `Bearer ${alunoToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Acesso negado. Papel insuficiente.');
  });

  it('AC4: Admin atualiza perfil completo com sucesso', async () => {
    const payload = {
      name: 'Academia Perfil Atualizada',
      description: 'Perfil operacional completo',
      documentId: '12.345.678/0001-90',
      contactEmail: 'perfil.atualizado@academia.com',
      contactPhone: '(11) 99888-7777',
      addressStreet: 'Rua das Flores',
      addressNumber: '123',
      addressComplement: 'Sala 2',
      addressNeighborhood: 'Centro',
      addressPostalCode: '01001-000',
      addressCity: 'São Paulo',
      addressState: 'SP',
    };

    const updateRes = await request(app)
      .put('/api/admin/academy-profile')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.message).toBe('Dados da academia atualizados');
    expect(updateRes.body.academy.name).toBe(payload.name);
    expect(updateRes.body.academy.documentId).toBe(payload.documentId);

    const getRes = await request(app)
      .get('/api/admin/academy-profile')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe(payload.name);
    expect(getRes.body.documentId).toBe(payload.documentId);
    expect(getRes.body.addressPostalCode).toBe(payload.addressPostalCode);
  });

  it('AC5: retorna 409 quando documentId já existe em outra academia', async () => {
    await pool.query(
      `INSERT INTO academies (
         academy_id,
         name,
         description,
         document_id,
         contact_email,
         contact_phone,
         created_at,
         updated_at
       ) VALUES (
         'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
         'Outra Academia',
         'Academia usada para conflito de documento',
         '11.111.111/1111-11',
         'outra@academia.com',
         '11900001111',
         NOW(),
         NOW()
       )`
    );

    const res = await request(app)
      .put('/api/admin/academy-profile')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Academia Perfil Atualizada',
        description: 'Atualização com documento duplicado',
        documentId: '11.111.111/1111-11',
        contactEmail: 'perfil.atualizado@academia.com',
        contactPhone: '(11) 92222-2222',
        addressStreet: 'Rua Principal',
        addressNumber: '10',
        addressComplement: '',
        addressNeighborhood: 'Centro',
        addressPostalCode: '01001-000',
        addressCity: 'São Paulo',
        addressState: 'SP',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Documento já cadastrado no sistema');
  });
});
