# Story 3.4: Anotações & Notas de Desempenho

Status: done

## Story

Como Professor,
Quero adicionar notas/observações sobre a aula e anotações individuais por aluno,
Para que eu documente eventos importantes, evoluções ou dificuldades de forma persistente.

## Contexto de Negócio

- Esta story é a **etapa 4** do wizard de registro de treino: Início (3.1) → Frequência (3.2) → Técnicas (3.3) → **Notas (3.4)** → Revisar (3.5).
- O Professor chega aqui vindo de `/training/session/:sessionId/techniques` e avança para `/training/session/:sessionId/review` (Story 3.5).
- Notas são **opcionais** — o Professor pode avançar sem digitar nada.
- Duas camadas de notes:
  1. **Nota geral da sessão** — coluna `notes TEXT` em `training_sessions`.
  2. **Nota por aluno** — tabela `session_comments`, vincula `(session_id, student_id)` com UNIQUE constraint.
- Auto-save invisível (sem botão "Salvar explícito") é um pilar de UX do projeto (ver `ux-design-specification.md` linha 68).
- A lista de alunos de quem o Professor pode anotar vem dos **presentes confirmados** em `session_attendance` (story 3.2).
- Não implementar histórico de notas de alunos nesta story (futuro: Story 3.7).
- Não implementar sincronização offline completa (Story 3.8) — apenas preparar fila local.

## Acceptance Criteria

### AC1 - Renderização Inicial da Tela de Notas
- DADO que a tela de notas é exibida (`/training/session/:sessionId/notes`)
- QUANDO renderiza
- ENTÃO exibe:
  - Pergunta conversacional: "Alguma observação sobre a aula?"
  - Legenda: "(Opcional)"
  - Textarea grande (mínimo 20 linhas visíveis / `min-height: 240px`)
  - Placeholder em cinza: `"Ex: João teve dificuldade em Osoto..."`
  - Counter acima do textarea: `"0 / 400 caracteres"`
  - Botão "Anterior: Técnicas" e botão "Próximo: Revisar" — ambos habilitados (notas opcionais)

### AC2 - Textarea com Auto-Expand e Limite de 400 Caracteres
- DADO que o Professor começa a digitar
- QUANDO escreve notas
- ENTÃO o textarea expande automaticamente (sem scroll interno — `resize: none`, altura calculada via `scrollHeight`)
- E limite máximo de 400 caracteres é imposto (`maxlength` + guard no TS)
- QUANDO atinge 400 caracteres
- ENTÃO counter exibe em vermelho: `"400 / 400 — Limite atingido"`
- E o textarea não aceita mais caracteres além de 400

### AC3 - Auto-Save da Nota Geral (5s debounce invisível)
- DADO que o Professor está digitando na nota da sessão
- QUANDO para de digitar por 5 segundos
- ENTÃO o sistema chama `PUT /api/trainings/:sessionId/notes` com `{ notes: string }` em background
- E nenhum indicador visual de loading bloqueia o Professor (ux: invisível)
- E ícone discreto "💾" pisca uma única vez ao completar o save (feedback suave, não obrigatório)
- E se a chamada falhar (sem internet), a nota é armazenada localmente (localStorage) sem mensagem de erro que bloqueie o fluxo

### AC4 - Counter com Toggle Caracteres / Palavras
- DADO que o Professor está digitando
- QUANDO clica no counter
- ENTÃO o counter alterna entre dois modos:
  - Modo padrão: `"120 / 400 caracteres"`
  - Modo palavras: `"22 palavras"`
- E a preferência de modo é mantida durante a sessão (não persiste entre sessões)

### AC5 - Notas Individuais por Aluno Presente
- DADO que existem alunos com presença confirmada na sessão
- QUANDO a tela renderiza
- ENTÃO exibe seção "Anotações por Aluno" abaixo da nota geral
- E lista apenas os alunos **presentes** (vindos de `session_attendance` com `is_present = true`)
- E cada aluno tem:
  - Avatar/inicial + nome
  - Botão/área clicável: `"[+] Adicionar nota para [Nome]"` (colapsado por padrão)
  - QUANDO clicado, expande section: `"Anotação para [Nome]"` + textarea menor (máx 200 chars)
  - Placeholder: `"[Nome] melhorou em Osoto..."`
  - Auto-save por aluno: mesmo debounce de 5s (chama `PUT /api/trainings/:sessionId/notes/:studentId`)

