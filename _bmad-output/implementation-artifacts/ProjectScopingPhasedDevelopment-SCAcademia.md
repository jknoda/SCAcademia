## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP
- **Core Problem:** Professor perde tempo registrando em papel
- **MVP Win:** Professor consegue registrar treino em < 5 minutos, sem frustração
- **User Adoption Focus:** Se professor não usa, projeto falha — priorizar sua experience

**Resource Profile:**
- Team: 2 fullstack developers (Angular/NodeJS)
- Timeline: 1 ano total disponível
- Phase 1: 3-4 meses (MVP lançável)
- Phase 2: 2-3 meses (adoption + feedback)
- Phase 3: Restante para features avançadas

**Risk Mitigation for User Adoption:**
- ✅ Teste com professores REAIS desde início (não esperar MVP completo)
- ✅ Velocidade de desenvolvimento (2-week sprints, feedback rápido)
- ✅ Simplicidade sobre perfeição (melhor 80% rápido que 100% lento)
- ✅ Suporte ativo durante primeiras semanas de uso

---

## Phase 1 MVP (Meses 1-4): Professor Love Launch

**Goal:** Professores conseguem registrar treino em < 5 min, sem papel

### Personas Priorizadas para MVP:
1. **Professor** (PRIMARY) — Precisa registrar
2. **Aluno** (SECONDARY) — Vizualiza progresso básico
3. **Admin** (TERTIARY) — Setup inicial + supervisão

❌ **Responsável NÃO incluído no MVP** (será adicionado Phase 2 com relatórios)

### Must-Have Features (Phase 1):

#### Area 1: Gestão de Pessoas (Simplified)
- ✅ **Admin:** Criar academia, adicionar professores, adicionar alunos
- ✅ **Login System:** Email + Senha (sem 2FA no MVP)
- ✅ **Role-Based Access:** Admin, Professor, Aluno (3 roles)
- ✅ **Aluno Registration:** Nome, data nascimento, faixa, turmas
- ✅ **Professor Role:** Pode registrar treinos de suas turmas (isolamento garantido)

#### Area 2: Saúde & Conformidade (LGPD MVP)
- ✅ **Anamnese Obrigatória:** Histórico médico (simples: conditions, allergies, restrictions)
- ✅ **Termo de Consentimento:** 1 documento de ética + responsabilidade
- ✅ **Autorização de Imagem:** Checkbox simples (sim/não para foto/vídeo)
- ✅ **LGPD Compliance:** 
  - Dados de menores protegidos (encriptation at rest)
  - Auditoria básica de quem acessou dados (logs estruturados)
  - Soft delete capability (deletar aluno = mascarar dados)

❌ **Não incluindo:** Consentimento granular por tipo de uso, webhooks para LGPD delete requests

#### Area 3: Treinos & Performance (Core MVP)
- ✅ **Registro de Treino (Ultra-Rápido):**
  - Professor clica "Novo Treino"
  - Seleciona turma (pré-preenchida)
  - Aparecem alunos — marca presente/faltou (2 cliques por aluno)
  - Texto livre: "Trabalhamos defesa"
  - Salva em < 2 minutos
  
- ✅ **Anotações de Desempenho (Por Aluno):**
  - Texto livre do professor: "João melhorou uchikomi", "Maria com dor ombro"
  - Simples, sem categorização
  
- ✅ **Histórico de Aluno (Tela Simples):**
  - Aluno vê: Última aula, frequência (X de Y treinos), anotações recentes
  - Gráfico SIMPLES: Linha mostrando participação ao longo de meses (não score 1-10 ainda)

❌ **Não incluindo:** Score subjetivo 1-10, milestones timeline, relatórios complexos

### MVP Dashboard
- **Professor:** "Minhas Turmas" + "Próximos Treinos" + "Últimas Anotações"
- **Aluno:** "Meu Progresso" (frequência + anotações) + "Ver Histórico"
- **Admin:** "Visão Geral" (alunos, presenças, conformidade)

### Technical Implementation (Phase 1)
- **Frontend:** Angular SPA (modular, lazy loading)
- **Backend:** Node.js REST API
- **Database:** PostgreSQL
- **Build:** CI/CD automatizado (tests, staging deploy)
- **Browser Support:** Chrome, Firefox, Safari, Edge (desktop + tablet)
- **Performance:** Initial load < 3s, treino registration < 500ms
- **Accessibility:** WCAG AA baseline (buttons, labels, contrast)

