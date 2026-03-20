---
title: Mapeamento de Requirements → Stories (FR Coverage Map)
language: pt-BR
created: 2026-03-19
workflow: bmad-create-epics-and-stories-step-04
---

# SCAcademia — Mapeamento de Requirements → Stories

## Propósito

Este documento rastreia CADA Functional Requirement para as story(ies) que a implementam, garantindo cobertura completa e rastreabilidade.

---

## 📋 Mapeamento FR → Epic → Story(ies)

### **EPIC 1: Fundação — Autenticação & Controle de Acesso**

| FR | Descrição | Story | Status |
|----|-----------|-------|--------|
| **FR1** | Academia Multi-tenant setup com primeira conta Admin | 1.1 | ✅ |
| **FR2** | Usuário pode fazer sign-up (Professor ou Aluno) | 1.2 | ✅ |
| **FR3** | Validação de email + password hashing | 1.2 | ✅ |
| **FR4** | Menor de idade marca consentimento parental | 1.2 | ✅ |
| **FR5** | Login com username/email + password | 1.3 | ✅ |
| **FR6** | JWT tokens (access + refresh) com expiração | 1.3 | ✅ |
| **FR7** | Refresh token automático transparente | 1.3 | ✅ |
| **FR8** | Rate limiting no login (3 falhas = bloqueio temporário) | 1.3 | ✅ |
| **FR9** | Usuário esqueceu senha → email reset link | 1.4 | ✅ |
| **FR10** | Recovery email token com expiração 1 hora | 1.4 | ✅ |
| **FR11** | Nova senha redefine com force re-auth | 1.4 | ✅ |
| **FR12** | 4 papel de usuário (Admin, Professor, Aluno, Responsavel) | 1.5 | ✅ |
| **FR13** | Query-level filtering por papéis | 1.5 | ✅ |
| **FR14** | Permissões granulares por endpoint | 1.5 | ✅ |

**Epic 1 Total:** 14 FRs ✅ | **5 Stories**

---

### **EPIC 2: Saúde & Conformidade LGPD**

| FR | Descrição | Story | Status |
|----|-----------|-------|--------|
| **FR15** | Formulário anamnese inicial (alergias, medicações, restrições) | 2.1 | ✅ |
| **FR16** | Dados de saúde encriptados AES-256 | 2.1 | ✅ |
| **FR17** | 3-step consentimento LGPD (saúde, ética, privacidade) com assinatura digital | 2.2 | ✅ |
| **FR18** | Link de consentimento com expiração 7 dias | 2.2 | ✅ |
| **FR19** | Template de consentimento versionado (histórico) | 2.3 | ✅ |
| **FR20** | Consentimento auto-expira em 60 dias (re-consent obrigatório) | 2.3 | ✅ |
| **FR21** | Timeline de acesso LGPD (WHO/WHAT/WHEN/WHERE) | 2.4 | ✅ |
| **FR22** | Auditoria imutável (append-only logs) | 2.4 | ✅ |
| **FR23** | Direito ao esquecimento com 30-day grace period | 2.5 | ✅ |
| **FR24** | Cascade soft-delete dados (hard-delete saúde por compliance) | 2.5 | ✅ |

**Epic 2 Total:** 10 FRs ✅ | **6 Stories**

---

### **EPIC 3: Professor Love — Registro Rápido de Treino**

| FR | Descrição | Story | Status |
|----|-----------|-------|--------|
| **FR25** | Entry point conversacional (wizard com prompts) | 3.1 | ✅ |
| **FR26** | Auto-select turma do Professor | 3.1 | ✅ |
| **FR27** | Marcar frequência dos alunos (toggle 48x48px) | 3.2 | ✅ |
| **FR28** | Rate limit toggle (1 sec undo window) | 3.2 | ✅ |
| **FR29** | Dropdown conversional de técnicas com favorites | 3.3 | ✅ |
| **FR30** | Multi-select técnicas com autocomplete | 3.3 | ✅ |
| **FR31** | Anotações por aluno (textarea auto-expand + auto-save 5sec) | 3.4 | ✅ |
| **FR32** | Review & confirm (visual summary + prevent double-click) | 3.5 | ✅ |

**Epic 3 Total:** 8 FRs ✅ | **8 Stories**

---

### **EPIC 4: Engajamento do Aluno — Visualização de Progresso**

