Story 3.1: Criar Treino — Entry Point Conversacional
Como um Professor,
Quero iniciar o registro de uma aula que acabei de dar,
Para que eu comece a capturar dados de forma rápida e conversacional.

**Critérios de Aceitação:**

**Dado** que um Professor faz login e acessa seu dashboard
**Quando** a página carrega
**Então** o sistema exibe: "Olá, Prof. [Nome]! 👋"
**E** mostra card destacado: "🎯 Vamos registrar sua aula de hoje?"

**Dado** que o Professor clica no card
**Quando** a ação é disparada
**Então** o sistema identifica: qual turma o professor estava dando aula
**E** se apenas 1 turma: procede direto
**E** se múltiplas turmas: exibe dropdown "Qual turma?" com opções

**Dado** que a turma é selecionada
**Quando** o sistema processa
**Então** busca no banco:
  - Alunos cadastrados para aquela turma
  - Treino anterior (para pré-carregar dados)
  - Técnicas usadas no último treino

**Dado** que dados são carregados
**Quando** a página renderiza
**Então** exibe tela conversacional:
  - Header: "📍 Terça-feira | Judô Iniciante | 15:00-16:30"
  - Ícone visual da turma
  - Texto: "Vamos registrar?"
  - Botão azul (Judo Blue): "Sim, registrar agora →"
  - Link secundário: "Talvez depois" ou "Próxima aula"

**Dado** que Professor clica "Registrar agora"
**Quando** transição ocorre
**Então** exibe tela 2 (frequência)
**E** auto-preenche alunos da turma (estado: AUSENTE por padrão)
**E** progressão visual: "1/5 - Frequência" no topo

**Dado** que o Professor tira o foco e quer voltar depois
**Quando** clica "Talvez depois"
**Então** exibe: "Sem problema! Você pode registrar mais tarde"
**E** volta ao dashboard
**E** o rascunho é salvo localmente (IndexedDB) para recuperação

**Dado** que o Professor quer pré-carregar data/hora manual
**Quando** clica em "Editar data/hora"
**Então** exibe picker: "Data do treino" + "Horário início" + "Horário fim"
**E** valores padrão: hoje, horário da turma
**E** Professor consegue mudar se treino foi em dia diferente

**Dado** que há erro ao carregar dados
**Quando** sistema falha buscando alunos
**Então** exibe: "Erro ao carregar turma. Recarregando..."
**E** tenta novamente (retry logic)
**E** se persistir: "Tente novamente ou contate suporte"