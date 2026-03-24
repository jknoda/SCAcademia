# Story 9.1: Perfil Completo da Academia

Status: done

## Story

Como um Administrador da academia,
Quero visualizar e editar o cadastro completo da minha academia,
Para que os dados operacionais, fiscais e de contato estejam atualizados e completos.

## Contexto de Negócio

- Esta story inicia a Epic 9 e expande o cadastro mínimo criado na Story 1.1.
- O objetivo é habilitar manutenção de dados institucionais e fiscais da academia com RBAC e isolamento por academia.
- A implementação deve reaproveitar os padrões existentes de autenticação JWT, middleware de papéis e validação por schema.
- Esta story é pré-requisito funcional para cadastros mais completos das Stories 9.2 a 9.6.

## Acceptance Criteria

### AC1 - Visualizar perfil atual da academia
- DADO que o Admin está logado
- QUANDO acessa a rota de perfil da academia no painel administrativo
- ENTÃO o sistema carrega os dados atuais da academia via API
- E campos não preenchidos aparecem vazios e editáveis

### AC2 - Formulário completo de perfil da academia
- DADO que o Admin está na tela de edição
- QUANDO visualiza o formulário
- ENTÃO o formulário contém:
  - Dados gerais: nome (obrigatório), descrição (opcional)
  - Documento: document_id (obrigatório e único, aceitando CNPJ/CPF formatado)
  - Contato: contact_email (obrigatório), contact_phone (obrigatório)
  - Endereço: address_street, address_number, address_complement, address_neighborhood, address_postal_code, address_city, address_state
- E campos obrigatórios têm indicação visual
- E CEP usa máscara 00000-000

### AC3 - Validação em tempo real
- DADO que o Admin preenche o formulário
- QUANDO inserir valor inválido
- ENTÃO exibe erro inline por campo
- E ao corrigir valor, remove o erro sem recarregar a página

### AC4 - Salvar alterações
- DADO dados válidos no formulário
- QUANDO clicar em Salvar Alterações
- ENTÃO o backend persiste via endpoint de atualização da academia
- E retorna sucesso para feedback visual
- E updated_at é atualizado no banco

### AC5 - Documento único
- DADO outra academia com o mesmo document_id
- QUANDO o Admin tentar salvar documento duplicado
- ENTÃO o backend retorna erro de conflito
- E o frontend exibe mensagem inline no campo de documento
- E nenhuma alteração é aplicada

### AC6 - Controle de acesso
- DADO usuário sem papel Admin
- QUANDO tentar acessar rota ou endpoint de perfil da academia
- ENTÃO recebe 403 (ou redirecionamento para home no frontend)
- E não visualiza dados da academia

## Tasks / Subtasks

- [x] Task 1 - Definir contrato de API de perfil da academia (AC1, AC4, AC5, AC6)
  - [x] Confirmar endpoint de leitura e atualização para perfil completo
  - [x] Definir payload de request/response com nomes de campo alinhados ao schema SQL
  - [x] Definir mapeamento de erros de validação e conflito de documento

- [x] Task 2 - Backend: leitura e atualização completa da academia (AC1, AC4, AC5, AC6)
  - [x] Criar funções de acesso a dados para buscar e atualizar campos completos da academia
  - [x] Garantir filtro por academy_id do token (sem acesso cross-academy)
  - [x] Aplicar validação de entrada e normalização de documento/CEP
  - [x] Manter campos de plano (max_users, storage_limit_gb) como somente leitura

- [x] Task 3 - Backend: rotas protegidas para perfil da academia (AC1, AC4, AC6)
  - [x] Adicionar rota de leitura de perfil da academia para Admin
  - [x] Adicionar rota de atualização de perfil da academia para Admin
  - [x] Reutilizar authMiddleware e requireRole(['Admin'])

- [x] Task 4 - Frontend: tipos e API client (AC1, AC4, AC5)
  - [x] Expandir interface de Academy com campos completos
  - [x] Adicionar métodos no ApiService para obter e atualizar perfil da academia
  - [x] Tratar mensagens de erro por campo no padrão usado no setup inicial

