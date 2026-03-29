# Story 5.2: Auditoria LGPD — Timeline de Acessos & Logs

Status: done

## Story

Como um Admin,
Quero ver a timeline de TODOS os acessos a dados pessoais com filtros avançados, detalhamento por log e exportação assinada,
Para que eu demonstre conformidade LGPD completa para reguladores.

## Contexto de Negócio

- Esta story é a continuação direta da Story 5.1 (Dashboard Admin): o dashboard já exibe um resumo de auditoria e possui CTA navegando para `/admin/audit-logs`. O componente `AuditLogComponent` já existe e está funcional em `frontend/src/components/audit-log/`. Esta story não recria o componente — **evolui** o que existe, adicionando as capacidades ausentes exigidas pelos ACs desta story.
- O backend de auditoria já está implementado:
  - `backend/src/controllers/adminAudit.ts` — `getAuditLogsHandler` e `exportAuditLogsCsvHandler`
  - `backend/src/lib/audit.ts` — `getAuditLogsFiltered`, `getAuditLogsCsv`, `logAudit`
  - `backend/src/routes/admin.ts` — `GET /api/admin/audit-logs` e `GET /api/admin/audit-logs/export`
- O `AuditLogComponent` existente já cobre: filtros básicos (userId, action, resourceType, dateFrom, dateTo), paginação (50/página), exibição de timeline, exportação CSV, e navegação de volta ao dashboard.
- **O que FALTA e deve ser implementado nesta story:**
  1. Clique num log para expandir detalhes completos (campos antes/depois, user-agent, resultado Success/Denied)
  2. Destaque visual de logs anômalos (⚠️ vermelho + badge) e ação sugerida [Bloquear Usuário?] / [Investigar]
  3. Resultado explícito por log: "✓ Success" | "✗ Denied" (hoje não exibido na timeline)
  4. IP + Navegador exibidos no log (o campo `user_agent` existe na tabela `audit_logs` mas não é retornado pelo backend)
  5. Filtro "Resultado" (Success/Denied) no painel de filtros
  6. Exportação em PDF (além do CSV já existente) com cabeçalho, tabela e rodapé
  7. Imutabilidade explicitada na UI: mensagem "Logs são imutáveis por lei" ao tentar qualquer operação de escrita
  8. Ampliação das opções de Ação e Recurso nos filtros para cobrir todos os tipos relevantes do Epic 3, 4 e 5

## Acceptance Criteria

1. Dado que Admin acessa `/admin/audit-logs`, quando a página carrega, então exibe título "Timeline de Acessos a Dados Sensíveis" com lista de logs ordenada por mais recente primeiro e paginação de 50 por página.

2. Dado que a timeline carrega, quando renderiza cada log, então exibe obrigatoriamente: timestamp formatado ("19 Mar 2026 - 15:47:32"), nome + role do usuário, action badge colorido, tipo de recurso, resultado ("✓ Success" | "✗ Denied"), e IP de origem.

3. Dado que há 1000+ logs, quando a página renderiza, então usa paginação (50 por página) com controles de navegação, e filtros ficam fixos no topo da área de conteúdo.

4. Dado que Admin clica em "[Filtros Avançados]", quando o painel expande, então exibe: Período (data início/fim), Usuário (texto com autocomplete), Ação (checkboxes múltiplos), Recurso ([health] [attendance] [notes] [all]), e Resultado ([Success] [Denied] [All]).

5. Dado que Admin aplica filtro "Ação = DELETE, Última semana", quando aplica, então a lista é atualizada e exibe contador de resultados encontrados.

6. Dado que Admin clica em um log específico, quando clica, então expande inline para mostrar: timestamp preciso, Usuário ID + nome + role, ação detalhada, campo alterado (antes → depois), IP de origem + User-Agent do navegador, e resultado com motivo se negado.

7. Dado que Admin quer exportar auditoria, quando clica "[Exportar]", então exibe dropdown com opções "CSV" e "PDF"; ao selecionar CSV baixa o arquivo existente; ao selecionar PDF gera arquivo PDF com cabeçalho (academia, período), tabela de logs e rodapé (data de geração, versão).

8. Dado que Admin exporta PDF, quando o arquivo é gerado, então o nome do arquivo é `Auditoria_LGPD_YYYY-MM-DD.pdf` e o conteúdo inclui cabeçalho institucional, tabela de logs e rodapé com metadados.

