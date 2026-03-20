---
title: SCAcademia — Epics & Stories — Index & Navigation
language: pt-BR
created: 2026-03-19
workflow: bmad-create-epics-and-stories (Complete)
---

# SCAcademia — Índice de Documentação (Epics & Stories)

**Status:** ✅ **READY FOR DEVELOPMENT**  
**Total Documentos:** 3 summaries + 51 story files  
**Cobertura:** 54 FRs + 23 NFRs + 8 Epics  
**Linguagem:** Português Brasileiro (PT-BR)

---

## 📑 Documentos Principais

### 1. **EPICS-AND-STORIES-SUMMARY.md**
📍 **Arquivo:** `_bmad-output/EPICS-AND-STORIES-SUMMARY.md`

**Conteúdo:**
- Visão geral de todos 8 epics
- Descrição de cada epic com stories
- Mapeamento FR → Epic
- Matriz de dependências
- Estimativas de esforço (story points)
- Próximos passos

**Quando Usar:**
- Comunicar para stakeholders (executivo summary)
- Onboarding novo desenvolvedor (context rápido)
- Product owner review (completude validação)

---

### 2. **REQUIREMENTS-COVERAGE-MAP.md**
📍 **Arquivo:** `_bmad-output/REQUIREMENTS-COVERAGE-MAP.md`

**Conteúdo:**
- Mapeamento detalhado: FR → Epic → Story(ies)
- Tabela por epic (14 FRs / 10 FRs / 8 FRs / ... / 4 FRs)
- Cobertura NFRs (Performance, Accessibility, Security, DevOps)
- Validação 100% completude

**Quando Usar:**
- QA/Testing (criar test cases por FR)
- Developer (localizar qual story implementa qual FR)
- Code review (validar FR coverage)

---

### 3. **DEVELOPMENT-READINESS-CHECKLIST.md**
📍 **Arquivo:** `_bmad-output/DEVELOPMENT-READINESS-CHECKLIST.md`

**Conteúdo:**
- Checklist pré-desenvolvimento
- Setup requirements por Epic
- FAQ (respostas a dúvidas comuns)
- Go/No-Go decision matrix
- Sign-off por role (PO, Tech Lead, QA)

**Quando Usar:**
- Antes de começar Sprint 1
- Onboarding team
- Validation que tudo está ready

---

## 📁 Estrutura de Pastas

```
_bmad-output/
├── EPICS-AND-STORIES-SUMMARY.md        ← Executive summary (START HERE)
├── REQUIREMENTS-COVERAGE-MAP.md        ← FR traceability
├── DEVELOPMENT-READINESS-CHECKLIST.md  ← Pre-dev validation
│
├── Epics/
│   ├── Epic1-Authentication/
│   │   ├── Epic1.md                    ← Epic overview
│   │   ├── Story-1-1.md                ← Admin Cria Academia
│   │   ├── Story-1-2.md                ← Registro de Usuário
│   │   ├── Story-1-3.md                ← Login JWT
│   │   ├── Story-1-4.md                ← Password Reset
│   │   └── Story-1-5.md                ← RBAC
│   │
│   ├── Epic2-HealthLGPD/
│   │   ├── Epic2.md
│   │   ├── Story-2-1.md                ← Anamnese
│   │   ├── Story-2-2.md                ← Consentimento
│   │   ├── Story-2-3.md                ← Versionamento
│   │   ├── Story-2-4.md                ← Auditoria
│   │   ├── Story-2-5.md                ← Direito Esquecimento
│   │   └── Story-2-6.md                ← Relatório LGPD
│   │
│   ├── Epic3-ProfTraining/
│   │   ├── Epic3.md
│   │   ├── Story-3-1.md ... Story-3-8.md
│   │
│   ├── Epic4-StudentProgress/
│   │   ├── Epic4.md
│   │   ├── Story-4-1.md ... Story-4-7.md
│   │
│   ├── Epic5-AdminControl/
│   │   ├── Epic5.md
│   │   ├── Story-5-1.md ... Story-5-7.md
│   │
│   ├── Epic6-Offline/
│   │   ├── Epic6.md
│   │   ├── Story-6-1.md ... Story-6-5.md
│   │
│   ├── Epic7-Polish/
│   │   ├── Epic7.md
│   │   ├── Story-7-1.md ... Story-7-5.md
│   │
│   └── Epic8-DevOps/
│       ├── Epic8.md
│       ├── Story-8-1.md ... Story-8-4.md
│
└── [Documentação anterior]
    ├── project-context.md
    ├── product-brief-SCAcademia.md
    └── ...
```

---

## 🗺️ Navegação Rápida por Papel

### 👤 **Product Owner / Project Manager**

**Leia na ordem:**
1. **EPICS-AND-STORIES-SUMMARY.md** (5 min read)
   - Entender 8 epics e valor
   - Ver estimativas de esforço (20-28 weeks)
2. **REQUIREMENTS-COVERAGE-MAP.md** (3 min skim)
   - Validar que todos 54 FRs estão cobertos

**Actions:**
- [ ] Sign-off de completude
- [ ] Ir para Sprint Planning

