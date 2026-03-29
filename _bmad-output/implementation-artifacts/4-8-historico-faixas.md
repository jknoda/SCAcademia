# Story 4.8: Histórico de Faixas — Timeline Visual de Progressão

**Status:** done

---

## Story

Como um Aluno,
Quero ver uma timeline visual do meu histórico de faixas conquistadas,
Para que eu acompanhe minha evolução no judô e seja motivado a continuar progredindo.

---

## Acceptance Criteria

**AC1 — Renderização da timeline**
- DADO que Aluno acessa o painel "faixa" no student-progress-modal
- QUANDO os dados carregam com sucesso
- ENTÃO exibe:
  - Heading "Suas Faixas no Judô 🥋" + subheading "Histórico completo de progressão"
  - Seção de estatísticas (AC5)
  - Banner de federação se `isFederated === true` (AC6)
  - Timeline vertical com todos os itens em ordem cronológica CRESCENTE (mais antiga → mais recente)
  - Se lista vazia: mensagem motivacional "Comece seu histórico! Aproveite seu primeiro treino."

**AC2 — Card de cada faixa**
- DADO que cada item de faixa está visível na timeline
- QUANDO renderiza
- ENTÃO mostra:
  - Ícone emoji colorido por tipo de faixa (ver mapeamento em notas técnicas)
  - Nome da faixa (campo `belt` exatamente como no banco)
  - "Conquistada em [DD] de [MMMM] de [YYYY]" (ex: "Conquistada em 15 de março de 2026")
  - "Ficou [X] dias nessa faixa" ou "Ficou [X] meses nessa faixa" (if ≥30 dias, usar meses arredondados)
  - "por [Nome do Professor]" (ou "por [Professor]" se promotedBy ausente)
  - Observações em texto menor/itálico se `notes` não for vazio

**AC3 — Faixa atual destacada**
- DADO que o último item da timeline é a faixa atual
- QUANDO renderiza
- ENTÃO:
  - Item tem fundo ligeiramente diferenciado (ex: highlight suave)
  - Label "Sua faixa atual" visível no card

**AC4 — Expand modal de faixa**
- DADO que Aluno clica em um item da timeline
- QUANDO clica
- ENTÃO abre painel/expansão inline (não modal separado) mostrando:
  - Emoji/ícone da faixa em tamanho maior
  - Nome completo
  - Data exata de conquista (incluindo hora se disponível)
  - Nome do promotor
  - Notas completas (se existirem)
  - Botão "Fechar" para colapsar
- QUANDO clica no mesmo item novamente ou em "Fechar"
- ENTÃO colapsa o painel

**AC5 — Seção Estatísticas**
- DADO que a timeline carregou com ao menos 1 faixa
- QUANDO exibe
- ENTÃO seção "Suas Estatísticas" mostra no topo:
  - "[N] faixas conquistadas"
  - "Praticando há [X] anos e [Y] meses" (calculado de `dataEntrada` até hoje)
  - "Faixa com maior duração: [Nome] — [X] dias"
  - "Última conquista há [X] dias" (de `lastBeltDate` até hoje)

**AC6 — Banner de federação**
- DADO que `isFederated === true` nos dados
- QUANDO timeline carrega
- ENTÃO exibe banner discreto abaixo do heading:
  - "🏅 Você está federado! Nº de registro: [federation_registration]"
  - "Desde: [DD/MM/YYYY de federation_date]"

**AC7 — Layout responsivo**
- DADO que Aluno está em mobile (viewport < 768px)
- QUANDO visualiza timeline
- ENTÃO: itens empilhados, timeline conectora à esquerda, full-width, padding 16px
- DADO que Aluno está em desktop (viewport ≥ 1200px)
- QUANDO visualiza timeline
- ENTÃO: itens alternados esquerda/direita, linha temporal central, padding 32px

**AC8 — Skeleton loaders e retry**
- DADO que dados estão sendo carregados
- QUANDO `isLoadingBeltHistory === true`
- ENTÃO exibe skeleton animado de 3 cards placeholder
- DADO que a chamada API falhou
- QUANDO `beltHistoryErrorMessage` é definido
- ENTÃO exibe mensagem de erro + botão "[Tentar Novamente]" que chama `loadBeltHistory()`

