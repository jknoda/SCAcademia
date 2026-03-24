# Story 2.6: Conformidade LGPD — Exportar Relatório

Status: done

## Story

Como um Admin auditando conformidade legal,
Quero exportar relatório que prove que Academia é LGPD-compliant,
Para que possa demonstrar para auditores/reguladores conformidade completa.

## Contexto de Negocio

- Foco em demonstração de conformidade legal para auditorias externas.
- Story depende de dados já criados/auditados em Stories 2.1 a 2.5 (saúde, consentimento, auditoria, deleção).
- Relatório deve ser gerado com segurança, assinado digitalmente e armazenável em histórico.
- Seções refletem pilares de conformidade: estatísticas, consentimentos, deleções, auditoria, segurança, assinatura.

## Acceptance Criteria

### AC1 - Interface de Geração
- DADO que Admin acessa "Admin > Conformidade LGPD > Gerar Relatório"
- QUANDO clica o botão
- ENTAO o sistema inicia processamento
- E exibe: "Gerando relatório... (pode levar 2-3 min)"

### AC2 - Relatório Completo com Seções
- DADO que processamento termina
- QUANDO relatório é completo
- ENTAO exibe botão "Download PDF" com 6 seções:
  1. **Estatísticas Gerais**: total alunos, menores, consentidos, expirados
  2. **Consentimentos**: tabela com versões (Saúde/Ética/Privacidade), total aprovados/pendentes
  3. **Dados Deletados**: solicitações processadas/pendentes, agregação de hard-deletes
  4. **Auditoria de Acesso**: acessos últimos 90 dias, tentativas indevidas, anomalias
  5. **Encriptação & Segurança**: AES-256, HTTPS, rate limiting, backup encriptado
  6. **Assinatura Legal**: Admin que assinou, data, RSA-2048

### AC3 - Assinatura Digital & Integridade
- DADO que relatório é gerado
- QUANDO Admin o assina (ou auto-assinado com credenciais)
- ENTAO arquivo é marcado como NFE (não-editável, apenas leitura)
- E nome: "LGPD_Conformidade_SCAcademia_2026-03-19.pdf"
- E assinatura RSA-2048 garante autenticidade

### AC4 - Alertas de Conformidade
- DADO que há problemas (ex: consentimento expirado)
- QUANDO relatório é gerado
- ENTAO destaca em vermelho: "⚠️ ALERTA: X alunos com consentimento expirado"
- E recomendação: "Contate responsáveis para renovar"

### AC5 - Agendamento Automático
- DADO que Admin quer scheduling automático
- QUANDO acessa "Configurações > Relatórios Automáticos"
- ENTAO consegue agendar: "Gerar relatório LGPD todo mês no dia 1"
- E relatórios salvos em histórico com timestamps para auditoria

## Tasks / Subtasks

- [x] **Task 1 - Backend: Endpoint de geração de relatório** (AC1, AC2)
  - [x] GET /api/admin/compliance-report/generate — inicia job assíncrono
  - [x] Job coleta estatísticas (alunos, menores, consentimentos, deleções, auditoria)
  - [x] Compila seções de conformidade em estrutura de dados

- [x] **Task 2 - Backend: Geração de PDF com assinatura** (AC3)
  - [x] Usar biblioteca PDFKit ou similar para gerar PDF
  - [x] Aplicar assinatura digital RSA-2048 ao documento
  - [x] Salvar em storage com hash para verificação de integridade
  - [x] Retornar link de download seguro

- [x] **Task 3 - Backend: Lógica de alertas** (AC4)
  - [x] Detectar consentimentos expirados durante geração
  - [x] Gerar avisos em vermelho no PDF com recomendações
  - [x] Incluir seção de riscos/anomalias detectadas

- [x] **Task 4 - Backend: Agendamento automático** (AC5)
  - [x] GET /api/admin/compliance-report/schedule — listar configurações
  - [x] POST /api/admin/compliance-report/schedule — agendar (CRON)
  - [x] Histórico de relatórios gerados armazenado com metadados
  - [x] Notificação ao Admin quando relatório é pronto

- [x] **Task 5 - Frontend: Painel de conformidade** (AC1, AC4)
  - [x] Nova seção em Admin Dashboard: "Conformidade LGPD"
  - [x] Botão "Gerar Relatório" com spinner durante processamento
  - [x] Exibição de alertas em tempo real
  - [x] Link de download após conclusão

- [x] **Task 6 - Frontend: Configurações de agendamento** (AC5)
  - [x] Página "Configurações > Relatórios Automáticos"
  - [x] Form para agendar relatórios (frequência, dia, horário)
  - [x] Lista de relatórios gerados com histórico

- [x] **Task 7 - Testes de integração** (AC1-AC5)
  - [x] Testar geração básica de PDF sem erros
  - [x] Validar assinatura e integridade do documento
  - [x] Testar alertas quando dados não-conformes
  - [x] Testar agendamento e histórico

## Dev Notes

- Usar PDFKit + node-rsa para geração + assinatura (alternativa: usar serviço externo como SignDoc se disponível)
- Alertas devem ser não-intrusivos mas claros (vermelho de fundo + ícone de warning)
- Agendamento via job queue (ex: Bull) se houver volume alto de relatórios
- Histórico de relatórios pode ser salvo em S3/filesystem ou referenciado via tabela `compliance_reports`
- Garantir que PDF é não-editável e que assinatura é verificável por ferramentas padrão
- Considerar multi-idioma (pt-BR, en-US) no texto do relatório para expandir mercado

## Dev Agent Record

### Completion Notes

- Implementado backend completo de relatório LGPD com consolidação de dados, PDF assinado via RSA-2048, persistência em `compliance_reports`, download seguro e histórico por academia.
- Adicionado scheduler persistido em arquivo local para geração mensal, com consulta e atualização via endpoints admin.
- Integrado frontend com nova seção de conformidade no dashboard e página dedicada de “Configurações > Relatórios Automáticos”.
- Validado com 9 testes de integração dedicados para Story 2.6, build do backend, build do frontend e suíte completa do backend sem regressões.

## File List

- backend/package.json
- backend/package-lock.json
- backend/src/controllers/compliance.ts
- backend/src/index.ts
- backend/src/lib/complianceReport.ts
- backend/src/lib/complianceReports.ts
- backend/src/lib/complianceSchedule.ts
- backend/src/routes/admin.ts
- backend/src/tests/compliance-lgpd.test.ts
- backend/src/types/index.ts
- frontend/src/app.module.ts
- frontend/src/app.routing.module.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.html
- frontend/src/components/admin-dashboard/admin-dashboard.component.scss
- frontend/src/components/compliance-reports-settings/compliance-reports-settings.component.ts
- frontend/src/components/compliance-reports-settings/compliance-reports-settings.component.html
- frontend/src/components/compliance-reports-settings/compliance-reports-settings.component.scss
- frontend/src/services/api.service.ts
- frontend/src/types/index.ts

## Change Log

- 2026-03-24: Implementado relatório LGPD com PDF assinado, histórico, download, alertas e agendamento automático no backend e frontend.
