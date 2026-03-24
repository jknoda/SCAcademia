# Story 2.4: Auditoria LGPD

Status: review

## Story

Como Administrador da academia,
Quero consultar o log de auditoria LGPD com filtros por usuário, período e tipo de ação, e exportar os dados para compliance,
Para que eu possa monitorar quem acessou dados sensíveis, quando e por quê, garantindo rastreabilidade completa e conformidade legal.

## Contexto de Negócio

- **FR45:** Sistema mantém logs estruturados de TODAS as ações: usuário, ação, recurso, timestamp, IP
- **FR46:** Logs de acesso a dados sensíveis incluem: WHO, WHAT, WHEN, WHY (motivo do acesso via `changes_json`)
- **FR47:** Admin pode consultar auditoria por: usuário, período, tipo de ação
- **FR48:** Sistema retém logs por mínimo 12 meses (já implementado: `retention_until = NOW() + INTERVAL '7 years'` no `logAudit()`)
- **FR49:** Sistema monitora tentativas de acesso não autorizado
- Dependência: Story 2.2 e 2.3 já implementadas — `audit_logs` já tem dados gravados (CONSENT_SIGNED, CONSENT_EMAIL_SENT, CONSENT_TEMPLATE_PUBLISHED, RECONSENT_EMAIL_SENT, etc.)
- A tabela `audit_logs` **já existe** no schema e já está sendo alimentada por todos os handlers anteriores via `logAudit()` de `lib/audit.ts`
- `lib/audit.ts` já tem `getAuditLogsByAcademy(academyId)` e `getAuditLogsByUser(userId)` mas sem filtros — esta story estende com filtragem e paginação
- O dashboard admin (`/admin/dashboard`) já tem botão de navegação para funcionalidades LGPD — adicionar botão para `/admin/audit-logs`

## Acceptance Criteria

### AC1 — Endpoint Backend de Consulta com Filtros
- DADO que um Admin autenticado faz `GET /api/admin/audit-logs`
- QUANDO inclui query params opcionais: `userId`, `action`, `resourceType`, `dateFrom`, `dateTo`, `page`, `limit`
- ENTÃO retorna lista paginada de logs da academia do Admin
- Campos retornados por log: `logId`, `actorName` (join com users), `actorId`, `action`, `resourceType`, `resourceId`, `ipAddress`, `timestamp`, `changesJson`
- Ordenação: `timestamp DESC` por padrão
- Paginação: `limit` default=50, max=200; resposta inclui `{ logs: [...], total: number, page: number, totalPages: number }`
- Filtros suportados:
  - `userId` → filtra por `actor_user_id`
  - `action` → filtra por `action` (ex: `CONSENT_SIGNED`, `CONSENT_TEMPLATE_PUBLISHED`)
  - `resourceType` → filtra por `resource_type` (ex: `ConsentTemplate`, `consent`, `HealthRecord`)
  - `dateFrom` / `dateTo` → filtra por `timestamp` (ISO 8601 strings)

