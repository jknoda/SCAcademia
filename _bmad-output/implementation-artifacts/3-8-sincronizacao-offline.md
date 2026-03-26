# Story 3.8: Sincronização Offline — Queue & Conflict Resolution

Status: done

## Story

Como um Professor trabalhando em zona com internet intermitente,
Quero que meus dados sejam salvos localmente e sincronizem automaticamente,
Para que não perca nenhum registro mesmo sem conexão.

## Contexto de Negócio

- Esta story é a conclusão do Epic 3 (Professor Love), focada em resiliência offline
- Permite que professores continuem registrando treinos mesmo sem internet
- Sincroniza automaticamente quando conexão retorna com batch operations
- Implementa conflict resolution (Last-Write-Wins) para edições concorrentes
- Suporta retry automático (até 5 tentativas) com backoff exponencial
- Prioridade: ALTA (objetivo final do Epic 3 é "Funciona offline com sync automático")
- Complexidade: GRANDE (envolve IndexedDB, service workers, batch sync, conflict resolution)

## Acceptance Criteria

### AC1 - Detecção offline e queue local
- DADO que Professor está em zona com internet intermitente
- QUANDO clica "Confirmar & Salvar" e não há conexão
- ENTÃO sistema:
  - Detecta "Sem conexão" automaticamente
  - Salva em IndexedDB tabela `sync_queue`:
    ```javascript
    {
      id: "training_2026-03-19_15h30_prof123",
      action: "CREATE",  // ou "UPDATE", "DELETE", "RESTORE"
      resource: "training", // ou "training_attendance", "technique"
      resourceId?: "uuid-session-123",
      payload: { training_data },
      timestamp: 1711003800000,
      status: "pending", // "synced", "failed", "retry"
      retryCount: 0,
      nextRetry?: 1711003860000
    }
    ```
  - Exibe toast: "✓ Salvo localmente (sincronizará quando conectar)"
  - UI permanece responsiva (não trava)

### AC2 - Estado offline indicado visualmente
- DADO que Professor está offline
- QUANDO navega pela aplicação
- ENTÃO:
  - Badge "🔴 Offline" aparece no header (vermelho)
  - Atualiza para "🟡 Conectando..." quando reconexão detectada
  - Atualiza para "🟢 Sincronizado" quando sync completa
  - Transições são suaves (não pisca constantemente)

### AC3 - Detecção automática de reconexão
- DADO que Internet retorna
- QUANDO conexão é detectada (navigator.onLine changes)
- ENTÃO:
  - Sistema aguarda 1s (para estabilizar conexão)
  - inicia sincronização automática ("Sincronizando X registros...")
  - Nenhuma ação manual necessária do usuário

### AC4 - Sincronização em batch
- DADO que Professor tem múltiplos registros offline (N registros)
- QUANDO internet retorna e sync inicia
- ENTÃO:
  - Sistema agrupa registros por resource (trainings, attendance, etc.)
  - Envia batch ao servidor: `POST /api/sync-queue`
  - Body:
    ```json
    {
      "batch": [
        {id, action, resource, resourceId, payload, timestamp},
        {id, action, resource, resourceId, payload, timestamp},
        ...
      ],
      "clientTimestamp": 1711003900000
    }
    ```
  - Exibe UI: "Sincronizando 3 registros... (1/3 concluído)"

### AC5 - Validação server-side
- DADO que servidor recebe batch de sync
- QUANDO processa cada registro
- ENTÃO valida:
  - Dados completos (nenhum campo obrigatório vazio)
  - Nenhum conflito identificável inicialmente (ex: session_id existe)
  - Recursos relacionados existem (ex: turma still exists, alunos ainda na turma)
  - ID do registrador é válido (professor_id, academy_id match)

### AC6 - Persistência server
- DADO que validação passou
- QUANDO servidor persiste
- ENTÃO:
  - Cria/atualiza/deleta registros em PostgreSQL
  - Registra no audit_logs: `action = "sync"`, details = batch info
  - Aloca IDs para novos registros (training_sessions.id gerados no servidor)
  - Retorna confirmação:
    ```json
    {
      "success": true,
      "synced": 3,
      "data": [
        {id: "uuid-generated-server", ...},
        {id: "uuid-generated-server", ...},
        {id: "uuid-generated-server", ...}
      ]
    }
    ```

