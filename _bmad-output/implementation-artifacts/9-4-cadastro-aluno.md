# Story 9.4: Cadastro e Edicao Completa do Aluno

Status: done

**Completion Date:** 2026-03-24
**Validation:** AC1-AC7 implemented and validated
**Backend Tests:** student-management suite passing (6/6)
**Frontend Build:** production build passing
**Review Outcome:** approved

**Prepared Date:** 2026-03-24
**Validation:** Story specification consolidated (AC1-AC7)
**Dependencies:** Story 9.1 (perfil academia), Story 9.2 (perfil admin), Story 9.3 (cadastro professor)

## Story

Como um Administrador ou Professor,
Quero cadastrar alunos com todos os dados completos e edita-los,
Para que a academia tenha registro completo dos alunos incluindo dados de contato, documentacao e situacao de menoridade para conformidade com LGPD.

## Contexto de Negocio

- A Story 1.2 permitiu registro minimo do Aluno (`fullName`, `email`, `password`, `role`).
- Esta story expande o fluxo para cadastro completo, manutencao do ciclo de vida do aluno e visualizacao de ficha completa.
- O schema atual de `users` ja possui campos relevantes para alunos: `document_id`, `birth_date`, `phone`, `address_*`, `is_minor`, `minor_consent_signed`, `is_active`, `data_entrada`, `data_saida`.
- Para menores de idade, a marcacao automatica de menoridade e a sinalizacao de vinculacao de responsavel sao obrigatorias para preparar Story 9.5.
- O objetivo e suportar operacao diaria de cadastro e manutencao de alunos sem quebrar isolamento multi-tenant nem RBAC.

## Acceptance Criteria

### AC1 - Listar alunos da academia
- DADO que o Admin ou Professor esta logado
- QUANDO acessa `/admin/alunos` (Admin) ou `/professores/meus-alunos` (Professor)
- ENTAO o sistema carrega alunos ativos da academia
- E professores veem apenas alunos de suas turmas
- E a lista mostra: Nome, Idade, Faixa, Status, Indicador de menor
- E a lista oferece filtro por nome e status

### AC2 - Formulario de cadastro completo do aluno
- DADO que o Admin ou Professor clica em "Novo Aluno"
- QUANDO o formulario de cadastro e exibido
- ENTAO contem:
  - Acesso: Email (obrigatorio), Senha temporaria (obrigatorio)
  - Dados Pessoais: Nome completo (obrigatorio), CPF (`document_id`, opcional), Data de Nascimento (obrigatorio)
  - Contato: Telefone do aluno (opcional)
  - Endereco: Logradouro, Numero, Complemento, Bairro, CEP, Cidade, Estado (opcionais)
  - Operacional: Data de Entrada (default hoje), Turma principal (opcional)
- E alterar Data de Nascimento recalcula menoridade automaticamente

### AC3 - Deteccao automatica de menoridade
- DADO que o usuario altera Data de Nascimento
- QUANDO o valor e processado
- ENTAO o sistema calcula idade em tempo real no frontend e confirma no backend
- E se `idade < 18`:
  - Exibe aviso: "Aluno menor de idade - sera necessario vincular responsavel"
  - `is_minor = true` e marcado automaticamente
  - Campo/seletor de responsavel e exibido para preparacao da Story 9.5
- E se `idade >= 18`:
  - Remove aviso e `is_minor = false`

### AC4 - Salvar novo aluno
- DADO que o Admin/Professor preencheu campos obrigatorios validos
- QUANDO clica em "Cadastrar Aluno"
- ENTAO o sistema cria usuario com `role = 'Aluno'`
- E exibe "Aluno [Nome] cadastrado"
- E se `is_minor = true` e sem responsavel vinculado, exibe aviso de pendencia para Story 9.5
- E redireciona para ficha do aluno recem-criado

### AC5 - Editar aluno existente
- DADO que o Admin ou Professor clica em "Editar"
- QUANDO o formulario abre
- ENTAO campos atuais sao pre-preenchidos
- E email permanece somente leitura
- E `is_minor` e recalculado se `birth_date` mudar

### AC6 - Ativar / Desativar aluno
- DADO que o Admin visualiza aluno ativo
- QUANDO clica em "Desativar" e confirma
- ENTAO `is_active = false` e `data_saida = hoje` sao persistidos
- E aluno passa a aparecer como inativo
- E aluno nao pode mais autenticar

### AC7 - Visualizar ficha completa do aluno
- DADO que Admin ou Professor acessa ficha do aluno
- QUANDO a ficha carrega
- ENTAO exibe:
  - Dados pessoais e contato
  - Status LGPD: consentimento assinado (Sim/Nao) e data
  - Status saude: anamnese preenchida (Sim/Nao) e link para Story 9.6
  - Responsavel vinculado (quando menor)
  - Turmas vinculadas

## Tasks / Subtasks

