import request from 'supertest';
import { pool } from '../lib/db';
import app from '../app';
import { createUser } from '../lib/database';
import { hashPassword } from '../lib/password';

const strongPassword = 'SenhaForte1!';

jest.setTimeout(20000);

interface ComplianceTestContext {
  academyId: string;
  adminId: string;
  adminEmail: string;
  adminToken: string;
  studentId: string;
  studentEmail: string;
}

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
};

/**
 * Setup test data using API endpoints (follows pattern from deletion-lgpd.test.ts)
 */
const setupComplianceContext = async (): Promise<ComplianceTestContext> => {
  // Reset test database
  await request(app).post('/api/auth/test/reset').send({});
  await ensureDeletionRequestsTable();
  await pool.query('TRUNCATE TABLE deletion_requests');

  // Create academy via API
  const academyRes = await request(app).post('/api/auth/academies').send({
    name: 'Academia Conformidade LGPD',
    location: 'Sao Paulo',
    email: 'compliance@academia.com',
    phone: '11988887777',
  });
  const academyId = academyRes.body.academyId as string;

  // Initialize admin
  const adminEmail = 'admin.compliance@academia.com';
  await request(app)
    .post(`/api/auth/academies/${academyId}/init-admin`)
    .send({
      email: adminEmail,
      password: strongPassword,
      fullName: 'Admin Compliance',
    });

  // Login as admin
  const adminLogin = await request(app).post('/api/auth/login').send({
    email: adminEmail,
    password: strongPassword,
  });
  const adminToken = adminLogin.body.accessToken as string;
  const adminId = adminLogin.body.user?.id as string;

  // Create test student
  const studentEmail = 'student.compliance@academia.com';
  const studentPasswordHash = await hashPassword(strongPassword);
  const student = await createUser(
    studentEmail,
    'Student Compliance',
    studentPasswordHash,
    academyId,
    'Aluno'
  );
  const studentId = student.id;

  // Create consent record for student
  await pool.query(
    `INSERT INTO consents (
       consent_id,
       user_id,
       academy_id,
       consent_template_version,
       consent_type,
       status,
       signature_image,
       signed_by_user_id,
       guardian_id,
       signed_at,
       created_at
     )
     VALUES (gen_random_uuid(), $1, $2, 1.0, $3, 'accepted', NULL, NULL, NULL, NOW(), NOW())`,
    [studentId, academyId, 'health']
  );

  // Create audit log
  await pool.query(
    `INSERT INTO audit_logs (
       academy_id,
       resource_type,
       resource_id,
       action,
       actor_user_id,
       changes_json,
       ip_address,
       timestamp,
       retention_until
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW() + INTERVAL '7 years')`,
    [academyId, 'User', adminId, 'USER_LOGIN', adminId, JSON.stringify({ success: true }), '127.0.0.1']
  );

  return {
    academyId,
    adminId,
    adminEmail,
    adminToken,
    studentId,
    studentEmail,
  };
};

