import request from 'supertest';
import app from '../app';
import { pool } from '../lib/db';
import { createUser } from '../lib/database';
import { hashPassword } from '../lib/password';

const strongPassword = 'SenhaForte1!';

const ensureDeletionRequestsTable = async (): Promise<void> => {
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

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_deletion_requests_status_scheduled
    ON deletion_requests(status, deletion_scheduled_at)
  `);
};

type TestContext = {
  academyId: string;
  adminToken: string;
  responsavelToken: string;
  studentId: string;
  responsavelId: string;
};

const setupDeletionContext = async (): Promise<TestContext> => {
  await request(app).post('/api/auth/test/reset').send({});
  await ensureDeletionRequestsTable();
  await pool.query('TRUNCATE TABLE deletion_requests');

  const academyRes = await request(app).post('/api/auth/academies').send({
    name: 'Academia Delecao LGPD',
    location: 'Sao Paulo',
    email: 'lgpd@academia.com',
    phone: '11988887777',
  });
  const academyId = academyRes.body.academyId as string;

  await request(app)
    .post(`/api/auth/academies/${academyId}/init-admin`)
    .send({
      email: 'admin.delecao@academia.com',
      password: strongPassword,
      fullName: 'Admin Delecao',
    });

  const adminLogin = await request(app).post('/api/auth/login').send({
    email: 'admin.delecao@academia.com',
    password: strongPassword,
  });
  const adminToken = adminLogin.body.accessToken as string;

  const responsavelPasswordHash = await hashPassword(strongPassword);
  const responsavel = await createUser(
    'responsavel.delecao@academia.com',
    'Responsavel Delecao',
    responsavelPasswordHash,
    academyId,
    'Responsavel'
  );

  const studentPasswordHash = await hashPassword(strongPassword);
  const student = await createUser(
    'aluno.delecao@academia.com',
    'Aluno Delecao',
    studentPasswordHash,
    academyId,
    'Aluno'
  );

  await pool.query(
    `INSERT INTO student_guardians (academy_id, student_id, guardian_id, relationship, is_primary)
     VALUES ($1, $2, $3, $4, true)`,
    [academyId, student.id, responsavel.id, 'Mae']
  );

  const respLogin = await request(app).post('/api/auth/login').send({
    email: responsavel.email,
    password: strongPassword,
  });

  return {
    academyId,
    adminToken,
    responsavelToken: respLogin.body.accessToken as string,
    studentId: student.id,
    responsavelId: responsavel.id,
  };
};

describe('Direito ao Esquecimento (LGPD) — Story 2.5', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupDeletionContext();
  });

  afterAll(async () => {
    await request(app).post('/api/auth/test/reset').send({});
  });

  it('lista filhos vinculados para Responsavel', async () => {
    const res = await request(app)
      .get('/api/users/students/linked')
      .set('Authorization', `Bearer ${ctx.responsavelToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.students)).toBe(true);
    expect(res.body.students).toHaveLength(1);
    expect(res.body.students[0].studentId).toBe(ctx.studentId);
    expect(res.body.students[0].studentName).toBe('Aluno Delecao');
  });

  it('retorna 403 quando Admin tenta listar filhos vinculados de Responsavel', async () => {
    const res = await request(app)
      .get('/api/users/students/linked')
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/papel insuficiente/i);
  });

  it('retorna erro semantico explicito quando nao existe solicitacao de delecao', async () => {
    const res = await request(app)
      .get(`/api/users/students/${ctx.studentId}/deletion-status`)
      .set('Authorization', `Bearer ${ctx.responsavelToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/nenhuma solicitação de deleção encontrada/i);
  });

  it('permite solicitar e cancelar delecao durante janela de graca', async () => {
    const requestRes = await request(app)
      .post(`/api/users/students/${ctx.studentId}/deletion-request`)
      .set('Authorization', `Bearer ${ctx.responsavelToken}`)
      .send({ reason: 'Solicitacao de teste' });

    expect(requestRes.status).toBe(201);
    expect(requestRes.body.request.status).toBe('pending');

    const requestId = requestRes.body.request.deletionRequestId as string;

    const cancelRes = await request(app)
      .delete(`/api/admin/deletion-requests/${requestId}`)
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.message).toMatch(/cancelada com sucesso/i);

    const statusRes = await request(app)
      .get(`/api/users/students/${ctx.studentId}/deletion-status`)
      .set('Authorization', `Bearer ${ctx.responsavelToken}`);

    expect(statusRes.status).toBe(404);
    expect(statusRes.body.error).toMatch(/nenhuma solicitação de deleção encontrada/i);
  });

  it('processa solicitacoes vencidas e bloqueia acesso ao perfil do aluno deletado', async () => {
    const requestRes = await request(app)
      .post(`/api/users/students/${ctx.studentId}/deletion-request`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ reason: 'Expiracao para processamento' });

    expect(requestRes.status).toBe(201);

    const requestId = requestRes.body.request.deletionRequestId as string;

    await pool.query(
      `UPDATE deletion_requests
       SET deletion_scheduled_at = NOW() - INTERVAL '1 minute'
       WHERE deletion_request_id = $1`,
      [requestId]
    );

    const processRes = await request(app)
      .post('/api/admin/deletion-requests/process-due')
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(processRes.status).toBe(200);
    expect(processRes.body.processedCount).toBeGreaterThanOrEqual(1);

    const profileRes = await request(app)
      .get(`/api/users/${ctx.studentId}/profile`)
      .set('Authorization', `Bearer ${ctx.adminToken}`);

    expect(profileRes.status).toBe(410);
    expect(profileRes.body.error).toMatch(/perfil deletado em/i);
  });
});
