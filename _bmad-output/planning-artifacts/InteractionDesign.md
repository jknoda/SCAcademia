Defining Core Experience — Interaction Design
Baseado no que aprendemos, temos 3 defining experiences:

#1: PROFESSOR TRAINING REGISTRATION (PRIMARY)
The Moment: Carla termina treino, abre app, registra em < 5 minutos

Mental Model: "Vou anotar quem foi, como se fosse papel, mas digital"

Interaction Flow:

SCREEN 1: "Registrar Treino" (Entry)
├─ Today's date + time (auto-fill)
├─ Class name auto-fill ("Turma Iniciantes 18h")
├─ CTA: "Começar"
└─ Success feeling: "Simples, posso usar"

    ↓

SCREEN 2: "Quem treinou?" (Step-by-step attendance)
├─ Student list (auto-populate from class roster)
├─ Each student: "✓ Presente" | "✗ Ausente" toggles
├─ Auto-scroll after marking each student
├─ Live counter: "Marcados: 12 de 15"
└─ Success feeling: "Rápido, clear progress"

    ↓

SCREEN 3: "Como foi?" (Performance notes)
├─ Free-text field (large, touch-friendly)
├─ Auto-expanding textarea
├─ Placeholder: "Ex: Turma bem focada. João pegou primeira armbarra. Maria com dor no ombro."
├─ Optional but encouraged
└─ Success feeling: "Posso deixar nota pessoal pra cada um depois"

    ↓

SCREEN 4: "Revisar & Salvar" (Confirmation)
├─ Summary: "15 alunos | 14 presentes | 1 ausente | 2 notas adicionadas"
├─ CTA: "Salvar Treino"
├─ Upon save: "✓ Salvo às 19:45" (green, celebratory)
├─ Auto-sync offline data when connection returns
└─ Success feeling: "Pronto! Não preciso mais pensar nisso"

TOTAL TIME: 3-5 minutes

Success Criteria for this experience:

✅ Professor marks 15+ students in < 3 minutes
✅ Data saves instantly (or queues offline, syncs when connected)
✅ Professor never loses data (works 100% offline)
✅ Clear visual feedback at each step
#2: STUDENT VIEWING PROGRESS (SECONDARY)
The Moment: Pedro abre app, vê imediatamente sua evolução em gráfico

Mental Model: "Quero ver se realmente estou evoluindo"

Interaction Flow:
SCREEN 1: "Meu Progresso" (Dashboard)
├─ Student name + faixa (profile header)
├─ Primary graph: "Evolução Técnica" (line chart, last 3 months)
│  ├─ X-axis: Weeks (Sem 1, Sem 2, Sem 3... Semana atual)
│  ├─ Y-axis: Score 1-10 (técnica)
│  ├─ Line shows trend (visual pattern > numbers)
│  ├─ Dots mark milestones (large ones = "Pegou primeira armbarra", "Passou de faixa")
│  └─ Hover: shows date + specific note
├─ Secondary metric: "Frequência" (attendance rate)
│  ├─ "14 de 16 treinos este mês" (87%)
│  └─ Streak badge: "Treinou 4 semanas seguidas 🔥"
└─ Success feeling: "Eu realmente estou evoluindo!"

    ↓ (Scroll down)

SCREEN 2: "Notas do Professor" (Context)
├─ Recent teacher comments (chronological, newest first)
│  ├─ "Maio 15: Defesa muito melhor. Lembra em março levava shido fácil? Hoje aguentas 3 técnicas."
│  ├─ "Maio 8: Pegou primeira armbarra! Grande progresso em pegada."
│  ├─ "Abril 30: Precisa melhorar estabilidade nas quedas. Trabalha alongamento em casa?"
└─ Success feeling: "Meu professor me conhece e está acompanhando"

    ↓ (Scroll down, optional)

SCREEN 3: "Milestones" (Celebration)
├─ Cards for achievements:
│  ├─ 🎯 "Passou de Faixa" (April 10)
│  ├─ 🏆 "Primeira Competição" (May 5)
│  ├─ 🔥 "4 Semanas Consecutivas" (May 22)
│  └─ 💪 "Score Técnico: 4→7" (May 25)
└─ Success feeling: "Meu progresso é REAL. Não é só na minha cabeça."

