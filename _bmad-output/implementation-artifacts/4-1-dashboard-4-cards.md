# Story 4.1: Dashboard de Progresso - 4 Cards Magicos

Status: review

## Story

Como um Aluno,
Quero ver meu progresso em judo de forma clara e motivadora,
para que eu entenda se estou evoluindo e continue treinando.

## Acceptance Criteria

1. Dado que um Aluno faz login e acessa o dashboard, quando a pagina carrega, entao exibe heading "Ola, [Nome]!" e subheading "Seu progresso em judo", com 4 cards visiveis na primeira dobra em mobile.
2. Dado que os cards renderizam, quando carrega, entao aparecem na ordem: Evolucao do Mes, Frequencia, Comentarios do Professor, Faixa e Conquistas.
3. Dado que o Aluno esta em desktop (>1200px), quando renderiza, entao layout com 2 cards por linha e espaco de 24px.
4. Dado que o Aluno esta em tablet (600-959px), quando renderiza, entao layout 2x2.
5. Dado que o Aluno esta em mobile (<600px), quando renderiza, entao layout 1 coluna, cards full-width e espacamento 16px.
6. Dado clique em "Ver detalhes" de qualquer card, quando clica, entao abre tela/modal de detalhes e preserva navegacao de retorno.
7. Dado falha de carregamento, quando requisicao falha, entao exibe skeleton loader inicialmente, retry automatico a cada 2s e apos timeout de 10s mostra "Erro ao carregar. Tentar novamente".
8. Dado modo offline, quando dashboard carrega sem rede, entao mostra dados cacheados com indicador discreto de data/hora da ultima sincronizacao.
9. Dado o Card 4, quando carrega dados de judo_profile, entao exibe faixa atual, data de conquista, estado de federacao e link de historico.
10. Dado clique em historico de faixas, quando abre detalhes, entao mostra timeline com faixa, data, promovido por, duracao e observacoes.

## Tasks / Subtasks

- [x] Criar camada de dados do dashboard do aluno (AC: 1, 2, 7, 8)
  - [x] Definir contratos TypeScript para os 4 cards em `frontend/src/types/index.ts`
  - [x] Adicionar endpoint(s) em `frontend/src/services/api.service.ts` para obter dados agregados do dashboard do aluno
  - [x] Implementar fallback offline e metadata de ultima sincronizacao (usar padrao de sync da Story 3.8)

- [x] Implementar UI dos 4 cards na area de aluno da Home (AC: 1, 2, 3, 4, 5)
  - [x] Evoluir `frontend/src/components/home/home.component.html` para incluir secao dedicada dos 4 cards no bloco de aluno
  - [x] Ajustar `frontend/src/components/home/home.component.scss` com grid responsivo por breakpoints (desktop/tablet/mobile)
  - [x] Preservar padrao visual existente de cards (feature-card/action-btn) evitando ruptura de estilo global

- [x] Implementar comportamento de loading/erro/retry (AC: 7)
  - [x] Skeleton placeholders durante carregamento
  - [x] Retry automatico em 2s com limite e timeout de 10s
  - [x] Botao "Tentar novamente" em estado de erro final

- [x] Implementar comportamento offline (AC: 8)
  - [x] Mostrar indicador discreto de dados cacheados com timestamp
  - [x] Reaproveitar padrao de sincronizacao e conflitos ja consolidado na Story 3.8

- [x] Implementar navegacao de detalhes por card (AC: 6, 9, 10)
  - [x] "Ver detalhes" do Card 1 abre detalhamento de evolucao
  - [x] "Ver historico" do Card 2 abre historico de frequencia
  - [x] "Ver comentarios" do Card 3 abre timeline de comentarios
  - [x] "Ver historico de faixas" do Card 4 abre timeline de faixas

- [x] Implementar Card 4 com judo_profile + historico de faixas (AC: 9, 10)
  - [x] Consumir dados de faixa atual e federacao
  - [x] Exibir indicadores de milestones/badges de forma incremental (primeira versao com dados disponiveis)
  - [x] Preparar estrutura para expandir no 4.8 sem retrabalho

- [ ] Testes e validacoes (AC: 1-10)
  - [x] Testar responsividade nos breakpoints alvo
  - [ ] Testar fallback offline e retorno online
  - [ ] Testar acessibilidade basica (focus/teclado/contraste)
  - [ ] Validar integracao com dados reais de aluno

## Dev Notes

### Contexto funcional do produto
- Epic 4 foca engajamento do aluno com progresso visual e baixo atrito.
- Esta story e a porta de entrada do Epic 4: os 4 cards devem aparecer no dashboard principal do aluno.
- Evitar over-engineering nesta etapa: habilitar base funcional para as stories 4.2 a 4.8.

