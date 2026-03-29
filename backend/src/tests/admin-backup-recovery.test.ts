import fs from 'fs';
import path from 'path';
import request from 'supertest';
import app from '../app';
import { pool } from '../lib/db';
import { runStartupSchemaChecks } from '../lib/startupSchema';

const strongPassword = 'AdminSenha1!';

const binaryParser = (res: any, callback: (err: Error | null, body?: Buffer) => void): void => {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
};

const cleanupStorageArtifacts = async (): Promise<void> => {
  const backupsDir = path.resolve(process.cwd(), 'storage', 'backups');
  const schedulesFile = path.resolve(process.cwd(), 'storage', 'backup-schedules.json');

  await fs.promises.rm(backupsDir, { recursive: true, force: true });
  await fs.promises.rm(schedulesFile, { force: true });
};

const bootstrapAdmin = async (suffix: string, label: string): Promise<{ academyId: string; adminToken: string; adminId: string; adminEmail: string }> => {
  const academyRes = await request(app).post('/api/auth/academies').send({
    name: `Academia ${label}`,
    location: 'Sao Paulo',
    email: `${label.toLowerCase()}.${suffix}@academia.com`,
    phone: '11999999999',
  });

  const academyId = academyRes.body.academyId as string;
  const adminEmail = `admin.${label.toLowerCase()}.${suffix}@academia.com`;

  await request(app).post(`/api/auth/academies/${academyId}/init-admin`).send({
    email: adminEmail,
    password: strongPassword,
    fullName: `Admin ${label}`,
  });

  const loginRes = await request(app).post('/api/auth/login').send({
    email: adminEmail,
    password: strongPassword,
  });

  return {
    academyId,
    adminToken: loginRes.body.accessToken as string,
    adminId: loginRes.body.user?.id as string,
    adminEmail,
  };
};

const waitForJobCompletion = async (
  token: string,
  jobId: string,
  maxAttempts = 120,
  intervalMs = 250
): Promise<any> => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const res = await request(app)
      .get(`/api/admin/backup/jobs/${jobId}`)
      .set('Authorization', `Bearer ${token}`);

    if (res.body?.job?.status === 'completed' || res.body?.job?.status === 'failed') {
      return res.body.job;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Job ${jobId} não concluiu a tempo (${maxAttempts} tentativas)`);
};

describe('Story 5.6 - Backup & Recovery (Admin)', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/test/reset').send({});
    await runStartupSchemaChecks();
    await cleanupStorageArtifacts();
  });

  it('dispara backup manual, acompanha status e baixa gzip válido', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const ctx = await bootstrapAdmin(suffix, 'BackupA');

    const triggerRes = await request(app)
      .post('/api/admin/backup/trigger')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ includeHistory: true, isEncrypted: false });

    expect(triggerRes.status).toBe(202);
    expect(triggerRes.body).toHaveProperty('jobId');

    const job = await waitForJobCompletion(ctx.adminToken, triggerRes.body.jobId as string);
    expect(job.status).toBe('completed');
    expect(job.fileName).toContain('.sql.gz');

    const downloadRes = await request(app)
      .get(`/api/admin/backup/download/${job.id}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .buffer(true)
      .parse(binaryParser);

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers['content-type']).toContain('application/gzip');
    expect(downloadRes.headers['content-disposition']).toContain('.sql.gz');
    expect(Buffer.isBuffer(downloadRes.body)).toBe(true);
    expect(downloadRes.body[0]).toBe(0x1f);
    expect(downloadRes.body[1]).toBe(0x8b);
  });

  it('gera backup criptografado, verifica integridade e baixa arquivo .enc', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const ctx = await bootstrapAdmin(suffix, 'BackupEnc');

    const triggerRes = await request(app)
      .post('/api/admin/backup/trigger')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ includeHistory: false, isEncrypted: true, encryptionPassword: 'Cripto@123' });

    const job = await waitForJobCompletion(ctx.adminToken, triggerRes.body.jobId as string);
    expect(job.status).toBe('completed');
    expect(job.fileName).toContain('.enc');

    const verifyRes = await request(app)
      .post(`/api/admin/backup/verify/${job.id}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({});

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.valid).toBe(true);
    expect(verifyRes.body.sizeBytes).toBeGreaterThan(0);

    const downloadRes = await request(app)
      .get(`/api/admin/backup/download/${job.id}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .buffer(true)
      .parse(binaryParser);

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers['content-disposition']).toContain('.sql.gz.enc');
    expect(downloadRes.body.length).toBeGreaterThan(0);
  });

  it('bloqueia restore com senha errada e aceita restore com senha correta', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const ctx = await bootstrapAdmin(suffix, 'Restore');

    const triggerRes = await request(app)
      .post('/api/admin/backup/trigger')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ includeHistory: true, isEncrypted: false });

    const job = await waitForJobCompletion(ctx.adminToken, triggerRes.body.jobId as string);

    const wrongPasswordRes = await request(app)
      .post(`/api/admin/backup/restore/${job.id}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ adminPassword: 'SenhaErrada1!' });

    expect(wrongPasswordRes.status).toBe(401);

    const okRes = await request(app)
      .post(`/api/admin/backup/restore/${job.id}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ adminPassword: strongPassword });

    expect(okRes.status).toBe(202);
    expect(okRes.body.message).toContain('Restore iniciado');

    await waitForJobCompletion(ctx.adminToken, job.id);
  });

  it('retorna 410 quando download expirou', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const ctx = await bootstrapAdmin(suffix, 'Expire');

    const triggerRes = await request(app)
      .post('/api/admin/backup/trigger')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ includeHistory: true, isEncrypted: false });

    const job = await waitForJobCompletion(ctx.adminToken, triggerRes.body.jobId as string);

    await pool.query(
      `UPDATE backup_jobs
       SET download_expires_at = NOW() - INTERVAL '1 hour'
       WHERE backup_job_id = $1`,
      [job.id]
    );

    const downloadRes = await request(app)
      .get(`/api/admin/backup/download/${job.id}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(downloadRes.status).toBe(410);
  });

  it('aplica isolamento multi-tenant no acesso aos backups', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const academyA = await bootstrapAdmin(suffix, 'TenantA');
    const academyB = await bootstrapAdmin(`${suffix}-b`, 'TenantB');

    const triggerRes = await request(app)
      .post('/api/admin/backup/trigger')
      .set('Authorization', `Bearer ${academyA.adminToken}`)
      .send({ includeHistory: false, isEncrypted: false });

    const job = await waitForJobCompletion(academyA.adminToken, triggerRes.body.jobId as string);

    const foreignStatusRes = await request(app)
      .get(`/api/admin/backup/jobs/${job.id}`)
      .set('Authorization', `Bearer ${academyB.adminToken}`);

    expect(foreignStatusRes.status).toBe(404);
  });

  it('salva e consulta agendamento de backup', async () => {
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const ctx = await bootstrapAdmin(suffix, 'Schedule');

    const saveRes = await request(app)
      .put('/api/admin/backup/schedule')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ hour: 3, minute: 15, enabled: true, retentionDays: 45 });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.hour).toBe(3);
    expect(saveRes.body.minute).toBe(15);
    expect(saveRes.body.retentionDays).toBe(45);

    const getRes = await request(app)
      .get('/api/admin/backup/schedule')
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.hour).toBe(3);
    expect(getRes.body.minute).toBe(15);
    expect(getRes.body.retentionDays).toBe(45);
  });
});