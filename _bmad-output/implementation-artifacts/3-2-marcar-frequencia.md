# Story 3.2: Marcar Frequência

Status: review

## Story

Como Professor,
Quero marcar presença e ausência dos alunos com toggles rápidos,
Para registrar a frequência da aula em poucos toques e seguir para a próxima etapa do fluxo.

## Contexto de Negócio

- Esta story continua o wizard iniciado na Story 3.1 (Entry Point Conversacional).
- Objetivo: reduzir o atrito operacional do Professor com marcação de frequência rápida e visual clara.
- O fluxo UX definido para esta etapa é conversacional, com feedback imediato e sem botão explícito de "salvar".
- O schema já existe em `_bmad-output/V3_0__Training.sql` usando `session_attendance`.
- Não criar tabelas novas nesta story.

## Acceptance Criteria

### AC1 - Lista de Alunos da Turma na Sessão
- DADO que o Professor iniciou um treino pela Story 3.1 e possui `sessionId`
- QUANDO abre a etapa de frequência
- ENTÃO o sistema lista os alunos vinculados à turma da sessão
- E exibe cada aluno com estado atual de presença
- E somente alunos da turma e academia do Professor podem ser exibidos

### AC2 - Toggle de Frequência Rápida
- DADO a lista de alunos da sessão
- QUANDO o Professor altera o toggle de um aluno
- ENTÃO o estado visual muda imediatamente (presente/ausente)
- E o tamanho/área de clique é adequado para uso rápido em touch
- E o componente mantém a interação fluida sem necessidade de reload

### AC3 - Auto-save por Interação
- DADO que o Professor alterna presença/ausência de um aluno
- QUANDO a ação ocorre
- ENTÃO o backend persiste (upsert) em `session_attendance`
- E o registro guarda `session_id`, `student_id`, `academy_id`, `status`, `marked_by_user_id`
- E não há necessidade de botão "Salvar alterações"

### AC4 - Métrica de Progresso da Frequência
- DADO que o Professor está marcando presença
- QUANDO alterna alunos
- ENTÃO a interface mostra contagem atualizada (ex.: "18 presentes de 20")
- E essa contagem reflete o estado atual da tela e dados persistidos

### AC5 - Navegação do Wizard
- DADO que o Professor está na etapa de frequência
- QUANDO clica "Revisar"
- ENTÃO retorna para a etapa anterior sem perder o estado já salvo
- QUANDO clica "Próximo: Técnicas"
- ENTÃO avança somente se houver ao menos 1 aluno marcado como presente

### AC6 - Segurança e Integridade
- DADO chamadas de API da etapa de frequência
- QUANDO usuário sem autenticação, sem papel `Professor` ou com sessão fora da sua academia tenta acessar
- ENTÃO o sistema bloqueia com resposta apropriada
- E o Professor não pode marcar frequência de sessão que não pertence a ele

## Tasks / Subtasks

- [x] **Task 1 - Backend: leitura de alunos da sessão/turma** (AC1, AC6)
  - [x] Criar função para obter sessão por `sessionId` validando `academy_id` e `professor_id`
  - [x] Resolver alunos da turma via `turma_students` com status ativo
  - [x] Retornar payload de frequência para a tela

- [x] **Task 2 - Backend: persistência de frequência (upsert)** (AC2, AC3, AC6)
  - [x] Implementar upsert em `session_attendance` por `(session_id, student_id)`
  - [x] Validar `status` aceito (`present`, `absent`, opcionalmente `justified`)
  - [x] Atualizar `updated_at` a cada interação

- [x] **Task 3 - Backend: endpoints da etapa de frequência** (AC1-AC6)
  - [x] Criar `GET /api/trainings/:sessionId/attendance`
  - [x] Criar `POST /api/trainings/:sessionId/attendance`
  - [x] Proteger rotas com `authMiddleware` + `requireRole(['Professor'])`
  - [x] Manter mensagens de erro no padrão atual do backend

