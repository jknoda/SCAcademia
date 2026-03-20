Story 4.1: Dashboard de Progresso — 4 Cards Mágicos
Como um Aluno,
Quero ver meu progresso em judô de forma clara e motivadora,
Para que eu entenda se estou evoluindo e continue treinando.

**Critérios de Aceitação:**

**Dado** que um Aluno faz login e acessa seu dashboard
**Quando** a página carrega
**Então** o sistema exibe:
  - Heading: "Olá, [Nome]! 👋"
  - Subheading: "Seu progresso em judô"
  - 4 cards visíveis na primeira tela (sem scroll necessário em mobile)

**Dado** que a página renderiza os 4 cards
**Quando** carrega
**Então** exibe na ordem:

  **CARD 1 — Evolução Este Mês (Laranja/Orange)**
  - Ícone: 📈
  - Valor principal: "+8%" (grande, destaque)
  - Texto: "Você treinou mais técnicas este mês"
  - Link: "[Ver detalhes]"
  - Cor: Orange Judo (#FF6B35) - psicologicamente trending up

  **CARD 2 — Frequência (Azul Primary)**
  - Ícone: 🎯
  - Valor principal: "8 de 10"
  - Subtítulo: "80% frequência esta semana"
  - Próxima aula: "Terça, 15:00"
  - Link: "[Ver histórico]"

  **CARD 3 — Comentários do Professor (Verde Success)**
  - Ícone: 💬 ou nome do professor
  - Texto: "[Comentário truncado até 100 chars]"
  - Nome professor: "— Prof. João"
  - Link: "[Ver todos comentários]"
  - Se nenhum: "Nenhum comentário ainda. Bora treinar!"

  **CARD 4 — Faixa & Conquistas (Multi-cor)**
  - Ícone: 🥋
  - **Faixa Atual (Destaque Principal):**
    - Texto: "Sua faixa: [Nome da Faixa]"
    - Exemplo: "Sua faixa: Branca 🥋"
    - Data: "Conquista em: [DD/MM/YYYY]"
    - Link: "[Ver histórico de faixas]" (expande timeline)
  - **Próximos Milestones:**
    - Badges visíveis: "🏅 2 Semanas Sem Faltar" + "[+1 até próximo badge]"
  - Link: "[Ver todos badges & histórico]"

**Dado** que cards são exibidos
**Quando** renderiza
**Então** cada card tem:
  - Padding: 16px (mobile), 20px (desktop)
  - Sombra: Material elevation-1 (suave)
  - Border-radius: 4px
  - Todos em Material Card component

**Dado** que Aluno está em desktop
**Quando** viewport > 1200px
**Então** layout muda para: 2 cards por linha (máx 2 colunas)
**E** espaço entre cards: 24px (L spacing)

**Dado** que Aluno está em tablet
**Quando** viewport 600-959px
**Então** layout: 2x2 grid (2 cards por linha)

**Dado** que Aluno está em mobile
**Quando** viewport < 600px
**Então** layout: 1 coluna (scroll vertical)
**E** cards ficam full-width
**E** espaço entre: 16px (M spacing)

**Dado** que Aluno clica em "[Ver detalhes]" de um card
**Quando** clica
**Então** expande para modal/página de detalhes
**E** mantém histórico de navegação (back button funciona)

**Dado** que há erro ao carregar dados
**Quando** sistema falha
**Então** exibe skeleton loaders (placeholder cinzento animado)
**E** retry automático a cada 2 segundos
**E** timeout de 10 seg exibe: "Erro ao carregar. [Tentar Novamente]"

**Dado** que Aluno está offline
**Quando** dashboard carrega
**Então** mostra dados cacheados (IndexedDB)
**E** ícone discreto: "⏱ Dados de [data última sync]"
**E** não assusta usuário com erro

---

## 📋 Critérios Adicionais — CARD 4: Faixa & Histórico (Judo Profile)

**Dado** que Card 4 renderiza
**Quando** carrega dados do judo_profile
**Então** exibe:
  - Nome da faixa atual (de `judo_profile.current_belt`)
  - Data de conquista (de `judo_profile.belt_date`)
  - Ícone visual correspondente à faixa (🥋 cor dinâmica: branca=white, bordô=burgundy, etc)

**Dado** que Aluno clica em "[Ver histórico de faixas]"
**Quando** clica
**Então** abre modal/página com timeline vertical mostrando:
  - **Ordem cronológica:** faixas da mais antiga para a mais recente
  - **Para cada faixa no histórico:**
    - Faixa (nome e ícone)
    - Data de conquista (`received_date` de `judo_belt_history`)
    - Duração em dias/meses desde faixa anterior
    - Quem promoveu (nome do professor/admin, de `promoted_by_user_id`)
    - Observações/notas (se existirem, de `notes` em `judo_belt_history`)

**Dado** que modal/página de histórico está aberto
**Quando** renderiza
**Então** mostra estatísticas:
  - Tempo total praticando (data_entrada até hoje)
  - Número de faixas conquistadas
  - Faixa com maior duração
  - Progressão clara (timeline visual)

**Dado** que o Aluno é federado (is_federated = true)
**Quando** visualiza histórico de faixas
**Então** exibe badge "🏅 Federado" ao lado da faixa atual
**E** mostra nº de registro de federação (se disponível)

**Dado** que há novo histórico de faixa
**Quando** dados são sincronizados do servidor
**Então** Card 4 atualiza automaticamente
**E** exibe notificação discreta: "Você conquistou uma nova faixa! 🎉"
**E** anima transição com efeito subtle (fade-in da nova faixa)

**Dado** que Aluno não tem histórico de faixas
**Quando** Card 4 carrega
**Então** exibe: "Comece seu histórico! Treine e receba sua primeira faixa 💪"
**E** link "[Ver requisitos]" para próxima faixa

---

## 🗄️ Dados Carregados (Queries)

### Query Principal — Dashboard Loads:
```sql
-- Dados do judo_profile (faixa atual)
SELECT 
  jp.current_belt,
  jp.belt_date,
  jp.is_federated,
  jp.federation_registration
FROM judo_profile jp
WHERE jp.student_id = $1 AND jp.academy_id = $2;

-- Dados do histórico (para o link)
SELECT 
  jbh.belt,
  jbh.received_date,
  jbh.promoted_by_user_id,
  jbh.notes,
  u.full_name AS promoted_by_name
FROM judo_belt_history jbh
LEFT JOIN users u ON jbh.promoted_by_user_id = u.user_id
WHERE jbh.student_id = $1 AND jbh.academy_id = $2
ORDER BY jbh.received_date DESC;
```

### Cache Layer (IndexedDB — Offline):
- Chave: `judo_profile:{student_id}`
- Chave: `judo_belt_history:{student_id}`
- TTL: 24 horas (sincroniza automaticamente quando online)

---

## 🎨 Visual Design Notes

- **Faixa Atual Card:**
  - Destaque visual: gradiente suave (cor da faixa atual)
  - Ícone 🥋 com cor dinâmica por faixa
  - Tipografia: título 24px bold, data 12px subtle
  
- **Timeline Modal:**
  - Vertical line connecting faixas (visual narrative)
  - Cada faixa é um "ponto" com hover effect
  - Desktop: 2-column (faixas + detalhes)
  - Mobile: 1-column stack

---

## ✅ Referência FR

- **FR35:** Badges & Milestones System  
- **FR37:** Student Profile completo (NOVO — incluindo judo_profile + judo_belt_history)
- **FR39:** Histórico de Progressão de Aluno (NOVO — tracking de faixas)

---

## 🔧 Edições Feitas (Changelog)

**2026-03-20 — Atualização Judo Profile:**
- Adicionado CARD 4 com faixa atual (judo_profile)
- Adicionado link "[Ver histórico de faixas]" → timeline modal
- Adicionados critérios AC específicos para judo_belt_history
- Adicionadas queries SQL com dados corretos
- Adicionado visual design para histórico de faixas
- Referência à tabela judo_elite_history implementada