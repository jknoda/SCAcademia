# Story 9.2: Perfil Completo do Administrador

Status: done

## Story

Como um Administrador logado,
Quero visualizar e editar meu próprio perfil completo,
Para que meus dados pessoais, de contato e documentação estejam corretos na plataforma.

## Contexto de Negócio

- Esta story expande o cadastro mínimo do Admin criado na Story 1.1 (`fullName`, `email`, `password`).
- O objetivo é habilitar autoatendimento de perfil do usuário Admin sem permitir edição de outros usuários.
- Esta story depende da base de RBAC, JWT e isolamento por `academy_id` já existente nas Stories 1.x.
- O resultado esperado é maior qualidade de dados e redução de suporte operacional para ajustes cadastrais.

## Acceptance Criteria

### AC1 - Acessar meu próprio perfil
- DADO que o Admin está logado
- QUANDO acessa `/perfil` ou `/admin/meu-perfil`
- ENTÃO o sistema carrega os dados do usuário logado via `GET /api/users/:userId/profile`
- E exibe o formulário populado com os dados existentes
- E o campo `email` aparece mas não é editável diretamente

### AC2 - Campos do formulário de perfil do Admin
- DADO que o Admin está visualizando seu perfil
- QUANDO o formulário é exibido
- ENTÃO contém:
  - Dados Pessoais: Nome completo (obrigatório), CPF (`document_id`, opcional), Data de Nascimento (opcional)
  - Contato: Telefone (opcional), Email (somente leitura)
  - Endereço: Logradouro, Número, Complemento, Bairro, CEP, Cidade, Estado (opcionais)
- E campos opcionais têm indicação visual "(opcional)"

### AC3 - Alterar senha
- DADO que o Admin deseja mudar sua senha
- QUANDO clica em "Alterar Senha"
- ENTÃO aparece formulário inline (ou modal) com senha atual, nova senha e confirmação
- QUANDO preenche corretamente e confirma
- ENTÃO o sistema chama endpoint de alteração de senha (`PUT /api/auth/change-password` ou equivalente)
- E exibe mensagem de sucesso
- E o admin permanece logado (token não revogado)

### AC4 - Salvar alterações de perfil
- DADO que o Admin preencheu os dados válidos
- QUANDO clica em "Salvar"
- ENTÃO o sistema chama `PUT /api/users/:userId` com os campos atualizados
- E exibe mensagem de sucesso
- E o nome exibido no header/nav é atualizado quando `fullName` mudar

### AC5 - Controle de isolamento de academia
- DADO que existe admin de outra academia
- QUANDO o sistema processa atualização de perfil
- ENTÃO o backend valida `academy_id` do token == `academy_id` do usuário-alvo
- E nunca permite atualização cross-academy

## Tasks / Subtasks

- [x] Task 1 - Definir contrato de API de perfil do Admin (AC1, AC4, AC5)
  - [x] Confirmar payload/response de leitura de perfil completo
  - [x] Definir payload de atualização com campos permitidos para self-update
  - [x] Definir estratégia de erro por campo (validação e conflito de documento)

- [x] Task 2 - Backend: ampliar leitura de perfil e update self-only (AC1, AC2, AC4, AC5)
  - [x] Expandir retorno de `GET /api/users/:userId/profile` com campos cadastrais completos
  - [x] Implementar `PUT /api/users/:userId` com `authMiddleware + requireSelf`
  - [x] Garantir filtro por `academy_id` no acesso e na persistência
  - [x] Preservar email como somente leitura nesse fluxo

- [x] Task 3 - Backend: alteração de senha com validação forte (AC3)
  - [x] Expor endpoint de alteração de senha para usuário autenticado
  - [x] Validar senha atual antes de alterar hash
  - [x] Aplicar política de senha forte (8+, maiúscula, número, especial)
  - [x] Atualizar `password_changed_at` em sucesso

- [x] Task 4 - Frontend: tipos e ApiService para perfil do Admin (AC1, AC3, AC4)
  - [x] Expandir tipos de User/Profile com campos adicionais
  - [x] Adicionar métodos de leitura e atualização de perfil do usuário atual
  - [x] Adicionar método de alteração de senha com contrato de erro consistente

- [x] Task 5 - Frontend: tela de Meu Perfil do Admin (AC1, AC2, AC3, AC4)
  - [x] Criar componente de perfil com Reactive Forms e validação inline
  - [x] Exibir email bloqueado para edição
  - [x] Implementar bloco/modal de troca de senha
  - [x] Atualizar estado de usuário em sessão para refletir `fullName` alterado

- [x] Task 6 - Testes backend (AC1, AC3, AC4, AC5)
  - [x] Cobrir leitura do próprio perfil com campos completos
  - [x] Cobrir update válido do próprio perfil
  - [x] Cobrir tentativa cross-academy com erro de autorização/não encontrado
  - [x] Cobrir troca de senha válida e inválida (senha atual incorreta / senha fraca)

- [x] Task 7 - Testes frontend (AC1, AC2, AC3, AC4)
  - [x] Testar carregamento inicial e binding dos campos
  - [x] Testar email em modo somente leitura
  - [x] Testar validações de CPF/CEP/data e feedback visual
  - [x] Testar fluxo de troca de senha (sucesso/erro)

## Dev Notes

### Escopo Deliberadamente Limitado

- Esta story cobre apenas perfil do Admin logado (self-service).
- Não incluir aqui CRUD de Professor/Aluno/Responsável (Stories 9.3, 9.4, 9.5).
- Não incluir anamnese/saúde do aluno (Story 9.6).

