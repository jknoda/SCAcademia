---
title: SCAcademia — Project Context
language: pt-BR
version: 1.0
created: 2026-03-19
status: READY FOR DEVELOPMENT
---

# SCAcademia — Project Context

**Última Atualização:** 19 de Março de 2026  
**Status:** ✅ READY FOR DEVELOPMENT  
**Linguagem:** Português Brasileiro (PT-BR)

---

## 1. 🎯 Visão Geral do Projeto

### Definição

**SCAcademia** é uma plataforma web de gerenciamento de treinamento (fitness/atividades físicas) com conformidade total à **Lei Geral de Proteção de Dados (LGPD)** brasileiro.

### Propósito Principal

Permitir que **Professores** registrem treinos rapidamente (< 2 minutos), **Alunos** visualizem progresso em dashboards engajadores, e **Administradores** monitorem a saúde do sistema com conformidade regulatória total.

### Escopo Definido

| Métrica | Valor |
|---------|-------|
| **Total de Epics** | 8 (valor-direcionado) |
| **Total de Stories** | 51 (BDD com AC) |
| **Functional Requirements** | 54 FRs |
| **Non-Functional Requirements** | 23 NFRs |
| **Estimated Effort** | 430-520 story points |
| **Estimated Duration** | 20-28 weeks (5-7 months) |
| **Team Size** | 5-8 devs (recomendado) |

### Público-Alvo

| Persona | Uso Primário | Volume Estimado |
|---------|--------------|-----------------|
| **Professor** (PRIMARY) | Registra treinos, monitora alunos | 100-500 por academia |
| **Aluno** (SECONDARY) | Visualiza progresso, recebe notificações | 500-5000 por academia |
| **Admin** (TERTIARY) | Monitora sistema, conformidade LGPD | 1-5 por academia |
| **Responsavel** | Consentimento parental (menores) | Ad-hoc |

---

## 2. 🛠️ Tech Stack Definido

### Frontend

```
Framework:       Angular 16+
UI Library:      Angular Material v16
State Management: NgRx 16+
Build:           Angular CLI + Webpack
CSS:             SCSS + Material Theming
Icons:           Material Icons
Charts:          Chart.js ou D3.js (TBD)
Testing:         Jasmine + Karma (unit) + Cypress (E2E)
Offline:         IndexedDB + localForage
Bundler:         Webpack (via Angular CLI)
Performance:     Lighthouse CI (SLO gates)
```

**Design System:**
- **Color Palette:**
  - Primary: Azul #0052CC (Judo Theme official)
  - Secondary: Orange #FF6B35 (engagement / highlights)
  - Success: Green #28A745
  - Warning: Yellow #FFC107
  - Danger: Red #DC3545
  - Neutral: Gray #6C757D

- **Typography:**
  - Headings: Roboto 16-32px (Material standard)
  - Body: Roboto 14-16px
  - Code: Roboto Mono

- **Iconography:** Material Icons set (48x48px minimum touch targets)

### Backend

```
Runtime:         Node.js 18 LTS
Framework:       Express.js 4.18+
Language:        TypeScript 5+
ORM/Query:       Sequelize 6.x ou TypeORM 0.3+ (TBD)
Authentication:  jsonwebtoken (JWT) + bcryptjs
Validation:      joi + class-validator
API Style:       REST (JSON) — GraphQL optional for future
Rate Limiting:   express-rate-limit
CORS:            cors middleware
Logging:         winston + structured JSON logging
Error Handling:  Custom error middleware + Sentry (staging+)
```

### Database

```
Primary:         PostgreSQL 14+ (production-grade)
Schema:          Multi-tenant (academy_id on every table)
Connection Pool: pgbouncer (production) or built-in pooling
Migrations:      Flyway ou db-migrate (TBD)
Encryption:      pgcrypto (Postgres extension for AES-256)
Backup:          pg_dump automated daily @ 02:30 UTC
```

**Key Tables (Story 1.1 baseline):**
- `academies` (tenant root)
- `users` (Professor, Aluno, Admin, Responsavel)
- `roles` + `permissions` (RBAC)
- `auth_tokens` (JWT tracking)
- `audit_logs` (LGPD compliance)

### Cache & Async

```
Cache:           Redis 7+ (sessions, rate-limiting data, computed results)
Job Queue:       Bull (Node.js task queue) or Celery (if Python added)
Message Broker:  Redis Streams (events) ou RabbitMQ (TBD)
Push Notifications: Firebase Cloud Messaging (FCM)
Email Service:   SendGrid ou AWS SES
```

### Infrastructure & DevOps

