# Story 5.4: Alertas em Tempo Real — Notificações Admin

Status: done

## Story

Como um Admin,
Quero receber alertas quando anomalias ocorrem,
Para que eu reaja rapidamente a problemas de segurança.

## Contexto de Negócio

- Esta story estende o Epic 5 após a base já entregue em:
  - 5.1 Dashboard Admin (visão executiva e alertas resumidos)
  - 5.2 Auditoria LGPD (timeline e exportações)
  - 5.3 Relatórios de conformidade (histórico e status)
- O objetivo aqui é transformar alerta estático em fluxo operacional: detectar, notificar, agir e registrar trilha auditável.
- FRs foco do epic para esta story: FR45–FR47 (alertas de anomalias e reação rápida do Admin).

## Acceptance Criteria

1. Dado que algo anômalo ocorre no sistema,
   quando o sistema detecta,
   então dispara alerta para Admin com:
   - in-app (badge no dashboard),
   - push/mobile quando aplicável,
   - email imediato ou agregado por janela.

2. Dado que há anomalia crítica (ex.: 5+ tentativas de login não autorizado),
   quando detectada,
   então exibe alerta imediato com modal:
   - título "ALERTA DE SEGURANÇA",
   - contexto (ex.: IP e contagem),
   - ações "Bloquear", "Investigar", "Ignorar".

3. Dado que há consentimento vencendo em 7 dias,
   quando detectado,
   então exibe alerta preventivo (warning) com CTA para contato de responsáveis.

4. Dado que backup falhou,
   quando detectado,
   então exibe alerta crítico (error) com ações de retry e suporte.

5. Dado que o Admin recebe muitos alertas,
   quando acessa configurações de alertas,
   então consegue customizar por severidade/tipo e por canal:
   - crítico: on/off + canais,
   - preventivo: on/off + canais,
   - informativo: on/off.

6. Dado que o Admin ativa "Silenciar por 1 hora",
   quando acionado,
   então os alertas são suprimidos no período e retomam automaticamente após expiração.

7. Dado que há alertas críticos pendentes,
   quando o Admin acessa o dashboard,
   então exibe badge vermelho no sino com contador,
   e clique abre lista com ações rápidas.

## Tasks / Subtasks

- [x] Definir contrato backend de alertas admin (AC: 1, 2, 3, 4, 7)
  - [x] Criar tipos de domínio em [backend/src/types/index.ts](backend/src/types/index.ts) para item/lista/configuração de alerta.
  - [x] Padronizar severidade e categoria com os tipos já usados em dashboard (`high|medium|low`, `compliance|audit|users|backup|operations`).
  - [x] Definir payloads de ação rápida (`acknowledge`, `resolve`, `ignore`, `block-ip`).

- [x] Implementar leitura e ações de alertas no backend (AC: 1, 2, 4, 7)
  - [x] Criar/estender funções em [backend/src/lib/adminDashboard.ts](backend/src/lib/adminDashboard.ts) e/ou lib dedicada para:
    - [x] listar alertas ativos/paginados,
    - [x] contar não lidos,
    - [x] reconhecer/resolver alerta,
    - [x] registrar `acknowledged_by_user_id` e timestamps.
  - [x] Reusar tabela `alerts` existente (V5_0), sem criar modelo paralelo desnecessário.
  - [x] Garantir multi-tenant por `academy_id` em todas as queries.

- [x] Implementar detecção de anomalias e geração de alertas (AC: 1, 2, 3, 4)
  - [x] Reusar sinais já existentes de auditoria em [backend/src/lib/adminDashboard.ts](backend/src/lib/adminDashboard.ts) e [backend/src/lib/audit.ts](backend/src/lib/audit.ts).
  - [x] Cobrir gatilhos mínimos:
    - [x] login falho/negado acima de limiar,
    - [x] consentimento expirando em 7 dias,
    - [x] falha de backup.
  - [x] Implementar deduplicação temporal para evitar spam (janela por tipo + academy).

