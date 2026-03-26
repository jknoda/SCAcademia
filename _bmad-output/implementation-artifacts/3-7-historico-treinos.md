# Story 3.7: Histórico de Treinos — Listar, Editar & Deletar

Status: done

## Story

Como um Professor,
Quero ver meus treinos anteriores e editar se necessário,
Para que eu corrija dados ou visualize o histórico.

## Contexto de Negócio

- Esta story é a etapa 7 do Epic 3 (Professor Love), focado em facilitação pós-registro
- Permite que professores visualizem, editem e deletem registros anteriores de treinos
- Funciona como ferramenta de auditoria pessoal e correção de dados
- Implementa soft-delete para conformidade com logs de auditoria (para compliance)
- Suporta filtro por data, turma e search em notas para achar registros rapidamente
- Prioridade: Médio (será executado após Story 3.6 concluída e aprovada)

## Acceptance Criteria

### AC1 - ListPage com paginação e ordem
- DADO que Professor acessa "Minhas Aulas"  
- QUANDO página carrega
- ENTÃO exibe lista de todos os treinos (paginados, 20 por página)
- E ordem: mais recentes primeiro (session_date DESC, session_time DESC)
- E totalizador "18 treinos registrados"

### AC2 - Cada linha da lista mostra resumo claro
- DADO que lista é exibida
- QUANDO renderiza
- ENTÃO cada treino mostra:
  - Data + Hora: "19 Mar 2026 - 15:00" (formatado pt-BR)
  - Turma: "Judó Iniciante"
  - Alunos: "18/20 presentes" (presentes/total)
  - Técnicas: "Osoto Gari, Seoi Nage" (preview, max 2)
  - Ações: "[Visualizar] [Editar] [Deletar]"

### AC3 - Visualizar detalhes completos
- DADO que Professor clica "[Visualizar]"
- QUANDO modal ou drawer abre
- ENTÃO exibe resumo completo:
  - Data, hora, duração
  - Turma + lista completa de alunos presentes/ausentes
  - Todas as técnicas trabalhadas
  - Notas do professor integrais
  - Data de criação + última edição
  - Status: "Confirmado em 19/Mar 15:47"

### AC4 - Editar treino anterior
- DADO que Professor clica "[Editar]"
- QUANDO formulário abre
- ENTÃO exibe forma editável com:
  - Frequência: checkboxes ajustáveis (alunos presentes/ausentes/justificado)
  - Técnicas: seleção ajustável (com checkboxes ou select múltiplo)
  - Notas: textarea ajustável com auto-save (500ms debounce)
  - Botão "Salvar Mudanças" (só habilitado se houve mudança)
  - Botão "Cancelar" (descarta edições)

### AC5 - Audit trail para edições
- DADO que Professor faz mudanças e clica "Salvar"
- QUANDO sistema processa save
- ENTÃO registra no audit_logs:
  - `table_name` = "training_sessions"
  - `action` = "update"
  - `entity_id` = session_id
  - `old_values` = JSON das mudanças (antes)
  - `new_values` = JSON das mudanças (depois)
  - `timestamp` = agora
  - `user_id` = logged-in professor
  - Exibe toast de sucesso: "Treino atualizado ✓"

### AC6 - Soft-delete com confirmação
- DADO que Professor clica "[Deletar]"
- QUANDO modal é exibido
- ENTÃO mostra:
  - Texto: "Tem certeza? Essa ação não pode ser desfeita"
  - Checkbox: "Entendo que isso deletará o registro" (unchecked por default)
  - Botão "Deletar Permanentemente" (desabilitado até checkbox marcado)
  - Botão "Cancelar"

### AC7 - Soft-delete completa
- DADO que checkbox está marcado
- QUANDO Professor clica "Deletar Permanentemente"
- ENTÃO:
  - `training_sessions.deleted_at` = CURRENT_TIMESTAMP (soft delete)
  - Registra no audit_logs: `action` = "delete", `entity_id` = session_id
  - Treino desaparece da lista (filtered com deleted_at IS NULL)
  - Toast de sucesso: "Treino deletado" + opção "Desfazer" (undo com prazo 10s)
  - Manager não deve dar hard delete — apenas soft delete

