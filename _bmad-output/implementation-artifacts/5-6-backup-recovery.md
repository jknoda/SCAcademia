# Story 5.6: Backup & Disaster Recovery — Automático & Manual

Status: done

## Story

Como um Admin,
Quero garantir que os dados da academia estejam prontos para recuperação com backup automático e manual,
Para que eu possa restaurar o sistema em caso de desastre preservando todos os dados operacionais.

## Contexto de Negocio

- Esta story continua o Epic 5 (Controle Admin) depois de:
  - 5.1 Dashboard Admin (entrada de ações administrativas)
  - 5.2 Auditoria LGPD (logs imutáveis)
  - 5.3 Relatório Conformidade (exportação + scheduler — padrão que *deve* ser reutilizado aqui)
  - 5.4 Alertas em Tempo Real
  - 5.5 Gestão de Usuários

- O sistema já tem padrões maduros que **devem** ser reusados:
  - `complianceSchedule.ts` + JSON-file + in-process cron → reusar para agendamento automático de backups
  - `complianceReports.ts` → reusar padrão `storage/<subdir>/` para armazenar arquivos de backup
  - `startupSchema.ts` → reusar padrão de `ensure*Table()` com `CREATE TABLE IF NOT EXISTS` para criar `backup_jobs`
  - `logAudit()` de `lib/audit.ts` → todas ações de backup/restore devem gerar audit log
  - `encryption.ts` → AES-256 já implementado — reusar para criptografia opcional de backups
  - `authMiddleware` + `requireRole(['Admin'])` → proteção de todos os endpoints

- O sistema é **multi-tenant** (N academias no mesmo banco): backup e restore devem ser filtrados por `academy_id`, nunca afetando dados de outras academias.

## Acceptance Criteria

**AC1 — Tela de Backup & Recovery**
Dado que Admin acessa "Admin > Backup & Recovery",
Quando clica,
Então exibe página com:
- Seção 1: Status do backup automático (frequência, última execução, próxima, tamanho, retenção)
- Seção 2: Histórico dos últimos 10 backups (Data | Hora | Tamanho | Status | Ações)
- Seção 3: Backup manual on-demand (checkboxes "Incluir histórico completo" e "Encriptar com senha")

**AC2 — Backup manual**
Dado que Admin clica "[Fazer Backup Agora]",
Quando clica,
Então:
- Sistema inicia job assíncrono de backup
- UI muda para estado "Processando... (pode levar 5-10 min)" com indicador visual de progresso
- Admin pode sair da página sem cancelar (job continua no backend)

**AC3 — Download de backup concluído**
Dado que backup completa com sucesso,
Quando termina,
Então:
- Status muda para "✓ Backup concluído"
- Exibe tamanho, nome (`backup_<data>_<hora>.sql.gz`) e botão "[Download agora]" (link expira em 24h)
- Registro aparece no histórico com status "OK"

**AC4 — Verificação de integridade**
Dado que Admin clica "[Testar Restore]" num backup,
Quando clica,
Então modal abre: "Verificar integridade do backup?"
E sistema verifica que o arquivo `.sql.gz` é legível e não corrompido (header + tamanho)
E exibe resultado: "✓ Backup íntegro" ou "✗ Arquivo corrompido"
(Nota: restore em sandbox completo é Phase 2 — MVP verifica apenas integridade)

**AC5 — Restore destrutivo com confirmação**
Dado que Admin clica "[Restaurar Este Backup]",
Quando clica,
Então exibe AVISO CRÍTICO com:
- "⚠️ AÇÃO IRREVERSÍVEL — Dados posteriores a [data backup] serão PERDIDOS"
- Campo: "Digite sua senha atual para confirmar"
- Botão "[RESTAURAR AGORA]" desabilitado até senha ser preenchida

Dado que Admin confirma com senha correta,
Quando submete,
Então sistema:
- Verifica senha via bcrypt
- Inicia restore no banco (transação: DELETE academia + re-INSERT dos dados do backup dentro do scope da academy_id)
- Envia email para Admin: "Processo restore iniciado às [hora]"
- Ao concluir, envia email: "Recovery bem-sucedido. Verifique dados."