### Estado atual do codigo (fonte de verdade)
- O dashboard principal esta em `frontend/src/components/home/home.component.html` e `frontend/src/components/home/home.component.ts`.
- Ja existe bloco especifico para aluno com secoes "Proximas Acoes" e "Minha Jornada"; a Story 4.1 deve estender este fluxo sem quebrar Professor/Responsavel.
- `frontend/src/components/home/home.component.ts` ja diferencia papeis (`isAluno`, `isProfessor`, `isResponsavel`) e define titulo/subtitulo por perfil.
- `frontend/src/services/api.service.ts` possui endpoints de treino e historico, alem de infraestrutura de sync queue offline (Story 3.8) reutilizavel para cache/indicadores.

### Requisitos tecnicos e guardrails
- Stack: Angular + TypeScript + API service pattern existente.
- Nao criar uma segunda home page; implementar dentro do fluxo atual do componente Home para Aluno.
- Nao duplicar componentes de card: reaproveitar classes e padroes de estilo existentes e introduzir novas classes apenas quando necessario.
- Nao quebrar regras de mobile banner e estilos recentemente ajustados.
- Manter naming e estrutura do projeto (componentes em `frontend/src/components`, servicos em `frontend/src/services`, tipos em `frontend/src/types`).

### Arquitetura e integracao
- O backend e stateless com API REST; consolidar agregacao de dados para dashboard em endpoint(s) dedicado(s) do aluno quando necessario.
- Se nao houver endpoint unico, criar camada agregadora no frontend com requests paralelas e tratamento de falhas parciais.
- Aplicar timeout e retry de forma controlada para evitar loops infinitos.

### UX e responsividade
- Seguir o direcionamento de UX do projeto para visualizacao de progresso e motivacao.
- Prioridade: leitura imediata e valor percebido na primeira dobra.
- Mobile first: 1 coluna e espacamento claro.
- Desktop/tablet: grid organizado sem deslocar secoes existentes.

### Dados e offline
- Reaproveitar padroes da Story 3.8 para comportamento offline:
  - indicador de estado
  - dados de cache
  - sincronizacao quando online
- Evitar implementar IndexedDB ad-hoc sem padrao comum.

### Segurança e conformidade
- Dados de aluno devem respeitar escopo por usuario autenticado.
- Nao expor dados de outros alunos/professores no card.
- Logs e auditoria devem seguir padrao existente do backend quando novos endpoints forem criados.

### Testes e criterios de pronto
- Pronto quando os 10 ACs estiverem cobertos com evidencia funcional.
- Build frontend deve permanecer verde.
- Sem regressao nos blocos de Professor e Responsavel da Home.

### Riscos e mitigacoes
- Risco: dependencia de dados que ainda serao expandidos nas stories 4.2-4.8.
  - Mitigacao: contratos claros e placeholders funcionais para campos nao disponiveis.
- Risco: acoplamento excessivo no `home.component`.
  - Mitigacao: extrair componentes filhos de card se o template crescer demais.
- Risco: inconsistencias de cache offline.
  - Mitigacao: manter estrategia de sync centralizada no padrao ja existente.

### Referencias
- Story fonte: `_bmad-output/Epics/Epic4/Story-4-1.md`
- Epic overview: `_bmad-output/Epics/Epic4/Epic4.md`
- Arquitetura tecnica: `_bmad-output/planning-artifacts/architect.md`
- UX specification: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Base dashboard atual: `frontend/src/components/home/home.component.html`, `frontend/src/components/home/home.component.ts`, `frontend/src/components/home/home.component.scss`
- API e sync offline: `frontend/src/services/api.service.ts`
- Aprendizados offline: `_bmad-output/implementation-artifacts/3-8-sincronizacao-offline.md`

## Project Structure Notes

- Story deve evoluir primariamente:
  - `frontend/src/components/home/*`
  - `frontend/src/services/api.service.ts`
  - `frontend/src/types/index.ts`
- Possivel expansao controlada:
  - novo componente de card em `frontend/src/components/student-progress-cards/*` (somente se necessario para manter legibilidade)
- Evitar tocar em rotas ou modulos nao relacionados sem necessidade funcional.

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Sprint status analisado em `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Story base analisada em `_bmad-output/Epics/Epic4/Story-4-1.md`

### Completion Notes List

- Implementado endpoint backend `GET /api/users/alunos/me/progresso` com agregacao de evolucao mensal, frequencia (90d), comentarios, faixa/conquistas e timeline de faixas.
- Implementados contratos frontend para dashboard do aluno e metodo no `ApiService` para consumo do endpoint agregado.
- Home do aluno atualizada com os 4 cards na ordem do AC, grid responsivo (mobile/tablet/desktop), skeleton, retry 2s com timeout 10s, fallback offline por cache local e modal de detalhes por card.
- Build validado em backend (`npm run build`) e frontend (`npm run build`).

### File List

- `_bmad-output/implementation-artifacts/4-1-dashboard-4-cards.md`
- `backend/src/lib/database.ts`
- `backend/src/controllers/users.ts`
- `backend/src/routes/users.ts`
- `frontend/src/types/index.ts`
- `frontend/src/services/api.service.ts`
- `frontend/src/components/home/home.component.ts`
- `frontend/src/components/home/home.component.html`
- `frontend/src/components/home/home.component.scss`
