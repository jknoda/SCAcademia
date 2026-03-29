# Story 5.7: Health Monitor — Monitoramento Contínuo

Status: done

## Story

Como um Admin,
Quero monitorar saúde do sistema em tempo real,
Para que eu saiba imediatamente se algo está offline.

## Contexto de Negocio

- Esta story fecha o Epic 5 (Controle Admin) após:
  - 5.1 Dashboard Admin
  - 5.2 Auditoria LGPD
  - 5.3 Relatório de Conformidade
  - 5.4 Alertas em Tempo Real
  - 5.5 Gestão de Usuários
  - 5.6 Backup & Disaster Recovery
- O objetivo é consolidar observabilidade operacional para Admin em uma tela única de saúde do sistema, com status atual, histórico de métricas e ações rápidas.
- A implementação deve reutilizar padrões já existentes de monitoramento e alertas para evitar duplicação de lógica.

## Acceptance Criteria

1. Dado que Admin acessa "Admin > Dashboard > Saúde do Sistema",
   quando clica,
   então exibe página "Health Monitor" com status por componente.

2. Dado o estado normal,
   quando a página carrega,
   então exibe componentes essenciais com indicadores e métricas resumidas:
   - API Server (status, uptime, response)
   - Database (status, connections, last backup)
   - Cache Redis (status, usage, hit rate)
   - Email Service (status, enviados, falhas)
   - Storage (status, espaço usado, backups)

3. Dado que um componente degrada,
   quando o sistema detecta,
   então o status muda para DEGRADED e Admin recebe alerta imediato.

4. Dado que um componente falha completamente,
   quando detectado,
   então o status muda para OFFLINE,
   e dispara alerta crítico (visual e sonoro quando aba ativa) + notificação por email.

5. Dado que Admin visualiza métricas operacionais,
   quando acessa o dashboard,
   então vê gráficos timeseries de 24h para:
   - API Response Time
   - CPU Usage
   - Memory Usage
   - Database Connections

6. Dado que Admin clica "Ver Histórico 30 dias",
   quando abre a visão estendida,
   então exibe séries dos últimos 30 dias e destaca padrões recorrentes.

7. Dado que existe alerta contextual (ex.: CPU alto),
   quando Admin passa o mouse/ver detalhes,
   então tooltip mostra recomendação acionável e link para logs correlatos.

8. Dado que há falha ou inatividade de backup,
   quando detectada,
   então status de backup fica em atenção e exibe ação "Tentar Backup Manual".

## Tasks / Subtasks

- [x] Criar contrato de dados para health monitor (AC: 1, 2, 5, 6)
  - [x] Definir tipos backend/frontend para `HealthComponentStatus`, `HealthSnapshot`, `HealthTimeseriesPoint`, `HealthAlertHint`.
  - [x] Padronizar status em enum: `ok|degraded|offline|warning`.
  - [x] Definir payload de resposta com agregados 24h e 30d sem quebrar contratos atuais do dashboard.

- [x] Implementar backend de leitura de saúde por componente (AC: 2, 3, 4, 8)
  - [x] Criar/estender lib para coletar sinais de API, DB, cache, email e storage.
  - [x] Integrar com dados de backup já disponíveis na story 5.6 para compor status de backup.
  - [x] Aplicar limites de timeout por verificação para evitar bloqueio do endpoint.

- [x] Implementar endpoint admin para health monitor (AC: 1, 2, 5, 6)
  - [x] Adicionar rota protegida `GET /api/admin/health-monitor`.
  - [x] Adicionar endpoint para histórico estendido `GET /api/admin/health-monitor/history?window=24h|30d`.
  - [x] Garantir `authMiddleware` + `requireRole(['Admin'])` e isolamento multi-tenant por `academy_id` quando aplicável.

- [x] Integrar com alertas críticos existentes (AC: 3, 4, 7, 8)
  - [x] Reusar infraestrutura de alertas da story 5.4 para eventos de degradação/offline.
  - [x] Disparar alerta crítico para falha total de componente.
  - [x] Incluir recomendação contextual e deeplink para logs/área relacionada.

- [x] Implementar frontend da tela Health Monitor (AC: 1, 2, 5, 6, 7, 8)
  - [x] Criar componente/rota admin dedicada (ex.: `/admin/health-monitor`).
  - [x] Exibir cards por componente com semáforo de status e métricas resumidas.
  - [x] Exibir gráfico 24h por padrão com alternância para 30 dias.
  - [x] Implementar tooltips com recomendações operacionais e ações rápidas.
  - [x] Exibir CTA de recuperação para backup em atenção/falha.

- [x] UX e atualização em tempo quase real (AC: 3, 4)
  - [x] Implementar polling com intervalo curto e backoff em erro.
  - [x] Pausar/reduzir polling em aba inativa para reduzir carga.
  - [x] Garantir acessibilidade visual (contraste, rótulos, estados semânticos).

- [x] Testes e validações (AC: 1-8)
  - [x] Backend: testes para estados `ok`, `degraded`, `offline`, `warning` e isolamento de acesso.
  - [x] Backend: testes de histórico 24h/30d e fallback em indisponibilidade parcial de dependência.
  - [x] Frontend: testes de renderização de componentes, troca de janela temporal e CTA contextual.
  - [x] Frontend: testes de atualização periódica e comportamento em erro de API.

## Dev Notes

### Estado atual do código (não recriar)

