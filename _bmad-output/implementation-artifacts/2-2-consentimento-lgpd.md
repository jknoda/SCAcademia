# Story 2.2: Consentimento LGPD

Status: review

## Story

Como Responsável por um aluno menor de idade,
Quero receber um link por email para assinar digitalmente o formulário de consentimento LGPD em 3 etapas,
Para que a academia possa coletar e processar legalmente os dados de saúde do meu dependente.

## Contexto de Negócio

- **FR16:** Sistema requer consentimento explícito do responsável ANTES de qualquer dado ser coletado (menor < 18)
- **FR17:** Coleta autorização para som/imagem (fotos/vídeos)
- **FR18:** Coleta aceite de Código de Ética da Academia
- **FR19:** Todos os consentimentos são armazenados com timestamp e rastreamento de versão
- Dependência: Story 2.1 (anamnese já implementada) — o registro do Aluno já cria `is_minor = true` quando `birthDate < 18 anos`
- Já implementado no `registerUserHandler` (auth.ts): quando `user.necessitaConsentimentoResponsavel === true`, o backend loga `CONSENT_EMAIL_SENT` e armazena `responsavelEmail` — mas o email real e o link ainda NÃO são enviados. Esta story implementa o fluxo completo.

## Acceptance Criteria

### AC1 — Token de Consentimento Gerado e Enviado por Email
- DADO que um Aluno menor de idade foi registrado (is_minor=true, responsavelEmail preenchido)
- QUANDO o Admin confirma o cadastro ou re-solicita consentimento
- ENTÃO o sistema gera um token único UUID armazenado em `auth_tokens` (type=`consent_request`, expires em 7 dias)
- E envia email para `responsavelEmail` com link `http://frontend/consent/:token`
- E loga `CONSENT_EMAIL_SENT` na audit_log

### AC2 — Guest Flow (sem login) via Token
- DADO que o Responsável recebeu o email com o link
- QUANDO acessa `http://frontend/consent/:token`
- ENTÃO o frontend valida o token via `GET /api/consent/:token/validate` (retorna studentName, academyName, expiresAt)
- E exibe o wizard de 3 etapas SEM exigir login
- SE o token não existe ou expirou → mensagem de erro clara com instrução para contato

### AC3 — Wizard Passo 1: Termos LGPD (tipo `privacy`)
- DADO que o Responsável abriu o link válido
- QUANDO visualiza a Etapa 1
- ENTÃO vê o texto completo do `consent_template` ativo (tipo `privacy`) carregado via `GET /api/consent/:token/template/privacy`
- Deve ter scroll obrigatório até o final para habilitar botão "Li e Aceito"
- Textos: "Consentimento para coleta de dados de saúde de menor de idade conforme LGPD"

### AC4 — Wizard Passo 2: Autorização de Imagem + Código de Ética (tipos `health` e `ethics`)
- DADO que o Responsável aceitou a Etapa 1
- QUANDO visualiza a Etapa 2
- ENTÃO vê dois checkboxes independentes:
  - ☐ "Autorizo uso de imagem e som (fotos/vídeos) do meu dependente para fins da academia"
  - ☐ "Li e aceito o Código de Ética da Academia"
- Ambos devem ser marcados para avançar

### AC5 — Wizard Passo 3: Assinatura Digital
- DADO que o Responsável aceitou os termos
- QUANDO visualiza a Etapa 3
- ENTÃO vê campo de nome completo (confirmação de identidade)
- E vê canvas de assinatura (pad onde o Responsável desenha a assinatura com mouse/touch)
- A assinatura desenhada é convertida para PNG/base64 → armazenada como BYTEA em `consents.signature_image`
- Há botão "Limpar" e "Confirmar Assinatura"

