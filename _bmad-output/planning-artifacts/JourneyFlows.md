User Journey Flows — Fluxos Detalhados por Persona
Journey #1: PROFESSOR TRAINING REGISTRATION (Critical for MVP Success)
Entry Point: Treino terminou, professor abre app

Goal: Registrar 15+ alunos (presença + desempenho) em < 5 minutos

Flow Diagram:

graph TD
    A["📱 Professor abre app"] --> B{"Tela de entrada (tab bar)"}
    B -->|Taps 'Registrar'| C["Vê últimos treinos (card list)"]
    C -->|Taps '+ Novo Treino'| D["Screen 1: Qual turma?"]
    D -->|Turma auto-filled| E["Screen 2: Quem treinou?"]
    E -->|Marca aluno 1-N| F{"Todos marcados?"}
    F -->|Não, continua| E
    F -->|Sim| G["Screen 3: Anotações (opcional)"]
    G -->|Digita ou pula| H["Screen 4: Revisar"]
    H -->|Taps 'Salvar Treino'| I{"Internet?"}
    I -->|Sim| J["✓ Salvo imediatamente"]
    I -->|Não| K["💾 Salvo localmente (sync pending)"]
    J --> L["Volta pra lista de treinos"]
    K --> L
    L -->|Treino agora aparece na lista| M["🎉 Sucesso - Professor retorna"]
    
    style A fill:#e1f5ff
    style J fill:#c8e6c9
    style K fill:#fff9c4
    style M fill:#c8e6c9

Detailed Step Breakdown:

Step 1: Home/Dashboard

Shows recent trainings (card list)
Card shows: Date, Class, Attendance count, Notes snippet
CTA: "+ Novo Treino" (blue button, 48x48px minimum)
Alternative: "Editar" if training already drafted
Step 2: Training Form — Question 1

"Qual turma foi?" (conversational heading)
Class dropdown auto-filled if only one class
Class selected from academy's roster
Next button or auto-advance on selection
Step 3: Training Form — Attendance

"Quem treinou hoje?" heading
Student roster pre-loaded from class
Each student: Toggle "✓ Presente" | "✗ Faltou"
Counter: "Marcados: 12 de 15"
Auto-scroll after each toggle (optional, based on feedback)
Step 4: Training Form — Notes

