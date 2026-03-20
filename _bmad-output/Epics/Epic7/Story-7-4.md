Story 7.4: Keyboard Navigation & Screen Reader Support
Como Usuário com deficiência motora,
Quero navegar e operar aplicação 100% com teclado sem mouse,
Para que ter experiência completa sem adaptações especiais.

Acceptance Criteria:

Given que desabilito mouse completamente (bloqueie via OS)
When navego aplicação usando Tab/Shift+Tab/Arrow keys/Enter
Then NENHUMA funcionalidade deve ser inacessível
And skip links devem permitir pular para <main> (Tab na header)
And toda interação deve funcionar (forms, dropdowns, modals, etc)

Given que uso dropdown/select
When pressionoDrop Down arrow key
Then lista deve abrir
And Arrow Down/Up navega items
And Enter seleciona item
And Escape fecha dropdown sem seleção
And typing letra autocompleta para item (ex: 'T' pula para "Técnica")

Given que uso datepicker
When Tab entra em datepicker, então arrow keys
Then dias devem ser navegáveis com arrow keys
And PageUp/PageDown mudam mês
And Alt+ArrowUp mudam ano
And Enter seleciona data

Given que foco está em botão dentro modal
When Tab pressionado
Then foco NÃO deve sair do modal (trap focus)
And quando último item no modal, Tab deve ir para primeiro item

Given que uso screen reader (JAWS/NVDA)
When navegando página
Then screen reader deve anunciar:

Página title ("Dashboard - SCAcademia")
Main landmarks ("main")
Headings hierarchy (H1, H2, etc)
Button labels ("Editar Aluno")
Form labels + required status
Aria-live regions para updates (ex: "Dados sincronizados")
Given que dynamic content atualiza (ex: badge unlock notification)
When usuário usa screen reader
Then deve anunciar mudança via aria-live="polite" + aria-label
And não deve interromper leitura (polite, not assertive)

Technical Notes:

Use polished testing workflow: keyboard-first dev (disable mouse during dev)
ARIA roles only cuando necesario (prefer semantic HTML)
Test com JAWS/NVDA + screen reader testing checklist
Implement ARIA landmarks em layout base
Use aria-live="polite" para async updates only
Referência FR: NFR10 (Accessibility - keyboard nav), NFR15 (Screen reader support)

