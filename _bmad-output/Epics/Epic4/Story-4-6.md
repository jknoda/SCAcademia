Story 4.6: Comparação Mês-a-Mês — Tendência Motivadora
Como um Aluno,
Quero ver como meu progresso mudou entre meses,
Para que eu veja se estou melhorando (ou não) consistentemente.

**Critérios de Aceitação:**

**Dado** que Aluno acessa seção "Comparação Mês-a-Mês"
**Quando** carrega
**Então** exibe:
  - Seleção de mês: "Março 2026" vs "Fevereiro 2026"
  - Cards side-by-side mostrando comparativo

**Dado** que comparativo é exibido
**Quando** renderiza
**Então** mostra quadro:

  **MARÇO (Mês Atual)**
  - Frequência: 16/20 (80%)
  - Técnicas praticadas: 12 diferentes
  - Comentários: 5 positivos
  - Evolução: +12%

  **FEVEREIRO (Mês Anterior)**
  - Frequência: 14/20 (70%)
  - Técnicas praticadas: 8 diferentes
  - Comentários: 3 positivos
  - Evolução: +5%

  **COMPARAÇÃO:**
  - Frequência: ↑ +10% (verde, seta para cima)
  - Técnicas: ↑ +50% (verde, seta para cima)
  - Comentários: ↑ +67% (verde, seta para cima)
  - Evolução: ↑ +240% (verde, seta para cima)

**Dado** que Aluno vê tendência positiva
**Quando** visualiza
**Então** explicitamente exibe:
  - Mensagem: "🎉 Você MELHOROU em TODOS os aspectos!"
  - Emocional: "Excelente progresso! Continua assim!"

**Dado** que Aluno vê tendência negativa em alguma métrica
**Quando** visualiza
**Então** exibe:
  - Mensagem: "⚠️ Frequência caiu este mês"
  - Recomendação: "Agende mais aulas! Próxima: [data]"

**Dado** que Aluno quer histórico completo
**Quando** clica "[Ver últimos 6 meses]"
**Então** exibe gráfico linha mostrando tendência ao longo de 6 meses
**E** cada ponto = mediana da métrica do mês

**Dado** que Aluno está em seu primeiro mês
**Quando** sistema detecta
**Então** não exibe comparação (não tem dados anteriores)
**E** mostra: "Você está no início! Continue treinando para ver evolução mês-a-mês"