### AC8 - Undo de delete (10 segundos)
- DADO que treino foi deletado
- QUANDO toast está visível (< 10s)
- E Professor clica "Desfazer"
- ENTÃO:
  - `training_sessions.deleted_at` → NULL (restore)
  - Registra no audit_logs: `action` = "restore"
  - Treino reaparece na lista
  - Toast de sucesso: "Treino restaurado ✓"

### AC9 - Filtros de busca
- DADO que Professor quer filtrar treinos
- QUANDO acessa seção de filtros (no topo da lista)
- ENTÃO consegue filtrar por:
  - **Data range**: input de/até (date picker ou ISO string)
  - **Turma específica**: dropdown (lista todas as turmas ativas do professor)
  - **Palavra-chave em notas**: input search (case-insensitive)
  - Botão "Limpar filtros" para resetar

### AC10 - Busca deve ser rápida e otimizada
- DADO que Professor aplica filtro "Turma = Judó Avançado"
- QUANDO clica "Filtrar" ou digita busca
- ENTÃO:
  - Exibe resultados < 200ms (database indexed)
  - Mostra "5 treinos encontrados"
  - Se nenhum resultado: "Nenhum treino encontrado com esses filtros"

### AC11 - Comportamento offline (suporte a sync)
- DADO que Professor está offline
- QUANDO tenta buscar ou editar treino
- ENTÃO:
  - Listagem funciona (data em cache ou IndexedDB)
  - Edições são enfileiradas (sync_queue)
  - UI mostra indicador: "⚠️ Mudanças serão sincronizadas quando conectada"
  - Ao reconectar, sync automático acontece

## Tasks / Subtasks

### TASK 1 - Backend: Query builder para listar treinos com filtros
- [ ] Criar função em `backend/src/lib/trainingHistory.ts`:
  - `getTrainingsForProfessor(professorId, academyId, limit, offset, filters)`
  - Parâmetros: `{ dateFrom?, dateTo?, turmaId?, noteKeyword? }`
  - Return: `{ trainings: [...], total: number }`
- [ ] Validações:
  - Filtro por professor (apenas seus treinos)
  - Filtro por academia (RBAC)
  - Exclude soft-deleted (deleted_at IS NULL)
  - Incluir turma.name, técnicas (ARRAY_AGG), attendance count
- [ ] Performance: SQL indexes já existem (idx_training_sessions_professor, etc.)
- [ ] Retornar JSON com timestamp em ISO 8601 + locale formatting opcionalmente

### TASK 2 - Backend: Endpoint GET /api/trainings/history
- [ ] Criar rota em `backend/src/routes/trainings.ts` (ou novo arquivo):
  - `GET /api/trainings/history?limit=20&offset=0&dateFrom=...&dateTo=...&turmaId=...&keyword=...`
  - Middleware: `authMiddleware` + `requireRole(['Professor'])`
  - Handler: chama `getTrainingsForProfessor(...)`
  - Response: `{ success: true, data: { trainings, total, page, pageSize } }`
  - Error 400: invalid params → `{ error: "Invalid filter params" }`
  - Error 401: not authenticated
  - Error 403: not professor

### TASK 3 - Backend: Endpoint GET /api/trainings/:sessionId (details)
- [ ] Criar rota para buscar treino completo:
  - `GET /api/trainings/:sessionId`
  - Validar professorId matches ou admin override
  - Retornar: session + attendance (lista alunos com status) + techniques (todas) + comments
  - Soft-delete check: retornar 404 se deleted_at IS NOT NULL