```
Containerization: Docker (Alpine base images)
Orchestration:   Docker Compose (local dev) + Kubernetes (production, TBD)
CI/CD:           GitHub Actions (automated tests + deploy)
Monitoring:      Prometheus + Grafana (metrics)
Logging:         Loki (centralized logging)
Alerting:        AlertManager (Slack + SMS + PagerDuty)
APM:             (New Relic ou Datadog, TBD)
Code Quality:    SonarQube (optional)
Security Scan:   npm audit + Snyk + OWASP ZAP
```

### Security & Encryption

```
Auth:            JWT (access + refresh token pattern)
Password Hash:   bcryptjs (b-crypt, 12 rounds)
Data Encryption: AES-256 (health data at rest)
Backup Encrypt:  AES-256 (backups encrypted)
Digital Sig:     RSA-2048 (LGPD compliance reports)
HTTPS:           TLS 1.3 (production)
API Key Mgmt:    AWS Secrets Manager ou HashiCorp Vault (production)
```

---

## 3. 👥 Personas & RBAC

### Personas Detalhadas

#### **1. Professor (PRIMARY PERSONA)**
- **Objetivo Principal:** Registrar treinos rapidamente, visualizar progresso do aluno
- **Comportamento Key:** Quer experiência conversacional, input rápido (< 2 min total)
- **Device:** Desktop (80%) + Mobile (20%, occasional)
- **Padrão de Uso:** 3-5x por semana, sessões de 5-20 minutos
- **Pain Points:** Atual processo manual (papel/planilha), sem feedback real-time
- **Features Críticas:** 
  - Entry point wizard (2 cliques para iniciar)
  - Frequência toggle (48x48px para mobile)
  - Anotações rápidas (auto-save)
  - Histórico (revisar treinos passados)

#### **2. Aluno (SECONDARY PERSONA)**
- **Objetivo Principal:** Ver progresso, manter motivação, receber badges
- **Comportamento Key:** Acessa para ver "como estou indo", comparar com outros
- **Device:** Mobile-first (70%) + Desktop (30%)
- **Padrão de Uso:** 2-3x por semana, 5-10 minutos por sessão
- **Pain Points:** Falta visibilidade de progresso, motivação externa
- **Features Críticas:**
  - Dashboard 4 cards (visual progress)
  - Badges + notifications (gamification)
  - Comparação mês-a-mês
  - Share progress (social)

#### **3. Admin (TERTIARY PERSONA)**
- **Objetivo Principal:** Monitorar saúde sistema, conformidade LGPD, gestão de usuários
- **Comportamento Key:** Reativo (alerta de problema) + Proativo (métricas diárias)
- **Device:** Desktop exclusively
- **Padrão de Uso:** Daily ou on-demand monitoring, 10-30 min sessions
- **Pain Points:** Sem visualização centralizada, compliance manual
- **Features Críticas:**
  - Dashboard status (🟢/🟡🔴)
  - Auditoria LGPD (timeline access)
  - Alertas real-time (Slack + SMS)
  - Backup + recovery validation

#### **4. Responsavel (PARENTAL)**
- **Objetivo Principal:** Dar consentimento para menor de idade
- **Comportamento Key:** One-time user, receives email link
- **Device:** Any
- **Padrão de Uso:** Única vez por período
- **Features Críticas:**
  - Email link (7-day validity)
  - Digital signature (consent capture)
  - No login required (guest flow)

### RBAC — 4 Papéis Definidos

| Role | Permissões | Acesso | EPA Story |
|------|-----------|--------|-----------|
| **Admin** | Full access (users, audit, backups, config) | Toda app | 1.5 |
| **Professor** | CRUD próprios treinos, read alunos, write anotações | Upload treino, Dashboard | 1.2-3.x |
| **Aluno** | READ próprio progresso, notificações, consentimento | Dashboard, Profile | 1.2 + 4.x |
| **Responsavel** | Sign consent (one-time), READ analytics próprio aluno | Consent link only | 2.2 |

**Query-Level Filtering:** (Story 1.5)
- Professor vê apenas alunos de suas turmas
- Aluno vê apenas seu próprio progresso
- Admin vê tudo com auditoria logging
- Responsavel acessa apenas link consentimento específico

---

## 4. 🏗️ Architecture Principles

### Design Principles

1. **Multi-Tenant by Design**
   - Cada academia é tenant isolado (database row-level security via academy_id)
   - Zero data leakage entre academias
   - Performance: sharding-ready (future)

2. **Offline-First Architecture**
   - IndexedDB cache no cliente (Story 6.1)
   - Sync queue para mudanças (Story 6.2)
   - Last-Write-Wins conflict resolution (Story 6.3)
   - Detecta reconexão automaticamente (< 2s, Story 6.1)

3. **LGPD-Compliant by Default**
   - Consentimento explícito (Story 2.2)
   - Auditoria imutável (append-only logs, Story 2.4)
   - Right to be forgotten (cascade soft-delete, Story 2.5)
   - Data encryption at rest (AES-256, Story 2.1)