### AC2 — Endpoint Backend de Exportação CSV
- DADO que um Admin autenticado faz `GET /api/admin/audit-logs/export`
- QUANDO inclui os mesmos query params de filtro da AC1
- ENTÃO retorna arquivo CSV com headers: `Data/Hora,Usuário,Ação,Recurso,Tipo Recurso,IP,Detalhes`
- Response headers: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="auditoria-lgpd-YYYY-MM-DD.csv"`
- Sem paginação — exporta TODOS os registros que correspondem ao filtro (máx 10.000 linhas)

### AC3 — Audit Log Loga a Própria Consulta
- DADO que um Admin consulta ou exporta o audit log
- ENTÃO o sistema registra na `audit_logs`: `action='AUDIT_LOG_VIEWED'` ou `action='AUDIT_LOG_EXPORTED'`, `resource_type='AuditLog'`, com filtros usados em `changes_json`
- Propósito: rastreabilidade de QUEM consultou os logs (FR46)

### AC4 — Frontend: Componente de Timeline de Auditoria
- DADO que o Admin navega para `/admin/audit-logs`
- QUANDO a página carrega
- ENTÃO vê timeline de logs da academia em ordem cronológica reversa (mais recente primeiro)
- Cada entrada da timeline exibe:
  - Ícone colorido por categoria de ação (🟢 consulta/leitura, 🟡 modificação, 🔴 remoção/crítico)
  - Nome do usuário autor da ação
  - Texto descritivo da ação (ex: "Consentimento assinado por João Silva")
  - Tipo de recurso afetado
  - Data/hora formatada em pt-BR (ex: "23 mar 2026, 14:32")
  - Endereço IP

### AC5 — Frontend: Painel de Filtros
- DADO que o Admin visualiza a timeline
- QUANDO usa o painel de filtros lateral/superior
- ENTÃO pode filtrar por:
  - Campo de texto: busca por nome de usuário (autocomplete ou texto livre)
  - Dropdown: Tipo de Ação (lista das actions únicas da academia)
  - Dropdown: Tipo de Recurso
  - DatePicker: Data Início e Data Fim
- Botão "Aplicar Filtros" recarrega a lista via API
- Botão "Limpar" reseta todos os filtros
- Total de registros encontrados exibe conta ("12 registros encontrados")

### AC6 — Frontend: Exportar CSV com um clique
- DADO que o Admin visualiza a timeline (com ou sem filtros ativos)
- QUANDO clica no botão "Exportar LGPD (CSV)"
- ENTÃO o browser inicia download automático do arquivo CSV
- Filename: `auditoria-lgpd-YYYY-MM-DD.csv`
- O botão mostra loading enquanto o download é preparado

### AC7 — Frontend: Paginação
- DADO que há mais de 50 registros
- QUANDO o Admin visualiza a timeline
- ENTÃO vê paginação no rodapé (Anterior / Próxima / Página X de Y)
- Navegar entre páginas atualiza a lista sem recarregar a página inteira

### AC8 — Navegação do Dashboard Admin
- DADO que o Admin está no `/admin/dashboard`
- QUANDO visualiza a seção "Próximas Ações"
- ENTÃO vê botão "🔍 Log de Auditoria LGPD" que navega para `/admin/audit-logs`

## Tasks / Subtasks

- [ ] **Task 1 — Backend: lib/audit.ts — adicionar queries com filtro e paginação** (AC1, AC2)
  - [ ] Adicionar função `getAuditLogsFiltered(academyId, filters, pagination): Promise<{logs: AuditLog[], total: number}>`
    - Parâmetros: `filters: { userId?: string, action?: string, resourceType?: string, dateFrom?: Date, dateTo?: Date }`, `pagination: { page: number, limit: number }`
    - Query SQL com `WHERE` dinâmico (array de condições + `$N` params)
    - JOIN com `users` para retornar `actor_name` (fullName)
    - Retorna `{ logs: AuditLog[], total: number }`
  - [ ] Adicionar função `getAuditLogsCsv(academyId, filters): Promise<AuditCsvRow[]>`
    - Retorna array de objetos com campos CSV sem paginação (LIMIT 10000)
  - [ ] Atualizar interface `AuditLog` para incluir `actorName?: string`
  - [ ] Adicionar interface `AuditFilters` e `AuditPagination`

- [ ] **Task 2 — Backend: controllers/adminAudit.ts (NOVO ARQUIVO)** (AC1, AC2, AC3)
  - [ ] `getAuditLogsHandler` — `GET /api/admin/audit-logs`
    - Parse query params: `userId`, `action`, `resourceType`, `dateFrom`, `dateTo`, `page` (default 1), `limit` (default 50, max 200)
    - Valida datas com `new Date(dateFrom)` — verifica `isNaN()`
    - Chama `getAuditLogsFiltered(academyId, filters, pagination)`
    - Loga `AUDIT_LOG_VIEWED` via `logAudit()` com filters em details
    - Retorna `{ logs, total, page, totalPages }`
  - [ ] `exportAuditLogsCsvHandler` — `GET /api/admin/audit-logs/export`
    - Chama `getAuditLogsCsv(academyId, filters)`
    - Gera CSV string: headers + rows formatados
    - Loga `AUDIT_LOG_EXPORTED`
    - Retorna com `Content-Type: text/csv`, `Content-Disposition: attachment; filename=...`
    - **ATENÇÃO:** Escapar valores CSV corretamente (envolve campos com vírgula ou aspas em `"..."` e duplica aspas internas)

- [ ] **Task 3 — Backend: routes/admin.ts — adicionar rotas de auditoria** (AC1, AC2)
  - [ ] Import `getAuditLogsHandler`, `exportAuditLogsCsvHandler` de `../controllers/adminAudit`
  - [ ] Adicionar: `router.get('/audit-logs', authMiddleware, requireRole(['Admin']), getAuditLogsHandler)`
  - [ ] Adicionar: `router.get('/audit-logs/export', authMiddleware, requireRole(['Admin']), exportAuditLogsCsvHandler)`
  - [ ] **ATENÇÃO:** Rota `/audit-logs/export` deve vir ANTES de `/audit-logs` se usar wildcard — mas aqui são caminhos distintos, ordem não importa

- [ ] **Task 4 — Backend: lib/validators.ts — adicionar schema de validação** (AC1)
  - [ ] Não é obrigatório schema Joi para GET (query params) mas validar tipos mínimos no controller
  - [ ] Opcional: `auditLogsQuerySchema` se seguir padrão dos outros validators

- [ ] **Task 5 — Frontend: types/index.ts — adicionar interfaces** (AC4, AC5)
  - [ ] Interface `AuditLog`: `{ logId: string, actorId?: string, actorName?: string, action: string, resourceType: string, resourceId: string, timestamp: string, ipAddress?: string, changesJson?: any }`
  - [ ] Interface `AuditLogsResponse`: `{ logs: AuditLog[], total: number, page: number, totalPages: number }`
  - [ ] Interface `AuditLogFilter`: `{ userId?: string, action?: string, resourceType?: string, dateFrom?: string, dateTo?: string }`

- [ ] **Task 6 — Frontend: services/api.service.ts — adicionar métodos** (AC1, AC2)
  - [ ] `getAuditLogs(filter: AuditLogFilter, page: number, limit: number): Observable<AuditLogsResponse>`
    - GET `/api/admin/audit-logs` com query params construídos dos filtros não vazios
    - Usar `this.getHeaders()` (autenticado)
  - [ ] `exportAuditLogsCsv(filter: AuditLogFilter): Observable<Blob>`
    - GET `/api/admin/audit-logs/export` com mesmos filtros
    - `responseType: 'blob'` para download
    - Usar `this.getHeaders()`

- [ ] **Task 7 — Frontend: components/audit-log/ (NOVO COMPONENTE)** (AC4-AC7)
  - [ ] `audit-log.component.ts`:
    - `standalone: false`
    - `FormGroup` com campos: `userId`, `action`, `resourceType`, `dateFrom`, `dateTo`
    - Propriedades: `logs: AuditLog[]`, `total: number`, `page: number`, `totalPages: number`, `isLoading: boolean`, `isExporting: boolean`, `errorMessage: string`
    - `ngOnInit()` → chama `loadLogs()`
    - `loadLogs()` → lê FormGroup, chama `apiService.getAuditLogs(filters, page, 50)`, popula `logs`
    - `applyFilters()` → reseta page=1, chama `loadLogs()`
    - `clearFilters()` → reseta FormGroup, chama `loadLogs()`
    - `goToPage(n: number)` → atualiza page, chama `loadLogs()`
    - `exportCsv()` → chama `apiService.exportAuditLogsCsv(filters)`, cria blob URL, dispara download programaticamente
    - `getActionColor(action: string): string` → retorna 'green' | 'yellow' | 'red' baseado no tipo de ação
    - `getActionLabel(action: string): string` → retorna texto amigável PT-BR da ação
    - `formatTimestamp(ts: string): string` → formata para `pt-BR` com `new Date(ts).toLocaleString('pt-BR')`
  - [ ] `audit-log.component.html`:
    - Header com título "🔍 Log de Auditoria LGPD" e botão "← Voltar ao Dashboard"
    - Painel de filtros: campos de formulário + botões "Aplicar" e "Limpar"
    - Contador de resultados: "X registros encontrados"
    - Botão "Exportar LGPD (CSV)" com ícone de loading quando `isExporting`
    - Timeline: `*ngFor="let log of logs"` listando cada entrada com ícone colorido
    - Paginação: botões Anterior/Próxima + info "Página X de Y"
    - Estado vazio (`logs.length === 0 && !isLoading`): "Nenhum registro encontrado para os filtros aplicados"
    - Estado loading: spinner ou texto de carregamento
  - [ ] `audit-log.component.scss`:
    - Container com padrão `background-color: #f5f5f5` igual ao admin-dashboard
    - Header com mesmo gradient: `linear-gradient(135deg, #0052cc 0%, #ff6b35 100%)`
    - `.filter-panel`: card branco com border-radius, padding
    - `.timeline-entry`: flex row, borda esquerda colorida por severidade (verde/amarelo/vermelho)
    - `.action-badge`: badge colorido inline
    - `.pagination`: botões de navegação
    - `.export-btn`: botão de destaque (azul)