**AC6 — Backup com criptografia**
Dado que Admin marcou "Encriptar backup com senha",
Quando submete,
Então arquivo é criptografado com AES-256 usando a senha informada
E para restaurar, Admin precisará fornecer a mesma senha

**AC7 — Arquivo temporário (backup não-criptografado)**
Dado backup sem criptografia concluído,
Quando Admin tenta download após 24h da criação,
Então endpoint retorna 410 Gone com mensagem "Link de download expirou"

**AC8 — Agendamento automático**
Dado que Admin configura horário de backup automático,
Quando salva (frequência padrão: diariamente às 02:30),
Então sistema agenda job automático usando in-process cron
E executa diariamente no horário configurado, gerando backup com tipo="auto"
E mantém últimos 30 dias de backups (retenção rotativa automática)

**AC9 — Isolamento multi-tenant**
Dado que há múltiplas academias no sistema,
Quando Admin da Academia A faz backup/restore,
Então apenas dados com `academy_id = academiaA.id` são incluídos/afetados
E Admin da Academia B não consegue ver ou acessar backups da Academia A

## Tasks / Subtasks

- [x] Criar camada de dados e migração de schema (AC: 1, 2, 3, 9)
  - [x] Adicionar função `ensureBackupJobsTable()` em `backend/src/lib/startupSchema.ts` que cria `backup_jobs` com: `id UUID PK`, `academy_id UUID NOT NULL`, `type VARCHAR(20)` (auto/manual), `status VARCHAR(20)` (pending/running/completed/failed), `file_name TEXT`, `file_path TEXT`, `file_size_bytes BIGINT`, `include_history BOOLEAN`, `is_encrypted BOOLEAN`, `initiated_by UUID REFERENCES users(id)`, `started_at TIMESTAMPTZ`, `completed_at TIMESTAMPTZ`, `error_message TEXT`, `download_expires_at TIMESTAMPTZ`, `retention_days INT DEFAULT 30`, `archived_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ DEFAULT NOW()`.
  - [x] Chamar `ensureBackupJobsTable()` dentro do `runStartupMigrations()` em `startupSchema.ts`.
  - [x] Criar funções em `backend/src/lib/database.ts`: `createBackupJob`, `updateBackupJob`, `getBackupJobById`, `listBackupJobs(academyId, limit)`, `cleanupExpiredBackupJobs(academyId, retentionDays)`.

- [x] Implementar lib de backup/restore (`backend/src/lib/backupJobs.ts`) (AC: 2, 3, 4, 5, 6, 9)
  - [x] Exportar função `runBackupJob(jobId, academyId, options)`.
  - [x] Exportar função `verifyBackupIntegrity(jobId, academyId)`.
  - [x] Exportar função `runRestoreJob(jobId, academyId, adminPassword, adminUserId)`.
  - [x] Exportar função `cleanupOldBackups(academyId, retentionDays)`.

- [x] Implementar agendador automático (`backend/src/lib/backupSchedule.ts`) (AC: 8)
  - [x] Seguir **exatamente** o padrão de `complianceSchedule.ts`.
  - [x] Chamar `startBackupScheduler()` no startup da aplicação em `backend/src/app.ts` (ou em `backend/src/index.ts`).

- [x] Implementar validators Joi (`backend/src/lib/validators.ts`) (AC: 2, 5, 6, 8)
  - [x] `backupTriggerSchema`: `includeHistory` (bool, default false), `isEncrypted` (bool, default false), `encryptionPassword` (string, min 8 quando `isEncrypted=true`; requerido condicionalmente via Joi `.when()`).
  - [x] `backupRestoreSchema`: `adminPassword` (string, min 1, required), `encryptionPassword` (string, opcional para backups criptografados).
  - [x] `backupScheduleUpsertSchema`: `hour` (int 0-23), `minute` (int 0-59), `enabled` (bool), `retentionDays` (int 7-90, default 30).

