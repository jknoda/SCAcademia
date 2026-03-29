# Story 5.3: Relatório de Conformidade LGPD — Exportação Regulatória

Status: done

## Story

Como um Admin auditando conformidade,
Quero gerar relatório oficial de conformidade LGPD,
Para que eu possa fornecer aos reguladores/auditores externos.

## Contexto de Negócio

- Esta story evolui diretamente o fluxo já entregue no Epic 5:
  - Story 5.1 criou visão executiva e integração de compliance no dashboard admin.
  - Story 5.2 concluiu a trilha de auditoria LGPD com logs detalhados e exportação assinada.
- O sistema já possui geração e histórico de relatórios de conformidade em PDF:
  - `backend/src/controllers/compliance.ts`
  - `backend/src/lib/complianceReports.ts`
  - `backend/src/lib/complianceReport.ts`
  - `backend/src/routes/admin.ts`
  - `frontend/src/components/compliance-reports-settings/*`
  - `frontend/src/services/api.service.ts`
- Esta story não recria o módulo de conformidade. Ela deve ampliar o que existe para atender requisitos regulatórios de exportação multi-formato, assinatura opcional e experiência de geração com feedback de progresso.

## Acceptance Criteria

1. Dado que Admin acessa "Admin > Conformidade > Gerar Relatório", quando clica, então exibe modal: "Gerar Relatório de Conformidade LGPD" e opções de formato [PDF] [Excel] [JSON], período [Este mês] [Últimos 3 meses] [Custom], e "Assinar Digitalmente" [Sim] [Não].

2. Dado que Admin escolhe período e clica "Gerar", quando processa, então exibe "Processando..." com barra de progresso.

3. Dado que processamento completa, quando relatório está pronto, então exibe botão download com nome `LGPD_Compliance_[Academia]_[Periodo].pdf` (e equivalente por formato).

4. Dado que PDF é gerado, quando abre, então contém seções mandatórias: capa, resumo executivo, consentimentos, auditoria de acessos, dados deletados, segurança técnica e assinatura legal.

5. Dado que Admin marca "Assinar Digitalmente = Sim", quando gera, então relatório é assinado digitalmente e contém dados verificáveis de autenticidade.

6. Dado que há problemas de conformidade, quando relatório é gerado, então destaca seções críticas visualmente e inclui recomendações, com status "Não-Compliant - Ação Requerida".

7. Dado que Admin gera múltiplos relatórios, quando acessa "Admin > Relatórios", então todos ficam acessíveis em histórico com data e status.

## Tasks / Subtasks

- [ ] Evoluir contrato de geração de relatório com filtros e formatos (AC: 1, 2, 3)
  - [ ] Em `backend/src/controllers/compliance.ts`, aceitar payload com:
    - [ ] `format: 'pdf' | 'excel' | 'json'`
    - [ ] `periodPreset: 'current-month' | 'last-3-months' | 'custom'`
    - [ ] `dateFrom?: string` e `dateTo?: string` (quando custom)
    - [ ] `signDigital: boolean`
  - [ ] Validar combinações inválidas (ex.: custom sem date range).
  - [ ] Preservar comportamento legado para chamadas antigas (fallback para PDF + período padrão).

- [ ] Implementar modelo de período para dados de conformidade (AC: 1, 4, 6)
  - [ ] Em `backend/src/lib/complianceReport.ts`, estender queries para respeitar janela temporal informada.
  - [ ] Garantir consistência de período entre seções (consentimentos, auditoria, deleções).
  - [ ] Expor no payload final a faixa consolidada usada no relatório.

- [ ] Implementar exportação multi-formato (AC: 1, 3, 4, 7)
  - [ ] Manter PDF como formato principal em `backend/src/lib/complianceReports.ts`.
  - [ ] Adicionar exportador JSON regulatório (estrutura versionada e estável).
  - [ ] Adicionar exportador Excel (`.xlsx`) com abas mínimas:
    - [ ] `Resumo`
    - [ ] `Consentimentos`
    - [ ] `Auditoria`
    - [ ] `Deleções`
  - [ ] Salvar artefatos em `storage/compliance-reports/` com naming padronizado por academia/período/formato.

- [ ] Tornar assinatura digital opcional e verificável (AC: 1, 5)
  - [ ] Em `backend/src/lib/complianceReports.ts`, aplicar assinatura RSA apenas quando `signDigital=true`.
  - [ ] Quando `signDigital=false`, manter hash de integridade sem assinatura criptográfica.
  - [ ] Persistir metadados no histórico (`signed_at`, `signature_hash`, `report_data.signatureDate`, `report_data.signedBy`).

- [ ] Enriquecer conteúdo regulatório do relatório (AC: 4, 6)
  - [ ] Garantir presença das seções obrigatórias no PDF gerado.
  - [ ] Incluir status executivo em destaque (`COMPLIANT` ou `Não-Compliant`).
  - [ ] Incluir recomendações acionáveis derivadas de `alerts`.
  - [ ] Manter legenda clara de métricas para auditores externos.

