# Story 1.2: Registro de Usuário (Professor ou Aluno)

Status: done

## Story

Como um Professor ou Aluno,
Quero me registrar no sistema com email, senha e dados básicos,
Para que eu possa acessar a plataforma e começar a usar.

## Acceptance Criteria

### AC1: Formulário de Registro + Validação em Tempo Real
```gherkin
Dado que o usuário acessa a página /register
Quando preenche o formulário com: nome, email, senha, tipo (Professor/Aluno)
Então o sistema valida os dados em tempo real
E exibe mensagens de erro se a senha não atender aos requisitos (8+ chars, maiúscula, número, especial)
```

### AC2: Email Duplicado
```gherkin
Dado que o email já existe no sistema (mesma academia)
Quando o usuário tenta registrar com esse email
Então o sistema exibe erro: "Email já registrado"
E sugere: "Fazer login" ou "Recuperar senha"
```

### AC3: Criação do Usuário + bcryptjs
```gherkin
Dado que todos os dados são válidos
Quando o usuário clica "Criar Conta"
Então o sistema cria o usuário com role = Professor ou Aluno
E a senha é hasheada com bcryptjs (10 salt rounds)
E os dados são salvos no banco (PostgreSQL: tabela users)
E o status de consentimento do usuário é "pendente" (campo minor_consent_signed = false)
```

### AC4: Sucesso + Redirect
```gherkin
Dado que o registro foi bem-sucedido
Quando o sistema retorna 201 Created
Então o frontend exibe: "✓ Registro realizado com sucesso"
E redireciona para /admin/dashboard (auto-login JWT) OU /login se for aluno menor
```

### AC5: Aluno Menor de Idade
```gherkin
Dado que é um Aluno e a data de nascimento indica menos de 18 anos
Quando o sistema detecta idade < 18
Então salva necessita_consentimento_responsavel = true (is_minor = true na DB)
E envia email para o responsável (mocked: apenas log no console)
E o aluno não pode logar até consentimento — retorna requiresConsent: true na response
```

### AC6: Professor — Acesso Imediato
```gherkin
Dado que o usuário se registra como Professor
Quando o registro é concluído
Então o sistema marca role = "Professor"
E o professor recebe email de boas-vindas (mocked: console.log)
E o frontend recebe accessToken — faz auto-login e redireciona para dashboard
```

### AC7: Erro no Banco
```gherkin
Dado que houve erro ao salvar os dados
Quando o sistema detecta falha
Então registra no audit log: USER_REGISTERED (com erro)
E exibe: "Erro ao registrar. Dados não foram salvos. Tente novamente"
```

### AC8: Link para Registro na Página de Login
```gherkin
Dado que um usuário novo acessa a página /login
Quando ainda não tem conta
Então vê um link "Criar Conta" ou "Registrar-se" que leva para /register
```

### AC9: academyId por Query Param
```gherkin
Dado que o admin compartilha o link /register?academyId=<uuid>
Quando o usuário acessa essa URL
Então o sistema usa o academyId da URL (prioritizando sobre localStorage)
```

### AC10: Testes Backend para /register
```gherkin
Dado que o endpoint POST /api/auth/register existe
Quando os testes são executados
Então todos os cenários críticos passam: registro válido, senha fraca, email duplicado, menor de idade, sem academia
```

## Tasks / Subtasks

### NOTA: AC1–AC7 já estão implementados (backend + frontend). Verificar e finalizar os itens pendentes.

- [x] Task 1: Verificar implementação existente e rodar smoke test manual (AC1-AC7)
  - [x] 1.1: Confirmar que POST /api/auth/register retorna 201 com dados válidos
  - [x] 1.2: Confirmar que email duplicado retorna 409 com suggestions
  - [x] 1.3: Confirmar que senha fraca retorna 400 com detalhes
  - [x] 1.4: Confirmar que menor de idade: requiresConsent=true, is_minor=true na DB
  - [x] 1.5: Confirmar que Professor recebe accessToken no response (auto-login)

