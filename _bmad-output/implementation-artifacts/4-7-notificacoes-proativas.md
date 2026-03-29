# Story 4.7: Sistema de Notificações — Motivação Proativa

**Status:** done

---

## Story

Como um Aluno,
Quero receber notificações motivadoras sobre meu progresso,
Para que eu seja motivado a continuar treinando (sem ser assustado).

---

## Acceptance Criteria

**AC1 - Notificação de badge desbloqueado**
- DADO que o Aluno desbloqueou um novo badge
- QUANDO o evento é detectado pelo backend
- ENTÃO o sistema gera notificação in-app com conteúdo motivador
- E exibe toast no app por até 5 segundos
- E grava entrada na tabela `notifications` com `type = 'badge_earned'`

**AC2 - Notificação especial de streak (30 dias)**
- DADO que o Aluno alcançou streak de 30 dias
- QUANDO o backend processa o progresso atual
- ENTÃO cria notificação especial motivacional
- E permite ação de compartilhamento opcional no frontend (copiar mensagem)

**AC3 - Notificação suave para baixa frequência**
- DADO que o Aluno possui frequência abaixo de 60%
- QUANDO o backend calcula o resumo de progresso
- ENTÃO gera notificação suave de incentivo (sem tom punitivo)
- E inclui CTA para próxima aula quando disponível

**AC4 - Notificação de primeira aula concluída**
- DADO que o Aluno completou a primeira aula
- QUANDO há confirmação de presença inicial
- ENTÃO gera notificação de boas-vindas/conquista inicial

**AC5 - Notificação de comentário positivo do professor**
- DADO que novo comentário do professor foi registrado para o Aluno
- QUANDO o backend monta o feed de notificações
- ENTÃO gera notificação com preview truncado do comentário
- E fornece link para a seção de comentários no dashboard

**AC6 - Configurações de notificações (Aluno)**
- DADO que o Aluno acessa Configurações > Notificações
- QUANDO ajusta toggles
- ENTÃO consegue ligar/desligar por categoria:
  - badges
  - frequência
  - comentários
  - lembretes motivacionais
- E as preferências devem ser respeitadas na exibição de toasts in-app

**AC7 - Modo não intrusivo quando desativado**
- DADO que o Aluno desligou notificações de uma ou mais categorias
- QUANDO acessa dashboard e detalhes
- ENTÃO continua vendo progresso/badges normalmente
- E não recebe toasts dessas categorias desativadas

**AC8 - Lembretes de aula (véspera e 2h antes)**
- DADO que há próxima aula vinculada ao Aluno
- QUANDO o sistema identifica janela de lembrete (véspera e ~2h antes)
- ENTÃO cria notificações de lembrete com tom suave
- E cada notificação oferece ação de confirmação de presença (link para fluxo existente)

**AC9 - Feed de notificações com leitura**
- DADO que o Aluno abre painel de notificações
- QUANDO consulta o histórico
- ENTÃO vê lista paginada em ordem decrescente de criação
- E consegue marcar item como lido
- E consegue marcar todas como lidas

---

## Tasks / Subtasks

- [ ] **Backend: domínio de notificações proativas** (AC1–AC5, AC8, AC9)
  - [ ] Adicionar tipos de retorno em `backend/src/lib/database.ts`:
    - [ ] `StudentNotificationItem`
    - [ ] `StudentNotificationFeedResult`
  - [ ] Implementar função `listStudentNotifications(academyId, studentId, options?)` com paginação e filtro opcional por status
  - [ ] Implementar `markStudentNotificationRead(academyId, studentId, notificationId)`
  - [ ] Implementar `markAllStudentNotificationsRead(academyId, studentId)`
  - [ ] Implementar helper de geração idempotente de notificações com base em dados existentes (sem migration):
    - [ ] badge novo (`type: badge_earned`)
    - [ ] frequência baixa / lembrete / streak / primeira aula (`type: attendance_reminder`)
    - [ ] comentário novo (`type: comment_received`)
  - [ ] Garantir deduplicação por janela de tempo e tipo (evitar spam no mesmo dia)
  - [ ] Usar somente SQL parametrizado (sem concatenação de input)

