# Story 1.3: Login com Autenticacao JWT

Status: done

## Story

Como um Usuario (Professor, Aluno, Admin, Responsavel),
Quero fazer login com email e senha,
Para que eu possa acessar minha conta e funcionalidades.

## Acceptance Criteria

### AC1: Validacao de Credenciais
```gherkin
Dado que o usuario esta na pagina de login
Quando insere email + senha validos
Entao o sistema valida as credenciais contra o hash bcryptjs armazenado
E compara a senha fornecida com o hash usando bcrypt.compare()
```

### AC2: Emissao de Tokens JWT
```gherkin
Dado que as credenciais estao corretas
Quando o sistema valida com sucesso
Entao gera um JWT access_token (validade: 15-60 minutos)
E gera um JWT refresh_token (validade: 7 dias, armazenado em httpOnly cookie)
E retorna ao cliente: { accessToken, user: { id, email, role, nomeCompleto } }
```

### AC3: Armazenamento Seguro no Cliente
```gherkin
Dado que o login foi bem-sucedido
Quando o cliente recebe os tokens
Entao o access_token e armazenado em memoria
E o refresh_token e armazenado em cookie httpOnly com sameSite=strict
E o cliente e redirecionado ao dashboard apropriado
```

### AC4: Erro de Credenciais
```gherkin
Dado que as credenciais sao invalidas
Quando o login e tentado
Entao o sistema exibe: "Email ou senha incorretos"
E nao especifica qual campo esta errado
E registra a tentativa falhada no audit log
```

### AC5: Rate Limiting de Login
```gherkin
Dado que o usuario digita email/senha errado 3 vezes
Quando tenta novamente
Entao o sistema aplica rate limiting por IP/email
E responde: "Muitas tentativas. Tente novamente em 5 minutos"
E registra todas as tentativas no audit log
```

### AC6: Refresh Token
```gherkin
Dado que o usuario esta logado
Quando o access_token expira
Entao o cliente chama endpoint de refresh
E se refresh_token e valido, sistema gera novo access_token
E se refresh_token expirou, sistema força re-login
```

### AC7: Logout Seguro
```gherkin
Dado que o usuario clica "Logout"
Quando a requisicao e processada
Entao o access_token em memoria e limpo
E o refresh_token (cookie) e deletado
E a sessao e encerrada
E o usuario e redirecionado para /login
```

### AC8: Rotas Protegidas
```gherkin
Dado que o usuario tenta acessar rota protegida sem token
Quando a requisicao e feita
Entao o middleware JWT retorna 401 Unauthorized
E o cliente redireciona para login
```

## Tasks / Subtasks

- [x] Task 1: Consolidar fluxo de login atual no backend (AC1, AC2, AC4)
  - [x] 1.1 Validar payload de login (email + password)
  - [x] 1.2 Garantir compare bcrypt no `loginHandler`
  - [x] 1.3 Garantir resposta padrao sem vazar se email ou senha falhou
  - [x] 1.4 Garantir audit `LOGIN_SUCCESS` e `LOGIN_FAILURE`

- [x] Task 2: Implementar rate limiting para tentativas de login (AC5)
  - [x] 2.1 Adicionar dependencia `express-rate-limit` (se nao presente)
  - [x] 2.2 Criar limiter dedicado para `/api/auth/login`
  - [x] 2.3 Configurar janela de 5 minutos e threshold de 3 tentativas
  - [x] 2.4 Ajustar mensagem de erro para "Muitas tentativas. Tente novamente em 5 minutos"
  - [x] 2.5 Registrar no audit log quando limiter bloquear

- [x] Task 3: Completar fluxo de refresh token (AC6)
  - [x] 3.1 Validar cookie `refreshToken` obrigatorio
  - [x] 3.2 Garantir rotacao de refresh token
  - [x] 3.3 Cobrir caso invalido/expirado com 401

- [x] Task 4: Implementar endpoint de logout no backend (AC7)
  - [x] 4.1 Criar `POST /api/auth/logout`
  - [x] 4.2 Limpar cookie `refreshToken` com `res.clearCookie`
  - [x] 4.3 Registrar evento `LOGOUT_SUCCESS` no audit

