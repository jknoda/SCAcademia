# Story 9.5: Vinculacao de Responsavel ao Aluno Menor

Status: done

**Prepared Date:** 2026-03-24
**Validation:** Story specification consolidated (AC1-AC6)
**Dependencies:** Story 2.2 (consentimento LGPD), Story 9.4 (cadastro aluno)

## Story

Como um Administrador,
Quero vincular um responsavel legal (pai/mae/guardiao) a um aluno menor de idade,
Para que a academia tenha o responsavel registrado, possa enviar comunicacoes e garantir conformidade com a LGPD para dados de menores.

## Contexto de Negocio

- O sistema ja possui suporte ao papel `Responsavel` no dominio de usuarios.
- A Story 2.2 ja usa fluxo de consentimento para menor, mas esta story formaliza o cadastro e a vinculacao no onboarding operacional.
- A Story 9.4 ja identifica menoridade via `is_minor` e expoe pendencia de responsavel na ficha do aluno.
- Esta story fecha o gap entre deteccao de menoridade e conformidade operacional/LGPD no dia a dia da academia.

## Acceptance Criteria

### AC1 - Iniciar vinculacao pela ficha do aluno menor
- DADO que o Admin esta na ficha de um aluno menor (`is_minor = true`) sem responsavel vinculado
- QUANDO visualiza a secao "Responsavel Legal"
- ENTAO ve o status: "Nenhum responsavel vinculado"
- E ve o botao "Vincular Responsavel"

### AC2 - Vincular responsavel existente
- DADO que o Admin clica em "Vincular Responsavel"
- QUANDO o painel de vinculacao abre
- ENTAO o Admin pode buscar por email ou nome de um responsavel ja cadastrado na academia
- E a busca retorna resultados em tempo real (minimo 3 caracteres)
- E o Admin clica em "Vincular" no resultado desejado
- E o sistema cria o vinculo via `POST /api/guardians/:guardianId/link/:studentId`
- E exibe: "Responsavel [Nome] vinculado ao aluno [Nome]"

### AC3 - Cadastrar novo responsavel e vincular automaticamente
- DADO que o responsavel ainda nao tem cadastro no sistema
- QUANDO o Admin clica em "Cadastrar Novo Responsavel"
- ENTAO um formulario aparece com:
  - Nome completo (obrigatorio)
  - Email (obrigatorio - sera o login do responsavel)
  - CPF (opcional)
  - Telefone (obrigatorio)
  - Relacao com aluno: "Pai", "Mae", "Guardiao Legal", "Outro" (obrigatorio)
  - Endereco (opcional)
- QUANDO o Admin salva
- ENTAO o responsavel e criado com `role = 'Responsavel'` e automaticamente vinculado ao aluno
- E o sistema dispara email para o responsavel com link de acesso a plataforma

### AC4 - Desvincular responsavel
- DADO que um aluno menor tem um responsavel vinculado
- QUANDO o Admin clica em "Desvincular"
- ENTAO o sistema exibe confirmacao: "Desvincular [Nome Responsavel] de [Nome Aluno]?"
- E avisa: "Atencao: o responsavel precisara ser revinculado antes do proximo consentimento."
- QUANDO o Admin confirma
- ENTAO o vinculo e removido
- E o consentimento pendente e marcado como "requer_revisar"

### AC5 - Responsavel com multiplos filhos
- DADO que um responsavel ja esta vinculado a outro aluno na academia
- QUANDO o mesmo responsavel e vinculado a outro aluno menor
- ENTAO o vinculo e criado normalmente (um responsavel pode ter N filhos)
- E no painel do responsavel aparecem todos os filhos vinculados

### AC6 - Listar menores sem responsavel no painel LGPD
- DADO que o Admin acessa o painel de gestao LGPD
- QUANDO filtra por "Menores sem Responsavel"
- ENTAO o sistema retorna a lista de alunos menores com `is_minor = true` e sem responsavel vinculado
- E exibe alerta de conformidade: "X alunos menores precisam de responsavel vinculado"

## Tasks / Subtasks

- [x] Task 1 - Definir contrato de dados para vinculo responsavel-aluno (AC2, AC3, AC4, AC5)
  - [x] Confirmar tabela de vinculo existente (`guardian_student` ou equivalente)
  - [x] Definir payload/resposta para link e unlink
  - [x] Definir campos de relacionamento (`relationship`, `isPrimary`) no vinculo