- [x] Task 5 - Frontend: tela de perfil da academia (AC1, AC2, AC3, AC4, AC6)
  - [x] Criar componente de perfil de academia com Reactive Forms
  - [x] Implementar validações de documento, email, telefone e CEP
  - [x] Exibir feedback de loading, sucesso e erro inline
  - [x] Incluir rota protegida para Admin e ação de navegação no dashboard

- [x] Task 6 - Testes backend (AC1, AC4, AC5, AC6)
  - [x] Testar GET perfil como Admin
  - [x] Testar PUT válido atualizando campos permitidos
  - [x] Testar conflito de document_id retornando 409
  - [x] Testar Professor/Aluno recebendo 403
  - [x] Testar isolamento por academy_id

- [x] Task 7 - Testes frontend (AC1, AC2, AC3, AC4, AC5, AC6)
  - [x] Testar carregamento inicial e binding dos campos
  - [x] Testar validação visual de campos obrigatórios e formatos
  - [x] Testar envio com sucesso e persistência dos dados na tela
  - [x] Testar tratamento de erro 409 no campo documento
  - [x] Testar bloqueio de rota para usuário sem papel Admin

## Dev Notes

### Escopo Deliberadamente Limitado

- Esta story cobre perfil da academia (tenant), não perfil de usuário individual.
- Não implementar nesta story CRUD completo de Professor/Aluno/Responsável (Stories 9.3, 9.4, 9.5).
- Não incluir triagem de saúde no formulário da academia (Story 9.6).

### Arquitetura e Compliance Obrigatórios

- Isolamento multi-tenant obrigatório por academy_id do token JWT.
- Controle de acesso com requireRole(['Admin']) nas rotas de escrita.
- Validar dados com schema no backend antes de persistir.
- Usar queries parametrizadas e manter convenções do projeto para erros HTTP.
- Manter rate limiting já aplicado por grupo de rotas no app.

### Campos Reais do Schema da Academia

Baseado em V1_0__Core_Identity.sql, os campos relevantes da tabela academies são:
- name, description, document_id
- contact_email, contact_phone
- address_street, address_number, address_complement, address_neighborhood
- address_postal_code, address_city, address_state
- is_active, max_users, storage_limit_gb
- created_at, updated_at, deleted_at

### Reuso e Anti-Reinvenção

- Já existe rota de consulta resumida em /api/admin/academy-info; evitar quebra retrocompatível dessa rota.
- A criação inicial de academia já existe em /api/auth/academies com validação e tratamento de erro.
- Reaproveitar padrão de validação middleware validate(...) e resposta de erro json consistente.

### Estrutura de Arquivos Recomendada

Backend - arquivos a alterar:
- backend/src/routes/admin.ts
- backend/src/controllers/users.ts
- backend/src/lib/database.ts
- backend/src/lib/validators.ts
- backend/src/types/index.ts

Backend - arquivos novos sugeridos (se necessário para separar responsabilidade):
- backend/src/controllers/academyProfile.ts
- backend/src/lib/academyProfile.ts

Frontend - arquivos a alterar:
- frontend/src/services/api.service.ts
- frontend/src/types/index.ts
- frontend/src/app.routing.module.ts
- frontend/src/app.module.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.html

Frontend - arquivos novos sugeridos:
- frontend/src/components/academy-profile/
  - academy-profile.component.ts
  - academy-profile.component.html
  - academy-profile.component.scss

### Requisitos de UX

- Formulário responsivo desktop/mobile com estados claros de erro, carregamento e sucesso.
- Mensagens objetivas em pt-BR para cada erro de validação.
- Máscara de CEP e formatação assistida de documento para reduzir erro de entrada.
- Botão Salvar deve ficar desabilitado enquanto envio está em andamento.

### Contratos Recomendados