| FR | Descrição | Story | Status |
|----|-----------|-------|--------|
| **FR33** | Dashboard 4 cards (Progress/Frequency/Comments/Badges) | 4.1 | ✅ |
| **FR34** | Card 1: Progress chart (last 12 weeks) | 4.2 | ✅ |
| **FR35** | Card 2: Attendance table + streak counter | 4.3 | ✅ |
| **FR36** | Card 3: Comment timeline com sentiment colors | 4.4 | ✅ |
| **FR37** | Card 4: Badge grid (unlocked + next) | 4.5 | ✅ |
| **FR38** | Notificações de badges (push + in-app + email) | 4.7 | ✅ |
| **FR39** | Comparação mês-a-mês com trend arrows | 4.6 | ✅ |

**Epic 4 Total:** 7 FRs ✅ | **7 Stories**

---

### **EPIC 5: Controle Admin — Monitoramento & Conformidade**

| FR | Descrição | Story | Status |
|----|-----------|-------|--------|
| **FR40** | Dashboard Admin (status 🟢/⚠/🔴, compliance score, alerts) | 5.1 | ✅ |
| **FR41** | Timeline de auditoria LGPD (filtros, export PDF/CSV signed) | 5.2 | ✅ |
| **FR42** | Relatório de conformidade 6-page (assinado RSA-2048) | 5.3 | ✅ |
| **FR43** | Alertas tempo real (critical/preventive/info) com customizable silence | 5.4 | ✅ |
| **FR44** | Gestão de usuários (add/edit/block/delete + soft-delete preserves audit) | 5.5 | ✅ |
| **FR45** | Backup automático diário (@ 02:30) + manual on-demand | 5.6 | ✅ |
| **FR46** | Test-restore em sandbox (RTO/RPO clear) | 5.6 | ✅ |
| **FR47** | Backup encryption AES-256 | 5.6 | ✅ |
| **FR48** | Health monitor (component status, 24h timeseries) | 5.7 | ✅ |
| **FR49** | CPU/memory/response time graphs | 5.7 | ✅ |
| **FR50** | 30-day pattern analysis (detectar degradação trends) | 5.7 | ✅ |

**Epic 5 Total:** 11 FRs ✅ | **7 Stories**

---

### **EPIC 6: Offline-First — Sincronização Inteligente**

| FR | Descrição | Story | Status |
|----|-----------|-------|--------|
| **FR51** | Detecção de conectividade em < 2 seg (fetch + timeout) | 6.1 | ✅ |
| **FR52** | IndexedDB cache de dados já síncronizados | 6.1 | ✅ |
| **FR53** | Fila de sincronização com ordenação (Auth → Freq → Técnicas → Notas) | 6.2 | ✅ |
| **FR54** | Pausa em erro + opções (Keep Local / Use Server / Review) | 6.2 | ✅ |

**Epic 6 Total:** 4 FRs ✅ | **5 Stories**

---

### **EPIC 7: Polish & Accessibility — Qualidade Produção**

