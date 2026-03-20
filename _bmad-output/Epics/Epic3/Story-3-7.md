Story 3.7: Histórico de Treinos — Listar & Editar Anteriores
Como um Professor,
Quero ver meus treinos anteriores e editar se necessário,
Para que eu corrija dados ou visualize o histórico.

**Critérios de Aceitação:**

**Dado** que Professor acessa "Minhas Aulas"
**Quando** página carrega
**Então** exibe lista de todos os treinos (paginados, 20 por página)
**E** ordem: mais recentes primeiro

**Dado** que lista é exibida
**Quando** renderiza
**Então** cada treino mostra:
  - Data + Hora: "19 Mar 2026 - 15:00"
  - Turma: "Judó Iniciante"
  - Alunos: "18/20 presentes"
  - Técnicas: "Osoto Gari, Seoi Nage"
  - Ações: "[Visualizar] [Editar] [Deletar]"

**Dado** que Professor clica "[Editar]"
**Quando** treino é aberto
**Então** exibe formulário de edição com dados:
  - Frequência (checkboxes ajustáveis)
  - Técnicas (seleção ajustável)
  - Notas (textarea ajustável)

**Dado** que Professor faz mudanças
**Quando** clica "Salvar Mudanças"
**Então** sistema registra:
  - Mudanças antes/depois no audit log
  - timestamp de modificação
  - modificado_por = logged_in_user

**Dado** que Professor quer deletar um treino (ex: errado)
**Quando** clica "[Deletar]"
**Então** exibe confirmação: "Tem certeza? Essa ação não pode ser desfeita"
**E** checkbox: "Entendo que isso deletará o registro"
**E** botão "Deletar Permanentemente" (só habilitado se checkbox marcado)

**Dado** que deletar é confirmado
**Quando** ação é processada
**Então** soft_delete (não hard delete)
**E** treino é marcado deleted=true
**E** mas audit log mostra para compliance: "Prof. João deletou treino de 19/Mar"

**Dado** que Professor quer filtrar treinos
**Quando** acessa filtros
**Então** consegue filtrar por:
  - Data range (de/até)
  - Turma específica
  - Palavra-chave em notas

**Dado** que Professor busca treino antigo
**Quando** aplica filtro "Turma = Judó Avançado"
**Então** lista exibe apenas treinos daquela turma
**E** busca leva < 200ms (indexado no banco)