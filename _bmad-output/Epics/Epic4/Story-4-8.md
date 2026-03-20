Story 4.8: Visualização do Histórico de Faixas (Judo Belt Timeline)
=============================================================

Como um Aluno,
Quero ver uma timeline visual do meu histórico de faixas conquistadas,
Para que eu acompanhe minha evolução no judô e seja motivado a continuar progredindo.

---

## 📋 Critérios de Aceitação

**Dado** que um Aluno acessa a página de histórico de faixas (via Story 4.1 "Ver histórico")
**Quando** a página carrega
**Então** exibe:
  - Heading: "Suas Faixas no Judô 🥋"
  - Subheading: "Histórico completo de progressão"
  - Timeline vertical com todas as faixas conquistadas
  - Se nenhuma faixa: "Comece seu histórico! Aproveite seu primeiro treino."

**Dado** que a timeline renderiza
**Quando** carrega dados de judo_belt_history
**Então** exibe faixas em ordem CRONOLÓGICA CRESCENTE (da mais antiga para mais recente):
  - Cada faixa é um "card" ou "item" na linha do tempo
  - Conectados por uma linha vertical (visual narrative)

**Dado** que cada item de faixa está visível
**QUANDO** renderiza
**ENTÃO** mostra para cada uma:
  - **Ícone da Faixa:** Emoji/SVG colorido (branca=⚪, bordô=🟣, azul=🔵, etc)
  - **Nome da Faixa:** Exatamente como em `judo_belt_history.belt`
  - **Data:** "Conquistada em [DIA] de [MÊS] de [ANO]" (ex: "Conquistada em 15 de março de 2026")
  - **Tempo na Faixa:** "[X] dias/meses" (diferença entre esta faixa e próxima)
  - **Professor/Admin:** "por [Nome do Professor]" (de promoted_by_user_id)
  - **Observações:** Se `judo_belt_history.notes` não for vazio, exibe em texto menor/italic
  - **Exemplo completo:**
    ```
    ⚪ Branca
    Conquistada em 20 de janeiro de 2026
    Ficou 45 dias nessa faixa
    por Prof. João Silva
    "Desempenho excelente desde o início"
    ```

**Dado** que Aluno está em mobile
**QUANDO** visualiza timeline
**ENTÃO** layout:
  - Timeline é vertical (responsivo)
  - Itens empilham um após outro
  - Linha temporal visível à esquerda
  - Cards full-width com padding 16px
  - Fácil de scrollar

**Dado** que Aluno está em desktop
**QUANDO** viewport > 1200px
**ENTÃO** layout alternativo:
  - Timeline vertical no centro
  - Cards de faixa alternados (esquerda/direita)
  - Linha temporal conectando todos
  - Espaço visual mais generoso (32px entre items)

**Dado** que há estatísticas disponíveis
**QUANDO** timeline carrega
**ENTÃO** exibe seção "Suas Estatísticas" no topo:
  - Total de faixas conquistadas: "[N] faixas"
  - Tempo total praticando: "[X] anos/meses" (data_entrada até hoje, de users.data_entrada)
  - Faixa com maior duração: "[Nome] — [X] dias"
  - Progressão mensal: "[Última faixa conquistada há X dias]"

**Dado** que Aluno é federado (is_federated = true)
**QUANDO** visualiza histórico
**ENTÃO** exibe banner:
  - "🏅 Você está federado! Nº de registro: [federation_registration]"
  - Desde: "[federation_date formated]"
  - Posição: Topo da página, discreto mas visível

**Dado** que último item é a faixa atual
**QUANDO** renderiza
**ENTÃO** destaca-o com:
  - Ícone de "current" (⭐ ou highlight suave)
  - Background color ligeiramente diferente
  - Label "Sua faixa atual"
  - Se houver próxima meta definida: "Próximo passo: [requisitos]"

**Dado** que Aluno clica em uma faixa
**QUANDO** clica
**ENTÃO** expande para modal/card estendido mostrando:
  - Detalhes completos da faixa
  - Imagem/SVG da faixa em tamanho maior
  - Data exata de conquista (com hora, se disponível)
  - Quem promoveu (com possível link ao professor)
  - Notas/observações completas
  - Botão: "[Voltar]" ou fechar modal

**Dado** que há múltiplas faixas
**QUANDO** página renderiza
**ENTÃO** permite scroll suave
**E** navbar "fixa" mostra:
  - Título "Histórico de Faixas"
  - Progresso visual: "[N de M] faixas" com barra

**Dado** que há erro ao carregar histórico
**QUANDO** sistema falha ao buscar judo_belt_history
**ENTÃO** exibe skeleton loaders (animado)
**E** retry automático a cada 2 segundos
**E** timeout de 10 seg: "Erro ao carregar histórico. [Tentar Novamente]"

**Dado** que Aluno está offline
**QUANDO** página carrega
**ENTÃO** mostra dados cacheados de IndexedDB
**E** exibe ícone: "⏱ Histórico de [data última sync]"
**E** adiciona button: "[Sincronizar]" para atualizar quando online

**Dado** que há atualização no histórico (novo belt adicionado)
**QUANDO** dados são sincronizados
**ENTÃO** timeline atualiza automaticamente
**E** novo item entra com animação (slide-in)
**E** notificação: "Nova faixa adicionada! 🎉"

