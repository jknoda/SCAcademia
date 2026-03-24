# Story 9.3: Cadastro e Edicao Completa do Professor

Status: done

**Completion Date:** 2026-03-24  
**Validation:** ✅ All AC (AC1-AC6) implemented and tested  
**Backend Tests:** 87 passed, 87 total  
**Frontend Tests:** 29 passed, 29 total  
**Build Status:** ✅ No compilation errors

## Story

Como um Administrador,
Quero cadastrar professores com todos os dados completos e edita-los posteriormente,
Para que a academia tenha um cadastro qualificado de seus professores para gestao e contato.

## Contexto de Negocio

- A Story 1.2 permitiu registro minimo do Professor (`fullName`, `email`, `password`, `role`).
- Esta story expande o cadastro para dados completos e fluxo de manutencao operacional.
- O schema atual de `users` ja suporta os campos necessarios para professor: `document_id`, `birth_date`, `phone`, `address_*`, `data_entrada`, `data_saida`, `is_active`.
- O objetivo e permitir gestao de ciclo de vida do professor (cadastro, edicao, ativacao e desativacao) com isolamento por academia.

## Acceptance Criteria

### AC1 - Listar professores da academia
- DADO que o Admin esta logado
- QUANDO acessa `/admin/professores`
- ENTAO o sistema carrega e exibe a lista de usuarios com `role = 'Professor'` da academia
- E a lista mostra: Nome, Email, Telefone, Data de entrada, Status (Ativo/Inativo)
- E a lista tem opcao de filtrar por nome e status

### AC2 - Cadastrar novo professor (formulario completo)
- DADO que o Admin clica em "Novo Professor"
- QUANDO o formulario de cadastro e exibido
- ENTAO contem:
  - Acesso: Email (obrigatorio, unico na academia), Senha temporaria (obrigatorio, gerada automaticamente ou manual)
  - Dados Pessoais: Nome completo (obrigatorio), CPF (`document_id`, opcional), Data de Nascimento (opcional)
  - Contato: Telefone (opcional)
  - Endereco: Logradouro, Numero, Complemento, Bairro, CEP, Cidade, Estado (todos opcionais)
  - Operacional: Data de Entrada na academia (opcional, default hoje)
- E o campo de senha exibe botao "Gerar senha aleatoria" que gera uma senha forte automaticamente

### AC3 - Salvar novo professor
- DADO que o Admin preencheu os campos obrigatorios com dados validos
- QUANDO clica em "Cadastrar Professor"
- ENTAO o sistema cria o usuario com `role = 'Professor'` via API
- E exibe: "Professor [Nome] cadastrado com sucesso"
- E se senha foi gerada automaticamente, exibe a senha em um modal (unica vez) com botao "Copiar"
- E redireciona para a tela de lista de professores

### AC4 - Editar professor existente
- DADO que o Admin clica em "Editar" em um professor da lista
- QUANDO o formulario de edicao e exibido
- ENTAO todos os campos sao carregados com os dados atuais do professor
- E o campo email nao e editavel (esta associado ao login)
- E a senha pode ser redefinida pelo Admin (campo separado "Redefinir Senha")

### AC5 - Ativar / Desativar professor
- DADO que o Admin visualiza um professor ativo
- QUANDO clica em "Desativar"
- ENTAO o sistema exibe confirmacao: "Desativar [Nome]? O professor nao conseguira mais fazer login."
- QUANDO confirma
- ENTAO `is_active = false` e salvo no banco
- E o professor e listado como "Inativo" na lista
- E `data_saida` e preenchida com a data atual

### AC6 - Validacoes
- DADO que o Admin preenche email ja cadastrado na academia
- QUANDO tenta salvar
- ENTAO o sistema exibe: "Email ja cadastrado para outro usuario desta academia"
- DADO que Admin preenche CPF com formato invalido
- QUANDO perde o foco do campo
- ENTAO exibe erro inline: "CPF invalido"

## Tasks / Subtasks

- [ ] Task 1 - Definir contratos de API para CRUD de professores (AC1, AC3, AC4, AC5, AC6)
  - [ ] Definir resposta de listagem com filtros por nome e status
  - [ ] Definir payload de criacao e edicao de professor
  - [ ] Definir contrato de ativacao/desativacao com `data_saida`

- [ ] Task 2 - Backend: listagem e filtros de professores da academia (AC1)
  - [ ] Criar endpoint de listagem de professores com `requireRole(['Admin'])`
  - [ ] Aplicar filtro por `academy_id` vindo do JWT
  - [ ] Implementar filtros por nome e status (`is_active`)

- [ ] Task 3 - Backend: criacao de professor com validacoes (AC2, AC3, AC6)
  - [ ] Implementar `POST /api/users` para role `Professor` em contexto Admin
  - [ ] Garantir unicidade de email por academia no fluxo
  - [ ] Aplicar hash de senha e nunca persistir senha em texto puro
  - [ ] Retornar erros padronizados de validacao/campo

- [ ] Task 4 - Backend: edicao, redefinicao de senha e status ativo/inativo (AC4, AC5)
  - [ ] Implementar `PUT /api/users/:userId` para edicao de professor
  - [ ] Preservar email como somente leitura no fluxo de edicao
  - [ ] Implementar redefinicao de senha por Admin (endpoint dedicado ou campo controlado)
  - [ ] Implementar desativacao/reativacao com `data_saida` e bloqueio de login