4. **Performance-First**
   - SLOs defined (< 1.5s FCP, < 2.5s LCP, Story 7.1)
   - Bundle optimization (< 80KB initial, Story 7.3)
   - Lighthouse CI gates (fail on breach, Story 7.1)
   - Lazy loading + code splitting (Story 7.3)

5. **Accessible by Default**
   - WCAG 2.1 AA standard (Story 7.2)
   - Keyboard 100% navigation (Story 7.4)
   - Screen reader support (aria-labels, Story 7.4)
   - 48x48px minimum touch targets (mobile)

6. **Security-Hardened**
   - JWT auth + refresh token (Story 1.3)
   - Rate limiting (3 tries = block, Story 1.3)
   - Password hashing (bcrypt, Story 1.2)
   - TLS 1.3 end-to-end (production)

### Architectural Flows

**Authentication Flow (Story 1.1-1.5):**
```
User Input → Password Hash (bcryptjs) → JWT Issue (access + refresh) 
→ Store in Browser (secure httpOnly cookie) → Every Request Includes Token 
→ Server Validates (no DB hit via cache) → Refresh on Expiry (transparent)
```

**Offline Sync Flow (Epic 6):**
```
App Offline? → Store in IndexedDB (local queue) 
→ Reconnect Detected? → Ordered Sync (Auth → Freq → Técnicas → Notas) 
→ Conflict? → Last-Write-Wins Resolution → Backend Accepts/Rejects 
→ Visual Feedback (✓ synced)
```

**LGPD Audit Flow (Story 2.4):**
```
User Action → Immutable Log Write (WHO/WHAT/WHEN/WHERE) → Timestamped 
→ No Delete (only add audit clear request) → Export PDF (signed RSA-2048) 
→ Admin Review in Timeline UI
```

---

## 5. 📊 Key Features by Epic

### Quick Reference Matrix

| Epic | User Value | # Stories | Key Stories | FRs |
|------|-----------|-----------|-------------|-----|
| **1: Auth** | Users can login & access | 5 | 1.1 Setup, 1.3 Login JWT, 1.5 RBAC | 14 |
| **2: Health/LGPD** | Health tracked + compliant | 6 | 2.1 Anamnese, 2.4 Audit, 2.5 Right2Forgot | 10 |
| **3: Prof Training** | Quick training registration | 8 | 3.2 Freq, 3.3 Técnicas, 3.8 Offline | 8 |
| **4: Student Progress** | Visual engagement + badges | 7 | 4.1 Dashboard, 4.7 Notifications | 7 |
| **5: Admin Control** | Monitoring + compliance | 7 | 5.1 Dashboard, 5.3 Reports, 5.7 Health | 11 |
| **6: Offline-First** | Works without internet | 5 | 6.1 Detect, 6.2 Queue, 6.3 Conflict | 4 |
| **7: Polish** | Fast + accessible + quality | 5 | 7.1 Performance, 7.2 A11y, 7.5 Readiness | NFRs |
| **8: DevOps** | Deploy + monitor automatically | 4 | 8.1 Docker, 8.2 CI/CD, 8.3 Monitoring | DevOps |

### Feature Highlights by Epic

**Epic 1 — Authentication & Access Control (2-3 weeks)**
- Multi-tenant academy setup (Story 1.1)
- User registration with email validation (Story 1.2)
- JWT login with rate limiting (Story 1.3)
- Password reset via email (Story 1.4)
- Role-based access control (Story 1.5)

**Epic 2 — Health & LGPD Compliance (3-4 weeks)**
- Health form (anamnese) with AES-256 encryption (Story 2.1)
- 3-step LGPD consent form (Story 2.2)
- Consent versioning + re-consent (Story 2.3)
- Immutable audit trail (Story 2.4)
- Right to be forgotten (30-day grace, Story 2.5)
- Compliance PDF reports (Story 2.6)

**Epic 3 — Professor Love (4-5 weeks)**
- Conversational wizard entry point (Story 3.1)
- Quick frequency marking (48x48px toggles, Story 3.2)
- Technique dropdown with autocomplete (Story 3.3)
- Per-student notes with auto-save (Story 3.4)
- Review & confirm screen (Story 3.5)
- Success modal + next flow (Story 3.6)
- Training history (Story 3.7)
- **Offline sync infrastructure (Story 3.8)**

**Epic 4 — Student Engagement (3-4 weeks)**
- Dashboard with 4 expandable cards (Story 4.1)
- Progress chart (12-week view, Story 4.2)
- Attendance table with streaks (Story 4.3)
- Comment timeline (Story 4.4)
- Badge grid with progress (Story 4.5)
- Month-to-month comparison (Story 4.6)
- Push/email/in-app notifications (Story 4.7)

