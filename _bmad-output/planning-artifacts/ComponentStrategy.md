## Component Strategy

### Design System Components (Angular Material - Already Available)

**Material Components We Use As-Is:**

✅ **Layout Components**
- `mat-sidenav` — Navigation sidebar
- `mat-toolbar` — Top header bar
- `mat-tab-group` — Tab navigation (bottom or side tabs)

✅ **Card Components**
- `mat-card` — Base card container (used for all content cards)
- `mat-card-header` — Card title sections
- `mat-card-content` — Card body content
- `mat-card-actions` — Card action buttons

✅ **Form Components**
- `mat-form-field` — Input wrapper
- `mat-input` — Text inputs
- `mat-select` — Dropdown selections
- `mat-checkbox` — Checkbox toggle
- `mat-radio-group` — Radio button groups

✅ **Button Components**
- `mat-button` — Standard buttons
- `mat-raised-button` — Elevated buttons (primary CTAs)
- `mat-icon-button` — Icon-only buttons

✅ **Data Display**
- `mat-table` — Data tables (admin audit logs)
- `mat-paginator` — Pagination for lists
- `mat-list` — List display

✅ **Dialog & Overlay**
- `mat-dialog` — Modal dialogs (confirmations)
- `mat-snack-bar` — Toast notifications

✅ **Visual Utilities**
- `mat-icon` — Material icons (2000+ available)
- `mat-badge` — Badge overlays (numbers, alerts)
- `mat-chip` — Chip/tag components
- `mat-progress-bar` — Progress indicators

**Coverage:** ~90% of standard UI needs covered by Material

---

### Custom Components (Designed for SCAcademia Specific Needs)

**Gap Analysis:**
Material provides the building blocks, but we need 4 custom components to support our specific journeys and design direction:

#### **Custom Component #1: TrainingCard**

**Purpose:** Display a registered training session with attendance and notes

**Used In:** Professor dashboard, training history

**Anatomy:**

┌─────────────────────────────────┐
│ [Icon] Class Name [Edit] │ ← Header: icon + title + action
├─────────────────────────────────┤
│ Date, Time | Attendance Count │ ← Meta info (gray, small)
├─────────────────────────────────┤
│ "Notes from professor..." │ ← Body: training notes
│ (truncated if long) │
├─────────────────────────────────┤
│ [Edit] [View Details] │ ← Actions
└─────────────────────────────────┘



**States:**
- Default: Normal card (elevation 1)
- Hover: Elevation increase (2), shadow grows
- Draft: Yellow border (not synced yet)
- Synced: Green checkmark indicator
- Error: Red border with error icon

**Variants:**
- Compact: Show only date + attendance (no notes)
- Expanded: Full details view

**Accessibility:**
- `role="article"`
- Card title is `h3` heading
- Actions use semantic button elements
- Keyboard nav: Tab through all interactive elements
- Screen reader: "Training card: Iniciantes on May 25, 14 of 15 students"

**Content Guidelines:**
- Class name max 50 chars
- Attendance: "X of Y" format
- Notes: 0-500 chars (auto-truncate to 2 lines)

**Implementation:**
```typescript
@Component({
  selector: 'app-training-card',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-icon>{{ iconName }}</mat-icon>
        <h3>{{ training.className }}</h3>
        <button mat-icon-button (click)="edit()">
          <mat-icon>edit</mat-icon>
        </button>
      </mat-card-header>
      <mat-card-content>
        <p>{{ training.date }} | {{ training.attendance }}</p>
        <p>{{ training.notes | slice:0:100 }}...</p>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button>Ver Detalhes</button>
      </mat-card-actions>
    </mat-card>
  `
})

Custom Component #2: ProgressCardSet
Purpose: Display student progress across multiple dimensions (evolution, frequency, notes, milestones)

Used In: Student dashboard

Anatomy:
Multiple vertically-stacked cards (each is Mat-Card):

Evolution Card — Line chart + trend
Frequency Card — Attendance % + streak
Notes Card — Recent professor feedback
Milestones Card — Achievements/badges
Each Card's Anatomy:

┌─────────────────────────────────┐
│ [Icon] Metric Name              │ ← Header
├─────────────────────────────────┤
│ [Metric display content]        │ ← Body (varies by card type)
├─────────────────────────────────┤
│ [Optional Action or Detail]     │ ← CTA or metadata
└─────────────────────────────────┘

Card Variants:

Evolution Card

Content: Small line chart (Chart.js integration)
Stat: "Score: 4 → 7 (75% improvement)"
CTA: "Ver Gráfico Completo"
Frequency Card

Content: Circular progress 87%
Stat: "14 de 16 treinos"
Badge: "🔥 4 weeks streak"
Notes Card

