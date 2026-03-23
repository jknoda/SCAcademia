# Story 1.4: Recuperacao de Senha via Email

Status: done

## Story

Como um Usuario que esqueceu a senha,
Quero redefinir a senha via email,
Para que eu possa recuperar acesso a minha conta.

## Acceptance Criteria

### AC1: Solicitacao de reset
```gherkin
Dado que o usuario acessa "Esqueci a senha"
Quando insere seu email registrado no sistema
Entao o sistema busca o usuario no banco de dados
E se encontrado, gera um token de reset (JWT temporario, validade: 1 hora)
```

### AC2: Envio de email de reset
```gherkin
Dado que o token foi gerado
Quando o sistema envia o email
Entao o email contem link "Redefinir Senha" com token incluido
E o token_hash e armazenado no banco com timestamp de criacao
```

### AC3: Validacao de token de reset
```gherkin
Dado que o usuario clica no link do email
Quando acessa a pagina de reset com token valido
Entao o sistema valida o token (nao expirou, hash corresponde ao armazenado)
E exibe formulario para nova senha
```

### AC4: Atualizacao segura de senha
```gherkin
Dado que o usuario insere nova senha valida
Quando submete o formulario
Entao o sistema valida a senha (8+ caracteres, maiuscula, numero, especial)
E gera novo password_hash com bcryptjs
E atualiza o usuario no banco
E anula/deleta reset_token
E invalida refresh tokens antigos (force re-login)
```

### AC5: Pos-reset e auditoria
```gherkin
Dado que o reset foi bem-sucedido
Quando a operacao conclui
Entao exibe "Senha redefinida com sucesso"
E redireciona para /login
E registra evento de sucesso no audit log
```

### AC6: Token expirado ou invalido
```gherkin
Dado que o token de reset expirou ou e invalido
Quando o usuario tenta usar o link
Entao o sistema exibe "Link expirado. Solicite novo reset"
E oferece opcao para gerar novo token
E redireciona para pagina "Esqueci a senha"
```

## Tasks / Subtasks

- [x] Task 1: Backend - solicitar reset (AC1, AC2)
  - [x] 1.1 Criar endpoint `POST /api/auth/forgot-password`
  - [x] 1.2 Validar payload de email
  - [x] 1.3 Gerar token de reset com expiracao de 1 hora
  - [x] 1.4 Persistir hash/token e metadata de expiracao
  - [x] 1.5 Registrar auditoria de solicitacao

- [x] Task 2: Backend - confirmar reset (AC3, AC4, AC6)
  - [x] 2.1 Criar endpoint `POST /api/auth/reset-password`
  - [x] 2.2 Validar token (assinatura + expiracao + correspondencia com persistencia)
  - [x] 2.3 Validar nova senha com politica atual
  - [x] 2.4 Atualizar password_hash e remover token de reset
  - [x] 2.5 Invalidar sessoes/refresh tokens antigos
  - [x] 2.6 Registrar auditoria de sucesso/falha

- [x] Task 3: Frontend - fluxo de recuperacao (AC1, AC3, AC5, AC6)
  - [x] 3.1 Criar tela/componente "Esqueci a senha"
  - [x] 3.2 Criar tela/componente "Redefinir senha" com token
  - [x] 3.3 Integrar chamadas de API no `ApiService` e fluxo no `AuthService`
  - [x] 3.4 Exibir mensagens de sucesso/erro conforme AC

- [x] Task 4: Testes (AC1-AC6)
  - [x] 4.1 Testes backend para forgot/reset password
  - [x] 4.2 Teste de token expirado/invalido
  - [x] 4.3 Teste de invalidação de sessoes antigas

## Dev Notes

### Estado atual relevante

- Existe fluxo de login com JWT e refresh cookie ja implementado.
- Existe auditoria centralizada em `backend/src/lib/audit.ts`.
- Existe validacao de senha e hash com bcryptjs no backend.

### Gaps esperados para esta story

1. Ausencia de endpoints dedicados para forgot/reset password.
2. Ausencia de persistencia de token de reset com expiracao.
3. Ausencia de telas de frontend para recuperacao de senha.

### Requisitos de seguranca

- Nao revelar se o email existe (resposta neutra para forgot-password).
- Token de reset deve expirar em 1 hora.
- Após reset, revogar sessoes antigas.
- Registrar eventos de seguranca no audit log.

## Dev Agent Record

### Agent Model Used
GPT-5.3-Codex (GitHub Copilot) — bmad-dev-story

### Debug Log References

- Backend tests: `npm test -- --no-cache` (15 passed, 0 failed)
- Backend build: `npm run build` (success)
- Frontend build: `npm run build` (success com warnings de budgets SCSS pre-existentes)

### Completion Notes List

- Endpoints `POST /api/auth/forgot-password` e `POST /api/auth/reset-password` implementados.
- Token de reset persiste em `auth_tokens` (hash) com validade de 1 hora.
- Resposta de forgot-password mantida neutra para não vazar existência de email.
- Reset de senha revoga tokens de refresh antigos (force re-login).
- Novas telas frontend criadas para forgot/reset password e integradas ao roteamento.
- Link de recuperação adicionado na tela de login.

### File List

- backend/src/controllers/auth.ts
- backend/src/routes/auth.ts
- backend/src/lib/database.ts
- backend/src/lib/validators.ts
- backend/src/tests/password-reset.test.ts
- frontend/src/services/api.service.ts
- frontend/src/services/auth.service.ts
- frontend/src/app.routing.module.ts
- frontend/src/app.module.ts
- frontend/src/components/login-form/login-form.component.ts
- frontend/src/components/login-form/login-form.component.html
- frontend/src/components/forgot-password-form/forgot-password-form.component.ts
- frontend/src/components/forgot-password-form/forgot-password-form.component.html
- frontend/src/components/forgot-password-form/forgot-password-form.component.scss
- frontend/src/components/reset-password-form/reset-password-form.component.ts
- frontend/src/components/reset-password-form/reset-password-form.component.html
- frontend/src/components/reset-password-form/reset-password-form.component.scss
- _bmad-output/implementation-artifacts/1-4-recuperacao-senha.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-03-21: Story 1.4 criada e preparada para desenvolvimento (ready-for-dev).
- 2026-03-21: Story 1.4 implementada e movida para review com testes e builds validados.
- 2026-03-21: Code review aprovado. P1 (rate limit em /forgot-password) e P2 (UPDATE users abstraído para database.ts via updateUserPassword) corrigidos. Testes 15/15. Story promovida para done.
