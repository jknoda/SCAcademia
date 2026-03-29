# Story 4.6: Comparação Mês-a-Mês — Tendência Motivadora

**Status:** done

---

## Story

Como um Aluno,
Quero ver como meu progresso mudou entre meses,
Para que eu veja se estou melhorando (ou não) consistentemente.

---

## Acceptance Criteria

**AC1 - Acesso à Seção de Comparação Mês-a-Mês**
- DADO que o Aluno está na tela inicial (Home)
- QUANDO clica no botão "Ver comparação" no card "Evolução do Mês"
- ENTÃO abre o painel de detalhes "Comparação Mês-a-Mês"
- E exibe o mês atual vs mês anterior side-by-side (ex.: "Março 2026" vs "Fevereiro 2026")

**AC2 - Quadro Comparativo com 4 Métricas**
- DADO que o painel "Comparação Mês-a-Mês" está aberto e há dados de mês anterior
- QUANDO renderiza
- ENTÃO exibe duas colunas — mês atual e mês anterior — com as métricas:
  - **Frequência**: `presentCount/totalCount (pct%)`
  - **Técnicas praticadas**: contagem de técnicas distintas praticadas durante sessões com presença
  - **Comentários do Professor**: total de comentários recebidos no mês
  - **Evolução**: percentual de frequência (pct%) do mês — sem score separado; reutiliza métrica de frequência como proxy de evolução
- E cada linha de comparação exibe delta com indicador ↑ (verde) ou ↓ (vermelho) ou → (cinza, sem mudança)

**AC3 - Mensagem Motivacional para Tendência Positiva**
- DADO que TODAS as métricas do mês atual são ≥ as do mês anterior
- QUANDO o Aluno visualiza a comparação
- ENTÃO exibe mensagem "🎉 Você MELHOROU em TODOS os aspectos!"
- E subtext: "Excelente progresso! Continue assim!"

**AC4 - Alerta e Recomendação para Tendência Negativa**
- DADO que pelo menos uma métrica do mês atual é inferior ao mês anterior
- QUANDO o Aluno visualiza a comparação
- ENTÃO exibe alerta específico por métrica que caiu (ex.: "⚠️ Frequência caiu este mês")
- E exibe recomendação contextual + próxima aula programada se disponível (ex.: "Agende mais aulas! Próxima: [data]")

**AC5 - Gráfico de Histórico 6 Meses**
- DADO que o Aluno clica em "[Ver últimos 6 meses]"
- QUANDO expande a seção
- ENTÃO exibe lista/barras visuais dos últimos 6 meses com frequência (pct%)
- E cada ponto mostra: mês/ano + (present/total) + barra proporcional
- E os meses são ordenados do mais antigo ao mais recente

**AC6 - Estado de Primeiro Mês (Sem Dados Anteriores)**
- DADO que o Aluno está no seu primeiro mês ativo (sem dados do mês anterior)
- QUANDO o painel carrega
- ENTÃO NÃO exibe comparação side-by-side
- E exibe: "Você está no início! Continue treinando para ver evolução mês-a-mês"
- E mostra os dados do mês atual como referência base

---

## Tasks / Subtasks

- [x] **Backend: Endpoint e função de comparação mensal** (AC1, AC2, AC5, AC6)
  - [x] Criar interface `StudentMonthlyStats` e `StudentMonthlyComparisonResult` em `backend/src/lib/database.ts`
  - [x] Criar função `getStudentMonthlyComparison(academyId, studentId, months?)` em `database.ts` com queries paralelas (Promise.all):
    - [x] Query 1 — Frequência por mês: GROUP BY date_trunc('month') com present/total/pct (últimos 6 meses, `session_attendance` + `training_sessions`)
    - [x] Query 2 — Técnicas por mês: COUNT DISTINCT `technique_id` de sessões com presença (`session_attendance` + `training_sessions` + `session_techniques`)
    - [x] Query 3 — Comentários por mês: COUNT de `session_comments` do aluno por mês
  - [x] Função deve retornar `{ currentMonth, previousMonth | null, history: MonthlyStats[], hasEnoughData }` onde `hasEnoughData = previousMonth !== null`
  - [x] Criar handler `getMyStudentMonthlyComparisonHandler` em `backend/src/controllers/users.ts`
  - [x] Registrar rota `GET /alunos/me/comparacao-mensal` em `backend/src/routes/users.ts` com `authMiddleware` + `requireRole(['Aluno'])`

