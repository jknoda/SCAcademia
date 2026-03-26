import request from 'supertest';
import app from '../app';
import { pool } from '../lib/db';
import { createUser } from '../lib/database';
import { hashPassword } from '../lib/password';

const strongPassword = 'SenhaForte1!';

process.env['DATA_ENCRYPTION_KEY'] =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

interface TestContext {
  runId: string;
  professor1Token: string;
  professor2Token: string;
  professor1Id: string;
  professor2Id: string;
  academyId: string;
  turmaId: string;
  techniqueId: string;
  sessionId: string;
}

/**
 * TASK 18: Integration tests for training history
 */

describe('Training History API (Story 3-7)', () => {
  let ctx: TestContext;

  const setupCtx = async (): Promise<TestContext> => {
    const runId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Reset database
    await request(app).post('/api/auth/test/reset').send({});

    // Create academy
    const academyRes = await request(app)
      .post('/api/auth/academies')
      .send({
        name: `Test Academy ${runId}`,
        location: 'Rio de Janeiro',
        email: `test.${runId}@academia.com`,
        phone: '21999998888',
      });

    const academyId = academyRes.body.academyId;

    // Initialize admin
    await request(app)
      .post(`/api/auth/academies/${academyId}/init-admin`)
      .send({
        email: `admin.${runId}@academia.com`,
        password: strongPassword,
        fullName: 'Admin Test',
      });

    // Create professor1
    const prof1Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `prof1.${runId}@academia.com`,
        password: strongPassword,
        fullName: 'Professor 1',
        role: 'Professor',
        academyId,
      });

    const professor1Token = prof1Res.body.accessToken;
    const professor1Id = prof1Res.body.user.id;

    // Create professor2
    const prof2Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `prof2.${runId}@academia.com`,
        password: strongPassword,
        fullName: 'Professor 2',
        role: 'Professor',
        academyId,
      });

    const professor2Token = prof2Res.body.accessToken;
    const professor2Id = prof2Res.body.user.id;

    // Create students
    const studentPasswordHash = await hashPassword(strongPassword);
    const studentIds = [];
    for (let i = 0; i < 3; i++) {
      const student = await createUser(
        `student${i}.${runId}@academia.com`,
        `Student ${i}`,
        studentPasswordHash,
        academyId,
        'Aluno'
      );
      studentIds.push(student.id);
    }

    // Create turma (class)
    const turmaRes = await pool.query(
      `INSERT INTO turmas (academy_id, professor_id, name)
       VALUES ($1, $2, $3)
       RETURNING turma_id`,
      [academyId, professor1Id, 'Test Turma']
    );
    const turmaId = turmaRes.rows[0].turma_id;

    // Enroll students in turma
    for (const studentId of studentIds) {
      await pool.query(
        `INSERT INTO turma_students (enrollment_id, turma_id, student_id, academy_id, status, enrolled_at)
         VALUES (gen_random_uuid(), $1, $2, $3, 'active', NOW())`,
        [turmaId, studentId, academyId]
      );
    }

    // Create technique
    const techniqueRes = await pool.query(
      `INSERT INTO techniques (academy_id, name, category)
       VALUES ($1, $2, $3)
       RETURNING technique_id`,
      [academyId, 'Test Technique', 'Test']
    );
    const techniqueId = techniqueRes.rows[0].technique_id;

    // Create a training session
    const sessionRes = await pool.query(
      `INSERT INTO training_sessions (turma_id, professor_id, academy_id, session_date, session_time, duration_minutes, offline_synced_at)
       VALUES ($1, $2, $3, CURRENT_DATE, '15:00:00'::TIME, 60, CURRENT_TIMESTAMP)
       RETURNING session_id`,
      [turmaId, professor1Id, academyId]
    );
    const sessionId = sessionRes.rows[0].session_id;

    // Add attendance records
    for (const studentId of studentIds) {
      await pool.query(
        `INSERT INTO session_attendance (session_id, student_id, academy_id, status, marked_by_user_id)
         VALUES ($1, $2, $3, 'present', $4)`,
        [sessionId, studentId, academyId, professor1Id]
      );
    }

    // Add technique to session
    await pool.query(
      `INSERT INTO session_techniques (session_id, technique_id, academy_id, technique_order)
       VALUES ($1, $2, $3, 1)`,
      [sessionId, techniqueId, academyId]
    );

    return {
      runId,
      professor1Token,
      professor2Token,
      professor1Id,
      professor2Id,
      academyId,
      turmaId,
      techniqueId,
      sessionId
    };
  };

  beforeEach(async () => {
    ctx = await setupCtx();
  });

  afterAll(async () => {
    await request(app).post('/api/auth/test/reset');
  });

  describe('GET /api/trainings/history', () => {
    it('should return history of trainings for professor', async () => {
      const res = await request(app)
        .get('/api/trainings/history')
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trainings).toBeDefined();
      expect(res.body.data.total).toBeGreaterThan(0);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.pageSize).toBe(20);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app)
        .get('/api/trainings/history?limit=5')
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pageSize).toBe(5);
    });

    it('should reject invalid limit', async () => {
      const res = await request(app)
        .get('/api/trainings/history?limit=101')
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid limit');
    });

    it('should reject duplicate limit parameter', async () => {
      const res = await request(app)
        .get('/api/trainings/history?limit=20&limit=30')
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      expect(res.status).toBe(400);
    });

    it('should isolate trainings by professor (RBAC)', async () => {
      const res1 = await request(app)
        .get('/api/trainings/history')
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      const res2 = await request(app)
        .get('/api/trainings/history')
        .set('Authorization', `Bearer ${ctx.professor2Token}`);

      expect(res1.body.data.total).toBeGreaterThan(0);
      expect(res2.body.data.total).toBe(0); // professor2 has no trainings
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/trainings/history');

      expect(res.status).toBe(401);
    });

    it('should support keyword filter', async () => {
      // Update notes
      await pool.query(
        `UPDATE training_sessions SET notes = $1 WHERE session_id = $2`,
        ['Special note here', ctx.sessionId]
      );

      const res = await request(app)
        .get('/api/trainings/history?keyword=Special')
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.trainings.length).toBeGreaterThan(0);
    });

    it('should support turmaId filter', async () => {
      const res = await request(app)
        .get(`/api/trainings/history?turmaId=${ctx.turmaId}`)
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.trainings.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/trainings/:sessionId', () => {
    it('should return training session details', async () => {
      const res = await request(app)
        .get(`/api/trainings/${ctx.sessionId}`)
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.session_id).toBe(ctx.sessionId);
      expect(res.body.data.attendance).toBeDefined();
      expect(Array.isArray(res.body.data.attendance)).toBe(true);
    });

    it('should return 404 for non-existent session', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/trainings/${fakeId}`)
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      expect(res.status).toBe(404);
    });

    it('should return 404 for session owned by another professor', async () => {
      const res = await request(app)
        .get(`/api/trainings/${ctx.sessionId}`)
        .set('Authorization', `Bearer ${ctx.professor2Token}`);

      expect(res.status).toBe(404);
    });

    it('should reject invalid UUID', async () => {
      const res = await request(app)
        .get('/api/trainings/invalid-id')
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/trainings/:sessionId', () => {
    it('should update training notes', async () => {
      const res = await request(app)
        .put(`/api/trainings/${ctx.sessionId}`)
        .set('Authorization', `Bearer ${ctx.professor1Token}`)
        .send({ notes: 'Updated notes' });

      expect(res.status).toBe(200);

      // Verify update
      const checkRes = await request(app)
        .get(`/api/trainings/${ctx.sessionId}`)
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      expect(checkRes.body.data.notes).toBe('Updated notes');
    });

    it('should reject empty update', async () => {
      const res = await request(app)
        .put(`/api/trainings/${ctx.sessionId}`)
        .set('Authorization', `Bearer ${ctx.professor1Token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent session', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .put(`/api/trainings/${fakeId}`)
        .set('Authorization', `Bearer ${ctx.professor1Token}`)
        .send({ notes: 'test' });

      expect(res.status).toBe(404);
    });

    it('should return 404 for session owned by another professor', async () => {
      const res = await request(app)
        .put(`/api/trainings/${ctx.sessionId}`)
        .set('Authorization', `Bearer ${ctx.professor2Token}`)
        .send({ notes: 'test' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/trainings/:sessionId', () => {
    it('should soft-delete training session', async () => {
      const res = await request(app)
        .delete(`/api/trainings/${ctx.sessionId}`)
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.undo_deadline).toBeDefined();

      // Verify soft delete (deleted_at should be set)
      const checkRes = await pool.query(
        `SELECT deleted_at FROM training_sessions WHERE session_id = $1`,
        [ctx.sessionId]
      );
      expect(checkRes.rows[0].deleted_at).not.toBeNull();
    });

    it('should return 404 for non-existent session', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .delete(`/api/trainings/${fakeId}`)
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      expect(res.status).toBe(404);
    });

    it('should return 404 for session owned by another professor', async () => {
      const res = await request(app)
        .delete(`/api/trainings/${ctx.sessionId}`)
        .set('Authorization', `Bearer ${ctx.professor2Token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/trainings/:sessionId/restore', () => {
    it('should restore soft-deleted training session', async () => {
      // First delete
      await request(app)
        .delete(`/api/trainings/${ctx.sessionId}`)
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      // Then restore
      const res = await request(app)
        .patch(`/api/trainings/${ctx.sessionId}/restore`)
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      expect(res.status).toBe(200);

      // Verify restore (deleted_at should be NULL)
      const checkRes = await pool.query(
        `SELECT deleted_at FROM training_sessions WHERE session_id = $1`,
        [ctx.sessionId]
      );
      expect(checkRes.rows[0].deleted_at).toBeNull();
    });

    it('should return 404 if session not deleted', async () => {
      // Try to restore without deleting first
      const res = await request(app)
        .patch(`/api/trainings/${ctx.sessionId}/restore`)
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      expect(res.status).toBe(404);
    });

    it('should return 404 for session owned by another professor', async () => {
      // Delete with professor1
      await request(app)
        .delete(`/api/trainings/${ctx.sessionId}`)
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      // Try to restore with professor2
      const res = await request(app)
        .patch(`/api/trainings/${ctx.sessionId}/restore`)
        .set('Authorization', `Bearer ${ctx.professor2Token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Soft-delete filter verification', () => {
    it('should not list soft-deleted trainings', async () => {
      // Delete training
      await request(app)
        .delete(`/api/trainings/${ctx.sessionId}`)
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      // List should not include deleted training
      const res = await request(app)
        .get('/api/trainings/history')
        .set('Authorization', `Bearer ${ctx.professor1Token}`);

      const ids = res.body.data.trainings.map((t: any) => t.session_id);
      expect(ids).not.toContain(ctx.sessionId);
    });
  });
});