### TASK 4 - Backend: Endpoint PUT /api/trainings/:sessionId (edit)
- [ ] Criar rota para editar treino:
  - `PUT /api/trainings/:sessionId`
  - Body: `{ attendance: [...], techniques: [...], notes: ? }`
  - Validar professorId owns session
  - Transação: atualizar training_sessions, session_attendance, session_techniques
  - Registrar no audit_logs ANTES de atualizar (old_values capture)
  - Após update, registrar audit_logs DEPOIS (new_values)
  - Response: `{ success: true, data: updatedTraining }`

### TASK 5 - Backend: Endpoint DELETE /api/trainings/:sessionId (soft delete)
- [ ] Criar rota para soft-delete:
  - `DELETE /api/trainings/:sessionId`
  - Body (optional): `{ reason?: string }` (optional delete reason)
  - Validar professorId owns session ou admin
  - Set `training_sessions.deleted_at = CURRENT_TIMESTAMP`
  - Registrar no audit_logs: `action = "delete"`, `entity_id = sessionId`
  - Response: `{ success: true, message: "Training deleted", data: { undo_deadline: timestamp } }`

### TASK 6 - Backend: Endpoint PATCH /api/trainings/:sessionId/restore (undo delete)
- [ ] Criar rota para restaurar treino (undo):
  - `PATCH /api/trainings/:sessionId/restore`
  - Validar professorId owns deleted session
  - Set `training_sessions.deleted_at = NULL`
  - Registrar no audit_logs: `action = "restore"`
  - Response: `{ success: true, data: restoredTraining }`

### TASK 7 - Frontend: Service method para histórico
- [ ] Adicionar em `frontend/src/services/api.service.ts`:
  ```typescript
  getTrainingHistory(filters: TrainingHistoryFilters): Observable<TrainingHistoryResponse>;
  getTrainingDetails(sessionId: string): Observable<TrainingSession>;
  updateTraining(sessionId: string, payload: TrainingUpdatePayload): Observable<TrainingSession>;
  deleteTraining(sessionId: string): Observable<DeleteResponse>;
  restoreTraining(sessionId: string): Observable<TrainingSession>;
  ```

### TASK 8 - Frontend: Types para histórico
- [ ] Adicionar em `frontend/src/types/index.ts`:
  ```typescript
  interface TrainingHistoryFilters {
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
    turmaId?: string;
    keyword?: string;
  }
  
  interface TrainingListItem {
    sessionId: string;
    date: string;
    time: string;
    turmaName: string;
    attendanceCount: { present: number; total: number };
    techniques: string[]; // preview, max 2
  }
  
  interface TrainingDetails extends TrainingListItem {
    notes: string;
    attendance: AttendanceRecord[];
    techniques: TechniqueRecord[];
    createdAt: string;
    updatedAt: string;
  }
  
  interface TrainingUpdatePayload {
    attendance: AttendanceRecord[];
    techniques: string[]; // techniqueIds
    notes?: string;
  }
  ```

### TASK 9 - Frontend: Component training-history-list
- [ ] Criar `frontend/src/components/training-history/training-history-list.component.ts`
  - Initialize: carregar primeira página (limit=20, offset=0)
  - Renderizar table/list com colunas: Data, Turma, Alunos, Técnicas, Ações
  - Pagination: botões Next/Previous, mostra "Page 1 of 5"
  - Ações: Visualizar (modal), Editar (modal), Deletar (confirmar)
  - Filtros: Data range, turma dropdown, keyword search
  - Carregar turmas do professor para dropdown

### TASK 10 - Frontend: Component training-history-detail (modal)
- [ ] Criar modal para visualização:
  - Ler-apenas (read-only display)
  - Mostra data, hora, duração, turma
  - Lista completa de alunos (presentes em verde, ausentes em cinza, justificado em amarelo)
  - Lista de técnicas com ordem
  - Notas integrais
  - Timestamps (criado em, última edição em)
  - Botão "Fechar"