### AC7 - Conflict resolution com Last-Write-Wins
- DADO que há conflito (ex: admin editou treino enquanto Professor estava offline)
- QUANDO servidor detecta:
  - Local timestamp (offline client): 15:30 = 1711003800000
  - Server timestamp (admin edit): 16:00 = 1711007400000
- ENTÃO:
  - Aplica Last-Write-Wins: server ganha
  - Retorna versão do servidor
  - Cliente recebe no response: `conflict: true, resolvedWith: "server_version"`

### AC8 - Recebimento de conflito no cliente
- DADO que cliente recebe resposta com conflito
- QUANDO processa response
- ENTÃO:
  - Remove item de sync_queue
  - Atualiza local IndexedDB com server version
  - Exibe toast: "⚠️ Conflito resolvido: versão mais recente do servidor aplicada"
  - Refresca lista (UI reflete mudança)
  - Nenhuma ação manual necessária

### AC9 - Limpeza de queue após sync bem-sucedido
- DADO que sincronização completa com sucesso
- QUANDO todos os registros são persistidos
- ENTÃO:
  - IndexedDB sync_queue é limpo ou marcado `status = "synced"`
  - Histórico de syncs é mantido para auditoria (moved to sync_history table)
  - UI exibe: "✓ Tudo sincronizado"
  - Badge no header muda para "🟢 Sincronizado"

### AC10 - Retry automático com backoff
- DADO que sincronização falha (ex: 500 server error)
- QUANDO erro é capturado
- ENTÃO:
  - Registra `retryCount++` e `status = "failed"`
  - Calcula `nextRetry = now + (2^retryCount * 1000)ms` (exponential backoff)
  - Tenta novamente automaticamente a cada retry
  - Exibe UI: "⚠️ Re-tentando sincronização... (tentativa 2/5)"
  - Se todas 5 tentativas falham: "❌ Erro ao sincronizar. [Tentar Novamente]"

### AC11 - Notificação admin em falha persistente
- DADO que 5 retries falharam
- QUANDO sistema desiste
- ENTÃO:
  - Envia notificação ao Admin/DevOps: "Sync failure threshold exceeded for user X"
  - Inclui: user_id, batch_id, error details, timestamp
  - Dados continuam em IndexedDB (não são perdidos)
  - Professor vê: "Seus dados estão salvos. [Tentar Novamente] ou contactar suporte"

### AC12 - Preservação de timestamp original
- DADO que Professor sincroniza 2 semanas após registrar offline
- QUANDO batch é processado
- ENTÃO:
  - Sistema aceita o registro (não rejeita por "muito velho")
  - Timestamp original é mantido (NOT sobrescrito com agora)
  - training_sessions.created_at preserva valor offline
  - Histórico de auditoria permanece acurado

### AC13 - Sincronização em background
- DADO que Professor está usando aplicação
- QUANDO há registros pendentes de sync
- ENTÃO:
  - Sync acontece silenciosamente em background (não interrompe UX)
  - UI updates ocorrem sem modal/dialogs intrusivos
  - Usuário pode continuar navegando enquanto sync ocorre
  - Após sync, lista é atualizada automaticamente

### AC14 - Fallback para versão server após conflito
- DADO que há conflito de dados
- QUANDO Professor visualiza/edita registro após sync
- ENTÃO:
  - Dados mostrados são versão do servidor (mais recente)
  - Se Professor havia feito edições offline locais, elas são descartadas
  - Toast avisa: "Versão online foi aplicada" (não silencioso)

## Tasks / Subtasks

### TASK 1 - Backend: Database schema para sync queue
- [ ] Criar tabelas no PostgreSQL:
  ```sql
  CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID NOT NULL REFERENCES professor_profiles(id),
    academy_id UUID NOT NULL REFERENCES academics(id),
    batch_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'RESTORE'
    resource VARCHAR(50) NOT NULL, -- 'training', 'training_attendance', 'technique'
    resource_id UUID,
    payload JSONB NOT NULL,
    client_timestamp BIGINT NOT NULL,
    server_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'synced', -- 'pending', 'synced', 'failed', 'retry'
    retry_count INT DEFAULT 0,
    error_message TEXT,
    resolved_with VARCHAR(20), -- 'server_version', 'client_version', null
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
  );
  
  CREATE INDEX idx_sync_queue_professor ON sync_queue(professor_id, academy_id);
  CREATE INDEX idx_sync_queue_status ON sync_queue(status);
  CREATE INDEX idx_sync_queue_batch ON sync_queue(batch_id);
  ```