- [x] Implementar controller (`backend/src/controllers/adminBackup.ts`) (AC: 1-9)
  - [x] `listBackupJobsHandler`: Retorna `listBackupJobs(academyId, 10)` com metadados de cada job. Chama `cleanupExpiredBackupJobs` lazy. Retorna também `backupSchedule` atual e `lastAutoBackup`.
  - [x] `triggerBackupHandler`: Valida schema → cria job com `status=pending` → dispara `runBackupJob` **assincronamente** (não aguarda conclusão, responde 202 imediatamente com `jobId`). Registra `logAudit(BACKUP_TRIGGERED)`.
  - [x] `getBackupJobStatusHandler`: `GET /api/admin/backup/jobs/:jobId` — retorna job atual (polling).
  - [x] `downloadBackupHandler`: Verifica que `download_expires_at > NOW()` e `status=completed`, `academyId` bate. Faz `res.download(filePath)` com Content-Disposition + Content-Type `application/gzip`. Se expirado: 410. Registra `logAudit(BACKUP_DOWNLOADED)`.
  - [x] `verifyBackupHandler`: Chama `verifyBackupIntegrity` e retorna resultado. Registra `logAudit(BACKUP_VERIFIED)`.
  - [x] `restoreBackupHandler`: Valida senha → dispara `runRestoreJob` assincronamente → responde 202. Registra `logAudit(BACKUP_RESTORE_INITIATED)`. **Proteção**: verifica que `jobId` pertence à `academy_id` do admin antes de iniciar.
  - [x] `getBackupScheduleHandler`: Retorna agendamento atual da academia (ou default se não configurado).
  - [x] `upsertBackupScheduleHandler`: Salva agendamento e registra `logAudit(BACKUP_SCHEDULE_UPDATED)`.
  - [x] `deleteBackupJobHandler`: Deleta arquivo físico + marca job como deletado. Guard: não pode deletar backup em `running`. Registra `logAudit(BACKUP_DELETED)`.

- [x] Registrar rotas no admin router (`backend/src/routes/admin.ts`) (AC: 1-9)
  - [x] `GET  /api/admin/backup/jobs`             → `listBackupJobsHandler`
  - [x] `GET  /api/admin/backup/jobs/:jobId`       → `getBackupJobStatusHandler`
  - [x] `POST /api/admin/backup/trigger`           → `triggerBackupHandler` + validate(`backupTriggerSchema`)
  - [x] `GET  /api/admin/backup/download/:jobId`   → `downloadBackupHandler`
  - [x] `POST /api/admin/backup/verify/:jobId`     → `verifyBackupHandler`
  - [x] `POST /api/admin/backup/restore/:jobId`    → `restoreBackupHandler` + validate(`backupRestoreSchema`)
  - [x] `DELETE /api/admin/backup/jobs/:jobId`     → `deleteBackupJobHandler`
  - [x] `GET  /api/admin/backup/schedule`          → `getBackupScheduleHandler`
  - [x] `PUT  /api/admin/backup/schedule`          → `upsertBackupScheduleHandler` + validate(`backupScheduleUpsertSchema`)
  - [x] Todos os endpoints: `authMiddleware`, `requireRole(['Admin'])`.
  - [x] **CUIDADO**: Registrar rotas estáticas (`/backup/schedule`, `/backup/trigger`) ANTES de rotas parametrizadas (`/backup/jobs/:jobId`) — mesma regra de precedência já aplicada em 5.5.

- [x] Adicionar tipos TypeScript (AC: 1-9)
  - [x] `backend/src/types/index.ts`: interfaces `BackupJob`, `BackupJobStatus`, `BackupJobType`, `TriggerBackupRequest`, `RestoreBackupRequest`, `BackupScheduleConfig`, `BackupJobListResponse`, `BackupJobResponse`.
  - [x] `frontend/src/types/index.ts`: interfaces espelhadas para frontend `BackupJob`, `BackupJobStatus`, `BackupScheduleConfig`, `TriggerBackupPayload`, `RestoreBackupPayload`, `BackupListResponse`, `BackupScheduleUpdatePayload`.