TOTAL INTERACTION: 2-3 minutes of engagement

Success Criteria for this experience:

✅ Graph loads in < 1 second
✅ Evolution is CLEAR and VISUAL (not raw numbers)
✅ Professor notes are personal and specific (not generic feedback)
✅ Student returns 2x+ per week (engagement hook)
✅ Milestone celebrations create emotional resonance
#3: ADMIN CHECKING COMPLIANCE (TERTIARY)
The Moment: Ricardo abre app, vê imediatamente 🟢 "Tudo ok" ou identifica problema

Mental Model: "Preciso saber se tá tudo protegido e organizado"

Interaction Flow:

SCREEN 1: "Dashboard LGPD Compliance" (At-a-glance status)
├─ Large status indicator (top center)
│  ├─ 🟢 "Compliance: 100%" (green, peaceful)
│  │  └─ "120 alunos | 120 consentimentos | 0 riscos"
│  ├─ OR 🟡 "Compliance: 95%" (yellow, alert)
│  │  └─ "6 alunos sem consentimento de imagem"
│  └─ OR 🔴 "Compliance: < 95%" (red, urgent)
│     └─ "8 alunos com dados incompletos"
├─ Operational KPIs:
│  ├─ Presença Média: 87% ✓
│  ├─ Evasão Risk: 3 alunos (2+ weeks absent) ⚠️
│  ├─ Audit Logs: 24h clean ✓
│  └─ Backup: Último - 2h atrás ✓
└─ Success feeling: "Tudo está sob controle"

    ↓ (Click any KPI or "Evasão Risk: 3 alunos")

SCREEN 2: "Drill-down Detail" (Actionable)
├─ If "Evasão Risk" clicked:
│  ├─ List of at-risk students:
│  │  ├─ João (last training: 3 weeks ago)
│  │  ├─ Maria (last training: 2.5 weeks ago)
│  │  └─ Lucas (last training: 2 weeks ago)
│  └─ Actions available: "Call parent", "Check health reason", "Send message"
├─ If "Compliance Issues" clicked:
│  ├─ List of incomplete consents:
│  │  ├─ André (missing: parental consent for image)
│  │  └─ [name] (missing: health certification)
│  └─ Action: "Click to send Digital Consent Email"
└─ Success feeling: "Conheco exatamente o problema. Posso agir."

    ↓ (Scroll for history)

SCREEN 3: "Audit Timeline" (Transparency & Legal Protection)
├─ Chronological log (last 7 days visible by default):
│  ├─ "May 25, 19:45 - Prof. Carla registered training | 15 students"
│  ├─ "May 25, 18:22 - Admin Ricardo accessed compliance dashboard"
│  ├─ "May 24, 14:10 - Student Pedro viewed own progress | < 1 min"
│  ├─ "May 23, 09:00 - New student André registered | parental consent collected"
│  └─ [... more entries]
├─ Filters: by user, by action type, by date range
└─ Success feeling: "Se alguém questionar, tenho auditoria completa."

TOTAL INTERACTION: < 1 minute for status, 2-3 minutes for drill-down if issues exist

Success Criteria for this experience:

✅ Compliance status is OBVIOUS (🟢/🟡/🔴 instant understanding)
✅ Problems are ACTIONABLE (drill-down shows exactly what to fix)
✅ Audit trails are COMPREHENSIVE (legal protection, WHO WHAT WHEN WHY)
✅ Admin feels CONFIDENT that system is protecting the academy
Experience Mechanics Summary
Persona	Defining Experience	Key Mechanic	Success Time
Professor	Register training	Conversational form (step-by-step, auto-advance)	< 5 min
Student	See progress	Visual graph + milestones + celebration	< 1 min to load, 2-3 min to explore
Admin	Verify compliance	Traffic light status + drill-down + audit trail	< 1 min to check, 2-3 min if issues