### TASK 11 - Frontend: Component training-history-edit (modal)
- [ ] Criar modal para edição:
  - Checkboxes para frequência (alunos presentes/ausentes/justificado)
  - Select múltiplo ou checkboxes para técnicas
  - Textarea para notas com auto-save (500ms debounce)
  - Botão "Salvar Mudanças" (desabilitado se sem mudanças)
  - Botão "Cancelar"
  - LoadingSpinner durante save
  - Toast on success/error

### TASK 12 - Frontend: Modal delete com confirmação
- [ ] Criar modal de delete:
  - Título: "Deletar Treino"
  - Texto: "Tem certeza? Essa ação não pode ser desfeita"
  - Checkbox: "Entendo que isso deletará o registro"
  - Botão "Deletar Permanentemente" (disabled until checkbox)
  - Botão "Cancelar"
  - Chamar DELETE API + remover item da lista

### TASK 13 - Frontend: Toast com undo de delete
- [ ] Após delete bem-sucedido:
  - Mostra toast: "Treino deletado ✓ [Desfazer]"
  - Countdown: 10 segundos ou dismissible
  - Click "Desfazer" → chama PATCH /restore
  - Re-adiciona treino à lista

### TASK 14 - Frontend: Filtros e busca live
- [ ] Implementar filtros:
  - Date range picker (de/até)
  - Turma dropdown (populated from server or cache)
  - Keyword search (text input, debounced 500ms)
  - Botão "Filtrar" → recarrega list com params
  - Botão "Limpar" → reset filters + reload
  - URL state preservation (query params)

### TASK 15 - Frontend: Paginação
- [ ] Controles de paginação:
  - Mostra "18 treinos. Página 1 de 2"
  - Botão "← Anterior" (disabled on page 1)
  - Botão "Próximo →" (disabled on last page)
  - Ou select dropdown de páginas
  - Ao mudar página, scroll to top of list

### TASK 16 - Frontend: Offline support (IndexedDB cache)
- [ ] Implementar offline behavior:
  - Cache list response in IndexedDB
  - On reconnect, sync queued changes
  - Show indicator: "⚠️ Mudanças serão sincronizadas"
  - Edições locais mostram em UI mesmo offline

### TASK 17 - Frontend: Testes unitários para components
- [ ] `training-history-list.component.spec.ts`:
  - Mock API service
  - Test: renderiza list on init
  - Test: pagination works
  - Test: filters trigger API calls
  - Test: delete action triggers modal
  - Test: undo restores item (6-8 tests expected)
  
- [ ] `training-history-detail.component.spec.ts`:
  - Test: modal renders with data (2-3 tests)
  
- [ ] `training-history-edit.component.spec.ts`:
  - Test: form updates on input
  - Test: save button disabled when no changes
  - Test: save triggers API + closes modal (4-5 tests)

### TASK 18 - Backend: Integration tests
- [ ] `backend/src/tests/training-history.test.ts`:
  - Test: GET /api/trainings/history returns own trainings only
  - Test: professor2 cannot see professor1's trainings (RBAC)
  - Test: filter by dateFrom/dateTo works
  - Test: filter by turmaId works
  - Test: keyword search works in notes
  - Test: PUT /:sessionId edits and audits
  - Test: DELETE soft-deletes (deleted_at set)
  - Test: PATCH /restore undoes delete
  - Test: pagination works (limit, offset)
  - Test: returns 404 if sessionId not found or deleted
  - Test: returns 403 if not owner (8-10 tests expected)

### TASK 19 - Template HTML para training-history-list
- [ ] Criar `training-history-list.component.html`:
  - Filter section: date range, turma dropdown, keyword input
  - Table: data, turma, alunos, tecnicas (preview), actions
  - Action buttons: visualizar, editar, deletar
  - Pagination controls
  - Empty state: "Nenhum treino registrado"
  - Loading state: spinner

