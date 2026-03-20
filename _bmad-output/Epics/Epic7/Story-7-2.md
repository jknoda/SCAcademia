Story 7.2: WCAG 2.1 AA Accessibility Compliance
Como Usuário com deficiência visual/motora,
Quero poder navegar e usar toda funcionalidade do aplicativo com teclado + screen reader,
Para que o aplicativo seja inclusivo e acessível.

Acceptance Criteria:

Given que sou usuário com deficiência visual usando screen reader (NVDA/JAWS)
When navego pela aplicação
Then todos elementos de conteúdo devem ter aria-labels apropriados
And página deve ter heading hierarchy válida (h1, h2, h3 em ordem)
And landmarks devem existir: <nav>, <main>, <aside>, <footer>

Given que sou usuário motor usando apenas teclado
When navego sem mouse
Then toda interação deve funcionar com Tab + Enter/Space
And focus deve ser visível (outline: 3px solid #0052CC)
And focus order deve seguir fluxo lógico (não caótico)
And modal dialogs devem trappear focus (não sair do modal)

Given que visualizo aplicativo com baixa visão (200% zoom + high contrast)
When acesso qualquer página
Then layout deve ser responsivo (não horizontal scroll)
And texto deve ser legível (min 14px, line-height 1.5)
And cores não devem ser único indicador de informação (ex: usar icons + cores)

Given que sou usuário daltônico (protanopia)
When visualizo gráficos/dashboard
Then cores devem ter contrast ratio ≥ 4.5:1 para texto, ≥ 3:1 para elementos UI
And legendas de gráficos devem ser com patterns (not just colors)

Given que uso aplicativo em desktop
When interajo com formulários
Then cada input deve ter <label> explícito (não só placeholder)
And error messages devem estar associadas ao input (aria-describedby)
And required fields devem ter aria-required="true"

Given que rodo axe-core automated accessibility audit
When scan completa
Then ZERO violations críticas (critical/serious - deve falhar CI)
And < 5 warnings (minor accessibility issues)
And 100% compliance score no dashboard

Technical Notes:

Use axe-core em testes E2E (critiality: critical, serious only)
Implement in Cypress/Playwright: axe.check() para cada página
Manual testing com NVDA (Windows) + VoiceOver (Mac)
Color contrast checker: Stark plugin
Keyboard-only testing: disable mouse for 1 hour sessions
Referência FR: NFR10 (WCAG 2.1 AA compliance), NFR15 (Accessibility testing)

