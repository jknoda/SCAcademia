import request from 'supertest';
import app from '../app';
import { pool } from '../lib/db';
import { createUser } from '../lib/database';
import { hashPassword } from '../lib/password';

const strongPassword = 'SenhaForte1!';

process.env['DATA_ENCRYPTION_KEY'] =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('Athlete Progress API (Story 10-1)', () => {
  let academyId = '';
  let otherAcademyId = '';
  let professorToken = '';
  let outsiderProfessorToken = '';
  let athleteId = '';
  let secondAthleteId = '';
  let athleteToken = '';
  let linkedGuardianToken = '';
  let unrelatedGuardianToken = '';

  beforeEach(async () => {
    const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await request(app).post('/api/auth/test/reset').send({});

    const academyRes = await request(app)
      .post('/api/auth/academies')
      .send({
        name: `Academia Progress ${runId}`,
        location: 'São Paulo',
        email: `academy.${runId}@test.com`,
        phone: '11999998888',
      });

    academyId = academyRes.body.academyId;

    const professorRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `prof.${runId}@test.com`,
        password: strongPassword,
        fullName: 'Professor Progress',
        role: 'Professor',
        academyId,
      });

    professorToken = professorRes.body.accessToken;

    const passwordHash = await hashPassword(strongPassword);

    const athlete = await createUser(
      `athlete.${runId}@test.com`,
      'Atleta Teste',
      passwordHash,
      academyId,
      'Aluno'
    );
    athleteId = athlete.id;

    const secondAthlete = await createUser(
      `athlete.other.${runId}@test.com`,
      'Outro Atleta',
      passwordHash,
      academyId,
      'Aluno'
    );
    secondAthleteId = secondAthlete.id;

    const linkedGuardian = await createUser(
      `guardian.linked.${runId}@test.com`,
      'Responsavel Vinculado',
      passwordHash,
      academyId,
      'Responsavel'
    );

    const unrelatedGuardian = await createUser(
      `guardian.free.${runId}@test.com`,
      'Responsavel Sem Vinculo',
      passwordHash,
      academyId,
      'Responsavel'
    );

    await pool.query(
      `INSERT INTO student_guardians (academy_id, student_id, guardian_id, relationship, is_primary)
       VALUES ($1, $2, $3, $4, true)`,
      [academyId, athleteId, linkedGuardian.id, 'Mae']
    );

    const athleteLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: athlete.email, password: strongPassword });
    athleteToken = athleteLoginRes.body.accessToken;

    const linkedGuardianLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: linkedGuardian.email, password: strongPassword });
    linkedGuardianToken = linkedGuardianLoginRes.body.accessToken;

    const unrelatedGuardianLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: unrelatedGuardian.email, password: strongPassword });
    unrelatedGuardianToken = unrelatedGuardianLoginRes.body.accessToken;

    const otherAcademyRes = await request(app)
      .post('/api/auth/academies')
      .send({
        name: `Academia Other ${runId}`,
        location: 'Rio de Janeiro',
        email: `other.${runId}@test.com`,
        phone: '21999998888',
      });

    otherAcademyId = otherAcademyRes.body.academyId;

    const outsiderRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `outsider.${runId}@test.com`,
        password: strongPassword,
        fullName: 'Professor Other',
        role: 'Professor',
        academyId: otherAcademyId,
      });

    outsiderProfessorToken = outsiderRes.body.accessToken;
  });

  afterAll(async () => {
    await request(app).post('/api/auth/test/reset').send({});
  });

  it('should create an athlete assessment with metric values', async () => {
    const res = await request(app)
      .post('/api/athlete-progress/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        athleteId,
        assessmentDate: '2026-04-17',
        notes: 'Boa evolução técnica e frequência consistente',
        metrics: [
          { metricCode: 'grip_strength', metricName: 'Força de Pegada', category: 'physical', value: 7.5, unit: 'score' },
          { metricCode: 'attendance_rate', metricName: 'Assiduidade', category: 'training', value: 92, unit: 'percent' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assessmentId).toBeDefined();
    expect(res.body.data.metrics).toHaveLength(2);
  });

  it('should return athlete progress history for authorized professor', async () => {
    await request(app)
      .post('/api/athlete-progress/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        athleteId,
        assessmentDate: '2026-04-17',
        notes: 'Primeira avaliação',
        metrics: [
          { metricCode: 'technique_success', metricName: 'Taxa Técnica', category: 'technical', value: 80, unit: 'percent' },
        ],
      });

    const res = await request(app)
      .get(`/api/athlete-progress/athletes/${athleteId}`)
      .set('Authorization', `Bearer ${professorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.athleteId).toBe(athleteId);
    expect(Array.isArray(res.body.data.assessments)).toBe(true);
    expect(res.body.data.assessments.length).toBeGreaterThan(0);
  });

  it('should allow controlled update of an existing athlete assessment', async () => {
    const createRes = await request(app)
      .post('/api/athlete-progress/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        athleteId,
        assessmentDate: '2026-04-17',
        notes: 'Avaliação inicial',
        metrics: [
          { metricCode: 'overall_progress', metricName: 'Progresso Geral', category: 'training', value: 3, unit: 'score' },
        ],
      });

    const assessmentId = createRes.body?.data?.assessmentId;

    const updateRes = await request(app)
      .put(`/api/athlete-progress/assessments/${assessmentId}`)
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        athleteId,
        assessmentDate: '2026-04-18',
        notes: 'Avaliação revisada pelo professor',
        metrics: [
          { metricCode: 'overall_progress', metricName: 'Progresso Geral', category: 'training', value: 4, unit: 'score' },
          { metricCode: 'attendance_rate', metricName: 'Assiduidade', category: 'training', value: 95, unit: 'percent' },
        ],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.notes).toContain('revisada');
    expect(updateRes.body.data.metrics).toHaveLength(2);
  });

  it('should block a student from viewing another athlete progress', async () => {
    const res = await request(app)
      .get(`/api/athlete-progress/athletes/${secondAthleteId}`)
      .set('Authorization', `Bearer ${athleteToken}`);

    expect(res.status).toBe(403);
  });

  it('should allow a linked guardian to view the athlete progress', async () => {
    const res = await request(app)
      .get(`/api/athlete-progress/athletes/${athleteId}`)
      .set('Authorization', `Bearer ${linkedGuardianToken}`);

    expect(res.status).toBe(200);
  });

  it('should block an unrelated guardian from viewing the athlete progress', async () => {
    const res = await request(app)
      .get(`/api/athlete-progress/athletes/${athleteId}`)
      .set('Authorization', `Bearer ${unrelatedGuardianToken}`);

    expect(res.status).toBe(403);
  });

  it('should return comparison insights between periods for the dashboard', async () => {
    const now = new Date();
    const currentDate = new Date(now);
    currentDate.setDate(now.getDate() - 7);
    const previousDate = new Date(now);
    previousDate.setDate(now.getDate() - 40);

    await request(app)
      .post('/api/athlete-progress/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        athleteId,
        assessmentDate: currentDate.toISOString().slice(0, 10),
        notes: 'Janela atual',
        metrics: [
          { metricCode: 'overall_progress', metricName: 'Progresso Geral', category: 'training', value: 4, unit: 'score' },
          { metricCode: 'technical_score', metricName: 'Avaliação Técnica', category: 'technical', value: 4, unit: 'score' },
        ],
      });

    await request(app)
      .post('/api/athlete-progress/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        athleteId,
        assessmentDate: previousDate.toISOString().slice(0, 10),
        notes: 'Janela anterior',
        metrics: [
          { metricCode: 'overall_progress', metricName: 'Progresso Geral', category: 'training', value: 2, unit: 'score' },
          { metricCode: 'technical_score', metricName: 'Avaliação Técnica', category: 'technical', value: 2, unit: 'score' },
        ],
      });

    const res = await request(app)
      .get(`/api/athlete-progress/athletes/${athleteId}`)
      .set('Authorization', `Bearer ${professorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.comparisons['30d'].changes.length).toBeGreaterThan(0);
    expect(res.body.data.comparisons['30d'].changes[0].trend).toBe('up');
  });

  it('should expose actionable alerts when frequency is low or performance regresses', async () => {
    await pool.query(
      `INSERT INTO student_progress (
         progress_id,
         student_id,
         academy_id,
         total_sessions,
         total_attendance,
         total_attendance_percentage,
         streak_current,
         streak_longest,
         last_updated_at,
         created_at
       ) VALUES (
         gen_random_uuid(),
         $1,
         $2,
         10,
         5,
         50,
         0,
         2,
         NOW(),
         NOW()
       )
       ON CONFLICT (student_id, academy_id)
       DO UPDATE SET
         total_sessions = EXCLUDED.total_sessions,
         total_attendance = EXCLUDED.total_attendance,
         total_attendance_percentage = EXCLUDED.total_attendance_percentage,
         streak_current = EXCLUDED.streak_current,
         streak_longest = EXCLUDED.streak_longest,
         last_updated_at = NOW()`,
      [athleteId, academyId]
    );

    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 5);
    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - 35);

    await request(app)
      .post('/api/athlete-progress/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        athleteId,
        assessmentDate: previousDate.toISOString().slice(0, 10),
        notes: 'Base anterior',
        metrics: [
          { metricCode: 'technical_score', metricName: 'Avaliação Técnica', category: 'technical', value: 4, unit: 'score' },
          { metricCode: 'physical_score', metricName: 'Avaliação Física', category: 'physical', value: 4, unit: 'score' },
        ],
      });

    await request(app)
      .post('/api/athlete-progress/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        athleteId,
        assessmentDate: recentDate.toISOString().slice(0, 10),
        notes: 'Queda recente',
        metrics: [
          { metricCode: 'technical_score', metricName: 'Avaliação Técnica', category: 'technical', value: 2, unit: 'score' },
          { metricCode: 'physical_score', metricName: 'Avaliação Física', category: 'physical', value: 2, unit: 'score' },
        ],
      });

    const res = await request(app)
      .get(`/api/athlete-progress/athletes/${athleteId}`)
      .set('Authorization', `Bearer ${professorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.alerts)).toBe(true);
    expect(res.body.data.alerts.length).toBeGreaterThan(0);
    expect(res.body.data.alerts.some((alert: any) => alert.type === 'low-attendance')).toBe(true);
  });

  it('should persist configurable indicator metadata and structured competition values', async () => {
    const configRes = await request(app)
      .put('/api/athlete-progress/configuration')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        groups: [
          {
            code: 'competition',
            name: 'Competição',
            description: 'Indicadores competitivos do atleta',
            displayOrder: 1,
            isActive: true,
            indicators: [
              {
                code: 'competition_count',
                name: 'Número de competições por período',
                category: 'competition',
                unit: 'count',
                valueType: 'integer',
                displayFormat: 'integer',
                inputInstruction: 'Informe quantas competições o atleta disputou no período',
                allowPeriodAggregation: true,
                isActive: true,
                displayOrder: 1,
              },
              {
                code: 'competition_record',
                name: 'Saldo competitivo',
                category: 'competition',
                unit: 'ratio',
                valueType: 'structured',
                displayFormat: 'ratio',
                inputInstruction: 'Use o formato vitórias:derrotas',
                allowPeriodAggregation: false,
                isActive: true,
                displayOrder: 2,
              },
            ],
          },
        ],
      });

    expect(configRes.status).toBe(200);
    expect(Array.isArray(configRes.body.data.groups)).toBe(true);

    const createRes = await request(app)
      .post('/api/athlete-progress/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        athleteId,
        assessmentDate: '2026-04-17',
        notes: 'Competiu bem no circuito regional',
        metrics: [
          {
            metricCode: 'competition_count',
            metricName: 'Número de competições por período',
            category: 'competition',
            value: 3,
            unit: 'count',
          },
          {
            metricCode: 'competition_record',
            metricName: 'Saldo competitivo',
            category: 'competition',
            value: 10,
            unit: 'ratio',
            displayValue: '10:2',
            secondaryValue: 2,
            structuredValue: { wins: 10, losses: 2 },
          },
        ],
      });

    expect(createRes.status).toBe(201);

    const historyRes = await request(app)
      .get(`/api/athlete-progress/athletes/${athleteId}`)
      .set('Authorization', `Bearer ${professorToken}`);

    expect(historyRes.status).toBe(200);
    expect(Array.isArray(historyRes.body.data.indicatorGroups)).toBe(true);
    expect(historyRes.body.data.indicatorGroups.some((group: any) => group.code === 'competition')).toBe(true);

    const structuredMetric = historyRes.body.data.assessments[0].metrics.find((metric: any) => metric.metricCode === 'competition_record');
    expect(structuredMetric.displayValue).toBe('10:2');
    expect(structuredMetric.structuredValue.losses).toBe(2);
  });

  it('should return a consolidated summary endpoint with latest metrics and trend context', async () => {
    const today = new Date();
    const earlierDate = new Date(today);
    earlierDate.setDate(today.getDate() - 14);

    await request(app)
      .post('/api/athlete-progress/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        athleteId,
        assessmentDate: earlierDate.toISOString().slice(0, 10),
        notes: 'Avaliação de base',
        metrics: [
          { metricCode: 'overall_progress', metricName: 'Progresso Geral', category: 'training', value: 3, unit: 'score' },
          { metricCode: 'technical_score', metricName: 'Avaliação Técnica', category: 'technical', value: 3, unit: 'score' },
        ],
      });

    const res = await request(app)
      .get(`/api/athlete-progress/athletes/${athleteId}/summary?period=30d`)
      .set('Authorization', `Bearer ${professorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.athleteId).toBe(athleteId);
    expect(res.body.data.summary.totalAssessments).toBeGreaterThan(0);
    expect(res.body.data.summary.latestMetrics).toBeDefined();
    expect(res.body.data.comparisons['30d']).toBeDefined();
  });

  it('should filter the historical endpoint by period with pagination metadata', async () => {
    await request(app)
      .post('/api/athlete-progress/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        athleteId,
        assessmentDate: '2026-01-10',
        notes: 'Histórico antigo',
        metrics: [
          { metricCode: 'overall_progress', metricName: 'Progresso Geral', category: 'training', value: 2, unit: 'score' },
        ],
      });

    await request(app)
      .post('/api/athlete-progress/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        athleteId,
        assessmentDate: '2026-02-10',
        notes: 'Histórico intermediário',
        metrics: [
          { metricCode: 'overall_progress', metricName: 'Progresso Geral', category: 'training', value: 3, unit: 'score' },
        ],
      });

    await request(app)
      .post('/api/athlete-progress/assessments')
      .set('Authorization', `Bearer ${professorToken}`)
      .send({
        athleteId,
        assessmentDate: '2026-03-10',
        notes: 'Histórico recente',
        metrics: [
          { metricCode: 'overall_progress', metricName: 'Progresso Geral', category: 'training', value: 4, unit: 'score' },
        ],
      });

    const res = await request(app)
      .get(`/api/athlete-progress/athletes/${athleteId}/history?from=2026-02-01&to=2026-03-31&limit=1&offset=0&groupBy=month`)
      .set('Authorization', `Bearer ${professorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assessments).toHaveLength(1);
    expect(res.body.data.pagination.total).toBe(2);
    expect(res.body.data.pagination.hasMore).toBe(true);
    expect(Array.isArray(res.body.data.groupedSeries)).toBe(true);
    expect(res.body.data.groupedSeries.length).toBeGreaterThan(0);
  });

  it('should not leak athlete progress across academies', async () => {
    const res = await request(app)
      .get(`/api/athlete-progress/athletes/${athleteId}`)
      .set('Authorization', `Bearer ${outsiderProfessorToken}`);

    expect(res.status).toBe(404);
  });
});