- [x] **Frontend: Tipos e ApiService** (AC1)
  - [x] Adicionar tipos em `frontend/src/types/index.ts`:
    - `StudentMonthlyStats` (monthStart, monthLabel, frequencia{presentCount,totalCount,pct}, tecnicas, comentarios)
    - `StudentMonthlyComparisonResponse` (currentMonth, previousMonth | null, history, hasEnoughData)
  - [x] Adicionar método `getStudentMonthlyComparison()` em `frontend/src/services/api.service.ts`

- [x] **Frontend: HomeComponent — Lógica** (AC1–AC6)
  - [x] Extender o tipo da union em `openStudentProgressDetails()` para incluir `'comparacao'`
  - [x] Adicionar variáveis de estado em `HomeComponent`:
    - `studentMonthlyComparison: StudentMonthlyComparisonResponse | null`
    - `isLoadingComparacao: boolean`
    - `comparacaoError: string | null`
    - `showComparacaoHistory: boolean` (expande/recolhe os 6 meses)
  - [x] Implementar `loadStudentMonthlyComparison()` com chamada à API + atribuição de estado
  - [x] Chamar `loadStudentMonthlyComparison()` quando `openStudentProgressDetails('comparacao')` é acionado
  - [x] Resetar `showComparacaoHistory = false` ao fechar painel (`closeStudentProgressDetails()`)
  - [x] Implementar métodos helper:
    - `getComparacaoTrend(current: number, previous: number): 'up' | 'down' | 'same'`
    - `getComparacaoDelta(current: number, previous: number): number`
    - `allMetricsImproved(current: StudentMonthlyStats, previous: StudentMonthlyStats): boolean`
    - `getMonthLabel(monthStart: string): string` (converte "2026-03-01" → "Março 2026")
    - `toggleComparacaoHistory(): void`

- [x] **Frontend: HomeComponent — HTML** (AC1–AC6)
  - [x] Adicionar botão "Ver comparação" no card "Evolução do Mês" (`(click)="openStudentProgressDetails('comparacao')"`)
  - [x] Adicionar seção no painel de detalhes `*ngIf="selectedStudentProgressDetail === 'comparacao'"`:
    - Loading state
    - Erro state
    - Estado vazio (AC6: `!hasEnoughData`)
    - Comparação side-by-side (AC2)
    - Mensagem motivacional / alertas (AC3, AC4)
    - Botão "Ver últimos 6 meses" com expansão (AC5)

- [x] **Frontend: HomeComponent — SCSS** (visual)
  - [x] Adicionar estilos: `.comparacao-grid`, `.comparacao-col`, `.comparacao-row`, `.trend-up`, `.trend-down`, `.trend-same`, `.history-bar`, `.history-bar-fill`
  - [x] Garantir responsividade: colunas side-by-side em desktop; empilhadas em mobile

- [x] **Testes e validação** (qualidade)
  - [x] Backend: verificar TypeScript `npx tsc --noEmit`
  - [x] Frontend: adicionar testes em `home.component.spec.ts`:
    - [x] `getComparacaoTrend()` retorna 'up', 'down', 'same' corretamente
    - [x] `allMetricsImproved()` retorna true/false corretamente
    - [x] `getMonthLabel()` formata string de data corretamente
    - [x] Estado vazio (hasEnoughData = false) → renderiza mensagem de primeiro mês
    - [x] Erro ao carregar → renderiza mensagem de erro
  - [x] Frontend: executar suite Angular (`npx ng test --watch=false --browsers=ChromeHeadless`)

---

## Dev Notes

### Contexto Funcional (Epic 4)

Story 4.6 é a sexta entrega do Epic 4 (Engajamento do Aluno). Sequência:
- 4.1 → dashboard base (4 cards)
- 4.2 → card 1 expandido (evolução — chart semanal)
- 4.3 → card 2 expandido (histórico frequência)
- 4.4 → card 3 expandido (timeline comentários)
- 4.5 → card 4 expandido (badges e milestones) ✅ done
- **4.6** → comparação mês-a-mês (esta story)
- 4.7 → notificações proativas
- 4.8 → histórico de faixas

### Padrão de Modal de Detalhes Estabelecido