**Epic 5 — Admin Control (3-4 weeks)**
- Admin dashboard with status indicators (Story 5.1)
- LGPD audit timeline (Story 5.2)
- 6-page compliance PDF (Story 5.3)
- Real-time alerts (Story 5.4)
- User management (Story 5.5)
- Daily backup + test-restore (Story 5.6)
- System health monitor with timeseries (Story 5.7)

**Epic 6 — Offline-First (2-3 weeks)**
- Connectivity detection (Story 6.1)
- Sync queue with ordering (Story 6.2)
- Last-Write-Wins conflict resolution (Story 6.3)
- Retry with exponential backoff (Story 6.4)
- Offline UX indicators (Story 6.5)

**Epic 7 — Polish & Accessibility (2-3 weeks)**
- Performance benchmarking & SLO (Story 7.1)
- WCAG 2.1 AA compliance (Story 7.2)
- Bundle optimization < 80KB (Story 7.3)
- Keyboard nav 100% (Story 7.4)
- Production readiness checklist (Story 7.5)

**Epic 8 — DevOps & Monitoring (1-2 weeks)**
- Docker containerization (Story 8.1)
- GitHub Actions CI/CD pipeline (Story 8.2)
- Monitoring stack (Prometheus + Loki + Grafana, Story 8.3)
- Canary + rollback automation (Story 8.4)

---

## 6. 🎯 Performance Targets (SLOs)

### Web Vitals & Lighthouse

| Metric | Target | Status | Story |
|--------|--------|--------|-------|
| **FCP** (First Contentful Paint) | < 1.5s | ✅ SLO | 7.1 |
| **LCP** (Largest Contentful Paint) | < 2.5s | ✅ SLO | 7.1 |
| **CLS** (Cumulative Layout Shift) | < 0.1 | ✅ SLO | 7.1 |
| **TTI** (Time to Interactive) | < 3s | ✅ SLO | 7.1 |
| **Lighthouse Score** | ≥ 90 | ✅ Target | 7.1 |

### Application-Level SLOs

| Operation | Target | Story |
|-----------|--------|-------|
| User Registration | < 2s | 1.2 |
| Login | < 1s | 1.3 |
| Dashboard Load | < 1s (skeleton 100ms) | 4.1 + 7.1 |
| Training Registration | < 2 min (total UX) | 3.1-3.6 |
| Offline Cache Hit | instant (< 100ms) | 6.1 |
| Sync Queue Process | < 30s per batch | 6.2 |
| API Response Time | < 200ms (95th percentile) | 7.1 |

### Bundle Size Targets

| Component | Target | Story |
|-----------|--------|-------|
| Initial JS (gzipped) | < 80KB | 7.3 |
| CSS (gzipped) | < 50KB | 7.3 |
| Per-Route Chunk | < 40KB | 7.3 |
| Total App (all chunks) | < 500KB | 7.3 |

**Monitoring:** GitHub Actions Lighthouse CI (fail build if breach)

---

## 7. 🔐 Compliance & Security

### LGPD (Lei Geral de Proteção de Dados)

**Princípios Core:**
- **Necessidade:** Coleta apenas dado necessário (Story 2.1)
- **Finalidade:** Uso coerente com propósito (transparent em Story 2.2)
- **Consentimento:** Explícito, separado por tipo (Story 2.2)
- **Transparência:** Acesso + exportação de dados (Story 2.4)
- **Direito ao Esquecimento:** Deletar dados pessoais (Story 2.5)

**Implementation Details:**

| Requisito | Implementation | Story |
|-----------|-----------------|-------|
| **Consentimento Explícito** | 3-step form (saúde, ética, privacidade) + digital signature | 2.2 |
| **Versionamento Consentimento** | Template versions + template versioning + auto-expire 60 dias | 2.3 |
| **Auditoria Imutável** | Append-only logs (who/what/when/where) + never delete | 2.4 |
| **Direito Esquecimento** | 30-day grace period → soft-delete (data) + hard-delete (health) | 2.5 |
| **Data Export** | PDF report com compliance score + audit trail + RSA-2048 signature | 2.6 |
| **Portabilidade** | Export all personal data in standard format on request | Story 2.6 (future) |

### Data Security

| Layer | Protection | Implementation |
|-------|-----------|-----------------|
| **At Rest** | AES-256 encryption | Health data encrypted in DB (pgcrypto) |
| **In Transit** | TLS 1.3 | HTTPS enforced (production) |
| **Auth** | JWT + bcrypt | Story 1.3, password hash 12 rounds |
| **Backup** | AES-256 encrypted | Backups encrypted before storage |
| **Signature** | RSA-2048 | LGPD reports signed with private key |

### Access Control

