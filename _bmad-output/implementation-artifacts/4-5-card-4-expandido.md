# Story 4.5: Card 4 Expandido - Badges e Milestones

**Status:** done

**Story URL:** [card-4-expandido]

---

## Story

Como um Aluno,
Quero ver todos os badges (achievements) que desbloqueei,
Para que eu saiba que meu esforco foi reconhecido.

---

## Acceptance Criteria

1. Dado que Aluno clica "[Ver todos badges]" no Card 4, quando clica, entao abre pagina/modal "Seus Badges e Milestones" e exibe grid de badges desbloqueados e proximos.
2. Dado que pagina carrega, quando renderiza, entao mostra badges desbloqueados com icone, data de desbloqueio, descricao e acao de compartilhamento.
3. Dado que pagina carrega, quando renderiza, entao mostra proximos badges com progresso atual, percentual, barra visual e mensagem "Faltam X".
4. Dado que Aluno clica em badge desbloqueado, quando abre detalhes, entao exibe modal com icone grande, descricao completa, data de desbloqueio e botoes de compartilhamento.
5. Dado que Aluno clica "[Compartilhar]", quando confirma, entao gera mensagem template de conquista para WhatsApp/copia e feedback visual de sucesso.
6. Dado que barra de progressao esta visivel, quando Aluno ve, entao UI deixa claro "Voce esta a X% de desbloquear [Badge]" e mensagem motivacional.
7. Dado que ha 0 badges desbloqueados e 0 proximos calculaveis, quando pagina carrega, entao exibe estado vazio "Comece a treinar para desbloquear badges!" e orienta o primeiro objetivo.
8. Dado que Aluno interage com badge futuro, quando mouse/toque, entao exibe tooltip com progresso atual, faltante e estimativa.

---

## Tasks / Subtasks

- [x] Definir contrato de historico de badges completo
  - [x] Adicionar tipos em `frontend/src/types/index.ts` para badges desbloqueados, badges proximos e payload de compartilhamento
  - [x] Adicionar metodo dedicado no `ApiService` para consultar badges detalhados do aluno logado
  - [x] Manter compatibilidade com `StudentProgressDashboardResponse.cards.faixaConquistas`

- [x] Implementar endpoint backend dedicado para badges do aluno
  - [x] Criar funcao em `backend/src/lib/database.ts` para retornar badges desbloqueados + badges proximos com progresso
  - [x] Reutilizar tabelas existentes `badges`, `student_badges`, `student_progress` sem migration
  - [x] Aplicar ordenacao consistente (desbloqueados por `earned_at DESC`; proximos por menor faltante)
  - [x] Criar handler em `backend/src/controllers/users.ts`
  - [x] Registrar rota em `backend/src/routes/users.ts` com auth + `requireRole(['Aluno'])`

- [x] Implementar calculo de "proximos badges" baseado em schema atual
  - [x] Usar `criteria_type` e `criteria_value` da tabela `badges`
  - [x] Calcular progresso por tipo:
    - [x] `streak` -> `student_progress.streak_current`
    - [x] `sessions_total`/`milestone` -> `student_progress.total_sessions`
    - [x] `attendance_percentage` -> `student_progress.total_attendance_percentage`
  - [x] Excluir badges ja conquistados do bloco de proximos
  - [x] Limitar quantidade inicial de proximos badges (ex.: top 5) para manter performance

- [x] Integrar Card 4 expandido no Home do aluno
  - [x] Atualizar `openStudentProgressDetails()` para novo detalhe de badges (ex.: `'badges'`)
  - [x] Carregar dados ao abrir detalhe de badges
  - [x] Implementar estados de loading, erro e vazio

- [x] Construir UI de "Seus Badges e Milestones"
  - [x] Trocar CTA do card "Faixa e Conquistas" para "Ver todos badges"
  - [x] Renderizar grid de badges desbloqueados com data e descricao
  - [x] Renderizar secao de proximos badges com progresso visual e mensagem "Faltam X"
  - [x] Implementar modal de detalhe do badge desbloqueado
  - [x] Implementar tooltip para badge futuro (desktop hover + mobile toque)