### Arquitetura e Compliance Obrigatórios

- Reutilizar `requireSelf` para garantir edição somente do próprio usuário.
- Manter isolamento multi-tenant por `academy_id` em todas as queries de leitura/escrita.
- Aplicar validação no backend com Joi e resposta de erro JSON padronizada.
- Usar queries parametrizadas e respeitar convenções já usadas em `database.ts`.

### Campos Relevantes do Schema users

Com base no schema atual do projeto, priorizar no perfil do Admin:
- `full_name`, `document_id`, `birth_date`
- `phone`
- `address_street`, `address_number`, `address_complement`, `address_neighborhood`
- `address_postal_code`, `address_city`, `address_state`
- `email` (somente leitura nesse fluxo)
- `password_hash`, `password_changed_at` (apenas no fluxo de troca de senha)

### Reuso e Anti-Reinvenção

- Já existe `GET /api/users/:userId/profile` com `requireSelf`; expandir sem quebrar retrocompatibilidade.
- Já existe função de update de senha no backend (`password_changed_at`), preferir reaproveitar.
- Seguir padrão de validações e respostas introduzido na Story 9.1.

### Estrutura de Arquivos Recomendada

Backend - arquivos a alterar:
- backend/src/routes/users.ts
- backend/src/routes/auth.ts
- backend/src/controllers/users.ts
- backend/src/controllers/auth.ts
- backend/src/lib/database.ts
- backend/src/lib/validators.ts
- backend/src/types/index.ts
- backend/src/middleware/auth.ts

Frontend - arquivos a alterar:
- frontend/src/services/api.service.ts
- frontend/src/types/index.ts
- frontend/src/app.routing.module.ts
- frontend/src/app.module.ts
- frontend/src/services/auth.service.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.html

Frontend - arquivos novos sugeridos:
- frontend/src/components/admin-profile/
  - admin-profile.component.ts
  - admin-profile.component.html
  - admin-profile.component.scss
  - admin-profile.component.spec.ts

Backend - arquivos novos sugeridos:
- backend/src/tests/admin-profile.test.ts

### Requisitos de UX

- Formulário responsivo com estados claros de loading, erro e sucesso.
- Campos opcionais sinalizados no label.
- Máscaras de CPF e CEP para reduzir erro de digitação.
- Data de nascimento com limites: máximo hoje, adulto (18+).
- Troca de senha com validação de confirmação no frontend antes do submit.

### Contratos Recomendados

Leitura do perfil do Admin:
- GET /api/users/:userId/profile
- Response:
  - id, email, fullName, role, academyId
  - documentId, birthDate, phone
  - addressStreet, addressNumber, addressComplement, addressNeighborhood
  - addressPostalCode, addressCity, addressState

Atualização do perfil do Admin:
- PUT /api/users/:userId
- Body:
  - fullName, documentId, birthDate, phone
  - addressStreet, addressNumber, addressComplement, addressNeighborhood
  - addressPostalCode, addressCity, addressState
- Response:
  - message, user atualizado

Alteração de senha:
- PUT /api/auth/change-password (ou rota autenticada equivalente)
- Body:
  - currentPassword, newPassword, confirmPassword
- Response:
  - message de sucesso

## Critérios de Pronto para Dev

- ACs mapeados em tarefas técnicas backend/frontend.
- Contratos de API definidos para perfil e senha.
- Guardrails de segurança e isolamento documentados.
- Dependências e arquivos-alvo claros para implementação sem descoberta adicional.

## Referências

- _bmad-output/Epics/Epic9/Epic9.md
- _bmad-output/Epics/Epic9/Story-9-2.md
- _bmad-output/implementation-artifacts/9-1-perfil-academia.md
- _bmad-output/project-context.md
- _bmad-output/V1_0__Core_Identity.sql
- backend/src/routes/users.ts
- backend/src/routes/auth.ts
- backend/src/controllers/users.ts
- backend/src/controllers/auth.ts
- backend/src/lib/database.ts
- backend/src/lib/validators.ts
- backend/src/middleware/auth.ts
- frontend/src/services/api.service.ts
- frontend/src/types/index.ts

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Completion Notes List

- Perfil completo do Admin implementado com leitura e edição self-only (`GET /api/users/:userId/profile` e `PUT /api/users/:userId`).
- Troca de senha autenticada implementada em `PUT /api/auth/change-password` com validação de senha atual e política forte.
- Tela frontend `Meu Perfil` adicionada com Reactive Forms, email read-only, edição de dados cadastrais e fluxo de troca de senha.
- Navegação adicionada no dashboard para `/admin/meu-perfil` e rota alternativa `/perfil`.
- Testes backend e frontend atualizados/cobertos; execução validada com sucesso.

### File List

- _bmad-output/implementation-artifacts/9-2-perfil-administrador.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- backend/src/types/index.ts
- backend/src/lib/validators.ts
- backend/src/lib/database.ts
- backend/src/controllers/users.ts
- backend/src/controllers/auth.ts
- backend/src/routes/users.ts
- backend/src/routes/auth.ts
- backend/src/tests/admin-profile.test.ts
- frontend/src/types/index.ts
- frontend/src/services/api.service.ts
- frontend/src/services/auth.service.ts
- frontend/src/services/api.service.spec.ts
- frontend/src/app.module.ts
- frontend/src/app.routing.module.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.html
- frontend/src/components/admin-profile/admin-profile.component.ts
- frontend/src/components/admin-profile/admin-profile.component.html
- frontend/src/components/admin-profile/admin-profile.component.scss
- frontend/src/components/admin-profile/admin-profile.component.spec.ts
