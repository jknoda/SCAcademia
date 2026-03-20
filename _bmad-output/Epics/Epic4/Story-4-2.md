Story 4.2: Card 1 Expandido — Gráfico de Evolução Temporal
Como um Aluno,
Quero ver minha evolução em gráfico ao longo do tempo,
Para que eu visualize tendência (está melhorando ou piorando?).

**Critérios de Aceitação:**

**Dado** que Aluno clica "[Ver detalhes]" no Card 1 (Evolução)
**Quando** clica
**Então** abre modal/página com título: "Sua Evolução"
**E** exibe gráfico de linhas (SVG responsivo)

**Dado** que o gráfico é renderizado
**Quando** carrega
**Então** mostra:
  - X-axis: Semanas (últimas 12 semanas ou 3 meses)
    → "Sem 1", "Sem 2", "Sem 3", "Sem 4"
  - Y-axis: % proficiência (0-100)
  - Linha: Orange (#FF6B35) trending up
  - Pontos: círculos pequenos 4px
  - Data label on hover: "Semana 2: 52%"

**Dado** que gráfico está exibido
**Quando** Aluno vê
**Então** linha conecta: Sem1: 45% → Sem2: 52% → Sem3: 60% → Sem4: 68%
**E** interpretação em português: "Você está crescendo! 🎉"
**E** velocidade: "+23% em 4 semanas"

**Dado** que Aluno está em mobile
**Quando** gráfico renderiza
**Então** SVG é responsivo (não overflow em X)
**E** toque em ponto: exibe tooltip com valor

**Dado** que há dados insuficientes (< 2 semanas)
**Quando** sistema detecta
**Então** exibe: "Ainda não há dados suficientes para análise"
**E** começa a acumular após 2ª semana

**Dado** que Aluno quer comparar com semana anterior
**Quando** clica "[Semana anterior]"
**Então** gráfico atualiza mostrando período anterior
**E** transição suave (não jump brusco)

**Dado** que Aluno observa a tendência
**Quando** está vendo
**Então** consegue responder: "Estou progredindo? SIM/NÃO"
**E** sensação é clara (verde/trending up = bom, vermelho/trending down = preocupe)

**Dado** que há semana com valor menor que anterior
**Quando** gráfico renderiza
**Então** ponto é vermelho (warning) em vez de orange
**E** Aluno vê: "Ó, teve uma queda. Bora retomar?"