- [ ] Adaptar endpoints de histórico/download para múltiplos formatos (AC: 3, 7)
  - [ ] Em `backend/src/routes/admin.ts`, manter rota atual de download e aceitar artefato por tipo/identificador.
  - [ ] Em `backend/src/controllers/compliance.ts`, garantir `Content-Type` correto por formato.
  - [ ] Em histórico, expor `format`, `periodLabel`, `complianceStatus`, `isSigned`.

- [ ] Evoluir UX do fluxo de geração em frontend (AC: 1, 2, 3, 7)
  - [ ] Em `frontend/src/components/compliance-reports-settings/*`, adicionar modal de geração com opções de formato/período/assinatura.
  - [ ] Mostrar estado "Processando..." com barra de progresso e feedback de erro amigável.
  - [ ] Ao concluir, habilitar download com nome amigável por período e formato.
  - [ ] Manter histórico existente e enriquecer com colunas de status/formato/assinatura.

- [ ] Atualizar tipos e service no frontend (AC: 1, 3, 7)
  - [ ] Em `frontend/src/types/index.ts`, adicionar contratos para:
    - [ ] request de geração avançada
    - [ ] item de histórico com formato/status/assinatura
    - [ ] progresso de geração
  - [ ] Em `frontend/src/services/api.service.ts`, adaptar `generateComplianceReport` para novo payload.

- [ ] Testes e validações (AC: 1-7)
  - [ ] Backend: expandir `backend/src/tests/compliance-lgpd.test.ts` para cobrir:
    - [ ] geração por formato (pdf/json/excel)
    - [ ] filtros de período (preset e custom)
    - [ ] assinatura ligada/desligada
    - [ ] histórico com múltiplos artefatos
  - [ ] Frontend: adicionar specs para o modal de geração e histórico em `compliance-reports-settings.component.spec.ts`.
  - [ ] Frontend: validar integração em `admin-dashboard.component.spec.ts` quando aplicável.
  - [ ] Executar validações alvo:
    - [ ] `backend`: `npm test -- src/tests/compliance-lgpd.test.ts`
    - [ ] `frontend`: `npm test -- --watch=false --browsers=ChromeHeadless --include src/components/compliance-reports-settings/compliance-reports-settings.component.spec.ts`

## Dev Notes

### Estado atual do código (não recriar)

- Já existe geração e persistência de relatório:
  - `generateAndStoreComplianceReport` em `backend/src/lib/complianceReports.ts`
- Já existe coleta de dados para conformidade:
  - `collectStatistics`, `collectConsentData`, `collectDeletionData`, `collectAuditData`, `generateComplianceAlerts` em `backend/src/lib/complianceReport.ts`
- Já existe histórico e download de relatórios:
  - `listComplianceReports`, `getComplianceReportById` em `backend/src/lib/complianceReports.ts`
  - handlers em `backend/src/controllers/compliance.ts`
- Já existe tela de configuração/histórico no frontend:
  - `frontend/src/components/compliance-reports-settings/*`

### Gaps concretos para esta story

1. Falta suporte a múltiplos formatos (somente PDF atualmente).
2. Falta filtro de período no fluxo de geração (sem granularidade regulatória).
3. Falta assinatura digital opcional (hoje assinatura é embutida no fluxo principal).
4. Falta UX explícita de geração com progresso e parâmetros avançados.
5. Histórico não expõe metadados completos para auditoria externa (formato/status/período).

### Requisitos de arquitetura e qualidade

- Backend Node.js + Express + TypeScript, mantendo padrão de controllers em `backend/src/controllers/*` e libs em `backend/src/lib/*`.
- Multi-tenant obrigatório: toda query filtrada por `academy_id` do usuário autenticado.
- Segurança LGPD:
  - manter trilha de auditoria com `logAudit` para geração e download.
  - não remover comportamento append-only dos logs.
- Performance:
  - manter agregação com queries eficientes e sem full scan desnecessário.
  - evitar regressão no dashboard admin (< 1s no uso comum).

### Padrões frontend

- Angular com `ApiService` como gateway HTTP (não usar `HttpClient` direto em componente).
- Rotas protegidas por `AuthGuard` e `RoleGuard`.
- Estados de loading/erro com mensagens claras em PT-BR.
- Aderência ao design system existente (Angular Material + tema do projeto).

### Learnings de stories anteriores relevantes

- Story 5.1: dashboard admin já integra status e histórico de compliance; manter compatibilidade sem duplicar fluxos.
- Story 5.2: exportação assinada já aplicada no contexto de auditoria; reaproveitar estratégia de integridade/assinatura em vez de implementar mecanismo paralelo.
- Evitar criação de "segunda home" ou de página redundante: evoluir `compliance-reports-settings` e integração existente no admin.