9. Dado que Admin tenta modificar/deletar um log (impossível pela UI mas possível via API direta), quando qualquer tentativa é detectada, então a operação é bloqueada no backend e a UI exibe: "Logs de auditoria são imutáveis por lei". A tabela `audit_logs` é append-only.

10. Dado que há anomalia detectada (≥ 10 tentativas DELETE/EXPORT em 1 min do mesmo usuário ou IP), quando Admin visualiza a timeline, então os logs anômalos ficam destacados em vermelho com ícone ⚠️ e CTA "[Bloquear Usuário?]" ou "[Investigar]".

11. Dado que Admin filtra por "Usuário = João Silva", quando aplica, então vê todos os acessos daquele usuário com o que acessou, quando, se teve sucesso, e de qual IP.

## Tasks / Subtasks

- [x] Estender o backend para retornar `user_agent` e campo `outcome` (AC: 2, 6, 11)
  - [x] Em `backend/src/lib/audit.ts`, adicionar `userAgent?: string` na interface `AuditLog` e no mapeamento `rowToAuditLog` (campo `user_agent` já existe na tabela).
  - [x] Em `backend/src/controllers/adminAudit.ts`, incluir `userAgent: log.userAgent` no objeto de resposta de cada log em `getAuditLogsHandler`.
  - [x] Adicionar campo `outcome` derivado: inferir "SUCCESS" ou "DENIED" a partir do `action` (ações terminadas em `_FAILED`, `_DENIED` → DENIED; demais → SUCCESS). Expor como `outcome: 'SUCCESS' | 'DENIED'` no payload do log.
  - [x] Adicionar suporte ao filtro `outcome` em `AuditFilters` em `backend/src/lib/audit.ts`: filtrar por sufixo de action quando `outcome` é passado.
  - [x] Adicionar `outcome?: 'SUCCESS' | 'DENIED'` em `parseFilters` em `adminAudit.ts` e repassar ao `getAuditLogsFiltered`.

- [x] Implementar endpoint `GET /api/admin/audit-logs/export-pdf` para exportação em PDF (AC: 7, 8)
  - [x] Criar função `getAuditLogsPdf` em `backend/src/lib/audit.ts` (ou arquivo `backend/src/lib/auditPdf.ts`) que recebe academyId, filters, academyName e gera buffer PDF usando `pdfkit` (já instalado).
  - [x] Estrutura do PDF: cabeçalho (logo textual, nome da academia, período, timestamp de geração), tabela de logs (timestamp, usuário, ação, recurso, resultado, IP), rodapé com versão e assinatura RSA-2048 usando `node-rsa` (já instalado).
  - [x] Criar handler `exportAuditLogsPdfHandler` em `backend/src/controllers/adminAudit.ts`.
  - [x] Registrar rota `GET /api/admin/audit-logs/export-pdf` antes da rota `/audit-logs` em `backend/src/routes/admin.ts` (ordem importa: rota com prefixo `/export-pdf` deve vir antes de `:id` genérico se houver).

- [x] Implementar detecção de anomalias no backend (AC: 10)
  - [x] Criar função `getAnomalyFlags` em `backend/src/lib/audit.ts`: agrupa logs por `(actor_user_id, action)` em janela de 1 min e retorna `log_ids[]` com contagem ≥ 10.
  - [x] Incluir `anomalyFlag: boolean` no mapeamento de cada log no `getAuditLogsHandler` — consultar `getAnomalyFlags` com os `log_ids` do conjunto atual e marcar.
  - [x] Para performance: calcular flags apenas sobre os logs da página atual (máx 50), não sobre todo o dataset.

- [x] Estender tipos frontend para novos campos (AC: 2, 6, 10)
  - [x] Em `frontend/src/types/index.ts`, adicionar à interface `AuditLogEntry`: `userAgent?: string`, `outcome?: 'SUCCESS' | 'DENIED'`, `anomalyFlag?: boolean`.
  - [x] Adicionar `outcome?: 'SUCCESS' | 'DENIED'` à interface `AuditLogFilter`.
  - [x] Adicionar `exportAuditLogsPdf` ao `ApiService` em `frontend/src/services/api.service.ts`.