Todas as stories anteriores do Epic 4 seguem o MESMO padrão:
1. Botão no card chama `openStudentProgressDetails('tipo')` no `home.component.html`
2. `openStudentProgressDetails()` em `home.component.ts` atualiza `selectedStudentProgressDetail` e dispara carregamento de dados
3. O painel de detalhes exibe `*ngIf="selectedStudentProgressDetail === 'tipo'"` dentro do container `.detail-panel` existente
4. `closeStudentProgressDetails()` reseta `selectedStudentProgressDetail = null` e todos os estados filhos

**NOVO para 4.6:** adicionar `'comparacao'` ao tipo union de `openStudentProgressDetails()`. O tipo atual é:
```typescript
openStudentProgressDetails(detail: 'evolucao' | 'frequencia' | 'comentarios' | 'faixa' | 'badges'): void
```
Deve ser ampliado para:
```typescript
openStudentProgressDetails(detail: 'evolucao' | 'frequencia' | 'comentarios' | 'faixa' | 'badges' | 'comparacao'): void
```
E a variável `selectedStudentProgressDetail` provavelmente é do mesmo tipo — verificar e atualizar.

### API Proposta

**Endpoint:** `GET /api/users/alunos/me/comparacao-mensal`
**Auth:** `authMiddleware` + `requireRole(['Aluno'])`
**Query params (opcionais):** `months` (padrão: 6)

```typescript
// Em database.ts
export interface StudentMonthlyStats {
  monthStart: string;     // "2026-03-01" (ISO date)
  monthLabel: string;     // "Março 2026"
  frequencia: {
    presentCount: number;
    totalCount: number;
    pct: number;          // round((present/total)*100) ou 0 se total=0
  };
  tecnicas: number;       // COUNT DISTINCT technique_id de sessões com presença
  comentarios: number;    // COUNT session_comments do aluno no mês
}

export interface StudentMonthlyComparisonResult {
  currentMonth: StudentMonthlyStats;
  previousMonth: StudentMonthlyStats | null;
  history: StudentMonthlyStats[];   // até 6 meses, ORDER BY month_start DESC
  hasEnoughData: boolean;           // true somente se previousMonth !== null E previousMonth.frequencia.totalCount > 0
}
```

**Response JSON do endpoint** (mesmas chaves, camelCase):
```json
{
  "currentMonth": { "monthStart": "2026-03-01", "monthLabel": "Março 2026", "frequencia": {"presentCount": 16, "totalCount": 20, "pct": 80}, "tecnicas": 12, "comentarios": 5 },
  "previousMonth": { "monthStart": "2026-02-01", "monthLabel": "Fevereiro 2026", "frequencia": {"presentCount": 14, "totalCount": 20, "pct": 70}, "tecnicas": 8, "comentarios": 3 },
  "history": [ /* até 6 meses DESC */ ],
  "hasEnoughData": true
}
```

### Queries SQL

**Query 1 — Frequência por mês (6 meses):**
```sql
SELECT
  date_trunc('month', ts.session_date)::date AS month_start,
  SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END)::int AS present_count,
  COUNT(*)::int AS total_count
FROM session_attendance sa
INNER JOIN training_sessions ts
  ON ts.session_id = sa.session_id
 AND ts.academy_id = sa.academy_id
WHERE sa.academy_id = $1
  AND sa.student_id = $2
  AND ts.deleted_at IS NULL
  AND ts.session_date >= (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')::date
GROUP BY date_trunc('month', ts.session_date)
ORDER BY month_start DESC
```

**Query 2 — Técnicas distintas por mês (6 meses):**
```sql
SELECT
  date_trunc('month', ts.session_date)::date AS month_start,
  COUNT(DISTINCT st.technique_id)::int AS techniques_count
FROM session_attendance sa
INNER JOIN training_sessions ts
  ON ts.session_id = sa.session_id
 AND ts.academy_id = sa.academy_id
INNER JOIN session_techniques st
  ON st.session_id = sa.session_id
 AND st.academy_id = sa.academy_id
WHERE sa.academy_id = $1
  AND sa.student_id = $2
  AND sa.status = 'present'
  AND ts.deleted_at IS NULL
  AND ts.session_date >= (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')::date
GROUP BY date_trunc('month', ts.session_date)
ORDER BY month_start DESC
```