- [ ] **Backend: handlers e rotas do aluno** (AC6, AC9)
  - [ ] Criar handler `getMyStudentNotificationsHandler` em `backend/src/controllers/users.ts`
  - [ ] Criar handler `markMyStudentNotificationReadHandler` em `backend/src/controllers/users.ts`
  - [ ] Criar handler `markAllMyStudentNotificationsReadHandler` em `backend/src/controllers/users.ts`
  - [ ] Registrar rotas em `backend/src/routes/users.ts`:
    - [ ] `GET /alunos/me/notificacoes`
    - [ ] `PATCH /alunos/me/notificacoes/:notificationId/read`
    - [ ] `PATCH /alunos/me/notificacoes/read-all`
  - [ ] Proteger com `authMiddleware` + `requireRole(['Aluno'])`

- [ ] **Frontend: tipos e ApiService** (AC9)
  - [ ] Adicionar em `frontend/src/types/index.ts`:
    - [ ] `StudentNotificationItem`
    - [ ] `StudentNotificationFeedResponse`
    - [ ] `StudentNotificationPreferences`
  - [ ] Adicionar métodos em `frontend/src/services/api.service.ts`:
    - [ ] `getStudentNotifications(filters?)`
    - [ ] `markStudentNotificationRead(notificationId)`
    - [ ] `markAllStudentNotificationsRead()`

- [ ] **Frontend: preferências de notificações (MVP sem migration)** (AC6, AC7)
  - [ ] Implementar estado de preferências no `HomeComponent`:
    - [ ] `notificationPreferences` com 4 toggles (badges/frequencia/comentarios/lembretes)
  - [ ] Persistir preferências no `localStorage` por aluno (`notification-preferences:<studentId>`)
  - [ ] Aplicar preferências antes de exibir qualquer toast in-app
  - [ ] Criar helpers:
    - [ ] `loadNotificationPreferences()`
    - [ ] `saveNotificationPreferences()`
    - [ ] `isNotificationCategoryEnabled(type)`

- [ ] **Frontend: UI de notificações no Home** (AC1–AC9)
  - [ ] Adicionar sino/atalho de notificações no bloco de progresso do aluno
  - [ ] Adicionar painel/modal de notificações com:
    - [ ] lista paginada
    - [ ] indicador de lido/não lido
    - [ ] ação "marcar como lida"
    - [ ] ação "marcar todas"
  - [ ] Adicionar seção "Configurações > Notificações" com toggles por categoria
  - [ ] Implementar toast in-app reutilizável (5s, canto inferior direito)
  - [ ] Conectar ações de link para áreas existentes (comentários, frequência, próxima aula)

- [ ] **Guardrails de qualidade e UX**
  - [ ] Mensagens sempre motivacionais (sem linguagem de culpa)
  - [ ] Não bloquear fluxo principal do aluno com popups modais obrigatórios
  - [ ] Evitar spam: no máximo 1 notificação por categoria por janela de processamento
  - [ ] Truncar preview de comentário com segurança (sem `innerHTML`)
  - [ ] Garantir acessibilidade básica do painel (foco e leitura textual)

- [ ] **Testes e validação**
  - [ ] Backend: `npx tsc --noEmit`
  - [ ] Frontend: novos testes unitários em `home.component.spec.ts` para:
    - [ ] filtros por preferência habilitada/desabilitada
    - [ ] render de feed de notificações
    - [ ] marcar lida / marcar todas
    - [ ] persistência de preferências no localStorage
    - [ ] toast com timeout de 5s
  - [ ] Frontend: `npx ng test --watch=false --browsers=ChromeHeadless`

---

## Dev Notes

### Contexto Funcional (Epic 4)

Story 4.7 é continuidade direta da 4.6 e fecha o bloco de engajamento ativo antes da 4.8 (histórico de faixas). O foco aqui é motivação proativa com baixo atrito: notificação útil, contextual e não intrusiva.

Sequência do epic:
- 4.1 dashboard base
- 4.2 evolução detalhada
- 4.3 frequência detalhada
- 4.4 comentários detalhados
- 4.5 badges e milestones
- 4.6 comparação mês-a-mês
- **4.7 notificações proativas (esta story)**
- 4.8 histórico de faixas

### Arquitetura e Limitações Reais do Projeto

- Já existe tabela `notifications` no schema, com índices e `valid_type` restrito a:
  - `badge_earned`
  - `attendance_reminder`
  - `alert_system`
  - `comment_received`
