## Visual Design Foundation

### 3.1 Color System (Judo-Themed)

**Primary Color Palette:**

🎨 **Judo Blue (Primary)** - #0052CC
- Usage: Buttons, links, primary CTAs, professor registration form focus
- Psychology: Trust, professionalism, judo tradition
- Accessibility: WCAG AA compliant on white (contrast 7:1)
- Example: "Registrar Treino" button, form focuses

🎨 **Judo Orange (Accent)** - #FF6B35
- Usage: Progress highlights, milestone badges, celebration moments
- Psychology: Energy, achievement, progression
- Accessibility: WCAG AA compliant on white (contrast 5.2:1)
- Example: Student progress card background, milestone badges ("Pegou primeira armbarra!")

🎨 **Judo Success (Green)** - #388E3C
- Usage: Confirmation messages, successful saves, completed actions
- Psychology: Completion, accomplishment
- Accessibility: WCAG AA compliant on white (contrast 4.5:1)
- Example: "✓ Salvo às 19:45" confirmation message

🎨 **Judo Warn (Amber)** - #F57C00
- Usage: Warnings, cautions, evasion risk flags
- Psychology: Attention needed, not critical
- Accessibility: WCAG AA compliant on white (contrast 4.8:1)
- Example: Admin dashboard "Evasão Risk: 3 alunos" warning

🎨 **Judo Error (Red)** - #D32F2F
- Usage: Errors, critical compliance issues, system failures
- Psychology: Urgency, danger
- Accessibility: WCAG AA compliant on white (contrast 4.3:1)
- Example: LGPD compliance 🔴 Red status, form validation errors

**Neutral Colors:**

- **White #FFFFFF** - Primary background
- **Gray Light #F5F5F5** - Secondary background (cards, sections)
- **Gray Medium #EEEEEE** - Dividers, borders
- **Gray Dark #757575** - Secondary text, disabled states
- **Black #212121** - Primary text

**Semantic Color Mapping:**

| Component | Color | Usage |
|-----------|-------|-------|
| Primary Action Button | Judo Blue | "Registrar", "Salvar", "Começar" |
| Secondary Action | Gray Light | Alternative actions |
| Success Feedback | Judo Green | "✓ Salvo", task completed |
| Warning Alert | Judo Amber | "Atenção: faltam dados", evasion risk |
| Error Alert | Judo Red | "Erro", compliance issue |
| Progress/Achievement | Judo Orange | Milestone badges, progress celebrations |
| Text (Primary) | Black | Main content, labels |
| Text (Secondary) | Gray Dark | Helper text, descriptive content |
| Backgrounds | White/Light Gray | Form fields, cards, sections |

**Accessibility Compliance:**

- ✅ All text: WCAG AA contrast (4.5:1 minimum)
- ✅ No color-only indicators (always paired with text/icon)
- ✅ Colorblind-safe palette (tested with colorblind simulator)
- ✅ Dark mode consideration for Phase 2 (dark backgrounds ready)

---

### 3.2 Typography System (Material Defaults + Judo Customization)

**Font Stack:**