**AC9 — Cache IndexedDB**
- DADO que Aluno abre o painel "faixa" sem conectividade
- QUANDO os dados cacheados existem em IndexedDB (chave: `belt-history:{studentId}`)
- ENTÃO exibe dados cacheados com ícone "⏱ Histórico de [data última sync]"
- DADO que conexão volta a estar disponível
- QUANDO detectado online
- ENTÃO refetch automático e atualização da timeline

---

## Tasks / Subtasks

- [x] **Backend: função dedicada de histórico de faixas** (AC1–AC6)
  - [x] Adicionar interface `StudentBeltHistoryEntry` em `backend/src/lib/database.ts`:
    - `beltHistoryId: number`, `belt: string`, `receivedDate: Date`, `promotedBy?: string`, `notes?: string`, `durationDays: number`, `isCurrentBelt: boolean`
  - [x] Adicionar interface `StudentBeltHistoryResult` em `backend/src/lib/database.ts`:
    - `entries: StudentBeltHistoryEntry[]`
    - `stats: { totalBelts: number, longestBeltName: string, longestBeltDays: number, lastBeltDate?: Date, dataEntrada?: Date }`
    - `judoProfile: { currentBelt?: string, isFederated: boolean, federationRegistration?: string, federationDate?: Date }`
  - [x] Implementar `getStudentBeltHistory(academyId: string, studentId: string): Promise<StudentBeltHistoryResult>` em `database.ts`:
    - Query 1: `judo_belt_history` JOIN `users` (promoter) + `judo_profile` + `users` (student `data_entrada`) ORDER BY `received_date ASC`
    - Calcular `durationDays` via LEAD window function ou no código (como já feito no dashboard)
    - Derivar `isCurrentBelt` para o último item da lista
    - Calcular stats (totalBelts, longestBelt, lastBeltDate, dataEntrada)
    - Usar somente SQL parametrizado

- [x] **Backend: handler e rota** (AC8)
  - [x] Criar handler `getMyStudentBeltHistoryHandler` em `backend/src/controllers/users.ts`:
    - Extrai `academiaid` do header + `userId` do JWT
    - Busca `studentId` via `getStudentIdByUserId`
    - Chama `getStudentBeltHistory(academyId, studentId)`
    - Retorna 200 com payload JSON; 500 em falha
  - [x] Registrar rota `GET /alunos/me/historico-faixas` em `backend/src/routes/users.ts`:
    - `router.get('/alunos/me/historico-faixas', authMiddleware, requireRole(['Aluno']), getMyStudentBeltHistoryHandler)`

- [x] **Frontend: tipos** (AC1–AC9)
  - [x] Adicionar em `frontend/src/types/index.ts`:
    - `StudentBeltHistoryEntry`: `{ beltHistoryId: number; belt: string; receivedDate: string; promotedBy?: string; notes?: string; durationDays: number; isCurrentBelt: boolean; }`
    - `StudentBeltHistoryStats`: `{ totalBelts: number; longestBeltName: string; longestBeltDays: number; lastBeltDate?: string; dataEntrada?: string; }`
    - `StudentBeltHistoryJudoProfile`: `{ currentBelt?: string; isFederated: boolean; federationRegistration?: string; federationDate?: string; }`
    - `StudentBeltHistoryResponse`: `{ entries: StudentBeltHistoryEntry[]; stats: StudentBeltHistoryStats; judoProfile: StudentBeltHistoryJudoProfile; }`

- [x] **Frontend: API service** (AC8)
  - [x] Adicionar método `getStudentBeltHistory()` em `frontend/src/services/api.service.ts`:
    - `GET ${apiUrl}/users/alunos/me/historico-faixas`
    - Retorna `Observable<StudentBeltHistoryResponse>`