- **RBAC:** 4 roles (Admin, Professor, Aluno, Responsavel) with granular permissions (Story 1.5)
- **Row-Level Security:** academy_id filtering (Story 1.5)
- **Rate Limiting:** 3 failed logins = 15 min block (Story 1.3)
- **Token Expiry:** Access token 1 hour, refresh token 7 days (Story 1.3)
- **Audit Logging:** Every action logged immutably (Story 2.4)

### Compliance Checkpoints

- **Before Epic 1 Merge:** Security review (auth, encryption, rate limiting)
- **Before Epic 2 Merge:** LGPD officer review (consentimento, auditoria, direito esquecimento)
- **Before Production Deploy:** Full security audit (penetration testing, code review)

---

## 8. 💻 Development Conventions

### Language & Communication

```
Primary Language:     Portuguese Brazilian (PT-BR)
Code Comments:        PT-BR
Commit Messages:      PT-BR (pt-br: Story-N-M description)
PR Descriptions:      PT-BR
Documentation:        PT-BR
Team Communication:   PT-BR (meetings, Slack, PRs)
```

### Git Workflow

**Branch Strategy:**
```
main                 ← Production (protected, PR-required)
├── develop          ← Staging (pre-production testing)
│   ├── feature/story-1-1-setup-academia
│   ├── feature/story-1-2-user-registration
│   ├── feature/story-3-2-frequency-marking
│   └── ...
└── hotfix/urgent-fix
```

**Commit Format:**
```
feat: Story-N-M — Descrição curta em PT-BR

Descrição longa explicando:
- Qual AC foi implementada
- Como foi implementada
- Testes adicionados
- Referência: https://github.com/...

Fixes #issueNumber (se applicable)
```

**Example:**
```
feat: Story-3-2 — Marcar frequência com toggle 48x48px

Implementa AC 1-3 de Story 3.2 (Marcar Frequência):
- Toggle 48x48px para touch targets
- Auto-advance para próximo aluno
- Rate limit: 1 toggle per 1 second (prevent double-click)
- Undo window 1 segundo

Tests:
- Unit: ProfessorFrequencyToggle.spec.ts (5 test cases)
- E2E: cypress/e2e/professor-frequency.cy.ts (3 scenarios)
- Performance: Interaction to Paint < 100ms ✓

Fixes #AC-3.2.1
```

### Code Style & Linting

| Tool | Config | Purpose |
|------|--------|---------|
| **ESLint** | .eslintrc.json (Angular standard) | Code style enforcement |
| **Prettier** | .prettierrc (2 spaces, 100 line width) | Auto-formatting |
| **TypeScript** | tsconfig.json (strict mode) | Type safety |
| **Husky** | pre-commit hooks | Lint + test before commit |

**Enforce in CI:** Fail build if eslint or prettier violations

### Testing Strategy

| Type | Tool | Coverage | Story |
|------|------|----------|-------|
| **Unit** | Jasmine + Karma | Per component/service (80%+) | Each story |
| **E2E** | Cypress | Critical user flows | Each story AC |
| **Integration** | Testcontainers | API + DB interaction | Per Epic |
| **Performance** | Lighthouse CI | SLO validation | 7.1 |
| **Accessibility** | axe-core | WCAG AA compliance | 7.2 |
| **Security** | npm audit | Dependency vulnerabilities | 8.2 |

**Definition of Done (Per Story):**
- [ ] Code written (AC implemented)
- [ ] Unit tests (80%+ coverage)
- [ ] E2E tests (critical flows)
- [ ] Code review (2 approvals)
- [ ] Lint/style passing
- [ ] Performance tested (SLO OK)
- [ ] Accessibility tested (WCAG AA)
- [ ] Documentation updated
- [ ] Merged to develop

### Branching & PR Process

**Before Starting Story:**
1. Create feature branch from develop: `feature/story-N-M-description`
2. Setup task in Jira (linked to PR)

**During Development:**
1. Implement AC (Given/When/Then)
2. Write unit tests
3. Write E2E tests
4. Commit with proper message format
5. Push to GitHub

**Create PR:**
1. Title: `[Story N-M] Descrição`
2. Description: Link to Jira + summary of AC + how to test
3. Set reviewers (min 2 required approvals)
4. Wait for CI/CD to pass (all tests, lint, security scan)

**After Approval:**
1. Merge to develop (squash commits recommended)
2. Delete feature branch
3. Monitor staging deployment
4. Move Jira ticket to "Review"

---

## 9. 🚀 Deployment Strategy

### Environments

| Env | Purpose | Frequency | Approval |
|-----|---------|-----------|----------|
| **Local** | Developer machine (Docker Compose) | Continuous | None |
| **Develop** | Shared dev environment (CI/CD auto) | Per merge to develop | None |
| **Staging** | Production-like testing | Per release candidate | Tech Lead |
| **Production** | Live (user-facing) | Manual gate | PO + Tech Lead |

