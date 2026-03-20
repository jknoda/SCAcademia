Story 3.3: Adicionar Técnicas — Conversacional Dropdown
Como um Professor,
Quero selecionar técnicas que foram praticadas na aula,
Para que o aluno saiba exatamente o que foi trabalhado.

**Critérios de Aceitação:**

**Dado** que a tela de técnicas é exibida
**Quando** renderiza
**Então** exibe:
  - Pergunta: "Que técnicas foram praticadas?"
  - Nota: "(Selecione uma ou mais)"
  - Lista de checkboxes com técnicas de judô:
    ☐ Osoto Gari (Dropo Grande)
    ☐ Ouchi Gari (Dropo Interior)
    ☐ Seoi Nage (Projeção)
    ☐ Armlock (Técnica Braço)
    [+Mostrar todas 30...]

**Dado** que lista tem 30+ técnicas
**Quando** por padrão exibe apenas 4 mais comuns
**Então** agrupa: "Técnicas Básicas" (expandido) vs "Técnicas Avançadas" (colapsado)
**E** click em [+Mostrar todas] expande lista completa

**Dado** que Professor clica em checkbox de técnica
**Quando** a ação ocorre
**Então** checkbox muda: ☐ → ✓
**E** técnica é selecionada (cor azul)
**E** nenhum auto-advance (Professor seleciona múltiplas)

**Dado** que Professor selecionou 2+ técnicas
**Quando** tela renderiza
**Então** exibe resumo: "✓ Osoto Gari, ✓ Seoi Nage - 2 técnicas selecionadas"
**E** contador em destaque

**Dado** que Professor tenta avançar sem técnicas
**Quando** clica "Próximo"
**Então** valida: "Selecione pelo menos 1 técnica"
**E** se não: exibe erro suave "Selecione uma técnica antes de continuar"

**Dado** que Professor quer adicionar técnica não em lista
**Quando** scroll para fim e clica "[+Adicionar outra]"
**Então** campo de texto aparece: "Digite a técnica"
**E** autocomplete com sugestões existentes
**E** se não encontra, permite criar nova (admin revisa depois)

**Dado** que técnicas costumeiras são sempre iguais
**Quando** Professor clica "💾 Salvar como favorito"
**Então** sistema salva conjunto: "Favorito: Treino Básico" = [Osoto, Seoi, Guard]
**E** próxima aula exibe: "🔄 Usar favorito 'Treino Básico'?"
**E** pré-seleciona todas as técnicas

**Dado** que Professor quer remover técnica já selecionada
**Quando** clica em ✓ novamente
**Então** desseleciona sem confirmar (toggle simples)