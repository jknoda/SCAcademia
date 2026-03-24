# Story 9.6: Saude do Aluno Integrada ao Fluxo de Onboarding

Status: done

**Prepared Date:** 2026-03-24
**Validation:** Story specification consolidated (AC1-AC6)
**Dependencies:** Story 2.1 (anamnese), Story 3.2 (frequencia), Story 9.4 (cadastro aluno), Story 9.5 (vinculacao responsavel)

## Story

Como um Administrador ou Responsavel,
Quero preencher a anamnese de saude do aluno como parte do processo de cadastro,
Para que nenhum aluno inicie atividades fisicas na academia sem triagem de saude registrada, garantindo seguranca e conformidade operacional.

## Contexto de Negocio

- A anamnese ja existe no produto (Epic 2), com fluxo e backend implementados.
- Esta story integra o que ja existe ao onboarding e aos fluxos operacionais de aluno/professor/admin.
- O objetivo principal e visibilidade de pendencias + acao rapida, sem duplicar logica clinica.
- Deve preservar LGPD: nao expor dados sensiveis de saude fora dos papeis autorizados.

## Acceptance Criteria

### AC1 - Indicador de saude na ficha do aluno
- DADO que o Admin acessa a ficha de um aluno
- QUANDO visualiza a secao "Saude"
- ENTAO o sistema exibe o status da anamnese:
  - Anamnese preenchida (data do ultimo preenchimento) + link "Visualizar / Editar"
  - Anamnese nao preenchida + botao "Preencher Agora"
- E professores veem status simplificado (Sim/Não), sem link para dados completos (RBAC)

### AC2 - Botao "Preencher Anamnese" abre o formulario existente
- DADO que o aluno nao tem anamnese
- QUANDO o Admin clica em "Preencher Agora"
- ENTAO o sistema navega para `/health-screening/:studentId` (rota ja existente)
- E ao salvar, retorna para a ficha do aluno

### AC3 - Status de prontidao do aluno para treinar
- DADO que o aluno esta na lista da academia
- QUANDO o Admin visualiza a lista
- ENTAO um indicador de status mostra:
  - Completo: dados pessoais + responsavel (se menor) + anamnese
  - Incompleto: faltando um ou mais itens acima
- E o detalhe de pendencia fica claro para acao do Admin

### AC4 - Alerta ao registrar treino sem anamnese
- DADO que o Professor esta marcando presenca (Story 3.2) e um aluno sem anamnese esta na lista
- QUANDO o Professor tenta registrar o aluno como "Presente"
- ENTAO o sistema exibe aviso nao bloqueante recomendando preenchimento da anamnese
- E o Professor pode continuar o registro

### AC5 - Relatorio de alunos sem anamnese
- DADO que o Admin acessa a gestao de alunos com filtros
- QUANDO aplica filtro "Sem Anamnese"
- ENTAO o sistema lista alunos ativos sem `health_record`
- E exibe contagem total de pendencias
- E oferece acao rapida "Preencher" por aluno

### AC6 - Responsavel preenche anamnese (mobile-friendly)
- DADO que o responsavel esta logado e tem filho vinculado sem anamnese
- QUANDO acessa a Home
- ENTAO ve cartao de acao "Preencher Saude de [Nome Filho]"
- E ao clicar, acessa o formulario existente para o filho
- E apos salvar, o status do filho e atualizado

## Tasks / Subtasks

- [x] Task 1 - Consolidar contrato de status de anamnese por aluno (AC1, AC3, AC5)
  - [x] Confirmar fonte de verdade do status (`health_records` por aluno/academia)
  - [x] Definir payload para status simplificado em listagens
  - [x] Garantir retorno sem dados sensiveis no resumo

- [x] Task 2 - Ficha do aluno: bloco de saude integrado (AC1, AC2)
  - [x] Exibir status preenchida/pendente com data quando houver
  - [x] Exibir CTA "Preencher Agora" quando pendente
  - [x] Navegar para `/health-screening/:studentId` usando fluxo existente
  - [x] Aplicar RBAC visual para Professor (somente Sim/Nao)

