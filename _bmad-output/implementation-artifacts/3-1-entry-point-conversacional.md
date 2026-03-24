# Story 3.1: Entry Point Conversacional

Status: done

## Story

Como Professor,
Quero abrir o app e iniciar o registro da aula em até 2 cliques,
Para que eu consiga começar o lançamento do treino sem burocracia e sem depender de papel.

## Contexto de Negócio

- Esta story inaugura o Epic 3: Professor Love — Training.
- O objetivo do sprint é permitir registro de treinos em fluxo conversacional, com baixa carga cognitiva e tempo total inferior a 5 minutos.
- O escopo desta story é apenas o ponto de entrada do wizard: contexto da aula, CTA de início e bootstrap da sessão de treino.
- As stories 3.2 a 3.6 continuam o fluxo de frequência, técnicas, notas, revisão e sucesso.
- O schema de treino já existe em `_bmad-output/V3_0__Training.sql`; não criar novas tabelas nesta story.
- O projeto já possui RBAC com papel `Professor`, isolamento por academia e padrão de rotas Express + Angular module-based app.

## Acceptance Criteria

### AC1 - Card Conversacional de Início
- DADO que um Professor autenticado acessa a área principal do app
- QUANDO possui uma turma ativa atribuída a ele
- ENTÃO vê um card principal com saudação contextual e convite direto para iniciar o registro
- E o texto segue tom conversacional, por exemplo: "Vamos registrar?"
- E o CTA primário é claramente destacado para início imediato do fluxo

### AC2 - Contexto da Aula Visível
- DADO que o card de entrada é exibido
- QUANDO há uma aula atual ou a próxima aula do Professor
- ENTÃO a interface mostra, no mínimo:
  - dia/turno
  - nome da turma
  - contexto adicional disponível da turma
- E somente turmas do próprio Professor e da própria academia podem ser consideradas

### AC3 - Início em 2 Cliques com Bootstrap de Sessão
- DADO que o Professor clica em "Sim, registrar agora"
- QUANDO o sistema processa a ação
- ENTÃO cria ou recupera uma sessão de treino em rascunho para a turma e data/horário corrente
- E retorna um `sessionId` utilizável pelas próximas stories do fluxo
- E evita duplicar sessão em rascunho equivalente quando a ação é repetida pelo mesmo Professor

### AC4 - Ações Secundárias de Escape
- DADO que o card de entrada está visível
- QUANDO o Professor não deseja iniciar imediatamente
- ENTÃO a interface oferece ações secundárias como "Talvez depois" e/ou "Próxima aula"
- E essas ações não criam sessão de treino indevidamente

### AC5 - Comportamento Visual Compatível com Offline
- DADO que o dispositivo está sem conexão
- QUANDO o card de entrada é exibido
- ENTÃO o layout principal continua utilizável e visualmente equivalente
- E o CTA comunica salvamento automático/local de forma compatível com o design definido
- MAS a implementação completa de sincronização offline fica explicitamente para a Story 3.8

### AC6 - Segurança, RBAC e Auditoria
- DADO que a API de entrada do treino é acessada
- QUANDO a requisição vem de usuário não autenticado ou de papel diferente de `Professor`
- ENTÃO o sistema bloqueia o acesso com resposta apropriada
- E quando uma sessão é iniciada com sucesso, o sistema registra auditoria da ação

## Tasks / Subtasks

- [x] **Task 1 - Backend: contexto de entry point para Professor** (AC1, AC2, AC6)
  - [x] Criar lib de treino para buscar turmas ativas do Professor na academia
  - [x] Resolver aula atual ou próxima aula com base em `turmas.schedule_json`
  - [x] Garantir isolamento por `academy_id` e `professor_id`
  - [x] Retornar payload enxuto para o card conversacional

- [x] **Task 2 - Backend: bootstrap de sessão de treino** (AC3, AC6)
  - [x] Criar função para localizar rascunho equivalente em `training_sessions`
  - [x] Se não existir, criar sessão com `turma_id`, `professor_id`, `academy_id`, `session_date`, `session_time`
  - [x] Preencher campos de metadados compatíveis com fluxo posterior (`client_created_at`, `server_received_at`, `last_write_wins_timestamp` quando aplicável)
  - [x] Registrar evento de auditoria ao iniciar sessão