---

## 🗄️ Queries & Data Model

### Query Principal — Carregar Histórico:
```sql
SELECT 
  jbh.belt_history_id,
  jbh.belt,
  jbh.received_date,
  jbh.promoted_by_user_id,
  u.full_name AS promoted_by_name,
  jbh.notes,
  jp.current_belt,
  jp.belt_date AS current_belt_date,
  jp.is_federated,
  jp.federation_registration,
  jp.federation_date
FROM judo_belt_history jbh
LEFT JOIN users u ON jbh.promoted_by_user_id = u.user_id
INNER JOIN judo_profile jp ON jbh.student_id = jp.student_id
WHERE jbh.student_id = $1 
  AND jbh.academy_id = $2
ORDER BY jbh.received_date ASC;
```

### Query — Estatísticas:
```sql
SELECT 
  COUNT(jbh.belt_history_id) AS total_belts,
  MIN(jbh.received_date) AS first_belt_date,
  MAX(jbh.received_date) AS last_belt_date,
  EXTRACT(DAY FROM (MAX(jbh.received_date) - MIN(jbh.received_date))) AS days_total
FROM judo_belt_history jbh
WHERE jbh.student_id = $1 
  AND jbh.academy_id = $2;
```

### Query — Tempo por Faixa:
```sql
SELECT 
  jbh.belt,
  jbh.received_date,
  LEAD(jbh.received_date) OVER (ORDER BY jbh.received_date) AS next_date,
  EXTRACT(DAY FROM (LEAD(jbh.received_date) OVER (ORDER BY jbh.received_date) - jbh.received_date)) AS days_in_belt
FROM judo_belt_history jbh
WHERE jbh.student_id = $1 
  AND jbh.academy_id = $2
ORDER BY jbh.received_date ASC;
```

### Cache Layer (IndexedDB):
- Chave: `judo_belt_history:{student_id}`
- Estrutura: Array de objects com { belt, received_date, promoted_by_name, notes, ... }
- TTL: 24 horas
- Auto-sync: Sincroniza quando página carrega e detecta conectividade

---

## 🎨 Visual Design

### Color Palette por Faixa (Dinâmico):
```
branca          → #FFFFFF (white border + shadow)
branca_ponta_bordô → #8B1538 (burgundy)
bordô           → #A41E44 (maroon)
branca_ponta_cinza → #808080 (gray)
cinza           → #A9A9A9 (dark gray)
cinza_ponta_azul → #4169E1 (royal blue)
azul            → #0000FF (blue)
azul_ponta_amarela → #FFD700 (gold edge)
amarela         → #FFFF00 (yellow)
amarela_ponta_laranja → #FF8C00 (orange edge)
laranja         → #FFA500 (orange)
verde           → #00AA00 (green)
roxa            → #800080 (purple)
marrom          → #8B4513 (brown)
preta           → #000000 (black)
coral           → #FF7F50 (coral red)
vermelha        → #FF0000 (red)
```

### Layout Structure:
- **Mobile:** Single column, full-width cards, left-aligned timeline
- **Tablet:** Single column with more padding, centered timeline
- **Desktop:** Alternating left-right layout with generous spacing
- **Spacing:** 16px M (mobile), 24px L (tablet), 32px XL (desktop)

### Typography:
- Heading: H1 32px bold (mobile: 24px)
- Faixa Nome: H3 20px bold
- Data: Body 14px regular
- Observações: Body 12px italic, lighter gray
- Estatísticas: Caption 12px secondary

---

## 🔌 Integração com Story 4.1

- Story 4.1 "Card 4 — Histórico" tem link: "[Ver histórico de faixas]"
- Link aponta para esta página (Story 4.8)
- Dados são sincronizados (judo_profile + judo_belt_history)
- Cache compartilhado entre Story 4.1 e 4.8

---

## ✅ Referências FR

- **FR37:** Student Profile completo
- **FR39:** Histórico de Progressão de Aluno
- **FR35:** Badges & Milestones (judo belt is major milestone)

---

## 🔧 Technical Notes

### State Management:
- Redux slice: `studentProgress.beltHistory`
- Selectors: `selectBeltHistory(studentId)`, `selectBeltStats(studentId)`

### Queries Performance:
- Índice necessário: `idx_judo_belt_history_student DESC` (para ORDER BY received_date)
- Resultado: Rápido para até 50+ faixas (não há limite prático)

### Edge Cases:
1. **Sem faixas no histórico**: Exibir placeholder motivacional
2. **Faixa com notas grandes**: Truncar com "Ver mais" expandível
3. **Professor deletado**: Exibir "[Professor antigas]" ou ID
4. **Data inválida**: Fallback para "Data desconhecida"
5. **Offline**: Mostrar cache com timestamp de sincronização

### Offline Sync:
- Quando usuário fica online, refetch automático via API
- Merge strategy: Server-authoritative (servidor é verdade)
- Notificação se houver mudanças desde último cache

---

## 📊 Changelog

**2026-03-20 — Criação (Judo Profile Update)**
- Criada Story 4.8 dedicada ao histórico de faixas
- Integrada com judo_profile e judo_belt_history
- Adicionadas queries SQL específicas
- Design completamente responsivo
- Cache e offline-first integrados
