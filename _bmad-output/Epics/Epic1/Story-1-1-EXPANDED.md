# 📖 Story 1.1: Admin Cria Academia & Primeiro Usuário Admin

**Status:** ✅ Done  
**Priority:** 🔴 CRÍTICA (Foundation)  
**Estimated:** 3-4 dias  
**Story Points:** 13  
**Sprint:** Sprint 1 (Epic 1 - Foundation)

---

## 📝 User Story

```
Como um Administrador,
Quero criar uma nova academia e me registrar como o primeiro usuário admin,
Para que o sistema da academia seja inicializado e eu possa gerenciar outros usuários.
```

---

## ✅ Critérios de Aceitação (BDD Format)

### AC1: Academy Form Presentation
```gherkin
Dado que o sistema está vazio (nenhuma academia existe)
Quando um admin acessa o assistente de configuração inicial
Então o sistema apresenta um formulário para criar uma nova academia
E o formulário solicita: nome da academia, localização, email de contato, telefone
```

### AC2: Academy Data Validation
```gherkin
Dado que o formulário de academia é preenchido corretamente
Quando o admin clica "Criar Academia"
Então o sistema valida os dados (nome obrigatório, email válido, telefone formato correto)
E cria a academia no banco de dados
E a academia recebe um ID único (UUID)
```

### AC3: Multi-Tenant Setup
```gherkin
Dado que a academia foi criada
Quando o sistema passa para a próxima etapa
Então o sistema prepara o schema de banco de dados para aquela academia (multi-tenant ready)
E todas as subsequentes queries incluem academy_id para isolação
```

### AC4: Admin Registration
```gherkin
Dado que o schema está pronto
Quando o sistema solicita os dados do primeiro admin
Então o admin preenche: email, senha, nome completo
E a senha é validada: mínimo 8 caracteres + 1 maiúscula + 1 número + 1 caractere especial
E o email é validado: formato correto, não duplicado
```

### AC5: Secure Password Storage
```gherkin
Dado que a senha atende aos requisitos de segurança
Quando o admin clica "Registrar Admin"
Então a senha é hasheada usando bcryptjs (10 salt rounds)
E o usuário admin é criado no bank com role = "Admin"
E o sistema registra a criação no audit_logs (USER_CREATED event)
```

### AC6: JWT Authentication
```gherkin
Dado que o primeiro admin foi registrado
Quando o login é tentado com as credenciais corretas
Então o sistema gera JWT tokens:
  - access_token: 15-60 minutos de expiração
  - refresh_token: 7 dias de expiração
E o access_token é armazenado em memória (frontend)
E o refresh_token é armazenado em cookie seguro (httpOnly, sameSite=strict, CSRF protegido)
```

### AC7: Admin Dashboard
```gherkin
Dado que o primeiro admin está autenticado
Quando acessa o dashboard
Então o sistema exibe: "Academia inicializada com sucesso - pronto para adicionar usuários"
E mostra menu de ações: "Adicionar Professor", "Adicionar Aluno", "Settings"
E o admin consegue proceder para próximas stories
```

### AC8: Error Handling
```gherkin
Dado que houve erro durante a criação da academia
Quando o sistema detecta que a operação falhou
Então registra o erro no audit_logs: timestamp, tipo de erro, dados enviados
E exibe ao usuário: "Erro ao criar academia. Tente novamente ou contate suporte"
E oferece um botão "Tentar Novamente"
```

---

## 🔧 Contexto Técnico

### Database Tables (Already Created in V1)

| Tabela | Colunas Relevantes | Propósito |
|--------|-------------------|-----------|
| `academies` | id, name, location, email, phone, created_at | Academia principal |
| `users` | id, email, full_name, password_hash, academy_id, created_at | Usuários do sistema |
| `roles` | id, name, description | Papéis (admin, professor, student) |
| `user_roles` | user_id, role_id, academy_id | Relação N:N |
| `audit_logs` | id, user_id, action, entity, entity_id, academy_id, timestamp, ip_address | Rastreamento |

### Multi-Tenancy Architecture

```
Every table has: academy_id (foreign key to academies.id)
- users.academy_id → academies.id
- roles.academy_id → academies.id
- user_roles.academy_id → academies.id
- audit_logs.academy_id → academies.id

Query Pattern:
  SELECT * FROM users WHERE academy_id = ? AND email = ?
                                ↑ ALWAYS verify academy context
```

