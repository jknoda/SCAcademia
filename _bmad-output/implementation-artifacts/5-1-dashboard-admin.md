# Story 5.1: Dashboard Admin - Overview de Saude da Academia

Status: done

## Story

Como um Admin,
Quero visualizar um dashboard que mostra a saude geral da academia,
para que eu tenha visao rapida de qualquer problema operacional ou de conformidade.

## Contexto de Negocio

- O Epic 5 abre a trilha de controle administrativo do produto: monitoramento, auditoria, compliance, alertas e operacao.
- A rota e o componente principais do admin ja existem em `frontend/src/components/admin-dashboard/*` e `frontend/src/app.routing.module.ts`, mas hoje funcionam como uma pagina mista de bootstrap/acoes rapidas, com trechos estaticos e secoes LGPD isoladas.
- A trilha de auditoria e compliance ja existe e deve ser reaproveitada, nao recriada:
  - `frontend/src/components/audit-log/*`
  - `backend/src/controllers/adminAudit.ts`
  - `backend/src/lib/audit.ts`
  - `backend/src/controllers/compliance.ts`
  - `frontend/src/services/api.service.ts`
- O `ApiService` ja expoe dados relevantes para compor o dashboard admin: relatorio de conformidade, historico de relatorios, solicitacoes de delecao, menores sem responsavel e alunos sem anamnese.
- Nao existe hoje um endpoint agregado `GET /api/admin/dashboard`; a arquitetura planejada em `_bmad-output/planning-artifacts/architect.md` preve esse endpoint, entao esta story deve introduzir esse contrato de agregacao em vez de espalhar multiplas chamadas acopladas na view.
- Esta story deve consolidar a visao executiva do admin sem bloquear as historias 5.2, 5.4, 5.6 e 5.7. Onde ainda nao houver subsistema completo, a implementacao deve criar contratos leves e extensiveis, sem fingir observabilidade de producao.

## Acceptance Criteria

1. Dado que um Admin faz login, quando acessa `Admin > Dashboard`, entao exibe dashboard com titulo `Saude da Academia`, logo da aplicacao e timestamp do ultimo refresh.
2. Dado que o dashboard carrega, quando renderiza, entao exibe 4 secoes principais:
   - Status Geral com status visual, compliance score, ultima auditoria e CTA para auditoria completa.
   - Metricas Criticas com cards de usuarios ativos, consentimentos, treinos registrados no mes e status de backup.
   - Alertas Recentes com estado vazio (`Nenhum alerta ativo`) ou lista destacada por severidade.
   - Acoes Rapidas com navegacao para logs, relatorio LGPD, gestao de usuarios e configuracoes.
3. Dado que o Admin esta no dashboard, quando passa o mouse ou foca o indicador principal de compliance, entao ve tooltip explicativo sobre o significado do compliance score.
4. Dado que existe alerta critico, quando o dashboard detecta esse estado, entao o status principal muda para `ATENCAO REQUERIDA` e o alerta fica destacado visualmente no topo, com scroll automatico controlado.
5. Dado que o Admin clica no card principal de status, quando abre o detalhamento, entao visualiza a pagina ou painel `Status do Sistema` com historico dos ultimos 7 dias e percentual de uptime.
6. Dado que o Admin quer atualizar os dados manualmente, quando clica em `Atualizar`, entao o dashboard refaz a carga em menos de 1 segundo em ambiente local/normal e atualiza o timestamp exibido.
7. Dado que e o primeiro acesso do Admin ao novo dashboard, quando a tela carrega, entao exibe onboarding suave com destaque das secoes principais e opcao de pular o tour.

## Tasks / Subtasks

- [x] Criar contrato agregado do dashboard admin no backend e frontend (AC: 1, 2, 4, 5, 6)
  - [x] Adicionar tipos backend para resumo executivo do admin em `backend/src/types/index.ts` ou arquivo dedicado de tipos compartilhados do admin.
  - [x] Adicionar tipos frontend equivalentes em `frontend/src/types/index.ts` para status geral, metricas, alertas, backup, historico de uptime e quick actions.
  - [x] Definir um contrato estavel para as stories 5.4, 5.6 e 5.7 evoluirem sem quebrar o dashboard principal.