- [x] Implementar tela frontend `AdminBackupRecoveryComponent` (AC: 1, 2, 3, 4, 5, 6, 8)
  - [x] Criar `/frontend/src/components/admin-backup-recovery/` com 4 arquivos (`.ts`, `.html`, `.scss`, `.spec.ts`).
  - [x] Propriedades: `jobs[]`, `isLoading`, `isTriggeringBackup`, `activeJobId`, `pollInterval`, `schedule`, `showTriggerForm`, `triggerPayload`, `showRestoreModal`, `restoreTargetJob`, `restorePayload`, `verifyResult`, `showVerifyModal`.
  - [x] Método `loadData()`: chama `listAdminBackups()` → preenche `jobs` e `schedule`. Chama no `ngOnInit`.
  - [x] Método `triggerBackup()`: chama `triggerAdminBackup(payload)` → recebe `jobId` → inicia polling via `setInterval(2s)` em `pollJobStatus(jobId)` até `status !== 'running' && status !== 'pending'` → para polling + chama `loadData()`.
  - [x] Método `downloadBackup(jobId)`: chama `downloadAdminBackup(jobId)` — abre download via `window.open` ou anchor element programático.
  - [x] Método `verifyBackup(jobId)`: chama `verifyAdminBackup(jobId)` → exibe resultado no `showVerifyModal`.
  - [x] Método `openRestoreModal(job)`: abre modal com aviso CRÍTICO; campo senha; botão desabilitado enquanto senha vazia.
  - [x] Método `confirmRestore()`: chama `restoreAdminBackup(jobId, payload)` → fecha modal → exibe mensagem "Restore iniciado, você receberá email de confirmação".
  - [x] Método `saveSchedule()`: chama `upsertAdminBackupSchedule(payload)` → feedback de sucesso.
  - [x] Usar `Subject`+`takeUntil(destroy$)` para cancelar subscriptions em `ngOnDestroy` — mesmo padrão da Story 5.5.
  - [x] **UX crítica**: Restoremodal deve ter cor vermelha/danger, confirmação explícita, e bloquear botão de submit enquanto senha vazia.
  - [x] Exibir badges de status (`OK` verde, `RUNNING` amarelo, `FAILED` vermelho, `EXPIRED` cinza).

- [x] Adicionar métos na `ApiService` (`frontend/src/services/api.service.ts`) (AC: 1-9)
  - [x] `listAdminBackups(): Observable<BackupListResponse>`
  - [x] `getAdminBackupJobStatus(jobId: string): Observable<BackupJobResponse>`
  - [x] `triggerAdminBackup(payload: TriggerBackupPayload): Observable<{ jobId: string; message: string }>`
  - [x] `downloadAdminBackup(jobId: string): string` — retorna URL completa (`apiUrl/admin/backup/download/${jobId}`) para abrir via `window.open` com Authorization header (ou redirecionar com token query param).
  - [x] `verifyAdminBackup(jobId: string): Observable<{ valid: boolean; sizeBytes: number; reason?: string }>`
  - [x] `restoreAdminBackup(jobId: string, payload: RestoreBackupPayload): Observable<{ message: string }>`
  - [x] `deleteAdminBackupJob(jobId: string): Observable<{ message: string }>`
  - [x] `getAdminBackupSchedule(): Observable<BackupScheduleConfig>`
  - [x] `upsertAdminBackupSchedule(payload: BackupScheduleUpdatePayload): Observable<BackupScheduleConfig>`
  - [x] **Nota**: Download direto de arquivo binário autenticado — usar padrão `observe: 'response', responseType: 'blob'` igual ao `exportAdminUsersCsv` implementado em Story 5.5. Não usar `window.open` com URL nua (perde o Authorization header).

- [x] Registrar componente e rota Angular (AC: 1)
  - [x] `frontend/src/app.module.ts`: importar e declarar `AdminBackupRecoveryComponent`.
  - [x] `frontend/src/app.routing.module.ts`: adicionar rota `{ path: 'admin/backup', component: AdminBackupRecoveryComponent, canActivate: [AuthGuard, RoleGuard] }` antes de rotas genéricas.

- [x] Testes e validações (AC: 1-9)
  - [x] Backend: criar `backend/src/tests/admin-backup-recovery.test.ts` cobrindo os fluxos de trigger, download, criptografia, restore, expiração, isolamento multi-tenant e agendamento.
  - [x] Frontend: `admin-backup-recovery.component.spec.ts` — testes: carregamento inicial da lista, trigger de backup muda estado para loading, modal de restore exige senha antes de habilitar botão.
  - [x] Frontend: `api.service.spec.ts` — 5 novos casos para métodos de backup.

