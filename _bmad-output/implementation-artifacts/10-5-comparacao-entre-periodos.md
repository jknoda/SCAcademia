# Story 10.5: Comparação Entre Períodos

Status: done

## Story

Como usuário autorizado,
Quero comparar o desempenho do atleta entre períodos,
Para que eu consiga identificar evolução real e mudanças relevantes.

## Contexto de Negócio

- Esta story aumenta o valor analítico do painel.
- Deve ser implementada após a base histórica e o painel individual.
- O foco é permitir comparação simples, clara e confiável.

## Acceptance Criteria

### AC1 - Seleção de períodos comparáveis
- DADO que o usuário quer comparar evolução
- QUANDO selecionar dois períodos válidos
- ENTÃO o sistema deve calcular e apresentar a diferença entre eles.

### AC2 - Destaque de tendências
- DADO que houve melhora, piora ou estabilidade
- QUANDO a comparação for exibida
- ENTÃO a interface deve sinalizar a tendência de forma compreensível.

### AC3 - Coerência com os dados históricos
- DADO que o histórico existe
- QUANDO a comparação ocorrer
- ENTÃO os valores comparados devem refletir corretamente os registros armazenados.

### AC4 - Tratamento de dados incompletos
- DADO que alguns períodos não têm todas as métricas
- QUANDO a comparação for feita
- ENTÃO o sistema deve exibir ausência parcial de dados sem quebrar a experiência.

## Tasks / Subtasks

- [x] Implementar comparação backend entre janelas de tempo
- [x] Exibir diferenças percentuais ou qualitativas nas métricas principais
- [x] Adicionar componente visual de comparação no painel
- [x] Tratar casos com histórico incompleto
- [x] Adicionar testes de comparação e cálculos

## Dev Notes

### Métricas iniciais para comparação
- frequência
- presença em treinos
- avaliação técnica média
- evolução física resumida
- participação em competição quando disponível

### Dependências
- Stories 10.2, 10.3 e 10.4

## Dev Agent Record

### Implementação concluída
- adicionada comparação entre períodos no backend com janelas de 30 dias, 90 dias e histórico completo
- o painel individual agora exibe melhora, queda, estabilidade e dados parciais por métrica
- mantido o comportamento resiliente mesmo quando parte do histórico ainda não existe

### Validação
- backend: 8/8 testes da suíte athlete-progress aprovados
- frontend: 3/3 testes focados do painel aprovados
- builds de backend e frontend executados com sucesso
