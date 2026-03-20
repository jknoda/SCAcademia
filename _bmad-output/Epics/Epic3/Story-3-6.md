Story 3.6: Sucesso & Continuidade — Próxima Aula
Como um Professor que acabou de registrar,
Quero options para continuar meu fluxo,
Para que eu trabalhe eficientemente na próxima aula ou finalize o dia.

**Critérios de Aceitação:**

**Dado** que a tela de sucesso (6) é exibida
**Quando** renderiza
**Então** mostra:
  - Ícone grande: ✅
  - Título: "REGISTRADO COM SUCESSO!"
  - Timestamp: "Aula salva às 16:47 de hoje"
  - Feedback: "Alunos foram notificados ✓"
  - 3 segundos depois, levemente destacam dois CTAs:

**Dado** que 3 segundos passam
**Quando** CTAs são destacados
**Então** exibe dois botões:
  - Botão azul: "Voltar ao Painel"
  - Botão verde: "Registrar Próxima Aula"

**Dado** que Professor clica "Registrar Próxima Aula"
**Quando** transição ocorre
**Então** reinicia fluxo (Story 3.1)
**E** se tem próxima aula agendada: pré-seleciona aquela turma
**E** se não: exibe seletor de turmas

**Dado** que Professor clica "Voltar ao Painel"
**Quando** navegação ocorre
**Então** retorna ao dashboard do professor
**E** exibe: "Últimos 3 treinos registrados" no topo
**E** lista mostra: data, turma, número de alunos, técnicas (preview)

**Dado** que Professor está cansado após múltiplas aulas
**Quando** clica "Voltar ao Painel" e depois "Sair"
**Então** logout ocorre normalmente
**E** dados foram salvos (não há risk de perda)

**Dado** que a tela de sucesso está exibida há 1 minuto
**Quando** nenhuma ação é tomada
**Então** auto-redirect para dashboard (não forced, mas gradual)
**E** pagina exibe: "Redirecionando em 5... 4... 3..." (permite interromper)