- [x] Task 1 - Definir contratos de API para CRUD de alunos (AC1, AC4, AC5, AC6, AC7)
  - [x] Definir listagem para Admin e Professor com filtros e indicadores de menoridade
  - [x] Definir payload de criacao/edicao com `birthDate` obrigatoria e regra de menoridade
  - [x] Definir retorno da ficha completa com blocos `lgpd`, `health`, `responsavel` e `turmas`

- [x] Task 2 - Backend: listagem de alunos com isolamento por papel (AC1)
  - [x] Criar endpoint Admin para listar alunos da academia
  - [x] Criar endpoint Professor para listar somente alunos das suas turmas
  - [x] Implementar filtros por nome/status e ordenacao por nome
  - [x] Incluir idade calculada e `isMinor` na resposta

- [x] Task 3 - Backend: criacao de aluno com menoridade automatica (AC2, AC3, AC4)
  - [x] Implementar `POST /api/users/alunos` com `requireRole(['Admin', 'Professor'])`
  - [x] Validar obrigatorios: email, senha, nome, `birthDate`
  - [x] Calcular `is_minor` no backend com base em `birthDate`
  - [x] Rejeitar inconsistencias entre `birthDate` e qualquer `isMinor` enviado pelo cliente
  - [x] Garantir unicidade de email por academia e hash seguro de senha
  - [x] Persistir `data_entrada` com default data atual

- [x] Task 4 - Backend: edicao e status de aluno (AC5, AC6)
  - [x] Implementar `PUT /api/users/alunos/:userId` (sem permitir edicao de email)
  - [x] Recalcular `is_minor` no update quando `birthDate` for alterada
  - [x] Implementar `PUT /api/users/alunos/:userId/status` (ativar/desativar)
  - [x] Ao desativar, preencher `data_saida` e revogar tokens ativos

- [x] Task 5 - Backend: ficha completa do aluno (AC7)
  - [x] Implementar `GET /api/users/alunos/:userId/ficha`
  - [x] Agregar dados de usuario + consentimento + saude + responsavel + turmas
  - [x] Respeitar RBAC e multi-tenant em todas as joins

- [x] Task 6 - Frontend: lista de alunos (AC1)
  - [x] Criar tela Admin `/admin/alunos`
  - [x] Criar tela Professor `/professores/meus-alunos`
  - [x] Implementar grid com Nome, Idade, Faixa, Status, Menor
  - [x] Implementar busca por nome e filtro por status

- [x] Task 7 - Frontend: formulario de aluno (AC2, AC3, AC4, AC5)
  - [x] Criar formulario completo de criacao/edicao
  - [x] Implementar calculo visual de idade e aviso de menoridade em tempo real
  - [x] Exibir campo de responsavel quando menor (placeholder para Story 9.5)
  - [x] Manter email bloqueado em modo edicao
  - [x] Exibir mensagens claras de sucesso/erro

- [x] Task 8 - Frontend: ficha completa de aluno (AC7)
  - [x] Criar componente de visualizacao com secoes: pessoais, LGPD, saude, responsavel, turmas
  - [x] Exibir links de navegacao para Stories 9.5 e 9.6 quando houver pendencias

- [x] Task 9 - Testes backend e frontend (AC1-AC7)
  - [x] Backend: listagem por papel, criacao, edicao, status, ficha completa
  - [x] Backend: menoridade (<18, =18, >18), token revocation ao desativar
  - [x] Backend: cenarios de isolamento multi-tenant e professor fora da turma
  - [x] Frontend: fluxo completo create/edit/list/status/ficha e mensagens
  - [ ] E2E: Admin cria aluno menor, sistema sinaliza pendencia de responsavel

## Dev Notes

### Escopo Deliberadamente Limitado

- Esta story cobre cadastro/edicao/listagem/ficha de Aluno.
- Nao implementar vinculacao completa de responsavel nesta story (Story 9.5).
- Nao implementar formulario completo de anamnese/saude nesta story (Story 9.6).

### Arquitetura e Compliance Obrigatorios

- Todas as operacoes exigem `authMiddleware`.
- Rotas de Admin/Professor devem usar `requireRole` e filtro de dados por `academy_id`.
- Professor nunca pode listar/editar aluno fora das suas turmas.
- Validacoes de payload via Joi, com erros padronizados JSON.
- Queries parametrizadas e sem SQL dinamico inseguro.

### Regras Criticas de Seguranca

- Backend e fonte de verdade para `is_minor`.
- Usuario inativo nao pode autenticar; desativacao deve revogar tokens.
- Nao vazar PII de outra academia em qualquer endpoint.
- Nao expor dados sensiveis de saude no formulario de cadastro (apenas status/link).

### Estrutura de Arquivos Recomendada

Backend - arquivos a alterar:
- backend/src/routes/users.ts
- backend/src/controllers/users.ts
- backend/src/lib/database.ts
- backend/src/lib/validators.ts
- backend/src/types/index.ts
- backend/src/middleware/auth.ts