- [x] Task 5: Integrar logout no frontend (AC7)
  - [x] 5.1 Criar metodo `logout()` em `ApiService` para chamar backend
  - [x] 5.2 Atualizar `AuthService.logout()` para limpar estado local e cookie no servidor
  - [x] 5.3 Garantir redirect para `/login`

- [x] Task 6: Validacao de rotas protegidas no frontend (AC8)
  - [x] 6.1 Garantir comportamento atual de redirect quando 401
  - [x] 6.2 Ajustar/validar protecao do dashboard sem usuario autenticado

- [x] Task 7: Testes backend para login/auth (AC1-AC7)
  - [x] 7.1 Criar `backend/src/tests/auth-login.test.ts`
  - [x] 7.2 Testar login valido
  - [x] 7.3 Testar login invalido
  - [x] 7.4 Testar rate limit apos 3 falhas
  - [x] 7.5 Testar refresh valido e invalido
  - [x] 7.6 Testar logout limpando cookie

## Dev Notes

### Estado Atual Relevante

Ja existe implementacao parcial em backend:
- `loginHandler`, `refreshTokenHandler`, `getCurrentUserHandler` e `authMiddleware`
- Rotas em `backend/src/routes/auth.ts`
- JWT util em `backend/src/lib/jwt.ts`
- Password util em `backend/src/lib/password.ts`
- Auditoria em `backend/src/lib/audit.ts`

Ja existe implementacao parcial em frontend:
- `LoginFormComponent` com submit para `/api/auth/login`
- `AuthService.login()` salvando access token em memoria/local storage
- Redirect para `/admin/dashboard` quando autenticado

### Gaps tecnicos identificados para Story 1.3

1. Nao ha rate limiter ativo em login.
2. Nao ha endpoint backend explicito de logout.
3. Testes de login/refresh/logout ainda nao existem (so ha testes de register).
4. Mensagem de erro no login precisa ser padronizada para "Email ou senha incorretos" no fluxo de UI.

### Requisitos de seguranca

- Cookie de refresh deve seguir `httpOnly: true`, `sameSite: 'strict'`, `secure` em producao.
- Nao retornar detalhes de qual credencial falhou.
- Registrar eventos de seguranca no audit log.

### Estrategia de implementacao recomendada

1. Introduzir middleware de rate limiting primeiro.
2. Implementar logout backend/frontend.
3. Fechar testes de auth com Jest + Supertest.
4. Executar `npm test` e `npm run build` backend/frontend.

## Dev Agent Record

### Agent Model Used
GPT-5.3-Codex (GitHub Copilot) — bmad-dev-story

### Debug Log References

- Backend tests: `npm test -- --no-cache` (12 passed, 0 failed)
- Backend build: `npm run build` (success)
- Frontend build: `npm run build` (success com warnings de budget SCSS pre-existentes)

### Completion Notes List

- Login padronizado para resposta de erro generica: "Email ou senha incorretos".
- Rate limiting aplicado em `/api/auth/login` (3 tentativas em 5 minutos) com auditoria de bloqueio.
- Endpoint `POST /api/auth/logout` implementado com limpeza de cookie refresh.
- Frontend integrado para chamar logout no backend e limpar estado local mesmo em falha de rede.
- Suite `auth-login.test.ts` criada cobrindo login, falha, rate limit, refresh e logout.
- Ajustado isolamento entre testes para evitar interferencia do limiter entre casos.

### File List

- backend/src/routes/auth.ts
- backend/src/controllers/auth.ts
- backend/src/tests/auth-login.test.ts
- backend/src/tests/register.test.ts
- backend/src/tests/test-setup.ts
- backend/jest.config.js
- frontend/src/services/api.service.ts
- frontend/src/services/auth.service.ts
- frontend/src/components/login-form/login-form.component.ts
- _bmad-output/implementation-artifacts/1-3-login-jwt.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-03-21: Story 1-3 criada com status ready-for-dev.
- 2026-03-21: Story 1-2 promovida para done (apos aprovacao manual do fluxo).
- 2026-03-21: Story 1-3 implementada e movida para review com testes e build validados.
- 2026-03-21: Story 1-3 aprovada em review e promovida para done.