- [x] Evoluir `AuditLogComponent` — expandir detalhe de log (AC: 6)
  - [x] Adicionar propriedade `expandedLogId: string | null = null` no componente.
  - [x] Adicionar método `toggleLogDetail(logId: string)` que alterna `expandedLogId`.
  - [x] No template `audit-log.component.html`, adicionar bloco `*ngIf="expandedLogId === log.logId"` mostrando: timestamp preciso, usuário completo (ID + nome + role), ação detalhada, `changesJson` formatado como "campo: [antes] → [depois]", IP + User-Agent, resultado com label e motivo se negado.

- [x] Evoluir `AuditLogComponent` — resultado por log e destaque de anomalias (AC: 2, 10)
  - [x] Na coluna do timeline, exibir sempre o badge de resultado usando `log.outcome`: "✓ Success" (verde) ou "✗ Denied" (vermelho).
  - [x] Adicionar classe CSS `timeline-item--anomaly` quando `log.anomalyFlag === true`, aplicando borda vermelha e fundo levemente rosado.
  - [x] Incluir ícone ⚠️ e CTA `[Bloquear Usuário?]` (navega para `/admin/users` com filtro) ou `[Investigar]` (abre detalhe do log) quando `anomalyFlag` for `true`.

- [x] Evoluir `AuditLogComponent` — filtros ampliados (AC: 4, 5, 11)
  - [x] Ampliar `actionOptions` para incluir ações de treino (TRAINING_CREATED, TRAINING_UPDATED, TRAINING_ATTENDANCE_MARKED), LGPD (DATA_DELETION_REQUESTED, DATA_DELETED, HEALTH_RECORD_VIEWED, HEALTH_RECORD_UPDATED) e admin (ADMIN_DASHBOARD_VIEWED, COMPLIANCE_REPORT_GENERATED).
  - [x] Ampliar `resourceOptions` para incluir: `training`, `student_health`, `training_attendance`, `performance_notes`.
  - [x] Adicionar filtro `outcome` (All / Success / Denied) ao `filterForm` e ao payload de `loadLogs()`.

- [x] Evoluir `AuditLogComponent` — exportação PDF (AC: 7, 8)
  - [x] Renomear botão "⬇ Exportar CSV" para "⬇ Exportar" com dropdown (Angular `<select>` ou botão split).
  - [x] Adicionar método `exportPdf()` que chama `this.api.exportAuditLogsPdf(filter)` e faz download do blob com nome `Auditoria_LGPD_YYYY-MM-DD.pdf`.
  - [x] Manter `exportCsv()` existente sem alteração.

- [x] Garantir imutabilidade explícita na UI (AC: 9)
  - [x] Remover ou ocultar qualquer botão de editar/deletar log (nenhum existe hoje, confirmar).
  - [x] Adicionar tooltip ou nota de rodapé na seção de resultados: "Logs de auditoria são imutáveis por lei (LGPD Art. 37)."