**Query 3 — Comentários por mês (6 meses):**
```sql
SELECT
  date_trunc('month', sc.created_at)::date AS month_start,
  COUNT(*)::int AS comments_count
FROM session_comments sc
WHERE sc.academy_id = $1
  AND sc.student_id = $2
  AND sc.deleted_at IS NULL
  AND sc.created_at >= (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')
GROUP BY date_trunc('month', sc.created_at)
ORDER BY month_start DESC
```

**Mesclagem dos resultados (em TypeScript):**
Use um `Map<string, StudentMonthlyStats>` com chave `YYYY-MM`. Para cada mês dos últimos 6:
1. Busque o resultado de frequência → se não existir, `{ presentCount: 0, totalCount: 0, pct: 0 }`
2. Busque técnicas → se não existir, `0`
3. Busque comentários → se não existir, `0`
4. Gere o `monthLabel` via helper

**⚠️ Atenção ao bug de timezone:** Use comparação normalizada de strings YYYY-MM para identificar meses (não `Date.getTime()`). Ver nota em `debugging.md` do usuário.

### Helper de Label de Mês (TypeScript)

```typescript
// Usar em database.ts E em home.component.ts (implementar em ambos ou frontend-only)
const MONTH_NAMES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                        'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function buildMonthLabel(monthStartStr: string): string {
  // monthStartStr format: "2026-03-01"
  const [year, month] = monthStartStr.split('-').map(Number);
  return `${MONTH_NAMES_PT[month - 1]} ${year}`;
}
```

### Lógica de Trend no Frontend

```typescript
// Retorna 'up', 'down', ou 'same'
getComparacaoTrend(current: number, previous: number): 'up' | 'down' | 'same' {
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'same';
}

// Delta absoluto (pode ser negativo)
getComparacaoDelta(current: number, previous: number): number {
  return current - previous;
}

// Verdade somente se TODAS as métricas melhoraram ou ficaram iguais
allMetricsImproved(c: StudentMonthlyStats, p: StudentMonthlyStats): boolean {
  return c.frequencia.pct >= p.frequencia.pct &&
         c.tecnicas >= p.tecnicas &&
         c.comentarios >= p.comentarios;
}
```

### "Evolução" como Métrica

O spec da epic menciona "Evolução: +12%" e "Evolução: ↑ +240%". Não existe um "score de evolução" separado no schema — use `frequencia.pct` como proxy de evolução mensal. O delta de evolução exibido na comparação = `currentMonth.frequencia.pct - previousMonth.frequencia.pct`. Para o gráfico de 6 meses, exibir `frequencia.pct` ao longo do tempo.

### Recomendação com Data da Próxima Aula (AC4)

A `nextClass` já está disponível no `studentProgressDashboard.cards.frequencia.nextClass` que foi carregado no init do componente. **NÃO** replicar a query de próxima aula no endpoint de comparação mensal. No template, referenciar diretamente:
```html
<p *ngIf="studentProgressDashboard?.cards?.frequencia?.nextClass as nc">
  Próxima aula: {{ nc.turmaName }} · {{ nc.sessionDate | date:'dd/MM/yyyy' }}
</p>
```

### Guardrails de Qualidade (Aprendizados das Stories Anteriores)

1. **`??` vs `||` para zero**: Usar `??` ao substituir `null`/`undefined`. Não usar `||` pois `0` é valor válido (0 técnicas ou 0 comentários num mês são legítimos). Ver P1 de 4.5.
2. **`rows.length` vs `rowCount`**: `rowCount` é nullable em `pg`. Usar `catalogRes.rows.length`. Ver P2 de 4.5.
3. **Sem `[innerHTML]`**: Não usar `[innerHTML]` para nenhum conteúdo dinâmico de texto.
4. **SQL parametrizado**: Nunca concatenar `academyId`/`studentId` em strings SQL.
5. **Timezone e date_trunc**: Comparar meses via string `YYYY-MM` normalizada (ex.: `monthStartStr.slice(0,7)`), não via `Date.getTime()`. Ver nota em `debugging.md`.
6. **Reset no fechamento**: `closeStudentProgressDetails()` deve resetar `showComparacaoHistory = false` além das variáveis existentes.

### Localização dos Arquivos (Baseline)

