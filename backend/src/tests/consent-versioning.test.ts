import request from 'supertest';
import app from '../app';
import { pool } from '../lib/db';

const strongPassword = 'SenhaForte1!';

describe('Admin consent template versioning', () => {
  let academyId = '';
  let adminToken = '';

  beforeEach(async () => {
    await request(app).post('/api/auth/test/reset').send({});

    const academyRes = await request(app).post('/api/auth/academies').send({
      name: 'Academia Consentimento',
      location: 'Sao Paulo',
      email: 'consentimento@academia.com',
      phone: '11977778888',
    });
    academyId = academyRes.body.academyId;

    await request(app)
      .post(`/api/auth/academies/${academyId}/init-admin`)
      .send({
        email: 'admin.consent@academia.com',
        password: strongPassword,
        fullName: 'Admin Consent',
      });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin.consent@academia.com',
      password: strongPassword,
    });
    adminToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await request(app).post('/api/auth/test/reset').send({});
  });

  it('lista templates ativos seeded com versão 1.0', async () => {
    const res = await request(app)
      .get('/api/admin/consent-templates')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.templates).toHaveLength(3);
    expect(res.body.templates.every((template: any) => template.version === '1.0')).toBe(true);
  });

  it('publica nova versão minor e desativa a anterior', async () => {
    const publishRes = await request(app)
      .post('/api/admin/consent-templates/publish')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        healthContent: 'Novo texto de saúde com conteúdo suficiente para a versão publicada.',
        ethicsContent: 'Novo texto de ética com conteúdo suficiente para a versão publicada.',
        privacyContent: 'Novo texto de privacidade com conteúdo suficiente para a versão publicada.',
        bumpType: 'minor',
      });

    expect(publishRes.status).toBe(201);
    expect(publishRes.body.version).toBe('1.1');
    expect(publishRes.body.templates).toHaveLength(3);
    expect(publishRes.body.templates.every((template: any) => template.version === '1.1')).toBe(true);

    const dbRes = await pool.query(
      `SELECT consent_type, version, is_active
       FROM consent_templates
       WHERE academy_id = $1
       ORDER BY consent_type, version`,
      [academyId]
    );

    const activeRows = dbRes.rows.filter((row) => row.is_active);
    const inactiveRows = dbRes.rows.filter((row) => !row.is_active);

    expect(activeRows).toHaveLength(3);
    expect(activeRows.every((row) => Number(row.version) === 1.1)).toBe(true);
    expect(inactiveRows).toHaveLength(3);
    expect(inactiveRows.every((row) => Number(row.version) === 1.0)).toBe(true);
  });

  it('publica nova versão major a partir da versão atual', async () => {
    await request(app)
      .post('/api/admin/consent-templates/publish')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        healthContent: 'Texto versão 1.1 para saúde com conteúdo suficiente para teste.',
        ethicsContent: 'Texto versão 1.1 para ética com conteúdo suficiente para teste.',
        privacyContent: 'Texto versão 1.1 para privacidade com conteúdo suficiente para teste.',
        bumpType: 'minor',
      });

    const publishRes = await request(app)
      .post('/api/admin/consent-templates/publish')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        healthContent: 'Texto versão 2.0 para saúde com conteúdo suficiente para teste major.',
        ethicsContent: 'Texto versão 2.0 para ética com conteúdo suficiente para teste major.',
        privacyContent: 'Texto versão 2.0 para privacidade com conteúdo suficiente para teste major.',
        bumpType: 'major',
      });

    expect(publishRes.status).toBe(201);
    expect(publishRes.body.version).toBe('2.0');
  });

  it('gera link de re-consentimento para aluno menor com versão anterior', async () => {
    const studentRes = await request(app).post('/api/auth/register').send({
      email: 'aluno.menor.reconsent@academia.com',
      password: strongPassword,
      fullName: 'Aluno Menor Reconsent',
      role: 'Aluno',
      academyId,
      birthDate: '2012-05-20',
      responsavelEmail: 'responsavel@familia.com',
    });

    expect(studentRes.status).toBe(201);
    expect(studentRes.body.requiresConsent).toBe(true);

    const consentLink: string = studentRes.body.consentLink;
    const token = consentLink.split('/').pop();

    const signatureBase64 = `data:image/png;base64,${'A'.repeat(140)}`;
    const signRes = await request(app)
      .post(`/api/consent/${token}/sign`)
      .send({ signatureBase64 });

    expect(signRes.status).toBe(200);

    const publishRes = await request(app)
      .post('/api/admin/consent-templates/publish')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        healthContent: 'Texto atualizado de saúde para obrigar reconsentimento com conteúdo suficiente.',
        ethicsContent: 'Texto atualizado de ética para obrigar reconsentimento com conteúdo suficiente.',
        privacyContent: 'Texto atualizado de privacidade para obrigar reconsentimento com conteúdo suficiente.',
        bumpType: 'minor',
      });

    expect(publishRes.status).toBe(201);
    expect(publishRes.body.affectedStudents).toHaveLength(1);
    expect(publishRes.body.affectedStudents[0].studentName).toBe('Aluno Menor Reconsent');
    expect(publishRes.body.affectedStudents[0].previousVersion).toBe('1.0');
    expect(publishRes.body.affectedStudents[0].newVersion).toBe('1.1');
    expect(publishRes.body.affectedStudents[0].consentLink).toContain('/consent/');
  });

  it('detecta re-consentimento no validateToken e retorna versões', async () => {
    // Create and sign a student with v1.0
    const studentRes = await request(app).post('/api/auth/register').send({
      email: 'aluno.reconsent.detect@academia.com',
      password: strongPassword,
      fullName: 'Aluno Detecta Reconsent',
      role: 'Aluno',
      academyId,
      birthDate: '2013-08-15',
      responsavelEmail: 'responsavel2@familia.com',
    });

    const consentLink: string = studentRes.body.consentLink;
    const token = consentLink.split('/').pop();

    // Sign with v1.0
    const signatureBase64 = `data:image/png;base64,${'B'.repeat(140)}`;
    await request(app)
      .post(`/api/consent/${token}/sign`)
      .send({ signatureBase64 });

    // Publish v1.1
    const publishRes = await request(app)
      .post('/api/admin/consent-templates/publish')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        healthContent: 'Novo texto de saúde v1.1 com conteúdo suficiente para detecção.',
        ethicsContent: 'Novo texto de ética v1.1 com conteúdo suficiente para detecção.',
        privacyContent: 'Novo texto de privacidade v1.1 com conteúdo suficiente para detecção.',
        bumpType: 'minor',
      });

    // Get the re-consent link from affected students
    const reconsentLink: string = publishRes.body.affectedStudents[0].consentLink;
    const reconsentToken = reconsentLink.split('/').pop();

    // Validate the re-consent token and verify isReconsent flag
    const validateRes = await request(app)
      .get(`/api/consent/${reconsentToken}/validate`);

    expect(validateRes.status).toBe(200);
    expect(validateRes.body.isValid).toBe(true);
    expect(validateRes.body.isReconsent).toBe(true);
    expect(validateRes.body.previousVersion).toBe(1.0);
    expect(validateRes.body.newVersion).toBe(1.1);
    expect(validateRes.body.studentName).toBe('Aluno Detecta Reconsent');
  });

  it('reativa template inativo e evita 404 para health e ethics no wizard', async () => {
    const studentRes = await request(app).post('/api/auth/register').send({
      email: 'aluno.template.inativo@academia.com',
      password: strongPassword,
      fullName: 'Aluno Template Inativo',
      role: 'Aluno',
      academyId,
      birthDate: '2012-10-20',
      responsavelEmail: 'responsavel3@familia.com',
    });

    expect(studentRes.status).toBe(201);
    expect(studentRes.body.requiresConsent).toBe(true);

    const consentLink: string = studentRes.body.consentLink;
    const token = consentLink.split('/').pop();

    await pool.query(
      `UPDATE consent_templates
       SET is_active = false
       WHERE academy_id = $1
         AND consent_type IN ('health', 'ethics')`,
      [academyId]
    );

    const healthRes = await request(app).get(`/api/consent/${token}/template/health`);
    const ethicsRes = await request(app).get(`/api/consent/${token}/template/ethics`);

    expect(healthRes.status).toBe(200);
    expect(ethicsRes.status).toBe(200);
    expect(healthRes.body.content).toBeTruthy();
    expect(ethicsRes.body.content).toBeTruthy();

    const activeBackRes = await pool.query(
      `SELECT consent_type, is_active
       FROM consent_templates
       WHERE academy_id = $1
         AND consent_type IN ('health', 'ethics')
         AND is_active = true`,
      [academyId]
    );

    const activeTypes = activeBackRes.rows.map((row) => row.consent_type).sort();
    expect(activeTypes).toEqual(['ethics', 'health']);
  });
});