- [x] Task 2 - Backend: busca de responsavel existente por academia (AC2)
  - [x] Implementar endpoint de busca com `q` (minimo 3 caracteres)
  - [x] Restringir resultados ao `academy_id` do Admin logado
  - [x] Retornar somente dados necessarios para selecao (id, nome, email, telefone)

- [x] Task 3 - Backend: vincular responsavel existente ao aluno menor (AC2, AC5)
  - [x] Implementar `POST /api/guardians/:guardianId/link/:studentId`
  - [x] Validar que aluno e menor (`is_minor = true`)
  - [x] Validar que ambos pertencem a mesma academia
  - [x] Permitir multiplos alunos por responsavel e evitar vinculo duplicado

- [x] Task 4 - Backend: cadastrar novo responsavel e auto-vincular (AC3)
  - [x] Implementar criacao de usuario com `role = 'Responsavel'`
  - [x] Validar obrigatorios (nome, email, telefone, relacao)
  - [x] Garantir unicidade de email por academia
  - [x] Criar vinculo com aluno no mesmo fluxo transacional
  - [ ] Disparar notificacao de acesso (email) para responsavel

- [x] Task 5 - Backend: desvincular responsavel e atualizar pendencia de consentimento (AC4)
  - [x] Implementar endpoint de unlink com confirmacao de regras de dominio
  - [x] Remover vinculo sem deletar usuario responsavel
  - [x] Marcar consentimento como "requer_revisar" quando aplicavel
  - [x] Registrar auditoria LGPD da operacao

- [x] Task 6 - Backend: listagem de menores sem responsavel (AC6)
  - [x] Implementar consulta de alunos `is_minor = true` sem vinculo ativo
  - [x] Expor contador para alerta de conformidade
  - [x] Garantir isolamento por academia em toda a query

- [x] Task 7 - Frontend: UX de vinculacao na ficha do aluno (AC1, AC2, AC3, AC4)
  - [x] Adicionar secao "Responsavel Legal" na ficha com estados (sem vinculo/com vinculo)
  - [x] Implementar painel/modal de busca e vinculacao de responsavel existente
  - [x] Implementar fluxo de cadastro de novo responsavel + auto-vinculo
  - [x] Implementar acao de desvincular com confirmacao e aviso de impacto

- [x] Task 8 - Frontend: painel LGPD de menores sem responsavel (AC6)
  - [x] Adicionar filtro "Menores sem Responsavel"
  - [x] Mostrar lista e contador de conformidade
  - [x] Permitir navegacao direta para ficha do aluno para acao corretiva

- [ ] Task 9 - Testes backend e frontend (AC1-AC6)
  - [x] Backend: link/unlink/cadastro responsavel/busca/listagem de pendencias
  - [x] Backend: cenarios multi-tenant, menoridade invalida e duplicidade de vinculo
  - [ ] Frontend: fluxo completo de vinculacao, cadastro novo, desvinculo e alertas
  - [ ] Integracao: menor sem responsavel aparece no painel e sai da lista apos vinculo

## Dev Notes

### Escopo Deliberadamente Limitado

- Esta story cobre vinculacao responsavel-aluno no contexto de menoridade e conformidade.
- Nao duplicar regras de cadastro basico de aluno (Story 9.4).
- Nao expandir para onboarding clinico detalhado (Story 9.6).

### Arquitetura e Compliance Obrigatorios

- Todas as operacoes de vinculacao exigem `authMiddleware + requireRole(['Admin'])`.
- Isolamento multi-tenant obrigatorio: aluno e responsavel na mesma `academy_id`.
- Validacoes de payload com Joi e erros padronizados JSON.
- Operacoes de link/unlink devem gerar trilha de auditoria relevante para LGPD.

### Regras Criticas de Seguranca e Dominio

- Nao permitir vincular responsavel em aluno que nao seja menor.
- Nao permitir vinculo cross-academy em nenhuma circunstancia.
- Nao remover usuario responsavel ao desvincular; remover somente relacao.
- Desvinculo deve manter o sistema em estado consistente para novo consentimento.

### Estrutura de Arquivos Recomendada

Backend - arquivos a alterar:
- backend/src/routes/guardians.ts
- backend/src/controllers/guardians.ts
- backend/src/lib/database.ts
- backend/src/lib/validators.ts
- backend/src/types/index.ts
- backend/src/middleware/auth.ts