- [ ] Task 5 - Frontend: lista de professores e filtros (AC1)
  - [ ] Criar tela `/admin/professores` com listagem e colunas requeridas
  - [ ] Implementar busca por nome e filtro de status
  - [ ] Adicionar acoes de editar e ativar/desativar

- [ ] Task 6 - Frontend: formulario de cadastro e edicao de professor (AC2, AC3, AC4, AC6)
  - [ ] Criar formulario completo com validacao inline
  - [ ] Implementar geracao de senha forte e exibicao unica em modal
  - [ ] Implementar modo edicao com email bloqueado
  - [ ] Implementar acao de redefinir senha por Admin

- [ ] Task 7 - Testes backend e frontend (AC1-AC6)
  - [ ] Backend: listagem, criacao, edicao, ativacao/desativacao e validacoes
  - [ ] Frontend: fluxo de cadastro/edicao, filtros, modal de senha e mensagens
  - [ ] Cobrir isolamento multi-tenant e regras RBAC

## Dev Notes

### Escopo Deliberadamente Limitado

- Esta story cobre apenas o perfil de Professor em contexto de gestao pelo Admin.
- Nao incluir aqui fluxo completo de aluno/responsavel (Stories 9.4 e 9.5).
- Nao incluir aqui anamnese/onboarding de saude (Story 9.6).

### Arquitetura e Compliance Obrigatorios

- Todas as operacoes devem exigir `authMiddleware + requireRole(['Admin'])`.
- Isolamento multi-tenant obrigatorio por `academy_id` em leitura e escrita.
- Validacoes no backend com Joi e retorno JSON padronizado.
- Queries parametrizadas e sem SQL dinamico inseguro.

### Regras Criticas de Seguranca

- Senha temporaria deve ser apenas exibida ao Admin no momento de criacao.
- Senha nunca pode ser armazenada ou logada em texto puro.
- Redefinicao de senha deve atualizar `password_changed_at`.
- Usuario inativo (`is_active = false`) nao pode autenticar.

### Estrutura de Arquivos Recomendada

Backend - arquivos a alterar:
- backend/src/routes/users.ts
- backend/src/controllers/users.ts
- backend/src/lib/database.ts
- backend/src/lib/validators.ts
- backend/src/types/index.ts
- backend/src/middleware/auth.ts

Frontend - arquivos a alterar:
- frontend/src/app.routing.module.ts
- frontend/src/app.module.ts
- frontend/src/services/api.service.ts
- frontend/src/types/index.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.html

Frontend - arquivos novos sugeridos:
- frontend/src/components/professors-list/
  - professors-list.component.ts
  - professors-list.component.html
  - professors-list.component.scss
  - professors-list.component.spec.ts
- frontend/src/components/professor-form/
  - professor-form.component.ts
  - professor-form.component.html
  - professor-form.component.scss
  - professor-form.component.spec.ts

Backend - arquivos novos sugeridos:
- backend/src/tests/professor-management.test.ts

### Contratos Recomendados

Listagem de professores:
- GET /api/users/professores?name=&status=
- Response: lista de professores com campos para grid e metadata de paginacao/filtro

Criacao de professor:
- POST /api/users
- Body: dados de acesso, pessoais, contato, endereco e operacional
- Response: message + professor criado + senha temporaria (somente no retorno imediato)

Edicao de professor:
- PUT /api/users/:userId
- Body: campos permitidos de edicao (sem email)
- Response: message + professor atualizado

Ativar/desativar professor:
- PUT /api/users/:userId/status
- Body: `isActive: boolean`
- Response: message + professor atualizado (`data_saida` set/clear)

## Criticos para Implementacao

- Reutilizar padroes de validacao, erro e controller usados nas Stories 9.1 e 9.2.
- Nao quebrar endpoint existente de update self do usuario logado.
- Garantir compatibilidade com fluxo atual de login e RBAC.
- Priorizar feedback visual claro para erro de email duplicado e CPF invalido.

## Referencias

- _bmad-output/Epics/Epic9/Epic9.md
- _bmad-output/Epics/Epic9/Story-9-3.md
- _bmad-output/implementation-artifacts/9-2-perfil-administrador.md
- _bmad-output/project-context.md
- _bmad-output/V1_0__Core_Identity.sql
- backend/src/routes/users.ts
- backend/src/controllers/users.ts
- backend/src/lib/database.ts
- backend/src/lib/validators.ts
- backend/src/middleware/auth.ts
- frontend/src/services/api.service.ts
- frontend/src/types/index.ts

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Completion Notes List

- Story 9.3 criada com base nos requisitos oficiais do Epic 9 e Story-9-3.
- Contexto tecnico consolidado para backend, frontend, validacoes e seguranca.
- Guardrails de RBAC, multi-tenant e politica de senha documentados para evitar regressao.
- Story preparada como `ready-for-dev` para execucao direta por dev workflow.

### File List

- _bmad-output/implementation-artifacts/9-3-cadastro-professor.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