- [x] **Task 3 - Backend: controller e rotas de treino** (AC1, AC2, AC3, AC6)
  - [x] Criar `GET /api/trainings/entry-point`
  - [x] Criar `POST /api/trainings/start`
  - [x] Proteger ambas as rotas com `authMiddleware` + `requireRole(['Professor'])`
  - [x] Retornar erros em pt-BR no padrão atual do backend

- [x] **Task 4 - Frontend: tipos e ApiService** (AC1, AC2, AC3, AC5)
  - [x] Adicionar interfaces para contexto do entry point e resposta de start
  - [x] Adicionar métodos no `ApiService` para carregar contexto e iniciar treino
  - [x] Preparar contrato para reaproveitamento nas stories 3.2-3.6

- [x] **Task 5 - Frontend: UI do entry point conversacional** (AC1, AC2, AC4, AC5)
  - [x] Criar componente/tela do entry point para Professor
  - [x] Exibir saudação, contexto da aula e CTA primário em até 2 cliques
  - [x] Exibir ações secundárias sem efeitos colaterais no backend
  - [x] Tratar estado vazio quando o Professor não possui turma/aula disponível
  - [x] Expor estado visual compatível com offline sem implementar sync queue nesta story

- [x] **Task 6 - Frontend: navegação e integração com fluxo futuro** (AC3)
  - [x] Ligar o CTA primário ao bootstrap da sessão
  - [x] Após sucesso, navegar para a próxima etapa do wizard usando `sessionId`
  - [x] Se a tela da Story 3.2 ainda não existir, usar rota/placeholder controlado sem quebrar o fluxo da Story 3.1

- [x] **Task 7 - Testes de integração e regressão** (AC1-AC6)
  - [x] Cobrir Professor consultando entry point com turma própria
  - [x] Cobrir bloqueio para `Admin`, `Aluno` e usuário sem token
  - [x] Cobrir criação de sessão e idempotência de rascunho
  - [x] Cobrir estado sem turma/aula disponível

## Dev Notes

### Escopo Deliberadamente Limitado

- Esta story **não** implementa frequência, técnicas, notas, revisão, sucesso ou sincronização offline completa.
- Esta story prepara o começo do fluxo e o estado inicial reutilizável pelas stories 3.2 a 3.8.
- Evitar acoplamento prematuro com componentes finais que dependem de funcionalidades ainda não implementadas.

### Fontes Confirmadas

- PRD: Phase 1 prioriza registro rápido de treinos.
- UX: fluxo conversacional do Professor e TELA 1 de entry point já estão definidos.
- Arquitetura: `TrainingService`, endpoints `/api/trainings` e schema de treino já aparecem como base do módulo.
- Project Context: Professor quer experiência conversacional, input rápido e histórico futuro.

### UX Obrigatória

- Tom conversacional, não burocrático.
- CTA principal com destaque visual claro.
- Mostrar contexto da aula sem exigir navegação extra.
- A experiência deve passar sensação de início imediato do trabalho, não de preenchimento de formulário.
- Seguir o princípio "Salvo, sem pergunta": evitar botões extras de persistência nesta fase.

### Backend - Padrões Obrigatórios do Projeto

- Usar funções exportadas, sem classes de serviço orientadas a objeto.
- Usar `AuthenticatedRequest` de `backend/src/types`.
- Usar `req.user!.userId`, `req.user!.academyId` e `req.user!.role`.
- Erros devem seguir o padrão `res.status(x).json({ error: 'mensagem' })`.
- RBAC deve reutilizar `authMiddleware` e `requireRole`.
- Auditoria deve reutilizar `logAudit()` de `backend/src/lib/audit.ts`.

### Frontend - Padrões Obrigatórios do Projeto

- Aplicação atual é Angular module-based, com `standalone: false`.
- Rotas vivem em `frontend/src/app.routing.module.ts`.
- Componentes são declarados em `frontend/src/app.module.ts`.
- Integração HTTP deve passar pelo `ApiService`.
- Como a aplicação ainda não possui módulo lazy específico de treino, preferir solução incremental e compatível com a estrutura atual.

### Recomendação de Estrutura de Implementação

**Backend - novos arquivos sugeridos**
```
backend/src/lib/trainings.ts
backend/src/controllers/trainings.ts
backend/src/routes/trainings.ts
```