- [x] Task 3 - Lista de alunos: prontidao operacional (AC3)
  - [x] Incluir indicador completo/incompleto na listagem
  - [x] Incluir detalhe de pendencia para acao do Admin
  - [x] Manter comportamento atual de filtros existentes

- [x] Task 4 - Frequencia: alerta nao bloqueante de anamnese (AC4)
  - [x] Incluir flag booleana de anamnese no contexto de frequencia
  - [x] Mostrar aviso ao marcar Presente para aluno sem anamnese
  - [x] Garantir que o aviso nao bloqueia o salvamento

- [x] Task 5 - Filtro admin "Sem Anamnese" (AC5)
  - [x] Criar endpoint/listagem de alunos ativos sem health_record
  - [x] Expor contador total
  - [x] Integrar botao rapido para abrir preenchimento por aluno

- [x] Task 6 - Home do Responsavel com CTA de saude (AC6)
  - [x] Listar filhos vinculados sem anamnese
  - [x] Exibir cartao de acao mobile-friendly
  - [x] Navegar para formulario de saude do filho
  - [x] Atualizar estado da tela apos salvar

- [x] Task 7 - Testes backend e frontend (AC1-AC6)
  - [x] Backend: status/filtro sem anamnese + RBAC
  - [x] Backend: aviso nao bloqueante em frequencia
  - [x] Frontend: ficha, lista, frequencia e home do responsavel
  - [x] Integracao: aluno sai da pendencia apos salvar anamnese

## Dev Notes

### Escopo Deliberadamente Limitado

- Nao reimplementar `HealthScreeningFormComponent`; reutilizar o fluxo existente.
- Nao introduzir novos dados clinicos; apenas integrar status operacional.
- Nao expor dados sensiveis em telas de professor ou listagens gerais.

### Arquitetura e Compliance Obrigatorios

- Preservar RBAC atual por papel (`Admin`, `Professor`, `Responsavel`).
- Isolamento multi-tenant em todas as consultas por `academy_id`.
- LGPD: trafegar para listagens apenas indicador de existencia de anamnese.
- Evitar duplicidade de chamadas desnecessarias em telas de listagem/frequencia.

### Regras Criticas de Dominio

- Aluno sem anamnese pode aparecer na frequencia, mas com alerta de risco (nao bloqueante).
- Prontidao completa para aluno menor exige responsavel vinculado + anamnese.
- Qualquer acao de preenchimento deve apontar para a rota existente de saude.

### Estrutura de Arquivos Recomendada

Backend - arquivos a alterar:
- backend/src/lib/database.ts
- backend/src/controllers/users.ts
- backend/src/controllers/deletion.ts (somente se reutilizar padroes de listagem por responsavel)
- backend/src/controllers/training.ts (ou equivalente da Story 3.2)
- backend/src/routes/users.ts
- backend/src/routes/trainings.ts (ou equivalente)

Frontend - arquivos a alterar:
- frontend/src/components/student-profile/student-profile.component.ts
- frontend/src/components/student-profile/student-profile.component.html
- frontend/src/components/students-list/students-list.component.ts
- frontend/src/components/students-list/students-list.component.html
- frontend/src/components/training-attendance/training-attendance.component.ts
- frontend/src/components/home/home.component.ts
- frontend/src/components/home/home.component.html
- frontend/src/services/api.service.ts
- frontend/src/types/index.ts

Backend - arquivos de teste sugeridos:
- backend/src/tests/student-management.test.ts
- backend/src/tests/training-attendance.test.ts

Frontend - arquivos de teste sugeridos:
- frontend/src/components/student-profile/student-profile.component.spec.ts
- frontend/src/components/students-list/students-list.component.spec.ts
- frontend/src/components/training-attendance/training-attendance.component.spec.ts
- frontend/src/components/home/home.component.spec.ts

### Contratos Recomendados

Status de saude na ficha:
- GET `/api/users/alunos/:userId/ficha`
- Incluir `health.anamnesePreenchida` e `health.lastUpdatedAt` quando aplicavel

Pendencias de anamnese (admin):
- GET `/api/admin/lgpd/students-without-health-screening`
- Response: `{ students, total, filter }`