```
backend/src/lib/database.ts         ← nova função getStudentMonthlyComparison()
backend/src/controllers/users.ts    ← novo handler getMyStudentMonthlyComparisonHandler
backend/src/routes/users.ts         ← nova rota GET /alunos/me/comparacao-mensal
frontend/src/types/index.ts         ← novos tipos StudentMonthlyStats, StudentMonthlyComparisonResponse
frontend/src/services/api.service.ts ← novo método getStudentMonthlyComparison()
frontend/src/components/home/home.component.ts   ← lógica de estado + helpers
frontend/src/components/home/home.component.html  ← novo painel + botão no card
frontend/src/components/home/home.component.scss  ← estilos .comparacao-*
frontend/src/components/home/home.component.spec.ts ← testes unitários
```

### Padrão de Teste Establecido (da 4.5)

```typescript
// Padrão para testes de helpers puros:
it('getComparacaoTrend retorna up quando current > previous', () => {
  expect(component.getComparacaoTrend(80, 70)).toBe('up');
  expect(component.getComparacaoTrend(70, 80)).toBe('down');
  expect(component.getComparacaoTrend(70, 70)).toBe('same');
});
```

### Inteligência da Story Anterior (4.5 done)

Da 4.5 (`4-5-card-4-expandido.md — Completion Notes`):
- Implementação seguiu o padrão modal existente sem conflitos
- 6 testes novos adicionados, suite 136/136 passando
- `navigator.share` + `navigator.clipboard` + fallback DOM estabelecidos
- Revisão adversarial identificou 6 patches críticos; aplicar discernimento igual nesta story
- SCSS consistente com `.badge-grid` → usar mesmo nível de especificidade para `.comparacao-*`

### Referencias

- Story fonte: `_bmad-output/Epics/Epic4/Story-4-6.md`
- Epic contexto: `_bmad-output/Epics/Epic4/Epic4.md`
- PRD: `_bmad-output/planning-artifacts/prd.md` (FR33-FR39)
- Arquitetura: `_bmad-output/planning-artifacts/architect.md`
- UX: `_bmad-output/planning-artifacts/ux.md`
- Schema: `_bmad-output/schema.sql` (session_techniques, session_comments, session_attendance)
- Baseline técnico anterior: `_bmad-output/implementation-artifacts/4-5-card-4-expandido.md`
- DB queries existentes (monthly attendance): `backend/src/lib/database.ts` linha ~1484

---

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- create-story 4-6 (artifact synthesis)
- dev-story 4-6 (backend + frontend + testes)

### Completion Notes List

- Story criada com contexto completo para backend + frontend.
- Três queries SQL detalhadas (frequência, técnicas por mês, comentários por mês) fornecidas.
- Guardrails aplicados: `??` vs `||`, `rows.length`, parametrização SQL, timezone-safe date comparison.
- Padrão de modal seguido identicamente ao estabelecido em 4.2–4.5.
- "Evolução" mapeada para `frequencia.pct` (sem score separado no schema).
- `nextClass` reutilizada do dashboard sem nova query no endpoint.
- ✅ Implementado endpoint `GET /api/users/alunos/me/comparacao-mensal` com queries paralelas para frequência, técnicas e comentários dos últimos 6 meses.
- ✅ Frontend atualizado com botão "Ver comparação", painel comparativo completo, estado de primeiro mês, tendência positiva/negativa e histórico expansível de 6 meses.
- ✅ Novos testes unitários de comparação adicionados; suíte Angular passou com 143/143.
- ✅ Backend TypeScript validado sem erros (`npx tsc --noEmit`).
- ✅ Code review aplicado: alerta negativo agora lista todas as métricas que caíram no mês (AC4 completo), com testes adicionais.
- ✅ Ajuste de robustez: geração de meses no backend simplificada para âncora explícita `YYYY-MM-01`.
- ✅ Revalidação final: suíte Angular 145/145 e backend `tsc --noEmit` sem erros.

### File List

- `backend/src/lib/database.ts`
- `backend/src/controllers/users.ts`
- `backend/src/routes/users.ts`
- `frontend/src/types/index.ts`
- `frontend/src/services/api.service.ts`
- `frontend/src/components/home/home.component.ts`
- `frontend/src/components/home/home.component.html`
- `frontend/src/components/home/home.component.scss`
- `frontend/src/components/home/home.component.spec.ts`

### Change Log

- 2026-03-27: Story 4.6 criada com status `ready-for-dev` e contexto completo para implementação.
- 2026-03-27: Story 4.6 implementada (backend + frontend + testes), status atualizado para `review`.
- 2026-03-28: Code review concluído, ajustes de AC4 e robustez aplicados, status atualizado para `done`.