**Frontend - novos arquivos sugeridos**
```
frontend/src/components/training-entry-point/
  training-entry-point.component.ts
  training-entry-point.component.html
  training-entry-point.component.scss
```

**Arquivos existentes a modificar**
```
backend/src/app.ts
frontend/src/app.module.ts
frontend/src/app.routing.module.ts
frontend/src/services/api.service.ts
frontend/src/types/index.ts
frontend/src/components/home/home.component.ts
frontend/src/components/home/home.component.html
```

### Schema Real Confirmado

As tabelas já existentes para o Epic 3 são:

- `turmas`
- `turma_students`
- `training_sessions`
- `session_attendance`
- `techniques`
- `session_techniques`
- `session_comments`

Campos relevantes para esta story:

```sql
training_sessions (
  session_id,
  turma_id,
  professor_id,
  academy_id,
  session_date,
  session_time,
  duration_minutes,
  notes,
  offline_synced_at,
  client_created_at,
  server_received_at,
  last_write_wins_timestamp,
  created_at,
  updated_at,
  deleted_at
)
```

```sql
turmas (
  turma_id,
  academy_id,
  professor_id,
  name,
  description,
  schedule_json,
  capacity,
  is_active,
  deleted_at
)
```

### Regras Importantes de Implementação

- Não criar migration nova para esta story.
- Não implementar IndexedDB, sync queue ou reconciliação offline nesta story; isso pertence à 3.8.
- Não implementar frequência nesta story; isso pertence à 3.2.
- Não implementar técnicas/notas nesta story; isso pertence às 3.3 e 3.4.
- Ao iniciar sessão, preservar compatibilidade com rotas futuras do fluxo de treino.
- Se houver repetição do start para o mesmo contexto imediato, preferir recuperar o rascunho existente em vez de criar duplicado.

### Contratos Recomendados

```ts
GET /api/trainings/entry-point
// returns
{
  greeting: string,
  isOfflineCapable: boolean,
  currentOrNextClass: {
    turmaId: string,
    turmaName: string,
    description?: string,
    label: string,
    scheduledAtText: string,
  } | null
}
```

```ts
POST /api/trainings/start
// body
{ turmaId: string }

// returns
{
  message: string,
  sessionId: string,
  created: boolean,
  nextStep: string
}
```

### Referências

- `_bmad-output/implementation-artifacts/SPRINT-PLAN-DETAILED.md`
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/architect.md`
- `_bmad-output/project-context.md`
- `_bmad-output/V3_0__Training.sql`
- `backend/src/routes/admin.ts`
- `backend/src/controllers/auth.ts`
- `frontend/src/app.routing.module.ts`
- `frontend/src/app.module.ts`
- `frontend/src/services/api.service.ts`
- `frontend/src/components/home/home.component.ts`

## Dev Agent Record

### Completion Notes

- Implementado backend de Entry Point Conversacional com contexto de turma do Professor e bootstrap idempotente de sessão em rascunho.
- Publicados endpoints `GET /api/trainings/entry-point` e `POST /api/trainings/start` com RBAC de `Professor`, isolamento por academia e auditoria.
- Integrado frontend com card conversacional na home do Professor, ações secundárias sem efeito colateral e navegação para rota placeholder da Story 3.2.
- Validação executada com build backend, build frontend, suíte dedicada da story e regressão completa do backend.

## File List

- backend/src/app.ts
- backend/src/controllers/trainings.ts
- backend/src/lib/trainings.ts
- backend/src/routes/trainings.ts
- backend/src/tests/training-entry-point.test.ts
- frontend/src/app.module.ts
- frontend/src/app.routing.module.ts
- frontend/src/components/home/home.component.html
- frontend/src/components/home/home.component.ts
- frontend/src/components/training-attendance-placeholder/training-attendance-placeholder.component.html
- frontend/src/components/training-attendance-placeholder/training-attendance-placeholder.component.scss
- frontend/src/components/training-attendance-placeholder/training-attendance-placeholder.component.ts
- frontend/src/components/training-entry-point/training-entry-point.component.html
- frontend/src/components/training-entry-point/training-entry-point.component.scss
- frontend/src/components/training-entry-point/training-entry-point.component.ts
- frontend/src/services/api.service.ts
- frontend/src/types/index.ts

## Change Log

- 2026-03-24: Story 3.1 implementada com entry point conversacional completo (backend + frontend), testes de integração e transição para review.