- [x] Implementar compartilhamento
  - [x] Gerar template: "🏅 Desbloqueei '<badge>' em SCAcademia! Treino 🥋 em <Academia>."
  - [x] Usar `navigator.share` quando disponivel; fallback para `navigator.clipboard.writeText`
  - [x] Exibir confirmacao de sucesso/erro sem bloquear fluxo

- [x] Aplicar guardrails de seguranca e performance
  - [x] Nao usar `[innerHTML]` para conteudo dinamico de badges; preferir interpolacao segura
  - [x] Nao concatenar entrada de usuario em SQL; usar parametros
  - [x] Se houver filtro de busca no futuro, escapar `%`, `_`, `\` em `ILIKE ... ESCAPE '\\'`
  - [x] Evitar funcoes pesadas diretamente no template sem memoizacao/pipe puro

- [x] Testes e validacao
  - [x] Backend: validar TypeScript (`npx tsc --noEmit`)
  - [x] Frontend: adicionar testes unitarios no `home.component.spec.ts` para:
    - [x] carga de badges ao abrir detalhe
    - [x] render de desbloqueados/proximos
    - [x] calculo de percentual/faltante
    - [x] estado vazio
    - [x] compartilhamento com fallback
  - [x] Frontend: executar suite Angular completa (`npx ng test --watch=false --browsers=ChromeHeadless`)

---

## Dev Notes

### Contexto funcional (Epic 4)
- Story 4.5 expande o Card 4 do dashboard do aluno (faixa e conquistas) com foco em engajamento por badges.
- Sequencia do epic: 4.1 (dashboard base), 4.2 (evolucao), 4.3 (frequencia), 4.4 (comentarios), 4.5 (badges), 4.6+ (motivacao adicional).

### Estado atual do codigo (baseline real)
- O card "Faixa e Conquistas" ja mostra resumo (`currentBelt`, `totalBadges`) no dashboard.
- O backend ja retorna `latestBadges` (top 5) e `totalBadges` dentro de `getStudentProgressDashboard`.
- Ainda nao existe endpoint detalhado de badges para listar desbloqueados + proximos com progresso.
- O modal de detalhes atual cobre `evolucao`, `frequencia`, `comentarios` e `faixa`; badges detalhados ainda nao possuem secao dedicada.

### Regras de dados e limitacoes de schema
- Nao criar migration nesta story.
- Tabelas existentes:
  - `badges`: `name`, `description`, `criteria_type`, `criteria_value`, `icon_url`
  - `student_badges`: conquistas ja obtidas (`earned_at`)
  - `student_progress`: base de progresso (`total_sessions`, `streak_current`, `total_attendance_percentage`)
- O texto de AC com "horas" deve ser tratado como copy/UX. Calculo tecnico deve usar os campos reais do schema (`sessions`, `streak`, `attendance`).

### API proposta (MVP story 4.5)
- Endpoint sugerido: `GET /api/users/alunos/me/badges`
- Query params opcionais: `limitUnlocked`, `limitUpcoming` (defaults conservadores)
- Resposta sugerida:

```ts
interface StudentBadgeUnlockedItem {
  badgeId: string;
  name: string;
  description: string;
  iconUrl?: string;
  earnedAt: string;
  shareText: string;
}

interface StudentBadgeUpcomingItem {
  badgeId: string;
  name: string;
  description: string;
  iconUrl?: string;
  criteriaType: 'streak' | 'attendance_percentage' | 'sessions_total' | 'milestone';
  criteriaValue: number;
  currentValue: number;
  progressPercent: number;
  remaining: number;
  etaHint?: string;
}