### TASK 2 - Backend: Endpoint POST /api/sync-queue
- [ ] Criar controller para processar batches:
  - `POST /api/sync-queue`
  - Body: `{ batch: [...], clientTimestamp }`
  - Middleware: `authMiddleware` + `requireRole(['Professor'])`
  - Validações:
    - professor_id owns all records
    - academy_id matches
    - batch entries are valid JSON
  - Processamento:
    1. Abre transaction
    2. Para cada entrada:
       - Valida payload
       - Verifica timestamp conflict (Last-Write-Wins comparison)
       - Executa action (CREATE/UPDATE/DELETE/RESTORE)
       - Registra em audit_logs
    3. Persiste todos na sync_queue table
    4. Commit transaction
  - Response: `{ success, synced: N, failed: M, data: [processedRecords], conflicts: [...] }`
  - Erros: 400 (invalid), 401 (not auth), 403 (not owner), 409 (conflict)

### TASK 3 - Backend: Conflict detection logic
- [ ] Implementar função utilitária:
  - `detectConflict(clientTimestamp, localData, serverData)`
  - Compara timestamps: `if (serverTimestamp > clientTimestamp) -> server wins`
  - Retorna: `{ hasConflict: boolean, winner: 'client|server', resolvedData }`
  - Aplica Last-Write-Wins: server data sobrescreve client

### TASK 4 - Backend: Batch validation middleware
- [ ] Criar middleware para validar batch entries:
  - Schema validation para cada entrada (action, resource, payload)
  - Verifica resource referential integrity (turma exists, alunos existem)
  - Valida timestamps são números positivos
  - Rejeita duplicatas no batch (mesmo resourceId + action)
  - Retorna 400 com lista de erros detalhados

### TASK 5 - Backend: Integration tests para sync endpoint
- [ ] `backend/src/tests/sync-queue.test.ts`:
  - Test: POST /api/sync-queue acceita batch válido
  - Test: sync de novo treino (CREATE action)
  - Test: sync de treino editado (UPDATE action, sem conflito)
  - Test: sync com conflito (server vence)
  - Test: múltiplas entradas no batch processos atomicamente
  - Test: professor2 não pode acessar sync_queue de professor1 (RBAC)
  - Test: retry_count incrementa em falha
  - Test: returns 409 em conflito detectado
  - Test: audit_logs registra sync operations
  - Test: 15+ tests esperados

### TASK 6 - Frontend: IndexedDB schema local
- [ ] Criar service para gerenciar IndexedDB:
  - `frontend/src/services/offline-storage.service.ts`
  - Database: "scacademia_sync"
  - Stores:
    1. `sync_queue` (objectStore):
       - keyPath: "id"
       - indexes: ["status", "timestamp", "resourceId"]
       - Purpose: fila de operações pendentes offline
    2. `sync_history` (objectStore):
       - keyPath: "id"
       - indexes: ["bucketId", "timestamp"]
       - Purpose: histórico de syncs completados (últimos 30 dias)
    3. `sync_status` (objectStore):
       - keyPath: "key" (único registro: "sync_state")
       - Armazena: {lastSync, nextRetry, isOnline, retryCount}
  - API methods:
    - `putInQueue(entry)` - add/update entry
    - `getAllPending()` - get status='pending'
    - `removeFromQueue(id)` - remove após sync sucesso
    - `updateQueueEntry(id, updates)` - update retry_count, timestamp
    - `getSyncHistory(days)` - get histórico

### TASK 7 - Frontend: Offline detection service
- [ ] Criar service para monitorar conexão:
  - `frontend/src/services/offline-monitor.service.ts`
  - Observables:
    - `isOnline$` - BehaviorSubject com estado de conexão
    - `statusChanged$` - Subject que emite quando status muda
  - Event listeners:
    - `window.addEventListener('online', ...)`
    - `window.addEventListener('offline', ...)`
    - Periodic HTTP HEAD ping (ex: HEAD /api/health)
  - Methods:
    - `checkConnection()` - teste explícito
    - `waitForConnection()` - Promise que resolve quando online