Content: List of 2-3 recent comments
Format: "May 25 | Quote"
CTA: "Ver Todas"
Milestones Card

Content: Grid of achievement badges
Format: Icon + Achievement name
Each badge: Clickable for detail
States:

Loading: Skeleton loaders (gray shimmer)
Loaded: Full content visible
Empty: "No data yet" message with illustration
Error: Error indicator with retry
Accessibility:

Each card is semantic (article/section)
Chart has tabular alternative (available via tab)
Badges: Aria-label "Achievement: First Armbarra"
Color + Icon (never color-only indicator)
Implementation:

@Component({
  selector: 'app-progress-card-set',
  template: `
    <div class="progress-cards">
      <app-evolution-card [data]="progressData.evolution"></app-evolution-card>
      <app-frequency-card [data]="progressData.frequency"></app-frequency-card>
      <app-notes-card [data]="progressData.notes"></app-notes-card>
      <app-milestones-card [data]="progressData.milestones"></app-milestones-card>
    </div>
  `
})

Custom Component #3: ComplianceCard
Purpose: Display LGPD compliance status with at-a-glance indicator and drill-down

Used In: Admin dashboard

Anatomy:
┌─────────────────────────────────────┐
│ 🟢 COMPLIANCE STATUS                │ ← Large status (emoji + text)
├─────────────────────────────────────┤
│ 100% Compliant                      │ ← Primary stat (huge font)
│                                     │
│ • 120 students with consent ✓      │ ← Bulleted details
│ • No access violations ✓           │
│ • Backups current ✓                │
│ • Audit logs clean ✓               │
├─────────────────────────────────────┤
│ [View Details] [Take Action]       │ ← CTAs
└─────────────────────────────────────┘

States:

🟢 Green (100% compliant) — Background: light green
🟡 Yellow (95-99% compliant) — Background: light amber, warning tone
🔴 Red (< 95% compliant) — Background: light red, alert tone
Status Details:

Green: "All good" — Shows checkmarks
Yellow: Shows what's missing (e.g., "6 students missing image consent")
Red: Shows critical issues requiring action
Variants:

Full: Complete details visible
Compact: Just status indicator (for dashboard overview)
Drill-Down Behavior:
Click status → Slides out detail panel showing:

Exact list of issues (if any)
Students affected
Actions available (send email, mark resolved, etc.)
Accessibility:

Status indicator: aria-label "100 percent compliant"
Color describes state BUT also text ("Green Good" / "Red Alert")
Checkmarks: aria-hidden (decorative)
Details: Keyboard navigable, screen reader friendly
Error descriptions: Clear, actionable
Implementation:


@Component({
  selector: 'app-compliance-card',
  template: `
    <mat-card [class]="'compliance-' + status">
      <mat-card-header>
        <mat-icon [class]="'status-' + status">{{ statusIcon }}</mat-icon>
        <h3>Compliance Status</h3>
      </mat-card-header>
      <mat-card-content>
        <p class="big-stat">{{ compliancePercent }}% Compliant</p>
        <ul>
          <li *ngFor="let item of statusItems">
            <mat-icon>{{ item.icon }}</mat-icon>
            {{ item.text }}
          </li>
        </ul>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button (click)="drillDown()">
          View Details
        </button>
      </mat-card-actions>
    </mat-card>
  `
})

Custom Component #4: AuditLogTimeline
Purpose: Display timestamped access log for LGPD transparency

Used In: Admin dashboard audit logs section

Anatomy:

Timeline (vertical):
────────────────────────────────────
● 19:45 | Prof. Carla
  └─ Registered training for Iniciantes (15 students)

● 18:22 | Admin Ricardo
  └─ Accessed compliance dashboard

● 14:10 | Student Pedro
  └─ Viewed own progress (< 1 min duration)
────────────────────────────────────

States:

Expandable: Click entry → show full details
Timestamps: Human-readable (19:45) + ISO format on hover
User indicators: Role badge (Prof, Admin, Student)
Action descriptions: Concise, clear
Accessibility:

Each log entry: role="listitem"
Timestamp: aria-label="7:45 PM"
Expandable: aria-expanded state
Keyboard nav: Enter/Space to expand
Implementation:

@Component({
  selector: 'app-audit-log-timeline',
  template: `
    <mat-list>
      <mat-list-item *ngFor="let entry of auditEntries" 
                    (click)="toggleExpand($event)">
        <mat-icon matListAvatar>{{ getUserIcon(entry.role) }}</mat-icon>
        <h4 matListItemTitle>
          {{ entry.timestamp | date:'shortTime' }} | {{ entry.user }}
        </h4>
        <p matListItemLine>{{ entry.action }}</p>
        <div *ngIf="entry.expanded" class="details">
          {{ entry.fullDetails }}
        </div>
      </mat-list-item>
    </mat-list>
  `
})

