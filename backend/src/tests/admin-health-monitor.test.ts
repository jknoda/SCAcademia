import request from 'supertest';

import app from '../app';
import { pool } from '../lib/db';
import { createBackupJob } from '../lib/database';

const strongPassword = 'SenhaForte1!';

const ensureHealthSchema = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      notification_id UUID PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text)::uuid,
      user_id UUID NOT NULL,
      academy_id UUID NOT NULL,
      type VARCHAR(100) NOT NULL,
      title VARCHAR(255),
      message TEXT,
      channels INT NOT NULL DEFAULT 7,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      sent_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      academy_id UUID NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

describe('Story 5.7 - Health Monitor (Admin)', () => {
  let adminToken = '';
  let academyId = '';
  let adminUserId = '';

  beforeEach(async () => {
    await request(app).post('/api/auth/test/reset').send({});
    await ensureHealthSchema();

    const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const academyRes = await request(app).post('/api/auth/academies').send({
      name: 'Academia Health Monitor',
      location: 'Sao Paulo',
      email: `health.${unique}@academia.com`,
      phone: '11988887777',
    });

    academyId = academyRes.body.academyId as string;

    await request(app)
      .post(`/api/auth/academies/${academyId}/init-admin`)
      .send({
        email: `admin.health.${unique}@academia.com`,
        password: strongPassword,
        fullName: 'Admin Health',
      });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: `admin.health.${unique}@academia.com`,
      password: strongPassword,
    });

    adminToken = loginRes.body.accessToken as string;

    const userRes = await pool.query(
      `SELECT user_id
       FROM users
       WHERE academy_id = $1
         AND role = 'Admin'
       LIMIT 1`,
      [academyId]
    );
    adminUserId = String(userRes.rows[0]?.user_id || '');
  });

  it('retorna snapshot de saude com 5 componentes essenciais e series 24h', async () => {
    const res = await request(app)
      .get('/api/admin/health-monitor')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.components)).toBe(true);
    expect(res.body.components.length).toBe(5);
    expect(Array.isArray(res.body.timeseries24h.apiResponseMs)).toBe(true);
    expect(res.body.timeseries24h.apiResponseMs.length).toBe(24);
  });

  it('sinaliza alerta de backup quando ultimo backup falhou', async () => {
    await createBackupJob({
      academyId,
      type: 'manual',
      status: 'failed',
      includeHistory: false,
      isEncrypted: false,
      initiatedBy: adminUserId,
      retentionDays: 30,
    });

    const res = await request(app)
      .get('/api/admin/health-monitor')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const storage = (res.body.components || []).find((component: any) => component.id === 'storage');
    expect(storage).toBeTruthy();
    expect(['warning', 'degraded']).toContain(storage.status);
  });

  it('retorna historico para janela de 30 dias com padroes calculados', async () => {
    const res = await request(app)
      .get('/api/admin/health-monitor/history?window=30d')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.window).toBe('30d');
    expect(Array.isArray(res.body.series.cpuUsage)).toBe(true);
    expect(res.body.series.cpuUsage.length).toBe(30);
    expect(Array.isArray(res.body.patterns)).toBe(true);
    expect(res.body.patterns.length).toBeGreaterThan(0);
  });

  it('retorna 400 para janela invalida no historico', async () => {
    const res = await request(app)
      .get('/api/admin/health-monitor/history?window=invalid')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(String(res.body.error || '')).toContain('window');
  });

  it('bloqueia acesso sem token admin', async () => {
    const res = await request(app).get('/api/admin/health-monitor');
    expect(res.status).toBe(401);
  });
});