### TASK 8 - Frontend: Sync manager service
- [ ] Criar orquestrador de sincronização:
  - `frontend/src/services/sync-manager.service.ts`
  - Métodos:
    - `enqueueOperation(action, resource, payload)` - add to IndexedDB queue
    - `startSync()` - inicia sincronização batch
    - `processResponse(response)` - processa resposta do servidor
    - `handleConflict(conflict)` - atualiza local IndexedDB com server version
    - `retryFailedOperations()` - re-tenta com backoff
  - State management:
    - `syncInProgress$` - indica se sync está rodando
    - `syncProgress$` - BehaviorSubject com {current, total}
    - `pendingCount$` - count de registros pending

### TASK 9 - Frontend: Intercept API calls para capturar offline
- [ ] Estender `HttpClientService` com interceptor:
  - Em `frontend/src/services/http-client.service.ts`
  - Ao capturar erro de conexão (0 status ou timeout):
    1. Valida se é operação que pode ser enfileirada (POST/PUT/DELETE para /trainings)
    2. Se sim: chama `syncManager.enqueueOperation(...)`
    3. Retorna sucesso local: `{success: true, data: {queued_locally: true}}`
    4. Se não (ex: GET): retorna erro ao usuário
  - Observable pattern: `switchMap / catchError`

### TASK 10 - Frontend: UI Badge offline status
- [ ] Adicionar badge ao header/navbar:
  - `frontend/src/components/app-header/` (ou existing header)
  - Binding: `offlineMonitor.isOnline$ | async`
  - Estados:
    - 🟢 "Sincronizado" (online && sync completo)
    - 🟡 "Conectando..." (online mas sync em progresso)
    - 🔴 "Offline" (offline)
  - Classes CSS para cada estado (colors, animate)

### TASK 11 - Frontend: Sync progress indicator
- [ ] Adicionar indicador visual durante sync:
  - Exibe em toast ou header: "Sincronizando 3 registros... (2/3)"
  - Atualiza em real-time usando `syncManager.syncProgress$`
  - Desaparece após sync completo
  - Não bloqueante (usuário pode continuar navegando)

### TASK 12 - Frontend: Enqueue no training-creation flow
- [ ] Modificar componente de criação de treino:
  - `frontend/src/components/training-creation/` (ou training-entry)
  - No handler de "Confirmar & Salvar":
    1. Tenta POST /trainings
    2. Se erro de conexão: chama `syncManager.enqueueOperation()`
    3. Exibe toast: "✓ Salvo localmente"
    4. Navega para próximo passo (ou home)
  - Garante que workflow offline é transparente

### TASK 13 - Frontend: Enqueue em training-history edits
- [ ] Modificar componente de edição de treino:
  - `frontend/src/components/training-history/` (adição a Story 3.7)
  - No handler de "Salvar Mudanças":
    1. Tenta PUT /trainings/:id
    2. Se erro: enfileira com `syncManager.enqueueOperation('UPDATE', 'training', payload)`
    3. Exibe toast indicando enfileiramento local
  - Edições offline são salvas localmente até reconexão

