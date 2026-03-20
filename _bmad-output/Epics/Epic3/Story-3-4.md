Story 3.4: Adicionar Anotações & Notas de Desempenho
Como um Professor,
Quero adicionar notas/observações sobre a aula,
Para que eu documente eventos importantes, evoluções ou dificuldades.

**Critérios de Aceitação:**

**Dado** que a tela de notas é exibida
**Quando** renderiza
**Então** exibe:
  - Pergunta: "Alguma observação sobre a aula?"
  - Nota: "(Opcional)"
  - Textarea grande e legível (20 linhas visíveis)
  - Placeholder em cinza: "Ex: João teve dificuldade em Osoto..."
  - Counter em cima: "0/400 caracteres"

**Dado** que Professor começa a digitar
**Quando** escreve notas
**Então** textarea expande automaticamente (não scroll interno)
**E** auto-save a cada 5 segundos (invisível, sem UI)
**E** ícone suave: "💾" pisca indicando salvamento local

**Dado** que Professor atinge 400 caracteres
**Quando** tenta digitar mais
**Então** sistema impede (max 400 chars)
**E** counter exibe em vermelho suave: "400/400 - Limite atingido"

**Dado** que Professor quer adicionar notas individuais por aluno
**Quando** clica em um aluno específico (ex: "Ana Silva")
**Então** expandsection: "Anotações para Ana"
**E** campo de nota específica para aquele aluno
**E** placeholder: "Ana melhorou muito em Osoto..."

**Dado** que Professor adicionou nota individual para Ana
**Quando** salva
**Então** nota é linkada: training.id + student_id + note_text
**E** aparece no dashboard do aluno depois: "Comentário de Prof. João: 'Ana melhorou...'"

**Dado** que Professor tira foco do textarea
**Quando** não digita por 10 segundos
**Então** auto-save local garante não perder dados
**E** se houver internet, sync em background

**Dado** que há muitos caracteres
**Quando** Professor quer contar palavras (não chars)
**Então** contador oferece toggle: "Caracteres | Palavras"