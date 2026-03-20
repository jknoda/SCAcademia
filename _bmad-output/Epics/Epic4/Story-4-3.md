Story 4.3: Card 2 Expandido — Histórico de Frequência Detalhado
Como um Aluno,
Quero ver todas as minhas presenças/ausências em detalhes,
Para que eu saiba quanto treino e quando tenho faltado.

**Critérios de Aceitação:**

**Dado** que Aluno clica "[Ver histórico]" no Card 2 (Frequência)
**Quando** clica
**Então** abre modal/página: "Seu Histórico de Frequência"
**E** exibe lista de últimas N aulas

**Dado** que página carrega
**Quando** renderiza
**Então** mostra tabela/lista:
  - Data | Turma | Status (✓ Presente / ✗ Ausente)
  - Exemplo:
    → "19 Mar" | "Judó Iniciante" | "✓ Presente"
    → "18 Mar" | "Judó Iniciante" | "✓ Presente"
    → "17 Mar" | "Judó Iniciante" | "✗ Ausente"

**Dado** que lista é longa (20+ aulas)
**Quando** renderiza
**Então** usa paginação (20 por página)
**E** ou scroll infinito com lazy loading

**Dado** que há ausência
**Quando** exibe
**Então** mostra: "✗ Ausente" em vermelho suave
**E** tooltip (opcional): "Razão: [Se informada pelo professor]"

**Dado** que há sequência de presenças
**Quando** Aluno vê
**Então** exibe badge: "🔥 5 aulas sem faltar!" (streak)
**E** contador de dias: "35 dias consecutivos" (se aplica)

**Dado** que Aluno quer filtrar por período
**Quando** clica "[Filtrar]"
**Então** abre picker: "De [data]" até "[data]"
**E** filtra a lista dinamicamente

**Dado** que Aluno quer exportar frequência
**Quando** clica "[Exportar]"
**Então** baixa CSV com histórico completo
**E** nome: "Frequencia_[Nome]_2026.csv"

**Dado** que Aluno vê frequência abaixo de 70%
**Quando** sistema detecta
**Então** exibe aviso amarelo: "⚠️ Sua frequência está abaixo de 70%"
**E** "Próximas 3 aulas são importantes para recuperação"