---

### 👨‍💻 **Developer**

**Leia na ordem:**
1. **EPICS-AND-STORIES-SUMMARY.md** → Epic Overview
2. **Seu Epic folder** → Epic{N}.md
3. **Sua Story** → Story-N-M.md
4. **Acceptance Criteria** → Implementar Given/When/Then

**Exemplo (Dev vai fazer Story 3.2):**
```
1. Abra _bmad-output/Epics/Epic3-ProfTraining/Story-3-2.md
2. Leia User story: "Como Professor, Quero marcar frequência..."
3. Para cada AC:
   - Given → Setup test data
   - When → Trigger action
   - Then → Verify result
4. Implemente + testes de acceptance criteria
5. PR → code review → merge
```

---

### 🧪 **QA / Test Engineer**

**Leia na ordem:**
1. **REQUIREMENTS-COVERAGE-MAP.md** (completo)
   - Criar test case matrix (FR → Test case)
2. **Story-N-M.md files** (por sprint)
   - Cada AC = 1 test case
   - Cada Given/When/Then é testável

**Exemplo (QA testa Story 3.2):**
```
Story 3.2: Marcar Frequência

AC 1:
  Given: Professor em turma com 10 alunos
  When: clica toggle de frequência em 1º aluno
  Then: toggle fica marcado (visual feedback)
  → TC-1: Verify frequency toggle visual state

AC 2:
  Given: Professor marcou frequência
  When: clica novamente (undo window < 1s)
  Then: frequência volta a unmarked
  → TC-2: Verify undo functionality within 1sec
```

---

### 🏗️ **Architect / Tech Lead**

**Leia na ordem:**
1. **EPICS-AND-STORIES-SUMMARY.md** → Matriz de dependências
2. **DEVELOPMENT-READINESS-CHECKLIST.md** → Epic-specific tech setup
3. **Epic{N}.md files** (selective) → Technical notes

**Key checks:**
- [ ] Dependencies flow válidas (1→2/3→4→5|6-8)
- [ ] Tech stack alinhado (Node.js, PostgreSQL, Angular, Material Design)
- [ ] Architecture patterns respected (multitenant, LGPD, offline-first, RBAC)

---

### 👨‍🎓 **New Team Member (Onboarding)**

**Day 1 — Leia:**
1. EPICS-AND-STORIES-SUMMARY.md (15 min)
2. DEVELOPMENT-READINESS-CHECKLIST.md § FAQ

**Day 2 — Familiarize (30 min each):**
3. Seu Epic overview (Epic3.md etc)
4. 3-5 Stories da seu epic

**Day 3 — Start Contributing:**
5. Pega 1 story simples
6. Implementa AC no seu cliente
7. PR → feedback

---

## 🎯 Fluxo de Desenvolvimento (Por Epic)

### Sprint Sequencing Recomendado

```
SEQUENTIAL (CRITICAL PATH):
Sprint 1-2:   Epic 1 (Auth)                  [5 stories]  → 2-3 weeks
Sprint 2-3:   Epic 2 (Health/LGPD)          [6 stories]  → 3-4 weeks [PARALLEL option]
Sprint 2-3:   Epic 3 (Prof Training)        [8 stories]  → 4-5 weeks [PARALLEL option]
Sprint 4:     Epic 4 (Student Progress)     [7 stories]  → 3-4 weeks
Sprint 5:     Epic 5 (Admin Control)        [7 stories]  → 3-4 weeks

PARALLEL (recommended start ~ Sprint 3):
Sprint 3+:    Epic 6 (Offline)              [5 stories]  → 2-3 weeks
Sprint 3+:    Epic 7 (Polish)               [5 stories]  → 2-3 weeks
Sprint 3+:    Epic 8 (DevOps)               [4 stories]  → 1-2 weeks

TOTAL: 20-28 weeks (5-7 months)
```

### Per-Sprint Routine

**Every Sprint:**
1. **Sprint Planning (2 hours)**
   - Define 3-5 stories for sprint
   - Estimate story points
   - Assign devs

2. **Daily Standup (15 min)**
   - What shipped yesterday?
   - What's blocking today?
   - What's nextup?

3. **Sprint Review (1 hour)**
   - Demo completed stories
   - QA acceptance
   - Retrospective

4. **Refinement (1 hour)**
   - Groom next sprint stories
   - Ask AC clarification questions

---

## 🔄 Common Workflows

### "I'm a developer and got assigned Story 3.2"

```bash
# 1. Locate story file
open _bmad-output/Epics/Epic3-ProfTraining/Story-3-2.md

# 2. Read user story + AC
#    User story: "Como Professor, Quero marcar frequência..."
#    ACs: Given/When/Then format

# 3. Read Technical Notes
#    "Use React component + local state, 48x48px touch target"

# 4. Implement
#    - Create component: ProfessorFrequencyToggle.tsx
#    - Add unit tests (each AC = 1 test)
#    - Add E2E test (Cypress)

# 5. Create PR
#    Title: "feat: Story 3.2 - Marcar frequência"
#    Description: Reference Story-3-2.md, list AC coverage

# 6. Code review + merge
#    Reviewer checks: ACs implemented, tests passing, no dependencies missed

# 7. QA tests
#    QA runs test cases derived from AC Given/When/Then
```