### Success Criteria for MVP Launch
1. **Professor Delight:** "Isso é muito mais rápido que papel" → registra 10+ treinos sem reclamação
2. **Zero Data Loss:** Nenhum treino perdido, auditoria funcionando
3. **Conformidade LGPD:** Dados de menores encriptados, consentimentos coletados
4. **Adoption Rate:** 70%+ de professores usando regularmente na primeira semana
5. **System Stability:** Uptime > 99%, sem crashes

---

## Phase 2 (Meses 5-7): Adoption Consolidation & Feedback Loop

**Goal:** Consolidar adoption, coletar feedback, adicionar relatórios

### New Features:
- ✅ **Responsável Dashboard:** Acesso de responsáveis, visualizar histórico do filho
- ✅ **Score Subjetivo 1-10:** Evolução técnica ao longo do tempo
- ✅ **Relatórios Automáticos:** Email semanal/mensal para responsável
- ✅ **Search & Filter:** Melhorar busca de alunos, histórico
- ✅ **2FA (Optional):** Admin pode ativar para lógica security
- ✅ **Milestones Timeline:** Marcos de progresso (passou de faixa, primeira competição)

### Under the Hood:
- Performance optimization (caching, query tuning)
- More comprehensive testing
- Better error handling & user feedback

---

## Phase 3 (Meses 8-12): Advanced Features & Platform

**Goal:** Expansão além do MVP, preparar para multi-academia (V2)

### New Features:
- ✅ **Gestão de Competições:** Registrar participações, resultados
- ✅ **Filiação Federativa:** Integração ou manual registro
- ✅ **IA/Insights Básicos:** Padrões simples (alunos em risco de evasão)
- ✅ **Export Avançado:** PDF/Excel com dados estruturados
- ✅ **API Pública:** Para possíveis integrações futuras
- ✅ **Architecture Prep:** Setup para multi-tenant (será v2)
- ✅ **Performance:** Otimização para 1000+ alunos

### Version 2 Roadmap (Post Phase 3):
- App mobile nativo (iOS/Android)
- Multi-academia (SaaS model)
- Advanced IA (previsão de lesão/evasão)

---

## Risk Mitigation Strategy

### Risk 1: User Adoption (PRIMARY RISK)
- **Mitigation:**
  - ✅ Collect professor feedback weekly (loops rápidos)
  - ✅ Test MVP com 1-2 academias reais primeiro
  - ✅ Dedicated support person durante primeiras 2 semanas
  - ✅ Treinamento hands-on com professores
  - ✅ Priorizar "delight moments" (gráfico mostrando progresso, facilidade)

### Risk 2: Technical Complexity (with 2 devs)
- **Mitigation:**
  - ✅ MVP é lean — remover features non-essential
  - ✅ Use templates/frameworks (Angular + Node starter)
  - ✅ Clear code standards desde dia 1
  - ✅ Automated testing (unit + integration)
  - ✅ Clear documentation

### Risk 3: LGPD Compliance
- **Mitigation:**
  - ✅ Legal review do consentimento (pré-MVP)
  - ✅ Encriptation implementado desde MVP (não retrofit)
  - ✅ Auditoria de acesso testada rigorosamente
  - ✅ Secciones LGPD sempre testadas antes de deploy

### Risk 4: Data Integrity
- **Mitigation:**
  - ✅ Backup automático diário
  - ✅ Teste de restore mensal
  - ✅ Soft delete (dados mascarados, não deletados fisicamente)
  - ✅ Conflict resolution para offline sync

---

## In-Scope vs Out-of-Scope

### MVP Includes:
✅ Registro rápido de treinos  
✅ Visualização de progresso (básica)  
✅ Conformidade LGPD (anamnese + consentimentos)  
✅ Acesso por role (Admin, Professor, Aluno)  
✅ Auditoria de acesso  
✅ WCAG AA accessibility  

### Deliberately Excluded from MVP:
❌ Responsável reportes (Phase 2)  
❌ Score subjetivo 1-10 (Phase 2)  
❌ Relatórios automáticos (Phase 2)  
❌ Integração federação (Phase 3)  
❌ IA/Insights (Phase 3)  
❌ App mobile (Phase 3+)  
❌ Chat/Messaging  
❌ Planejamento automático de treinos  