### AC6 - Carregar Notas Existentes (Re-entrada na Tela)
- DADO que o Professor já salvou notas anteriores nesta sessão
- QUANDO re-entra na tela de notas
- ENTÃO a nota geral é pré-preenchida com o valor salvo
- E notas individuais existentes são mostradas nas sections expandidas dos respectivos alunos
- E o counter reflete a contagem correta do texto carregado

### AC7 - Navegação do Wizard
- DADO que o Professor está na tela de notas
- QUANDO clica "Anterior: Técnicas"
- ENTÃO navega para `/training/session/:sessionId/techniques` (sem perda de dados — auto-save já persistiu)
- QUANDO clica "Próximo: Revisar"
- ENTÃO navega para `/training/session/:sessionId/review` (Story 3.5 — pode ser placeholder)
- E a navegação não exige que notas foram preenchidas (opcionais)

### AC8 - Compatibilidade Offline
- DADO que o dispositivo está sem conexão
- QUANDO o Professor digita notas
- ENTÃO auto-save falha silenciosamente e armazena nota em `localStorage` com chave `training_notes_${sessionId}`
- E notas por aluno são armazenadas em `localStorage` com chave `training_notes_${sessionId}_${studentId}`
- E ao reconectar, sync automático envia as notas pendentes ao servidor em background
- E nenhuma mensagem de erro bloqueante é exibida

### AC9 - Segurança RBAC e Isolamento
- DADO que as APIs de notas são acessadas
- QUANDO a requisição não tem token válido ou papel não é `Professor`
- ENTÃO retornar 401 (sem token) ou 403 (papel incorreto)
- E o Professor só pode modificar notas da sessão se `session.professor_id = req.user.userId`
- E o Professor só pode anotar alunos presentes na sessão (verificar em session_attendance)
- E o `studentId` recebido deve pertencer à mesma `academy_id` do Professor

### AC10 - Posicionamento Visual (UX Conversacional)
- DADO que a tela renderiza
- ENTÃO o layout segue padrão conversacional:
  - Pergunta em texto grande e amigável ("Alguma observação sobre a aula?")
  - Textarea generosa (min 240px height, expande auto)
  - Botões "Anterior" e "Próximo" com contraste claro e labels em português
  - Section de alunos com espaçamento de 24px entre cards
  - Mobile: textarea não fica escondida pelo teclado virtual

## Tasks / Subtasks

> **⚠️ ATENÇÃO:** A rota `/training/session/:sessionId/notes` já existe no routing apotando para `TrainingNotesPlaceholderComponent`.
> As tasks de backend partem do zero (nenhum handler de notes foi implementado).
> O componente real `TrainingNotesComponent` deve **substituir** o placeholder no routing.

### Task 1 — Backend: `lib/trainingNotes.ts` (novo arquivo) (AC3, AC5, AC6, AC9)
- [x] Criar `backend/src/lib/trainingNotes.ts` com as funções:
  - `getSessionNotes(sessionId, professorId, academyId)` → retorna `{ generalNotes: string | null, studentNotes: StudentNote[], presentStudents: PresentStudent[] }`
    - Faz JOIN: `training_sessions` (notas gerais) + `session_comments` + `session_attendance` (is_present=true) + `users` (nome dos alunos)
    - Verifica que `professor_id = professorId` e `academy_id = academyId` ao carregar a sessão
  - `saveGeneralNotes(sessionId, professorId, academyId, notes: string)` → UPDATE `training_sessions SET notes = $1, updated_at = NOW() WHERE session_id = $2 AND professor_id = $3 AND academy_id = $4`
    - Valida `notes.length <= 400`
    - Retorna `{ success: true }`
  - `saveStudentNote(sessionId, studentId, professorId, academyId, content: string)` → UPSERT `session_comments`
    - Verifica que aluno está presente na sessão (`session_attendance.is_present = true`)
    - Valida `content.length <= 200`
    - `INSERT INTO session_comments ... ON CONFLICT (session_id, student_id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW(), deleted_at = NULL`
    - Chama `logAudit()` com evento `SESSION_NOTE_SAVED`

