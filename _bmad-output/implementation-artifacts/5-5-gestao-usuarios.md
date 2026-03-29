# Story 5.5: Gestao de Usuarios - Criar, Editar, Bloquear

Status: done

## Story

Como um Admin,
Quero gerenciar usuarios da academia (criar, editar, bloquear e deletar logicamente),
Para que eu controle acessos e permissoes com seguranca e rastreabilidade.

## Contexto de Negocio

- Esta story continua a trilha do Epic 5 apos:
  - 5.1 Dashboard Admin (entrada para acao administrativa)
  - 5.2 Auditoria LGPD (timeline e rastreabilidade)
  - 5.3 Relatorio de conformidade (exportacao e historico)
  - 5.4 Alertas em tempo real (acao operacional imediata)
- O sistema ja possui fluxos maduros separados para professores e alunos em `users`:
  - listagem, criacao, edicao e ativacao/desativacao por role
  - validacoes, multi-tenant por `academy_id` e guardrails RBAC
- O objetivo desta story e consolidar uma experiencia administrativa unificada de gestao de usuarios (cross-role), sem duplicar fluxos existentes e sem quebrar contratos atuais.

## Acceptance Criteria

1. Dado que Admin acessa "Admin > Gerenciar Usuarios", quando clica, entao exibe lista paginada (20 por pagina) com colunas Nome | Email | Role | Status | Acoes.

2. Dado que Admin quer adicionar usuario, quando clica "[+ Novo Usuario]", entao exibe formulario com Email, Nome Completo, Role [Professor|Aluno|Admin|Responsavel], Status [Ativo|Bloqueado] e opcao "Enviar convite".

3. Dado que Admin preenche e confirma, quando clica "Criar", entao usuario e criado e recebe email com link para completar cadastro.

4. Dado que Admin quer editar usuario existente, quando clica "[Editar]", entao abre modal com Nome editavel, Email nao editavel, Role alteravel (com regra de permissao) e Status alteravel.

5. Dado que Admin altera role (ex.: Aluno -> Professor), quando salva, entao permissoes mudam imediatamente, usuario recebe novo contexto no proximo refresh e evento e registrado no audit log.

6. Dado comportamento suspeito, quando Admin clica "[Bloquear]", entao abre confirmacao com motivo [Seguranca|Violacao Termos|Outro], marca usuario como bloqueado e proximo login falha com mensagem de conta desativada.

7. Dado que Admin quer reativar, quando clica "[Desbloquear]", entao acesso e restaurado imediatamente.

8. Dado que Admin quer remover usuario, quando clica "[Deletar]", entao exibe aviso de soft delete, confirma acao e persiste `soft_delete=true` + `deleted_at=NOW()`, preservando historico/auditoria.

9. Dado muitos usuarios, quando Admin filtra, entao suporta filtros por Role, Status e busca por nome/email.

10. Dado busca por termo (ex.: "Joao"), quando digita, entao lista filtra em tempo real (target < 200ms) e destaca ocorrencias.

11. Dado que Admin exporta lista, quando clica "[Exportar]", entao gera CSV com nome padrao `Usuarios_[Academia]_[Data].csv`.

## Tasks / Subtasks

- [x] Consolidar contrato backend para gestao unificada de usuarios (AC: 1, 2, 4, 9)
  - [x] Definir endpoint dedicado para listagem cross-role com paginacao e filtros (`page`, `limit=20`, `role`, `status`, `search`) reutilizando `users` existente.
  - [x] Evitar quebra dos endpoints legados (`/api/users/professores` e `/api/users/alunos`), mantendo compatibilidade de telas atuais.
  - [x] Padronizar resposta com campos minimos: `id`, `fullName`, `email`, `role`, `isActive`, `deletedAt`, metadados de pagina.

- [x] Implementar criar usuario multi-role com convite (AC: 2, 3)
  - [x] Criar fluxo de criacao para `Professor|Aluno|Admin|Responsavel` com validacoes de role e unicidade por academia.
  - [x] Implementar opcao `sendInvite=true` reaproveitando infraestrutura de email e token seguro (nao criar mecanismo paralelo de autenticacao).
  - [x] Garantir trilha auditavel de criacao/convite com ator, alvo e resultado.

- [x] Implementar edicao de dados e role/status em fluxo unico (AC: 4, 5, 6, 7)
  - [x] Permitir editar nome e status; manter email imutavel como identificador logico.
  - [x] Permitir troca de role somente para Admin autorizado e com validacoes de seguranca/escopo.
  - [x] Aplicar bloqueio/desbloqueio via `is_active` (ou status equivalente no dominio atual), refletindo no login imediatamente.
  - [x] Registrar auditoria para alteracao de role/status com motivo quando aplicavel.

- [x] Implementar soft delete com preservacao historica (AC: 8)
  - [x] Expor acao administrativa de delecao logica (`deleted_at`), sem hard delete.
  - [x] Garantir que listagens operacionais padrao continuem filtrando `deleted_at IS NULL`.
  - [x] Preservar referencial para trilhas de auditoria e historico de conformidade.