### API Endpoints to Implement

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/setup/init` | GET | None | Check if setup needed |
| `/api/academies` | POST | None | Create new academy (initial) |
| `/api/academies/:id/init-admin` | POST | None | Create first admin user |
| `/api/auth/login` | POST | None | Login (email + password) |
| `/api/auth/refresh` | POST | JWT | Get new access_token |
| `/api/users/@me` | GET | JWT | Get current user profile |

### Example Flow

```
1. Frontend: GET /api/auth/setup/init
   Response: { needsSetup: true }

2. Frontend: Show Academy Form
   User fills: name, location, email, phone

3. Frontend: POST /api/academies
   { 
     name: "Academia Judo Rei", 
     location: "São Paulo, SP",
     email: "admin@judobrei.com",
     phone: "11999999999"
   }
   Response: { academyId: "uuid-1234", nextStep: "admin-registration" }

4. Frontend: Show Admin Registration Form
   Admin fills: email, password, name

5. Frontend: POST /api/academies/{academyId}/init-admin
   {
     email: "admin@judobrei.com",
     password: "Abc123456!",
     fullName: "João Silva"
   }
   Response: { userId: "uuid-5678", message: "Admin criado. Faça login." }

6. Frontend: Show Login Form
   Admin fills: email, password

7. Frontend: POST /api/auth/login
   { email: "admin@judobrei.com", password: "Abc123456!" }
   Response: {
     accessToken: "eyJhbGc...",
     refreshToken: "eyJhbGc...",
     user: { id: "uuid-5678", email: "...", fullName: "..." }
   }
   Frontend stores: accessToken in memory, refreshToken in httpOnly cookie

8. Frontend: GET /api/users/@me
   Header: Authorization: Bearer {accessToken}
   Response: { id: "uuid-5678", email: "...", academy: { id: "uuid-1234", name: "..." } }

9. Frontend: Redirect to /admin/dashboard
   Display: Welcome message + academy info + action menu
```

### Frontend Architecture

```
Setup Wizard (3 Steps):
  Step 1: Academy Form
    ├─ Input: name, location, email, phone
    ├─ Validation: Joi/Zod schemas
    ├─ API: POST /api/academies
    └─ Success: Move to Step 2

  Step 2: Admin Registration Form
    ├─ Input: email, password, confirm password, fullName
    ├─ Validation: Password strength regex
    ├─ Visual: Password strength meter
    ├─ API: POST /api/academies/{academyId}/init-admin
    └─ Success: Move to Step 3

  Step 3: Login Form
    ├─ Input: email, password
    ├─ Validation: Required fields only
    ├─ API: POST /api/auth/login
    ├─ Storage: JWT in memory + cookie
    └─ Success: Redirect to /admin/dashboard

Dashboard:
  ├─ Header: Academy name, Admin profile, Logout
  ├─ Hero: "Academia inicializada com sucesso!"
  ├─ Actions: "Adicionar Professor", "Adicionar Aluno", "Settings"
  └─ Footer: Status badge "Ready"