### TASK 14 - Frontend: Service para resolver conflitos localmente
- [ ] Implementar `conflict-resolver.service.ts`:
  - Método: `resolveConflict(clientVersion, serverVersion, strategy)`
  - Strategy "LAST_WRITE_WINS": server prevaleça
  - Retorna versão final para UI update
  - Merges safe fields (ex: keeping client's notes se server editou frequência)
  - Para MVP: sempre usa LAST_WRITE_WINS

### TASK 15 - Frontend: Testes para offline storage
- [ ] `frontend/src/services/offline-storage.service.spec.ts`:
  - Test: put/get/remove operations in IndexedDB
  - Test: getAllPending retorna apenas status='pending'
  - Test: updates to queue entries (retry_count, timestamp)
  - Test: history cleanup após 30 dias
  - 6-8 tests esperados

### TASK 16 - Frontend: Testes para sync manager
- [ ] `frontend/src/services/sync-manager.service.spec.ts`:
  - Mock offline-storage + http-client
  - Test: enqueueOperation adds to queue
  - Test: startSync calls API batch endpoint
  - Test: processResponse removes from queue após sucesso
  - Test: handleConflict updates local IndexedDB + UI
  - Test: retryFailedOperations implements backoff (2^n ms)
  - Test: after 5 retries, emits failure
  - 8-10 tests esperados

### TASK 17 - Frontend: Testes para offline monitor
- [ ] `frontend/src/services/offline-monitor.service.spec.ts`:
  - Test: isOnline$ emits true on window.online event
  - Test: isOnline$ emits false on window.offline event
  - Test: statusChanged$ emits transitions
  - Test: checkConnection() pings backend
  - 4-5 tests esperados

### TASK 18 - Frontend: Integration test para offline flow
- [ ] `frontend/src/tests/offline-sync.integration.spec.ts`:
  - Full flow: offline -> create training -> go online -> sync
  - Test: data persisted in IndexedDB
  - Test: sync_queue emptied after sync
  - Test: audit trail shows sync activity
  - Test: conflicts resolved with server winning
  - Test: UI updates reflect server version
  - Test: retry backoff timing (2^n ms)
  - 8-10 tests esperados

### TASK 19 - Backend: Logging e monitoring para sync
- [ ] Adicionar logs estruturados:
  - `logger.info("SYNC_BATCH_RECEIVED", { batchId, professerId, entryCount })`
  - `logger.info("SYNC_CONFLICT_DETECTED", { resourceId, clientTs, serverTs })`
  - `logger.warn("SYNC_RETRY_EXCEEDED", { batchId, retryCount, error })`
  - `logger.error("SYNC_FAILURE", { batchId, error, notifyAdmin: true })`
  - Métricas: sync latency, conflict rate, retry rate

### TASK 20 - Backend: Admin endpoint para monitorar sync queue
- [ ] Criar `GET /api/admin/sync-queue/pending`:
  - Requer admin role
  - Retorna lista de registros ainda pendentes (status != 'synced')
  - Útil para diagnosing problemas
  - Inclui: professores afetados, timestamps, error reasons
  - Response: `{pending: N, failedRetries: M, data: [...]}`

### TASK 21 - Database: Migration script para schema
- [ ] Criar `V?_0__Sync_Queue.sql`:
  - Cria tabelas sync_queue, sync_history
  - Indexes para performance queries
  - Foreign keys para referential integrity
  - Grant permissions para sistema rodar
  - Rollback statements (se needed)

## Padrões Técnicos a Reificar

1. **Offline-first architecture**:
   - Client-side enqueue ANTES tentar servidor
   - IndexedDB como source-of-truth durante offline
   - Batch operations (não um-por-um) para eficiência
   - Transparent to user (não requer manual retry)

2. **Conflict resolution**:
   - Last-Write-Wins (server side determina winner)
   - Comparação por timestamp (não por version number)
   - Server's copy torna-se novo local version
   - Toast notifica resolution (não silencioso)

3. **Retry strategy**:
   - Exponential backoff: `2^retryCount * 1000` ms (1s, 2s, 4s, 8s, 16s)
   - Max 5 retries (25 segundos total)
   - retry_count persistido em IndexedDB
   - nextRetry timestamp drivent de sistema

4. **Observables + RxJS patterns**:
   - `BehaviorSubject` para estado (isOnline, syncProgress)
   - `Subject` para eventos (statusChanged, conflictResolved)
   - `takeUntil(destroy$)` em subscriptions
   - `switchMap` para cascata de sync operations

5. **IndexedDB database management**:
   - Version-gated initialization (upgrade hooks)
   - No data loss on quota exceeded (fallback to localStorage?)
   - Cleanup de histórico > 30 dias
   - Prevenção de duplicate entries

6. **Error messages in Portuguese**:
   - Toast: "✓ Salvo localmente"
   - Toast: "⚠️ Conflito resolvido: versão servidor aplicada"
   - Error: "Erro ao sincronizar. Seus dados estão salvos."
   - Status: "🔴 Offline", "🟡 Conectando...", "🟢 Sincronizado"

7. **Atomic operations**:
   - Backend processes entire batch in transaction
   - All-or-nothing (commit or rollback)
   - No partial sync states

8. **Audit trail**:
   - `audit_logs.action = "sync"` para batch operations
   - Details contém: batch_id, sync_timestamp, conflict_info
   - Permanece mesmo se sync falha (para debugging)

## Observações para Desenvolvedor

- **Dependency**: Story 3.7 (training-history) MUST ser done antes deste start
  - Razão: 3.8 coloca edições de histórico em fila offline
  - Se 3.7 não estiver estável, 3.8 será instável

- **Dependency**: Service workers opcionais mas recomendados
  - MVP pode funcionar só com online/offline events
  - Versão 2: implementar Service Worker para background sync

- **Browser storage limitations**:
  - IndexedDB quota: varia por browser (50-100MB)
  - Se ultrapassar: nenhum alarme - graceful degradation
  - Implementar cleanup automático após sync (não acumular histórico)

- **Network detection**:
  - `navigator.onLine` é unreliable sozinho
  - Combinar com HEAD /api/health ping (timeout 2s, retry 3x)
  - Aguardar 1s após online event antes de iniciar sync (estabilizar conexão)

- **Test fixtures para offline**:
  - Mock `navigator.onLine` em testes
  - Mock IndexedDB com fake storage (in-memory option)
  - Simular timeout/connection failures em HTTP interceptor

- **Logging library**:
  - Usar existente? (Verificar backend logger)
  - Fácil audit de sync operations para debugging

## Previous Story Reference & Learnings

### Story 3.7 (Training History):
- Soft-delete pattern implementado com sucesso
- Frontend modals com overlay backdrop
- Countdown timers com cleanup (30s undo window)
- Testing com fakeAsync/tick
- **Learnings**:
  - Modals precisam de proper z-index + backdrop
  - Timers MUST ser cleared no destroy
  - Observable subscriptions destruídas com takeUntil(destroy$)
  - SQL soft-delete filters: `deleted_at IS NULL` critical

### Story 3.6 (Training Success):
- Backend batch operations em transaction
- Real-time UI updates após API response
- Timer-based redirects com cancellation
- **Learnings**:
  - Transactions em PostgreSQL previnem race conditions
  - UI state invalidation após operações async
  - ngOnDestroy é essencial para cleanup

### Epic 3 Architecture:
- All training-related APIs under `/api/trainings`
- RBAC pattern: `requireRole(['Professor']) middleware
- Audit logging de todas operações
- Soft-delete para compliance

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| IndexedDB quota exceeded | High | Implement cleanup (30-day purge), graceful degradation to localStorage |
| Network detection unreliable | Medium | Combine navigator.onLine + HEAD ping + timeout handling |
| Sync fails after 5 retries, data lost | High | Data permanently in IndexedDB, admin notified for recovery |
| Conflicting edits from multiple devices | Medium | Last-Write-Wins deterministic, server-side conflict resolution |
| User doesn't know sync completed | Low | Badge updates + toast notification + list refresh |
| Batch too large (100+ operations) causes timeout | Medium | Limit batch size to 50 per request, queue remainder |
| Service Worker not available (iOS Safari) | Medium | Fallback to online/offline events + periodic checks |
| Offline data stale after 30+ days | Low | Trade-off accepted, user can force sync from UI |
| CPU spike from large IndexedDB queries | Low | Indexes on status, timestamp, resourceId |
| Multiple clients attempting concurrent sync | Low | Batch ID ensures idempotency, server deduplicates |

## Completion Checklist

Before marking story as "done":
- [ ] All 21 tasks completed (TASK 1-21)
- [ ] All 14 ACs verified (manual testing + spec tests)
- [ ] Backend integration tests: 15+ passing
- [ ] Frontend service tests: 8-10 per service (3-4 services)
- [ ] Frontend integration test: offline flow end-to-end
- [ ] IndexedDB schema creates/queries correctly
- [ ] Conflict detection and resolution (Last-Write-Wins) working
- [ ] Retry backoff: 1s, 2s, 4s, 8s, 16s tested (timing accurate ±200ms)
- [ ] No data loss on sync failures (data persists in IndexedDB)
- [ ] No regressions in Stories 3.6, 3.7, or other Epic 3 (run full suite)
- [ ] Badges update correctly on connection state changes
- [ ] Batch sync reduces network calls (verified via Network tab)
- [ ] Timestamps preserved (original timestamps NOT overwritten)
- [ ] Offline operations transparent to user (no manual retries needed)
- [ ] Error messages in Portuguese
- [ ] Admin monitoring endpoint working (GET /api/admin/sync-queue/pending)
- [ ] Audit logs show sync operations
- [ ] Code review passed (no CRÍTICO findings)
- [ ] Sprint-status updated to `done`
- [ ] All docs updated (this file, Architecture, etc.)

## References & Artifacts

- Epic 3: [Epic3.md](../Epics/Epic3/Epic3.md)
- Story 3-7 (previous): [3-7-historico-treinos.md](./3-7-historico-treinos.md)
- Story 3-6 (reference): [3-6-sucesso-continuidade.md](./3-6-sucesso-continuidade.md)

---

**End of Story 3.8 Specification**
