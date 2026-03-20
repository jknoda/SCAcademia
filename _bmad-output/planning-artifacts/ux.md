## Core User Experience

### Defining Experience

**The One Thing That Matters:** Professor consegue registrar treino completo (presença + desempenho) em < 5 minutos, sem papel, sem frustração.

**Why This:** Essa ação é o fulcro do MVP. Se professor conseguir fazer isso no day 1, tudo mais segue. Se não conseguir, sistema morre.

**Secondary Core Experience:** Aluno visualiza sua própria evolução em gráfico claro (frequência + score técnico + anotações) na primeira semana, revertendo evasão.

### Platform Strategy

**Web SPA Primary Platform**
- **Technology:** Angular SPA (single-page app)
- **Devices:** Desktop + Tablet (landscape + portrait) + Mobile stretch
- **Interaction:** Touch-first (48x48px buttons, no hover, tap feedback)
- **Offline:** IndexedDB local cache + auto-sync (5-10s delay OK)
- **Performance:** Initial < 3s, Navigation < 500ms, Gráficos < 1s

**Tablet-Centric Design**
- Professor uses tablet during/after training (landscape orientation primary)
- One-handed navigation (botões no canto inferior direito)
- Natural "form on tablet" experience (auto-next field, large inputs)

### Effortless Interactions

**For Professor - Training Registration (MVP Critical)**

1. **Entry:** Abre app → goes to "Registrar Treino" (default page)
2. **Auto-Populate:** Lista de alunos da turma já carregada (não precisa digitar 15 nomes)
3. **Attendance Mark:** 2 cliques por aluno:
   - Clique 1: Toggle "Presente" vs "Ausente" (color change feedback)
   - Clique 2: Auto-scroll para próximo
4. **Performance Notes:** Free-text field (não estruturado, professora digita naturalmente)
5. **Save:** Auto-save (sem botão "Salvar"), indica "✓ Salvo" quando termina
6. **Offline:** Se sem conexão, salva localmente, sincroniza quando reconecta

**Time Target:** 3-5 minutos para 15+ alunos (vs 15+ min em papel/Excel)

**For Student - Understanding Progress**

1. **Entry:** Aluno loga, vê dashboard com own progress (default page)
2. **Primary Visualization:** Gráfico de evolução technicode (linha chart: last 3 months)
   - X-axis: time (weeks)
   - Y-axis: score (1-10 subjetivo do professor)
   - Points: último treino de cada mês marca milestone
3. **Secondary Data:** Participation frequency (quanto treinou vs planejado)
4. **Context:** Últimas anotações do professor (2-3 mais recentes, legíveis)
5. **Aha Moment:** "Ah, eu realmente estou evoluindo, não é só na minha cabeça"

**For Admin - LGPD Compliance Dashboard**

1. **At-a-Glance:** Traffic light status
   - 🟢 Green: 100% compliance (todos consentimentos, audit logs in place)
   - 🟡 Yellow: 95-99% (alguns alunos faltando consentimentos)
   - 🔴 Red: < 95% (immediate action needed)
2. **Drilldown:** Click status → see which students missing consent (actionable list)
3. **Operational Metrics:**
   - Presença media (esperado 80%+)
   - Evasão risk (faltaram 3+ semanas → flag)
4. **Auto-Audit:** Every access logged (WHO/WHAT/WHEN/WHY) in append-only log

### Critical Success Moments

**Moment 1: Professor's First Training Submission**
- Professor termina aula, abre app
- Deve conseguir registrar todos alunos em < 5 minutos SEM tutorial
- Feedback: "Pronto, muito mais rápido que papel"
- Success: Voltará na próxima aula (70% adoption target)

**Moment 2: Student Sees Progress**
- Aluno loga, vê imediatamente gráfico mostrando evolução própria
- Professor anotou em 3 treinos: "Melhor defesa", "Pegou primeira armbarra", "Estabilidade melhorou"
- Aha Moment: "Meu professor está realmente acompanhando meu progresso"
- Retention Impact: Continua treinando, não questiona mais

**Moment 3: Admin Verifies Compliance**
- Ricardo (admin) clica "LGPD Status" → vê 🟢 Green (100%)
- Responsável algum vem questionar privacidade
- Ricardo puxa audit log → "Quem acessou dados de X? Só professor dele em Y data para registrar treino"
- Legal Protection: Não será processado por LGPD violation
- Business Impact: Diferencial competitivo (pode vender/comunicar)

### Experience Principles

**1. Effortless Registration (Professor's Canon)**
Every interaction toward training registration should be frictionless. Pre-fill, auto-scroll, auto-save, offline-capable.

**2. Data Makes Sense (Aluno's Canon)**
Progress visualization must reveal clear patterns. No raw numbers — show evolution narratively (anotações + gráficos + timeline).

**3. Trust Through Transparency (Admin's Canon)**
LGPD compliance must be obvious and verifiable. No hidden logs or mysterious data flows. Green/Yellow/Red status = confidence.

**4. Smart Defaults**
System anticipates context:
- Professor sees his class's roster (not "pick students")
- Aluno sees only own progress (not "choose what to see")
- Admin sees compliance status at-a-glance (not "generate report")

**5. Mobile-First Mindset**
Touch-friendly design (48x48px), no hover states, responsive layouts — even on desktop.

**6. Offline-First Resilience**
Assume intermittent connectivity. Cache syncs. Data never lost. User never confused by "offline mode" — just works.