- [ ] **Task 8 — Frontend: app.module.ts — declarar componente** (AC4)
  - [ ] Import `AuditLogComponent` de `./components/audit-log/audit-log.component`
  - [ ] Adicionar `AuditLogComponent` no array `declarations`
  - [ ] Verificar que `ReactiveFormsModule` já está importado (está — usado em outros componentes)

- [ ] **Task 9 — Frontend: app.routing.module.ts — adicionar rota** (AC4)
  - [ ] Import `AuditLogComponent`
  - [ ] Adicionar rota: `{ path: 'admin/audit-logs', component: AuditLogComponent, canActivate: [AuthGuard, RoleGuard] }`
  - [ ] Inserir junto com as outras rotas `/admin/*`

- [ ] **Task 10 — Frontend: admin-dashboard.component.ts + .html — botão de navegação** (AC8)
  - [ ] Em `admin-dashboard.component.ts`: adicionar método `goToAuditLogs(): void { this.router.navigate(['/admin/audit-logs']); }`
  - [ ] Em `admin-dashboard.component.html`: adicionar botão `<button class="action-btn" (click)="goToAuditLogs()">🔍 Log de Auditoria LGPD</button>` na section `.actions > .action-buttons`

- [ ] **Task 11 — Testes de integração: backend/src/tests/audit-lgpd.test.ts (NOVO)** (AC1, AC2, AC3)
  - [ ] Setup: criar academia, usuário Admin, gerar alguns logs via `logAudit()` diretamente
  - [ ] Teste 1: "lista audit logs sem filtros retorna paginação correta"
    - Cria 3 logs, GET `/api/admin/audit-logs`, verifica `{ logs: [...], total: 3, page: 1, totalPages: 1 }`
  - [ ] Teste 2: "filtra por action retorna apenas logs correspondentes"
    - Cria logs com actions distintas, filtra por uma action específica
  - [ ] Teste 3: "filtra por dateFrom e dateTo"
  - [ ] Teste 4: "exportação CSV retorna Content-Type text/csv com dados corretos"
  - [ ] Teste 5: "consulta ao audit log gera entrada AUDIT_LOG_VIEWED"
  - [ ] Padrão de teste: seguir `backend/src/tests/consent-versioning.test.ts` (supertest, beforeAll/afterAll com resetDatabase)