- O projeto já possui base de monitoramento/alertas em admin dashboard e alertas em tempo real (story 5.4).
- Já existe fluxo de backup com estado e histórico (story 5.6), que deve alimentar o indicador de backup desta story.
- A stack atual (Angular + Node/Express + PostgreSQL + TypeScript) deve ser preservada.

### Gaps concretos para esta story

1. Não existe tela dedicada de Health Monitor no admin.
2. Não há endpoint consolidado com saúde por componente + séries temporais 24h/30d.
3. Não existe camada explícita de recomendações contextuais operacionais no dashboard de saúde.

### Requisitos de arquitetura e guardrails

- Reusar infraestrutura de alertas e auditoria já existente, evitando serviços paralelos.
- Priorizar leitura agregada e cache curto para manter resposta rápida.
- Não acoplar verificações pesadas ao request síncrono do usuário; preferir snapshots quando necessário.
- Manter logs e ações críticas auditáveis.

### Segurança e conformidade

- Endpoints exclusivos para Admin.
- Não expor segredos de infraestrutura (strings de conexão, credenciais, stack traces sensíveis).
- Mensagens de erro devem ser operacionais, sem vazar detalhes internos.

### Referências

- Story fonte: `_bmad-output/Epics/Epic5/Story-5-7.md`
- Epic: `_bmad-output/Epics/Epic5/Epic5.md`
- Story anterior: `_bmad-output/implementation-artifacts/5-6-backup-recovery.md`
- Arquitetura: `_bmad-output/planning-artifacts/architect.md`
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md`
- PRD: `_bmad-output/planning-artifacts/prd.md`
- Base backend admin: `backend/src/routes/admin.ts`
- Base de alertas: `backend/src/lib/adminAlerts.ts`, `backend/src/controllers/adminAlerts.ts`
- Base dashboard: `frontend/src/components/admin-dashboard/admin-dashboard.component.ts`

## Project Structure Notes

- Backend (prováveis mudanças):
  - `backend/src/routes/admin.ts`
  - `backend/src/controllers/adminHealthMonitor.ts` (novo)
  - `backend/src/lib/adminHealthMonitor.ts` (novo)
  - `backend/src/types/index.ts`
  - `backend/src/tests/admin-health-monitor.test.ts` (novo)
- Frontend (prováveis mudanças):
  - `frontend/src/app.routing.module.ts`
  - `frontend/src/app.module.ts`
  - `frontend/src/services/api.service.ts`
  - `frontend/src/types/index.ts`
  - `frontend/src/components/admin-health-monitor/*` (novo)

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Story e contexto técnico carregados de `_bmad-output/implementation-artifacts/5-7-health-monitor.md` e `_bmad-output/project-context.md`.
- Implementação backend validada com `npm test -- src/tests/admin-health-monitor.test.ts` e `npm test` em `backend`.
- Implementação frontend validada com `npx ng test --watch=false --browsers=ChromeHeadless --include ...` e suíte completa `npx ng test --watch=false --browsers=ChromeHeadless`.

### Completion Notes List

- Contratos de Health Monitor adicionados em backend/frontend com status padronizado `ok|degraded|offline|warning`.
- Backend implementado com coleta de sinais para API, banco, cache/fila, email e storage/backup, incluindo séries 24h/30d.
- Endpoints `GET /api/admin/health-monitor` e `GET /api/admin/health-monitor/history` adicionados com RBAC Admin e auditoria.
- Integração com alertas existente implementada via `createOperationalAdminAlert` com deduplicação.
- Frontend implementado com nova tela `AdminHealthMonitorComponent`, rota dedicada, polling com backoff e pausa em aba inativa.
- Ação rápida no dashboard admin adicionada para acesso ao Health Monitor.
- CTA contextual de backup implementado com navegação direta para `/admin/backup`.
- Testes backend e frontend adicionados/atualizados, e regressão completa backend/frontend executada com sucesso.

### File List

- `backend/src/controllers/adminHealthMonitor.ts`
- `backend/src/lib/adminHealthMonitor.ts`
- `backend/src/lib/adminAlerts.ts`
- `backend/src/routes/admin.ts`
- `backend/src/tests/admin-health-monitor.test.ts`
- `backend/src/types/index.ts`
- `frontend/src/app.module.ts`
- `frontend/src/app.routing.module.ts`
- `frontend/src/components/admin-dashboard/admin-dashboard.component.ts`
- `frontend/src/components/admin-health-monitor/admin-health-monitor.component.ts`
- `frontend/src/components/admin-health-monitor/admin-health-monitor.component.html`
- `frontend/src/components/admin-health-monitor/admin-health-monitor.component.scss`
- `frontend/src/components/admin-health-monitor/admin-health-monitor.component.spec.ts`
- `frontend/src/services/api.service.ts`
- `frontend/src/services/api.service.spec.ts`
- `frontend/src/types/index.ts`
- `_bmad-output/implementation-artifacts/5-7-health-monitor.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

| Data | Mudança | Impacto |
|------|---------|--------|
| 2026-03-29 | Criação do artifact de implementação da Story 5.7 | Story movida para `ready-for-dev` |
| 2026-03-29 | Implementação completa backend/frontend da Story 5.7 + testes | Story movida para `review` |
| 2026-03-29 | Correções pós-code-review aplicadas (alert actions, validação de window, polling/backoff, métricas/robustez health monitor) + testes focados | Story movida para `done` |