### TASK 20 - Styling SCSS
- [ ] Criar `training-history-list.component.scss`:
  - Table styling (alternating rows, hover)
  - Button styling (action buttons small, secondary)
  - Filter section: form layout, spacing
  - Empty/loading states
  - Responsive: mobile-friendly list or card view
  - Reutilizar variáveis de tema do projeto

## Implementation Notes

### Guardrails Técnicos

- **Architecture patterns** (do Story 3-6 + Epic 3):
  - Use `authMiddleware` + `requireRole(['Professor'])` em todos os endpoints
  - SQL queries devem incluir `WHERE deleted_at IS NULL` (para list)
  - Isolamento por `(professor_id, academy_id)` sempre
  - Audit log em TODAS as mutações (create, update, delete, restore)

- **Database indexing**: Já existem em V3_0__Training.sql:
  - `idx_training_sessions_professor` (professor_id, session_date)
  - `idx_training_sessions_academy` (academy_id, session_date)
  - Reaproveitá-las para filtros date/turma

- **Frontend patterns** (do wizard 3.1-3.6):
  - NgRx ou direct service injection (verificar coexistência)
  - Modals: use NGX-Bootstrap modal ou Angular Material dialog
  - Toasts: use ngx-toastr ou similar (verificar no projeto)
  - Auto-save deve usar debounce(500ms) com trackBy
  - Subscriptions: use takeUntil(destroy$) pattern (evitar memory leaks)

- **Soft delete**: Sempre usar soft-delete, nunca hard delete
  - Razão: conformidade com audit_logs (LGPD)
  - Queries DEVEM filtrar `deleted_at IS NULL`

- **Type Safety**:
  - Backend PUT handler DEVE validar que attendance checklist é subset válido de enrollment
  - Frontend form DEVE reflect "dirty" status antes de habilitar save
  - UUID validation no backend para sessionId

### Estrutura de Arquivos (Expected)

**Backend (novos):**
- `backend/src/lib/trainingHistory.ts` (queries e logic)
- `backend/src/controllers/trainingHistory.ts` (ou routes handlers inline em trainings.ts)
- `backend/src/tests/training-history.test.ts` (suite completa)

**Frontend (novos):**
- `frontend/src/components/training-history/training-history-list.component.ts`
- `frontend/src/components/training-history/training-history-list.component.html`
- `frontend/src/components/training-history/training-history-list.component.scss`
- `frontend/src/components/training-history/training-history-detail.component.ts`
- `frontend/src/components/training-history/training-history-detail.component.html`
- `frontend/src/components/training-history/training-history-edit.component.ts`
- `frontend/src/components/training-history/training-history-edit.component.html`
- `frontend/src/components/training-history/training-history-delete.component.ts`
- `frontend/src/components/training-history/training-history-list.component.spec.ts`
- `frontend/src/components/training-history/training-history-edit.component.spec.ts`
- `frontend/src/components/training-history/training-history-detail.component.spec.ts`

**Edições esperadas:**
- `frontend/src/app.routing.module.ts` (adicionar rota `/training/history`)
- `frontend/src/app.module.ts` (declarar novos componentes)
- `frontend/src/services/api.service.ts` (novos métodos)
- `frontend/src/types/index.ts` (novos tipos)
- `backend/src/routes/trainings.ts` (novos endpoints)

### Padrões Técnicos a Reificar

1. **Modalidades de erro**:
   - 400 Bad Request: invalid filter params
   - 401 Unauthorized: missing token
   - 403 Forbidden: professor not owner of session
   - 404 Not Found: sessionId doesn't exist or is deleted
   - 409 Conflict: concurrent edit collision (optionally implement)

2. **Mensagens em português**:
   - Toast: "Treino deletado ✓"
   - Error: "Não foi possível carregar treinos"
   - Empty state: "Nenhum treino registrado"

3. **Validações**:
   - `limit` 1-100 (default 20)
   - `offset` >= 0 (default 0)
   - `dateTo >= dateFrom` (se ambos presentes)
   - `turmaId` deve ser UUID válido
   - `keyword` max 255 caracteres