- [x] Task 2: Instalar framework de testes no backend (Jest + Supertest) (AC10)
  - [x] 2.1: Instalar jest, ts-jest, @types/jest, supertest, @types/supertest
  - [x] 2.2: Configurar jest.config.js (ts-jest, testEnvironment node)
  - [x] 2.3: Atualizar package.json scripts: "test": "jest --runInBand"
  - [x] 2.4: Exportar o app Express sem iniciar server (para supertest)

- [x] Task 3: Criar testes backend para /register (AC10)
  - [x] 3.1: Criar backend/src/tests/register.test.ts
  - [x] 3.2: Teste: POST /api/auth/register com Professor válido → 201 + accessToken
  - [x] 3.3: Teste: POST /api/auth/register com Aluno adulto válido → 201 + accessToken
  - [x] 3.4: Teste: POST /api/auth/register com Aluno menor → 201 + requiresConsent=true
  - [x] 3.5: Teste: Senha fraca → 400 com campo details[]
  - [x] 3.6: Teste: Email duplicado → 409 com suggestions[]
  - [x] 3.7: Teste: academyId inválido → 404 "Academia não encontrada"
  - [x] 3.8: Executar testes e garantir que todos passam
  - [x] 3.9: Adicionar beforeAll/afterAll para reset e criação de academia de teste

- [x] Task 4: Adicionar link "Criar Conta" na página de Login (AC8)
  - [x] 4.1: Editar login-form.component.html — adicionar link para /register
  - [x] 4.2: Passar academyId como query param se disponível no localStorage

- [x] Task 5: Suporte a academyId por query param no RegisterFormComponent (AC9)
  - [x] 5.1: Injetar ActivatedRoute no RegisterFormComponent
  - [x] 5.2: No ngOnInit, verificar queryParams.academyId e usar se presente (prioriza URL sobre localStorage)

## Dev Notes

### Estado Atual da Implementação

**Backend — COMPLETO para AC1-AC7:**
- `POST /api/auth/register` → `registerUserHandler` em `backend/src/controllers/auth.ts` (linha ~270)
- `userRegistrationSchema` em `backend/src/lib/validators.ts` — valida email, password (regex), fullName, role, academyId (uuid), birthDate (ISO), responsavelEmail opcional
- `createUser(email, fullName, passwordHash, academyId, role, birthDate?, responsavelEmail?)` em `backend/src/lib/database.ts`
  - Calcula isMinor automaticamente (role=Aluno + birthDate + age<18)
  - Salva `is_minor`, `birth_date`, em `users` table
- `hashPassword`, `verifyPassword`, `validatePasswordStrength` em `backend/src/lib/password.ts`
- `logAudit` em `backend/src/lib/audit.ts` — fire-and-forget INSERT em `audit_logs`
- Rota mapeada em `backend/src/routes/auth.ts`: `router.post('/register', validate(userRegistrationSchema), authController.registerUserHandler)`

**Frontend — COMPLETO para AC1-AC7:**
- `RegisterFormComponent` em `frontend/src/components/register-form/`
  - FormGroup com: fullName, email, role (radio: Professor/Aluno), birthDate (condicional), responsavelEmail (condicional se menor), password, confirmPassword
  - `passwordStrengthValidator` (custom validator inline no component)
  - `PasswordValidatorService` (`frontend/src/services/password-validator.service.ts`) para cálculo do score
  - `isMinor()` detecta birthDate < 18 e role=Aluno → `responsavelEmail` torna-se obrigatório
  - Redireciona para `/admin/dashboard` se `accessToken` no response, senão `/login`
  - Mostra `requiresConsent` banner se aluno menor
- Rota `/register` → `RegisterFormComponent` em `frontend/src/app.routing.module.ts`
- `api.registerUser(...)` em `frontend/src/services/api.service.ts` → `POST http://localhost:3000/api/auth/register`

### Arquitetura Multi-Tenant

