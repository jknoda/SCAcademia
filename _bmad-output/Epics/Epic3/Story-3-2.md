Story 3.2: Marcar Frequência — Toggle Rápido (Auto-Advance)
Como um Professor,
Quero marcar presença/ausência de cada aluno com 1 clique,
Para que o registro seja rápido (20 alunos em < 1 min).

**Critérios de Aceitação:**

**Dado** que a tela de frequência está exibida
**Quando** o sistema renderiza
**Então** exibe lista de alunos com:
  - Checkbox/Toggle 48x24px (tamanho toque)
  - Nome + Faixa (ex: "Ana Silva - Faixa Branca")
  - Status visual: [☐ AUSENTE] ou [✓ PRESENTE]

**Dado** que Professor toca no toggle de um aluno
**Quando** a ação ocorre
**Então** toggle muda:
  - ☐ → ✓ (muda cor para azul Judo)
  - ✓ → ☐ (volta para cinza)
**E** feedback visual: piscada suave, sem som (está em aula)

**Dado** que tela exibe 5+ alunos
**Quando** a lista oferece scroll
**Então** scroll é suave (não salto brusco)
**E** próximos alunos aparecem conforme scrolla

**Dado** que Professor marca todos os alunos
**Quando** termina frequência
**Então** sistema mostra: "18 presentes de 20"
**E** botão "Próximo: Técnicas →" se torna destaque (Azul Judo, 48px)

**Dado** que Professor marca menos alunos
**Quando** tenta avançar para próxima tela
**Então** valida: "tem pelo menos 1 presente selecionado?"
**E** se sim, permite avançar
**E** se não, exibe: "Selecione pelo menos 1 aluno" (em vermelho suave)

**Dado** que Professor quer corrigir frequência
**Quando** clica em "← Voltar"
**Então** volta para tela anterior
**E** dados de frequência NÃO são perdidos (em memória/IndexedDB)
**E** consegue corrigir e avançar novamente

**Dado** que Professor clica por acidente em toggle errado
**Quando** toca novamente em 1 segundo
**Então** sistema oferece "↶ Desfazer" (1 seg de graça)
**E** se desfaz a última ação sem perder fluxo

**Dado** que hay conexão offline
**Quando** Professor marca frequência
**Então** funciona normal (dados salvos em IndexedDB)
**E** ícone discreto: "⏱ Sincronizará quando conectar"
**E** sem pop-up assustador