Leitura do perfil da academia (Admin):
- GET /api/admin/academy-profile
- Response:
  - academyId, name, description, documentId
  - contactEmail, contactPhone
  - address: street, number, complement, neighborhood, postalCode, city, state
  - isActive, maxUsers, storageLimitGb, createdAt, updatedAt

Atualização do perfil da academia (Admin):
- PUT /api/admin/academy-profile
- Body:
  - name, description, documentId
  - contactEmail, contactPhone
  - address: street, number, complement, neighborhood, postalCode, city, state
- Response:
  - message, academy (snapshot atualizado)

Observação: manter nomenclatura de payload estável e mapear internamente para snake_case do banco.

### Critérios de Pronto para Dev

- Escopo, endpoints, campos e regras de acesso definidos.
- Dependências técnicas conhecidas e mapeadas aos arquivos existentes.
- Casos de teste funcionais e de segurança explicitados.
- Story pronta para implementação sem necessidade de descoberta adicional.

### Referências

- _bmad-output/Epics/Epic9/Epic9.md
- _bmad-output/Epics/Epic9/Story-9-1.md
- _bmad-output/Epics/Epic9/Story-9-2.md
- _bmad-output/Epics/Epic9/Story-9-3.md
- _bmad-output/Epics/Epic9/Story-9-4.md
- _bmad-output/Epics/Epic9/Story-9-5.md
- _bmad-output/Epics/Epic9/Story-9-6.md
- _bmad-output/project-context.md
- _bmad-output/planning-artifacts/architect.md
- _bmad-output/planning-artifacts/ux.md
- _bmad-output/planning-artifacts/prd.md
- _bmad-output/V1_0__Core_Identity.sql
- backend/src/routes/admin.ts
- backend/src/controllers/users.ts
- backend/src/lib/database.ts
- backend/src/routes/users.ts
- frontend/src/services/api.service.ts
- frontend/src/components/academy-form/academy-form.component.ts

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Backend build: `cd backend ; npm run build` (OK)
- Frontend build: `cd frontend ; npm run build` (OK)
- Teste novo backend: `cd backend ; npm test -- --runInBand academy-profile.test.ts` (5 passed)
- Regressão backend completa: `cd backend ; npm test -- --runInBand --silent` (11 suites, 77 testes passed)
- Frontend tests: `cd frontend ; npm run test -- --watch=false` (8 passed)

### Completion Notes List

- Implementados endpoints `GET/PUT /api/admin/academy-profile` com `requireRole(['Admin'])` e validação Joi.
- Persistência completa do perfil da academia implementada com atualização de `updated_at`.
- Tratamento explícito de conflito de `document_id` com retorno 409 e erro por campo.
- Frontend integrado com nova tela de perfil (`academy-profile`) em Reactive Forms, validação inline e máscara de CEP.
- Dashboard admin atualizado com navegação para o perfil da academia.
- Build backend/frontend e regressão completa do backend aprovados.
- Infra de testes frontend configurada (target `test` Angular + Karma/Jasmine) e suíte executada com sucesso.

### File List

- backend/src/types/index.ts
- backend/src/lib/validators.ts
- backend/src/lib/database.ts
- backend/src/controllers/users.ts
- backend/src/routes/admin.ts
- backend/src/tests/academy-profile.test.ts
- frontend/src/types/index.ts
- frontend/src/services/api.service.ts
- frontend/src/components/academy-profile/academy-profile.component.ts
- frontend/src/components/academy-profile/academy-profile.component.html
- frontend/src/components/academy-profile/academy-profile.component.scss
- frontend/src/app.module.ts
- frontend/src/app.routing.module.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.ts
- frontend/src/components/admin-dashboard/admin-dashboard.component.html
- frontend/angular.json
- frontend/tsconfig.spec.json
- frontend/src/test.ts
- frontend/src/smoke.spec.ts
- frontend/src/components/academy-profile/academy-profile.component.spec.ts
- frontend/src/services/api.service.spec.ts
- _bmad-output/implementation-artifacts/9-1-perfil-academia.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