```

---

## ✅ Tasks & Subtasks

### 🔒 Backend: Authentication Setup (1-2 dias)

**Task 1.1: Project Structure & Middleware**
- [ ] Create `src/api/routes/auth.ts` with route definitions (skeleton)
- [ ] Create `src/api/middleware/auth.ts` for JWT verification
- [ ] Create `src/api/middleware/validate.ts` for request validation
- [ ] Create `src/lib/jwt.ts` with sign/verify functions
- [ ] Update `src/index.ts` to load auth routes
- **Test:** All endpoints exist and return 200 OK (mock response)

**Task 1.2: Utility Functions**
- [ ] Create `src/lib/password.ts` with:
  - [ ] `hashPassword(pwd: string): Promise<string>` using bcryptjs
  - [ ] `verifyPassword(pwd: string, hash: string): Promise<bool>`
  - [ ] `validatePasswordStrength(pwd: string): { valid: bool, errors: string[] }`
- [ ] Create `src/lib/validators.ts` with:
  - [ ] Academy form validation (Joi schema)
  - [ ] Admin registration validation (Joi schema)
  - [ ] Email validation regex
  - [ ] Phone validation regex
- [ ] Create `src/lib/audit.ts` with:
  - [ ] `logAudit(userId, action, entity, entityId, academyId)`
- **Test:** Password hashing works, validators reject invalid input

**Task 1.3: JWT Configuration**
- [ ] Update `.env` with:
  - [ ] `JWT_SECRET=<random-64-char-string>`
  - [ ] `JWT_ACCESS_EXPIRES=3600` (1 hour, flexible: 15-60 min)
  - [ ] `JWT_REFRESH_EXPIRES=604800` (7 days)
  - [ ] `BCRYPT_ROUNDS=10`
- **Test:** Tokens generated and verified correctly

---

### 🏢 Backend: Academy Management (1 dia)

**Task 2.1: Academy Endpoints**
- [ ] Implement `POST /api/academies`
  - [ ] Validate request body (name, location, email, phone required)
  - [ ] Check academy doesn't already exist
  - [ ] Generate UUID for academy
  - [ ] Insert into `academies` table
  - [ ] Log to audit_logs: `ACADEMY_CREATED`
  - [ ] Return: `{ academyId, message, nextStep }`
- **Test:** 
  - [ ] Valid academy creation → 201 Created
  - [ ] Invalid data → 400 Bad Request with errors
  - [ ] Duplicate academy → 409 Conflict

**Task 2.2: Academy Initialization**
- [ ] Implement `GET /api/auth/setup/init`
  - [ ] Check if any academies exist
  - [ ] Return: `{ needsSetup: true/false }`
- **Test:**
  - [ ] First call → needsSetup: true
  - [ ] After academy creation → needsSetup: false

---

### 👤 Backend: User & Admin Registration (1 dia)

**Task 3.1: Admin Registration Endpoint**
- [ ] Implement `POST /api/academies/:id/init-admin`
  - [ ] Validate academy exists
  - [ ] Validate request body (email, password, fullName required)
  - [ ] Run password strength validation
  - [ ] Hash password
  - [ ] Insert into `users` table with `academy_id`
  - [ ] Insert into `user_roles` (admin role_id for this academy)
  - [ ] Log to audit_logs: `USER_CREATED`
  - [ ] Return: `{ userId, email, message }`
- **Test:**
  - [ ] Valid registration → 201 Created
  - [ ] Weak password → 400 with password error
  - [ ] Duplicate email (in same academy) → 409 Conflict

**Task 3.2: Password Strength Validation**
- [ ] Create regex validation for:
  - [ ] Minimum 8 characters
  - [ ] At least 1 uppercase letter
  - [ ] At least 1 number
  - [ ] At least 1 special character (!@#$%^&*)
- [ ] Return validation messages in Portuguese
- **Test:** Accept valid passwords, reject invalid patterns

---

### 🔐 Backend: Authentication (1 dia)

**Task 4.1: Login Endpoint**
- [ ] Implement `POST /api/auth/login`
  - [ ] Validate request body (email, password required)
  - [ ] Find user by email
  - [ ] Verify password hash
  - [ ] Generate access_token (15-60 min expiry)
  - [ ] Generate refresh_token (7 days expiry)
  - [ ] Store refresh_token in httpOnly cookie (sameSite=strict)
  - [ ] Log to audit_logs: `LOGIN_SUCCESS` or `LOGIN_FAILURE`
  - [ ] Return: `{ accessToken, user: { id, email, fullName, academy } }`
- **Test:**
  - [ ] Correct credentials → 200 with tokens
  - [ ] Wrong password → 401 Unauthorized
  - [ ] User not found → 401 Unauthorized
  - [ ] Refresh token in cookie (httpOnly, secure, sameSite)

**Task 4.2: Token Refresh Endpoint**
- [ ] Implement `POST /api/auth/refresh`
  - [ ] Extract refresh_token from cookie
  - [ ] Verify token
  - [ ] Generate new access_token
  - [ ] Store new refresh_token in cookie (rotation)
  - [ ] Return: `{ accessToken }`
- **Test:**
  - [ ] Valid refresh → 200 with new token
  - [ ] Expired refresh → 401 Unauthorized
  - [ ] Missing refresh token → 401 Unauthorized

**Task 4.3: Get Current User Endpoint**
- [ ] Implement `GET /api/users/@me`
  - [ ] Verify JWT from Authorization header
  - [ ] Fetch user with academy info
  - [ ] Return: `{ id, email, fullName, academy: { id, name } }`
- **Test:**
  - [ ] Valid token → 200 with user data
  - [ ] Invalid/missing token → 401 Unauthorized

---

### 🎨 Frontend: Setup Wizard (1-2 dias)

**Task 5.1: Setup Pages Structure**
- [ ] Create `frontend/src/pages/Setup.tsx`
  - [ ] Implement 3-step wizard layout
  - [ ] Create `SetupStepper.tsx` visual progress indicator
  - [ ] Create step routing (step 1/2/3)
  - [ ] Handle step validation before proceeding
- **Test:** Wizard renders, can navigate between steps

**Task 5.2: Academy Form (Step 1)**
- [ ] Create `frontend/src/components/AcademyForm.tsx`
  - [ ] Inputs: name, location, email, phone
  - [ ] Real-time validation feedback
  - [ ] Submit button disabled while invalid
  - [ ] Show validation errors inline
  - [ ] Call `POST /api/academies`
  - [ ] On success: Store academyId, proceed to step 2
  - [ ] On error: Show error message with retry button
- **Test:**
  - [ ] Form fields render
  - [ ] Validation works (email format, required fields)
  - [ ] API call on submit
  - [ ] Error handling displays user message

**Task 5.3: Admin Registration Form (Step 2)**
- [ ] Create `frontend/src/components/AdminForm.tsx`
  - [ ] Inputs: email, password, confirm password, fullName
  - [ ] Password strength meter (visual indicator)
  - [ ] Password requirements checklist (real-time):
    - [ ] ✓ 8+ characters
    - [ ] ✓ At least 1 uppercase
    - [ ] ✓ At least 1 number
    - [ ] ✓ At least 1 special character
  - [ ] Email validation
  - [ ] Submit button disabled while invalid
  - [ ] Call `POST /api/academies/{academyId}/init-admin`
  - [ ] On success: Proceed to step 3
  - [ ] On error: Show error (weak password guide, email duplicate, etc.)
- **Test:**
  - [ ] Password strength meter updates live
  - [ ] Weak password rejected with guidance
  - [ ] Form validation works
  - [ ] API call on submit

**Task 5.4: Admin Dashboard - Initial (Step 3)**
- [ ] Create `frontend/src/pages/AdminDashboard.tsx`
  - [ ] Show academy info at top
  - [ ] Hero message: "Academia inicializada com sucesso!"
  - [ ] Status badge: "Ready"
  - [ ] Action buttons grid:
    - [ ] "Adicionar Professor" → Future story
    - [ ] "Adicionar Aluno" → Future story
    - [ ] "Configurações" → Settings page (future)
  - [ ] Admin profile info (email, academy name)
  - [ ] Logout button
- **Test:** Dashboard renders after login, buttons navigable

---

### 🧪 Testing (Throughout Implementation)

**Task 6.1: API Tests**
- [ ] Create `src/tests/auth.test.ts`
  - [ ] POST /api/academies: valid creation
  - [ ] POST /api/academies: invalid data rejection
  - [ ] POST /api/auth/register/admin: valid registration
  - [ ] POST /api/auth/register/admin: password strength validation
  - [ ] POST /api/auth/login: correct credentials
  - [ ] POST /api/auth/login: wrong password
  - [ ] POST /api/auth/refresh: token refresh
  - [ ] GET /api/users/@me: authenticated access
- **Coverage:** 80%+ of auth endpoints

**Task 6.2: Frontend UI Tests**
- [ ] Create `frontend/src/tests/Setup.test.tsx`
  - [ ] Academy form validation
  - [ ] Admin form password strength
  - [ ] Step navigation
  - [ ] Error message display
- [ ] Create `frontend/src/tests/AdminDashboard.test.tsx`
  - [ ] Dashboard renders
  - [ ] Logout functionality
- **Coverage:** 80%+ of Setup components

**Task 6.3: Integration Tests**
- [ ] Full flow: Academy → Admin → Login → Dashboard
- [ ] Multi-tenant isolation (academy_id in queries)
- [ ] Audit logging verification
- **Coverage:** Happy path + error scenarios

**Task 6.4: Manual Testing Checklist**
- [ ] Can create academy with valid data
- [ ] Invalid academy data rejected with clear errors
- [ ] Password requirements enforced
- [ ] Login works with correct credentials
- [ ] JWT tokens generated (in memory + cookie)
- [ ] Admin dashboard loads after login
- [ ] Logout clears tokens
- [ ] Refresh token rotates on /refresh call
- [ ] Audit logs record all user actions

---

## 📁 Files to Create/Modify

### Backend

```
src/
├── api/
│   ├── routes/
│   │   ├── auth.ts ✨ NEW
│   │   └── index.ts (UPDATE - add auth routes)
│   ├── middleware/
│   │   ├── auth.ts ✨ NEW (JWT verification middleware)
│   │   └── validate.ts ✨ NEW (Request validation middleware)
│   ├── controllers/
│   │   ├── authController.ts ✨ NEW
│   │   └── academyController.ts ✨ NEW
│   └── types/
│       ├── auth.ts ✨ NEW (Interfaces: JWTPayload, User, Academy)
│       └── express.d.ts (OPTIONAL - extend Express.Request with user)
├── lib/
│   ├── jwt.ts ✨ NEW (sign, verify)
│   ├── password.ts ✨ NEW (hash, verify, validate strength)
│   ├── validators.ts ✨ NEW (Joi/Zod schemas)
│   └── audit.ts ✨ NEW (logAudit function)
├── config/
│   └── auth.ts ✨ NEW (JWT config constants)
└── tests/
    ├── auth.test.ts ✨ NEW
    └── integration.test.ts ✨ NEW