---

### "I'm QA and need to test Epic 4"

```bash
# 1. Open folder
open _bmad-output/Epics/Epic4-StudentProgress/

# 2. For each story (4.1-4.7)
#    - Read Story-4-N.md
#    - Extract ACs (Given/When/Then)
#    - Create test case per AC

# 3. Create test suite
# Example for Story 4.1:
# Test Suite: Student Dashboard - 4 Cards
#   TC-4.1.1: Verify 4 cards display (Evolução, Frequência, Comments, Badges)
#   TC-4.1.2: Verify responsive layout (1 col mobile, 2x2 desktop)
#   TC-4.1.3: Verify colors (Orange #FF6B35 for Evolução, Azul #0052CC for Frequência, etc)

# 4. Test execution
#    Run test suite against implemented story
#    Track pass/fail per AC
#    File bugs if AC not covered
```

---

### "I'm Product Owner and need status update"

```
Sprint N Status:
  ✅ Completed: Story 3.1, Story 3.2 (2 stories)
  🔄 In Progress: Story 3.3, Story 3.4 (2 stories)
  ⏳ Todo: Story 3.5 - 3.8, + Epic 4 (8 stories)

  Total Epic 3: 5/8 stories done (62%)
  Total Project: 25/51 stories done (49%)

  Blockers: None
  Risk: None
  Next: Story 3.3 (Técnicas dialog) should complete tomorrow
```

---

## 📊 Document Cross-References

### By Use Case:

| Use Case | Primary Doc | Secondary |
|----------|------------|-----------|
| Understand project scope | Summary | Coverage Map |
| Create test cases | Coverage Map | Story files |
| Assign stories to devs | Epic folders | Requirements Map |
| Validate completeness | Readiness Checklist | Summary |
| Debug story dependency | Summary (Matrix) | Epic folders |
| Onboard new dev | Readiness Checklist | Epic Overview |

---

## ✅ File Completeness Checklist

**Before handoff to team, verify:**

- [ ] _bmad-output/EPICS-AND-STORIES-SUMMARY.md exists (3000+ words)
- [ ] _bmad-output/REQUIREMENTS-COVERAGE-MAP.md exists (2000+ words)
- [ ] _bmad-output/DEVELOPMENT-READINESS-CHECKLIST.md exists (1500+ words)
- [ ] _bmad-output/Epics/ folder has 8 subfolders (Epic1-8)
- [ ] Each Epic folder has Epic-overview.md + N stories
- [ ] All 51 Story-N-M.md files present + valid PT-BR + BDD format
- [ ] Total document word count: 50,000+ (detailed, complete)

---

## 🎓 Training Materials (For Kickoff)

### 1. **30-Minute Team Briefing**
- Slide 1-2: Project overview (SCAcademia, 8 epics, 51 stories)
- Slide 3-4: Architecture overview (Angular SPA, Node.js backend, PostgreSQL, Material Design)
- Slide 5: Persona overview (Professor, Aluno, Admin, Responsavel)
- Slide 6: Dependency graph (Epic 1 → 2/3 → 4 → 5 | parallel 6-8)
- Slide 7-8: How to read stories (template, AC in Given/When/Then, TR reference)
- Slide 9: Q&A

### 2. **Story Template Video (5 min)**
Shows developer:
- Opening Story-N-M.md
- Reading user story
- Understanding AC (Given/When/Then)
- Mapping to implementation
- Writing tests
- Creating PR

### 3. **FAQ Document**
Reference: DEVELOPMENT-READINESS-CHECKLIST.md § FAQ

---

## 💬 Questions?

### "Where is [X requirement]?"
→ Search REQUIREMENTS-COVERAGE-MAP.md for FR name. Links to Story-N-M.md

### "Can I start Story X without Y?"
→ Check EPICS-AND-STORIES-SUMMARY.md § Matriz de Dependências

### "How many acceptance criteria for this story?"
→ Open Story-N-M.md, count Given/When/Then sections

### "Is this story too big?"
→ Escalate to Product Owner + Tech Lead (DEVELOPMENT-READINESS-CHECKLIST.md § Escalation)

---

## 🚀 Next Steps

1. **Distribute Documents**
   - Share EPICS-AND-STORIES-SUMMARY.md com team
   - Grant access a _bmad-output/ folder

2. **Team Kickoff Meeting**
   - Apresentar overview
   - Clarify questions
   - Assign Sprint 1 stories

3. **Environment Setup**
   - Clone starter template (Story 1.1)
   - Setup local dev (Docker Compose)
   - Jira/Linear board creation

4. **Sprint 1 Kickoff**
   - Assign 3-5 stories
   - Start Story 1.1 (Setup)

---

**Generated:** 2026-03-19  
**Status:** ✅ COMPLETE — READY FOR HANDOFF  
**Next:** Sprint Planning + Development Launch