- [x] **Frontend: estado no HomeComponent** (AC1–AC9)
  - [x] Adicionar propriedades em `home.component.ts`:
    - `beltHistoryData: StudentBeltHistoryResponse | null = null`
    - `isLoadingBeltHistory = false`
    - `beltHistoryErrorMessage = ''`
    - `expandedBeltId: number | null = null` (para AC4)
    - `beltHistoryCacheTimestamp: string | null = null`
  - [x] Implementar `loadBeltHistory()`:
    - Seta `isLoadingBeltHistory = true`, limpa erro
    - Tenta carregar de IndexedDB (cache) se offline
    - Chama `apiService.getStudentBeltHistory()`
    - Persiste resposta em IndexedDB com key `belt-history:{studentId}` e timestamp
    - Em erro: tenta fallback IndexedDB; se nenhum, `beltHistoryErrorMessage`
  - [x] Chamar `loadBeltHistory()` dentro do bloco `openStudentProgressDetails('faixa')` se `!beltHistoryData`
  - [x] Implementar `toggleBeltExpand(id: number)`: toggle `expandedBeltId`
  - [x] Implementar `getBeltEmoji(belt: string): string` (mapeamento de faixa → emoji)
  - [x] Implementar `getBeltColor(belt: string): string` (retorna hex color da paleta)
  - [x] Implementar `formatBeltDurationFull(days: number): string`:
    - `days < 30` → "X dias"
    - `days >= 30` → "X meses"
  - [x] Implementar `formatPracticingTime(dataEntrada?: string): string`:
    - Diferença de dataEntrada até hoje em anos e meses
  - [x] Resetar `expandedBeltId` e `beltHistoryData` ao fechar o painel (`closeStudentProgressDetails`)

- [x] **Frontend: template HTML** (AC1–AC9)
  - [x] Substituir o bloco `<div *ngIf="selectedStudentProgressDetail === 'faixa'">` atual pelo novo template:
    - Heading "Suas Faixas no Judô 🥋" + subheading
    - Skeleton loader `*ngIf="isLoadingBeltHistory"` (3 divs animados)
    - Mensagem de erro + botão retry `*ngIf="beltHistoryErrorMessage"`
    - Badge de cache offline `*ngIf="beltHistoryCacheTimestamp && !beltHistoryData"`
    - Banner de federação `*ngIf="beltHistoryData?.judoProfile?.isFederated"`
    - Seção estatísticas `*ngIf="beltHistoryData?.stats?.totalBelts > 0"`
    - Lista vazia motivacional `*ngIf="beltHistoryData?.entries?.length === 0"`
    - Timeline `*ngFor="let item of beltHistoryData?.entries"`:
      - Classe CSS `current-belt` se `item.isCurrentBelt`
      - Emoji via `getBeltEmoji(item.belt)` + nome + data + duração + promotor + notas
      - Label "Sua faixa atual" se `item.isCurrentBelt`
      - Seção expand `*ngIf="expandedBeltId === item.beltHistoryId"`
      - `(click)="toggleBeltExpand(item.beltHistoryId)"`

- [x] **Frontend: estilos CSS adicionais** (AC7)
  - [x] Adicionar em `home.component.css` (ou inline styles):
    - `.belt-timeline` com linha conectora à esquerda (border-left: 2px solid)
    - `.belt-card` com padding 16px e cursor pointer
    - `.belt-card.current-belt` com background highlight (ex: rgba var ou classe)
    - `.belt-badge-current` para label "Sua faixa atual"
    - `.belt-stats-grid` para seção de estatísticas (2 colunas em mobile, 4 em desktop)
    - `.federation-banner` discreto e destacado no topo
    - Skeleton loader animation (`@keyframes shimmer` ou classe existente reutilizada)

- [x] **Testes e validação**
  - [x] Backend: `npx tsc --noEmit`
  - [x] Frontend: novos testes unitários em `home.component.spec.ts`:
    - [x] `getBeltEmoji` retorna emoji correto para cada faixa principal
    - [x] `formatBeltDurationFull` retorna "X dias" para < 30, "X meses" para ≥ 30
    - [x] `formatPracticingTime` retorna string formated com anos/meses
    - [x] `loadBeltHistory` seta `isLoadingBeltHistory` e chama API
    - [x] `toggleBeltExpand` alterna `expandedBeltId` correctly
    - [x] Template: exibe banner federação quando `isFederated = true`
    - [x] Template: exibe "Sua faixa atual" no último item quando `isCurrentBelt = true`
    - [x] Template: exibe skeleton quando `isLoadingBeltHistory = true`
    - [x] Template: exibe erro + retry quando `beltHistoryErrorMessage` definido
  - [x] Frontend: `npx ng test --watch=false --browsers=ChromeHeadless`