.env ✨ UPDATE
  JWT_SECRET=(...generated value...)
  JWT_ACCESS_EXPIRES=3600
  JWT_REFRESH_EXPIRES=604800
  BCRYPT_ROUNDS=10

package.json ✨ UPDATE
  Dependencies:
    - bcryptjs
    - jsonwebtoken
    - joi (or zod)
    - supertest (dev)
    - @types/bcryptjs (dev)
    - @types/jsonwebtoken (dev)
```

### Frontend

```
frontend/src/
├── pages/
│   ├── Setup.tsx ✨ NEW
│   ├── AdminDashboard.tsx ✨ NEW
│   └── index.ts (UPDATE - add routes)
├── components/
│   ├── SetupStepper.tsx ✨ NEW (Visual progress)
│   ├── AcademyForm.tsx ✨ NEW
│   ├── AdminForm.tsx ✨ NEW
│   └── PasswordStrengthMeter.tsx ✨ NEW
├── hooks/
│   ├── useAuth.ts ✨ NEW (Context/store for auth state)
│   ├── useSetup.ts ✨ NEW (Wizard state management)
│   └── useToken.ts ✨ NEW (Token storage/refresh)
├── services/
│   ├── api.ts ✨ UPDATE (Add auth endpoints)
│   └── auth.ts ✨ NEW (Auth service functions)
├── types/
│   └── auth.ts ✨ NEW (Interfaces: User, Academy, JWTResponse)
├── utils/
│   └── validators.ts ✨ NEW (Frontend validation rules)
├── tests/
│   ├── Setup.test.tsx ✨ NEW
│   └── AdminDashboard.test.tsx ✨ NEW
└── App.tsx ✨ UPDATE (Add auth routes)