### Task 2 — Backend: `controllers/trainingNotes.ts` (novo arquivo) (AC6, AC9)
- [x] Criar `backend/src/controllers/trainingNotes.ts` com handlers:
  - `getSessionNotesHandler` → GET `/api/trainings/:sessionId/notes`
    - Valida `:sessionId` UUID (regex `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`)
    - Chama `getSessionNotes(sessionId, req.user!.userId, req.user!.academyId)`
    - Retorna `GetSessionNotesResponse`
  - `saveGeneralNotesHandler` → PUT `/api/trainings/:sessionId/notes`
    - Valida `:sessionId` UUID
    - Valida `req.body.notes` (string, máx 400 chars)
    - Chama `saveGeneralNotes(...)`
  - `saveStudentNoteHandler` → PUT `/api/trainings/:sessionId/notes/:studentId`
    - Valida `:sessionId` e `:studentId` UUID
    - Valida `req.body.content` (string, máx 200 chars)
    - Chama `saveStudentNote(...)`
- [x] Usar padrão: `AuthenticatedRequest`, `req.user!.userId`, `req.user!.academyId`, `req.user!.role`
- [x] Erros: `res.status(x).json({ error: 'mensagem pt-BR' })`

### Task 3 — Backend: Registrar Rotas (AC3, AC5, AC6)
- [x] Editar `backend/src/routes/trainings.ts`:
  - Importar handlers do novo controller
  - Adicionar:
    ```ts
    router.get('/:sessionId/notes', authMiddleware, requireRole(['Professor']), getSessionNotesHandler);
    router.put('/:sessionId/notes', authMiddleware, requireRole(['Professor']), saveGeneralNotesHandler);
    router.put('/:sessionId/notes/:studentId', authMiddleware, requireRole(['Professor']), saveStudentNoteHandler);
    ```

### Task 4 — Backend: Testes de Integração (AC3, AC5, AC6, AC9)
- [x] Criar `backend/src/tests/training-notes.test.ts`
  - Usar como referência: `backend/src/tests/training-attendance.test.ts` (padrão de setup/teardown com DB real)
  - Cobrir:
    - GET `/notes` → retorna nota geral existente + lista de alunos presentes
    - PUT `/notes` → salva nota geral, valida max 400 chars
    - PUT `/notes/:studentId` → upsert session_comment, confirma via SELECT
    - Isolamento: Professor B não pode salvar na sessão do Professor A (403)
    - Aluno ausente não pode receber nota via PUT (403 ou 404)
    - Token inválido → 401

### Task 5 — Frontend: Tipos em `frontend/src/types/index.ts` (AC1, AC5, AC6)
- [x] Adicionar interfaces:
  ```ts
  export interface PresentStudent {
    userId: string;
    fullName: string;
    avatarInitials: string; // first letter of first + last name
  }

  export interface StudentNote {
    studentId: string;
    content: string;
    updatedAt: string;
  }

  export interface GetSessionNotesResponse {
    generalNotes: string | null;
    presentStudents: PresentStudent[];
    studentNotes: StudentNote[];
  }

  export interface SaveNotesPayload {
    notes: string;
  }

  export interface SaveStudentNotePayload {
    content: string;
  }

  export interface SaveNotesResponse {
    success: boolean;
  }
  ```

### Task 6 — Frontend: Métodos em `api.service.ts` (AC3, AC5, AC6)
- [x] Adicionar em `frontend/src/services/api.service.ts`:
  ```ts
  getSessionNotes(sessionId: string): Observable<GetSessionNotesResponse> {
    return this.http.get<GetSessionNotesResponse>(
      `${this.apiUrl}/trainings/${sessionId}/notes`,
      { headers: this.getHeaders() }
    );
  }

  saveSessionNotes(sessionId: string, notes: string): Observable<SaveNotesResponse> {
    return this.http.put<SaveNotesResponse>(
      `${this.apiUrl}/trainings/${sessionId}/notes`,
      { notes } as SaveNotesPayload,
      { headers: this.getHeaders() }
    );
  }

  saveStudentNote(sessionId: string, studentId: string, content: string): Observable<SaveNotesResponse> {
    return this.http.put<SaveNotesResponse>(
      `${this.apiUrl}/trainings/${sessionId}/notes/${studentId}`,
      { content } as SaveStudentNotePayload,
      { headers: this.getHeaders() }
    );
  }
  ```

### Task 7 — Frontend: Componente `TrainingNotesComponent` (AC1–AC10)
- [x] Criar os 4 arquivos do componente **em substituição ao placeholder**:
  - `frontend/src/components/training-notes/training-notes.component.ts`
  - `frontend/src/components/training-notes/training-notes.component.html`
  - `frontend/src/components/training-notes/training-notes.component.scss`
  - `frontend/src/components/training-notes/training-notes.component.spec.ts`

