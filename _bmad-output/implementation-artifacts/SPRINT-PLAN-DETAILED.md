# 🎯 SCAcademia — Sprint Plan (Detalhado)

**Generated:** 2026-03-20  
**Status:** ✅ Ready for Development  
**Language:** Português Brasileiro  

---

## 📊 Visão Geral dos Sprints

| Sprint | Epic | Duração | Stories | Sequência |
|--------|------|---------|---------|-----------|
| **Sprint 1** | 🔐 Epic 1: Foundation | Semana 1-2 | 5 | PRIMEIRO (bloqueante) |
| **Sprint 2** | 🏥 Epic 2: Saúde/LGPD | Semana 3-4 | 6 | Após S1 |
| **Sprint 3** | 👨‍🏫 Epic 3: Training | Semana 5-6 | 8 | Após S1, antes S4 |
| **Sprint 4** | 🎓 Epic 4: Student | Semana 7-8 | 8 | Após S3 |
| **Sprint 5** | 👨‍💼 Epic 5: Admin | Semana 9-10 | 7 | Após S4 |
| **Sprint 6** | 📡 Epic 6: Offline | Semana 5-12 | 5 | PARALELO (flex) |
| **Sprint 7** | ✨ Epic 7: Polish | Semana 7-12 | 5 | PARALELO (flex) |
| **Sprint 8** | ⚙️ Epic 8: DevOps | Semana 5-12 | 4 | PARALELO (flex) |

**Total:** 52 Stories | **Duração:** 10-12 semanas | **Team Size:** 3-5 devs

---

## 🏃 Sprint 1: Foundation — Autenticação & RBAC

**Objetivo:** Estabelecer base de autenticação, JWT, RBAC e multi-tenancy

### Stories (5 total)

```
1.1 ✅ Admin Cria Academia & Primeiro Admin
    → Setup multi-tenant, seed admin
    Esforço: Médio (3-4 dias)

1.2 ✅ Registro de Usuário (Professor/Aluno)
    → Form, validação, email
    Esforço: Médio (2-3 dias)

1.3 ✅ Login com JWT
    → Login form, JWT token, refresh
    Esforço: Médio (2-3 dias)

1.4 ✅ Recuperação de Senha
    → Password reset flow
    Esforço: Pequeno (1-2 dias)

1.5 ✅ RBAC — Controle por Papel
    → Middleware, permissions, roles
    Esforço: Médio (2-3 dias)
```

**Métricas:**
- Total Points: 13-16
- Velocity: 5-6 points/semana
- Duração: 2-3 semanas

**Deliverables:**
- ✅ Backend API: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/reset`
- ✅ Frontend: Login page, Signup page, Password reset page
- ✅ Database: All identity tables populated
- ✅ Tests: 80%+ coverage

---

## 🏥 Sprint 2: Saúde & LGPD

**Objetivo:** Implementar health records com conformidade LGPD total

### Stories (6 total)

```
2.1 ✅ Anamnese Inicial (Health Screening)
    → Health form, blood type, allergies
    Esforço: Médio (2-3 dias)

2.2 ✅ Consentimento LGPD (3-step form)
    → Consent wizard, signature capture
    Esforço: Médio (2-3 dias)

2.3 ✅ Versionamento de Consentimento
    → Version history, audit trail
    Esforço: Pequeno (1-2 dias)

2.4 ✅ Auditoria LGPD (Access Timeline)
    → Audit log UI, search, export
    Esforço: Médio (2-3 dias)

2.5 ✅ Direito ao Esquecimento
    → Right-to-be-forgotten workflow
    Esforço: Médio (2-3 dias)

2.6 ✅ Relatório LGPD (PDF compliance)
    → Generate compliance report
    Esforço: Pequeno (1-2 dias)
```

**Métricas:**
- Total Points: 12-15
- Duração: 2-3 semanas

**Deliverables:**
- ✅ Health records encrypted & stored
- ✅ Digital consent system with signatures
- ✅ 7-year audit retention
- ✅ LGPD compliance dashboard

---

## 👨‍🏫 Sprint 3: Professor Love — Training

**Objetivo:** Treinos registrados em < 2 minutos com UX conversacional

### Stories (8 total)

```
3.1 ✅ Entry Point Conversacional
    → Wizard start, "novo treino?"
    Esforço: Pequeno (1-2 dias)

3.2 ✅ Marcar Frequência (Toggle UI)
    → 48x48px toggles, quick marking
    Esforço: Pequeno (1 dia)

3.3 ✅ Adicionar Técnicas (Dropdown)
    → Tech selector, multi-add
    Esforço: Pequeno (1-2 dias)

3.4 ✅ Anotações & Notas
    → Auto-expand textarea, sentiment
    Esforço: Pequeno (1-2 dias)

3.5 ✅ Revisar & Confirmar
    → Visual summary page
    Esforço: Pequeno (1 dia)