"Como foi o treino?" (open-ended)
Textarea with placeholder: "Ex: Turma bem focada. João pegou primeira armbarra. Maria com dor."
Optional (don't require)
Auto-expanding textarea (grows as professor types)
Step 5: Review Screen

Summary: "15 alunos | 14 presentes | 1 ausente | 1 anotação"
"Salvar Treino" button (green/success color)
Back/Edit option if changes needed
Step 6: Confirmation

Immediate feedback: "✓ Salvo às 19:45"
Auto-dismiss toast after 2s
Return to training list (card now shows updated info)
If offline: "💾 Salvo localmente | Sincronizando..." (with spinner)
Card-Focused Implementation:
Each training becomes a Training Card:

┌────────────────────────────────┐
│ 📅 Iniciantes 18h              │
│ ────────────────────────────── │
│ May 25, 19:45 | 14/15 presentes│
│ "Turma bem focada. João..."    │
│ [Editar] [✓ Salvo - Sincronizado] 
└────────────────────────────────┘

Journey #2: STUDENT VIEWING PROGRESS (Engagement Hook)
Entry Point: Student accesses dashboard

Goal: See evolution + feel accomplished in < 30 seconds

Flow Diagram:

graph TD
    A["🎓 Aluno abre app"] --> B{"Tela de entrada"}
    B -->|Taps prof icon/menu| C["Tela: Meu Progresso (default)"]
    C -->|Carrega| D["Loading: Gráficos rendering..."]
    D -->|< 1s load| E["Card 1: Header (name + faixa)"]
    E -->|Auto-load| F["Card 2: Evolução Técnica"]
    F -->|Graph visible| G{"Aluno entende progresso?"}
    G -->|Sim!| H["🎉 Aha moment - Vê evolução"]
    G -->|Consulta| I["Card 3: Notas do Professor"]
    I -->|Lê feedback| J["Entende contexto"]
    J --> H
    H -->|Scroll| K["Card 4: Milestones"]
    K -->|Vê badges/achievements| L["Celebra conquistas"]
    L --> M["Engajamento! Volta 2x+ semana"]
    
    style A fill:#e1f5ff
    style H fill:#c8e6c9
    style M fill:#c8e6c9

Card-by-Card Breakdown:

Card 1: Student Header

Name + Profile photo (small)
Current Faixa badge (colored, judo-specific)
Last training date: "Último treino: ontem"
Card 2: Evolução Técnica (PRIMARY)

Headline: "Evolução Técnica"
Small line chart (height 120px, optimized for quick scan)
X-axis: Last 12 weeks
Y-axis: Score 1-10
Trend visible (up/down/stable)
Clickable: "Ver Gráfico Completo" → expand view
Card 3: Frequência

Headline: "Frequência"
Stat: "14 de 16 treinos este mês"
Percentage bar: 87% (color-coded)
Badge: "🔥 4 semanas consecutivas!"
Card 4: Notas do Professor (CONTEXT)

Headline: "Notas do Professor"
Recent comments (2-3 most recent)
Formatted: "May 25 | Defesa muito melhor agora!"
CTA: "Ver todas as notas"
Card 5: Milestones (CELEBRATION)

Headline: "Teus Milestones"
Achievement cards:
🎯 "Pegou primeira armbarra!"
🏆 "Passou de faixa em Abril"
🔥 "4 Semanas Consecutivas"
Error Recovery:

No data yet: Show empty state card "Espera por primeiro treino..." with illustration
Loading too slow: Show skeleton loaders while graphs render
Offline: Show cached data with "⏳ Último update: 2h atrás"
Performance Optimization:

Graph loads with < 1s goal
Other cards load progressively (lazy load as scroll)
Animations smooth but quick (ease-out, 300ms)
Journey #3: ADMIN VERIFYING COMPLIANCE (Peace of Mind)
Entry Point: Admin needs to verify LGPD status

Goal: Confirm 100% compliance in < 30 seconds OR identify issues in < 2 minutes

Flow Diagram:

graph TD
    A["👨‍💼 Admin opens dashboard"] --> B{"Taps 'LGPD Compliance'"}
    B -->|Load| C["Card 1: Status at-a-glance"]
    C -->|Shows 🟢/🟡/🔴| D{"Status?"}
    D -->|🟢 Green 100%| E["Peace of mind! ✓"]
    D -->|🟡 Yellow| F["Alert! Click to drill down"]
    D -->|🔴 Red| G["Urgent! Must fix"]
    E --> H["Done - admin trusts system"]
    F --> I["Details card: Missing consent list"]
    I -->|Shows exact students| J["Can 'Send Consent Email'"]
    J --> K["Takes action - problem solved"]
    G --> L["Details card: Critical issues"]
    L --> M["Escalate or investigate"]
    M --> N["Take corrective action"]
    
    H --> O["Scroll for more details (optional)"]
    O -->|Views audit log| P["See access timeline"]
    
    style A fill:#e1f5ff
    style E fill:#c8e6c9
    style K fill:#c8e6c9
    style N fill:#fff9c4

    Card-by-Card Breakdown:

Card 1: COMPLIANCE STATUS (TOP PRIORITY)

Large status indicator: 🟢 "COMPLIANCE: 100%"
Sub-text: "120 students | 120 consents | 0 risks"
Background: Green-tinted (success color)
Clear, unmissable (admin sees this first)
CTA: "Detalhes" or "Revisão Completa"
Card 2: OPERATIONAL METRICS

Headline: "Metricas Operacionais"
KPI list:
✓ Attendance: 87%
✓ Backup: Current (< 2h old)
⚠️ Risk Cases: 3 (flagged, clickable)
Card 3: AT RISK (IF ANY)

Headline: "Alunos em Risco"
Each at-risk student listed:
"João (28 dias sem treinar)"
"Maria (21 dias)"
"Lucas (19 dias)"
Actions available: "Ligar responsável", "Enviar mensagem", "Marcar check-in"
Card 4: AUDIT LOGS (TRANSPARENCY)

Headline: "Auditoria (últimas 24h)"
Timeline of access:
"19:45 - Prof. Carla registrou treino"
"18:22 - Admin Ricardo acessou"
"14:10 - Aluno Pedro visualizou progresso"
Each entry expandable for details
CTA: "Ver timeline completa" (full audit)
Card 5: ACTIONS (Optional)

Quick action buttons:
"Send missing consent emails"
"Export compliance report"
"Backup now"
Error Recovery:

Data loading: Show spinner skeleton for 2s max
Compliance drop: Card switches to 🟡 Yellow with alert toast (top of screen)
Offline: Switch to cached data with "Última verificação: há X minutos"
Permission error: Show "Você não tem acesso a esses dados" with support link
Emotional Design:

Green status creates immediate relief (peace of mind)
Orange/yellow alert is actionable, not overwhelming
Audit logs visible = legal protection = confidence
Journey Patterns (Reusable Across All Journeys)
Pattern 1: Entry Point Navigation
Always clear where user is (tab bar or breadcrumb)
Back button always available
Home/dashboard always one tap away
Pattern 2: Data Loading
Skeleton loaders for < 1s loads
Spinners for 1-3s loads
"No data" states with helpful illustrations
Offline indication always visible
Pattern 3: Action Feedback
Immediate visual response (< 100ms)
Color change + animation (not loud, but clear)
Toast notifications for confirmations (2-3s, auto-dismiss)
Success: Green checkmark + positive tone
Error: Red indicator + clear error message
Pattern 4: Progressive Disclosure
Show essentials first (cards with key info)
"Details" / "Expand" CTAs for deeper info
Avoid overwhelming on first load
Information hierarchy respected
Pattern 5: Error Recovery
Errors clearly identified (red border, icon, text)
Recovery steps suggested ("Retry", "Go back", "Contact support")
No silent failures (always tell user what happened)
Offline handling graceful (queue actions for sync)
Pattern 6: Touch-Friendly Interactions
All buttons 48x48px minimum
Spacing between touch targets (16px minimum)
No hover states (not applicable on touch)
Clear focus states (for keyboard nav, and upcoming tap)
Flow Optimization Principles
Principle 1: Minimize Steps to Value

Professor reaches "Salvo ✓" in < 5 min (no tutorials, no setup)
Student sees progress graph in < 30s (no drilling down required)
Admin sees compliance status in < 10s (no configuration)
Principle 2: Progressive Disclosure

Show one card/question at a time (reduce cognitive load)
Optional fields not required (encourage but don't block)
Details available on-demand (not force-fed)
Principle 3: Effortless Feedback

Every action gets < 100ms response
Visual indicators (color, icon, animation)
Celebratory moments where appropriate (milestones, achievements)
Principle 4: Graceful Degradation

Offline still works (queue for sync, no data loss)
Slow connection shows spinners (not frozen UI)
Missing data shows "no data yet" state (not confusion)
Principle 5: Respect User Context

Data pre-populated where possible (class roster, student list)
Remembered preferences (last class used, default view)
Smart defaults (Mark as "Presente" then auto-scroll)





