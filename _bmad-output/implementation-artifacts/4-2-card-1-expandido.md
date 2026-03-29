# Story 4.2: Card 1 Expandido — Gráfico de Evolução Temporal

**Status:** done

**Story URL:** [card-1-expandido]

---

## 📖 Story

Como um **Aluno**,  
Quero **ver minha evolução em gráfico ao longo do tempo**,  
Para que **eu visualize tendência (está melhorando ou piorando?)**

---

## ✅ Acceptance Criteria

1. **Dado** que Aluno clica "Ver detalhes" no Card 1 (Evolução)  
   **Quando** clica  
   **Então** abre modal/página com título: "Sua Evolução"

2. **Dado** que o gráfico é renderizado  
   **Quando** carrega  
   **Então** mostra:
   - **X-axis:** Semanas (últimas 12 semanas ou 3 meses)  
     → **Labels:** "Sem 1", "Sem 2", "Sem 3", etc.
   - **Y-axis:** % proficiência (0-100)
   - **Linha:** Orange (#FF6B35) trending up
   - **Pontos:** Círculos pequenos 4px
   - **Data label on hover:** "Semana 2: 52%"

3. **Dado** que gráfico está exibido  
   **Quando** Aluno vê  
   **Então** linha conecta: Sem1: 45% → Sem2: 52% → Sem3: 60% → Sem4: 68%  
   **E** interpretação em português: "Você está crescendo! 🎉"  
   **E** velocidade: "+23% em 4 semanas"

4. **Dado** que Aluno está em mobile  
   **QUANDO** gráfico renderiza  
   **ENTÃO** SVG é responsivo (não overflow em X)  
   **E** toque em ponto: exibe tooltip com valor

5. **Dado** que há dados insuficientes (< 2 semanas)  
   **QUANDO** sistema detecta  
   **ENTÃO** exibe: "Ainda não há dados suficientes para análise"  
   **E** começa a acumular após 2ª semana

6. **Dado** que Aluno quer comparar com semana anterior  
   **QUANDO** clica "[Semana anterior]"  
   **ENTÃO** gráfico atualiza mostrando período anterior  
   **E** transição suave (não jump brusco)

7. **Dado** que há semana com valor menor que anterior  
   **QUANDO** gráfico renderiza  
   **ENTÃO** ponto é vermelho (warning) em vez de orange  
   **E** Aluno vê: "Ó, teve uma queda. Bora retomar?"

8. **Dado** que Aluno observa a tendência  
   **QUANDO** está vendo  
   **ENTÃO** consegue responder: "Estou progredindo? SIM/NÃO"  
   **E** sensação é clara (verde/trending up = bom, vermelho/trending down = preocupe)

---

## 📋 Tasks / Subtasks

- [x] **Definir contrato de dados do gráfico de evolução**
  - [x] Criar interface `StudentProgressWeekly` em `frontend/src/types/index.ts`
  - [x] Definir estrutura: weekNumber, proficiencyPercent, date
  - [x] Adicionar método `getStudentProgressChart()` em `frontend/src/services/api.service.ts`

- [x] **Implementar componente gráfico SVG responsivo**
  - [x] Criar novo sub-componente `student-progress-chart.component.ts` (canvas/SVG)
  - [x] Implementar scaling automático (Y-axis 0-100, X-axis semanas)
  - [x] Desenhar linha e pontos com D3.js ou SVG nativo
  - [x] Implementar animação de entrada (fade-in suave)

- [x] **Implementar interatividade do gráfico**
  - [x] On hover ponto: exibir tooltip com "Semana X: Y%"
  - [x] On mobile touch: tap ponto → tooltip
  - [x] Navegação "Semana anterior/próxima": atualizar gráfico com transição
  - [x] Color logic: orange (#FF6B35) normal, red (#D32F2F) em queda

- [x] **Implementar lógica de dados insuficientes**
  - [x] Validar se há >= 2 semanas de dados
  - [x] Se não: mostrar "Ainda não há dados suficientes para análise"
  - [x] Se sim: renderizar gráfico normal

- [x] **Implementar modal/página de detalhes**
  - [x] Abrir modal quando clica "Ver detalhes" do Card 1
  - [x] Título: "Sua Evolução"
  - [x] Subtitle: "Sua tendência de progresso nas últimas semanas"
  - [x] Layout: Gráfico topo + interpretação abaixo

- [x] **Integrar com dados do backend (Story 4.1)**
  - [x] Reutilizar endpoint `/api/users/alunos/me/progresso` existente
  - [x] Extrair array de dados mensais para população semanal (agregar de necessário)
  - [x] Implementar retry/offline cache (reutilizar padrão Story 4.1)

- [ ] **Testes e validação**
  - [x] Testar gráfico com dados variados (todas as linhas trending, queda, flat)
  - [ ] Testar responsividade em mobile (sem overflow, swipe intuitivo)
  - [x] Testar transição de período (smooth animation)
  - [x] Testar offline (exibir dados cacheados do Chart)

---

## 🎯 Dev Notes

### Contexto Funcional

- **Story 4-2** é a primeira "card expandida" de Epic 4.
- O padrão estabelecido aqui (modal detail view, gráfico responsivo, tooltip) será reutilizado nas Stories 4.3, 4.4, 4.5.
- **Não over-engineer gráficos:** use SVG simples ou D3.js leve (Chart.js é bloat para esta escala).
- A escala deve ser "elegante em mobile" — não sacrificar clareza por densidade.

### Estado Atual do Código (Fonte de Verdade) 

**Frontend:**
- `frontend/src/components/home/home.component.ts` → Já tem modal overlay logic (Card 4 details).
- `frontend/src/components/home/home.component.html` → Já tem template estrutura para modal.
- `frontend/src/components/home/home.component.scss` → Já tem estilo modal (reutilizar).
- `frontend/src/types/index.ts` → Interface `StudentProgressDashboardResponse` já existe com `cards.evolucao` objeto.

**Backend:**
- `backend/src/controllers/users.ts` → `getMyStudentProgressDashboardHandler()` existe.
- `backend/src/lib/database.ts` → `getStudentProgressDashboard()` já agrupa dados mensais com query de evolução temporal (3 meses).
  - Retorna objeto com `evolution: { monthStart, presentCount, totalCount }[]`
  - **TODO:** Para Story 4.2, agregar mensalmente em semanas (13 semanas = ~3 meses).

**Pattern Established (Story 4.1):**
- Modal state: `isStudentProgressDetailOpen`, `selectedProgressDetailView` (component property)
- Modal template: `<div class="student-progress-modal" [attr.data-section]="selectedProgressDetailView">`
- Open logic: `openStudentProgressDetails(section: string)`
- Close logic: `closeStudentProgressDetails()`
- Already in place: skeleton, retry, offline indicator

### Requisitos Técnicos & Guardrails

#### Frontend Stack
- **Framework:** Angular 15+ (TypeScript strict mode)
- **Chart Library:** Prefer **SVG native** or **D3.js** (avoid Chart.js, Plotly — too heavy for this scope)
  - Reasoning: Bundle size < 50kb for chart library; Story 4.1 frontend bundle was 819.51kb raw, adding 150kb+ is risky
  - If D3.js: use `d3@^7.x` (lightweight version), import only `d3-scale`, `d3-line` (not full d3)
  - If SVG native: implement line drawing via `<path d="M... L... Z">` with `stroke` + `stroke-width` + `fill="none"`
- **Responsiveness:** CSS Grid or Flexbox (not absolute positioning — breaks mobile)
- **Touch Events:** Use `@HostListener('touchstart')` for mobile tap → tooltip

#### Backend Stack
- **Aggregation Server-Side:** Modify `getStudentProgressDashboard()` in `backend/src/lib/database.ts`
  - Add sub-field `weeklyEvolution: { weekNumber: number, date: Date, proficiencyPercent: number }[]`
  - Keep existing monthly for Card 1 mini-chart compatibility
  - Week numbering: ISO 8601 (`date.getWeek()`) or relative count ("Week 1 of 12")

#### File Structure
```
frontend/src/
├── components/
│   └── home/
│       ├── home.component.ts (MODIFY: add openStudentProgressChart handler)
│       ├── home.component.html (MODIFY: add chart modal template)
│       └── home.component.scss (MODIFY: add chart specific styles if needed)
├── types/
│   └── index.ts (ADD: StudentProgressWeekly, StudentProgressChart interfaces)
└── services/
    └── api.service.ts (ADD: getStudentProgressChart method if separate endpoint, else reuse)

backend/src/
├── lib/
│   └── database.ts (MODIFY: add weeklyEvolution field to StudentProgressDashboard)
└── controllers/
    └── users.ts (MODIFY: include weeklyEvolution in response if aggregating)
```

#### API Contract

**Response (from existing `/api/users/alunos/me/progresso` or new endpoint):**
```typescript
{
  "cards": {
    "evolucao": {
      "currentMonthPresentCount": 12,
      "currentMonthTotalCount": 16,
      "previousMonthPresentCount": 10,
      "previousMonthTotalCount": 15,
      "weeklyEvolution": [  // NEW FOR STORY 4.2
        { "weekNumber": 1, "date": "2026-02-01", "proficiencyPercent": 45 },
        { "weekNumber": 2, "date": "2026-02-08", "proficiencyPercent": 52 },
        { "weekNumber": 3, "date": "2026-02-15", "proficiencyPercent": 60 },
        { "weekNumber": 4, "date": "2026-02-22", "proficiencyPercent": 68 }
      ]
    }
  }
}
```

#### Offline & Caching
- Chart data persists in localStorage cache (same key as Card 1: `student-progress-dashboard:{userId}`)
- If offline: show cached chart + overlay icon "Dados em cache"
- No separate cache strategy needed (piggyback on Story 4.1 sync)

#### Performance Targets
- **SVG rendering:** < 500ms for 12-week path
- **Hover tooltip render:** < 100ms (debounce to 50ms on mouse move)
- **Week navigation transition:** 300ms smooth (CSS transition + opacity fade)

#### Security & RBAC
- **Endpoint protection:** `/api/users/alunos/me/progresso` already requires `Aluno` role (Story 4.1) ✅
- **Data isolation:** Student sees only own data (enforced in query `WHERE student_id = :studentId`)
- **No exposed IDs:** Avoid serializing internal `student_id` in JSON (already done in 4.1 response)

#### Naming & Conventions
- **Component method:** `openStudentProgressChart()` (parallel to `openStudentProgressDetails()`)
- **CSS classes:** `.student-progress-chart`, `.chart-tooltip`, `.chart-point`
- **Type interfaces:** `StudentProgressWeekly`, `StudentProgressChart`
- **API method:** `getStudentProgressChart()` or reuse `getStudentProgressDashboard()` and extract
- **SVG element ID:** `student-progress-chart-svg` (for animations/reset if multi-view)

---

## 📚 Previous Story Intelligence (Story 4.1)

### Learnings from 4.1
- **Modal state management works:** `selectedProgressDetailView` pattern proven (used for 4 cards)
- **Offline cache implementation:** localStorage with timestamp metadata works well (no IndexedDB needed for MVP)
- **Retry logic (2s/10s):** Already established, reuse same pattern
- **Responsive grid:** 1 col mobile, 2 cols tablet/desktop established (use same in chart modal)
- **Skeleton loader:** Material skeleton lines work for placeholder (optional for chart, show empty SVG first)

### Files Modified in 4.1 (Reference for Patterns)
- `home.component.ts`: Lines 150-180 show modal open/close implementation
- `home.component.html`: Lines 88-120 show modal overlay template structure
- `home.component.scss`: Lines 77-130 show responsive modal styling
- `database.ts`: `getStudentProgressDashboard()` function shows parallel query aggregation pattern

### Known Issues / Gotchas (From 4.1)
- **Offline cache naming:** Use consistent key format — already doing `student-progress-dashboard:{userId}` ✓
- **Touch events on mobile:** Hover tooltip doesn't work on touch; implement `@HostListener('touchstart')` instead
- **SVG scaling on mobile:** Test with actual device (not just browser DevTools — scrolling behavior differs)
- **Data freshness:** If user offline for 1 week, chart shows stale data until sync; communicate via cache indicator ✓

---

## 🏛️ Architecture Compliance Checklist

- ✅ **Layered SPA:** Component (view) → Service (API) → Backend (aggregation) → DB (query)
- ✅ **Domain-driven design:** Chart is domain concept (evolution), not generic UI widget
- ✅ **Stateless backend:** No session state; query stateless, response contains all data
- ✅ **RBAC enforced:** `/api/users/alunos/me/progresso` requires `Aluno` role
- ✅ **Type safety:** TypeScript interfaces for `StudentProgressWeekly`, chart data shape
- ✅ **Offline-first:** Chart data from localStorage cache when offline
- ✅ **Performance targets:** < 500ms SVG render, < 1s total modal open
- ✅ **LGPD compliance:** Chart data is student's own progreso (no PII leakage)

---

## 🚀 Implementation Sequence

### Phase 1: Data & Types (Backend + TS)
1. Add `StudentProgressWeekly` interface to `frontend/src/types/index.ts`
2. Add `weeklyEvolution` field to backend response (modify `database.ts` aggregation query)
3. Add `weeklyEvolution` parsing in `home.component.ts` from API response

### Phase 2: SVG Chart Rendering
4. Create SVG path for line chart (use D3.js or native path math)
5. Add color logic (orange normal, red for drops)
6. Add point circles (4px radius at each data point)

### Phase 3: Interactivity
7. Implement hover tooltip on desktop
8. Implement touch tap tooltip on mobile
9. Add week navigation (Semana anterior/próxima) with state toggle

### Phase 4: Modal Integration
10. Add template to `home.component.html` (reuse modal structure from Card 4)
11. Wire click handler: Card 1 "Ver detalhes" → open chart modal
12. Add close handler: modal close button

### Phase 5: Edge Cases & Polish
13. Handle insufficient data (< 2 weeks) → show message
14. Cache chart data in localStorage (piggyback on existing sync)
15. Add smooth transitions (CSS for week navigation)
16. Test responsive sizing (mobile, tablet, desktop)

### Phase 6: Testing
17. Unit test: chart data aggregation (weekly roll-up from monthly)
18. E2E test: UI flow (click Card 1 → modal opens → chart renders → navigate weeks → close)
19. Manual test: offline/online cache behavior
20. Manual test: mobile responsiveness (no overflow, swipe intuitiveness)

---

## 💬 Questions for Refinement (If User Needs More Detail)

1. **Chart library preference:** D3.js (full power) vs SVG native (minimal deps)?
   - *Current assumption:* SVG native for bundle size, escalate to D3 if interactivity grows

2. **"Proficiency" calculation:**
   - *Current assumption:* Backend calculates from `presentCount/totalCount` as %
   - If different formula needed (techniques unlocked, grades, etc.), clarify

3. **Week definition:**
   - *Current assumption:* ISO 8601 week (Mon-Sun), or relative "Week X of 12"?
   - Frontend can display either label

4. **Historical data retention:**
   - *Current assumption:* API returns last 12 weeks; older data purged (LGPD compliance)
   - If longer history needed, confirm pagination strategy

---

## 📝 Status

**Created:** 2026-03-27 14:58:00Z  
**Status:** review  
**Completion Notes:** Implementação principal concluída no backend e frontend. Build do backend (`npm run build`), build do frontend (`npm run build`) e suíte Angular (`npm test -- --watch=false --browsers=ChromeHeadless`) passaram. O gráfico semanal foi integrado ao modal de evolução com fallback offline coberto por teste automatizado. Permanece como follow-up de review apenas a validação manual em device mobile real para confirmar ergonomia de toque e ausência de overflow.

**File List:**
- `backend/src/lib/database.ts`
- `frontend/src/app.module.ts`
- `frontend/src/components/home/home.component.ts`
- `frontend/src/components/home/home.component.html`
- `frontend/src/components/home/home.component.scss`
- `frontend/src/components/home/home.component.spec.ts`
- `frontend/src/components/student-progress-chart/student-progress-chart.component.ts`
- `frontend/src/components/student-progress-chart/student-progress-chart.component.html`
- `frontend/src/components/student-progress-chart/student-progress-chart.component.scss`
- `frontend/src/components/student-progress-chart/student-progress-chart.component.spec.ts`
- `frontend/src/components/admin-profile/admin-profile.component.spec.ts`
- `frontend/src/components/professors-list/professors-list.component.spec.ts`
- `frontend/src/components/student-form/student-form.component.spec.ts`
- `frontend/src/services/offline-sync.service.spec.ts`
- `frontend/src/services/api.service.ts`
- `frontend/src/types/index.ts`

---

**Next Steps for Developer:**
1. Read this file completely
2. Check Story 4.1 implementation patterns in living code
3. Implement Phase 1 (data layer) first
4. Get code review feedback on chart design before Phase 2
5. Run tests per Phase 6 checklist before marking done

**Code Review Readiness:**
- Story is scoped to single UI feature (chart detail view)
- All dependencies on Story 4.1 are soft (reuse existing modal infrastructure)
- No breaking changes to existing components
- Offline behavior inherits from Story 4.1 (no-op)
- Performance targets are clear and measurable