- [x] Implementar exportacao CSV da listagem consolidada (AC: 11)
  - [x] Reutilizar padrao de exportacao CSV ja usado no modulo de auditoria.
  - [x] Aplicar os mesmos filtros ativos na exportacao para manter consistencia de tela x arquivo.
  - [x] Garantir codificacao e escaping seguros para campos textuais.

- [x] Evoluir frontend para tela unificada "Admin > Gerenciar Usuarios" (AC: 1, 2, 4, 9, 10, 11)
  - [x] Criar rota/tela administrativa dedicada (ex.: `/admin/users`) para grade consolidada com paginacao de 20 itens.
  - [x] Implementar filtros de role/status/busca com debounce para meta de resposta percebida (< 200ms em uso normal).
  - [x] Implementar acoes por linha: editar, bloquear/desbloquear, deletar (soft), exportar.
  - [x] Reaproveitar componentes/estilos dos fluxos de professores e alunos para manter coerencia UX.

- [x] Integrar quick action do dashboard com nova tela (AC: 1)
  - [x] Atualizar acao `manage-users` no dashboard para navegar para rota unificada de usuarios.
  - [x] Garantir retrocompatibilidade de navegacoes existentes para `/admin/alunos` e `/admin/professores`.

- [x] Testes e validacoes (AC: 1-11)
  - [x] Backend: criar suite dedicada de user-management admin cobrindo paginacao, filtros, criacao, convite, alteracao de role, bloqueio/desbloqueio, soft delete e exportacao CSV.
  - [x] Backend: validar RBAC e isolamento multi-tenant (admin de outra academia nao altera/visualiza registros).
  - [x] Frontend: specs da tela unificada (filtros, busca debounce, acoes por linha, modais de confirmacao, exportacao).
  - [x] Frontend: validar redirecionamento da quick action "Gerenciar Usuarios" para rota correta.

## Dev Notes

### Estado atual do codigo (nao recriar)

- Backend ja possui endpoint administrativo basico de usuarios da academia em `GET /api/admin/users`.
- Backend ja possui fluxos maduros por role em `users`:
  - Professores: listar/criar/editar/status/reset senha.
  - Alunos: listar/criar/editar/status/ficha e filtros operacionais.
- Login ja respeita status inativo, bloqueando autenticacao quando usuario nao esta ativo.
- Frontend ja possui telas separadas para professores e alunos com filtros e alteracao de status.
- Dashboard admin ja possui quick action "Gerenciar Usuarios", mas hoje redireciona para lista de alunos (nao para visao consolidada).

### Gaps concretos para esta story

1. Nao existe pagina unificada `/admin/users` com listagem cross-role.
2. Nao existe paginacao padronizada de 20 itens na gestao consolidada.
3. Nao existe fluxo de convite de setup na criacao administrativa cross-role.
4. Nao existe acao unificada de soft delete em usuarios no painel admin.
5. Nao existe exportacao CSV da listagem consolidada de usuarios.

### Requisitos de arquitetura e guardrails

- Manter stack atual (Angular + Node.js/Express + PostgreSQL + TypeScript).
- Reusar tabela `users` e colunas existentes (`is_active`, `deleted_at`) sem criar entidade paralela de usuarios.
- Multi-tenant obrigatorio por `academy_id` em todas as queries e mutacoes.
- Nao quebrar endpoints existentes usados por telas de professores/alunos.
- Todas as acoes administrativas sensiveis (create/update/role/status/delete/export) devem gerar `logAudit`.
- Mudanca de role deve preservar seguranca de autorizacao (somente Admin) e evitar escalacao indevida.

### Seguranca e conformidade

- Soft delete deve preservar dados para auditoria LGPD e historico operacional.
- Bloqueio de usuario deve impedir login imediatamente e registrar motivo quando informado.
- Convites e links de setup devem usar token de curta duracao, com armazenamento/validacao segura e sem vazar existencia de contas fora do escopo.

### Performance e UX

- Lista principal com paginacao server-side (20 por pagina) e filtros index-friendly.
- Busca com debounce no frontend e resposta eficiente para experiencia fluida.
- Mensagens de erro/sucesso claras em PT-BR, com confirmacoes explicitas para acoes destrutivas logicas.

### Referencias