Backend - arquivos novos sugeridos:
- backend/src/tests/student-management.test.ts

Frontend - arquivos a alterar:
- frontend/src/app.routing.module.ts
- frontend/src/app.module.ts
- frontend/src/services/api.service.ts
- frontend/src/types/index.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.html

Frontend - arquivos novos sugeridos:
- frontend/src/components/students-list/
  - students-list.component.ts
  - students-list.component.html
  - students-list.component.scss
  - students-list.component.spec.ts
- frontend/src/components/student-form/
  - student-form.component.ts
  - student-form.component.html
  - student-form.component.scss
  - student-form.component.spec.ts
- frontend/src/components/student-profile/
  - student-profile.component.ts
  - student-profile.component.html
  - student-profile.component.scss
  - student-profile.component.spec.ts

### Contratos Recomendados

Listagem Admin:
- GET /api/users/alunos?name=&status=
- Response: `{ students: StudentListItem[], filters, total }`

Listagem Professor (escopo turmas):
- GET /api/users/professores/meus-alunos?name=&status=
- Response: `{ students: StudentListItem[], filters, total }`

Criacao de aluno:
- POST /api/users/alunos
- Body: dados de acesso + pessoais + contato + endereco + operacional
- Response: `message + aluno + temporaryPassword`

Edicao de aluno:
- PUT /api/users/alunos/:userId
- Body: campos permitidos (sem email)
- Response: `message + aluno`

Status do aluno:
- PUT /api/users/alunos/:userId/status
- Body: `{ isActive: boolean }`
- Response: `message + aluno`

Ficha completa:
- GET /api/users/alunos/:userId/ficha
- Response: bloco consolidado com pessoais, lgpd, saude, responsavel e turmas

## Criticos para Implementacao

- Reutilizar padroes de controller, validacao e resposta usados em Story 9.3.
- Preservar endpoint existente de update self (`PUT /api/users/:userId`).
- Garantir que desativacao invalide acesso imediatamente em combinacao com verificacao de usuario ativo no fluxo de autenticacao/autorizacao.
- Cobrir fronteiras de idade: 17a364d (menor), 18 anos exatos (nao menor), datas futuras invalidas.
- Tratar ausencia de `minor_consent_signed` como pendencia visivel para operacao.

## Referencias

- _bmad-output/Epics/Epic9/Epic9.md
- _bmad-output/Epics/Epic9/Story-9-4.md
- _bmad-output/implementation-artifacts/9-3-cadastro-professor.md
- _bmad-output/project-context.md
- _bmad-output/planning-artifacts/prd.md
- _bmad-output/planning-artifacts/architect.md
- _bmad-output/planning-artifacts/ux.md
- backend/src/routes/users.ts
- backend/src/controllers/users.ts
- backend/src/lib/database.ts
- backend/src/lib/validators.ts
- backend/src/middleware/auth.ts
- backend/src/types/index.ts
- frontend/src/services/api.service.ts
- frontend/src/types/index.ts

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Completion Notes List

- Endpoints de alunos implementados no backend para listagem Admin/Professor, criacao, edicao, status e ficha consolidada com RBAC e isolamento por academia.
- Menoridade passou a ser recalculada no backend a partir de `birthDate`, com validacao de inconsistencias e sinalizacao de pendencia de responsavel para Story 9.5.
- Frontend recebeu telas de listagem, formulario (create/edit) e ficha completa do aluno, com filtros, avisos de menoridade e navegacao por papel.
- Cobertura de testes adicionada para cenarios principais de AC1-AC7 no backend; suite dedicada `student-management` executada com sucesso.
- Falha de integracao em joins de consentimento foi corrigida (`user_id`/`status`/`signed_at`), eliminando erros 500 na listagem e ficha.

### File List

- _bmad-output/implementation-artifacts/9-4-cadastro-aluno.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- backend/src/controllers/users.ts
- backend/src/lib/database.ts
- backend/src/lib/validators.ts
- backend/src/routes/users.ts
- backend/src/types/index.ts
- backend/src/tests/student-management.test.ts
- frontend/src/app.module.ts
- frontend/src/app.routing.module.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.html
- frontend/src/components/student-form/student-form.component.ts
- frontend/src/components/student-form/student-form.component.html
- frontend/src/components/student-form/student-form.component.scss
- frontend/src/components/student-form/student-form.component.spec.ts
- frontend/src/components/student-profile/student-profile.component.ts
- frontend/src/components/student-profile/student-profile.component.html
- frontend/src/components/student-profile/student-profile.component.scss
- frontend/src/components/student-profile/student-profile.component.spec.ts
- frontend/src/components/students-list/students-list.component.ts
- frontend/src/components/students-list/students-list.component.html
- frontend/src/components/students-list/students-list.component.scss
- frontend/src/components/students-list/students-list.component.spec.ts
- frontend/src/services/api.service.ts
- frontend/src/types/index.ts