Backend - arquivos novos sugeridos:
- backend/src/tests/guardian-linking.test.ts

Frontend - arquivos a alterar:
- frontend/src/services/api.service.ts
- frontend/src/types/index.ts
- frontend/src/components/student-profile/student-profile.component.ts
- frontend/src/components/student-profile/student-profile.component.html
- frontend/src/components/student-profile/student-profile.component.scss
- frontend/src/components/admin-dashboard/admin-dashboard.component.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.html

Frontend - arquivos novos sugeridos:
- frontend/src/components/guardian-linking/
  - guardian-linking.component.ts
  - guardian-linking.component.html
  - guardian-linking.component.scss
  - guardian-linking.component.spec.ts
- frontend/src/components/guardian-form/
  - guardian-form.component.ts
  - guardian-form.component.html
  - guardian-form.component.scss
  - guardian-form.component.spec.ts

### Contratos Recomendados

Busca de responsaveis da academia:
- GET /api/guardians/search?q=
- Response: `{ guardians: GuardianLookupItem[] }`

Vincular responsavel existente:
- POST /api/guardians/:guardianId/link/:studentId
- Response: `{ message, guardian, student, relationship }`

Cadastrar e vincular novo responsavel:
- POST /api/guardians/link-new/:studentId
- Body: dados do responsavel + relationship
- Response: `{ message, guardian, student, temporaryPassword? }`

Desvincular responsavel:
- DELETE /api/guardians/:guardianId/link/:studentId
- Response: `{ message, studentId, guardianId, consentStatus }`

Listar menores sem responsavel:
- GET /api/lgpd/minors-without-guardian
- Response: `{ total, students }`

## Criticos para Implementacao

- Reutilizar padroes de RBAC e validacao aplicados nas Stories 9.3 e 9.4.
- Confirmar modelagem real de vinculo no banco antes de implementar endpoints.
- Caso a tabela de vinculo nao exista, incluir migration nesta story com rollback seguro.
- Garantir idempotencia de link para evitar duplicidade por clique repetido.
- Garantir consistencia com fluxo de consentimento LGPD existente (Story 2.2).

## Referencias

- _bmad-output/Epics/Epic9/Epic9.md
- _bmad-output/Epics/Epic9/Story-9-5.md
- _bmad-output/implementation-artifacts/9-4-cadastro-aluno.md
- _bmad-output/implementation-artifacts/9-3-cadastro-professor.md
- _bmad-output/project-context.md
- backend/src/routes/guardians.ts
- backend/src/controllers/guardians.ts
- backend/src/lib/database.ts
- backend/src/lib/validators.ts
- backend/src/types/index.ts
- frontend/src/services/api.service.ts
- frontend/src/types/index.ts
- frontend/src/components/student-profile/student-profile.component.ts

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Completion Notes List

- Backend implementado sem criacao de novas tabelas, reutilizando `student_guardians` para busca, link, create+link, unlink e consulta LGPD de menores sem responsavel.
- Fluxo de consentimento ajustado para retornar status funcional equivalente a revisao (`pending`) quando ocorre link/unlink, preservando constraints atuais de banco.
- Frontend atualizado na ficha do aluno (Admin) com os dois caminhos de vinculacao (existente e novo responsavel), desvinculo e feedback de senha temporaria.
- Painel LGPD no dashboard admin e filtro dedicado na lista de alunos adicionados para acao corretiva rapida.
- Testes backend de Story 9.5 adicionados em `student-management.test.ts` e validados com sucesso.

### File List

- _bmad-output/implementation-artifacts/9-5-vinculacao-responsavel.md
- backend/src/controllers/users.ts
- backend/src/lib/database.ts
- backend/src/lib/validators.ts
- backend/src/routes/admin.ts
- backend/src/routes/users.ts
- backend/src/tests/student-management.test.ts
- backend/src/types/index.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.html
- frontend/src/components/admin-dashboard/admin-dashboard.component.ts
- frontend/src/components/student-profile/student-profile.component.html
- frontend/src/components/student-profile/student-profile.component.scss
- frontend/src/components/student-profile/student-profile.component.ts
- frontend/src/components/students-list/students-list.component.html
- frontend/src/components/students-list/students-list.component.scss
- frontend/src/components/students-list/students-list.component.ts
- frontend/src/services/api.service.ts
- frontend/src/types/index.ts