- [x] Implementar endpoint agregado `GET /api/admin/dashboard` (AC: 1, 2, 4, 5, 6)
  - [x] Adicionar rota em `backend/src/routes/admin.ts` protegida com `authMiddleware` e `requireRole(['Admin'])`.
  - [x] Criar controller dedicado, por exemplo `backend/src/controllers/adminDashboard.ts`, para montar a resposta consolidada.
  - [x] Fazer agregacao em paralelo com `Promise.all` para manter tempo de resposta baixo.
  - [x] Incluir no payload:
    - [x] `status`: `operational | attention | critical`
    - [x] `complianceScore`: numero de 0 a 100 com formula explicita no codigo
    - [x] `lastRefreshAt` e `lastAuditAt`
    - [x] `metrics.usersActive` com total e quebra por papel
    - [x] `metrics.consents` com total valido, percentual e expirados
    - [x] `metrics.trainingsMonth` com total do mes e media por dia
    - [x] `metrics.backup` com ultimo backup conhecido e proximo agendamento
    - [x] `alerts` com severidade, mensagem, categoria e rota sugerida
    - [x] `systemStatus.history7d` com pontos de status e uptime resumido
  - [x] Nao introduzir stack de monitoramento pesada nesta story; usar fontes de dados existentes + um resumo leve e extensivel.

- [x] Reaproveitar dados reais ja disponiveis antes de criar novas fontes (AC: 2, 4)
  - [x] Reusar `getComplianceReportStatus`, `listComplianceReports`, `listPendingDeletionRequests`, `listMinorsWithoutGuardian` e `listStudentsWithoutHealthScreening` como fontes para a primeira versao do resumo.
  - [x] Reusar `audit_logs` para contagem recente, tentativas suspeitas e ultimo momento de auditoria relevante.
  - [x] Consultar `users` e `trainings` para metricas de usuarios ativos e treinos do mes, evitando dados mockados.
  - [x] Se ainda nao houver fonte real para backup/uptime, criar um resumo minimo claramente identificado e preparado para ser aprofundado nas stories 5.6 e 5.7, sem inventar monitoramento externo inexistente.

- [x] Definir regra deterministica de score e status (AC: 2, 4)
  - [x] Documentar no codigo a formula do `complianceScore` para evitar numero magico.
  - [x] Base sugerida para o score inicial:
    - [x] consentimentos validos
    - [x] menores com responsavel vinculado
    - [x] alunos sem anamnese pendente
    - [x] ausencia de alertas criticos
    - [x] saude basica de backup/status
  - [x] Definir degradacao do status visual:
    - [x] verde quando nao houver alerta critico e score estiver em faixa saudavel
    - [x] amarelo quando houver pendencias relevantes sem quebra critica
    - [x] vermelho apenas para falha critica real

- [x] Evoluir a UI existente do admin dashboard, sem criar uma segunda home (AC: 1, 2, 3, 4, 6, 7)
  - [x] Atualizar `frontend/src/components/admin-dashboard/admin-dashboard.component.ts` para consumir o endpoint agregado e manter as navegacoes ja existentes.
  - [x] Atualizar `frontend/src/components/admin-dashboard/admin-dashboard.component.html` para substituir o hero atual de setup por um dashboard executivo orientado a status.
  - [x] Atualizar `frontend/src/components/admin-dashboard/admin-dashboard.component.scss` preservando a linguagem visual do projeto e os tokens de cor definidos em `_bmad-output/project-context.md` e `_bmad-output/planning-artifacts/ux-design-specification.md`.
  - [x] Preservar as acoes ja existentes para `Audit Logs`, `Relatorios LGPD`, `Perfil da Academia`, `Professores`, `Alunos` e `Meu Perfil`.
  - [x] Reorganizar a tela nas 4 secoes do AC, priorizando leitura imediata no topo.

- [x] Implementar experiencia executiva de status e alertas (AC: 2, 3, 4, 5)
  - [x] Exibir semaforo visual com redundancia de cor + texto.
  - [x] Adicionar tooltip acessivel ao compliance score.
  - [x] Destacar top alertas recentes com severidade e CTA para drill-down.
  - [x] Implementar click no card principal para abrir detalhe de status do sistema.
  - [x] Criar componente/rota dedicada para detalhe de status apenas se necessario para manter legibilidade do `admin-dashboard`; evitar fragmentacao prematura.

- [x] Implementar refresh, loading e onboarding (AC: 1, 6, 7)
  - [x] Adicionar botao `Atualizar` com estado de loading e timestamp de ultima atualizacao.
  - [x] Exibir skeleton ou loading state claro no primeiro carregamento.
  - [x] Implementar tratamento de erro sem quebrar as acoes rapidas ja existentes.
  - [x] Criar onboarding leve controlado por `localStorage` ou mecanismo equivalente no frontend, exibido apenas na primeira visita do admin ao novo dashboard.
  - [x] Garantir que o auto-scroll para alerta critico aconteca de forma controlada, uma vez por carga, sem comportamento agressivo.