## Dev Notes

### Estado atual do código (NÃO RECRIAR)

**Padrões que DEVEM ser reutilizados:**
- `backend/src/lib/complianceSchedule.ts` — padrão de scheduler com JSON file + setInterval. Copiar estrutura.
- `backend/src/lib/complianceReports.ts` — padrão de armazenamento em `storage/<subdir>/`. Copiar padrão.
- `backend/src/lib/startupSchema.ts` — padrão de `ensure*Table()` com `CREATE TABLE IF NOT EXISTS` + chamada em `runStartupMigrations()`. Seguir exatamente.
- `backend/src/lib/encryption.ts` — AES-256 já implementado. NÃO reimplementar criptografia do zero.
- `backend/src/lib/email.ts` → `sendEmail(to, subject, html)` — reusar para notificações de restore.
- `backend/src/lib/audit.ts` → `logAudit(userId, action, entity, entityId, academyId, ip?, details?)` — chamar em todos os handlers de backup.
- `backend/src/middleware/validate.ts` → `validate(schema)` — middleware de validação Joi, mesmo padrão.
- `backend/src/middleware/auth.ts` → `authMiddleware`, `requireRole(['Admin'])`.

**Padrão de resposta assíncrona:**
- `POST /trigger` → responde `202 Accepted` com `{ jobId, message }` — job roda em background.
- `GET /jobs/:jobId` → polling de status pelo frontend até `completed` ou `failed`.
- Mesmo padrão usado em `/compliance-report/generate` (gera async) + `status`.

**Download de arquivo autenticado:**
- Reusar exatamente o padrão de `exportManagedUsersCsvHandler` (Story 5.5) em `controllers/users.ts`:
  ```typescript
  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Content-Disposition', `attachment; filename="${job.fileName}"`);
  fs.createReadStream(job.filePath).pipe(res);
  ```
- Frontend: reusar padrão de `exportAdminUsersCsv` (Story 5.5) em `api.service.ts`:
  `observe: 'response', responseType: 'blob'` → criar Blob URL → anchor.click().

### Gaps concretos para esta story

1. Não existe nenhum controller, lib, rota ou componente de backup.
2. Não existe tabela `backup_jobs` no banco.
3. Não existe agendador de backup automático.
4. Não existe endpoint de restore.
5. Dashboard Admin ainda não tem link para `/admin/backup` (opcional: adicionar quick action).

### Arquitetura de Backup Multi-Tenant (CRÍTICO)

O banco é **multi-tenant** (N academias no mesmo PostgreSQL). **NÃO use `pg_dump` raw** (dumparia TODAS as academias juntas). Use abordagem baseada em SQL filtrado por `academy_id`:

**Backup (export):**
```typescript
// Para cada tabela com academy_id:
const rows = await pool.query(
  'SELECT * FROM users WHERE academy_id = $1 AND deleted_at IS NULL',
  [academyId]
);
// Gerar INSERTs: "INSERT INTO users (...cols) VALUES (...vals) ON CONFLICT DO NOTHING;"
// Escrever no arquivo .sql.gz via pipeline:
const gzip = zlib.createGzip();
const output = fs.createWriteStream(filePath);
gzip.pipe(output);
gzip.write(generateInsertStatement('users', rows.rows));
gzip.end();
```

**Tabelas a incluir no backup (em ordem de FK):**
1. `academies` (WHERE id = academyId)
2. `users` (WHERE academy_id = academyId)
3. `turmas` (WHERE academy_id = academyId)
4. `trainings` (WHERE academy_id = academyId)
5. `training_attendance` (JOIN trainings WHERE trainings.academy_id = academyId)
6. `training_notes` (se existir — JOIN via training_id)
7. `health_history` / `health_records` (WHERE academy_id = academyId ou via student)
8. `consents` (WHERE academy_id = academyId ou via student)
9. `audit_logs` (WHERE academy_id = academyId)
10. Verificar schema completo (`backend/src/lib/startupSchema.ts` e migrations) para não omitir tabelas.