| FR | Descrição | Story | Status |
|----|-----------|-------|--------|
| **NFR1** | FCP < 1.5s, LCP < 2.5s, CLS < 0.1 (Lighthouse SLO) | 7.1 | ✅ |
| **NFR2** | Initial bundle < 80KB (gzipped) | 7.3 | ✅ |
| **NFR3** | Performance budget CI enforcement | 7.1 | ✅ |
| **NFR4** | WCAG 2.1 AA compliance (axe-core 0 violations) | 7.2 | ✅ |
| **NFR5** | Keyboard navigation 100% (Tab, Arrow, Enter, Escape) | 7.4 | ✅ |
| **NFR6** | Screen reader support (aria-labels, landmarks, role announcement) | 7.4 | ✅ |
| **NFR7** | Color contrast ≥ 4.5:1 text / ≥ 3:1 UI elements | 7.2 | ✅ |
| **NFR8** | Focus visible outline (3px #0052CC) | 7.4 | ✅ |
| **NFR9** | Modal focus trap (Tab cycling within modal) | 7.4 | ✅ |
| **NFR10** | Zoom responsive (200% zoom, no horizontal scroll) | 7.2 | ✅ |
| **NFR11** | Bundle code-split (lazy routes, dynamic imports) | 7.3 | ✅ |
| **NFR12** | Service Worker caching (initial indefinite, chunks 30-day) | 7.3 | ✅ |
| **NFR13** | Production readiness checklist (tests, security, monitoring, backup) | 7.5 | ✅ |

**Epic 7 Total:** 13 NFRs ✅ | **5 Stories**

---

### **EPIC 8: Monitoramento & DevOps — Go-Live**

| FR | Descrição | Story | Status |
|----|-----------|-------|--------|
| **DevOps1** | Docker multi-stage build (frontend < 300MB, backend < 200MB) | 8.1 | ✅ |
| **DevOps2** | Alpine base images + non-root user security | 8.1 | ✅ |
| **DevOps3** | docker-compose (frontend, backend, postgres, redis) | 8.1 | ✅ |
| **DevOps4** | GitHub Actions CI/CD pipeline (tests → build → deploy) | 8.2 | ✅ |
| **DevOps5** | Automated security scan (npm audit, SCA) | 8.2 | ✅ |
| **DevOps6** | Prometheus metrics (requests, database, system) | 8.3 | ✅ |
| **DevOps7** | Loki centralized logging (labels, full-text search) | 8.3 | ✅ |
| **DevOps8** | Grafana dashboards (green/yellow/red health status) | 8.3 | ✅ |
| **DevOps9** | Alerting via Slack/SMS/PagerDuty | 8.3 | ✅ |
| **DevOps10** | Canary deployment (10% → 30min monitor → 100%) | 8.4 | ✅ |
| **DevOps11** | Automatic rollback on health check failure | 8.4 | ✅ |
| **DevOps12** | Zero-downtime rolling deployment | 8.4 | ✅ |

**Epic 8 Total:** 12 DevOps Features ✅ | **4 Stories**

---

## 📊 Cobertura por Categoria

### Functional Requirements (54 FRs)

| Categoria | Count | Coverage |
|-----------|-------|----------|
| Authentication & Access Control | 14 | ✅ 100% |
| Health & LGPD Compliance | 10 | ✅ 100% |
| Professor Training Module | 8 | ✅ 100% |
| Student Engagement & Progress | 7 | ✅ 100% |
| Admin Control & Monitoring | 11 | ✅ 100% |
| Offline-First Capabilities | 4 | ✅ 100% |
| **TOTAL** | **54** | **✅ 100%** |

### Non-Functional Requirements (23 NFRs)

| Category | Requirement | Story | Coverage |
|----------|-------------|-------|----------|
| **Performance** | FCP < 1.5s, LCP < 2.5s | 7.1 | ✅ |
| | Initial bundle < 80KB | 7.3 | ✅ |
| | Dashboard < 1s render | 7.1 | ✅ |
| **Accessibility** | WCAG 2.1 AA | 7.2 | ✅ |
| | Keyboard 100% | 7.4 | ✅ |
| | Screen reader | 7.4 | ✅ |
| | Color contrast | 7.2 | ✅ |
| **Security** | JWT auth + refresh | 1.3 | ✅ |
| | AES-256 encryption | 2.1, 5.6 | ✅ |
| | LGPD compliance | 2.x | ✅ |
| **Reliability** | Backup daily + test | 5.6 | ✅ |
| | Disaster recovery | 8.4 | ✅ |
| | Error retry logic | 6.4 | ✅ |
| **Scalability** | Multi-tenant | 1.1 | ✅ |
| | Database indexing | All | ✅ |
| | Query optimization | All | ✅ |
| **Monitoring** | Prometheus metrics | 8.3 | ✅ |
| | Logging centralized | 8.3 | ✅ |
| | Alerting real-time | 8.3 | ✅ |
| **DevOps** | Docker containers | 8.1 | ✅ |
| | CI/CD automation | 8.2 | ✅ |
| | Canary deploy | 8.4 | ✅ |
| | Rollback automatic | 8.4 | ✅ |

---

## 🔍 Validação de Completude

✅ **54 Functional Requirements** — Todos cobertos  
✅ **23 Non-Functional Requirements** — Todos cobertos  
✅ **8 Epics** — Todos definidos  
✅ **51 Stories** — Todos detalhados em PT-BR com BDD  
✅ **100% Rastreabilidade** — FR → Story mapping unívoco

---

## 📚 Como Usar Este Documento

### Para Product Managers:
1. Verifique que TODOS seus requirements estão listados
2. Para cada FR, trace a Story que a implementa
3. Use para comunicar ao time o que será entregue

### Para Developers:
1. Veja a Story atribuída
2. Abra o arquivo Story-N-M.md
3. Implemente acceptance criteria (Given/When/Then)
4. Marque FR coberto ao fazer PR

### Para QA/Testing:
1. Use FR → Story mapping para criar test cases  
2. Cada AC em Given/When/Then == 1 test case  
3. Valide que nenhuma FR fica untestada

---

**Status:** ✅ READY FOR DEVELOPMENT  
**Last Updated:** 19 de Março de 2026  
**Total Coverage:** 100% (54 FRs + 23 NFRs + 12 DevOps)