- [x] Atualizar estilos SCSS (AC: 2, 10)
  - [x] Em `audit-log.component.scss`, adicionar: `.outcome-success` (verde), `.outcome-denied` (vermelho), `.timeline-item--anomaly` (borda vermelha + fundo #fff5f5), `.anomaly-badge` (ícone ⚠️ laranja).

- [x] Testes frontend (AC: 2, 4, 6, 7, 10)
  - [x] Teste: timeline exibe `outcome` badge com classe correta para SUCCESS e DENIED.
  - [x] Teste: clicar num log expande o detalhe; clicar novamente fecha.
  - [x] Teste: log com `anomalyFlag = true` recebe classe `timeline-item--anomaly` e exibe ⚠️.
  - [x] Teste: dropdown de exportar exibe opções CSV e PDF; método `exportPdf()` é chamado ao clicar PDF.
  - [x] Teste: filtro `outcome` é incluído nos params da chamada API.

- [x] Testes backend (AC: 2, 6, 10)
  - [x] Teste: `getAuditLogsHandler` retorna `userAgent` e `outcome` por log.
  - [x] Teste: filtro `outcome=DENIED` retorna apenas logs com actions terminadas em `_FAILED` ou `_DENIED`.
  - [x] Teste: `exportAuditLogsPdfHandler` retorna `Content-Type: application/pdf` com status 200.
  - [x] Teste: `getAnomalyFlags` identifica corretamente sequência de 10+ ações em 1 min.

## Dev Notes

### Estado atual do código — o que já existe e NÃO deve ser recriado

| Arquivo | Status | Observação |
|---------|--------|-----------|
| `frontend/src/components/audit-log/audit-log.component.ts` | ✅ Existe | Filtros básicos, paginação 50/pág, exportação CSV, timeline básica |
| `frontend/src/components/audit-log/audit-log.component.html` | ✅ Existe | Timeline + filtros básicos + paginação + export CSV |
| `frontend/src/components/audit-log/audit-log.component.scss` | ✅ Existe | Estilos action-badge por tipo de ação |
| `backend/src/controllers/adminAudit.ts` | ✅ Existe | `getAuditLogsHandler` + `exportAuditLogsCsvHandler` |
| `backend/src/lib/audit.ts` | ✅ Existe | `getAuditLogsFiltered`, `getAuditLogsCsv`, `logAudit`, `AuditFilters` |
| `backend/src/routes/admin.ts` | ✅ Existe | `/audit-logs` + `/audit-logs/export` registrados |
| `frontend/src/services/api.service.ts` | ✅ Existe | `getAuditLogs()` + `exportAuditLogsCsv()` |
| `frontend/src/types/index.ts` | ✅ Existe | `AuditLogEntry`, `AuditLogsResponse`, `AuditLogFilter` |

### Gaps concretos a implementar

**Backend:**

1. **`user_agent` não retornado**: O campo `user_agent` existe na tabela `audit_logs` (schema.sql linha 471) mas não está mapeado em `rowToAuditLog` (lib/audit.ts) nem projetado no payload do controller. Precisa ser adicionado em ambos.

2. **`outcome` derivado ausente**: A diferenciação de Success/Denied não existe. Estratégia: inferir a partir do sufixo da `action`. Actions terminadas em `_FAILED`, `_DENIED`, `_BLOCKED`, `_REJECTED` → `DENIED`; demais → `SUCCESS`. Implementar como função utilitária `inferOutcome(action: string): 'SUCCESS' | 'DENIED'`.

3. **Filtro `outcome` ausente**: `AuditFilters` não possui `outcome`. Adicionar campo e aplicar no WHERE via lista de ações conhecidas como DENIED, ou via ILIKE de sufixos.

4. **Exportação PDF ausente**: `pdfkit` (v0.18.0) e `node-rsa` (v1.1.1) já estão instalados. Criar endpoint `GET /api/admin/audit-logs/export-pdf`. Gerar PDF com estrutura: cabeçalho, tabela, rodapé + assinatura RSA do hash do conteúdo.

5. **Detecção de anomalias ausente**: Implementar com query SQL agrupada; manter simples e restrita à página atual para não impactar performance.

### Padrões do projeto a seguir

**Backend:**
- Controladores em `backend/src/controllers/*.ts` importam de `backend/src/lib/*.ts`
- `AuthenticatedRequest` de `backend/src/types` para acesso a `req.user!.academyId` e `req.user!.userId`
- `logAudit(userId, action, entity, entityId, academyId, req.ip, details)` — fire-and-forget, não await
- Validação de UUID: `isValidUUID` local em `lib/audit.ts` (padrão `8-4-4-4-12`)
- Paginação: `parsePagination(req.query)` com `min=1, max=200, default=50`
- Multi-tenant: **sempre** filtrar por `academyId` do `req.user!`

**Frontend (Angular):**
- Componentes standalone: `false` — usar declaração em `AppModule` (`frontend/src/app.module.ts`)
- Rotas protegidas: `[AuthGuard, RoleGuard]` em `frontend/src/app.routing.module.ts`
- Formulários: `ReactiveFormsModule` com `FormBuilder`
- HTTP: usar `ApiService` (injetar via construtor), nunca `HttpClient` diretamente no componente
- Cores obrigatórias: primary `#0052CC`, secondary `#FF6B35`, success `#28A745`, warning `#F57C00` (não `#FFC107`), error `#D32F2F`

**Exportação PDF — pdfkit API (v0.18+):**
```typescript
import PDFDocument from 'pdfkit';
const doc = new PDFDocument({ margin: 50 });
doc.fontSize(18).text('Auditoria LGPD — SCAcademia', { align: 'center' });
doc.moveDown();
// ... adicionar rows
const buffers: Buffer[] = [];
doc.on('data', (chunk: Buffer) => buffers.push(chunk));
doc.on('end', () => resolve(Buffer.concat(buffers)));
doc.end();
```

**Assinatura RSA — node-rsa (v1.1.1):**
```typescript
import NodeRSA from 'node-rsa';
// Gerar chave efêmera para fins de integridade (não-repúdio real requer chave persistente)
const key = new NodeRSA({ b: 2048 });
const hash = crypto.createHash('sha256').update(content).digest('hex');
const signature = key.sign(hash, 'base64');
```
> **Nota de escopo:** A assinatura RSA na exportação é de integridade de documento, não de não-repúdio legal completo. Esta story implementa o MVP da assinatura. Uma PKI real com chave persistente pode ser endereçada em story separada ou na Epic 8.

### Estrutura da tabela `audit_logs` (referência)

```sql
CREATE TABLE audit_logs (
  log_id        BIGSERIAL PRIMARY KEY,
  academy_id    UUID NOT NULL REFERENCES academies(academy_id),
  resource_type VARCHAR(100) NOT NULL,
  resource_id   VARCHAR(100) NOT NULL,
  action        VARCHAR(50) NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  changes_json  JSONB,
  ip_address    VARCHAR(45),
  user_agent    TEXT,           -- ← presente na tabela, não retornado hoje
  timestamp     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  retention_until TIMESTAMP,
  CONSTRAINT resource_id_not_empty CHECK (length(trim(resource_id)) > 0)
);
-- Índices existentes:
-- idx_audit_logs_academy ON (academy_id, timestamp DESC)
-- idx_audit_logs_resource ON (resource_type, resource_id)
-- idx_audit_logs_actor ON (actor_user_id)
-- idx_audit_logs_timestamp ON (timestamp DESC)
```

### Inferência de `outcome` (lógica de classificação)

```typescript
const DENIED_SUFFIXES = ['_FAILED', '_DENIED', '_BLOCKED', '_REJECTED', '_UNAUTHORIZED'];

export const inferOutcome = (action: string): 'SUCCESS' | 'DENIED' => {
  const upper = action.toUpperCase();
  return DENIED_SUFFIXES.some(s => upper.endsWith(s)) ? 'DENIED' : 'SUCCESS';
};
```

Ações conhecidas que já resultam em DENIED no sistema atual: nenhuma com esses sufixos hoje, mas o padrão deve ser implementado preventivamente para quando forem adicionadas.

### Detecção de anomalias — SQL de referência

```sql
-- Detectar log_ids de ações suspeitas: 10+ eventos do mesmo ator/tipo em 1 min
SELECT actor_user_id, action, COUNT(*) as cnt,
       array_agg(log_id ORDER BY timestamp) as log_ids
FROM audit_logs
WHERE academy_id = $1
  AND log_id = ANY($2::bigint[])   -- restrito aos log_ids da página
GROUP BY actor_user_id, action,
         date_trunc('minute', timestamp)
HAVING COUNT(*) >= 10;
```

### Performance e restrições

- Dashboard admin (Story 5.1) tem meta < 1s. Audit log tem meta de filtro < 200ms per AC.
- Índice `idx_audit_logs_academy` em `(academy_id, timestamp DESC)` suporta a query principal.
- Detecção de anomalias deve ser restrita à página atual (máx 50 rows) para não degradar o endpoint.
- Exportação CSV usa `LIMIT 10000` (existente em `getAuditLogsCsv`). Exportação PDF deve respeitar o mesmo limite.
- `user_agent` pode ser longo (TEXT); no PDF, truncar em 80 chars.

### Imutabilidade — confirmação de design

A tabela `audit_logs` já é append-only por design (nenhum `UPDATE`/`DELETE` no código backend). Não há botão de edição na UI atual. Esta story apenas formaliza a mensagem na interface para conformidade documental.

### Learnings da Story 5.1

- O `ApiService` já possui `buildAuditQueryParams` helper — reutilizar ao adicionar o parâmetro `outcome`.
- O `AdminDashboard` navega para `/admin/audit-logs` via router; não há necessidade de nova rota.
- A constraint `RESTRICT` em `actor_user_id` significa que usuários com audit logs não podem ser deletados diretamente — o CTA "[Bloquear Usuário?]" deve bloquear (desativar) o usuário, não deletar.
- Não criar second home ou duplicar componente; evoluir `AuditLogComponent` existente.
- O padrão de subscription no frontend usa `subscribe({ next: ..., error: ... })` sem `async/await`.
- `Promise.all` no backend para queries paralelas (padrão do `adminDashboard.ts`).

### Referências

- Story fonte: `_bmad-output/Epics/Epic5/Story-5-2.md`
- Epic overview: `_bmad-output/Epics/Epic5/Epic5.md`
- Story anterior: `_bmad-output/implementation-artifacts/5-1-dashboard-admin.md`
- Projeto context: `_bmad-output/project-context.md`
- Arquitetura: `_bmad-output/planning-artifacts/architect.md` seção 3.5 (Audit Logging)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Schema: `_bmad-output/schema.sql` linhas 461-481
- Admin routes: `backend/src/routes/admin.ts`
- Audit controller: `backend/src/controllers/adminAudit.ts`
- Audit lib: `backend/src/lib/audit.ts`
- Frontend component: `frontend/src/components/audit-log/`
- API Service: `frontend/src/services/api.service.ts`
- Frontend types: `frontend/src/types/index.ts` (interfaces `AuditLogEntry`, `AuditLogsResponse`, `AuditLogFilter`)

## Project Structure Notes

- Nenhuma nova rota Angular é necessária: `/admin/audit-logs` com `AuditLogComponent` já existe em `app.routing.module.ts`.
- Nenhum novo módulo Angular é necessário: `AuditLogComponent` já declarado em `AppModule`.
- Novos arquivos potenciais:
  - `backend/src/lib/auditPdf.ts` (opcional — pode ser colocado direto em `audit.ts` se for conciso)
- Arquivos existentes a modificar:
  - `backend/src/lib/audit.ts` — adicionar `userAgent`, `inferOutcome`, `getAnomalyFlags`, filtro `outcome`
  - `backend/src/controllers/adminAudit.ts` — mapear `userAgent`, `outcome`, `anomalyFlag`; adicionar `exportAuditLogsPdfHandler`
  - `backend/src/routes/admin.ts` — registrar `GET /audit-logs/export-pdf`
  - `frontend/src/types/index.ts` — estender `AuditLogEntry` e `AuditLogFilter`
  - `frontend/src/services/api.service.ts` — adicionar `exportAuditLogsPdf()`
  - `frontend/src/components/audit-log/audit-log.component.ts` — expandir `actionOptions`, `resourceOptions`, adicionar `outcome` filter, `expandedLogId`, `toggleLogDetail`, `exportPdf`
  - `frontend/src/components/audit-log/audit-log.component.html` — bloco de detalhe expandido, badge de outcome, anomaly UI
  - `frontend/src/components/audit-log/audit-log.component.scss` — estilos novos

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- `npm run build` (backend): OK
- `npx ng build --configuration development` (frontend): OK
- `npm test -- src/tests/audit-lgpd.test.ts` (backend): 12/12 passing
- `npm test -- --watch=false --browsers=ChromeHeadless --include src/components/audit-log/audit-log.component.spec.ts` (frontend): TOTAL 173 SUCCESS (inclui o novo spec)

### Completion Notes List

- Implementado `outcome` e `userAgent` no payload de logs de auditoria.
- Implementado filtro `outcome=SUCCESS|DENIED` no backend e frontend.
- Implementada exportação PDF em `/api/admin/audit-logs/export-pdf` com hash SHA-256 e assinatura RSA.
- Implementado destaque de anomalia e expansão de detalhes na timeline.
- Registrado aviso de imutabilidade LGPD na UI.
- Cobertura de testes concluída para frontend (component spec) e backend (`DENIED` + threshold de anomalia).

### File List

- `backend/src/lib/audit.ts`
- `backend/src/controllers/adminAudit.ts`
- `backend/src/routes/admin.ts`
- `backend/src/tests/audit-lgpd.test.ts`
- `frontend/src/types/index.ts`
- `frontend/src/services/api.service.ts`
- `frontend/src/components/audit-log/audit-log.component.ts`
- `frontend/src/components/audit-log/audit-log.component.spec.ts`
- `frontend/src/components/audit-log/audit-log.component.html`
- `frontend/src/components/audit-log/audit-log.component.scss`