4. **Performance targets**:
   - List load: < 1s (50-100 trainings)
   - Filter: < 200ms (com indexes)
   - Edit save: < 2s (API + UI update)
   - Modal open: < 500ms (data already in list)

### Observações para Desenvolvedor

- **Dependency**: Story 3.6 MUST ser done + approved antes deste start
  - Razão: training-success.component.ts já carrega recent trainings
  - Se 3.7 modificar schema de training_sessions, pode quebrar 3.6

- **Offline sync**: Implementação simplificada por enquanto
  - Versão 1: apenas cache read, edições falham offline
  - Versão 2 (future): sync_queue enfileiramento

- **Audit logging**: Utilizar função `logAudit()` existente (que função seria essa? Verificar no backend.)**

- **Modal library**: Qual é a modal/dialog library instalada? Usar a existente.

## Previous Story Reference & Learnings

### Story 3.6 (Previous Story):
- Implementação do componente training-success com 3s timer + 60s redirect
- Backend endpoint `/api/trainings/recent` com RBAC e soft-delete check
- Frontend services pattern: Observable + subscription cleanup (takeUntil)
- Testing: fakeAsync/tick para timers + mock HTTP
- **Learnings**:
  - `takeUntil(destroy$)` pattern é crítico para memory leaks
  - Timers em ngOnDestroy devem ser explicitamente cancelados
  - Subject<void>() para destroy$, não Subject<boolean>()
  - soft-delete filter: `tk.deleted_at IS NULL` em JOINs

### Story 3.5 (Review earlier):
- Componente training-review com resumo de dados
- Confirmação triggers navigation
- ACs sobre "Revisar" antes de confirmar

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Large history (100s trainings) = slow load | High | Add pagination (20 per page), index by professor_id + date |
| Concurrent edits (2 professors same session?) | Medium | FK constraint prevents (professor_id unique per session), validate owner |
| Soft delete but user expects hard delete | Low | UI clearly states "This cannot be undone" |
| Undo timer expires but user doesn't know | Low | Toast stays until dismissed + countdown visible |
| Filtering slow in large dataset | Medium | SQL indexes + limit 20 per page, pre-calculate counts |
| Offline edits conflict on sync | Medium | For MVP: disable offline edit (only show cache), defer to Story 3.8 |

## Completion Checklist

Before marking story as "done":
- [ ] All 20 tasks completed (TASK 1-20)
- [ ] All 11 ACs verified (manual testing + spec test)
- [ ] Backend integration tests: 8-10 passing
- [ ] Frontend component tests: 6-8 passing
- [ ] No regressions in 3.5, 3.6, or other Epic 3 stories (run full suite)
- [ ] Soft-delete verified in DB (deleted_at timestamps visible)
- [ ] Audit logs verified for edits, deletes, restores
- [ ] RBAC verified (professor2 cannot access professor1's trainings)
- [ ] Empty states handled (no trainings, filter no results, pagination edge cases)
- [ ] Offline indicator shows when needed
- [ ] Undo delete works in 10s window (tested manually)
- [ ] Error messages in Portuguese
- [ ] Code review passed (no CRÍTICO findings)
- [ ] Sprint-status updated to `done`

## References & Artifacts

- Epic 3: [Epic3.md](../Epics/Epic3/Epic3.md)
- Story 3-6 (previous): [3-6-sucesso-continuidade.md](./3-6-sucesso-continuidade.md)
- Story 3-5 (earlier): [3-5-revisar-confirmar.md](./3-5-revisar-confirmar.md)
- Database schema: [V3_0__Training.sql](<../_bmad-output/V3_0__Training.sql)
- Architecture: [architect.md](<../planning-artifacts/architect.md)
- Sprint status: [sprint-status.yaml](./sprint-status.yaml)

---

**Generated**: 2026-03-25 17:30:00 UTC
**By**: bmad-create-story  
**Story Key**: 3-7-historico-treinos