```
CRÍTICO: Toda query de usuário DEVE incluir academy_id para isolação
- getUserByEmail(email, academyId) → WHERE email=$1 AND academy_id=$2
- createUser(email, ..., academyId, ...) → INSERT com academy_id
- O academyId no register é passado pelo frontend (lido de localStorage ou query param)
```

### Tabela `users` no PostgreSQL

Schema relevante para story 1-2:
```sql
users (
  user_id         UUID PK,
  academy_id      UUID FK → academies.academy_id,
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(255) NOT NULL,
  role            VARCHAR(50)  -- 'Admin' | 'Professor' | 'Aluno'
  birth_date      DATE         -- nullable
  is_minor        BOOLEAN DEFAULT false,
  minor_consent_signed BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  deleted_at      TIMESTAMPTZ  -- soft delete
)
```

**consentStatus** é mapeado em `rowToUser()` como:
```typescript
consentStatus: row.minor_consent_signed ? 'consentido' : 'pendente'
necessitaConsentimentoResponsavel: row.is_minor || false
```

### JWT Response Pattern (auto-login)

O backend retorna `accessToken` no body para Professor e Aluno não-menor:
```typescript
// registerUserHandler — auth.ts ~linha 330
if (role === 'Professor' || (role === 'Aluno' && !user.necessitaConsentimentoResponsavel)) {
  const accessToken = sign({userId, email, academyId, role}, JWT_ACCESS_EXPIRES)
  // também seta refreshToken em cookie httpOnly
  return res.status(201).json({
    message: '✓ Registro realizado com sucesso',
    userId: user.id, email: user.email, role: user.role,
    accessToken,          // ← frontend usa este para auto-login
    requiresConsent: false
  })
}
// Aluno menor: retorna sem accessToken, requiresConsent: true
```

### Setup de Testes — Como Instalar Jest + Supertest

```bash
cd backend
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
```

**jest.config.js** (na raiz de `backend/`):
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts', '**/tests/**/*.test.ts', '**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageThreshold: { global: { branches: 70, functions: 70, lines: 70 } },
};
```

**CRÍTICO para Supertest:** O `app.listen()` está no `src/index.ts`. Para testes, o `app` precisa ser exportado **sem** iniciar o servidor. Solução: criar `src/app.ts` que exporta o app Express, e `src/index.ts` apenas chama `app.listen()`.

### Padrão de Testes — Ciclo beforeAll/afterAll

```typescript
// backend/src/tests/register.test.ts
import request from 'supertest';
import app from '../app';   // ← exportar app sem listen
import { resetDatabase, createAcademy } from '../lib/database';
import { pool } from '../lib/db';

let testAcademyId: string;

beforeAll(async () => {
  await resetDatabase();
  const academy = await createAcademy('Academia Teste 1-2', 'SP', 'teste@test.com', '11999999999');
  testAcademyId = academy.id;
});