### Referências

- Story fonte: `_bmad-output/Epics/Epic5/Story-5-3.md`
- Epic: `_bmad-output/Epics/Epic5/Epic5.md`
- Story anterior: `_bmad-output/implementation-artifacts/5-2-auditoria-lgpd.md`
- Contexto do projeto: `_bmad-output/project-context.md`
- Arquitetura: `_bmad-output/planning-artifacts/architect.md`
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md`
- PRD: `_bmad-output/planning-artifacts/prd.md`

## Project Structure Notes

- Arquivos backend alvo (evolução):
  - `backend/src/controllers/compliance.ts`
  - `backend/src/lib/complianceReports.ts`
  - `backend/src/lib/complianceReport.ts`
  - `backend/src/routes/admin.ts`
  - `backend/src/tests/compliance-lgpd.test.ts`
- Arquivos frontend alvo (evolução):
  - `frontend/src/components/compliance-reports-settings/compliance-reports-settings.component.ts`
  - `frontend/src/components/compliance-reports-settings/compliance-reports-settings.component.html`
  - `frontend/src/components/compliance-reports-settings/compliance-reports-settings.component.scss`
  - `frontend/src/components/compliance-reports-settings/compliance-reports-settings.component.spec.ts`
  - `frontend/src/services/api.service.ts`
  - `frontend/src/types/index.ts`
- Não criar novos módulos sem necessidade. Priorizar extensão dos artefatos já existentes.

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Story fonte e epic analisados em `_bmad-output/Epics/Epic5/*`
- Contexto anterior analisado em `_bmad-output/implementation-artifacts/5-2-auditoria-lgpd.md`
- Código de compliance mapeado em backend/frontend antes da criação da story

### Completion Notes List

- Story 5.3 criada com contexto técnico completo para implementação incremental.
- Contratos, tarefas e guardrails definidos para evitar regressão do fluxo já existente de conformidade.
- Direcionamento explícito para reutilizar infraestrutura atual de geração/histórico/download.
- Implementação backend concluída com payload avançado de geração (`format`, `periodPreset`, `dateFrom/dateTo`, `signDigital`) e fallback legado.
- Coleta de dados por período aplicada em estatísticas/consentimentos/deleções/auditoria, com faixa consolidada exposta em `report.period`.
- Exportação multi-formato implementada: PDF regulatório (seções mandatórias), JSON e Excel (`Resumo`, `Consentimentos`, `Auditoria`, `Deleções`).
- Assinatura digital tornou-se opcional: com `signDigital=true` usa RSA+SHA256; com `false` mantém hash de integridade.
- Histórico enriquecido com `format`, `periodLabel`, `complianceStatus`, `isSigned`; download com `Content-Type` por formato.
- Frontend evoluído com modal "Gerar Relatório de Conformidade LGPD", opções de formato/período/assinatura, progresso de processamento e histórico enriquecido.
- Tipos e `ApiService` atualizados para novo contrato de request/response.
- Testes atualizados: backend (`compliance-lgpd.test.ts`) cobrindo formatos/período/assinatura/histórico; frontend com novo spec para `compliance-reports-settings`.
- Ajuste final: período custom agora trata datas `YYYY-MM-DD` com janela inclusiva (início e fim do dia), sem quebrar compatibilidade com payload ISO legado.
- Ajuste final: nome do arquivo exportado passou a usar nome/fantasia da academia quando disponível, mantendo fallback seguro.
- Ajuste final: exportação Excel agora inclui aba `Alertas` com recomendações de conformidade.
- Ajuste final: tela de configurações passou a carregar status de conformidade no `ngOnInit`.
- Revalidação final executada: backend `npm test -- src/tests/compliance-lgpd.test.ts` (13/13 pass) e frontend com execução completa contendo `TOTAL: 178 SUCCESS` no ciclo do Karma.

### File List

- `_bmad-output/implementation-artifacts/5-3-relatorio-conformidade.md`
- `backend/package.json`
- `backend/package-lock.json`
- `backend/src/controllers/compliance.ts`
- `backend/src/lib/complianceReport.ts`
- `backend/src/lib/complianceReports.ts`
- `backend/src/lib/complianceSchedule.ts`
- `backend/src/tests/compliance-lgpd.test.ts`
- `backend/src/types/index.ts`
- `_bmad-output/V7_0__Compliance_Reports.sql`
- `frontend/src/components/admin-dashboard/admin-dashboard.component.spec.ts`
- `frontend/src/components/compliance-reports-settings/compliance-reports-settings.component.ts`
- `frontend/src/components/compliance-reports-settings/compliance-reports-settings.component.html`
- `frontend/src/components/compliance-reports-settings/compliance-reports-settings.component.scss`
- `frontend/src/components/compliance-reports-settings/compliance-reports-settings.component.spec.ts`
- `frontend/src/services/api.service.ts`
- `frontend/src/types/index.ts`