### Deployment Process

**Automated via GitHub Actions (Story 8.2):**

```
Push to develop:
  1. Run all tests (unit + E2E)
  2. Lint + security scan
  3. Build production bundle (Lighthouse SLO check)
  4. Build Docker images (frontend + backend)
  5. Push to ghcr.io
  6. Auto-deploy to staging (canary: 10%)

Push to main (tagged vX.Y.Z):
  1. [Same as develop]
  2. Manual approval gate in GitHub
  3. Deploy to production:
     - Canary: 10% of traffic (30 min monitor)
     - If OK: Progressive rollout (50% → 100%)
     - If health check fails: Automatic rollback
```

### Canary Deployment

**10% Canary Phase (30 min monitoring):**
- Metrics watched: error_rate < 0.1%, response_time < 200ms, p95 latency
- Thresholds for automatic rollback: any metric breach = ROLLBACK
- Manual review possible (pause & investigate)

**Progressive Rollout (after canary OK):**
- 50% deployment (15 min monitor)
- 100% deployment (full rollout)

**Rollback Procedure:**
- Automatic: health check failure triggers immediate rollback
- Manual: 1-click rollback in GitHub Actions console (< 5 min complete)

### Backup & Disaster Recovery

| Process | Frequency | RTO | RPO | Story |
|---------|-----------|-----|-----|-------|
| **Automated Backup** | Daily @ 02:30 UTC | - | 24 hours | 5.6 |
| **Manual Backup** | On-demand | - | 0 hours | 5.6 |
| **Test Restore** | Monthly (production data to sandbox) | 1 hour | - | 5.6 |
| **Disaster Recovery** | Tested quarterly | 4 hours | < 1 hour | 5.6 |

**Backup Encryption:** AES-256 (all backups encrypted before storage)  
**Backup Location:** Separate AWS region (not same as production)

---

## 10. 📚 Documentation Links

### Core Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| **EPICS-AND-STORIES-SUMMARY.md** | Executive overview of all 51 stories | Everyone (start here) |
| **REQUIREMENTS-COVERAGE-MAP.md** | FR → Story traceability | PO, QA, Developers |
| **DEVELOPMENT-READINESS-CHECKLIST.md** | Pre-dev validation + FAQ | Tech Lead, Developers |
| **INDEX-AND-NAVIGATION.md** | Team navigation guide | Everyone (ongoing reference) |

### Story Files

```
_bmad-output/Epics/
├── Epic1-Authentication/Story-1-1.md through Story-1-5.md
├── Epic2-HealthLGPD/Story-2-1.md through Story-2-6.md
├── Epic3-ProfTraining/Story-3-1.md through Story-3-8.md
├── Epic4-StudentProgress/Story-4-1.md through Story-4-7.md
├── Epic5-AdminControl/Story-5-1.md through Story-5-7.md
├── Epic6-Offline/Story-6-1.md through Story-6-5.md
├── Epic7-Polish/Story-7-1.md through Story-7-5.md
└── Epic8-DevOps/Story-8-1.md through Story-8-4.md
```

### External References

- **Product Brief:** [product-brief-SCAcademia.md](docs/product-brief-SCAcademia.md)
- **Architecture Document:** [Architecture-SCAcademia.md](docs/architecture-SCAcademia.md) (if exists)
- **UX Design Spec:** [UX-Design-SCAcademia.md](docs/UX-Design-SCAcademia.md) (if exists)

---

## 11. 🔍 Key Decision Log

### Architecture Decisions

**Decision 1: Multi-Tenant Database Design**
- **Chosen:** Row-level security (academy_id on all tables)
- **Alternative Considered:** Separate database per academy
- **Rationale:** Cost efficiency, easier backup/restore, shared infrastructure for observability
- **Tradeoff:** Slightly more complex queries, require discipline on academy_id filtering (Story 1.5)

**Decision 2: Offline-First Architecture**
- **Chosen:** IndexedDB client-side cache + sync queue (Story 6.x)
- **Alternative Considered:** Server-only, no offline support
- **Rationale:** Reliability (works without internet), UX (instant feedback), Professor use case (gym WiFi unreliable)
- **Tradeoff:** Complex conflict resolution, sync queue management, manual testing required

**Decision 3: Monolithic Backend (for now)**
- **Chosen:** Single Node.js/Express server (Epics 1-8)
- **Alternative Considered:** Microservices (auth service, training service, etc)
- **Rationale:** Team size (5-8 devs), scope (51 stories), time-to-market (20-28 weeks)
- **Future Migration:** Can split to microservices post-launch if needed (Event-driven ready)

