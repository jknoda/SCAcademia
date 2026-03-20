Story 3.5: Revisar & Confirmar Registro
Como um Professor,
Quero revisar todos os dados antes de confirmar,
Para que eu tenha certeza de que tudo está correto.

**Critérios de Aceitação:**

**Dado** que Professor completa todas as telas (frequência, técnicas, notas)
**Quando** clica "Próximo" na tela de notas
**Então** exibição: "Revisar Registro de Aula"
**E** tela 5 mostra resumo visual

**Dado** que resumo é exibido
**Quando** carrega
**Então** quadro com informações:

📍 Terça-feira | Judô Iniciante (15:00-16:30)

👥 Frequência
├─ Presentes: 18/20
└─ Ausentes: João Silva, Maria Costa

🥋 Técnicas Praticadas
├─ Osoto Gari
└─ Seoi Nage

📝 Observações
"Aula muito produtiva. Grupo focado."

**E** layout visual, fácil de ler

**Dado** que Professor quer corrigir algo
**Quando** clica em "← Voltar para editar"
**Então** volta para tela anterior (ex: frequência)
**E** dados não são perdidos
**E** consegue corrigir e voltar a "Revisar"

**Dado** que tudo está correto
**Quando** clica "CONFIRMAR & SALVAR" (botão grande, azul)
**Então** sistema valida tudo:
- Tem alunos marcados? SIM
- Tem técnicas? SIM
- Timestamp válido? SIM

**Dado** que validação passa
**Quando** "CONFIRMAR" é clicado
**Então** sistema:
1. Desiabilita botão (previne duplo clique)
2. Exibe loader suave: "Salvando..."
3. Envia dados ao servidor
4. Registra em tabela: trainings + training_attendance + performance_notes
5. Timestamp de criação é registrado
6. Espera confirmação do servidor (< 2 seg esperado)

**Dado** que salvamento foi bem-sucedido
**Quando** servidor retorna 200 OK
**Então** exibe tela 6 (Sucesso): "✅ REGISTRADO COM SUCESSO!"
**E** exibe: "Aula salva às 16:47 de hoje"
**E** "Alunos foram notificados ✓"

**Dado** que houve erro ao salvar
**Quando** servidor retorna erro (500, timeout, etc)
**Então** exibe: "Erro ao salvar. Recarregando..."
**E** tenta novamente automaticamente (3 tentativas)
**E** se persistir: "Erro ao salvar. Dados estão seguros localmente. [Tentar Novamente] [Contatar Suporte]"

**Dado** que está offline e Professor confirma
**Quando** sistema detecta sem conexão
**Então** salva em IndexedDB (sync_queue)
**E** exibe: "⏱ Seu registro foi salvo localmente. Será sincronizado quando conectar"
**E** botão: "[Conectar Agora]" ou "[Continuar Offline]"