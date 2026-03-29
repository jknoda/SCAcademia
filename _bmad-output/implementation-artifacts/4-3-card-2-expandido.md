# Story 4.3: Card 2 Expandido — Historico de Frequencia Detalhado

**Status:** done

**Story URL:** [card-2-expandido]

---

## Story

Como um Aluno,
Quero ver todas as minhas presencas/ausencias em detalhes,
Para que eu saiba quanto treino e quando tenho faltado.

---

## Acceptance Criteria

1. Dado que Aluno clica "Ver historico" no Card 2 (Frequencia), quando clica, entao abre modal/pagina "Seu Historico de Frequencia" e exibe lista de ultimas N aulas.
2. Dado que pagina carrega, quando renderiza, entao mostra lista com Data, Turma, Status (Presente/Ausente/Justificada).
3. Dado que lista e longa (20+ aulas), quando renderiza, entao usa paginacao (20 por pagina).
4. Dado que ha ausencia, quando exibe, entao mostra "Ausente" com destaque visual.
5. Dado que ha sequencia de presencas, quando Aluno ve, entao exibe badge de streak e contador de dias consecutivos.
6. Dado que Aluno quer filtrar por periodo, quando clica "Filtrar", entao aplica intervalo De/Ate dinamicamente.
7. Dado que Aluno quer exportar frequencia, quando clica "Exportar", entao baixa CSV com historico carregado.
8. Dado que Aluno ve frequencia abaixo de 70%, quando sistema detecta, entao exibe aviso amarelo de recuperacao.

---

## Tasks / Subtasks

- [x] Definir contrato de historico detalhado de frequencia
  - [x] Adicionar tipos de resposta para lista paginada, streak e aviso de frequencia
  - [x] Expor metodo dedicado no ApiService

- [x] Implementar endpoint backend de historico de frequencia do aluno
  - [x] Criar consulta paginada com filtros por periodo
  - [x] Retornar percentual de frequencia e alerta abaixo de 70%
  - [x] Retornar streak atual e dias consecutivos

- [x] Integrar modal de frequencia no Home do aluno
  - [x] Carregar historico ao abrir detalhes de frequencia
  - [x] Exibir lista com data/turma/status
  - [x] Exibir badge de streak e warning de frequencia

- [x] Implementar filtro, paginacao e exportacao CSV
  - [x] Filtros De/Ate no modal
  - [x] Controles de pagina anterior/proxima
  - [x] Exportacao de CSV no frontend

- [x] Testes e validacao
  - [x] Validar build backend
  - [x] Validar build frontend
  - [x] Adicionar testes unitarios dedicados para fluxo de frequencia detalhada
  - [x] Rodar suite Angular completa apos ajustes finais

---

## Dev Notes

### Contexto de implementacao
- Story 4.3 expande o card de frequencia da Story 4.1.
- O padrao de modal e estado segue o mesmo fluxo consolidado em 4.1 e 4.2.
- Foi reutilizado endpoint de dashboard para card resumido e criado endpoint especifico para historico detalhado.

### Endpoints e contratos
- Novo endpoint: `GET /api/users/alunos/me/frequencia`
- Parametros opcionais: `dateFrom`, `dateTo`, `limit`, `offset`
- Resposta inclui itens paginados, total, percentual, warningBelow70, currentStreak e currentStreakDays.

### Limitacoes atuais
- Nao existe campo de motivo de ausencia no schema atual de `session_attendance`; tooltip de razao permanece opcional e pendente de evolucao de dados.
- Nome de arquivo CSV segue padrao da story com sufixo de ano fixo no frontend (`2026`).

---

## Dev Agent Record

### Agent Model Used
GPT-5.3-Codex

### Completion Notes
- Implementado endpoint backend de historico detalhado com filtro e paginacao.
- Implementada experiencia de frequencia detalhada no modal do aluno com streak, warning < 70% e exportacao CSV.
- Exportacao CSV ajustada para baixar o historico completo conforme filtros ativos.
- Build do backend e frontend aprovados apos mudancas.
- Suite Angular completa aprovada (121/121) e spec do Home expandida para cobertura da Story 4.3.

### File List
- backend/src/lib/database.ts
- backend/src/controllers/users.ts
- backend/src/routes/users.ts
- frontend/src/types/index.ts
- frontend/src/services/api.service.ts
- frontend/src/components/home/home.component.ts
- frontend/src/components/home/home.component.html
- frontend/src/components/home/home.component.scss
- frontend/src/components/home/home.component.spec.ts
- _bmad-output/implementation-artifacts/4-3-card-2-expandido.md

### Change Log
- 2026-03-27: Criacao da story 4.3, implementacao completa do historico detalhado de frequencia e promocao para review.