**Lógica principal do `.component.ts`:**
- `sessionId` extraído de `this.route.snapshot.paramMap.get('sessionId')`
- Estado: `generalNotes = ''`, `charCount = 0`, `isSavedLocally = false`, `showSaveIcon = false`, `counterMode: 'chars' | 'words' = 'chars'`
- `presentStudents: PresentStudent[]` e `expandedStudentIds = new Set<string>()`
- `studentNoteMap: Record<string, string>` (keyed by studentId)
- `debounceTimers: Record<string, ReturnType<typeof setTimeout>>` (geral + por aluno)
- Auto-save: `onGeneralNotesChange()` → `clearTimeout(debounceTimers['general'])` → `debounceTimers['general'] = setTimeout(() => this.saveGeneralNotes(), 5000)`
- `ngOnDestroy`: cancelar todos os timers, chamar `saveGeneralNotes()` imediatamente (flush antes de navegar)
- Auto-expand textarea: `(input)` → `autoExpand($event.target)`
  ```ts
  autoExpand(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }
  ```
- Offline fallback:
  ```ts
  private isOfflineError(error: any): boolean {
    return !navigator.onLine || error?.status === 0;
  }
  private saveToLocalStorage(key: string, value: string): void {
    localStorage.setItem(key, value);
  }
  ```
- Navegação:
  - `onBackToTechniques()` → `router.navigate(['/training/session', sessionId, 'techniques'])`
  - `onNextToReview()` → `router.navigate(['/training/session', sessionId, 'review'])`

### Task 8 — Frontend: Routing e Module (AC1, AC7)
- [x] Editar `frontend/src/app.routing.module.ts`:
  - Adicionar import: `import { TrainingNotesComponent } from './components/training-notes/training-notes.component';`
  - Substituir: `component: TrainingNotesPlaceholderComponent` → `component: TrainingNotesComponent` na rota `/training/session/:sessionId/notes`
  - Adicionar rota de placeholder para review: `{ path: 'training/session/:sessionId/review', component: TrainingReviewPlaceholderComponent, canActivate: [AuthGuard] }` (criar placeholder simples se não existir)
  - Manter import do `TrainingNotesPlaceholderComponent` apenas se usado em outra rota; caso contrário remover import e declaração
- [x] Editar `frontend/src/app.module.ts`:
  - Adicionar `TrainingNotesComponent` em `declarations`
  - Remover `TrainingNotesPlaceholderComponent` das declarations se não usado em outra rota

### Task 9 — Frontend: Unit Tests do Componente (AC1–AC5)
- [x] Escrever ao menos 5 testes em `training-notes.component.spec.ts`:
  1. Carrega notas existentes ao init e preenche textarea
  2. Counter atualiza corretamente ao digitar
  3. Toggle counter chars ↔ palavras
  4. Auto-save é chamado após 5s debounce
  5. Navegação "Próximo" funciona sem obrigatoriedade de nota preenchida

## Dev Notes

### Estado do Código Existente (LEIA ANTES DE IMPLEMENTAR)

> **CRÍTICO:** Os arquivos de backend para notas **não existem ainda** — criar do zero.
> O placeholder de frontend **existe** em `frontend/src/components/training-notes-placeholder/` e deve ser **substituído** pelo componente real.
> O routing atual aponta o path `/training/session/:sessionId/notes` para `TrainingNotesPlaceholderComponent` — **atualizar** para `TrainingNotesComponent`.

**Arquivos existentes relevantes (apenas leitura/referência):**
```
backend/src/routes/trainings.ts                   ✅ Adicionar rotas de notes
backend/src/tests/training-attendance.test.ts     ✅ Usar como modelo de testes
frontend/src/services/api.service.ts              ✅ Adicionar 3 métodos
frontend/src/types/index.ts                       ✅ Adicionar 6 interfaces
frontend/src/app.routing.module.ts                ✅ Atualizar rota de notes
frontend/src/app.module.ts                        ✅ Trocar declaração
```

**Arquivos a criar (do zero):**
```
backend/src/lib/trainingNotes.ts                  ← CRIAR
backend/src/controllers/trainingNotes.ts          ← CRIAR
backend/src/tests/training-notes.test.ts          ← CRIAR
frontend/src/components/training-notes/
  training-notes.component.ts                     ← CRIAR (substituir placeholder)
  training-notes.component.html                   ← CRIAR
  training-notes.component.scss                   ← CRIAR
  training-notes.component.spec.ts                ← CRIAR
frontend/src/components/training-review-placeholder/ ← CRIAR (se não existir)
```