- [x] **Task 4 - Frontend: tipos e ApiService** (AC1-AC4)
  - [x] Criar interfaces de item de frequência e resumo da sessão
  - [x] Adicionar métodos para carregar e salvar presença por aluno
  - [x] Tratar erro de persistência sem quebrar a tela

- [x] **Task 5 - Frontend: tela de frequência conversacional** (AC1-AC5)
  - [x] Implementar lista de alunos com toggle por linha
  - [x] Exibir contagem "X presentes de Y"
  - [x] Aplicar feedback visual imediato por toggle
  - [x] Implementar botões "Revisar" e "Próximo: Técnicas"

- [x] **Task 6 - Testes de integração e regressão** (AC1-AC6)
  - [x] Cobrir carregamento de frequência da sessão
  - [x] Cobrir upsert de presença/ausência por aluno
  - [x] Cobrir bloqueio de acesso para papéis não permitidos
  - [x] Cobrir isolamento de sessão por professor/academia

## Dev Notes

### Escopo Deliberadamente Limitado

- Esta story foca apenas na etapa de frequência do wizard.
- Não implementar seleção de técnicas (Story 3.3).
- Não implementar notas/comentários (Story 3.4).
- Não implementar revisão final/sucesso (Stories 3.5 e 3.6).
- Não implementar sincronização offline completa (Story 3.8).

### UX Obrigatória

- Layout conversacional com pergunta principal: "Quantos alunos compareceram?"
- Um row por aluno.
- Toggle com hit area confortável para touch.
- Auto-save por toggle, sem botão de salvar.
- Contador de presença sempre visível e atualizado.

### Schema Real Confirmado

Tabela principal desta story:

```sql
session_attendance (
  attendance_id,
  session_id,
  student_id,
  academy_id,
  status,
  marked_by_user_id,
  created_at,
  updated_at,
  UNIQUE (session_id, student_id)
)
```

Tabelas de apoio:

- `training_sessions`
- `turmas`
- `turma_students`

### Padrões de Implementação (Projeto Atual)

- Backend em funções exportadas, sem classes de serviço OO.
- Erro HTTP no formato `res.status(x).json({ error: 'mensagem' })`.
- Reutilizar `AuthenticatedRequest`, `authMiddleware`, `requireRole`.
- Frontend Angular module-based (`standalone: false`).
- Integração HTTP somente via `ApiService`.

### Recomendação de Arquivos

**Backend - novos arquivos sugeridos**
```
backend/src/controllers/trainingAttendance.ts
backend/src/lib/trainingAttendance.ts
```

**Backend - arquivos a alterar**
```
backend/src/routes/trainings.ts
backend/src/app.ts
backend/src/types/index.ts
```

**Frontend - novos arquivos sugeridos**
```
frontend/src/components/training-attendance/
  training-attendance.component.ts
  training-attendance.component.html
  training-attendance.component.scss
```

**Frontend - arquivos a alterar**
```
frontend/src/app.module.ts
frontend/src/app.routing.module.ts
frontend/src/services/api.service.ts
frontend/src/types/index.ts
```

### Contratos Recomendados

```ts
GET /api/trainings/:sessionId/attendance
// returns
{
  sessionId: string,
  turmaId: string,
  turmaName: string,
  totals: { total: number, present: number },
  students: Array<{
    studentId: string,
    studentName: string,
    status: 'present' | 'absent' | 'justified' | null
  }>
}
```

```ts
POST /api/trainings/:sessionId/attendance
// body
{
  studentId: string,
  status: 'present' | 'absent' | 'justified'
}

// returns
{
  message: string,
  sessionId: string,
  studentId: string,
  status: 'present' | 'absent' | 'justified',
  totals: { total: number, present: number }
}
```

### Referências

- `_bmad-output/implementation-artifacts/3-1-entry-point-conversacional.md`
- `_bmad-output/implementation-artifacts/SPRINT-PLAN-DETAILED.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/architect.md`
- `_bmad-output/V3_0__Training.sql`
- `_bmad-output/project-context.md`