### AC6 — Submissão Final e Persistência
- DADO que o Responsável completou os 3 passos
- QUANDO clica "Finalizar Consentimento"
- ENTÃO o frontend envia `POST /api/consent/:token/sign` com `{ signatureBase64: string }`
- O backend:
  1. Valida token (ainda válido, type=`consent_request`)
  2. Insere 3 registros em `consents`: um para cada tipo (`privacy`, `health`, `ethics`), todos com `status='accepted'`, `signed_at=NOW()`, `signed_by_user_id=null` (guest), `guardian_id` = userId do Responsável (se existir na tabela users) ou null
  3. Atualiza token para expirado (`status='used'` via `updated_at`)
  4. Atualiza `users.minor_consent_signed = true` para o aluno
  5. Loga `CONSENT_SIGNED` na `audit_logs` com IP
  6. Retorna `{ message: 'Consentimento registrado com sucesso', studentName }`
- O frontend exibe tela de sucesso com agradecimento

### AC7 — Re-envio de Link pelo Admin
- DADO que um aluno está sem consentimento pendente
- QUANDO Admin acessa o painel do aluno e clica "Reenviar convite de consentimento"
- ENTÃO o sistema gera novo token e envia novo email (invalida token anterior se existir)
- Endpoint: `POST /api/admin/students/:studentId/resend-consent`

### AC8 — Status Visível no Admin
- DADO que um aluno é menor de idade
- QUANDO Admin visualiza a lista de alunos
- ENTÃO o aluno tem indicador de status de consentimento: `✅ Concluído` / `⏳ Pendente` / `❌ Expirado`
- Baseado em `users.minor_consent_signed` e data de expiração do token

## Tasks / Subtasks

- [x] **Task 1 — DB: Verificar schema e adicionar coluna minor_consent_signed se necessário** (AC6)
  - [x] Checar se `users.minor_consent_signed` já existe no schema (`_bmad-output/schema.sql` e V2_0)
  - [x] Se não existir, criar migração `V2_1__minor_consent_signed.sql`

- [x] **Task 2 — Backend: lib/consents.ts** (AC1, AC6)
  - [x] `ConsentRecord` interface alinhada com tabela `consents`
  - [x] `createConsentRequest(studentId, academyId): Promise<string>` — gera token UUID em `auth_tokens` type=`consent_request`
  - [x] `validateConsentToken(token): Promise<{studentId, academyId, studentName, academyName, expiresAt} | null>`
  - [x] `signConsents(token, signatureBuffer, guardianId?): Promise<void>` — insere 3 registros em `consents`
  - [x] `getConsentStatus(studentId): Promise<'accepted' | 'pending' | 'expired' | 'none'>`
  - [x] `getActiveTemplate(academyId, type): Promise<ConsentTemplate | null>` — busca `consent_templates` ativos

- [x] **Task 3 — Backend: lib/validators.ts — adicionar schemas Joi** (AC1, AC6)
  - [x] `consentSignSchema`: `{ signatureBase64: Joi.string().required() }`

- [x] **Task 4 — Backend: controllers/consent.ts** (AC1-AC8)
  - [x] `validateTokenHandler` — `GET /api/consent/:token/validate`
  - [x] `getTemplateHandler` — `GET /api/consent/:token/template/:type`
  - [x] `signConsentHandler` — `POST /api/consent/:token/sign`
  - [x] `resendConsentHandler` — `POST /api/admin/students/:studentId/resend-consent` (auth: Admin)
  - [x] Todo handler usa `logAudit()` para actions relevantes

- [x] **Task 5 — Backend: routes/consent.ts** (AC1-AC8)
  - [x] `GET /api/consent/:token/validate` — público (sem authMiddleware)
  - [x] `GET /api/consent/:token/template/:type` — público
  - [x] `POST /api/consent/:token/sign` — público
  - [x] `POST /api/admin/students/:studentId/resend-consent` — authMiddleware + role Admin

- [x] **Task 6 — Backend: app.ts — registrar rotas** (AC1)
  - [x] `app.use('/api/consent', rateLimit({windowMs: 60_000, max: 20}), consentRoutes)`

