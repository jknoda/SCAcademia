# Story 3.5: Revisar & Confirmar Registro

Status: done

## Story

Como Professor,
Quero revisar todos os dados antes de confirmar,
Para que eu tenha certeza de que o registro da aula está correto.

## Contexto de Negócio

- Esta story é a etapa 5 do wizard de treino: frequência (3.2), técnicas (3.3), notas (3.4), revisão/confirmar (3.5).
- Deve consolidar dados da sessão atual sem perda de estado entre telas.
- O resumo precisa ser legível e rápido para decisão final de confirmação.
- Esta story prepara o fechamento do registro; a experiência de sucesso detalhada continua na 3.6.

## Acceptance Criteria

### AC1 - Tela de revisão com resumo completo
- DADO que o professor completou as etapas anteriores
- QUANDO entra em /training/session/:sessionId/review
- ENTÃO exibe resumo visual com:
  - identificação da aula/turma/horário
  - frequência (presentes/ausentes)
  - técnicas selecionadas
  - observações gerais

### AC2 - Edição sem perda de dados
- DADO que o professor deseja corrigir algo
- QUANDO clica em voltar para editar
- ENTÃO retorna para a etapa correspondente
- E ao voltar para revisão os dados permanecem consistentes

### AC3 - Confirmação com validações mínimas
- DADO que o professor clica em confirmar
- QUANDO dispara a ação
- ENTÃO valida:
  - existe pelo menos 1 aluno presente
  - existe pelo menos 1 técnica selecionada
  - sessão válida para professor logado

### AC4 - Estado de salvamento seguro
- DADO que o professor clica em confirmar
- QUANDO a requisição está em andamento
- ENTÃO botão de confirmar fica desabilitado
- E loader visível evita duplo clique
- E estado de loading sempre é finalizado em sucesso e erro

### AC5 - Erro e offline resilientes
- DADO falha de rede/servidor
- QUANDO confirmação não conclui
- ENTÃO mostra feedback claro e ação de tentar novamente
- E se offline, mantém segurança local para reenvio

## Tasks / Subtasks

### Task 1 - Backend: endpoint de resumo de revisão (AC1, AC3)
- [x] Criar contrato e endpoint GET para resumo da sessão de revisão
- [x] Reusar fontes já existentes (attendance, techniques, notes) sem duplicar regra de negócio
- [x] Garantir isolamento por professor/academia

### Task 2 - Backend: endpoint de confirmação final (AC3, AC4, AC5)
- [x] Criar endpoint POST de confirmação para a sessão
- [x] Validar pré-condições (presença, técnicas, sessão válida)
- [x] Persistir status final da sessão com auditoria
- [x] Tratar erros com mensagens pt-BR

### Task 3 - Frontend: componente de revisão real (AC1, AC2)
- [x] Criar componente training-review
- [x] Substituir placeholder atual na rota de review
- [x] Renderizar cards de resumo com layout de leitura rápida

### Task 4 - Frontend: ação de confirmar com proteção de estado (AC4)
- [x] Implementar botão confirmar com desabilitação durante submit
- [x] Exibir loader e feedback de progresso
- [x] Usar finalize para evitar tela congelada por isLoading

### Task 5 - Frontend: erro/retry/offline (AC5)
- [x] Implementar feedback de erro com botão tentar novamente
- [x] Integrar fallback local para offline em padrão já adotado no wizard

### Task 6 - Testes (AC1-AC5)
- [x] Backend: testes de integração para resumo + confirmação + isolamento
- [x] Frontend: testes unitários para carregamento, confirmar, erro e reset de loading

## Dev Notes

- Reusar padrões consolidados das stories 3.2, 3.3 e 3.4.
- Evitar regressão de congelamento de tela: todo fluxo assíncrono deve ter reset de loading em sucesso e erro.
- Manter mensagens e labels em português.
- Navegação explícita por rota (sem depender de history/back do browser).

### Referências

- _bmad-output/implementation-artifacts/3-2-marcar-frequencia.md
- _bmad-output/implementation-artifacts/3-3-adicionar-tecnicas.md
- _bmad-output/implementation-artifacts/3-4-anotacoes-notas.md
- _bmad-output/Epics/Epic3/Story-3-5.md

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Backend: `npm test -- src/tests/training-review.test.ts` → PASS (`6 passed, 6 total`).
- Backend regressão wizard: `npm test -- src/tests/training-notes.test.ts src/tests/training-techniques.test.ts src/tests/training-attendance.test.ts` → PASS (`22 passed, 22 total`).
- Frontend review: `npm test -- --watch=false --include src/components/training-review/training-review.component.spec.ts` → PASS (`6 of 6 SUCCESS`).
- Frontend regressão wizard: `npm test -- --watch=false --include src/components/training-attendance/training-attendance.component.spec.ts --include src/components/training-techniques/training-techniques.component.spec.ts --include src/components/training-notes/training-notes.component.spec.ts` → PASS (`11 of 11 SUCCESS`).

### Completion Notes List

- Implementado backend de revisão com endpoint de resumo consolidado e endpoint de confirmação final da sessão.
- Confirmação final valida presença e técnicas antes de confirmar, registra auditoria e timestamp de confirmação.
- Substituído placeholder por componente real de revisão com cards de resumo, voltar para edição e botão CONFIRMAR & SALVAR.
- Implementado retry automático (até 3 tentativas), retry manual e fallback offline com pendência local para sincronização.
- Revisão geral anti-congelamento aplicada no wizard: telas de frequência e técnicas agora usam `finalize` para garantir reset de `isLoading` em sucesso/erro.

### File List

- backend/src/lib/trainingReview.ts (novo)
- backend/src/controllers/trainingReview.ts (novo)
- backend/src/routes/trainings.ts (atualizado)
- backend/src/tests/training-review.test.ts (novo)
- frontend/src/types/index.ts (atualizado)
- frontend/src/services/api.service.ts (atualizado)
- frontend/src/components/training-review/training-review.component.ts (novo)
- frontend/src/components/training-review/training-review.component.html (novo)
- frontend/src/components/training-review/training-review.component.scss (novo)
- frontend/src/components/training-review/training-review.component.spec.ts (novo)
- frontend/src/app.routing.module.ts (atualizado)
- frontend/src/app.module.ts (atualizado)
- frontend/src/components/training-attendance/training-attendance.component.ts (atualizado)
- frontend/src/components/training-techniques/training-techniques.component.ts (atualizado)