- Story fonte: `_bmad-output/Epics/Epic5/Story-5-5.md`
- Epic: `_bmad-output/Epics/Epic5/Epic5.md`
- Story anterior: `_bmad-output/implementation-artifacts/5-4-alertas-tempo-real.md`
- Arquitetura: `_bmad-output/planning-artifacts/architect.md`
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md`
- PRD: `_bmad-output/planning-artifacts/prd.md`
- Backend usuarios: `backend/src/controllers/users.ts`, `backend/src/routes/users.ts`, `backend/src/lib/database.ts`
- Backend admin routes: `backend/src/routes/admin.ts`
- Frontend base: `frontend/src/components/students-list/*`, `frontend/src/components/professors-list/*`, `frontend/src/components/admin-dashboard/admin-dashboard.component.ts`, `frontend/src/services/api.service.ts`

## Project Structure Notes

- Backend (provavel evolucao):
  - `backend/src/routes/admin.ts` (rotas de gestao consolidada)
  - `backend/src/controllers/users.ts` ou controller admin dedicado para user management
  - `backend/src/lib/database.ts` (queries paginadas/filtros/soft delete)
  - `backend/src/lib/validators.ts` (schemas de payload/filtros)
  - `backend/src/lib/audit.ts` (eventos de auditoria)
  - `backend/src/tests/*` (suite dedicada de gestao de usuarios admin)

- Frontend (provavel evolucao):
  - `frontend/src/app.routing.module.ts` (rota `/admin/users`)
  - novo componente de lista unificada de usuarios admin (ou composicao dos existentes)
  - `frontend/src/services/api.service.ts` (metodos de listagem paginada, mutacoes, exportacao)
  - `frontend/src/types/index.ts` (tipos da listagem consolidada e filtros)
  - `frontend/src/components/admin-dashboard/admin-dashboard.component.ts` (quick action)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (GitHub Copilot)

### Debug Log References

- Tipos de usuario gerenciado duplicados pelo patch tool na insercao em `frontend/src/types/index.ts`; corrigido usando ancora `StudentMutationResponse` como referencia unica.
- Rota de exportacao CSV `/api/admin/users/export` precisa ser registrada ANTES das rotas parametrizadas `/:userId` para evitar que Express trate "export" como userId.
- Convite/invite link exposto no body de resposta somente em `NODE_ENV === 'test'` (mesmo padrao de `forgotPasswordHandler`).

### Completion Notes List

- Endpoint unificado `GET /api/admin/users` com paginacao, filtros de role/status/busca e metadados implementado.
- Criacao de usuario cross-role (Admin/Professor/Aluno/Responsavel) com geração de senha temporaria e envio de convite por email (reaproveitando `sendPasswordResetEmail` + `storeAuthToken`).
- Edicao de nome, role e status via PUT com guard anti-auto-desativacao e auditoria.
- Soft delete (`deleted_at`, `is_active=false`, revogacao de tokens) com auditoria.
- Exportacao CSV com Content-Disposition e codificacao segura dos campos.
- Frontend: novo componente `AdminUsersListComponent` em `/admin/users` com debounce de busca, modais de criacao/edicao, acoes por linha e download de CSV.
- Dashboard quick action `goToStudents()` redirecionada para `/admin/users`; retrocompatibilidade de `/admin/alunos` preservada via `goToMinorsWithoutGuardian()`.
- Testes backend: 4/4 PASS (`admin-user-management.test.ts`). Testes frontend: 189 SUCCESS (Karma).
- Falhas pre-existentes nao introduzidas: `admin-profile.test.ts` (1 falha de 404 vs 401) e `sync-queue.test.ts` (ESM uuid incompatibilidade com Jest).

### File List

**Backend (modificados):**
- `backend/src/lib/database.ts`
- `backend/src/types/index.ts`
- `backend/src/lib/validators.ts`
- `backend/src/controllers/users.ts`
- `backend/src/routes/admin.ts`

**Backend (novo):**
- `backend/src/tests/admin-user-management.test.ts`

**Frontend (modificados):**
- `frontend/src/types/index.ts`
- `frontend/src/services/api.service.ts`
- `frontend/src/services/api.service.spec.ts`
- `frontend/src/app.module.ts`
- `frontend/src/app.routing.module.ts`
- `frontend/src/components/admin-dashboard/admin-dashboard.component.ts`

**Frontend (novos):**
- `frontend/src/components/admin-users-list/admin-users-list.component.ts`
- `frontend/src/components/admin-users-list/admin-users-list.component.html`
- `frontend/src/components/admin-users-list/admin-users-list.component.scss`
- `frontend/src/components/admin-users-list/admin-users-list.component.spec.ts`

**BMAD (modificados):**
- `_bmad-output/implementation-artifacts/5-5-gestao-usuarios.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

| Data | Mudanca | Impacto |
|------|---------|--------|
| 2025-07 | Novo endpoint `GET /api/admin/users` com paginacao+filtros | Substitui `listAcademyUsers` basico |
| 2025-07 | Novos endpoints `POST/PUT/DELETE /api/admin/users` | Criacao, edicao e soft delete de usuarios |
| 2025-07 | Novo endpoint `GET /api/admin/users/export` | Exportacao CSV consolidada |
| 2025-07 | Novo componente `AdminUsersListComponent` em `/admin/users` | Tela unificada de gestao |
| 2025-07 | `goToStudents()` redireciona para `/admin/users` | Quick action do dashboard corrigida |