Component Implementation Strategy
Build Order (Dependency-Based):

Priority 1 - Critical Path (Week 1-2):

TrainingCard (professor registration depends on this)
ProgressCardSet (student dashboard depends on this)
Priority 2 - Admin Functionality (Week 2-3):

ComplianceCard (admin compliance depends on this)
AuditLogTimeline (admin transparency depends on this)
Code Reuse Strategy:

All custom components use Material components as base:

mat-card for layout (TrainingCard, ProgressCardSet, ComplianceCard)
mat-list for timeline (AuditLogTimeline)
mat-icon for all icons
mat-button for all CTAs
Shared Utilities:


// Reusable services/pipes
- DateFormatPipe (timestamps)
- RoleIconPipe (user role → icon)
- ComplianceStatusService (🟢/🟡/🔴 logic)
- LocalizationService (PT-BR strings)


Testing Strategy:

Unit tests for each component (state changes, user interactions)
E2E tests for critical flows (register training, view progress)
Accessibility audit (WCAG AA compliance)
Performance testing (animation smoothness, load time)
Accessibility Checklist
✅ All components:

Keyboard navigable (Tab/Enter/Space)
Screen reader compatible (aria-labels, semantic HTML)
Color + text (never color-only status indicators)
Focus indicators visible
Touch targets 48x48px minimum
✅ Specific components:

TrainingCard: Card title is <h3>, actions use <button>
ProgressCardSet: Chart has tabular alternative
ComplianceCard: Status text accompanies emoji indicators
AuditLogTimeline: Entries marked as <li>, timestamps are time elements
Design Tokens Applied to Components
Color Tokens Used:

- $primary: #0052CC (Judo Blue) → Buttons, links, primary CTAs
- $accent: #FF6B35 (Judo Orange) → Badges, milestones, achievements
- $success: #388E3C (Green) → Compliance ✓, success feedback
- $warning: #F57C00 (Amber) → Risks, cautions
- $error: #D32F2F (Red) → Errors, critical alerts
- $neutral-text: #212121 (Black) → Body text
- $neutral-bg: #F5F5F5 (Light Gray) → Backgrounds

Spacing Tokens:

- Card padding: 16px (md unit)
- Element margin: 8px (sm unit)
- Section margin: 24px (lg unit)
- Button height: 48px minimum
- Border radius: 4px (Material standard)

Typography Tokens:

- Card title: Headline 4 (20px, medium weight)
- Body text: Body 1 (16px, regular)
- Metadata: Caption (12px, gray)
- Buttons: Headline 5 (18px, medium weight)

Implementation Roadmap
MVP Phase (3-4 months):

Sprint 1-2: Foundation

 Setup Angular Material theming (judo-blue + orange)
 Create base card layout template
 Implement 2 custom components (TrainingCard, ProgressCardSet)
Sprint 2-3: Features

 Professor training registration (use TrainingCard)
 Student progress dashboard (use ProgressCardSet)
 Test WCAG AA compliance
Sprint 3-4: Admin

 Implement ComplianceCard + AuditLogTimeline
 Admin LGPD dashboard
 Performance optimization (< 1s load time)
Phase 2 (Months 5-7):

Enhanced components (advanced drill-down, export)
Reusable form components for variations
Phase 3 (Months 8-12):

Animation library (smooth transitions)
Dark mode variants
Component story library (Storybook, optional)


---

Perfeito! Isso cobre:

✅ **Design System Coverage** (90% Material, 10% custom)  
✅ **4 Custom Components** (TrainingCard, ProgressCardSet, ComplianceCard, AuditLogTimeline)  
✅ **Detailed Specifications** (anatomy, states, accessibility, implementation)  
✅ **Implementation Strategy** (build order, code reuse, testing)  
✅ **Design Tokens** (cores, espaçamento, tipografia)  
✅ **Roadmap** (MVP → Phase 2-3)

---

**Pronto para finalizar?**

**[A]** Refinar Component Strategy  
**[P]** Múltiplas perspectivas  
**[C]** Continue — Salvar e ir para Step 12 (UX Patterns - último passo)---

Perfeito! Isso cobre:

✅ **Design System Coverage** (90% Material, 10% custom)  
✅ **4 Custom Components** (TrainingCard, ProgressCardSet, ComplianceCard, AuditLogTimeline)  
✅ **Detailed Specifications** (anatomy, states, accessibility, implementation)  
✅ **Implementation Strategy** (build order, code reuse, testing)  
✅ **Design Tokens** (cores, espaçamento, tipografia)  
✅ **Roadmap** (MVP → Phase 2-3)

---