3.6 ✅ Sucesso & Continuidade
    → Green card + "próximo treino?"
    Esforço: Pequeno (1 dia)

3.7 ✅ Histórico de Treinos
    → List + edit + audit trail
    Esforço: Médio (2-3 dias)

3.8 ✅ Sincronização Offline
    → IndexedDB cache + sync queue
    Esforço: Médio (2-3 dias)
```

**Métricas:**
- Total Points: 12-14
- Duração: 2-3 semanas

**Deliverables:**
- ✅ Training session recording (< 2 min UX)
- ✅ Offline support with auto-sync
- ✅ Full training history
- ✅ Performance: FCP < 1.5s

---

## 🎓 Sprint 4: Engajamento Aluno

**Objetivo:** Dashboards engajadores com badges, histórico, notificações

### Stories (8 total)

```
4.1 ✅ Dashboard 4 Cards
    → Evolução, Frequência, Comentários, Faixa Atual
    Esforço: Médio (2-3 dias)

4.2 ✅ Card 1 Expandido (Evolution Chart)
    → Line/area chart, 6-month trends
    Esforço: Médio (2-3 dias)

4.3 ✅ Card 2 Expandido (Attendance Table)
    → Calendar + stats, month selector
    Esforço: Pequeno (1-2 dias)

4.4 ✅ Card 3 Expandido (Comments Timeline)
    → Professor comments, sentiment badges
    Esforço: Pequeno (1-2 dias)

4.5 ✅ Card 4 Expandido (Badges Grid)
    → Badge showcase + achievements
    Esforço: Pequeno (1-2 dias)

4.6 ✅ Comparação Mês-a-Mês
    → Side-by-side metrics, delta %
    Esforço: Pequeno (1-2 dias)

4.7 ✅ Notificações Proativas
    → Push/in-app/email triggers
    Esforço: Médio (2-3 dias)

4.8 ✅ Histórico de Faixas (Belt Timeline)
    → Visual timeline, time-in-belt stats
    Esforço: Médio (2-3 dias)
```

**Métricas:**
- Total Points: 14-16
- Duração: 2-3 semanas

**Deliverables:**
- ✅ Student dashboard (responsive)
- ✅ Belt history timeline
- ✅ Achievement notifications
- ✅ Mobile-optimized UI

---

## 👨‍💼 Sprint 5: Controle Admin

**Objetivo:** Monitoramento, alertas, auditoria, compliance

### Stories (7 total)

```
5.1 ✅ Dashboard Admin
    → Status visual, KPIs, compliance score
    Esforço: Médio (2-3 dias)

5.2 ✅ Auditoria LGPD
    → Detailed logs, timeline, export
    Esforço: Médio (2-3 dias)

5.3 ✅ Relatório Conformidade
    → 6-page PDF, signed, archivable
    Esforço: Pequeno (1-2 dias)

5.4 ✅ Alertas Tempo Real
    → Critical/preventive/info with routing
    Esforço: Médio (2-3 dias)

5.5 ✅ Gestão Usuários
    → Add/edit/block/delete with audit
    Esforço: Médio (2-3 dias)

5.6 ✅ Backup & Recovery
    → Daily auto-backup + test-restore
    Esforço: Médio (2-3 dias)

5.7 ✅ Health Monitor
    → Component status + timeseries
    Esforço: Pequeno (1-2 dias)
```

**Métricas:**
- Total Points: 13-15
- Duração: 2-3 semanas

**Deliverables:**
- ✅ Admin dashboard
- ✅ LGPD compliance reports
- ✅ System monitoring & alerts
- ✅ Backup automation

---

## 📡 Sprint 6: Offline-First Architecture

**Status:** PARALELO (pode começar na Semana 5)

### Stories (5 total)

```
6.1 ✅ Detecção de Conectividade
    → Online/offline detection, indicators
    Esforço: Pequeno (1-2 dias)

6.2 ✅ Fila de Sincronização
    → Queue management, intelligent ordering
    Esforço: Médio (2-3 dias)

6.3 ✅ Resolução de Conflitos
    → Last-write-wins strategy
    Esforço: Pequeno (1-2 dias)

6.4 ✅ Lógica de Retry
    → Exponential backoff, max retries
    Esforço: Pequeno (1-2 dias)

6.5 ✅ Indicadores Offline
    → Discrete UI badges, status bar
    Esforço: Pequeno (1 dia)
```

**Deliverables:**
- ✅ Offline-first architecture
- ✅ IndexedDB + sync queue
- ✅ Conflict resolution
- ✅ Auto-retry logic

---

## ✨ Sprint 7: Polish & Accessibility

**Status:** PARALELO (pode começar na Semana 7)

### Stories (5 total)

```
7.1 ✅ Performance Benchmarking
    → Lighthouse CI, SLO compliance
    Esforço: Pequeno (1-2 dias)