- [x] **Task 7 — Backend: Seed default consent_templates** (AC3, AC4)
  - [x] Script SQL ou função de seed para inserir template `privacy` ativo com texto padrão LGPD (PT-BR)
  - [x] Template `ethics` com texto de código de ética genérico

- [x] **Task 8 — Frontend: types/index.ts — adicionar interfaces** (AC2-AC6)
  - [x] `ConsentValidation { studentName, academyName, expiresAt, isValid }` interface
  - [x] `ConsentTemplate { templateId, version, consentType, content }` interface

- [x] **Task 9 — Frontend: services/api.service.ts — adicionar métodos** (AC2-AC6)
  - [x] `validateConsentToken(token)` → GET /api/consent/:token/validate
  - [x] `getConsentTemplate(token, type)` → GET /api/consent/:token/template/:type
  - [x] `signConsent(token, signatureBase64)` → POST /api/consent/:token/sign
  - [x] `resendConsent(studentId)` → POST /api/admin/students/:studentId/resend-consent

- [x] **Task 10 — Frontend: components/consent-wizard/** (AC2-AC6)
  - [x] `consent-wizard.component.ts` — standalone: false, sem AuthGuard, recebe :token via ActivatedRoute
  - [x] `consent-wizard.component.html` — wizard 3 etapas com stepper visual
  - [x] `consent-wizard.component.scss` — seguir padrão blue gradient + white card

- [x] **Task 11 — Frontend: Signature Pad** (AC5)
  - [x] `<canvas>` com listeners de mouse/touch events para capturar assinatura
  - [x] Método `getSignatureBase64()` retorna PNG em base64
  - [x] Botão "Limpar" chama `ctx.clearRect()`
  - [x] NÃO instalar biblioteca externa — implementar canvas nativo (projeto não usa libs de terceiros para UI)

- [x] **Task 12 — Frontend: app.module.ts + app.routing.module.ts** (AC2)
  - [x] Declarar `ConsentWizardComponent` no module
  - [x] Adicionar rota `{ path: 'consent/:token', component: ConsentWizardComponent }` — SEM AuthGuard (guest flow)

- [x] **Task 13 — Email simulado (console.log)** (AC1)
  - [x] Não há serviço de email integrado — simular com `console.log('[EMAIL] Link consentimento: http://localhost:4200/consent/:token')`
  - [x] Estrutura deve ser facilmente substituível por nodemailer em produção

## Dev Notes

### Padrões de Código Obrigatórios

**Backend — seguir exatamente os padrões de `backend/src/`:**
- Funções exportadas (sem classes), ex: `export const signConsents = async (...) => { ... }`
- Pool importado de `./db` (não de `./database`)
- Erros retornados como: `res.status(xxx).json({ error: 'mensagem' })`
- Sem classes `AppError`, sem `sendResponse()` helper
- Tipos: `AuthenticatedRequest` de `../types` para rotas autenticadas
- JWT payload: `req.user!.userId` (NÃO `req.user!.id`)
- Roles com inicial maiúscula: `'Admin'`, `'Professor'`, `'Aluno'`, `'Responsavel'`
- Audit: `logAudit(userId, action, entity, entityId, academyId, ip?, details?)` de `lib/audit.ts`

**Frontend — seguir exatamente os padrões de `frontend/src/`:**
- `standalone: false` em todos os componentes
- ReactiveFormsModule + FormBuilder (sem Template-driven forms)
- `ApiService` injetado via constructor (HttpClient encapsulado)
- CSS: blue gradient container + white card (copiar de register-form.component.scss)
- Angular 21 — sem `@defer`, sem standalone components, sem signals

### Schema do Banco (tabelas relevantes)

```sql
-- Tabela: auth_tokens (já existente, usada para reset de senha)
-- Reutilizar para consent_request tokens:
-- type = 'consent_request'
-- token = UUID
-- expires_at = NOW() + INTERVAL '7 days'
-- user_id = studentId (aluno menor)

-- Tabela: consents
consent_id UUID PK
user_id UUID FK → users (o aluno)
academy_id UUID FK → academies
consent_template_version INT
consent_type VARCHAR CHECK IN ('health', 'ethics', 'privacy')
status VARCHAR CHECK IN ('pending', 'accepted', 'declined', 'expired', 'withdrawn')
signature_image BYTEA (PNG base64 → Buffer)
signed_by_user_id UUID FK → users (null para guest)
guardian_id UUID FK → users (Responsavel, se cadastrado)
created_at TIMESTAMP
signed_at TIMESTAMP
expires_at TIMESTAMP

-- Tabela: consent_templates
template_id UUID PK
academy_id UUID FK
version INT
consent_type VARCHAR CHECK IN ('health', 'ethics', 'privacy')
content TEXT (texto completo do termo)
is_active BOOLEAN
effective_at TIMESTAMP
expires_at TIMESTAMP
UNIQUE (academy_id, consent_type, version)
```

**ATENÇÃO:** Verificar se `users.minor_consent_signed` existe (`boolean DEFAULT false`). Se não estiver na migration V2_0, criar `V2_1__minor_consent_signed.sql`:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS minor_consent_signed BOOLEAN DEFAULT false;
```

### Verificar auth_tokens table para type consent_request

```ts
// Padrão existente em database.ts para storeAuthToken:
export const storeAuthToken = async (
  userId, academyId, type, token, expiresAt, ip?, userAgent?
) => { ... }

// Reutilizar para consent_request:
await storeAuthToken(studentId, academyId, 'consent_request', token, expiresAt7days)
```

### Assinatura Digital — Canvas Nativo

```typescript
// No template HTML:
// <canvas #sigPad width="400" height="150" (mousedown)="startDraw($event)"...></canvas>

// No component:
@ViewChild('sigPad') sigPad!: ElementRef<HTMLCanvasElement>;
private ctx!: CanvasRenderingContext2D;
private isDrawing = false;

startDraw(e: MouseEvent) { this.isDrawing = true; ... }
draw(e: MouseEvent) { if (!this.isDrawing) return; ctx.lineTo(...); ctx.stroke(); }
stopDraw() { this.isDrawing = false; }
clearPad() { this.ctx.clearRect(0, 0, canvas.width, canvas.height); }
getSignatureBase64(): string { return this.sigPad.nativeElement.toDataURL('image/png'); }
```

### Consent Templates — Seed Inicial

Como não há painel para criar templates ainda (Story 2.3), a Story 2.2 deve incluir seed de templates padrão para que o fluxo funcione. Criar um SQL de seed ou uma função chamada no startup que insira templates ativos se não existirem. Usar `INSERT ... ON CONFLICT DO NOTHING`.

Texto mínimo para template `privacy` (PT-BR):
> "Este consentimento autoriza [Academia] a coletar e processar os dados de saúde do menor [Nome], conforme a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018). Os dados serão utilizados exclusivamente para fins de gestão esportiva e cuidados de saúde no ambiente da academia..."

### Wizard — Etapas e Estado

```
Step 1: Verificação token → studentName, academyName
Step 2: Termos LGPD (privacy) — scroll obrigatório
Step 3: Checkboxes health + ethics
Step 4: Assinatura digital
Step 5: Confirmação / Sucesso
```

Estado no component:
```typescript
currentStep = 1;       // 1-5
tokenData: ConsentValidation | null = null;
privacyScrolled = false;
healthAccepted = false;
ethicsAccepted = false;
signatureBase64 = '';
isLoading = false;
errorMessage = '';
```

### Rate Limiting

- Rotas públicas de consentimento: `rateLimit({ windowMs: 60_000, max: 20 })` — mais restrito para prevenir abuso

### Segurança

- Token de consentimento: UUID v4 gerado com `crypto.randomUUID()` (Node.js nativo) — NÃO usar Math.random()
- `signature_image` armazenado como BYTEA: `Buffer.from(base64.split(',')[1], 'base64')`
- Validar que token pertence à academia correta antes de processar
- Request de `POST /sign` deve verificar que token type === `consent_request` e status !== expirado

### Project Structure Notes

**Novos arquivos no backend:**
```
backend/src/lib/consents.ts          ← DB layer (functions)
backend/src/controllers/consent.ts   ← HTTP handlers
backend/src/routes/consent.ts        ← Express Router
```

**Novos arquivos no frontend:**
```
frontend/src/components/consent-wizard/
  consent-wizard.component.ts
  consent-wizard.component.html
  consent-wizard.component.scss
```

**Arquivos existentes a modificar:**
```
backend/src/lib/validators.ts        ← adicionar consentSignSchema
backend/src/app.ts                   ← registrar /api/consent
frontend/src/types/index.ts          ← ConsentValidation, ConsentTemplate
frontend/src/services/api.service.ts ← 4 novos métodos
frontend/src/app.module.ts           ← declarar ConsentWizardComponent
frontend/src/app.routing.module.ts   ← rota /consent/:token sem AuthGuard
```

### O que Story 2.3 vai continuar

- Story 2.2 cria apenas 1 versão de template (cod hardcoded ou seed)
- Story 2.3 cria painel Admin para criar/versionar templates e re-solicitar consentimento

### References

- Schema DB: `_bmad-output/V2_0__Health_LGPD.sql` (tabelas: consents, consent_templates, student_guardians)
- Schema DB geral: `_bmad-output/schema.sql`
- Padrão controller: `backend/src/controllers/auth.ts` (loginHandler, registerUserHandler)
- Padrão DB lib: `backend/src/lib/database.ts` + `backend/src/lib/healthRecords.ts`
- Padrão validation: `backend/src/lib/validators.ts`
- Padrão route: `backend/src/routes/auth.ts`
- Padrão component Angular: `frontend/src/components/register-form/register-form.component.ts`
- Padrão component Angular health: `frontend/src/components/health-screening-form/health-screening-form.component.ts`
- App routing: `frontend/src/app.routing.module.ts`
- Token storage (reutilizar): `backend/src/lib/database.ts#storeAuthToken`
- Audit: `backend/src/lib/audit.ts#logAudit`
- Projeto ctx: `_bmad-output/project-context.md` (seção Responsavel + LGPD)
- FRs origem: `_bmad-output/implementation-artifacts/FunctionalRequirements-SCAdemia.md` (FR16-FR19)

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Implementado backend de consentimento em `lib`, `controllers` e `routes`.
- Integrada rota `/api/consent` com rate limit de 20 req/min.
- Integrado seed de templates no fluxo de inicializacao do admin.
- Implementado wizard frontend sem AuthGuard com assinatura canvas nativa.
- Validacao estaticamente verificada via diagnostics sem erros nos arquivos alterados.

### Completion Notes List

- Fluxo completo de token guest implementado (`validate`, `template`, `sign`).
- Persistencia de 3 consentimentos (`privacy`, `health`, `ethics`) no backend.
- `minor_consent_signed` atualizado apos assinatura.
- Reenvio de convite implementado com simulacao de email via console.
- Componente Angular de 5 etapas criado com UX de leitura obrigatoria + aceite + assinatura.

### File List

- backend/src/controllers/auth.ts
- backend/src/controllers/consent.ts
- backend/src/routes/consent.ts
- backend/src/lib/consents.ts
- backend/src/lib/validators.ts
- backend/src/app.ts
- frontend/src/types/index.ts
- frontend/src/services/api.service.ts
- frontend/src/components/consent-wizard/consent-wizard.component.ts
- frontend/src/components/consent-wizard/consent-wizard.component.html
- frontend/src/components/consent-wizard/consent-wizard.component.scss
- frontend/src/app.module.ts
- frontend/src/app.routing.module.ts