**Arquivos a remover ou desativar:**
```
frontend/src/components/training-notes-placeholder/ ← pode manter mas remover da routing
```

### Schema Confirmado (sem migrations adicionais necessárias)

As tabelas já existem no schema base (`V3_0__Training.sql`):

```sql
-- Nota geral da sessão (coluna existente)
training_sessions (
  session_id UUID PRIMARY KEY,
  professor_id UUID NOT NULL REFERENCES users,
  academy_id UUID NOT NULL REFERENCES academies,
  notes TEXT,                    -- ← já existe, usar diretamente
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  ...
);

-- Notas por aluno (tabela existente)
session_comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(session_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES users(user_id),
  academy_id UUID NOT NULL REFERENCES academies(academy_id),
  content TEXT NOT NULL,
  sentiment VARCHAR(50),         -- não usar nesta story (futuro)
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT unique_comment_per_session_student UNIQUE (session_id, student_id)
);

-- Presença (fonte da lista de alunos para anotar)
session_attendance (
  session_id UUID NOT NULL,
  student_id UUID NOT NULL,
  is_present BOOLEAN NOT NULL DEFAULT false,
  ...
);
```

> **NÃO CRIAR MIGRATIONS** — todas as tabelas já existem. Nenhuma coluna nova é necessária para esta story.

### Contratos de API

```ts
// GET /api/trainings/:sessionId/notes
// Response: GetSessionNotesResponse
{
  generalNotes: string | null;
  presentStudents: Array<{
    userId: string;
    fullName: string;
    avatarInitials: string; // ex: "AS" para "Ana Silva"
  }>;
  studentNotes: Array<{
    studentId: string;
    content: string;
    updatedAt: string; // ISO8601
  }>;
}

// PUT /api/trainings/:sessionId/notes
// Body: { notes: string }  (string vazia é válida)
// Response: { success: true }

// PUT /api/trainings/:sessionId/notes/:studentId
// Body: { content: string }
// Response: { success: true }
```

### Query SQL de Referência para `getSessionNotes`

```sql
-- Nota geral da sessão + validação de ownership
SELECT ts.notes, ts.professor_id
FROM training_sessions ts
WHERE ts.session_id = $1
  AND ts.professor_id = $2
  AND ts.academy_id = $3
  AND ts.deleted_at IS NULL;

-- Alunos presentes
SELECT u.user_id, u.full_name
FROM session_attendance sa
JOIN users u ON u.user_id = sa.student_id
WHERE sa.session_id = $1
  AND sa.is_present = true
  AND sa.academy_id = $2
  AND u.deleted_at IS NULL
ORDER BY u.full_name ASC;

-- Notas de alunos existentes
SELECT sc.student_id, sc.content, sc.updated_at
FROM session_comments sc
WHERE sc.session_id = $1
  AND sc.deleted_at IS NULL;
```

### Query SQL para UPSERT de `saveStudentNote`

```sql
INSERT INTO session_comments (
  comment_id, session_id, student_id, professor_id, academy_id, content, created_at, updated_at
)
VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
ON CONFLICT (session_id, student_id)
DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW(),
  deleted_at = NULL;
```

### Padrões de Implementação (Projeto Atual)

**Backend:**
- Usar funções exportadas, sem classes OO.
- Usar `AuthenticatedRequest`, `req.user!.userId`, `req.user!.academyId`, `req.user!.role`.
- Erros: `res.status(x).json({ error: 'mensagem pt-BR' })`.
- Reutilizar `authMiddleware`, `requireRole(['Professor'])`.
- Auditoria: `logAudit()` de `backend/src/lib/audit.ts`.
- UUID validation regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`
- Pool de conexões: `import { pool } from '../lib/database'`

**Frontend:**
- Angular module-based (`standalone: false`).
- Rotas em `frontend/src/app.routing.module.ts`.
- Componentes declarados em `frontend/src/app.module.ts`.
- HTTP exclusivamente via `ApiService`.
- Usar `OnDestroy` para limpar timers de debounce (não vazar recursos).
- Para auto-expand textarea: `el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'` no evento `(input)`.
- `localStorage` como fallback offline (chave: `training_notes_${sessionId}` e `training_notes_${sessionId}_${studentId}`).