**Restore (import em transação):**
```typescript
await pool.query('BEGIN');
try {
  // Deletar dados atuais da academia (ordem reversa de FK):
  await pool.query('DELETE FROM audit_logs WHERE academy_id = $1', [academyId]);
  // ... demais tabelas em ordem reversa ...
  await pool.query('DELETE FROM academies WHERE id = $1', [academyId]);
  // Re-inserir dados do dump:
  // parsear arquivo .sql.gz e executar cada INSERT
  await pool.query('COMMIT');
} catch (err) {
  await pool.query('ROLLBACK');
  throw err;
}
```

### Segurança e Conformidade

- **Restore destrutivo**: SEMPRE verificar senha via `bcrypt.compare(password, user.passwordHash)` ANTES de iniciar. Sem esta verificação, o handler não deve prosseguir.
- **Download**: Verificar `download_expires_at > NOW()` e `job.academyId === req.user.academyId` ANTES de servir o arquivo.
- **Isolamento**: Todos os endpoints devem verificar que `job.academyId === req.user.academyId`; se não bater, retornar 404 (não 403, para não vazar existência).
- **Criptografia**: Senha de criptografia NUNCA é armazenada no banco — somente o `encryptionSalt` (IV/salt). Sem a senha, arquivo é irrecuperável.
- **Audit logs**: Todo acesso (listagem, download, verify, restore, delete) deve gerar `logAudit`.
- **Arquivo temporário**: Backups não-arquivados com `download_expires_at < NOW()` → responder 410 no download.

### Performance e UX

- Backup roda assincronamente — responder 202 imediatamente, frontend faz polling a cada 2s.
- Para academias grandes, estimar tempo do backup baseado no size das tabelas (Phase 2 — MVP: progress bar indeterminada).
- Histórico: mostrar apenas últimos 10 na tela; endpoint suporta `limit` para futura paginação.
- Cleanup de arquivos expirados: fazer lazy no `listBackupJobsHandler` (não cron separado) — mesma abordagem de `cleanup` em complianceReports.

### Referencias

- Story fonte: `_bmad-output/Epics/Epic5/Story-5-6.md`
- Epic: `_bmad-output/Epics/Epic5/Epic5.md`
- Story anterior: `_bmad-output/implementation-artifacts/5-5-gestao-usuarios.md`
- Arquitetura: `_bmad-output/planning-artifacts/architect.md`
- Padrão scheduler: `backend/src/lib/complianceSchedule.ts`
- Padrão file storage: `backend/src/lib/complianceReports.ts`
- Padrão startup schema: `backend/src/lib/startupSchema.ts`
- Padrão download CSV: `backend/src/controllers/users.ts` (`exportManagedUsersCsvHandler`)
- Padrão download frontend: `frontend/src/services/api.service.ts` (`exportAdminUsersCsv`)
- Criptografia: `backend/src/lib/encryption.ts`
- Email: `backend/src/lib/email.ts`
- Audit: `backend/src/lib/audit.ts`
- Admin routes: `backend/src/routes/admin.ts`
- Frontend reference: `frontend/src/components/compliance-reports-settings/` (tela de agendamento + histórico — reusar padrão UX)

## Project Structure Notes

**Backend (novos):**
- `backend/src/lib/backupJobs.ts` — funções `runBackupJob`, `verifyBackupIntegrity`, `runRestoreJob`, `cleanupOldBackups`
- `backend/src/lib/backupSchedule.ts` — funções `getBackupSchedule`, `upsertBackupSchedule`, `startBackupScheduler`
- `backend/src/controllers/adminBackup.ts` — todos os handlers de backup

**Backend (modificados):**
- `backend/src/lib/startupSchema.ts` — adicionar `ensureBackupJobsTable()` e chamá-la em `runStartupMigrations()`
- `backend/src/lib/database.ts` — adicionar `createBackupJob`, `updateBackupJob`, `getBackupJobById`, `listBackupJobs`, `cleanupExpiredBackupJobs`
- `backend/src/lib/validators.ts` — adicionar `backupTriggerSchema`, `backupRestoreSchema`, `backupScheduleUpsertSchema`
- `backend/src/routes/admin.ts` — registrar todos os endpoints de backup
- `backend/src/types/index.ts` — adicionar types de backup
- `backend/src/app.ts` — importar e chamar `startBackupScheduler()` no startup