- [ ] Testes e validacoes (AC: 1-7)
  - [x] Backend: testes de contrato e autorizacao para `GET /api/admin/dashboard`.
  - [ ] Backend: testar calculo de score/status e comportamento com alertas criticos.
  - [x] Frontend: testar renderizacao das 4 secoes, estado vazio de alertas, refresh manual e navegacao para auditoria.
  - [x] Frontend: testar onboarding exibido uma vez e ignorado apos `Pular Tour`.
  - [ ] Validar que a rota `/admin/dashboard` continua restrita a Admin por `AuthGuard` + `RoleGuard`.

## Dev Notes

### Estado atual do codigo

- O dashboard admin atual ja existe em:
  - `frontend/src/components/admin-dashboard/admin-dashboard.component.ts`
  - `frontend/src/components/admin-dashboard/admin-dashboard.component.html`
  - `frontend/src/components/admin-dashboard/admin-dashboard.component.scss`
- Hoje essa tela ja consome partes de LGPD e operacao:
  - relatorio de conformidade
  - historico recente de relatorios
  - menores sem responsavel
  - solicitacoes de delecao
  - atalhos para auditoria e cadastros
- A rota tambem ja existe: `frontend/src/app.routing.module.ts` em `/admin/dashboard`.
- O fluxo de auditoria LGPD ja esta implementado e nao deve ser recriado; o dashboard deve navegar para ele quando houver drill-down.

### Guardrails tecnicos

- Nao criar uma segunda pagina inicial do admin. A story deve evoluir a rota e o componente existentes.
- Nao substituir os fluxos ja entregues de auditoria, relatorio de conformidade e delecao; o dashboard deve apenas consolidar e destacar essas capacidades.
- Preferir um endpoint agregado backend para o dashboard admin. Evitar espalhar no componente uma orquestracao fraca com muitas chamadas se isso gerar duplicacao ou acoplamento dificil de manter.
- Se for preciso manter chamadas separadas na primeira etapa, encapsular a agregacao em metodo/servico claro, deixando caminho de migracao para `GET /api/admin/dashboard`.
- Nao inventar telemetria de infraestrutura que ainda nao existe. Para backup e saude do sistema, usar resumo minimo e verificavel, preparado para aprofundamento nas stories seguintes.
- A implementacao deve continuar multi-tenant: todo agregado admin e restrito a `academyId` do usuario autenticado.
- Admin tem visao ampla da propria academia, mas nao pode furar isolamento de tenant nem acessar outra academia sem trilha de auditoria.

### Reuso concreto do projeto

- `frontend/src/services/api.service.ts` ja possui:
  - `listPendingDeletionRequests()`
  - `listMinorsWithoutGuardian()`
  - `listStudentsWithoutHealthScreening()`
  - `generateComplianceReport()`
  - `getComplianceReportStatus()`
  - `listComplianceReports()`
  - `downloadComplianceReport()`
- `backend/src/controllers/adminAudit.ts` e `backend/src/lib/audit.ts` ja oferecem base para timeline, contagens e anomalias.
- `backend/src/controllers/compliance.ts` e as estruturas `ComplianceReportAlert` / `ComplianceReportHistoryItem` ja existem e devem ser aproveitadas no resumo do dashboard.
- Nao existe endpoint agregado do admin dashboard no backend neste momento; esta e uma lacuna real da base atual e faz parte do trabalho desta story.

### Arquitetura e UX relevantes

- O documento `_bmad-output/planning-artifacts/architect.md` ja preve `GET /api/admin/dashboard` e define dashboards operacionais, de negocio e de compliance.
- O documento `_bmad-output/planning-artifacts/ux-design-specification.md` pede dashboard admin estilo at-a-glance, inspirado em observabilidade moderna:
  - status semaforo no topo
  - compliance score em destaque
  - top alertas visiveis em segundos
  - drill-down sem friccao para logs e relatorios
- Usar a paleta ja definida pelo projeto:
  - azul `#0052CC`
  - laranja `#FF6B35`
  - sucesso `#28A745`
  - alerta `#F57C00`
  - erro `#D32F2F`

### Performance, acessibilidade e UX

- Meta do epic: dashboard renderizar em menos de 1 segundo com volume administrativo normal.
- Priorizar leitura em desktop, mas manter responsividade funcional para tablet e telas menores.
- Garantir foco por teclado, tooltips acessiveis e sem dependencia exclusiva de cor.
- O onboarding deve ser leve e nao intrusivo; exibir uma vez e permitir pulo imediato.

### Riscos e mitigacoes

- Risco: dashboard virar apenas uma colagem de secoes antigas.
  - Mitigacao: redesenhar a hierarquia da pagina com status, metricas, alertas e acoes, preservando as capacidades existentes em camadas secundarias.
- Risco: inventar monitoramento/backup antes das historias 5.6 e 5.7.
  - Mitigacao: criar contrato claro e resumo inicial verificavel, explicitamente extensivel.