### Inteligência da Story Anterior (3.3)

Os seguintes padrões foram estabelecidos em Story 3.3 e **devem ser reutilizados nesta story:**

- `isOfflineError(error)` detecta `!navigator.onLine || error.status === 0`.
- `ngOnDestroy` remove event listeners e limpa timers.
- Navegação explícita via `Router.navigate(['/training/session', sessionId, 'PASSO'])`.
- Auto-save invisível sem botão "Salvar" explícito (padrão de UX do projeto).
- Isolamento: `professorId` e `academyId` sempre extraídos de `req.user!` (nunca do body).
- Separação clara: `lib/` para lógica de DB, `controllers/` para handlers HTTP.
- Testes de integração com banco real (não mock) — ver `training-attendance.test.ts`.

### Rota de Placeholder para Story 3.5

A rota `/training/session/:sessionId/review` ainda não existe. Criar placeholder simples:

```ts
// frontend/src/components/training-review-placeholder/
// Mesma estrutura de training-notes-placeholder:
// - Template: "Revisão — em breve (Story 3.5)"
// - Rota: { path: 'training/session/:sessionId/review', component: TrainingReviewPlaceholderComponent }
```

Verificar se já existe antes de criar. Se existir, apenas registrar a rota.

### Referências

- Story 3.2: [Marcar Frequência](./3-2-marcar-frequencia.md) — status: `done` (modelo de padrões)
- Story 3.3: [Adicionar Técnicas](./3-3-adicionar-tecnicas.md) — status: `done` (código confiável — padrões de offline, wizard, debounce)
- Story 3.5: [Revisar & Confirmar](../Epics/Epic3/Story-3-5.md) — próxima story (cria placeholder)
- [Epic 3](../Epics/Epic3/Epic3.md)
- [UX Design Specification](../planning-artifacts/ux-design-specification.md) — TELA 4 Notas (linha ~600)
- [Arquitetura](../planning-artifacts/architect.md) — `TrainingService.addPerformanceNote`, `PUT /api/trainings/:id/notes/:studentId`
- [Database Schema](../DATABASE-SCHEMA.md) — `training_sessions.notes`, `session_comments`
- [Project Context](../project-context.md)

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Backend: `npm test -- src/tests/training-notes.test.ts` → PASS (`7 passed, 7 total`).
- Backend regressão: `npm test -- src/tests/training-techniques.test.ts src/tests/training-attendance.test.ts` → PASS (`15 passed, 15 total`).
- Frontend: `npm test -- --watch=false --include src/components/training-notes/training-notes.component.spec.ts` → PASS (`6 of 6 SUCCESS`).

### Completion Notes List

- Implementadas APIs de notas de sessão e por aluno com validação de ownership (`academyId` + `professorId`), limite de caracteres e UPSERT em `session_comments`.
- Integradas rotas REST de notas em `trainings.ts` com RBAC `Professor`.
- Criado componente real da etapa de notas com auto-save (debounce 5s), fallback offline em `localStorage`, sincronização ao reconectar, contador chars/palavras e auto-expand de textarea.
- Criado placeholder de revisão para manter fluxo do wizard consistente até Story 3.5.
- Revisão preventiva de congelamento de tela: o novo componente usa `finalize` para garantir reset de `isLoading` em sucesso/erro, e adicionada spec para validar que não fica travado após erro de carregamento.

### File List

- backend/src/lib/trainingNotes.ts (novo)
- backend/src/controllers/trainingNotes.ts (novo)
- backend/src/routes/trainings.ts (atualizado)
- backend/src/tests/training-notes.test.ts (novo)
- frontend/src/types/index.ts (atualizado)
- frontend/src/services/api.service.ts (atualizado)
- frontend/src/components/training-notes/training-notes.component.ts (novo)
- frontend/src/components/training-notes/training-notes.component.html (novo)
- frontend/src/components/training-notes/training-notes.component.scss (novo)
- frontend/src/components/training-notes/training-notes.component.spec.ts (novo)
- frontend/src/components/training-review-placeholder/training-review-placeholder.component.ts (novo)
- frontend/src/components/training-review-placeholder/training-review-placeholder.component.html (novo)
- frontend/src/components/training-review-placeholder/training-review-placeholder.component.scss (novo)
- frontend/src/app.routing.module.ts (atualizado)
- frontend/src/app.module.ts (atualizado)
