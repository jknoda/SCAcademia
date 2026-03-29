# Story 4.4: Card 3 Expandido — Timeline de Comentários do Professor
**Status:** done


**Story URL:** [card-3-expandido]

---

## Story

Como um Aluno,
Quero ler todos os comentários que o Professor deixou sobre mim,
Para que eu entenda o que preciso melhorar.

---

## Acceptance Criteria

1. Dado que Aluno clica "[Ver todos comentários]" no Card 3, quando clica, então abre modal "Comentários do Professor" e exibe timeline de comentários mais recentes primeiro.
2. Dado que timeline carrega, quando renderiza, então cada comentário mostra: Data ("19 Mar 2026 - 15:47"), Avatar + Nome do Professor, Texto completo (até 500 chars), e tags de técnicas mencionadas se extraíveis do conteúdo (ex: `#OsotoGari`).
3. Dado que há múltiplos comentários da mesma data, quando renderiza, então agrupa por data (bloco colapsável/expansível) em ordem descendente (mais recentes no topo).
4. Dado que comentário é positivo (detectado por heurística de palavras-chave), quando exibe, então aplica ícone 🟢 e fundo suave verde (`#E8F5E9`).
5. Dado que comentário tem feedback neutro/construtivo, quando exibe, então aplica ícone 🔵 e fundo suave azul (`#E3F2FD`).
6. Dado que há 0 comentários, quando página carrega, então exibe "Nenhum comentário ainda!", "Continua treinando e em breve receberás feedback" e botão "[Agendar Conversa com Professor]".
7. Dado que Aluno busca por termo (ex: "Osoto Gari"), quando digita no campo de busca e pressiona Enter/clica buscar, então filtra a listagem e destaca o termo encontrado em bold/cor nos resultados.
8. Dado que Aluno clica "[Compartilhar]", quando clica em um comentário, então copia para clipboard o texto no template "Prof. João disse: [comentário]" e exibe confirmação.
9. (Fora do escopo MVP) "[Responder]" é Phase 2 — não implementar nesta story.

---

## Tasks / Subtasks

- [x] Definir tipos e contrato para histórico de comentários
  - [x] Adicionar interface `StudentCommentHistoryResponse` em `frontend/src/types/index.ts`
  - [x] Adicionar sentimento inferido (`sentiment: 'positive' | 'neutral'`) ao tipo de item de comentário
  - [x] Expor método `getStudentCommentHistory()` no `ApiService`

- [x] Implementar endpoint backend de histórico de comentários
  - [x] Criar função `getStudentCommentHistory()` em `backend/src/lib/database.ts` com paginação e filtro por keyword (`ILIKE`)
  - [x] Criar handler `getMyStudentCommentHistoryHandler` em `backend/src/controllers/users.ts`
  - [x] Registrar rota `GET /api/users/alunos/me/comentarios` em `backend/src/routes/users.ts`

- [x] Integrar modal de comentários no Home do aluno
  - [x] Adicionar estado de comentários em `home.component.ts` (lista, total, offset, limit, keyword, loading, erro)
  - [x] Implementar `loadStudentCommentHistory(reset: boolean)` para carregar/paginar
  - [x] Disparar carregamento ao abrir `openStudentProgressDetails('comentarios')`
  - [x] Implementar função de sentimento `getCommentSentiment(content)` por heurística de palavras-chave

- [x] Expandir seção de comentários no modal HTML
  - [x] Substituir stub de linha 339 (`home.component.html`) pela implementação completa
  - [x] Renderizar cabeçalho, estado de loading, estado de erro, estado vazio
  - [x] Renderizar timeline agrupada por data com classe de sentimento (`.comment-positive`, `.comment-neutral`)
  - [x] Adicionar campo de busca com highlight de termo e controles de paginação
  - [x] Adicionar botão [Compartilhar] por comentário

