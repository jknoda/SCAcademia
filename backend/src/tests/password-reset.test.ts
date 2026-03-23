import request from 'supertest';
import app from '../app';

const strongPassword = 'SenhaForte1!';
const newStrongPassword = 'NovaSenhaForte1!';

describe('Password reset flow', () => {
  let academyId = '';
  const email = 'reset.user@academia.com';

  beforeEach(async () => {
    await request(app).post('/api/auth/test/reset').send({});

    const academyRes = await request(app).post('/api/auth/academies').send({
      name: 'Academia Reset',
      location: 'Sao Paulo',
      email: 'contato.reset@academia.com',
      phone: '11988887777',
    });
    academyId = academyRes.body.academyId;

    await request(app)
      .post(`/api/auth/academies/${academyId}/init-admin`)
      .send({
        email: 'admin.reset@academia.com',
        password: 'AdminForte1!',
        fullName: 'Admin Reset',
      });

    await request(app).post('/api/auth/register').send({
      email,
      password: strongPassword,
      fullName: 'Usuario Reset',
      role: 'Professor',
      academyId,
    });
  });

  it('forgot-password sempre retorna mensagem neutra', async () => {
    const existing = await request(app).post('/api/auth/forgot-password').send({ email });
    const missing = await request(app).post('/api/auth/forgot-password').send({ email: 'nao.existe@academia.com' });

    expect(existing.status).toBe(200);
    expect(missing.status).toBe(200);
    expect(existing.body.message).toBe('Se o email existir, enviaremos um link para redefinicao de senha');
    expect(missing.body.message).toBe('Se o email existir, enviaremos um link para redefinicao de senha');
  });

  it('reset-password troca senha e invalida refresh token antigo', async () => {
    const loginBefore = await request(app).post('/api/auth/login').send({
      email,
      password: strongPassword,
    });
    const oldRefreshCookie = loginBefore.headers['set-cookie'];
    expect(loginBefore.status).toBe(200);

    const forgot = await request(app).post('/api/auth/forgot-password').send({ email });
    expect(forgot.status).toBe(200);
    expect(forgot.body.debugToken).toBeDefined();

    const reset = await request(app).post('/api/auth/reset-password').send({
      token: forgot.body.debugToken,
      newPassword: newStrongPassword,
    });

    expect(reset.status).toBe(200);
    expect(reset.body.message).toBe('Senha redefinida com sucesso');

    const refreshWithOldToken = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', oldRefreshCookie)
      .send({});
    expect(refreshWithOldToken.status).toBe(401);

    const loginOldPassword = await request(app).post('/api/auth/login').send({
      email,
      password: strongPassword,
    });
    expect(loginOldPassword.status).toBe(401);

    const loginNewPassword = await request(app).post('/api/auth/login').send({
      email,
      password: newStrongPassword,
    });
    expect(loginNewPassword.status).toBe(200);
    expect(loginNewPassword.body.accessToken).toBeDefined();
  });

  it('reset-password com token invalido retorna erro de link expirado', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'token-invalido',
      newPassword: newStrongPassword,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Link expirado. Solicite novo reset');
  });
});