## Dev Notes

### O que JÁ EXISTE — Não Reinventar

```typescript
// backend/src/lib/audit.ts — EXISTENTE
export const logAudit = (userId, action, entity, entityId, academyId, ip?, details?) => { ... }
export const getAuditLogsByAcademy = async (academyId: string): Promise<AuditLog[]>  // sem filtros
export const getAuditLogsByUser = async (userId: string): Promise<AuditLog[]>        // sem filtros

// Interface AuditLog atual (ESTENDER, não substituir):
interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;         // mapeia para resource_type
  entityId: string;       // mapeia para resource_id
  academyId: string;
  timestamp: Date;
  ipAddress?: string;
  details?: Record<string, any>;
}
```

### Schema da Tabela audit_logs (DB Real)

```sql
CREATE TABLE audit_logs (
  log_id        BIGSERIAL PRIMARY KEY,
  academy_id    UUID NOT NULL REFERENCES academies(academy_id),
  resource_type VARCHAR(100) NOT NULL,     -- ex: "ConsentTemplate", "consent", "HealthRecord"
  resource_id   VARCHAR(100) NOT NULL,     -- UUID ou identificador do recurso afetado
  action        VARCHAR(50) NOT NULL,      -- ex: "CONSENT_SIGNED", "CONSENT_TEMPLATE_PUBLISHED"
  actor_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  changes_json  JSONB,                     -- detalhes da ação (o "WHY")
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  timestamp     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  retention_until TIMESTAMP,              -- já definido como NOW() + 7 years no logAudit()
  CONSTRAINT resource_id_not_empty CHECK (length(trim(resource_id)) > 0)
);

-- Índices já existentes:
CREATE INDEX idx_audit_logs_academy ON audit_logs(academy_id, timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
```