---

## Notas Técnicas

### Mapeamento Emoji e Cor por Faixa:

```typescript
const BELT_EMOJI_MAP: Record<string, string> = {
  'branca': '⚪',
  'branca_ponta_bordô': '⚪🟣',
  'bordô': '🟣',
  'branca_ponta_cinza': '⚪🩶',
  'cinza': '🩶',
  'cinza_ponta_azul': '🩶🔵',
  'azul': '🔵',
  'azul_ponta_amarela': '🔵🟡',
  'amarela': '🟡',
  'amarela_ponta_laranja': '🟡🟠',
  'laranja': '🟠',
  'verde': '🟢',
  'roxa': '🟣',
  'marrom': '🟤',
  'preta': '⚫',
  'coral': '🔴',
  'vermelha': '🔴',
};
// Fallback: '🥋'
```

```typescript
const BELT_COLOR_MAP: Record<string, string> = {
  'branca': '#FFFFFF',
  'branca_ponta_bordô': '#8B1538',
  'bordô': '#A41E44',
  'branca_ponta_cinza': '#808080',
  'cinza': '#A9A9A9',
  'cinza_ponta_azul': '#4169E1',
  'azul': '#0000FF',
  'azul_ponta_amarela': '#FFD700',
  'amarela': '#FFFF00',
  'amarela_ponta_laranja': '#FF8C00',
  'laranja': '#FFA500',
  'verde': '#00AA00',
  'roxa': '#800080',
  'marrom': '#8B4513',
  'preta': '#000000',
  'coral': '#FF7F50',
  'vermelha': '#FF0000',
};
// Fallback: '#888888'
```

### SQL Principal (`getStudentBeltHistory`):

```sql
SELECT
  jbh.belt_history_id,
  jbh.belt,
  jbh.received_date,
  jbh.notes,
  u_prof.full_name AS promoted_by_name,
  jp.current_belt,
  jp.belt_date AS current_belt_date,
  jp.is_federated,
  jp.federation_registration,
  jp.federation_date,
  u_student.data_entrada
FROM judo_belt_history jbh
LEFT JOIN users u_prof
  ON u_prof.user_id = jbh.promoted_by_user_id
 AND u_prof.academy_id = jbh.academy_id
INNER JOIN judo_profile jp
  ON jp.student_id = jbh.student_id
 AND jp.academy_id = jbh.academy_id
INNER JOIN users u_student
  ON u_student.user_id = jbh.student_id
 AND u_student.academy_id = jbh.academy_id
WHERE jbh.student_id = $1
  AND jbh.academy_id = $2
ORDER BY jbh.received_date ASC;
```

### Reutilização de Dados Existentes:

- O dashboard (`getStudentProgressDashboard`) já retorna `beltHistory` básico. A Story 4.8 **não substitui** esse dado — cria endpoint dedicado com campos adicionais (`beltHistoryId`, `isCurrentBelt`, `dataEntrada`, `isFederated`, `federationRegistration`, `federationDate`).
- A seção `selectedStudentProgressDetail === 'faixa'` no template HTML existente pode ser **substituída** pelo novo template mais rico — os dados do dashboard (`studentProgressDashboard.cards.faixaConquistas.beltHistory`) não são mais necessários para este painel.
- O padrão de `loadBeltHistory()` on-demand ao abrir o painel segue o mesmo padrão de `loadStudentNotifications()` da Story 4.7.

### Cache IndexedDB:

```typescript
// Chave de cache
const CACHE_KEY = `belt-history:${this.studentIdForProgress}`;

// Estrutura salva
interface BeltHistoryCache {
  data: StudentBeltHistoryResponse;
  timestamp: string; // ISO datetime
}
```

- TTL: 24 horas (verificar `timestamp` ao carregar do cache)
- Se cache expirado, buscar da API de qualquer forma
- Se offline + cache disponível: exibir com indicador "⏱ Histórico de [data]"