- [x] Estilizar seção de comentários
  - [x] Adicionar estilos para `.comment-positive` (fundo #E8F5E9), `.comment-neutral` (fundo #E3F2FD) em `home.component.scss`
  - [x] Estilizar agrupamento por data, tags de técnicas e highlight de busca

- [x] Testes e validação
  - [x] Validar build backend (TypeScript)
  - [x] Validar build frontend (Angular)
  - [x] Adicionar testes unitários no spec do Home para o fluxo de comentários
  - [x] Rodar suite Angular completa após ajustes finais

---

## Dev Notes

### Contexto de implementação
- Story 4.4 expande o Card 3 (Comentários do Professor) da Story 4.1.
- O padrão de modal, estado e ciclo de vida segue o mesmo fluxo consolidado em 4.2 (evolução) e 4.3 (frequência): novo endpoint dedicado + estado isolado no Home + seção condicional no HTML do modal.
- O dashboard (`getStudentProgressDashboard`) já busca `LIMIT 10` e o count de `session_comments` para o card resumido — esse dado **não aumenta nesta story**. A nova função dedicada serve para paginação completa e busca.

### Schema `session_comments`
Colunas disponíveis: `session_comment_id`, `academy_id`, `student_id`, `session_id`, `professor_id`, `content`, `created_at`, `deleted_at`.

> **AVISO**: Não existe coluna `sentiment` nem `techniques` no schema atual. Não adicionar migration nesta story.
> - Sentimento 🟢/🔵 (AC4/AC5): inferir via heurística de palavras-chave positivas no frontend.
> - Tags de técnicas (AC2): extrair `#hashtags` do campo `content` via regex no frontend.

### Endpoint e contrato

**Novo endpoint:**
```
GET /api/users/alunos/me/comentarios
```
Query params opcionais: `keyword` (string), `limit` (int, default 20, max 100), `offset` (int, default 0).

**Resposta:**
```typescript
interface StudentCommentHistoryResponse {
  items: StudentCommentHistoryItem[];
  total: number;
  limit: number;
  offset: number;
}

interface StudentCommentHistoryItem {
  content: string;
  professorName: string;
  sessionDate?: string;   // ISO date string YYYY-MM-DD
  createdAt: string;      // ISO datetime string
}
```

O sentimento (`positive`/`neutral`) e as tags de técnicas são calculados no **frontend** — não são campos do contrato backend.

### Query SQL (database.ts)
```sql
SELECT
  sc.content,
  sc.created_at,
  ts.session_date,
  u.full_name AS professor_name
FROM session_comments sc
INNER JOIN users u
  ON u.user_id = sc.professor_id
LEFT JOIN training_sessions ts
  ON ts.session_id = sc.session_id
 AND ts.academy_id = sc.academy_id
WHERE sc.academy_id = $1
  AND sc.student_id = $2
  AND sc.deleted_at IS NULL
  [AND sc.content ILIKE $N]   -- quando keyword fornecido
ORDER BY sc.created_at DESC
LIMIT $X OFFSET $Y
```

### Heurística de sentimento (frontend)
Palavras-chave positivas (case-insensitive): `parabéns`, `excelente`, `ótimo`, `ótima`, `muito bem`, `progresso`, `evoluiu`, `melhorou`, `parabéns`, `sensacional`, `incrível`, `superou`.
- Qualquer match → `'positive'` (🟢 / `#E8F5E9`)
- Sem match → `'neutral'` (🔵 / `#E3F2FD`)

### Extração de técnicas (frontend)
Aplicar regex `/#(\w+)/g` no `content` para extrair hashtags como tags visuais.

### Highlight de busca (frontend)
Ao exibir o conteúdo, usar pipe Angular ou função de substituição para envolver o termo buscado em `<span class="highlight">termo</span>`.

### Botão [Compartilhar]
MVP: `navigator.clipboard.writeText('Prof. <nome> disse: <conteúdo>')` com fallback para `document.execCommand('copy')`. Exibir toast/mensagem "Copiado!" brevemente.

### Agrupamento por data
Usar uma função `groupCommentsByDate(items)` no componente que retorna `Array<{date: string, comments: StudentCommentHistoryItem[]}>`. Renderizar no HTML com `*ngFor` em dois níveis.

### Arquivos a modificar
- `backend/src/lib/database.ts`
- `backend/src/controllers/users.ts`
- `backend/src/routes/users.ts`
- `frontend/src/types/index.ts`
- `frontend/src/services/api.service.ts`
- `frontend/src/components/home/home.component.ts`
- `frontend/src/components/home/home.component.html`
- `frontend/src/components/home/home.component.scss`
- `frontend/src/components/home/home.component.spec.ts`
- `_bmad-output/implementation-artifacts/4-4-card-3-expandido.md`

### Limitações atuais / Decisões de design
- **AC6 ([Responder])**: Phase 2 — não implementar. Botão pode aparecer como desabilitado com tooltip "Em breve" ou ser completamente omitido.
- **Paginação**: `limit=20, offset`-based, idêntico à Story 4.3. Controles "Anterior / Próxima" no rodapé do modal.
- **Build**: Verificar budget SCSS (aviso não-bloqueante já conhecido da 4.3).

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6

### Completion Notes
- Implementado endpoint backend `GET /api/users/alunos/me/comentarios` com paginação e busca por keyword (`ILIKE`). Nova função `getStudentCommentHistory` em `database.ts` com interface `StudentCommentHistoryResult`.
- Handler `getMyStudentCommentHistoryHandler` adicionado em `controllers/users.ts`. Rota registrada em `routes/users.ts`.
- Tipos `StudentCommentHistoryItem` e `StudentCommentHistoryResponse` adicionados em `types/index.ts`. Método `getStudentCommentHistory()` adicionado ao `ApiService`.
- Estado completo de comentários adicionado ao `home.component.ts` com: `loadStudentCommentHistory()`, `applyCommentSearch()`, `clearCommentSearch()`, `getCommentSentiment()` (heurística de palavras-chave positivas), `getCommentTechniqueTags()` (extração via regex `#hashtag`), `highlightSearchTerm()` (wrap em `<span class="search-highlight">`), `groupCommentsByDate()`, `shareComment()` (clipboard), paginação offset-based.
- Stub do modal substituído por implementação completa no HTML: busca, loading, erro, estado vazio (AC6), timeline agrupada por data com sentimento 🟢/🔵 (AC4/AC5), tags de técnicas (AC2), highlight de busca (AC7), botão Compartilhar (AC8).
- SCSS adicionado: `.comment-positive`, `.comment-neutral`, `.comment-item`, `.comment-header`, `.technique-tag`, `.comment-date-label`, `.search-highlight`, `.action-btn.small`.
- **AC9 ([Responder])**: intencionalmente omitido — Phase 2.
- Suite Angular: **130/130** (8 novos testes adicionados para comentários). Build backend: sem erros TypeScript. Build frontend: sem erros (aviso de budget SCSS não-bloqueante).

### File List
- backend/src/lib/database.ts
- backend/src/controllers/users.ts
- backend/src/routes/users.ts
- frontend/src/types/index.ts
- frontend/src/services/api.service.ts
- frontend/src/components/home/home.component.ts
- frontend/src/components/home/home.component.html
- frontend/src/components/home/home.component.scss
- frontend/src/components/home/home.component.spec.ts
- _bmad-output/implementation-artifacts/4-4-card-3-expandido.md

### Change Log
- 2026-03-27: Criação da story 4.4 — contexto recolhido, blueprint de implementação definido, status `ready-for-dev`.
- 2026-03-27: Implementação completa — backend endpoint + frontend modal + estilos + 8 novos testes. Suite: 130/130. Status → `review`.
- 2026-03-27: Implementação completa — backend endpoint + frontend modal + estilos + 8 novos testes. Suite: 130/130. Status → `review`.
- 2026-03-27: Code review concluído — 4 issues mandatórios corrigidos: SQL LIKE wildcard injection (escape `%_\`), XSS via `[innerHTML]` (HTML-escape antes do highlight), COUNT/JOIN mismatch (adicionado INNER JOIN no COUNT query), empty state conflation (split "sem comentários" de "busca sem resultado"). Suite: 130/130. Status → `done`.