Resumo para frequencia:
- GET contexto de frequencia deve incluir boolean por aluno: `hasHealthScreening`

Acao responsavel:
- GET filhos vinculados deve suportar identificacao dos que estao sem anamnese

## Criticos para Implementacao

- Reutilizar o formulario de saude existente e seu contrato atual.
- Manter consistencia visual com os fluxos de Story 9.4 e 9.5.
- Cuidar de loading/error em todos os novos caminhos para evitar estado preso.
- Garantir que avisos de frequencia nao exponham detalhe clinico.

## Referencias

- _bmad-output/Epics/Epic9/Epic9.md
- _bmad-output/Epics/Epic9/Story-9-6.md
- _bmad-output/implementation-artifacts/9-4-cadastro-aluno.md
- _bmad-output/implementation-artifacts/9-5-vinculacao-responsavel.md
- backend/src/controllers/users.ts
- backend/src/controllers/training.ts
- backend/src/lib/database.ts
- frontend/src/components/health-screening-form/health-screening-form.component.ts
- frontend/src/components/training-attendance/training-attendance.component.ts
- frontend/src/components/home/home.component.ts

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Completion Notes List

- Story 9.6 criada com foco em integracao operacional da anamnese ja existente.
- Criticidade de RBAC/LGPD explicitada para evitar exposicao de dados sensiveis.
- Subtasks organizadas por fluxo: ficha, lista, frequencia, relatorio admin e home responsavel.
- Dependencias e referencias alinhadas com as stories 2.1, 3.2, 9.4 e 9.5.
- Backend passou a expor resumo operacional de saude sem dados clinicos em ficha, listagens, frequencia e home do responsavel.
- A ficha do aluno agora mostra data da ultima anamnese, CTA real para preenchimento/edicao e retorno ao contexto anterior apos salvar.
- A gestao de alunos ganhou indicador de prontidao, filtro rapido "Sem Anamnese" e acao "Preencher" por aluno.
- A frequencia passou a incluir flag de anamnese e aviso nao bloqueante ao marcar Presente para aluno pendente.
- A home do responsavel ganhou cartoes mobile-friendly para filhos sem anamnese e atualizacao do status apos salvar.
- Validacoes executadas: `backend npm test -- src/tests/student-management.test.ts src/tests/training-attendance.test.ts`, `backend npm run build`, `frontend npm test -- --watch=false --browsers=ChromeHeadless`, `frontend npm run build`.

### File List

- _bmad-output/implementation-artifacts/9-6-saude-aluno-onboarding.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- backend/src/controllers/trainingAttendance.ts
- backend/src/controllers/users.ts
- backend/src/lib/database.ts
- backend/src/lib/deletionRequests.ts
- backend/src/lib/trainingAttendance.ts
- backend/src/routes/admin.ts
- backend/src/tests/student-management.test.ts
- backend/src/tests/training-attendance.test.ts
- frontend/src/components/health-screening-form/health-screening-form.component.ts
- frontend/src/components/home/home.component.html
- frontend/src/components/home/home.component.scss
- frontend/src/components/home/home.component.spec.ts
- frontend/src/components/home/home.component.ts
- frontend/src/components/student-profile/student-profile.component.html
- frontend/src/components/student-profile/student-profile.component.scss
- frontend/src/components/student-profile/student-profile.component.spec.ts
- frontend/src/components/student-profile/student-profile.component.ts
- frontend/src/components/students-list/students-list.component.html
- frontend/src/components/students-list/students-list.component.scss
- frontend/src/components/students-list/students-list.component.spec.ts
- frontend/src/components/students-list/students-list.component.ts
- frontend/src/components/training-attendance/training-attendance.component.html
- frontend/src/components/training-attendance/training-attendance.component.spec.ts
- frontend/src/components/training-attendance/training-attendance.component.ts
- frontend/src/services/api.service.ts
- frontend/src/types/index.ts

### Change Log

- 2026-03-24: Implementada a Story 9.6 com integracao da anamnese ao onboarding, frequencia, listagem admin e home do responsavel; validada com testes backend/frontend e builds de backend/frontend.
- 2026-03-24: Story aprovada em review e promovida para done.
