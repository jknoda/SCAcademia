import request from 'supertest';
import app from '../app';

const strongPassword = 'SenhaForte1!';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForAuditAction = async (token: string, action: string): Promise<boolean> => {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await request(app)
      .get('/api/admin/audit-logs?limit=200')
      .set('Authorization', `Bearer ${token}`);

    if (res.status === 200 && Array.isArray(res.body.logs)) {
      const found = res.body.logs.some((log: any) => log.action === action);
      if (found) {
        return true;
      }
    }

    await sleep(120);
  }

  return false;
};

describe('Auditoria LGPD — GET /api/admin/audit-logs', () => {
  let academyId = '';
  let adminToken = '';

  beforeEach(async () => {
    await request(app).post('/api/auth/test/reset').send({});

    const academyRes = await request(app).post('/api/auth/academies').send({
      name: 'Academia Auditoria',
      location: 'Rio de Janeiro',
      email: 'auditoria@academia.com',
      phone: '21977778888',
    });
    academyId = academyRes.body.academyId;

    await request(app)
      .post(`/api/auth/academies/${academyId}/init-admin`)
      .send({
        email: 'admin.audit@academia.com',
        password: strongPassword,
        fullName: 'Admin Auditoria',
      });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin.audit@academia.com',
      password: strongPassword,
    });
    adminToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await request(app).post('/api/auth/test/reset').send({});
  });

  it('rejeita acesso sem token de autenticação', async () => {
    const res = await request(app).get('/api/admin/audit-logs');
    expect(res.status).toBe(401);
  });

  it('retorna lista paginada de logs com status 200', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('logs');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('totalPages');
    expect(Array.isArray(res.body.logs)).toBe(true);
  });

  it('filtra logs por ação e retorna apenas registros correspondentes', async () => {
    // Garante que há pelo menos um log de ADMIN_LOGIN gerado pelo setup
    const res = await request(app)
      .get('/api/admin/audit-logs?action=ADMIN_LOGIN')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.logs)).toBe(true);
    // Todos os registros retornados devem ter a ação filtrada
    res.body.logs.forEach((log: any) => {
      expect(log.action).toBe('ADMIN_LOGIN');
    });
  });

  it('retorna 400 quando dateFrom é inválida', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs?dateFrom=nao-e-data')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/dateFrom inválida/i);
  });

  it('respeita paginação — página 2 com limite 1 retorna metadados consistentes', async () => {
    // Para garantir que há pelo menos 2 logs, fazemos um login extra
    await request(app).post('/api/auth/login').send({
      email: 'admin.audit@academia.com',
      password: strongPassword,
    });

    const page1 = await request(app)
      .get('/api/admin/audit-logs?page=1&limit=1')
      .set('Authorization', `Bearer ${adminToken}`);

    const page2 = await request(app)
      .get('/api/admin/audit-logs?page=2&limit=1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);
    expect(page1.body.logs).toHaveLength(1);
    expect(page1.body.page).toBe(1);
    expect(page2.body.page).toBe(2);
    expect(page1.body.total).toBeGreaterThanOrEqual(2);
    expect(page2.body.total).toBeGreaterThanOrEqual(2);
  });

  it('exporta CSV com Content-Type text/csv e BOM UTF-8', async () => {
    const res = await request(app)
      .get('/api/admin/audit-logs/export')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    // Verifica BOM UTF-8 no início do corpo
    const bodyStr: string = res.text;
    expect(bodyStr.startsWith('\uFEFF')).toBe(true);
    // Verifica que tem cabeçalho CSV
    expect(bodyStr).toMatch(/timestamp|acao|recurso/i);
  });

  it('registra AUDIT_LOG_VIEWED ao consultar logs', async () => {
    const viewRes = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(viewRes.status).toBe(200);

    const hasAuditViewed = await waitForAuditAction(adminToken, 'AUDIT_LOG_VIEWED');
    expect(hasAuditViewed).toBe(true);
  });

  it('registra AUDIT_LOG_EXPORTED ao exportar CSV', async () => {
    const exportRes = await request(app)
      .get('/api/admin/audit-logs/export')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(exportRes.status).toBe(200);

    const hasAuditExported = await waitForAuditAction(adminToken, 'AUDIT_LOG_EXPORTED');
    expect(hasAuditExported).toBe(true);
  });
});
