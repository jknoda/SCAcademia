import request from 'supertest';

import app from '../app';
import { pool } from '../lib/db';

const strongPassword = 'SenhaForte1!';

const ensureTestSchema = async (): Promise<void> => {
  await pool.query(`ALTER TABLE academies ADD COLUMN IF NOT EXISTS fantasy_name TEXT`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS deletion_requests (
      deletion_request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      academy_id UUID NOT NULL,
      student_id UUID NOT NULL,
      requested_by_id UUID NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      reason TEXT,
      requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
      deletion_scheduled_at TIMESTAMP NOT NULL,
      processed_at TIMESTAMP,
      processed_by_id UUID
    )
  `);
};

describe('Story 5.1 - Dashboard Administrativo', () => {
  let adminToken = '';

  beforeEach(async () => {
    await request(app).post('/api/auth/test/reset').send({});
    await ensureTestSchema();
    await pool.query('TRUNCATE TABLE deletion_requests');

    const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const academyRes = await request(app).post('/api/auth/academies').send({
      name: 'Academia Dashboard Admin',
      location: 'Sao Paulo',
      email: `dashboard.${unique}@academia.com`,
      phone: '11988887777',
    });

    const academyId = academyRes.body.academyId as string;
    const adminEmail = `admin.dashboard.${unique}@academia.com`;

    await request(app)
      .post(`/api/auth/academies/${academyId}/init-admin`)
      .send({
        email: adminEmail,
        password: strongPassword,
        fullName: 'Admin Dashboard',
      });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password: strongPassword,
    });

    adminToken = loginRes.body.accessToken as string;
  });

  it('retorna o resumo executivo agregado para administradores autenticados', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('statusLabel');
    expect(res.body).toHaveProperty('title', 'Saude da Academia');
    expect(res.body).toHaveProperty('complianceScore');
    expect(res.body).toHaveProperty('metrics');
    expect(res.body.metrics).toHaveProperty('usersActive');
    expect(res.body.metrics).toHaveProperty('consents');
    expect(res.body.metrics).toHaveProperty('trainingsMonth');
    expect(res.body.metrics).toHaveProperty('backup');
    expect(Array.isArray(res.body.alerts)).toBe(true);
    expect(res.body).toHaveProperty('systemStatus');
    expect(Array.isArray(res.body.systemStatus.history7d)).toBe(true);
    expect(res.body.systemStatus.history7d.length).toBe(7);
  });

  it('bloqueia acesso sem autenticacao', async () => {
    const res = await request(app).get('/api/admin/dashboard');

    expect(res.status).toBe(401);
  });
});