### Query SQL para getAuditLogsFiltered (Técnica de WHERE Dinâmico)

```typescript
export const getAuditLogsFiltered = async (
  academyId: string,
  filters: AuditFilters,
  pagination: { page: number; limit: number }
): Promise<{ logs: AuditLog[]; total: number }> => {
  const conditions: string[] = ['al.academy_id = $1'];
  const params: any[] = [academyId];
  let paramIdx = 2;

  if (filters.userId) {
    conditions.push(`al.actor_user_id = $${paramIdx++}`);
    params.push(filters.userId);
  }
  if (filters.action) {
    conditions.push(`al.action = $${paramIdx++}`);
    params.push(filters.action);
  }
  if (filters.resourceType) {
    conditions.push(`al.resource_type = $${paramIdx++}`);
    params.push(filters.resourceType);
  }
  if (filters.dateFrom) {
    conditions.push(`al.timestamp >= $${paramIdx++}`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push(`al.timestamp <= $${paramIdx++}`);
    params.push(filters.dateTo);
  }

  const where = conditions.join(' AND ');
  const offset = (pagination.page - 1) * pagination.limit;

  const [dataRes, countRes] = await Promise.all([
    pool.query(
      `SELECT al.*, u.full_name AS actor_name
       FROM audit_logs al
       LEFT JOIN users u ON u.user_id = al.actor_user_id
       WHERE ${where}
       ORDER BY al.timestamp DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, pagination.limit, offset]
    ),
    pool.query(`SELECT COUNT(*) FROM audit_logs al WHERE ${where}`, params),
  ]);

  const total = parseInt(countRes.rows[0].count, 10);
  return { logs: dataRes.rows.map(rowToAuditLog), total };
};
```

**ATENÇÃO:** Nos testes, `actor_user_id` é NOT NULL — garantir que `logAudit` é chamado com UUID válido de usuário existente (não 'SYSTEM').

### Mapeamento Row → AuditLog (atualizar rowToAuditLog)

```typescript
// Adicionar actorName ao mapeamento:
const rowToAuditLog = (row: any): AuditLog => ({
  id: String(row.log_id),
  userId: row.actor_user_id,
  actorName: row.actor_name || undefined,   // ← NOVO (do JOIN)
  action: row.action,
  entity: row.resource_type,
  entityId: row.resource_id,
  academyId: row.academy_id,
  timestamp: row.timestamp,
  ipAddress: row.ip_address,
  details: row.changes_json,
});
```

### Geração de CSV no Backend

```typescript
const toCsvLine = (fields: string[]): string =>
  fields.map(f => `"${String(f ?? '').replace(/"/g, '""')}"`).join(',');

const headers = ['Data/Hora', 'Usuário', 'ID Usuário', 'Ação', 'Recurso', 'Tipo Recurso', 'IP', 'Detalhes'];
const rows = logs.map(log => [
  new Date(log.timestamp).toLocaleString('pt-BR'),
  log.actorName ?? '',
  log.userId ?? '',
  log.action,
  log.entityId,
  log.entity,
  log.ipAddress ?? '',
  log.details ? JSON.stringify(log.details) : '',
]);