describe('Compliance Report Generation (Story 2.6)', () => {
  let ctx: ComplianceTestContext;
  let latestReportId = '';

  beforeAll(async () => {
    ctx = await setupComplianceContext();
  });

  describe('Task 1 - Backend: Endpoint de geração de relatório', () => {
    it('AC1: Should generate report and return AC2 sections (6 sections structured data)', async () => {
      const response = await request(app)
        .post('/api/admin/compliance-report/generate')
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('report');
      expect(response.body).toHaveProperty('pdfUrl');

      const report = response.body.report;

      // AC2: Verify 6 sections exist
      expect(report).toHaveProperty('statistics');
      expect(report).toHaveProperty('consents');
      expect(report).toHaveProperty('deletions');
      expect(report).toHaveProperty('audit');
      expect(report).toHaveProperty('alerts');

      // Section 1: Estatísticas Gerais
      expect(report.statistics).toHaveProperty('totalStudents');
      expect(report.statistics).toHaveProperty('minorStudents');
      expect(report.statistics).toHaveProperty('adultStudents');
      expect(report.statistics).toHaveProperty('consentedStudents');
      expect(report.statistics).toHaveProperty('expiredConsentCount');
      expect(report.statistics.totalStudents).toBeGreaterThanOrEqual(1);

      // Section 2: Consentimentos
      expect(report.consents).toHaveProperty('versions');
      expect(report.consents).toHaveProperty('totalConsentApproved');
      expect(report.consents).toHaveProperty('totalConsentPending');
      expect(Array.isArray(report.consents.versions)).toBe(true);

      // Section 3: Dados Deletados
      expect(report.deletions).toHaveProperty('processedRequests');
      expect(report.deletions).toHaveProperty('pendingRequests');
      expect(report.deletions).toHaveProperty('totalHardDeleted');

      // Section 4: Auditoria
      expect(report.audit).toHaveProperty('last90DaysAccess');
      expect(report.audit).toHaveProperty('unauthorizedAttempts');
      expect(report.audit).toHaveProperty('anomalies');
      expect(Array.isArray(report.audit.anomalies)).toBe(true);

      // Section 5-6: Alerts and metadata
      expect(Array.isArray(report.alerts)).toBe(true);
      expect(report).toHaveProperty('generatedAt');
      expect(report).toHaveProperty('academyId', ctx.academyId);
      expect(report).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('reportId');

      latestReportId = response.body.reportId as string;
    });

    it('AC4: Should include alerts for expired consents', async () => {
      // Create expired consent
      await pool.query(
        `INSERT INTO consents (
           consent_id,
           user_id,
           academy_id,
           consent_template_version,
           consent_type,
           status,
           signature_image,
           signed_by_user_id,
           guardian_id,
           signed_at,
           expires_at,
           created_at
         )
         VALUES (gen_random_uuid(), $1, $2, 1.0, $3, 'accepted', NULL, NULL, NULL, NOW(), NOW() - INTERVAL '1 day', NOW())`,
        [ctx.studentId, ctx.academyId, 'privacy']
      );

      const response = await request(app)
        .post('/api/admin/compliance-report/generate')
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .expect(200);

      const report = response.body.report;

      // Verify alerts exist and contain expired consent message
      expect(report.alerts.length).toBeGreaterThan(0);
      const expiredAlert = report.alerts.find(
        (alert: any) => alert.message.includes('consentimento expirado')
      );
      expect(expiredAlert).toBeDefined();
      expect(expiredAlert?.severity).toBe('high');
      expect(expiredAlert?.recommendation).toContain('Contate responsáveis');
    });

    it('Should deny access if user is not Admin', async () => {
      // Create a non-admin user (Professor)
      const profEmail = 'prof.compliance@academia.com';
      const profPasswordHash = await hashPassword(strongPassword);
      await createUser(
        profEmail,
        'Professor Compliance',
        profPasswordHash,
        ctx.academyId,
        'Professor'
      );

      const profLogin = await request(app).post('/api/auth/login').send({
        email: profEmail,
        password: strongPassword,
      });
      const profToken = profLogin.body.accessToken as string;

      await request(app)
        .post('/api/admin/compliance-report/generate')
        .set('Authorization', `Bearer ${profToken}`)
        .expect(403);
    });

    it('Should return 401 if no token provided', async () => {
      await request(app)
        .post('/api/admin/compliance-report/generate')
        .expect(401);
    });

    it('Should include metadata: generatedAt, version, academyId', async () => {
      const response = await request(app)
        .post('/api/admin/compliance-report/generate')
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .expect(200);

      const report = response.body.report;

      expect(report.generatedAt).toBeDefined();
      expect(new Date(report.generatedAt)).toBeInstanceOf(Date);
      expect(report.version).toBe('1.0.0');
      expect(report.academyId).toBe(ctx.academyId);
    });
  });

  describe('Task 5 - Frontend Integration: Status endpoint', () => {
    it('Should return compliance report status for Admin', async () => {
      const response = await request(app)
        .get('/api/admin/compliance-report/status')
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('latestReport');
    });

    it('Should list generated report history', async () => {
      const response = await request(app)
        .get('/api/admin/compliance-report/history')
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.reports)).toBe(true);
      expect(response.body.reports.length).toBeGreaterThan(0);
      expect(response.body.reports[0]).toHaveProperty('signatureHash');
      expect(response.body.reports[0]).toHaveProperty('filePath');
    });

    it('Should download generated PDF report', async () => {
      const response = await request(app)
        .get(`/api/admin/compliance-report/download/${latestReportId}`)
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .expect(200);

      expect(String(response.header['content-type'] || '')).toContain('application/pdf');
    });

    it('Should save and return monthly schedule configuration', async () => {
      const saveResponse = await request(app)
        .post('/api/admin/compliance-report/schedule')
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .send({
          dayOfMonth: 1,
          hour: 8,
          minute: 30,
          enabled: true,
        })
        .expect(200);

      expect(saveResponse.body).toHaveProperty('schedule');
      expect(saveResponse.body.schedule.dayOfMonth).toBe(1);
      expect(saveResponse.body.schedule.hour).toBe(8);
      expect(saveResponse.body.schedule.minute).toBe(30);

      const fetchResponse = await request(app)
        .get('/api/admin/compliance-report/schedule')
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .expect(200);

      expect(fetchResponse.body.schedule).toBeDefined();
      expect(fetchResponse.body.schedule.frequency).toBe('monthly');
      expect(fetchResponse.body.schedule.nextRunAt).toBeDefined();
    });
  });
});