7.2 ✅ WCAG 2.1 AA Accessibility
    → axe-core testing, keyboard nav
    Esforço: Médio (2-3 dias)

7.3 ✅ Bundle Optimization
    → Code splitting, < 80KB initial
    Esforço: Pequeno (1-2 dias)

7.4 ✅ Keyboard Navigation
    → Tab order, focus management
    Esforço: Pequeno (1-2 dias)

7.5 ✅ Production Readiness
    → Checklist, security audit, docs
    Esforço: Pequeno (1-2 dias)
```

**Deliverables:**
- ✅ Lighthouse score > 90
- ✅ WCAG AA compliant
- ✅ < 1.5s FCP, < 2.5s LCP
- ✅ Production checklist

---

## ⚙️ Sprint 8: Heroku Deploy & Go-Live

**Status:** PARALELO (pode começar na Semana 5)

### Stories (4 total)

```
8.1 ✅ Environment Setup para Producção
    → Heroku app creation, env vars, buildpacks
    Esforço: Pequeno (1-2 dias)

8.2 ✅ CI/CD Pipeline Setup
    → GitHub Actions, automated tests + auto-deploy to Heroku
    Esforço: Médio (2-3 dias)

8.3 ✅ Database Migrations em Produção
    → Heroku Postgres, Flyway integration, rollback procedures
    Esforço: Pequeno (1-2 dias)

8.4 ✅ Monitoring & Alerting
    → Heroku logs, uptime monitoring, error tracking (Sentry)
    Esforço: Pequeno (1-2 dias)
```

**Deliverables:**
- ✅ Heroku app configured (backend + frontend)
- ✅ CI/CD auto-deploy on push to main
- ✅ Database migrations running in production
- ✅ Error & performance monitoring live

---

## 📈 Roadmap Visual

```
Week:  1   2 | 3   4 | 5   6 | 7   8 | 9  10 | 11  12
       ──────────────────────────────────────────────

Epic 1 ██████ (Foundation)
                          ↓
Epic 2       ██████ (Health/LGPD)
                          ↓
Epic 3                ██████ (Training)
                          ↓
Epic 4                        ██████ (Student Progress)
                                      ↓
Epic 5                              ██████ (Admin)

Epic 6                    ██████████████ (Offline - PARALLEL)
Epic 7                          ██████████ (Polish - PARALLEL)
Epic 8                    ████████████ (DevOps - PARALLEL)
```

---

## 🎯 Recomendações de Sprinting

### Team Structure (Recommended)

**3-Person Team:**
- Dev 1: Backend (Auth, Health, Admin APIs)
- Dev 2: Frontend (Dashboard, Training UI)
- Dev 3: QA + DevOps/Deployment (CI/CD, testing, Heroku setup)

**5-Person Team:**
- Dev 1-2: Backend (Auth, APIs)
- Dev 3-4: Frontend (Dashboard, Training, Offline)
- Dev 5: QA + DevOps/Deployment

### Velocity Guidelines

**Conservative:** 8-10 points/week per dev
**Moderate:** 10-13 points/week per dev
**Aggressive:** 13-16 points/week per dev

**Adjust down for:**
- First sprint (team ramp-up)
- Complex integrations (LGPD, offline)
- Holiday periods

### Sprint Ceremonies (Recommended)

| Cadência | Duração | Participantes |
|----------|---------|---------------|
| Daily Standup | 15 min | All devs + SM |
| Sprint Planning | 2 hrs | All devs + PM + SM |
| Story Review | 1 hr | Dev + SM + PM |
| Code Review | 30 min | 2 devs minimum |
| Sprint Retrospective | 1 hr | All + SM |
| Release Planning | 1 hr | SM + PM (bi-weekly) |

---

## ✅ Validation Checklist

Before starting development:

- [ ] All 8 stories per epic are clearly defined (readiness checklist)
- [ ] Team understands dependencies (Epic 1 → 2,3 → 4 → 5)
- [ ] Backend setup complete (Node.js, Express, PostgreSQL local)
- [ ] Frontend setup complete (React, build tools)
- [ ] PostgreSQL installed locally (or Docker Postgres for dev only)
- [ ] Database migrations tested locally
- [ ] Sample data loaded
- [ ] GitHub Actions workflow created (for CI/CD)
- [ ] Heroku app created and linked to GitHub repo

---

## 🚀 Next Actions

**1️⃣ Setup Local Environment**
```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

**2️⃣ Create First Story**
→ `bmad-create-story Epic 1 Story 1`

**3️⃣ Implement & Test**
→ `dev this story [Story-1-1.md]`

**4️⃣ Deploy to Heroku (Sprint 8)**
→ GitHub Actions auto-deploys on merge to main

---

**Generated by:** bmad-sprint-planning  
**Workflow phase:** bmm → 4-implementation  
**Status:** ✅ Ready to execute
