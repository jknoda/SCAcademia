import request from 'supertest';
import fs from 'fs';
import path from 'path';

import app from '../app';
import { pool } from '../lib/db';

const strongPassword = 'SenhaForte1!';

const ensureAlertSchema = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      log_id BIGSERIAL PRIMARY KEY,
      academy_id UUID NOT NULL,
      resource_type VARCHAR(100) NOT NULL,
      resource_id VARCHAR(100) NOT NULL,
      action VARCHAR(50) NOT NULL,
      actor_user_id UUID NOT NULL,
      changes_json JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS alerts (
      alert_id UUID PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text)::uuid,
      academy_id UUID NOT NULL,
      severity VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      alert_type VARCHAR(100) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      acknowledged_by_user_id UUID,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      acknowledged_at TIMESTAMP,
      resolved_at TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_health (
      health_id BIGSERIAL PRIMARY KEY,
      academy_id UUID NOT NULL,
      component VARCHAR(100) NOT NULL,
      status VARCHAR(50) NOT NULL,
      timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
};

describe('Story 5.4 - Alertas em Tempo Real (Admin)', () => {
  let adminToken = '';
  let academyId = '';
  let adminUserId = '';
  let adminEmail = '';

  const ipBlocklistPath = path.resolve(process.cwd(), 'storage', 'admin-ip-blocklist.json');

  beforeEach(async () => {
    await request(app).post('/api/auth/test/reset').send({});
    if (fs.existsSync(ipBlocklistPath)) {
      fs.unlinkSync(ipBlocklistPath);
    }
    await ensureAlertSchema();

    const unique = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const academyRes = await request(app).post('/api/auth/academies').send({
      name: 'Academia Alertas Admin',
      location: 'Sao Paulo',
      email: `alerts.${unique}@academia.com`,
      phone: '11988887777',
    });

    academyId = academyRes.body.academyId as string;
    adminEmail = `admin.alerts.${unique}@academia.com`;

    await request(app)
      .post(`/api/auth/academies/${academyId}/init-admin`)
      .send({
        email: adminEmail,
        password: strongPassword,
        fullName: 'Admin Alertas',
      });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password: strongPassword,
    });

    adminToken = loginRes.body.accessToken as string;

    const adminRow = await pool.query(
      `SELECT user_id
       FROM users
       WHERE academy_id = $1
         AND role = 'Admin'
       LIMIT 1`,
      [academyId]
    );

    adminUserId = String(adminRow.rows[0]?.user_id || '');
  });

  it('gera alerta de seguranca e expoe feed + contador para admin', async () => {
    await pool.query(
      `INSERT INTO audit_logs (academy_id, resource_type, resource_id, action, actor_user_id, ip_address, timestamp)
       SELECT $1::uuid, 'Auth', $2::text, 'LOGIN_FAILED', $3::uuid, '203.0.113.10', NOW() - (n * INTERVAL '5 minutes')
       FROM generate_series(0, 4) AS n`,
      [academyId, adminUserId, adminUserId]
    );

    const feedRes = await request(app)
      .get('/api/admin/alerts?limit=10&offset=0')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(feedRes.status).toBe(200);
    expect(Array.isArray(feedRes.body.items)).toBe(true);
    expect(feedRes.body.items.length).toBeGreaterThan(0);
    expect(feedRes.body.items[0].title).toBe('ALERTA DE SEGURANCA');

    const countRes = await request(app)
      .get('/api/admin/alerts/count')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(countRes.status).toBe(200);
    expect(countRes.body.critical).toBeGreaterThanOrEqual(1);
    expect(countRes.body.unread).toBeGreaterThanOrEqual(1);
  });

  it('permite reconhecer alerta e salvar preferencias + silenciar por 1h', async () => {
    const created = await pool.query(
      `INSERT INTO alerts (academy_id, severity, title, description, alert_type, status)
       VALUES ($1, 'critical', 'ALERTA DE SEGURANCA', 'Falhas de login detectadas', 'security', 'active')
       RETURNING alert_id`,
      [academyId]
    );

    const alertId = String(created.rows[0].alert_id);

    const actionRes = await request(app)
      .patch(`/api/admin/alerts/${alertId}/action`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'acknowledge' });

    expect(actionRes.status).toBe(200);
    expect(actionRes.body.alert.status).toBe('acknowledged');

    const prefsRes = await request(app)
      .post('/api/admin/alerts/preferences')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        channels: { inApp: true, push: false, email: true },
        severity: { critical: true, preventive: true, informative: false },
        digestWindowMinutes: 30,
      });

    expect(prefsRes.status).toBe(200);
    expect(prefsRes.body.channels.push).toBe(false);
    expect(prefsRes.body.digestWindowMinutes).toBe(30);

    const silenceRes = await request(app)
      .post('/api/admin/alerts/silence')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ durationMinutes: 60 });

    expect(silenceRes.status).toBe(200);
    expect(silenceRes.body.silencedUntil).toBeTruthy();
  });

  it('retorna 400 para alertId inválido no endpoint de ação', async () => {
    const invalidRes = await request(app)
      .patch('/api/admin/alerts/invalid-uuid/action')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'acknowledge' });

    expect(invalidRes.status).toBe(400);
    expect(String(invalidRes.body.error || '')).toContain('UUID');
  });

  it('bloqueia IP a partir de alerta crítico quando ação block-ip é executada', async () => {
    const created = await pool.query(
      `INSERT INTO alerts (academy_id, severity, title, description, alert_type, status)
       VALUES ($1, 'critical', 'ALERTA DE SEGURANCA', 'Detectadas 7 tentativas para o IP 127.0.0.1', 'security', 'active')
       RETURNING alert_id`,
      [academyId]
    );

    const alertId = String(created.rows[0].alert_id);

    const actionRes = await request(app)
      .patch(`/api/admin/alerts/${alertId}/action`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'block-ip' });

    expect(actionRes.status).toBe(200);
    expect(actionRes.body.alert.status).toBe('resolved');
    expect(actionRes.body.blockedIp).toBe('127.0.0.1');

    const blockedLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password: strongPassword,
      });

    expect(blockedLogin.status).toBe(403);
    expect(String(blockedLogin.body.error || '')).toContain('bloqueado');
  });
});