**Decision 4: PostgreSQL Multi-Tenant**
- **Chosen:** PostgreSQL with pgcrypto extension + row-level security
- **Alternative Considered:** NoSQL (DynamoDB), separate databases per tenant
- **Rationale:** ACID compliance (LGPD audit trail critical), cost (managed AWS), query flexibility
- **Tradeoff:** Not ideal for extreme scale (100k academies), but sufficient for 5-7 month roadmap

**Decision 5: Angular SPA (decided in UX Design phase)**
- **Chosen:** Angular 16+ + Material Design
- **Alternative Considered:** React, Vue, Svelte
- **Rationale:** Material Design library readiness, enterprise-grade, team experience (assumed)
- **Tradeoff:** Bundle size slightly larger, steeper learning curve for new joiners

### Technology Decisions

| Decision | Chosen | Alternative | Rationale |
|----------|--------|-------------|-----------|
| ORM | Sequelize 6 | TypeORM, Knex | Simpler migrations, mature ecosystem |
| Form Validation | joi + class-validator | Zod, Yup | Industry standard, TS support |
| Testing Frontend | Cypress + Jasmine | Playwright, Testing Library | Angular default tooling |
| Testing Backend | Jest + Supertest | Mocha + Chai | Faster, simpler config |
| Caching | Redis 7 | Memcached, ElastiCache | Persistence, data types, streams |
| Job Queue | Bull | Celery, Sidekiq | Node.js native, Redis-backed |
| Monitoring | Prometheus + Grafana | Datadog, New Relic | Open-source, self-hosted option |

---

## 12. 📅 Estimated Timeline

### High-Level Roadmap

```
PHASE 1 — FOUNDATION (Weeks 1-3)
  Sprint 1: Epic 1 (Authentication & RBAC)             [5 stories, 40-50 pts]
  Sprint 2: Epic 2 (Health) + Epic 3 Start             [6 stories parallel, 60-70 pts]

PHASE 2 — FEATURE BUILD (Weeks 4-12)
  Sprint 2-3: Epic 3 (Professor Training)              [8 stories, 80-100 pts]
  Sprint 4: Epic 4 (Student Progress)                  [7 stories, 70-80 pts]
  Sprint 5: Epic 5 (Admin Control)                     [7 stories, 60-70 pts]

PHASE 3 — QUALITY & RELEASE (Weeks 13-28)
  Parallel during Phase 2:
    - Epic 6 (Offline-First)                           [5 stories, 50-60 pts]
    - Epic 7 (Performance & A11y Polish)               [5 stories, 40-50 pts]
    - Epic 8 (DevOps & Monitoring)                     [4 stories, 30-40 pts]
  
  Final Weeks:
    - Sprint N: Testing + Integration Bugs              [20-30 pts]
    - Sprint N+1: Production Readiness + Load Testing   [10-20 pts]
    - Sprint N+2: Go-Live Support + Hotfixes            [Flexible]

TOTAL: 20-28 weeks (5-7 months) with 5-8 person team
```

### Dependency-Based Sequencing

```
CRITICAL PATH (Sequential - Must complete in order):
  Epic 1 (Auth) → Epic 2/3 (parallel after 1) → Epic 4 (requires 3 data) → Epic 5

PARALLEL STREAMS (Can start after Week 3):
  Epic 6 (Offline) — Supplements main app
  Epic 7 (Polish) — Improves existing features
  Epic 8 (DevOps) — Foundation for deployment

MILESTONE GATES:
  Week 3: Epic 1 complete (users can login)
  Week 6: Epic 2 + 3 complete (health + training working)
  Week 9: Epic 4 complete (student can see progress)
  Week 12: Epic 5 complete (admin can monitor)
  Week 18: Epics 6-7 complete (offline + quality)
  Week 20: Epic 8 complete (DevOps + ready to deploy)
  Week 22-28: Testing, bug fixes, go-live preparation
```

### Sprint-Level Planning

**Each Sprint = 2 weeks (10 working days)**

| Sprint | Epics | Stories | Velocity Target | Events |
|--------|-------|---------|-----------------|--------|
| 1 | Epic 1 | 1.1-1.5 | 40-50 pts | Kickoff, Daily standup, Retro |
| 2 | Epic 2 + 3* | 2.1-2.6 + 3.1-3.4 | 60-70 pts | Mid-sprint demo (internal) |
| 3 | Epic 3 + 6* | 3.5-3.8 + 6.1-6.3 | 50-60 pts | Sprint review + retro |
| 4+ | Per plan above | ... | 50-70 pts | Bi-weekly cadence |

*Parallelizable sprints

---

## 13. ⚠️ Risks & Mitigation

### High-Risk Items

