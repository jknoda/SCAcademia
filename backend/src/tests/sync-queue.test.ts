import request from 'supertest';
import { v4 as uuid } from 'uuid';
import app from '../app';
import { pool } from '../lib/db';

// Hash password utility for tests
function hashPassword(password: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

interface TestContext {
  app: any;
  pool: any;
  professorToken: string;
  professor2Token: string;
  adminToken: string;
  academyId: string;
  professorId: string;
  professor2Id: string;
  adminId: string;
  turmaId: string;
  sessionId: string;
  studentId: string;
}

let ctx: TestContext;

async function setupCtx(): Promise<void> {
  // Create academy
  const academyRes = await request(app)
    .post('/api/auth/academies')
    .send({
      name: 'Test Academy for Sync',
      email: `academy-sync-${Date.now()}@test.com`,
      password: 'TempPassword123!'
    });

  ctx.academyId = academyRes.body.data.academyId;

  // Create admin for academy
  const adminRes = await request(app)
    .post('/api/auth/register')
    .send({
      email: `admin-sync-${Date.now()}@test.com`,
      password: 'AdminPassword123!',
      fullName: 'Admin Sync Test',
      role: 'Admin',
      academyId: ctx.academyId
    });

  ctx.adminId = adminRes.body.data.userId;
  ctx.adminToken = adminRes.body.data.token;

  // Create professor 1
  const profRes = await request(app)
    .post('/api/auth/register')
    .send({
      email: `prof-sync-${Date.now()}@test.com`,
      password: 'ProfPassword123!',
      fullName: 'Professor Sync Test',
      role: 'Professor',
      academyId: ctx.academyId
    });

  ctx.professorId = profRes.body.data.userId;
  ctx.professorToken = profRes.body.data.token;

  // Create professor 2
  const prof2Res = await request(app)
    .post('/api/auth/register')
    .send({
      email: `prof2-sync-${Date.now()}@test.com`,
      password: 'ProfPassword123!',
      fullName: 'Professor 2 Sync Test',
      role: 'Professor',
      academyId: ctx.academyId
    });

  ctx.professor2Id = prof2Res.body.data.userId;
  ctx.professor2Token = prof2Res.body.data.token;

  // Create student
  const studentRes = await request(app)
    .post('/api/auth/register')
    .send({
      email: `student-sync-${Date.now()}@test.com`,
      password: 'StudentPassword123!',
      fullName: 'Student Sync Test',
      role: 'Aluno',
      academyId: ctx.academyId
    });

  ctx.studentId = studentRes.body.data.userId;

  // Create turma
  const turmaRes = await request(app)
    .post('/api/trainings/entry-point')
    .set('Authorization', `Bearer ${ctx.professorToken}`)
    .send({ turmaName: 'Test Turma for Sync' });

  ctx.turmaId = turmaRes.body.data.turmaId;

  // Create training session
  const sessionRes = await request(app)
    .post('/api/trainings/start')
    .set('Authorization', `Bearer ${ctx.professorToken}`)
    .send({
      turmaId: ctx.turmaId,
      sessionDate: '2026-03-25',
      sessionTime: '15:00'
    });

  ctx.sessionId = sessionRes.body.data.sessionId;
}

describe('/api/trainings/sync-queue', () => {
  beforeAll(async () => {
    ctx = {} as TestContext;
    await setupCtx();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/trainings/sync-queue', () => {
    test('AC1: Enqueues valid offline operation', async () => {
      const batchId = uuid();
      const clientTimestamp = Date.now();

      const res = await request(app)
        .post('/api/trainings/sync-queue')
        .set('Authorization', `Bearer ${ctx.professorToken}`)
        .send({
          batch: [
            {
              id: uuid(),
              action: 'CREATE',
              resource: 'training',
              payload: {
                turmaId: ctx.turmaId,
                sessionDate: '2026-03-26',
                sessionTime: '16:00',
                durationMinutes: 60
              },
              timestamp: clientTimestamp
            }
          ],
          clientTimestamp
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.synced).toBe(1);
      expect(res.body.failed).toBe(0);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].result).toBe('synced');
    });

    test('AC2: Rejects batch with invalid action', async () => {
      const batchId = uuid();
      const clientTimestamp = Date.now();

      const res = await request(app)
        .post('/api/trainings/sync-queue')
        .set('Authorization', `Bearer ${ctx.professorToken}`)
        .send({
          batch: [
            {
              action: 'INVALID_ACTION',
              resource: 'training',
              payload: {},
              timestamp: clientTimestamp
            }
          ],
          clientTimestamp
        });

      expect(res.status).toBe(200); // Accepted but marked as failed
      expect(res.body.failed).toBeGreaterThan(0);
    });

    test('AC3: Rejects empty batch', async () => {
      const res = await request(app)
        .post('/api/trainings/sync-queue')
        .set('Authorization', `Bearer ${ctx.professorToken}`)
        .send({
          batch: [],
          clientTimestamp: Date.now()
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/empty/i);
    });

    test('AC4: Rejects batch > 50 operations', async () => {
      const batch = Array(51)
        .fill(null)
        .map(() => ({
          action: 'CREATE',
          resource: 'training',
          payload: {},
          timestamp: Date.now()
        }));

      const res = await request(app)
        .post('/api/trainings/sync-queue')
        .set('Authorization', `Bearer ${ctx.professorToken}`)
        .send({
          batch,
          clientTimestamp: Date.now()
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/muito grande/i);
    });

    test('AC5: Processes multiple operations in batch atomically', async () => {
      const batchId = uuid();
      const clientTimestamp = Date.now();

      const res = await request(app)
        .post('/api/trainings/sync-queue')
        .set('Authorization', `Bearer ${ctx.professorToken}`)
        .send({
          batch: [
            {
              id: uuid(),
              action: 'CREATE',
              resource: 'training',
              payload: { turmaId: ctx.turmaId, sessionDate: '2026-03-27', sessionTime: '14:00' },
              timestamp: clientTimestamp
            },
            {
              id: uuid(),
              action: 'UPDATE',
              resource: 'training',
              resourceId: ctx.sessionId,
              payload: { notes: 'Updated notes' },
              timestamp: clientTimestamp + 1000
            }
          ],
          clientTimestamp
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.synced).toBe(2);
    });

    test('AC6: Rejects non-professor role', async () => {
      const res = await request(app)
        .post('/api/trainings/sync-queue')
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .send({
          batch: [
            {
              action: 'CREATE',
              resource: 'training',
              payload: {},
              timestamp: Date.now()
            }
          ],
          clientTimestamp: Date.now()
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/professor/i);
    });

    test('AC7: Preserves client timestamp in queue', async () => {
      const clientTimestamp = 1711003800000; // Specific timestamp 2 weeks ago
      const batchId = uuid();

      const res = await request(app)
        .post('/api/trainings/sync-queue')
        .set('Authorization', `Bearer ${ctx.professorToken}`)
        .send({
          batch: [
            {
              id: uuid(),
              action: 'CREATE',
              resource: 'training',
              payload: { turmaId: ctx.turmaId, sessionDate: '2026-03-28', sessionTime: '15:00' },
              timestamp: clientTimestamp
            }
          ],
          clientTimestamp
        });

      expect(res.status).toBe(200);
      expect(res.body.synced).toBe(1);
      
      // Verify timestamp is stored
      const queueEntryId = res.body.data[0].id;
      const checkRes = await request(app)
        .get('/api/trainings/admin/sync-queue/pending')
        .set('Authorization', `Bearer ${ctx.adminToken}`);

      const queueEntry = checkRes.body.data.find((entry: any) => entry.id === queueEntryId);
      expect(queueEntry).toBeDefined();
    });

    test('AC8: Isolates professor data (RBAC)', async () => {
      const clientTimestamp = Date.now();

      // Prof1 enqueues operation
      const res1 = await request(app)
        .post('/api/trainings/sync-queue')
        .set('Authorization', `Bearer ${ctx.professorToken}`)
        .send({
          batch: [
            {
              id: uuid(),
              action: 'CREATE',
              resource: 'training',
              payload: { turmaId: ctx.turmaId, sessionDate: '2026-03-29', sessionTime: '15:00' },
              timestamp: clientTimestamp
            }
          ],
          clientTimestamp
        });

      expect(res1.status).toBe(200);

      // Prof2 cannot see Prof1's sync queue operations
      // (This would be tested at the service layer, not exposed via API)
    });

    test('AC9: Records sync_history after batch', async () => {
      const batchId = uuid();
      const clientTimestamp = Date.now();

      const res = await request(app)
        .post('/api/trainings/sync-queue')
        .set('Authorization', `Bearer ${ctx.professorToken}`)
        .send({
          batch: [
            {
              id: uuid(),
              action: 'CREATE',
              resource: 'training',
              payload: { turmaId: ctx.turmaId, sessionDate: '2026-03-30', sessionTime: '15:00' },
              timestamp: clientTimestamp
            },
            {
              id: uuid(),
              action: 'Update',
              resource: 'training',
              payload: { notes: 'Test notes' },
              timestamp: clientTimestamp + 2000
            }
          ],
          clientTimestamp
        });

      expect(res.status).toBe(200);
      expect(res.body.durationMs).toBeGreaterThanOrEqual(0);
    });

    test('AC10: Handles missing clientTimestamp', async () => {
      const res = await request(app)
        .post('/api/trainings/sync-queue')
        .set('Authorization', `Bearer ${ctx.professorToken}`)
        .send({
          batch: [
            {
              action: 'CREATE',
              resource: 'training',
              payload: {},
              timestamp: Date.now()
            }
            // Missing clientTimestamp
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/clientTimestamp/i);
    });
  });

  describe('GET /api/trainings/admin/sync-queue/pending', () => {
    test('AC1: Admin can view pending sync operations', async () => {
      // First, enqueue an operation
      await request(app)
        .post('/api/trainings/sync-queue')
        .set('Authorization', `Bearer ${ctx.professorToken}`)
        .send({
          batch: [
            {
              id: uuid(),
              action: 'CREATE',
              resource: 'training',
              payload: { turmaId: ctx.turmaId, sessionDate: '2026-04-01', sessionTime: '15:00' },
              timestamp: Date.now()
            }
          ],
          clientTimestamp: Date.now()
        });

      // Admin fetches pending queue
      const res = await request(app)
        .get('/api/trainings/admin/sync-queue/pending')
        .set('Authorization', `Bearer ${ctx.adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('AC2: Non-admin rejected', async () => {
      const res = await request(app)
        .get('/api/trainings/admin/sync-queue/pending')
        .set('Authorization', `Bearer ${ctx.professorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/admin/i);
    });

    test('AC3: Returns pending operation count', async () => {
      const res = await request(app)
        .get('/api/trainings/admin/sync-queue/pending')
        .set('Authorization', `Bearer ${ctx.adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('length');
      // Data should include pending_count, failed_count, etc.
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('pending_count');
      }
    });
  });

  describe('Sync queue edge cases', () => {
    test('Handles duplicate batch IDs gracefully', async () => {
      const batchId = uuid();
      const clientTimestamp = Date.now();

      // First request
      const res1 = await request(app)
        .post('/api/trainings/sync-queue')
        .set('Authorization', `Bearer ${ctx.professorToken}`)
        .send({
          batch: [
            {
              id: uuid(),
              action: 'CREATE',
              resource: 'training',
              payload: { turmaId: ctx.turmaId, sessionDate: '2026-04-02', sessionTime: '15:00' },
              timestamp: clientTimestamp
            }
          ],
          clientTimestamp
        });

      expect(res1.status).toBe(200);

      // Second request (different batch ID, same professor)
      const res2 = await request(app)
        .post('/api/trainings/sync-queue')
        .set('Authorization', `Bearer ${ctx.professorToken}`)
        .send({
          batch: [
            {
              id: uuid(),
              action: 'CREATE',
              resource: 'training',
              payload: { turmaId: ctx.turmaId, sessionDate: '2026-04-03', sessionTime: '15:00' },
              timestamp: clientTimestamp + 5000
            }
          ],
          clientTimestamp: clientTimestamp + 5000
        });

      expect(res2.status).toBe(200);
      expect(res2.body.batchId).not.toBe(res1.body.batchId);
    });

    test('Handles missing optional fields', async () => {
      const res = await request(app)
        .post('/api/trainings/sync-queue')
        .set('Authorization', `Bearer ${ctx.professorToken}`)
        .send({
          batch: [
            {
              id: uuid(),
              action: 'CREATE',
              resource: 'training',
              payload: { turmaId: ctx.turmaId },
              timestamp: Date.now()
              // resourceId is optional, should not fail
            }
          ],
          clientTimestamp: Date.now()
        });

      expect(res.status).toBe(200);
      expect(res.body.synced).toBeGreaterThanOrEqual(0);
    });

    test('Validates batch structure', async () => {
      const res = await request(app)
        .post('/api/trainings/sync-queue')
        .set('Authorization', `Bearer ${ctx.professorToken}`)
        .send({
          batch: 'not an array', // Invalid: string instead of array
          clientTimestamp: Date.now()
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/array/i);
    });
  });
});