### Edge Cases:

1. **Sem faixas no histórico**: Placeholder motivacional "Comece seu histórico! Aproveite seu primeiro treino."
2. **Professor deletado / `promotedBy` ausente**: Exibir "por [Professor]"
3. **`dataEntrada` ausente**: Omitir campo "Praticando há..." das stats
4. **Notas extensas**: Truncar em 150 caracteres no card compacto; mostrar completo no expand
5. **Um único item**: `durationDays` calculado até hoje (item atual); `isCurrentBelt = true`
6. **`federationDate` nula com `isFederated = true`**: Exibir banner sem a linha "Desde:"

### Integração com Story 4.1:

- O card 4 da Story 4.1 ("Faixas & Conquistas") tem botão "[Ver histórico de faixas]" que aciona `openStudentProgressDetails('faixa')`
- Story 4.8 enriquece o painel que este botão abre — sem mudança na navegação
- O painel pode ser fechado pelo botão X existente na `student-progress-modal`

### Padrão IndexedDB:

Usar `localStorage` como fallback simples para MVP (IndexedDB tem setup mais complexo). A chave de cache usa `localStorage.getItem(CACHE_KEY)` / `localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp }))`. Documentar como "cache simples" — IndexedDB pode ser implementado em story dedicada de Epic 6 (Offline-First).

---

## Referências FR

- **FR37:** Perfil completo do aluno com histórico de progressão
- **FR39:** Histórico de Progressão de Aluno
- **FR35:** Badges & Milestones (faixa de judô como milestone principal)

---

## Dev Agent Record

**Agent:** GitHub Copilot (GPT-5.4)
**Date:** 2026-03-28
**Status:** Completed — code review approved

### Change Log

| # | File | Change |
|---|------|--------|
| 1 | `backend/src/lib/database.ts` | Added interfaces `StudentBeltHistoryEntry`, `StudentBeltHistoryResult`; added `getStudentBeltHistory` function |
| 2 | `backend/src/controllers/users.ts` | Added `getMyStudentBeltHistoryHandler` |
| 3 | `backend/src/routes/users.ts` | Registered `GET /alunos/me/historico-faixas` with authMiddleware + requireRole |
| 4 | `frontend/src/types/index.ts` | Added `StudentBeltHistoryEntry`, `StudentBeltHistoryResponse` interfaces |
| 5 | `frontend/src/services/api.service.ts` | Added `getStudentBeltHistory()` Observable method |
| 6 | `frontend/src/components/home/home.component.ts` | Added 5 state properties and 8 helper methods (load, toggle, emoji, duration, practicing time, days ago, format date) |
| 7 | `frontend/src/components/home/home.component.html` | Replaced minimal faixa block with full belt timeline template (federation banner, stats grid, skeleton, error retry, timeline with expand) |
| 8 | `frontend/src/components/home/home.component.scss` | Appended Story 4-8 belt timeline styles |
| 9 | `frontend/src/components/home/home.component.spec.ts` | Added spy, mock data, and 10 new test cases for Story 4-8 |
| 10 | `frontend/src/components/home/home.component.html` / `home.component.scss` | Review fixes: restored dashboard CTA for belt history and implemented alternating desktop timeline layout |

### Test Results

- Backend: `npx tsc --noEmit` — clean (0 errors)
- Frontend: **161/161 tests SUCCESS**

### Files Modified

- `backend/src/lib/database.ts`
- `backend/src/controllers/users.ts`
- `backend/src/routes/users.ts`
- `frontend/src/types/index.ts`
- `frontend/src/services/api.service.ts`
- `frontend/src/components/home/home.component.ts`
- `frontend/src/components/home/home.component.html`
- `frontend/src/components/home/home.component.scss`
- `frontend/src/components/home/home.component.spec.ts`

### Review Outcome

- Code review concluído sem blockers remanescentes.
- Ajustes aplicados antes do fechamento:
  - CTA "Ver histórico de faixas" restaurado no card "Faixa e Conquistas"
  - Layout desktop da timeline ajustado para alternância esquerda/direita com linha central
  - Estilos duplicados da timeline removidos para evitar deriva visual