- Não existe tabela dedicada de preferências de notificação.
- Para manter padrão atual do projeto e evitar migration nesta story, preferências do aluno devem ser persistidas no frontend (localStorage).

### Mapeamento de Tipos (ACs -> type existente)

Como o CHECK do banco limita `type`, mapear assim:
- Badge desbloqueado -> `badge_earned`
- Streak 30d -> `attendance_reminder` (mensagem especial)
- Frequência baixa -> `attendance_reminder`
- Primeira aula -> `attendance_reminder`
- Comentário novo -> `comment_received`
- Lembretes de véspera / 2h -> `attendance_reminder`

### Canais e Entrega

A coluna `channels` (0..7) já existe como bitmask. Para MVP desta story:
- Foco obrigatório: in-app toast + feed interno
- Push/email ficam como preparação de payload/registro para processamento assíncrono futuro
- Não bloquear entrega da story por integração externa de push provider

### Critérios de Deduplicação (anti-spam)

Implementar dedupe mínimo no backend ao gerar notificações:
- Mesma `type` + mesmo `user_id` + mesma janela diária não deve criar duplicata
- Para comentários, usar hash simples de (`comment_id`/`created_at`) quando disponível
- Para lembretes de aula, uma notificação por janela (véspera e 2h)

### Integração com Fluxos Existentes

- Próxima aula já disponível no dashboard do aluno (`cards.frequencia.nextClass`)
- Comentários já possuem endpoint dedicado (`/alunos/me/comentarios`)
- Badges já possuem endpoint dedicado (`/alunos/me/badges`)

A story deve reaproveitar esses contextos para compor mensagens e links de navegação, sem duplicar lógica pesada no template.

### Arquivos Candidatos

- `backend/src/lib/database.ts`
- `backend/src/controllers/users.ts`
- `backend/src/routes/users.ts`
- `frontend/src/types/index.ts`
- `frontend/src/services/api.service.ts`
- `frontend/src/components/home/home.component.ts`
- `frontend/src/components/home/home.component.html`
- `frontend/src/components/home/home.component.scss`
- `frontend/src/components/home/home.component.spec.ts`
- `_bmad-output/implementation-artifacts/4-7-notificacoes-proativas.md`

### Guardrails (aprendizados 4.5/4.6)

- Usar `??` em vez de `||` para preservar zeros válidos
- Evitar comparação temporal por `getTime()` entre âncoras de mês/semana quando houver `date_trunc`
- SQL sempre parametrizado
- Evitar `innerHTML` em previews de comentários
- Limpar estado transient ao fechar modal/painel (padrão do HomeComponent)

### Referências

- Story fonte: `_bmad-output/Epics/Epic4/Story-4-7.md`
- Epic contexto: `_bmad-output/Epics/Epic4/Epic4.md`
- Story anterior (baseline): `_bmad-output/implementation-artifacts/4-6-comparacao-mes-mes.md`
- PRD: `_bmad-output/planning-artifacts/prd.md`
- Arquitetura: `_bmad-output/planning-artifacts/architect.md`
- UX base: `_bmad-output/planning-artifacts/ux.md`
- Schema notificações: `_bmad-output/schema.sql`

---

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- create-story 4-7 (artifact synthesis)
- dev-story 4-7 (backend/frontend implementation)
- validation: backend `npx tsc --noEmit`
- validation: frontend `npx ng test --watch=false --browsers=ChromeHeadless`

### Completion Notes List

- Story 4.7 criada com contexto completo para backend + frontend.
- Estratégia definida para usar tabela `notifications` existente sem migration.
- Mapeamento de tipos e deduplicação definidos para evitar spam.
- Preferências de notificação definidas para persistência local (MVP) com impacto não intrusivo.
- Endpoints de notificações do aluno implementados (listar, marcar lida, marcar todas) com rotas protegidas.
- Home do aluno atualizado com atalho, painel paginado, estado de leitura e configurações de categorias.
- Toast in-app motivacional implementado com timeout de 5s e cleanup de timer no ciclo de vida.
- Tipos e ApiService atualizados para suportar feed de notificações.
- Testes unitários de Home expandidos para cobrir feed, preferências, marcação e timeout do toast.

### File List

- `_bmad-output/implementation-artifacts/4-7-notificacoes-proativas.md`

### Change Log

- 2026-03-28: Story 4.7 criada com status `ready-for-dev` e guia completo para implementação.