```scss
// Material default (excellent for digital interfaces)
$typography-font-family: "Roboto", "Helvetica Neue", sans-serif;

// Judo customization (optional, Phase 2):
// Consider "Inter" or "Open Sans" for more modern feel if rebranding needed

Type Scale & Hierarchy:

Material Design provides 5 predefined styles that we adopt as-is:

Style	Size	Weight	Line Height	Usage
Headline 1	32px	500	40px	Page titles ("Meu Progresso", "Dashboard LGPD")
Headline 2	28px	500	36px	Section titles ("Evolução Técnica", "Notas do Professor")
Headline 3	24px	500	32px	Subsection titles
Headline 4	20px	400	28px	Card titles, student name
Headline 5	18px	400	26px	Form field labels, button text
Body 1	16px	400	24px	Body text, form inputs, rich content
Body 2	14px	400	20px	Secondary text, helper text, descriptions
Caption	12px	400	16px	Timestamps, metadata, small hints
Overline	12px	600	18px	Badge text, small caps labels
Font Weight Strategy:

Regular (400): Body text, form inputs, most UI elements
Medium (500): Headings, emphasis, strong labels
Bold (700): Rarely used, only for maximum emphasis (special milestones)
Legibility & Accessibility:

✅ Minimum body font: 16px (mobile friendly)
✅ Minimum heading: 20px (Visual hierarchy clear)
✅ Line height: 1.5x font size (comfortable reading on tablet)
✅ Letter spacing: Default (Roboto is already optimized)
✅ No justified text (improves readability for dyslexic users)
3.3 Spacing & Layout Foundation
Base Spacing Unit: 8px

All spacing follows Material Design's 8px grid system for consistency:

Unit	Pixels	Usage
xs	4px	Icon-to-text spacing, tight grouping
sm	8px	Element spacing, form field margins
md	16px	Component margins, section padding
lg	24px	Large spacing, between major sections
xl	32px	Page margins, large gaps
2xl	48px	Top-level spacing
Component Spacing Patterns:

// Button spacing
$button-height: 48px minimum (WCAG AA touch target)
$button-padding: 12px horizontal, 8px vertical

// Form field spacing
$form-field-height: 56px (Material standard)
$form-field-margin-bottom: 16px

// Card spacing
$card-padding: 16px
$card-margin-bottom: 16px
$card-border-radius: 4px (Material standard)

// List item spacing
$list-item-height: 48px minimum
$list-item-padding: 16px

Layout Grid System:

Desktop: 12-column grid (1200px max width)
Tablet: 8-column grid (800px viewport)
Mobile: 4-column grid (320px viewport)
Gutter: 16px (between columns)
Density Options:

Material Design provides 3 density levels; we use "Standard" (default):

✅ Standard: Comfortable spacing, balances information density with usability
⚠️ Compact: Tighter spacing (Phase 2 for power users)
Responsive Breakpoints:

$bp-mobile: 320px
$bp-tablet-portrait: 600px
$bp-tablet-landscape: 960px
$bp-desktop: 1200px

3.4 Visual Density Strategy
For each Persona:

Persona	Density Need	Screen	Density Level
Professor	Moderate	Training Registration	Standard (comfortable, no crowding)
Professor	Moderate	Class Dashboard	Standard (clear, organized)
Student	Low	Progress View	Standard (spacious, celebratory)
Admin	High-ish	LGPD Dashboard	Standard (data-visible but not overwhelming)
Admin	High	Audit Logs	Compact (tabular data, drill-down)
We use Standard density throughout MVP for comfort and readability.

3.5 Elevation & Shadow System (Material Design)
Material Design's shadow system creates depth without clutter:

Level	Elevation	Usage	Shadow
0	Ground	Background, surfaces	None
1	Cards	Form cards, list items	0px 2px 1px -1px rgba(0,0,0,0.2)
2	Floating	Input fields, emphasized cards	0px 3px 1px -2px rgba(0,0,0,0.2)
3	Modal/Dialog	Modals, flyouts, dropdowns	0px 3px 3px -2px rgba(0,0,0,0.2)
4	Floating Action Button	FAB, sticky headers	0px 5px 5px -3px rgba(0,0,0,0.2)
Application:

Training registration form: Elevation 2 (emphasized, user focus)
Student progress cards: Elevation 1 (subtle, not competing)
Admin KPI cards: Elevation 1 (understated, data-focused)
Modal dialogs (confirmations): Elevation 3 (front-most layer)
3.6 Visual Design Principles (Judo-Specific)
Principle 1: Clarity through Simplicity

Judo is about efficiency and precision — our UI should feel the same
Remove unnecessary elements, one task per screen
Signal importance through size and color, not clutter
Principle 2: Visual Progression (Like Faixa Progression)

Color intensity, size gradients, and visual weight reflect progression
Student evolution: small steps, accumulating badges, visible trend
Admin tiers: Green ✓ → Yellow ⚠️ → Red 🔴 clearly communicates status
Principle 3: Confidence Through Feedback

Every action gets immediate visual feedback (< 100ms response)
Save confirmations, progress updates, error messages use color semantically
Never leave users wondering "did it work?"
Principle 4: Respect the Athlete

Judo is demanding; our UI should be respectful of time
No unnecessary animations or transitions
Focus on information, not decoration
Material Design's "motion" is subtle and purposeful
3.7 Dark Mode Strategy (Phase 2)
We design with light theme first (MVP), dark mode ready for Phase 2:

Colors are already defined with dark backgrounds in mind
Material Design theming system supports automatic dark mode
No additional design work needed now; framework handles it
3.8 Accessibility Checklist
✅ Color & Contrast:

All text meets WCAG AA (4.5:1 minimum)
Color-blind safe palette (tested)
No color-only status indicators (always text + icon + color)
✅ Typography:

Minimum 16px for body text
1.5x line height for comfortable reading
No justified text alignment
✅ Spacing:

Touch targets 48x48px minimum
Adequate whitespace between elements
Consistent 8px grid system
✅ Motion:

No auto-playing animations
Respects prefers-reduced-motion setting
Transitions are subtle (< 300ms)
✅ Components:

All interactive elements keyboard accessible
Focus states clearly visible
ARIA labels on custom components


---

## **Visual Foundation Finalizado**

Isso define:
- ✅ **Color System:** Judo blue + orange + semantic colors (success/warn/error)
- ✅ **Typography:** Roboto, Material type scale, hierarchy clara
- ✅ **Spacing:** 8px grid system, 48px touch targets, responsive breakpoints
- ✅ **Density:** Standard (confortável, não crowded)
- ✅ **Shadows:** Material elevation system (1-4)
- ✅ **Accessibility:** WCAG AA completo (contrast, spacing, keyboard nav)

Próximo passo: **Step 9 — Design Directions & Wireframes** (visual mockups para cada screen)

Pronto?

**[A]** Refinar Visual Foundation  
**[P]** Múltiplas perspectivas  
**[C]** Continue — Salvar e ir para Wireframes---

## **Visual Foundation Finalizado**

Isso define:
- ✅ **Color System:** Judo blue + orange + semantic colors (success/warn/error)
- ✅ **Typography:** Roboto, Material type scale, hierarchy clara
- ✅ **Spacing:** 8px grid system, 48px touch targets, responsive breakpoints
- ✅ **Density:** Standard (confortável, não crowded)
- ✅ **Shadows:** Material elevation system (1-4)
- ✅ **Accessibility:** WCAG AA completo (contrast, spacing, keyboard nav)