const csv = [toCsvLine(headers), ...rows.map(toCsvLine)].join('\n');
const filename = `auditoria-lgpd-${new Date().toISOString().slice(0,10)}.csv`;

res.setHeader('Content-Type', 'text/csv; charset=utf-8');
res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
return res.send('\uFEFF' + csv); // BOM para Excel PT-BR reconhecer UTF-8
```

### Download de CSV no Frontend (sem biblioteca)

```typescript
exportCsv(): void {
  this.isExporting = true;
  const filters = this.buildFilters();
  this.apiService.exportAuditLogsCsv(filters).subscribe({
    next: (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria-lgpd-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.isExporting = false;
    },
    error: () => {
      this.errorMessage = 'Erro ao exportar arquivo. Tente novamente.';
      this.isExporting = false;
    }
  });
}

// No ApiService:
exportAuditLogsCsv(filter: AuditLogFilter): Observable<Blob> {
  const params = this.buildQueryParams(filter);
  return this.http.get(`${this.apiUrl}/admin/audit-logs/export`, {
    headers: this.getHeaders(),
    responseType: 'blob',
    params,
  });
}
```

### Lógica de Cor por Ação (para timeline)

```typescript
getActionColor(action: string): 'green' | 'yellow' | 'red' {
  const critical = ['CONSENT_TEMPLATE_PUBLISHED', 'DATA_DELETED', 'RECONSENT_EMAIL_FAILED'];
  const warning  = ['CONSENT_SIGNED', 'CONSENT_EMAIL_SENT', 'RECONSENT_EMAIL_SENT', 'CONSENT_TEMPLATE_PUBLISHED'];
  if (critical.includes(action)) return 'red';
  if (warning.includes(action))  return 'yellow';
  return 'green'; // AUDIT_LOG_VIEWED, etc.
}

getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    CONSENT_SIGNED: 'Consentimento assinado',
    CONSENT_EMAIL_SENT: 'Email de consentimento enviado',
    CONSENT_TEMPLATE_PUBLISHED: 'Template de consentimento publicado',
    RECONSENT_EMAIL_SENT: 'Email de reconsentimento enviado',
    RECONSENT_EMAIL_FAILED: 'Falha no envio de email',
    RECONSENT_NO_EMAIL: 'Email de responsável não cadastrado',
    AUDIT_LOG_VIEWED: 'Log de auditoria consultado',
    AUDIT_LOG_EXPORTED: 'Log de auditoria exportado',
  };
  return labels[action] ?? action;
}
```

### Padrões de Código Obrigatórios

**Backend — seguir exatamente os padrões de `backend/src/`:**
- Funções exportadas (sem classes), ex: `export const getAuditLogsHandler = async (req: AuthenticatedRequest, res: Response) => { ... }`
- Pool importado de `./db` (não de `./database`)
- Erros retornados como: `res.status(xxx).json({ error: 'mensagem' })`
- Sem classes `AppError`, sem `sendResponse()` helper
- Tipos: `AuthenticatedRequest` de `../types` para rotas autenticadas
- JWT payload: `req.user!.userId` e `req.user!.academyId`
- Roles com inicial maiúscula: `'Admin'`, `'Professor'`, `'Aluno'`, `'Responsavel'`
- Audit: `logAudit(userId, action, entity, entityId, academyId, ip?, details?)` de `lib/audit.ts`

**Frontend — seguir exatamente os padrões de `frontend/src/`:**
- `standalone: false` em todos os componentes
- `ReactiveFormsModule` + `FormBuilder` (sem Template-driven forms)
- `ApiService` injetado via constructor (HttpClient encapsulado)
- CSS: header com blue gradient (`linear-gradient(135deg, #0052cc 0%, #ff6b35 100%)`) + corpo com `#f5f5f5` — copiar estrutura de `admin-dashboard.component.scss`
- Angular 21 — sem `@defer`, sem standalone components, sem signals

### Estrutura de Arquivos

**Novos arquivos no backend:**
```
backend/src/controllers/adminAudit.ts     ← handlers GET audit-logs e export
backend/src/tests/audit-lgpd.test.ts      ← suite de testes integração
```

**Arquivos existentes a modificar:**
```
backend/src/lib/audit.ts                  ← adicionar getAuditLogsFiltered + getAuditLogsCsv + atualizar AuditLog interface
backend/src/routes/admin.ts              ← adicionar 2 rotas de auditoria
```

**Novos arquivos no frontend:**
```
frontend/src/components/audit-log/
  audit-log.component.ts
  audit-log.component.html
  audit-log.component.scss
```

**Arquivos existentes a modificar:**
```
frontend/src/types/index.ts               ← adicionar AuditLog, AuditLogsResponse, AuditLogFilter
frontend/src/services/api.service.ts      ← adicionar getAuditLogs + exportAuditLogsCsv
frontend/src/app.module.ts               ← declarar AuditLogComponent
frontend/src/app.routing.module.ts       ← rota /admin/audit-logs
frontend/src/components/admin-dashboard/admin-dashboard.component.ts  ← goToAuditLogs()
frontend/src/components/admin-dashboard/admin-dashboard.component.html ← botão de navegação
```

### Schema do Banco — Nenhuma Migração Necessária

A tabela `audit_logs` já existe com todos os campos necessários. **Não criar migration para esta story.** Os dados já estão sendo gravados desde Story 2.2.

### Segurança

- Endpoint `/api/admin/audit-logs` protegido por `authMiddleware` + `requireRole(['Admin'])` — somente Admin da própria academia
- `academiId` sempre vem de `req.user!.academyId` (JWT) — nunca do query param (evitar IDOR)
- Validar `limit` máximo de 200 para evitar dump grande via UI (exportação tem limite = 10.000)
- CSV: usar função de escape para evitar CSV injection (já incluída acima no `toCsvLine`)

### Referências Críticas

- Schema audit_logs real: `_bmad-output/schema.sql` (linhas 462-481)
- Função logAudit existente: `backend/src/lib/audit.ts`
- Rotas admin existentes: `backend/src/routes/admin.ts`
- Padrão controller admin: `backend/src/controllers/adminConsent.ts`
- Padrão componente admin: `frontend/src/components/admin-dashboard/admin-dashboard.component.ts`
- Padrão scss admin: `frontend/src/components/admin-dashboard/admin-dashboard.component.scss`
- Padrão roteamento: `frontend/src/app.routing.module.ts`
- Padrão ApiService: `frontend/src/services/api.service.ts`
- Padrão tipos frontend: `frontend/src/types/index.ts`
- Padrão testes: `backend/src/tests/consent-versioning.test.ts`
- FRs de origem: `_bmad-output/implementation-artifacts/FunctionalRequirements-SCAdemia.md` (FR45-FR50)

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

- Implementado backend de consulta e exportação CSV em adminAudit.ts.
- Estendido lib/audit.ts com filtros, paginação e export de até 10.000 linhas.
- Criado componente Angular audit-log com filtros, timeline, paginação e download CSV.
- Adicionado teste de integração backend para consulta e exportação de auditoria.
- Validação concluída com backend tsc, frontend tsc, frontend ng build e teste audit-lgpd.

### Completion Notes List

- Endpoint GET /api/admin/audit-logs implementado com filtros por usuário, ação, recurso e período.
- Endpoint GET /api/admin/audit-logs/export implementado com geração CSV e BOM UTF-8.
- Consultas e exportações do próprio audit log passam a registrar AUDIT_LOG_VIEWED e AUDIT_LOG_EXPORTED.
- Dashboard admin recebeu navegação para a nova tela de auditoria LGPD.
- Frontend entrega filtros, timeline reversa, paginação e exportação com o padrão visual existente.

### File List

- backend/src/lib/audit.ts
- backend/src/controllers/adminAudit.ts
- backend/src/routes/admin.ts
- backend/src/tests/audit-lgpd.test.ts
- frontend/src/types/index.ts
- frontend/src/services/api.service.ts
- frontend/src/components/audit-log/audit-log.component.ts
- frontend/src/components/audit-log/audit-log.component.html
- frontend/src/components/audit-log/audit-log.component.scss
- frontend/src/app.module.ts
- frontend/src/app.routing.module.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.html