- Risco: regressao em rotas e acoes admin ja utilizadas.
  - Mitigacao: manter metodos de navegacao existentes e validar a UX principal do admin apos a mudanca.

### Estrategia de testes

- Frontend: `npx ng test --watch=false --browsers=ChromeHeadless` esta operacional no workspace.
- Backend: existe nota de repositorio indicando que a suite Jest/ts-jest pode falhar antes de rodar casos alvo por duplicacoes pre-existentes em `backend/src/controllers/users.ts`; tratar isso como risco conhecido e nao como requisito desta story, salvo se a implementacao tocar diretamente nesse ponto.

### Referencias

- Story fonte: `_bmad-output/Epics/Epic5/Story-5-1.md`
- Epic overview: `_bmad-output/Epics/Epic5/Epic5.md`
- Projeto: `_bmad-output/project-context.md`
- Arquitetura: `_bmad-output/planning-artifacts/architect.md`
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Dashboard admin atual: `frontend/src/components/admin-dashboard/*`
- Audit log atual: `frontend/src/components/audit-log/*`
- API service: `frontend/src/services/api.service.ts`
- Rotas admin backend: `backend/src/routes/admin.ts`
- Compliance backend: `backend/src/controllers/compliance.ts`
- Audit backend: `backend/src/controllers/adminAudit.ts`, `backend/src/lib/audit.ts`

## Project Structure Notes

- Alteracoes mais provaveis nesta story:
  - `frontend/src/components/admin-dashboard/*`
  - `frontend/src/services/api.service.ts`
  - `frontend/src/types/index.ts`
  - `frontend/src/app.routing.module.ts` (somente se o detalhe de status virar rota dedicada)
  - `backend/src/routes/admin.ts`
  - `backend/src/controllers/adminDashboard.ts` (novo)
  - `backend/src/types/index.ts`
  - modulo backend de agregacao/dashboard se extraido para `backend/src/lib/*`
- Evitar criar modulo frontend paralelo de dashboard admin sem necessidade real. Se a view crescer demais, extrair componentes filhos focados em `admin-dashboard` em vez de duplicar pagina.

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

- Sprint status analisado em `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Story base analisada em `_bmad-output/Epics/Epic5/Story-5-1.md`
- Dashboard admin atual analisado em `frontend/src/components/admin-dashboard/*`
- Fluxos correlatos analisados em `frontend/src/components/audit-log/*`, `backend/src/controllers/compliance.ts`, `backend/src/controllers/adminAudit.ts`

### Completion Notes List

- Implementado endpoint agregado `GET /api/admin/dashboard` com controller dedicado, auditoria de visualizacao e agregacao de metricas, alertas, score de conformidade e historico de status em 7 dias.
- Dashboard admin existente foi reestruturado para uma visao executiva unica, com hero principal, status geral, metricas criticas, alertas recentes, acoes rapidas, detalhe de status do sistema e onboarding inicial com `localStorage`.
- Fluxos operacionais existentes de conformidade LGPD, solicitacoes de delecao e menores sem responsavel foram preservados e mantidos na mesma tela como secoes secundarias.
- Adicionados testes focados para o endpoint backend, para `ApiService.getAdminDashboard()` e para o componente Angular do dashboard admin.
- Validacao executada com sucesso em escopo focado:
  - frontend: `npm test -- --watch=false --browsers=ChromeHeadless --include src/components/admin-dashboard/admin-dashboard.component.spec.ts --include src/services/api.service.spec.ts`
  - backend: `npm test -- admin-dashboard.test.ts`
- Code review concluido sem blockers funcionais; validacao focada reexecutada em 2026-03-28 com suites backend e frontend verdes.
- Permanece como follow-up desejavel ampliar a cobertura especifica do calculo de score/status e validar restricao de rota Angular via guards em teste dedicado.

### File List

- `_bmad-output/implementation-artifacts/5-1-dashboard-admin.md`
- `backend/src/types/index.ts`
- `backend/src/lib/adminDashboard.ts`
- `backend/src/controllers/adminDashboard.ts`
- `backend/src/routes/admin.ts`
- `backend/src/tests/admin-dashboard.test.ts`
- `frontend/src/types/index.ts`
- `frontend/src/services/api.service.ts`
- `frontend/src/services/api.service.spec.ts`
- `frontend/src/components/admin-dashboard/admin-dashboard.component.ts`
- `frontend/src/components/admin-dashboard/admin-dashboard.component.html`
- `frontend/src/components/admin-dashboard/admin-dashboard.component.scss`
- `frontend/src/components/admin-dashboard/admin-dashboard.component.spec.ts`