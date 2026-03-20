Story 4.5: Card 4 Expandido — Badges & Milestones
Como um Aluno,
Quero ver todos os badges (achievements) que desbloqueei,
Para que eu saiba que meu esforço foi reconhecido.

**Critérios de Aceitação:**

**Dado** que Aluno clica "[Ver todos badges]" no Card 4
**Quando** clica
**Então** abre página: "Seus Badges & Milestones"
**E** exibe grid de badges desbloqueados + próximos

**Dado** que página carrega
**Quando** renderiza
**Então** mostra:

  **BADGES DESBLOQUEADOS (Completos):**
  - 🥋 Faixa Branca (150h treino)
    → "Data desbloqueado: 01 Jan 2026"
    → Descrição: "Completou 150 horas de treino"
    → Compartilhável: "[Compartilhar Badge]"
  
  - 🏅 2 Semanas Sem Faltar
    → "Data desbloqueado: 15 Mar 2026"
    → Descrição: "Treinou 14 dias consecutivos"
  
  - 🎖️ Top Técnica: Osoto Gari
    → "Data desbloqueado: 10 Mar 2026"
    → Descrição: "Praticou 50+ vezes essa técnica"

  **PRÓXIMOS BADGES (Progresso Para Desbloquear):**
  - 🥋 Faixa Amarela (250h treino)
    → Progresso: 150/250h (60%)
    → Barra de progresso visual
    → "Faltam: 100 horas"
  
  - 🌟 Um Mês Sem Faltar
    → Progresso: 19/30 dias
    → "Faltam: 11 dias"

**Dado** que Aluno vê badge desbloqueado
**Quando** clica
**Então** exibe modal com detalhes:
  - Ícone grande
  - Descrição completa
  - Data de desbloqueio
  - Botão: "[Compartilhar no WhatsApp]" ou "[Copiar Link]"

**Dado** que Aluno quer compartilhar badge
**Quando** clica "[Compartilhar]"
**Então** cria mensagem template:
  - "🏅 Desbloqueei 'Faixa Amarela' em SCAcademia!"
  - "Treino 🥋 em [Academia]"
  - Link com QR code (optional)

**Dado** que progression bar está visível
**Quando** Aluno vê
**Então** UI deixa claro: "Você está a X% de desbloquear [Badge]"
**E** motivação: "Continue treinando!"

**Dado** que há 0 badges
**Quando** página carrega
**Então** exibe: "Comece a treinar para desbloquear badges! 🎯"
**E** mostra: "Primeiro badge: Faixa Branca em 150h"

**Dado** que Aluno clica em badge futuro
**Quando** mouse/toque
**Então** exibe tooltip: "Progresso: 60/150h - Faltam 90h"
**E** dica: "Treina 3x por semana para atingir em ~2 meses"