| Risk | Severity | Impact | Mitigation |
|------|----------|--------|-----------|
| **LGPD Compliance Miss** | CRITICAL | Legal liability, app ban | LGPD officer review Epic 2 before merge (Story 2.x certification) |
| **Offline Sync Conflicts** | HIGH | Data loss, corruption | Comprehensive test suite (Story 6.3 Unit + E2E), manual testing checklist |
| **Performance SLO Breach** | HIGH | User experience, adoption | Lighthouse CI gates (fail build, Story 7.1), performance budget enforcement |
| **Data Security Issue** | HIGH | LGPD violation, PR disaster | Security audit before production deploy, npm audit in CI, OWASP ZAP scan |
| **Database Scaling Failure** | MEDIUM | Performance degradation | Load testing (1000 concurrent users) in staging, index benchmarking, query optimization pre-launch |
| **Authentication Token Expiry Bug** | MEDIUM | Users logout randomly | Comprehensive JWT testing (Story 1.3 AC coverage), background refresh testing |

### Mitigation Strategies

1. **LGPD Compliance:**
   - Assign LGPD compliance officer to Epic 2 review
   - Have lawyer review consent forms (Story 2.2)
   - Test right to be forgotten flow (Story 2.5) with real data deletion
   - Audit trail testing before production

2. **Offline Sync:**
   - Pair programming on Story 6.2-6.3 (complex logic)
   - Write extensive unit tests (Last-Write-Wins edge cases: clock skew, rapid changes)
   - Network throttling tests (Cypress with DevTools throttling)
   - Manual testing: loose WiFi simulation

3. **Performance:**
   - Lighthouse CI gates (fail build if score < 90, Story 7.1)
   - Bundle analyzer in CI (fail if initial > 80KB, Story 7.3)
   - Performance monitoring from day 1 (New Relic lite or local Prometheus)
   - Stress test: 1000 concurrent dashboard loads

4. **Security:**
   - npm audit in CI (fail on HIGH/CRITICAL, Story 8.2)
   - Code security review (static analysis with SonarQube, optional)
   - Penetration testing pre-launch (external consultant)
   - OWASP Top 10 coverage checklist

5. **Accessibility:**
   - axe-core automated testing (fail build if violations, Story 7.2)
   - Manual testing with screen readers (1 JAWS, 1 NVDA session per epic)
   - Keyboard-only testing (disable mouse 1 hour per sprint)
   - Zoom testing (200% zoom responsive check)

---

## 14. 👥 Team Contacts

### Roles & Responsibility

| Role | Name | Email | Slack | Backup |
|------|------|-------|-------|--------|
| **Product Owner** | _________________ | ____________ | _________________ | ________ |
| **Tech Lead** | _________________ | ____________ | _________________ | ________ |
| **DevOps Lead** | _________________ | ____________ | _________________ | ________ |
| **LGPD Officer** | _________________ | ____________ | _________________ | ________ |
| **QA Lead** | _________________ | ____________ | _________________ | ________ |

### Communication Channels

| Channel | Purpose | Frequency |
|---------|---------|-----------|
| **#scacademia** (Slack) | General discussion | Daily |
| **#scacademia-devs** (Slack) | Dev-only, code review | Daily |
| **#scacademia-alerts** (Slack) | Automated CI/CD alerts | On event |
| **Daily Standup** | 9:00 AM (15 min) | Every weekday |
| **Sprint Retro** | Friday 4:00 PM (1 hour) | Bi-weekly |
| **Sprint Planning** | Monday 2:00 PM (2 hours) | Bi-weekly |
| **Code Review Meeting** | Optional Wednesday (30 min) | Weekly |

### Escalation Path

1. **Story Clarification:** Ask Story writer or Product Owner
2. **Technical Blocker:** Post in #scacademia-devs + notify Tech Lead
3. **LGPD Concern:** Escalate to LGPD Officer immediately
4. **Production Incident:** Notify team + on-call DevOps (SMS emergency channel)
5. **Schedule/Scope Change:** Product Owner + Tech Lead review

---

## 📋 Document Metadata

**Last Updated:** 19 de Março de 2026  
**Version:** 1.0  
**Status:** ✅ READY FOR DEVELOPMENT  
**Next Review:** After Sprint 1 completion (refinements)  
**Ownership:** Product Owner + Tech Lead (maintain)

---

## 🔗 Quick Links

- 📊 [EPICS-AND-STORIES-SUMMARY.md](EPICS-AND-STORIES-SUMMARY.md)
- 🔍 [REQUIREMENTS-COVERAGE-MAP.md](REQUIREMENTS-COVERAGE-MAP.md)
- ✅ [DEVELOPMENT-READINESS-CHECKLIST.md](DEVELOPMENT-READINESS-CHECKLIST.md)
- 🗺️ [INDEX-AND-NAVIGATION.md](INDEX-AND-NAVIGATION.md)

---

**Generated:** 2026-03-19  
**Workflow:** bmad-create-epics-and-stories (Complete)  
**Status:** ✅ READY FOR DEVELOPMENT