- [x] Expor endpoints admin para alertas e preferências (AC: 5, 6, 7)
  - [x] Adicionar rotas em [backend/src/routes/admin.ts](backend/src/routes/admin.ts) protegidas com `requireRole(['Admin'])`.
  - [x] Criar handlers em controller admin apropriado para:
    - [x] listar alertas,
    - [x] obter contador,
    - [x] ações de acknowledge/resolve,
    - [x] silenciar por 1 hora,
    - [x] salvar preferências de notificação.
  - [x] Auditar todas as ações com `logAudit`.

- [x] Evoluir dashboard admin para UX de alerta em tempo real (AC: 2, 7)
  - [x] Atualizar [frontend/src/components/admin-dashboard/admin-dashboard.component.ts](frontend/src/components/admin-dashboard/admin-dashboard.component.ts) para consumir feed/contador.
  - [x] Atualizar [frontend/src/components/admin-dashboard/admin-dashboard.component.html](frontend/src/components/admin-dashboard/admin-dashboard.component.html) para:
    - [x] sino com badge,
    - [x] lista de alertas com ações rápidas,
    - [x] modal crítico para segurança.
  - [x] Atualizar [frontend/src/components/admin-dashboard/admin-dashboard.component.scss](frontend/src/components/admin-dashboard/admin-dashboard.component.scss) com estados visuais semafóricos e acessíveis.

- [x] Criar fluxo de configurações de alertas (AC: 5, 6)
  - [x] Criar/estender tela em rota admin de configurações para toggles de severidade/tipo/canal.
  - [x] Persistir preferências no backend (ou fallback explicitamente documentado se incremental).
  - [x] Implementar UX de "silenciar por 1 hora" com timer e restauração automática.

- [x] Atualizar API service e tipos frontend (AC: 1, 5, 6, 7)
  - [x] Adicionar contratos em [frontend/src/types/index.ts](frontend/src/types/index.ts).
  - [x] Adicionar métodos em [frontend/src/services/api.service.ts](frontend/src/services/api.service.ts) para feed/contador/ações/configurações.

- [x] Testes e validações (AC: 1-7)
  - [x] Backend:
    - [x] testes de detecção de gatilhos e deduplicação,
    - [x] testes de autorização e isolamento por academia,
    - [x] testes de ações rápidas e silenciamento.
  - [x] Frontend:
    - [x] teste de badge e contador,
    - [x] teste de modal crítico com ações,
    - [x] teste de configurações e silenciar 1h,
    - [x] teste de fallback/erro de carregamento.
  - [x] Execuções alvo:
    - [x] `backend`: `npm test -- src/tests/admin-dashboard.test.ts`
    - [x] `backend`: suíte dedicada de alertas (novo arquivo)
    - [x] `frontend`: spec do admin dashboard e novo spec de alertas

## Dev Notes

### Estado atual do código (não recriar)

- Dashboard admin consolidado em [frontend/src/components/admin-dashboard/admin-dashboard.component.ts](frontend/src/components/admin-dashboard/admin-dashboard.component.ts) e [backend/src/lib/adminDashboard.ts](backend/src/lib/adminDashboard.ts).
- Auditoria LGPD já madura em [backend/src/lib/audit.ts](backend/src/lib/audit.ts) e [backend/src/controllers/adminAudit.ts](backend/src/controllers/adminAudit.ts).
- Tabela de alertas e notificações já existem em `_bmad-output/V5_0__Sync_Monitor.sql` (`alerts`, `notifications`).
- Padrão de feed de notificações já existe para aluno em [backend/src/lib/database.ts](backend/src/lib/database.ts) e pode servir como blueprint.

### Gaps concretos para esta story

1. Não existe feed admin dedicado de alertas com ações rápidas.
2. Não existe bell badge com contador em dashboard admin.
3. Não existe modal crítico acionado por severidade.
4. Não existe configuração de notificações para Admin por severidade/canal.
5. Não existe silenciamento temporário (1h) com restauração automática.
6. Não há estratégia explícita de entrega "tempo real" (polling/SSE/WebSocket) para o painel admin.

### Requisitos de arquitetura e guardrails