**Backend (testes):**
- `backend/src/tests/admin-backup-recovery.test.ts`

**Frontend (novos):**
- `frontend/src/components/admin-backup-recovery/admin-backup-recovery.component.ts`
- `frontend/src/components/admin-backup-recovery/admin-backup-recovery.component.html`
- `frontend/src/components/admin-backup-recovery/admin-backup-recovery.component.scss`
- `frontend/src/components/admin-backup-recovery/admin-backup-recovery.component.spec.ts`

**Frontend (modificados):**
- `frontend/src/types/index.ts` — adicionar types de backup
- `frontend/src/services/api.service.ts` — adicionar métodos de backup
- `frontend/src/services/api.service.spec.ts` — adicionar testes dos novos métodos
- `frontend/src/app.module.ts` — declarar `AdminBackupRecoveryComponent`
- `frontend/src/app.routing.module.ts` — adicionar rota `/admin/backup`

**Storage (runtime):**
- `backend/storage/backups/<academyId>/` — criado automaticamente na primeira execução de backup
- `backend/storage/backup-schedules.json` — criado automaticamente pelo `backupSchedule.ts`

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

- Backend targeted suite: `cd backend && npm test -- --runInBand src/tests/admin-backup-recovery.test.ts`
- Frontend suite: `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless`
- Backend full regression: `cd backend && npm test`

### Completion Notes List

- Implementado fluxo completo de backup manual e automático com persistência em `backup_jobs`, agendamento diário, retenção e download autenticado.
- Implementado backup criptografado por senha, verificação de integridade e restore destrutivo com confirmação por senha do admin e isolamento multi-tenant.
- Entregue tela Angular de Backup & Recovery com polling, histórico, agendamento, verificação e modal de restore em estado de perigo.
- Suite dedicada do backend da story passou com 6/6 testes; suíte frontend passou com `196 SUCCESS`.
- A regressão completa do backend permaneceu com 2 falhas pré-existentes e não relacionadas a esta story: `src/tests/admin-profile.test.ts` (expectativa desalinhada, recebe 401 no middleware antes do 404 do controller) e `src/tests/sync-queue.test.ts` (Jest não transpila `uuid` ESM no estado atual).

### File List

- `backend/src/types/index.ts`
- `backend/src/lib/database.ts`
- `backend/src/lib/startupSchema.ts`
- `backend/src/lib/encryption.ts`
- `backend/src/lib/backupJobs.ts`
- `backend/src/lib/backupSchedule.ts`
- `backend/src/controllers/adminBackup.ts`
- `backend/src/lib/validators.ts`
- `backend/src/routes/admin.ts`
- `backend/src/index.ts`
- `backend/src/tests/admin-backup-recovery.test.ts`
- `frontend/src/types/index.ts`
- `frontend/src/services/api.service.ts`
- `frontend/src/services/api.service.spec.ts`
- `frontend/src/components/admin-backup-recovery/admin-backup-recovery.component.ts`
- `frontend/src/components/admin-backup-recovery/admin-backup-recovery.component.html`
- `frontend/src/components/admin-backup-recovery/admin-backup-recovery.component.scss`
- `frontend/src/components/admin-backup-recovery/admin-backup-recovery.component.spec.ts`
- `frontend/src/app.routing.module.ts`
- `frontend/src/app.module.ts`
- `frontend/src/components/admin-dashboard/admin-dashboard.component.ts`
- `_bmad-output/implementation-artifacts/5-6-backup-recovery.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- Added backend backup scheduler, job persistence, encryption helpers and admin backup controller/routes.
- Added backend integration coverage for backup/recovery flows and fixed backup file persistence to write buffers correctly.
- Added Angular Backup & Recovery screen, API bindings, route/module wiring and dashboard quick action.
- Updated BMAD story and sprint tracking to `review` with validation notes.