interface StudentBadgesHistoryResponse {
  unlocked: StudentBadgeUnlockedItem[];
  upcoming: StudentBadgeUpcomingItem[];
  totals: {
    unlocked: number;
    upcoming: number;
  };
}
```

### UX e comportamento
- Manter consistencia visual com o modal de frequencia/comentarios (stories 4.3/4.4).
- Exibir CTA motivacional em proximos badges: "Continue treinando!".
- Estado vazio deve diferenciar:
  - sem badges disponiveis no catalogo
  - badges existem, mas nenhum desbloqueado ainda
- Para tooltip em mobile, usar interacao por toque (tap-to-toggle) com fechamento claro.

### Seguranca e qualidade (aprendizados da 4.4)
- Evitar vulnerabilidades de injecao/markup:
  - nao renderizar HTML bruto vindo do banco
  - nao interpolar strings de usuario em SQL
- Garantir contratos backend/frontend estritos e testes para bordas (0 badges, progresso > 100, badge sem `criteria_value`).

### Arquivos candidatos
- `backend/src/lib/database.ts`
- `backend/src/controllers/users.ts`
- `backend/src/routes/users.ts`
- `frontend/src/types/index.ts`
- `frontend/src/services/api.service.ts`
- `frontend/src/components/home/home.component.ts`
- `frontend/src/components/home/home.component.html`
- `frontend/src/components/home/home.component.scss`
- `frontend/src/components/home/home.component.spec.ts`
- `_bmad-output/implementation-artifacts/4-5-card-4-expandido.md`

### Referencias
- Story fonte: `_bmad-output/Epics/Epic4/Story-4-5.md`
- Epic contexto: `_bmad-output/Epics/Epic4/Epic4.md`
- PRD: `_bmad-output/planning-artifacts/prd.md`
- Arquitetura: `_bmad-output/planning-artifacts/architect.md`
- UX base: `_bmad-output/planning-artifacts/ux.md`
- Baseline tecnico anterior: `_bmad-output/implementation-artifacts/4-4-card-3-expandido.md`
- Schema badges/progresso: `_bmad-output/schema.sql`

---

## Dev Agent Record

### Agent Model Used
GPT-5.3-Codex

### Debug Log References
- create-story 4-5 (artifact synthesis)

### Completion Notes List
- Story criada com contexto completo para backend + frontend.
- Guardrails de seguranca/performance incluidos com base em revisao da 4.4.
- Sem alteracao de schema, com regras explicitas de mapeamento por `criteria_type`.
- ✅ Implementação concluída: endpoint `GET /api/users/alunos/me/badges` com função `getStudentBadgesHistory` calculando badges desbloqueados (ORDER BY earned_at DESC) e próximos (ORDER BY remaining ASC, top 5).
- ✅ Frontend: tipos, ApiService, HomeComponent (lógica + UI + SCSS) completamente implementados.
- ✅ Compartilhamento via `navigator.share` com fallback para `navigator.clipboard.writeText` e fallback legado.
- ✅ Guardrails: sem innerHTML, parâmetros SQL, interpolações seguras.
- ✅ 6 novos testes unitários — suite total: 136/136 passando. Backend tsc --noEmit: zero erros.

### File List
- _bmad-output/implementation-artifacts/4-5-card-4-expandido.md
- backend/src/lib/database.ts (adicionado `StudentBadgesHistoryResult`, `getStudentBadgesHistory`)
- backend/src/controllers/users.ts (adicionado `getMyStudentBadgesHistoryHandler`)
- backend/src/routes/users.ts (registrada rota `GET /alunos/me/badges`)
- frontend/src/types/index.ts (adicionado `StudentBadgeUnlockedItem`, `StudentBadgeUpcomingItem`, `StudentBadgesHistoryResponse`)
- frontend/src/services/api.service.ts (adicionado `getStudentBadgesHistory()`)
- frontend/src/components/home/home.component.ts (estado badges, `loadStudentBadgesHistory`, `shareBadge`, helpers)
- frontend/src/components/home/home.component.html (seção 'badges' no painel de detalhes, CTA "Ver todos badges")
- frontend/src/components/home/home.component.scss (estilos `.badges-grid`, `.badge-card`, `.badge-progress-*`, `.badge-detail-modal`)
- frontend/src/components/home/home.component.spec.ts (6 testes novos para Story 4-5)

### Change Log
- 2026-03-27: Story 4.5 criada com status `ready-for-dev` e contexto completo para implementacao.
- 2026-03-27: Story 4.5 implementada — backend (DB function + endpoint) e frontend (UI grid + modal + compartilhamento + tooltips) completos. 6 testes unitários adicionados (136/136 passando). Status: review.
- 2026-03-27: Code review adversarial (6 patches aplicados): P1 `??` para totais zero, P2 `rows.length` para rowCount nullable, P3 SQL LIMIT na query de catálogo, P4 reset de badgeShareConfirmation no fechamento do painel, P5 label humanizada de progresso AC6, P6 botões distintos shareBadge/copyBadgeToClipboard. 136/136 testes passando. Status: done.
