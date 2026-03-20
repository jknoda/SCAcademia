Story 4.4: Card 3 Expandido — Timeline de Comentários do Professor
Como um Aluno,
Quero ler todos os comentários que o Professor deixou sobre mim,
Para que eu entenda o que preciso melhorar.

**Critérios de Aceitação:**

**Dado** que Aluno clica "[Ver todos comentários]" no Card 3
**Quando** clica
**Então** abre modal/página: "Comentários do Professor"
**E** exibe timeline de comentários mais recentes first

**Dado** que timeline carrega
**Quando** renderiza
**Então** cada comentário mostra:
  - Data: "19 Mar 2026 - 15:47"
  - Professor: Avatar + Nome "Prof. João"
  - Texto: Comentário completo (até 500 chars)
  - Técnicas mencionadas: (se houver, em tags)
    → Ex: "#OsotoGari #Progresso"

**Dado** que há múltiplos comentários da mesma data
**Quando** renderiza
**Então** agrupa por data (collapse/expand de dia)
**E** ordem descendente (mais recentes no topo)

**Dado** que comentário é positivo
**Quando** exibe
**Então** ícone: 🟢 (verde success)
**E** fundo suave verde (#E8F5E9)

**Dado** que comentário tem feedback neutro/construtivo
**Quando** exibe
**Então** ícone: 🔵 (azul info)
**E** fundo suave azul (#E3F2FD)

**Dado** que há 0 comentários
**Quando** página carrega
**Então** exibe: "Nenhum comentário ainda!"
**E** "Continua treinando e em breve receberá feedback"
**E** botão: "[Agendar Conversa com Professor]"

**Dado** que Aluno quer responder a comentário
**Quando** clica "[Responder]"
**Então** campo de texto aparece
**E** Aluno escreve mensagem ao professor
**E** (NOTA: Messaging fora do escopo MVP, Phase 2)

**Dado** que Aluno busca comentário específico
**Quando** usa search: "Osoto Gari"
**Então** filtra: mostra apenas comentários com "Osoto Gari"
**E** termo é destacado (bold/color)

**Dado** que Aluno quer compartilhar comentário positivo
**Quando** clica "[Compartilhar]"
**Então** cria link/screenshot para enviar via WhatsApp/Email
**E** template: "Prof. João disse: [comentário]"