afterAll(async () => {
  await resetDatabase();
  await pool.end();
});
```

### Validação de Senha — Requisitos

```
- Mínimo 8 caracteres
- Pelo menos 1 maiúscula: /[A-Z]/
- Pelo menos 1 número: /[0-9]/  
- Pelo menos 1 especial: /[!@#$%^&*]/
```

`validatePasswordStrength()` em `backend/src/lib/password.ts` — retorna `{ valid: boolean, errors: string[] }`

### Mapeamento de Rotas — Onde Fica Cada Coisa

```
Frontend (Angular 21, NgModule standalone:false):
  /register → RegisterFormComponent (frontend/src/components/register-form/)
  /login    → LoginFormComponent (frontend/src/components/login-form/)
  
Backend (Express.js):
  POST /api/auth/register → authController.registerUserHandler
  Todos os endpoints auth em: backend/src/routes/auth.ts
```

### PasswordValidatorService (frontend)

Em `frontend/src/services/password-validator.service.ts`:
```typescript
validatePasswordStrength(password: string): {
  score: number, // 0-100
  requirements: { minLength, hasUppercase, hasNumber, hasSpecialChar }
}
```
Usado pelo `RegisterFormComponent` para o strength meter visual.

### Pattern de Formulário Angular (standalone: false)

```typescript
// CRÍTICO: standalone: false — usar AppModule, não importar diretamente
// ReactiveFormsModule já importado em app.module.ts
// RegisterFormComponent já declarado em AppModule
```

### Admin Dashboard — Botões "Adicionar"

Os botões estão em `admin-dashboard.component.html` com `disabled` e `title="Próximas funcionalidades"`.  
Story 1-2 **não requer** que esses botões sejam ativados — isso é escopo de stories futuras.  
O acesso ao `/register` é via link direto ou "Criar Conta" na página de login.

### Email Sending — Abordagem Mock

O projeto ainda não tem SendGrid/AWS SES configurado. Email é implementado como `console.log()`:
```typescript
// Em registerUserHandler:
console.log(`[EMAIL] Enviando email de consentimento para ${responsavelEmail}`);
console.log(`[EMAIL] Enviando email de boas-vindas para professor: ${email}`);
```
Isso é suficiente para Story 1-2. Integração real com email service é escopo de Epic 2+ (LGPD).

### Referências de Código Existente

- [Source: backend/src/controllers/auth.ts] `registerUserHandler` — linhas ~270-360
- [Source: backend/src/lib/database.ts] `createUser` — suporta birthDate, isMinor
- [Source: backend/src/lib/validators.ts] `userRegistrationSchema` — Joi schema completo
- [Source: backend/src/lib/password.ts] `validatePasswordStrength`, `hashPassword`
- [Source: frontend/src/components/register-form/register-form.component.ts] — implementação completa
- [Source: frontend/src/components/login-form/login-form.component.ts] — precisa de link "Criar Conta"
- [Source: frontend/src/app.routing.module.ts] — `/register` já mapeado

### Checklist de Definition of Done

- [x] AC1-AC7: código funcional verificado com smoke test
- [x] AC8: link "Criar Conta" aparece na página de login
- [x] AC9: academyId lido de query param (prioridade sobre localStorage)
- [x] AC10: testes Jest passando (registro válido, email dup, senha fraca, menor, sem academia)
- [x] Todos os testes do arquivo 1-1 ainda passam (sem regressão)
- [x] `npm test` retorna green

## Dev Agent Record

### Agent Model Used
GPT-5.3-Codex (GitHub Copilot) — bmad-dev-story

### Debug Log References
- `npm test` (backend): 6/6 testes passando em `src/tests/register.test.ts`
- `npm run build` (backend): compilação TypeScript concluída
- `npm run build` (frontend): build concluído com warnings de budget CSS pré-existentes

### Completion Notes List
- Implementado setup de testes backend com Jest + Supertest.
- Criado `src/app.ts` para exportar app Express sem `listen`, habilitando testes de integração HTTP.
- Criada suíte `register.test.ts` cobrindo cenários críticos do endpoint de registro.
- Ajustado `login-form` para enviar `academyId` via query param ao navegar para registro.
- Ajustado `register-form` para priorizar `academyId` da URL, com fallback para `localStorage`.
- Ajustado `database.ts` para usar `crypto.randomUUID()` e evitar incompatibilidade ESM do pacote `uuid` no Jest.

### File List

**Criados:**
- backend/jest.config.js
- backend/src/app.ts
- backend/src/tests/register.test.ts

**Modificados:**
- backend/package.json
- backend/src/index.ts
- backend/src/lib/database.ts
- frontend/src/components/login-form/login-form.component.ts
- frontend/src/components/login-form/login-form.component.html
- frontend/src/components/register-form/register-form.component.ts

### Change Log

- 2026-03-21: Story file created (bmad-create-story). Implementação parcialmente completa — backend e frontend já implementados para AC1-AC7. Pendente: testes (AC10), link de registro no login (AC8), query param academyId (AC9).
- 2026-03-21: bmad-dev-story concluído. AC8, AC9 e AC10 implementados/validados; status atualizado para review.