frontend/.env ✨ UPDATE
  VITE_API_URL=http://localhost:3000
  VITE_JWT_EXPIRY_MINUTES=60

package.json ✨ UPDATE
  Dependencies:
    - react-hook-form
    - zod (or joi)
    - axios
    - js-cookie
```

---

## 🎯 Acceptance Test Checklist (Manual)

### Academy Creation
- [ ] Academy form renders with all required fields
- [ ] Validation error shows for empty name
- [ ] Validation error shows for invalid email
- [ ] Valid academy creation succeeds
- [ ] Success message shows academy ID

### Admin Registration
- [ ] Admin form renders after academy creation
- [ ] Password strength meter shows real-time feedback
- [ ] Weak password rejected with guidance
- [ ] Valid password accepted
- [ ] Admin creation succeeds

### Authentication
- [ ] Login form works with valid credentials
- [ ] JWT access_token returned
- [ ] Refresh_token stored in httpOnly cookie
- [ ] Dashboard loads after login
- [ ] GET /api/users/@me returns current user

### Dashboard
- [ ] Welcome message displays
- [ ] Academy name shown
- [ ] Action buttons visible
- [ ] Logout functionality works (tokens cleared)

### Security & Multi-Tenancy
- [ ] Audit logs created for all events
- [ ] Password stored as hash (never plain text)
- [ ] JWT tokens expire correctly
- [ ] Cookie is httpOnly (not accessible via JS)
- [ ] Academy isolation maintained (academy_id in all queries)

---

## 📝 Dev Notes

- Framework: Express.js (Backend), React (Frontend)
- DB: PostgreSQL (already configured with schema via Flyway V1-V5)
- Auth: JWT + Refresh Token Rotation
- Password: bcryptjs hashing
- Validation: Joi/Zod schemas
- Testing: Jest + Supertest (API), @testing-library/react (UI)
- Environment: `.env` file with JWT_SECRET, expiry times

---

## 🔄 Change Log

| Date | Change |
|------|--------|
| 2026-03-20 | Story expanded with complete technical context and tasks |
| 2026-03-20 | Sprint status updated (epic-1, 1-1 → in-progress) |

---

## 📊 Dev Agent Record

**Assigned:** 2026-03-20  
**Status:** 🔄 In Progress  
**Updated:** 2026-03-20

### Debug Log
- [2026-03-20 10:30] Story 1-1 expanded with tasks and technical context
- [2026-03-20 10:30] Files to create/modify outlined
- [2026-03-20 10:30] Ready for implementation

### Completion Notes
*(To be filled during development)*

---

**Story Ready for Development** ✅