- Manter arquitetura Angular + Node + PostgreSQL já estabelecida.
- Evitar duplicar entidade de alertas; priorizar extensão da tabela `alerts` existente.
- Multi-tenant obrigatório por `academy_id`.
- Todas as ações de alerta devem gerar trilha em `audit_logs`.
- Seguir padrão de severidade já usado no dashboard (`high|medium|low`) e mapear para UI (`critical/warn/info`) sem quebrar contratos atuais.
- Não bloquear UI principal do admin com modais repetitivos: usar deduplicação e cooldown por alerta crítico.
- Implementação "tempo real" mínima aceitável: polling curto com backoff e abort em background tab; SSE/WebSocket é opcional para incremento, desde que documentado.

### Segurança e conformidade

- Não expor dados sensíveis de usuários fora do escopo da academia.
- Ação "Bloquear IP" deve ser auditável e reversível por política operacional.
- Silenciar alertas não pode ocultar geração de evento; apenas suprimir exibição/envio no período.

### Performance

- Dashboard deve continuar com resposta rápida (<1s para visão principal em ambiente normal).
- Polling/atualização não deve degradar significativamente o backend; usar paginação, limites e dedupe.

### Referências

- Story fonte: [ _bmad-output/Epics/Epic5/Story-5-4.md ](_bmad-output/Epics/Epic5/Story-5-4.md)
- Epic: [ _bmad-output/Epics/Epic5/Epic5.md ](_bmad-output/Epics/Epic5/Epic5.md)
- Story anterior: [ _bmad-output/implementation-artifacts/5-3-relatorio-conformidade.md ](_bmad-output/implementation-artifacts/5-3-relatorio-conformidade.md)
- Arquitetura: [ _bmad-output/planning-artifacts/architect.md ](_bmad-output/planning-artifacts/architect.md)
- UX: [ _bmad-output/planning-artifacts/ux-design-specification.md ](_bmad-output/planning-artifacts/ux-design-specification.md)
- Contexto do projeto: [ _bmad-output/project-context.md ](_bmad-output/project-context.md)
- Base backend admin: [ backend/src/lib/adminDashboard.ts ](backend/src/lib/adminDashboard.ts), [ backend/src/routes/admin.ts ](backend/src/routes/admin.ts)
- Base de auditoria: [ backend/src/lib/audit.ts ](backend/src/lib/audit.ts), [ backend/src/controllers/adminAudit.ts ](backend/src/controllers/adminAudit.ts)

## Project Structure Notes

- Backend (prováveis mudanças):
  - [backend/src/routes/admin.ts](backend/src/routes/admin.ts)
  - [backend/src/controllers/adminDashboard.ts](backend/src/controllers/adminDashboard.ts) e/ou controller dedicado
  - [backend/src/lib/adminDashboard.ts](backend/src/lib/adminDashboard.ts)
  - [backend/src/lib/audit.ts](backend/src/lib/audit.ts)
  - [backend/src/types/index.ts](backend/src/types/index.ts)
  - [backend/src/tests/admin-dashboard.test.ts](backend/src/tests/admin-dashboard.test.ts) + novo teste de alertas
- Frontend (prováveis mudanças):
  - [frontend/src/components/admin-dashboard/admin-dashboard.component.ts](frontend/src/components/admin-dashboard/admin-dashboard.component.ts)
  - [frontend/src/components/admin-dashboard/admin-dashboard.component.html](frontend/src/components/admin-dashboard/admin-dashboard.component.html)
  - [frontend/src/components/admin-dashboard/admin-dashboard.component.scss](frontend/src/components/admin-dashboard/admin-dashboard.component.scss)
  - [frontend/src/services/api.service.ts](frontend/src/services/api.service.ts)
  - [frontend/src/types/index.ts](frontend/src/types/index.ts)
  - componente/tela de configurações de alertas admin (novo, se necessário)

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Story fonte e epic analisados em [ _bmad-output/Epics/Epic5/Story-5-4.md ](_bmad-output/Epics/Epic5/Story-5-4.md) e [ _bmad-output/Epics/Epic5/Epic5.md ](_bmad-output/Epics/Epic5/Epic5.md)
- Base técnica recente analisada em [ _bmad-output/implementation-artifacts/5-3-relatorio-conformidade.md ](_bmad-output/implementation-artifacts/5-3-relatorio-conformidade.md)
- Mapeamento de reuso backend/frontend feito sobre admin dashboard, audit e schema de monitoramento

### Completion Notes List

- Story 5.4 criada com contexto técnico consolidado e foco em reuso da stack existente.
- Critérios de aceitação convertidos em tarefas implementáveis com rastreabilidade AC→Task.
- Guardrails de multi-tenant, trilha de auditoria, deduplicação de alertas e performance incluídos para evitar regressões.
- Story marcada como `ready-for-dev` para execução pelo dev agent.
- Implementado backend dedicado para feed de alertas admin, contadores, ações rápidas, preferências de canais/severidade e silenciamento por 1h.
- Implementado bootstrap de alertas com deduplicação temporal para gatilhos de segurança (5+ login failed), consentimentos vencendo em 7 dias e falhas de backup.
- Implementados endpoints admin de alertas com trilha de auditoria (`logAudit`) para todas as ações operacionais.
- Evoluído dashboard admin com sino/badge crítico, painel de alertas em tempo real, modal de segurança e fluxo de configuração/silenciamento.
- Testes backend e frontend executados para validar os fluxos críticos da story.
- Correção pós-review: ação `block-ip` agora bloqueia IP por academia de forma persistente e auditável, em vez de apenas reconhecer alerta.
- Correção pós-review: login passa a respeitar bloqueio de IP por academia, retornando 403 para IP bloqueado.
- Correção pós-review: endpoint de ação de alerta valida `alertId` em formato UUID e retorna 400 para entrada inválida.
- Correção pós-review: polling do dashboard atualiza feed/modal crítico mesmo com painel fechado, garantindo comportamento em tempo real para alertas críticos.
- Revalidação após correções: backend `npm test -- src/tests/admin-alerts.test.ts` (4/4 pass) e frontend com `TOTAL: 180 SUCCESS` no ciclo do Karma.

### File List

- [backend/src/types/index.ts](backend/src/types/index.ts)
- [backend/src/lib/adminAlerts.ts](backend/src/lib/adminAlerts.ts)
- [backend/src/lib/securityBlocklist.ts](backend/src/lib/securityBlocklist.ts)
- [backend/src/controllers/adminAlerts.ts](backend/src/controllers/adminAlerts.ts)
- [backend/src/controllers/auth.ts](backend/src/controllers/auth.ts)
- [backend/src/routes/admin.ts](backend/src/routes/admin.ts)
- [backend/src/tests/admin-alerts.test.ts](backend/src/tests/admin-alerts.test.ts)
- [frontend/src/types/index.ts](frontend/src/types/index.ts)
- [frontend/src/services/api.service.ts](frontend/src/services/api.service.ts)
- [frontend/src/components/admin-dashboard/admin-dashboard.component.ts](frontend/src/components/admin-dashboard/admin-dashboard.component.ts)
- [frontend/src/components/admin-dashboard/admin-dashboard.component.html](frontend/src/components/admin-dashboard/admin-dashboard.component.html)
- [frontend/src/components/admin-dashboard/admin-dashboard.component.scss](frontend/src/components/admin-dashboard/admin-dashboard.component.scss)
- [frontend/src/components/admin-dashboard/admin-dashboard.component.spec.ts](frontend/src/components/admin-dashboard/admin-dashboard.component.spec.ts)
- [_bmad-output/implementation-artifacts/5-4-alertas-tempo-real.md](_bmad-output/implementation-artifacts/5-4-alertas-tempo-real.md)
- [_bmad-output/implementation-artifacts/sprint-status.yaml](_bmad-output/implementation-artifacts/sprint-status.yaml)

### Change Log

- 2026-03-28: Story movida para `review` com backend/frontend de alertas em tempo real implementados e validados em testes alvo.
- 2026-03-29: Correções pós-code-review aplicadas (block-ip efetivo, validação UUID, modal crítico em polling), revisão final executada e story movida para `done`.
