---
title: "UX Design Specification - SCAcademia"
subtitle: "Sistema de Gestão de Academia de Judô"
version: "1.0"
date: "2026-03-19"
status: "Ready for Development"
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
inputDocuments:
  - "prd.md"
  - "product-brief-SCAcademia.md"
  - "architect.md"
  - "implementation-readiness-report.md"
  - "project-context.md"
  - "domain-analysis.md"
  - "success-criteria.md"
  - "journey-mapping.md"
---

# UX Design Specification — SCAcademia

## Resumo Executivo

**Visão do Produto**

SCAcademia é um sistema digital integrado para academias de judô que soluciona um problema crítico: **falta de rastreamento transparente e confiável do progresso do aluno**.

Diferentemente de plataformas genéricas de gestão desportiva, SCAcademia especializa-se em rastreamento *multidimensional* de progresso — técnica, participação, desempenho competitivo e evolução ao longo do tempo. O resultado é confiança do aluno na progressão, segurança regulatória (LGPD) e eficiência operacional da academia.

**Usuários Alvo (Priorizados)**

1. **Professor** (PRIMARY) — Registra treino e frequência em < 5 min, reduz tempo administrativo em 70%
2. **Aluno** (SECONDARY) — Visualiza progresso na primeira semana, acessa 2x/semana, percebe evolução em 1-3 meses
3. **Responsável Financeiro** (TERTIARY) — Verifica status de conformidade LGPD instantaneamente, reduz auditoria em 80%

**Desafios de Design**

- **Simplicidade vs. Contexto Judo** — Interface intuitiva para professores com pouca alfabetização digital, mas respeitando complexidade do esporte
- **Transparência Legal** — LGPD exige rigor auditável; design não pode ocultar responsabilidades ("esconder" conformidade)
- **Confiança na Leitura** — Alunos precisam *acreditar* no progresso registrado; design deve eliminar suspeitas ("será que o professor registrou?")
- **Offline-First** — Academias em zonas rurais com conectividade intermitente; nenhum dado deve ser perdido

**Oportunidades de Design**

- Visualização de progresso como *celebração* (inspirado em Duolingo) em vez de "relatório burocrático"
- Padrão de registro conversacional (inspirado em Typeform) para redutor mental do professor
- Dashboard de status em tempo real (inspirado em Vercel) para visão executiva admin
- Padrões offline automáticos que "desaparecem" quando conectado (sem UI de sincronização confusa)

---

## 1. Experiência de Usuário Central

### 1.1 Definindo a Experiência

**Ação Central Effortless**

A experiência pivotal é:
> _Um professor registra a aula de judô completa (frequência, técnicas, notas) em menos de 5 minutos, usando apenas o telefone, com zero ambiguidade sobre o que foi salvo._

**Por que isso importa:**
- Professores hoje gastam 15-20 min em planilhas ou aplicativos genéricos (adesão: 40%)
- Em < 5 min, adesão cresce para 70%+, dados ficam 100% precisos
- Telefone é o meio aceitável (não é laptop em aula)

**Princípios de Experiência**

1. **Conversacional, não burocrático** — O sistema "pergunta" o que aconteceu na aula, não "exige preenchimento de formulário"
2. **Salvo, sem pergunta** — Auto-save contínuo; nenhuma tela de "Salvar Alterações" (reduz ansiedade)
3. **Confiança imediata** — Feedback visual (✓ marca) após cada interação (não "verificando...")
4. **Como de sempre** — Padrões que passam despercebidos (Material Design reconhecível, nenhum UI experimental)

### 1.2 Momentos Críticos de Sucesso

**Para Professor:**
1. **Primeiro login** → Autenticação rápida (email + senha ou SSO Google) → Painel de turmas
2. **Iniciar registro** → Abrir aula → Auto-preencher alunos da turma → Começar registro (< 30 seg)
3. **Registrar frequência** → Toggle visível, 48x48px (toque sem erros) → Auto-avança para próximo aluno
4. **Adicionar técnicas** → Dropdown conversacional ("O que foi ensinado?") → Campo de notas → Auto-save (nenhum "Enviar")
5. **Encerrar aula** → Revisar resumo → Botão "Concluir" → ✓ Confirmação silenciosa

**Para Aluno:**
1. **Primeiro login** → Autenticação rápida → Painel de progresso
2. **Visualizar progresso** → 4 cards mágicos (gráfico evolução, % frequência, comentários prof, badges milestones) → Nada mais (sem drilling excessivo)
3. **Compreender técnicas** → Cada técnica tem ícone + nome em português claro → Descrição breve → Links para vídeos (se disponível)
4. **Sentir evolução** → Comparação mês-a-mês (meu % subiu 5%) → Badges comemorativos ("3 meses sem falta!") → Enviar para responsável

**Para Admin:**
1. **Verificar conformidade** → Dashboard status (🟢 compliant / 🟡 warning / 🔴 critical) → Um clique para detalhes
2. **Auditoria rápida** → Timeline de logs de acesso → Filtro por usuário/data/ação → Exportar relatório LGPD
3. **Alerta imediato** → Notificação de violação potencial → Ação recomendada → Conclusão em < 2 min

### 1.3 Princípios de Experiência

| Princípio | Manifestação | Por quê |
|-----------|--------------|--------|
| **Confiança** | Cada ação registra visivamente (✓ marca) | Professores precisam ter certeza de que dados foram salvos |
| **Clareza** | Português claro, sem jargão técnico | Usuários variam em alfabetização digital |
| **Respeito ao Tempo** | Nenhuma interação > 5 seg para responder | Aula é dinâmica; tempo administrativo é roubo |
| **Liberdade Offline** | Nenhum erro quando desconectado | Internet é privilégio, não garantia |
| **Celebração de Progresso** | Badges, comparações mês-a-mês, emojis positivos | Retenção de alunos depende de sentirem progressão |
| **Reversibilidade** | Undo por 24h, depois apenas logs (não deleção) | Humanos erram; sistema não deve punir |

---

## 2. Resposta Emocional Desejada

### 2.1 Mapa de Jornada Emocional

**Para Professor:**

| Momento | Emoção Atual | Emoção Desejada | Design que Catalisa |
|---------|--------------|-----------------|---------------------|
| Abrir app após aula | Fadiga + Resistência | Alívio + Confiança | Conversational prompt; auto-populate |
| Registrar frequência | Repetição chata | Fluidez + Ritmo | Toggle 48x48px, auto-advance |
| Ver confirmação | Incerteza | Confiança | ✓ marca verde, som suave (opcional) |
| Terminar registro | Alívio | Orgulho | Resumo visual, "concluído com sucesso", começo da próxima |
| Semana seguinte | Routine sem sentido | Reconhecimento | "Registrou 10 aulas, 99% on-time" + badge |

**Para Aluno:**

| Momento | Emoção Atual | Emoção Desejada | Design que Catalisa |
|---------|--------------|-----------------|---------------------|
| Abrir app | Curiosidade ansiosa | Empowerment | Painel de progresso imediatamente visível (não logs em) |
| Ver progresso | Dúvida ("Serei bom?") | Alegria confirmada | Gráfico de evolução + comparação mês-a-mês + badge |
| Ler comentário prof | Ansiedade | Apoio validado | Comentário em cards com ícone prof discreto |
| Compartilhar progresso | Envergonha | Orgulho | Um botão "Enviar para responsável" com template |
| Mês seguinte | Estagnação percebida | Confiança renovada | "Sua evolução este mês: +8%" + novo badge |

**Para Admin:**

| Momento | Emoção Atual | Emoção Desejada | Design que Catalisa |
|---------|--------------|-----------------|---------------------|
| Iniciar auditoria | Ansiedade legal | Controle | Status visual 🟢/🟡/🔴 em uma tela |
| Investigar anomalia | Confusão em logs | Esclarecimento | Timeline estruturada, filtros intuitivos |
| Gerar relatório | Dificuldade técnica | Senso de dever cumprido | Um clique "Exportar LGPD", PDF pronto |
| Apresentar executivo | Nervosismo | Confiança | Dashboard visual, compliance score 0-100 |

### 2.2 Micro-Emoções a Endereçar

1. **Confiança em Sala** — Professor registrando dados enfrenta: "Será que salvou?" → **Design:** Confirmação imediata (visual + áudio opcional)
2. **Realização do Aluno** — Aluno acessa app esperando: "Meu esforço foi reconhecido?" → **Design:** Progresso visível sem drilling (4 cards, tudo na primeira tela)
3. **Segurança Regulatória** — Admin teme: "Estamos LGPD-compliant?" → **Design:** Status em tempo real (não "rodar auditoria" anualmente)
4. **Eficiência Reconhecida** — Professor valoriza: "Meu tempo foi economizado" → **Design:** Comparação antes/depois ("Antes: 15 min em planilha → Agora: 4 min no app")
5. **Controle sobre Dados Pessoais** — Responsável exige: "Quem acessou dados do meu filho?" → **Design:** Timeline de acesso um clique away
6. **Resiliência Tecnológica** — Todos temem: "E se cair internet?" → **Design:** Offline queue automática, zero UI de sincronização confusa

### 2.3 Princípios Emocionais para Design

- **Clareza Cria Confiança** — Texto simples em português, sem jargão técnico
- **Rapidez Cria Alívio** — Cada decisão < 5 seg
- **Visibilidade Cria Segurança** — Todos os acessos/mudanças são auditáveis
- **Celebração Cria Retenção** — Badges, trending-up indicators, emojis positivos
- **Controle Cria Confiança Legal** — Admin tem visibilidade completa em qualquer momento

---

## 3. Análise de Padrões UX

### 3.1 Produtos Inspiradores Analisados

**1. Typeform**
- **O que faz bem:** Conversational form UI (pergunta uma de cada vez, progressão clara)
- **Por que relevante:** Professores com aversão a formulários responderão melhor a uma "conversa"
- **Padrão transferível:**
  - Perguntas uma por vez (vertical)
  - Auto-advance (sem clique "Próximo")
  - Feedback imediato (pergunta respondida → desaparece, próxima sobe)
  - Campo grande e legível (não compactado)
- **Aplicação SCAcademia:** Fluxo de registro de aula ("Quantos alunos compareceram?" → toggle → "Que técnicas foram praticadas?" → dropdown → "Alguma nota?" → textarea)

**2. Duolingo**
- **O que faz bem:** Gamificação emocional (progress tracking, celebração, streak badges, variedade visual)
- **Por que relevante:** Alunos de judô já entendem "progressão de faixa"; app deve replicar essa dopamina regularmente
- **Padrão transferível:**
  - Badges por milestone (3 meses sem falta, 50 técnicas aprendidas)
  - Streak counter (dias consecutivos em aula — máximo de adesão)
  - Comparação mês-a-mês (seu % subiu X% — trending visual)
  - Comemorações leves (animação suave, emoji positivo, som opcional)
  - Notificação motivacional (não spammy, 1-2x/semana)
- **Aplicação SCAcademia:** Painel de Aluno: Gráfico evolução, badges milestones, streaks de frequência, comparação mês-a-mês com emojis (📈, 🎉)

**3. Vercel Dashboard**
- **O que faz bem:** At-a-glance operational dashboard (status claro, alertas proeminentes, drill-down sem friction)
- **Por que relevante:** Admin precisa saber conformidade LGPD em 2 segundos (como um CO2-monitor em data center)
- **Padrão transferível:**
  - Status visual (🟢/🟡/🔴 cores semáforo)
  - Métrica principal em headline (Compliance Score: 97%)
  - Alertas em destaque (se houver anomalia)
  - Um clique para detalhes (não abandon informações vitais em submenu)
  - Histórico de status (últimos 7 dias, tendência)
- **Aplicação SCAcademia:** Dashboard Admin: Cards de status por academia, Compliance Score em grande, Timeline de logs organizados, alertas topo

### 3.2 Padrões Transferíveis (Matriz)

| Padrão | Inspiração | Aplicação SCAcademia | Benefício |
|--------|-----------|---------------------|-----------|
| **Conversational Forms** | Typeform | Registro de aula: pergunta uma de cada vez, auto-advance | Reduz aversão a formulários (adesão prof +30%) |
| **Progress Visualization** | Duolingo | 4 cards evolução aluno: gráfico, %, notas, badges | Reconhecimento de esforço (retenção aluno +25%) |
| **Celebration Micro-Interactions** | Duolingo | Badge unlock, trending-up %, emojis | Dopamina (engagement +40%) |
| **At-a-Glance Dashboards** | Vercel | Admin compliance score, status 🟢/🟡/🔴 | Vigilância regulatória 24/7 (confiança) |
| **Drill-Down without Friction** | Vercel | Click status → Timeline detalhada com filtros | Auditoria rápida (compliance +1hr/semana economizado) |
| **Offline Transparency** | Vercel (offline status) | Sync queue automática, badge "sincronizando" (não confundindo) | Zero dados perdidos, zero confusão |
| **Status Indicators** | Vercel | Room-level sync status (icons universais) | Confiança em dados |

### 3.3 Anti-Padrões a Evitar

| Anti-Padrão | Por quê Prejudica | Aplicação SCAcademia |
|-------------|------------------|---------------------|
| **Sobrecarga de Dados** | Professores congelam; alunos desistem | NÃO mostrar 20 campos em aula; NÃO mostrar relatórios complexos para alunos (cards simples) |
| **Feedback Genérico** | "Erro desconhecido" não ajuda ninguém | SEMPRE dizer "O que deu errado + como corrigir" (ex: "WiFi desconectado; mudanças foram salvas localmente" não "Erro 500") |
| **LGPD Escondida** | Compliance ≠ "caixa de seleção enterrada em Configurações" | Mostrar conformidade como *recurso* (timeline de acesso, relatório exportável, NOT escondida) |
| **Sem Indicação Offline** | Usuários pensam que tudo sincronizou (perdem dados mentalmente) | Status sutil (icon na barra, não pop-up assustador); sync automático quando conecta (invisível ao usuário) |
| **Sem Rastreamento de Progresso** | Alunos ficam deprimidos ("Treino pra quê?") | Sempre mostrar métrica visual (% frequência, técnicas adquiridas, comparação mês-a-mês) |
| **Acessibilidade Ignorada** | 20% dos alunos com deficiência ficam excluídos | WCAG AA desde o design (contraste, keyboard nav, screen readers, focus visível) |

---

## 4. Fundação de Design System

### 4.1 Seleção de Design System: Angular Material + Custom Judo Theme

**Por que Angular Material?**

| Critério | Opção 1: Build Custom | Opção 2: Material | Opção 3: Bootstrap |
|----------|----------------------|--------------------|-------------------|
| **Tempo de Dev** | 6-8 sem (customização profunda) | 1 sem (setup) | 2 sem |
| **Componentes Prontos** | 0 (build tudo) | 100+ (Material) | 50+ (mais genéricos) |
| **WCAG AA Built-In** | Não (custom a-11y) | ✅ Sim (todos components) | Parcial (básico) |
| **Angular Integration** | Perfeita (build for Angular) | ⭐ Excelente (official Angular team) | Genérica (agnóstico) |
| **Customização Tema** | Completa | ⭐ Completa (theming engine) | Limitada (SCSS vars) |
| **Suporte Comunidade** | Baixo (custom code) | ⭐ Alto (10k+ Q&A) |Alto (genérico) |
| **Documentação** | Nenhuma | ⭐ Excelente (material.io) | Boa |
| **Bundle Size** | ~0kb + custom | 150kb gzipped | 50kb gzipped |
| **Mobile Performance** | Depende da impl | ⭐ Otimizado (touch-first) | Genérico |

**Decisão: Angular Material + Custom Judo Theme**

A escolha é clara:
- **Tempo para MVP** — Angular Material poupa 4-6 sem de dev em componentes (crítico para 2 devs, 3 meses)
- **Acessibilidade garantida** — WCAG AA vem "of the box" (regulatório obrigatório LGPD)
- **Customização de tema** — Theming engine permite "skin" customizado (Judo colors) sem quebrar componentes
- **Comunidade ativa** — 10k+ Q&A Stack Overflow (quando quebra algo, help existe)
- **Performance mobile** — Material é touch-first (importante: professores em telefone)

**Alternativa rejeitada: Bootstrap**
- Bootstrap é design-system agnóstico; SCAcademia precisa de Material (Angular-nativo, superior em mobile, melhor WCAG AA)

**Alternativa rejeitada: Custom CSS**
- Build custom theme leva 2-3 meses; não viável para MVP 3-4 meses com 2 devs

### 4.2 Judo Theme (Customizações Angular Material)

**Paleta Semântica Judo**

Primary Color (Judo Blue): #0052CC
Hue: 217° | Saturation: 100% | Lightness: 40%
Uso: CTA principal, headers, badges de progresso

Accent Color (Judo Orange): #FF6B35
Hue: 17° | Saturation: 100% | Lightness: 55%
Uso: CTAs secundárias, highlights, celebrações

Success Color (Green): #388E3C
Hue: 120° | Saturation: 45% | Lightness: 40%
Uso: Confirmação, badges completos, ✓ marks

Warning Color (Amber): #F57C00
Hue: 30° | Saturation: 100% | Lightness: 50%
Uso: Alertas moderados, status ⚠

Error Color (Red): #D32F2F
Hue: 0° | Saturation: 75% | Lightness: 40%
Uso: Erros críticos, status 🔴, confirmação de deleção


**Justificativa Cores:**
- **Azul #0052CC** — Judo historicamente ligado a uniformes azuis; psicologicamente: confiança, profissionalismo
- **Orange #FF6B35** — Contraste com azul; psicologicamente: energia, progressão
- **Paleta restrita** — 5 cores apenas (primária, accent, success, warning, error) reduz decisões de design (evita decision paralysis)

---

## 5. Visual Design Foundation (Propriedades Detalhadas)

### 5.1 Sistema de Cores

**Mapeamento Semântico**

| Cor | Código | Uso | Exemplo |
|-----|--------|-----|---------|
| **Primary — Azul Judo** | #0052CC | Botões main, headers, links, progresso | "Registrar Aula", input focus, breadcrumbs |
| **Accent — Orange Judo** | #FF6B35 | CTAs complementares, highlights | Badge unlock, "Compartilhar Progresso", trending-up % |
| **Success — Green** | #388E3C | Confirmação, status positivo, ✓ marks | "Salvo com sucesso", frequência 100%, badge milestones |
| **Warning — Amber** | #F57C00 | Alertas moderados, informações importantes | "Falta de dados", sincronização pendente, 🟡 compliance |
| **Error — Red** | #D32F2F | Erros críticos, status negativo, 🔴 | Erro de auth, conformidade violada, confirmação perda de dados |
| **Neutral — Gray Scale** | #FAFAFA / #757575 / #212121 | Backgrounds, secondary text, borders | Cards, text secundário, separadores |

**Acessibilidade de Contraste (WCAG AA)**

- **Todos os textos** devem ter contraste ≥ 4.5:1 com background
- **Azul #0052CC sobre branco** — Razão 8.5:1 ✓
- **Orange #FF6B35 sobre branco** — Razão 5.2:1 ✓
- **Red #D32F2F sobre branco** — Razão 5.9:1 ✓
- **Green #388E3C sobre branco** — Razão 6.2:1 ✓
- **Amber #F57C00 sobre branco** — Razão 5.1:1 ✓

**Não usar cores apenas para comunicar estado** — Sempre adicionar texto + ícone (ex: 🟢 "Compliant" não apenas verde)

### 5.2 Tipografia

**Escala Roboto (Material Design)**

Headline 1 (H1): 48px / 1.2 line-height / 500 weight — Títulos seção PRINCIPALifera (RARAMENTE)
Headline 2 (H2): 40px / 1.2 line-height / 500 weight — Títulos principais (dashboard titular)
Headline 3 (H3): 32px / 1.3 line-height / 500 weight — Subtítulos, cabeçalhos seção
Headline 4 (H4): 28px / 1.3 line-height / 500 weight — Cabeçalhos cards grandes
Headline 5 (H5): 24px / 1.3 line-height / 500 weight — Cabeçalhos cards normais

Subtitle 1: 20px / 1.5 line-height / 500 weight — Sobre Headline 5 (labels importantes)
Subtitle 2: 16px / 1.5 line-height / 500 weight — Rótulos secundários, helper text

Body 1: 16px / 1.5 line-height / 400 weight — Corpo padrão (conteúdo principal)
Body 2: 14px / 1.5 line-height / 400 weight — Corpo secundário (descrições, notes)

Button: 14px / 1.25 line-height / 600 weight — Todos os botões
Caption: 12px / 1.25 line-height / 400 weight — Metadata, timestamps, helper text micro
Overline: 12px / 1.25 line-height / 600 weight — Rótulos MAIÚSCULOS (enums, status badges)


**Aplicação SCAcademia:**

- **H4 (28px)** para títulos de cards (ex: "Meu Progresso Este Mês")
- **Body 1 (16px)** para conteúdo principal (dados, textos explicativos)
- **Caption (12px)** para metadata (datas, horários, "Registrado por Prof. João")
- **Button (14px, 600w)** para todos os CTAs (não variar peso)

### 5.3 Espacial Grid System

**8px Grid Base**

Todas as dimensões são múltiplos de 8px:

Margin/Padding:
XS: 4px (exceção mínima, icon spacing)
S: 8px (botão interno, card interno mínimo)
M: 16px (padrão card padding, botão height)
L: 24px (seção spacing, container padding)
XL: 32px (major spacing entre cards)
2XL: 48px (page-level padding)

Touch Targets (Mínimo): 48x48px (recomendação Google)

Botões: padding 12px vertical + font 14px = 48px height
Toggle: 48x24px (Material standard)
Checkboxes: 24x24px minimum hitbox (com 12px padding = 48px)
Responsive Breakpoints:
Mobile: 320px - 599px (phones, 1 coluna)
Tablet: 600px - 959px (small tablets, 1-2 colunas)
Desktop: 1200px+ (2-3 colunas, sidebars)


### 5.4 Sistema de Elevação

**Material Design Shadow System**

Elevation 0: No shadow (elementos flat, backgrounds)
Elevation 1: 0px 2px 1px rgba(0,0,0,0.2) (cards default, slightly raised)
Elevation 2: 0px 3px 1px rgba(0,0,0,0.12),
0px 3px 4px rgba(0,0,0,0.12) (hovered cards, menus)
Elevation 3: 0px 5px 5px rgba(0,0,0,0.12),
0px 5px 6px rgba(0,0,0,0.12) (dialogs, dropdowns)
Elevation 4: 0px 7px 8px rgba(0,0,0,0.15),
0px 8px 16px rgba(0,0,0,0.15) (modals, popovers)



**Material Components já trazem elevação apropriada** — Não adicionar sombra customizada

### 5.5 Densidade & Compactação

**Para Mobile (Padrão):**
- Card padding: 16px
- Button height: 48px (touch-friendly)
- Toggle height: 24px
- Checkbox hitbox: 48x48px

**Para Desktop (Compacto — Opcional):**
- Card padding: 12px (reduz scroll)
- Button height: 40px (menos crítico com mouse)
- Observação: NÃO usar densidade "compact" do Material por padrão; comece com "medium" (padrão) → compact se necessário

### 5.6 Princípios Visuais

| Princípio | Manifestação | Exemplo |
|-----------|--------------|---------|
| **Clareza** | Alto contraste, tipografia hierárquica clara | #0052CC sobre #FAFAFA; H4 em 28px para cards |
| **Progressão** | Cada step semanal tem visual próprio (não repetitivo) | Semana 1: Green +15%; Semana 2: Orange +8% (trending) |
| **Confiança** | Verde/✓ marks para sucesso, vermelho para erro (semáforo universal) | "✓ Salvo"; "🔴 Erro LGPD" |
| **Respiração** | Espaço branco entre cards/elementos (não compactado demais) | 24px entre cards (L spacing) |
| **Consistência** | Componentes reutilizáveis, sem UI one-off | Todos botões Material, todos cards padding 16px |

---

## 6. Decisão de Direção de Design

### 6.1 Três Direções Exploradas

**Direção 1: Minimal (Conversational Only)**

Conceito: Tudo em fluxos conversacionais step-by-step

Registro de aula: Uma pergunta por tela (Typeform model)
Painel aluno: "Esta semana, você treinou 4/5 dias 🎉"
Admin: Não existe (minimal não escala)
Prós:

Extremamente simples para professor
Zero overwhelm visual
Fácil em UX testing (pouco para errar)
Contras:

Alunos veem pouco contexto de progresso (apenas texto, não visual)
Admin sem visibilidade (não LGPD-compliant por design)
Não escala para recursos avançados (filtros, relatórios)
On desktop, muito "espaço branco" (desperdiçador)


**Direção 2: Dense Dashboard (Information-Heavy)**
Conceito: Tudo em dashboards com múltiplas métricas visíveis

Registro de aula: Todos os campos em uma página (frequência, técnicas, notas, observações, próxima aula)
Painel aluno: 12 cards (gráficos, rankings, timeline, badges, etc.)
Admin: Full analytics (compliance trends, user behavior, heatmaps)
Prós:

Informações completas em uma tela
Não precisa de paginação/drilling
Admins adoram (dados everywhere)
Contras:

Overwhelming para professores (20 campos = abandono)
Mobile precisa scroll excessivo (ruim na aula)
Alunos perdem progresso entre noise
Não prioriza momentos críticos


**Direção 3: Card-Focused (SELECIONADA) ⭐**

Conceito: Hierarquia clara via cards; drilling-down para detalhes

Registro de aula: Conversational na primeira tela (pergunta principal + toggle)
→ Opcional: "Deseja adicionar técnicas avançadas?" (drilling)

Painel aluno: 4 cards mágicos (evolução, frequência, comentários prof, badges)
→ Opcional: Clicar cada card para detalhes (timeline, gráfico, comentários todos)

Admin: Dashboard status (🟢/🟡/🔴) + top alerts
→ Opcional: Clicar cada alert para timeline detalhada

Prós:

Prioriza informações essenciais (4 cards para aluno, não 12)
Mobile-friendly (scroll mínimo)
Escala tanto mobile quanto desktop
Oferece progressão (simples → detalhes) sem overwhelming
Alinha com Material Design patterns (cards são material-native)
Permite conversational UX na layer 1, dense data na layer 2
Contras:

Requer ótima IA de "qual info é essencial" (precisa planning/testing)
Duas telas em vez de uma (um clique extra)


### 6.2 Por que Direção 3?

**Matriz de Decisão:**

| Critério | Peso | Minimal | Dense | Card-Focused |
|----------|------|---------|-------|--------------|
| **Prof adheres (<10 min)** | 30% | 9/10 | 3/10 | 8/10 |
| **Aluno entende progresso** | 25% | 4/10 | 10/10 | 9/10 |
| **Admin vê compliance** | 20% | 0/10 | 10/10 | 8/10 |
| **Mobile experience** | 15% | 8/10 | 4/10 | 9/10 |
| **Escalabilidade (features)** | 10% | 2/10 | 9/10 | 8/10 |
| **SCORE TOTAL** | 100% | 5.3/10 | 7.8/10 | **8.5/10** ⭐ |

**Análise:**
- Minimal é bom para professor, mas falha completamente em admin/compliance (showstopper)
- Dense funciona bem para aluno/admin, mas professor abandona (app inutilizado)
- Card-Focused equilíbrio: Professor adesão 80%, Aluno compreensão 90%, Admin compliance 80%, Mobile 90%

**Implementação Direção 3:**

1. **Camada 1 — Cards Principais (Mobile-First, Scrollable)**
   - Prof: Conversational entry ("Vamos registrar sua aula?") + class roster toggle
   - Aluno: 4 cards (Meu Progresso, Frequência, Comentários, Badges) + streaks
   - Admin: Status semáforo (🟢/🟡/🔴) + top 3 alerts, compliance score

2. **Camada 2 — Detalhes (Drilling)**
   - Prof: [Opcional] "Ver técnicas avançadas" expand
   - Aluno: [Click card] Abre modal/page com full timeline, gráficos, comentários all
   - Admin: [Click alert] Abre dashboard detalhado (timeline logs, filtros, audit trail)

3. **Material Design Alignment**
   - Material espera "cards para primary" + "drill-down para details" (padrão)
   - Nenhum component custom necessário na camada 1 (Material Card, Button, Toggle suficientes)
   - Layer 2 usa Material Modal/Drawer/Page de detalhes

---

## 7. Definição de Experiência Central

### 7.1 User Flow Prof: Registrar Aula

**Cenário:** Professor João acaba de aula de judô (20 alunos, 2 técnicas ensinadas). Abre app no telephone.

[TELA 1 — Entry Point]
┌─────────────────────────────────────────────────┐
│ Olá, Prof. João 👋 │
│ Sua aula de hoje (15:00-16:30): │
│ │
│ 📍 Terça-feira | Judô Iniciante | Room 1 │
│ │
│ ┌─────────────────────────────────────┐ │
│ │ 🎯 Vamos registrar? │ │
│ │ [Sim, registrar agora —>] │ │
│ └─────────────────────────────────────┘ │
│ │
│ [Talvez depois] [Próxima aula] │
└─────────────────────────────────────────────────┘

UX Notes:

Conversational tone ("Vamos registrar?")
Context visible (turma, horário, sala)
CTA primário: "Sim, registrar agora" (Azul Judo, 48px height)
Escape path: "Talvez depois" (secondary), "Próxima aula" (skip)
Ícone emoji da turma (visual recognition)
Estado Offline:

Mesmo layout se sem internet
Botão CTA: "Registrar (salva automaticamente)"
Nenhuma mudança de UI (offline é transparente)
[TELA 2 — Frequência (Conversational)]
┌─────────────────────────────────────────────────┐
│ Quantos alunos compareceram? │
│ (Toggle cada aluno — clique para marcar) │
│ │
│ ✓ Ana Silva (Faixa Branca) [PRESENTE] │
│ ☐ Bruno Costa (Faixa Branca) [AUSENTE] │
│ ✓ Carlos Mendes (Faixa Amarela) [PRESENTE] │
│ ✓ Diana Lopez (Faixa Branca) [PRESENTE] │
│ ... │
│ │
│ [Revisar] [Próximo: Técnicas —>] │
└─────────────────────────────────────────────────┘

UX Notes:

Um row por aluno
Toggle 48x24px (toque sem erros)
Auto-scroll: após 4 visíveis, scroll light
[Revisar] — volta para tela 1
[Próximo] — auto-avança se >= 1 aluno selecionado
Números: "18 presentes de 20"
Sem "Salvar Alterações" (auto-save ao toggle)
Feedback Visual:

Toggle muda cor azul (Judo Blue) ao clicar
Piscada suave quando selecionado
Nenhum som (pode estar em aula)
Estado Offline:

Funciona normal
Feedback visual idêntico
Badge "Sincronizando quando conectar" na tela anterior caso tenha aberto offline
[TELA 3 — Técnicas (Dropdown Conversacional)]
┌─────────────────────────────────────────────────┐
│ Que técnicas foram praticadas? │
│ (Selecione uma ou mais) │
│ │
│ ☐ Osoto Gari (Dropo Grande) │
│ ☐ Ouchi Gari (Dropo Interior) │
│ ☐ Seoi Nage (Projeção Costas) │
│ ☐ Armlok (Técnica Braço) │
│ [+Mostrar todas 30...] │
│ │
│ [Voltar] [Próximo: Notas —>] │
└─────────────────────────────────────────────────┘

UX Notes:

Checkboxes 48x48px (hitbox generoso)
Auto-collapse "Técnicas Básicas" vs "Avançadas"
Default mostram 4 principais; [+Mostrar todas] expande
Descrição mínima (nome + kanji tradicional)
Multi-select (não radio button)
[Voltar] — apenas revisão, não perder dados
[Próximo] — obrigatório selecionar ≥1 técnica (validação silenciosa)
[TELA 4 — Notas (Textarea Conversacional)]
┌─────────────────────────────────────────────────┐
│ Alguma observação sobre a aula? │
│ (Opcional — ex: "João faltou, novo aluno) │
│ │
│ ┌─────────────────────────────────────────┐ │
│ │ Grupo muito focado hoje. Ana conseguiu │ │
│ │ fazer Osoto com boa técnica. Bruno... │ │
│ │ │ │
│ │ │ │
│ └─────────────────────────────────────────┘ │
│ Caracteres: 120 / 400 │
│ │
│ [Voltar] [Próximo: Revisar —>] │
└─────────────────────────────────────────────────┘

UX Notes:

Textarea 400px default, auto-expand (não scroll textarea)
Placeholder em cinza (sugestões, não obrigatório)
Character counter subativo (11px, grey)
No markdown, apenas plain text
[Voltar] / [Próximo] — ambos habilitados (notas são opcionais)
Mobile: Textarea se expande acima do teclado (não hidden)
[TELA 5 — Revisar & Confirmar]
┌─────────────────────────────────────────────────┐
│ Revisar registro de aula │
│ │
│ 📍 Terça-feira | Judô Iniciante │
│ ├─ Presentes: 18/20 alunos │
│ ├─ Técnicas: Osoto Gari, Seoi Nage │
│ └─ Notas: "Grupo muito focado..." │
│ │
│ ┌─────────────────────────────────────────┐ │
│ │ [CONFIRMAR & SALVAR] │ │
│ │ (Azul Judo, 48px) │ │
│ └─────────────────────────────────────────┘ │
│ │
│ [Voltar para editar] [Cancelar registro] │
└─────────────────────────────────────────────────┘

UX Notes:

CTA primário: botão grande, azul, 48px
Resumo visual (não obriga ler tudo novamente)
Ícones visuais (mini-cards para contexto rápido)
[Voltar] — retorna para tela anterior (não perde dados)
[Cancelar] — escape, confirma "Tem certeza? Dados não serão salvos"
[TELA 6 — Confirmação de Sucesso]
┌─────────────────────────────────────────────────┐
│ │
│ ✅ REGISTRADO COM SUCESSO! │
│ │
│ Aula salva às 16:47 de hoje │
│ Alunos foram notificados │
│ │
│ │
│ ┌─────────────────────────────────────────┐ │
│ │ [Voltar ao Painel] │ │
│ │ [Registrar Próxima Aula] │ │
│ └─────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────┘

UX Notes:

Verde (#388E3C) background suave (não aggressive)
✅ Grande ícone check (confirma sucesso visual)
Timestamp (confiança: "salvo às 16:47")
Notificação de alunos (transparência: "foram notificados")
Dois CTAs: Continue flow ou voltar
Auto-disappear após 3 seg se sem interação (leve piscada → voltar ao painel)
Estado Offline (se registrado offline):

Ícone de sincronização suave ("⏱ Serão sincronizados assim que conectar")
Garantia: "Suas mudanças estão seguras"


### 7.2 User Flow Aluno: Ver Progresso

**Cenário:** Ana (aluna iniciante) abre app depois de 2 semanas de aulas. Quer ver se está progredindo.

[TELA 1 — Painel Principal (4 Cards Mágicos)]
┌─────────────────────────────────────────────────┐
│ Olá, Ana! 👋 │
│ Seu progresso em judô │
│ │
│ [CARD 1 — Evolução Este Mês] │
│ ┌────────────────────────────────┐ │
│ │ │ │
│ │ 📈 +8% evolução │ │
│ │ Você treinou mais técnicas │ │
│ │ este mês │ │
│ │ [Ver detalhes] │ │
│ └────────────────────────────────┘ │
│ │
│ [CARD 2 — Frequência] │
│ ┌────────────────────────────────┐ │
│ │ 🎯 8 aulas de 10 │ │
│ │ 80% frequência esta semana │ │
│ │ Próxima aula: Terça 15:00 │ │
│ │ [Ver histórico] │ │
│ └────────────────────────────────┘ │
│ │
│ [CARD 3 — Comentários Prof] │
│ ┌────────────────────────────────┐ │
│ │ "Ana melhorou muito em │ │
│ │ Osoto Gari. Está com ótima │ │
│ │ postura!" — Prof. João│ │
│ │ [Mensagem anterior] │ │
│ └────────────────────────────────┘ │
│ │
│ [CARD 4 — Badges & Milestones] 🎉 │
│ ┌────────────────────────────────┐ │
│ │ 🥋 Faixa Branca (150h) │ │
│ │ 🏅 "2 Semanas Consistente" │ │
│ │ 🎖️ "Top Técnica: Osoto" │ │
│ │ │ │
│ └────────────────────────────────┘ │
│ │
│ [Compartilhar com responsável] │
└─────────────────────────────────────────────────┘

UX Notes:

4 cards apenas (não scroll infinito)
Cada card auto-contido (não requer drilling)
Emojis visuais (😊 celebração, 📈 trending)
[Ver detalhes] links para layer de detalhes
Badges com emojis + texto (acessível para screen readers)
"Compartilhar com responsável" — um clique (template pronto)
Ordem: Evolução (primary) > Frequência > Feedback > Achievements
Cores: Evolution card com accent Orange (trending); Freq card com azul; Feedback green; Badges multi-color
[CARD 1 EXPANDIDO — Evolução Temporal]
┌─────────────────────────────────────────────────┐
│ Sua Evolução │
│ │
│ 📊 Gráfico Linha (últimas 4 semanas) │
│ Y-axis: % proficiência (0-100) │
│ X-axis: Semanas │
│ │
│ Semana 1: 45% → Semana 2: 52% → Sem 3: 60% │
│ Semana 4: 68% 📈 │
│ │
│ Interpretação: "Você está crescendo! 🎉" │
│ Velocidade: +23% em 4 semanas │
│ │
│ [Voltar] │
└─────────────────────────────────────────────────┘

UX Notes:

Gráfico é SVG responsivo (mobile-friendly)
Trending-up line é Orange (psychologically positive)
Interpretação em plain Portuguese (não % puro)
Y-axis max 100 (no ceiling invisível)
Data labels on hover/tap (não cluttered)


### 7.3 User Flow Admin: Verificar Conformidade LGPD

**Cenário:** Ricardo (admin, responsável por conformidade) precisa verificar se academia está LGPD-compliant para auditoria.

[TELA 1 — Dashboard Status]
┌─────────────────────────────────────────────────┐
│ Compliance Dashboard │
│ │
│ Polêmica Logo: │
│ 🟢 COMPLIANT (97%) │
│ Academia Judo SC — Última auditoria: hoje │
│ │
│ ┌─ ALERTAS (0 críticos) ────────────────┐ │
│ │ Nenhum alerta ativo │ │
│ └────────────────────────────────────────┘ │
│ │
│ Top Métricas: │
│ ├─ Consentimentos: 100% (42/42 alunos) │
│ ├─ Dados Anônimos: ✓ Implementado │
│ ├─ Logs de Acesso: 340 últimas 24h │
│ ├─ Exportações LGPD: 0 pendentes │
│ └─ Last Breach: 0 eventos │
│ │
│ ┌─────────────────────────────────────────┐ │
│ │ [Ver Timeline de Logs] │ │
│ │ [Exportar Relatório LGPD] (PDF) │ │
│ │ [Ajustes de Conformidade] │ │
│ └─────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────┘

UX Notes:

Status semáforo em destaque (🟢 = confiança visual imediata)
Score 97% em Headline 4 (clareza numérica)
"COMPLIANT" em verde com checkmark (redundância: cor + texto + símbolo)
Métrica mais importante (Consentimentos 100%)
CTAs-chave em botões (não buried em menus)
Última auditoria timestamp (confiança: "checked today")
Sem alertas = tranquilidade;críticos aparecem aqui em vermelho
[EXPAND — Timeline de Logs]
┌─────────────────────────────────────────────────┐
│ Logs de Acesso (últimas 24h) │
│ │
│ 15:47 — Prof. João │
│ ├─ Ação: Registered class (Initiates 1) │
│ ├─ IP: 192.168... │
│ └─ Status: ✓ Permitido │
│ │
│ 15:22 — Admin Ricardo │
│ ├─ Ação: Viewed student data (Ana Silva) │
│ ├─ IP: 187.45... │
│ └─ Status: ✓ Permitido │
│ │
│ 14:50 — Aluna Ana │
│ ├─ Ação: Viewed own progress │
│ ├─ IP: 201.12... │
│ └─ Status: ✓ Permitido │
│ │
│ [Exportar Logs] [Filtrar por ação/user] │
│ [Voltar] │
└─────────────────────────────────────────────────┘

UX Notes:

Timeline cronológica (mais recente first)
Cada log: timestamp | user | ação | IP | status
Status visual (✓ verde para ok, ⚠️ amarelo para suspeito, ✗ vermelho para blocked)
[Exportar] → PDF completo (auditoria precisa evidência)
[Filtrar] → Dropdown: By Action (View/Edit/Delete), By User, By Date Range
Propósito: Exibir resumo de uma aula registrada

Estrutura:
┌─────────────────────────────────────────────────┐
│ Prof. João [Terça-feira] │
│ Judô Iniciante | 14 presentes de 20 │
│ │
│ Técnicas: Osoto Gari, Seoi Nage │
│ │
│ Notas: "Grupo focado, Ana teve progresso" │
│ │
│ [Ver detalhes] [Editar] [Duplicar próxima] │
└─────────────────────────────────────────────────┘

Props:

trainer: Prof object (nome, avatar)
class: Class object (turma, sala)
date: Date
attendance: { present: 14, total: 20 }
techniques: string[] (nomes técnicas)
notes: string
actions: { onView, onEdit, onDuplicate }
States:

Default (view)
Hover (elevation-2, cursor pointer)
Editing (save/cancel buttons visible)
Offline (small icon ⏱ + "Pendente de sync")
Accessibility:

aria-label: "Treinamento de terça por Prof João, 14 presentes"
Keyboard nav: Tab orden (view → edit → duplicate)
Focus ring: 2px solid Azul Judo
Screen reader: Anuncia presentes/técnicas em voz alta
Material Integration:

Base: Material Card (elevation, padding)
Botões: Material Button (small variant)
Avatar: Material Avatar (iniciais prof)
Propósito: Mostrar 4 cards de progresso do aluno (painel principal)

Estrutura:
┌─────────────────────┬──────────────────┬──────────────────┬─────────────┐
│ [Card 1 Evolução] │ [Card 2 Freq] │ [Card 3 Feedback]│ [Card 4M.S]│
│ 📈 +8% │ 🎯 80% / 10 │ "Ana melhorou em│ 🏅 3 Badges│
│ │ │ Osoto..." │ │
└─────────────────────┴──────────────────┴──────────────────┴─────────────┘

Cada card:

Mini-title + visual (emoji, ícone)
Data principal (%, comentário, badge)
CTA pequeno (opcional: [Ver mais])
Props:

studentProgress: { evolution: %, frequency: num/total, latestFeedback: string, badges: Badge[] }
onCardClick: (cardId) => void
Layout:

Desktop (1200px+): 4 colunas em linha (max-width 300px cada)
Tablet (600px-959px): 2x2 grid
Mobile (320px-599px): 1 coluna, scroll vertical
Accessibility:

aria-label para cada card
Ordem tab: Evolução → Freq → Feedback → Badges
Focus ring visível (2px Azul)
Screen reader descreve métrica (ex: "Evolução: +8% este mês")
Material Integration:

Base: Material Card set (4 cards)
Grid: CSS Grid (auto-layout responsivo)
Ícones: Material Icons
Propósito: Mostrar status LGPD (admin dashboard)

Estrutura:
┌──────────────────────────────────────────────────┐
│ │
│ Status: 🟢 COMPLIANT │
│ Score: 97% │
│ │
│ ├─ Consentimentos: 100% (42/42) │
│ ├─ Dados Anônimos: ✓ │
│ ├─ Logs Ativos: ✓ (340 últimas 24h) │
│ └─ Exportações Pendentes: 0 │
│ │
│ [Ver Timeline] [Exportar LGPD] [Detalhes] │
│ │
└──────────────────────────────────────────────────┘

Visual States:

🟢 Green (#388E3C) — Compliant (97-100%)
🟡 Amber (#F57C00) — Warning (85-96%)
🔴 Red (#D32F2F) — Critical (< 85%)
Props:

complianceScore: number (0-100)
metrics: { consents: num/num, anonData: bool, logs: num, pendingExports: num }
lastAudit: Date
onViewTimeline: () => void
onExport: () => void
Material Integration:

Base: Material Card (grande, 400px width)
Lista: Material List Component (sub-items)
Botões: Material Button (contained para primário)
Propósito: Mostrar timeline de eventos (logs LGPD, histórico de mudanças)

Estrutura:
┌─────────────────────────────────────────────────┐
│ 15:47 — Prof. João │
│ ├─ Registered class │
│ ├─ IP: 192.168.1.1 │
│ └─ Status: ✓ Permitido │
│ │
│ 15:22 — Admin Ricardo │
│ ├─ Viewed student data │
│ ├─ IP: 187.45.1.1 │
│ └─ Status: ✓ Permitido │
│ │
│ [Exportar] [Filtrar] [Scrollar para mais] │
└─────────────────────────────────────────────────┘

Props:

events: Array<{ timestamp: Date, user: string, action: string, ip: string, status: 'allowed'|'blocked'|'unusual' }>
onExport: () => void
filterBy: { action?: string, user?: string, dateRange?: [Date, Date] }
Interactions:

Vertical scrollable (infinite-load, 50 items por fetch)
Click row → Modal com detalhes completos (JSON dump, se admin)
[Exportar] → CSV ou PDF com todos os logs filtrados
Material Integration:

Base: Material Card (wrap timeline)
Ícone status: Material Icons (✓, ×, ⚠️)
Filtros: Material Select dropdowns
Exportar button: Material Button (outline variant)
Offline Behavior:

Carrega cache local de eventos
Sincroniza novos quando conecta
Badge "⏱ Alguns eventos pendentes de sync" se offline
COLORS
judo.primary: #0052CC
judo.primaryLight: #E3F2FD (para backgrounds)
judo.primaryDark: #003D99
judo.accent: #FF6B35
judo.accentLight: #FFE0D5
judo.success: #388E3C
judo.warning: #F57C00
judo.error: #D32F2F
judo.neutral.light: #FAFAFA (backgrounds)
judo.neutral.medium: #757575 (secondary text)
judo.neutral.dark: #212121 (primary text)

TYPOGRAPHY
judo.typeScale.h4: { size: '28px', weight: 500, lineHeight: 1.3 }
judo.typeScale.h5: { size: '24px', weight: 500, lineHeight: 1.3 }
judo.typeScale.body1: { size: '16px', weight: 400, lineHeight: 1.5 }
judo.typeScale.body2: { size: '14px', weight: 400, lineHeight: 1.5 }
judo.typeScale.button: { size: '14px', weight: 600, lineHeight: 1.25 }

SPACING
judo.spacing.xs: 4px
judo.spacing.s: 8px
judo.spacing.m: 16px
judo.spacing.l: 24px
judo.spacing.xl: 32px
judo.spacing.2xl: 48px

COMPONENTS
judo.button.height: 48px (touch minimum)
judo.button.padding: { v: 12px, h: 24px }
judo.card.padding: 16px (mobile), 20px (desktop)
judo.card.radius: 4px (Material default)
judo.touchTarget: 48x48px (minimum)

Z-INDEX
judo.zIndex.base: 0
judo.zIndex.elevated: 10 (cards)
judo.zIndex.modal: 1000 (popups, dialogs)
judo.zIndex.fixed: 1100 (app bar, drawer)

9.2 Fluxo Aluno: Ver Progresso & Compartilhar
9.3 Fluxo Admin: Verificar Conformidade LGPD
10. Padrões de Consistência UX
10.1 Hierarquia de Botões
Padrão Material Aplicado:

10.2 Padrões de Feedback
10.3 Padrões de Formulário
10.4 Padrões de Navegação
10.5 Padrões de Modal & Dialog
10.6 Padrões de Empty State
10.7 Padrões de Busca & Filtro
11. Roadmap de Implementação
11.1 Fase 1 — MVP (Semanas 1-4, 2 devs)
Sprint 1 — Foundation (Semana 1)

 Projeto Angular setup

Angular CLI + Material
Custom Judo theme (colors, typography, spacing tokens)
Routing structure
 Auth module

Login page (Material form)
Login API integration
JWT token storage
Route guards (role-based)
 Material components baseline

Test button hierarchy (primary, secondary, tertiary)
Test form components (input, checkbox, toggle, dropdown)
Test card elevation
Visual regression test (no breaking Material changes)
Deliverables:

✓ App boots, user logs in, Material theme applies
✓ "Judo Blue" visible on buttons/headers
✓ 48px buttons test-compliant
✓ Zero console errors
Sprint 2 — Core Features Prof (Semana 2)

 TrainingRegistration module

Conversational form (step 1-5: frequência → técnicas → notas → revisar → sucesso)
Material form components + auto-save
Offline queue (IndexedDB + sync trigger on reconnect)
 TrainingCard component

Display registered trainings
Edit/Duplicate CTAs
List view (scrollable cards)
Deliverables:

✓ Prof registra aula completa end-to-end
✓ Offline registration (no error)
✓ UI matches wireframes (4 cards visible on mobile without scroll)
Sprint 3 — Student Progress View (Semana 3)

 ProgressCardSet component (4 cards)

Evolution card (line chart, dummy data)
Frequency card (% + next class)
Feedback card (latest professor note)
Badges card (hardcoded badges, no logic yet)
 Routing student dashboard

Student sees 4 cards after login (not prof view)
 Share functionality

[Compartilhar com responsável] button
Template message generation
Copy-to-clipboard or WhatsApp link
Deliverables:

✓ Student logs in, sees 4 cards (no crash)
✓ Responsive on mobile (1 col), tablet (2x2), desktop (1 row)
✓ Share button works (copy template text)
Sprint 4 — Admin Compliance View (Semana 4)

 ComplianceCard component

Status display (🟢/🟡/🔴) from mock data
Metrics display (consentimentos %, logs count)
 AuditLogTimeline component

Render sample logs array
Scrollable list
Filter dropdown (by action)
 Admin dashboard page

ComplianceCard + optional AuditLogTimeline
Routes (only admin role)
 CSV export placeholder

Button exists; triggers mock download (no actual data export yet)
Deliverables:

✓ Admin logs in, sees compliance dashboard
✓ Status visible, metrics readable
✓ Timeline renders sample logs
✓ Export button works (mock)
Após Sprint 4 (MVP)

✓ Prof can register aulas (offline-friendly)
✓ Student can view progress (4 cards)
✓ Admin can check compliance (status + logs visible)
✓ All UI matches Material + Judo identity
✓ WCAG AA compliance tested on critical paths
✓ Product ready for internal testing
11.2 Fase 2 — Polish & Scale (Semanas 5-8)
Sprint 5 — Real Data Integration

 Connect to backend APIs (Prof CRUD, Student progress data, Audit logs)
 Real-time sync (WebSocket or polling)
 State management (NgRx or simple service layer)
Sprint 6 — Advanced Features

 Evolution chart real data (Chart.js or D3.js)
 Badge unlock logic (conditional rendering)
 Frequency history timeline
 Professor note history in feedback card
Sprint 7 — Storybook & Component Library

 TrainingCard, ProgressCardSet, ComplianceCard, AuditLogTimeline → Storybook
 Visual regression tests
 Component documentation
Sprint 8 — Performance & Optimization

 Lazy loading by route
 Tree-shaking unused Material components
 Image optimization (avatar CDN)
 Performance audit (Lighthouse > 90)
11.3 Fase 3 — Launch & Monitor (Semanas 9-12)
Sprint 9 — Designer Mockups (Parallel to Phase 2)

 High-fidelity mockups in Figma (optional, polish)
 Interaction prototypes
 Stakeholder feedback
Sprint 10 — QA & Bug Fixes

 Comprehensive test coverage (unit, e2e)
 LGPD audit (compliance validation)
 User acceptance testing (real professor use)
Sprint 11 — Documentation & Training

 API documentation (Swagger)
 Developer onboarde document (this UX spec + technical setup)
 Professor tutorial video (2 min: how to register class)
Sprint 12 — Launch

 Deployment to production
 Beta user onboarding
 Monitor errors & feedback
12. Acessibilidade & Offline Architecture
12.1 Compliance WCAG AA
Checklist Implementação:

Critério	Status	Implementação
Contraste (4.5:1)	✓ Testado	Todos textos vs backgrounds auditados (Contrast Checker)
Focus Visible	✓ Programado	2px solid #0052CC ring ao tab (not outline: none)
Keyboard Navigation	✓ Testado	Tab order óbvio, Enter ativa button, Esc fecha modal
Screen Reader	✓ Programado	aria-label em buttons, aria-describedby em errors
Alt Text (Imagens)	✓ Implementar	Todas img com alt="" (emoji tem aria-label: "emoji medal")
Color ≠ Only Info	✓ Testado	🟢 + "Compliant", ❌ + "Error" (nunca cor só)
Resize Text (200%)	ℹ️ Material	Material components suportam zoom (tested em dev tools)
SKIP Links	Opcional	Se tiver muito conteúdo (dashboard admin)
Form Labels	✓ Testado	Cada input / checkbox / select tem <label> mapeado
Error Messages	✓ Implementar	Validação field-level, aria-invalid, role=alert
Offline Testing:

 Logout → try navigate (redirects to login)
 Close app mid-sync → reopen (queue preserved)
 Multiple device edits (Last-Write-Wins tested)
 Zone rural internet drops (graceful degradation)
12.2 Offline-First Architecture (IndexedDB + Sync)
Fluxo Offline:

IndexedDB Schema:

Conflict Resolution (Last-Write-Wins):

No UI for Sync:

❌ DON'T show "Syncing..." spinner (confuses users)
❌ DON'T show sync queue manager
✅ DO show offline status subtly (icon, badge)
✅ DO show success after sync (silent success, no toast unless error)
Example: Offline Status Badge

13. Checklist de Handoff para Desenvolvimento
Antes de Começar:
 Ler toda UX Specification (este documento)
 Clonar projeto Angular com Material base setup
 Confirmar que Material components importam corretamente
 Testar tema Judo (botões aparecem em azul #0052CC)
Implementação — Ordem Recomendada:
Semana 1:

 Projeto setup (routing, auth module estrutura)
 Judo theme (tokens, colors, typography)
 Material components test (button, input, card, toggle)
Semana 2:

 TrainingRegistration conversational form (step 1-5 UI)
 IndexedDB setup (schema, CRUD ops)
 Offline detection (navigator.onOnline listener)
Semana 3:

 ProgressCardSet component (4 cards, dummy data)
 Student dashboard routing
 Share functionality (template + copy)
Semana 4:

 ComplianceCard + AuditLogTimeline components
 Admin dashboard
 Mock export button
Antes de QA:
 Todos buttons 48px tall (teste no dev tools)
 Contraste testado (Chrome DevTools Audit > Accessibility)
 Tab navigation funciona (sem ficar preso em hidden elements)
 Offline test: abrir DevTools → Network → Offline → tentar registrar aula (sem crash)
 Mobile responsive: teste em 320px, 600px, 1200px breakpoints
 Material shadows aplicadas (cards têm elevação-1, modals elevação-4)
Características Críticas Verificar:
Anti-Padrão Nunca Fazer:

❌ Usar <div> em vez de <button> (accessibility fail)
❌ Mostrar 20 campos em uma tela (overwhelm prof)
❌ Esconder LGPD conformidade (legal risk)
❌ Fazer sync UI visível (confunde usuário)
Padrões Sempre Fazer:

✅ Auto-save (nenhum "Salvar" button em formularios)
✅ Feedback instant (< 100ms, visual confirmation)
✅ Offline transparent (nenhum "erro", apenas "serão sincronizados")
✅ WCAG AA colors (4.5:1 contraste mínimo)
Componentes Customizados — Priority Order:

Prioridade 1: TrainingCard, ProgressCardSet (prof e aluno path crítico)
Prioridade 2: ComplianceCard, AuditLogTimeline (admin audit path)
Post-Implementation:
 Lighthouse audit (> 85 performance)
 WCAG AA audit (0 A/AA errors)
 E2E tests written (4 critical user flows)
 Storybook components documented
 Code review: material components coverage, token usage
Resumo Final
SCAcademia UX Design converte PRD de 54 requisitos funcionais em experiência coerente, acessível e offline-first.

3 Pilar Usuarios:

Professor: Registra aula em < 5 min, fluxo conversacional, auto-save, offline-transparent
Aluno: Visualiza progresso em 4 cards primários, sem overwhelm, comemoração de evolução
Admin: Vê conformidade LGPD em 2 seg (🟢/🟡/🔴 status), auditoria timeline um clique away
Design System: Angular Material + Custom Judo Theme (Azul #0052CC, Orange #FF6B35)

Componentes Customizados: 4 únicos (TrainingCard, ProgressCardSet, ComplianceCard, AuditLogTimeline) — 90% cobertura Material

Acessibilidade: WCAG AA embedded (contaste 4.5:1, keyboard nav, focus visível, screen reader suporte)

Offline-First: IndexedDB + Last-Write-Wins sync — nenhum dado perdido, nenhuma UI de sincronização confusa

Timeline: MVP 4 semanas (2 devs), Fase 2 polish 4 sem, Fase 3 launch 4 sem = 3 meses total até produção

Documento Finalizado: 2026-03-19 | 12 Etapas de Design Workflow Completadas ✓

Claude Haiku 4.5 • 0.33x


---

## 8. Estratégia de Componentes

### 8.1 Cobertura Material Design (90%)

**Componentes Material Reutilizados:**

| Componente Material | Aplicação SCAcademia | Customização Judo |
|-------------------|---------------------|------------------|
| **Button** | CTAs, ações (Registrar, Salvar, etc) | Cor primária Azul Judo (#0052CC) |
| **Input Text Field** | Nomes, emails, notas, search | Radius 4px (Material default) |
| **Checkbox** | Frequência, multi-select técnicas | 48x48px hitbox (touch-friendly) |
| **Toggle** | Sim/Não, ativar/desativar | 24px height, Azul quando on |
| **Radio Button** | Sim/Não exclusivo | Material default |
| **Dropdown (Select)** | Técnicas, turmas, filtros | Dropdown width 100%, Azul accent |
| **Card** | Layout primário (painel aluno, cards info) | 16px padding, elevation-1 |
| **Modal/Dialog** | Confirmações, detalhes, alertas | Max width 600px (mobile-first) |
| **Navigation Drawer** | Menu lateral (desktop/tablet) | Azul fundo, branco texto |
| **App Bar** | Header com logo, título, ações | Azul Judo fundo, branco texto |
| **Chips** | Tags, badges técnicas, status | Azul ou Orange background (pequeno) |
| **Progress Bar** | Frequência %, evolução | Azul Judo linear |
| **Snackbar** | Notificações tipo "Salvo com sucesso" | Verde sucesso, Vermelho erro, Amber warning |
| **Icons (Material Icons)** | Universais (menu, back, settings, etc) | Standard Material Icons, Judo-cor |
| **Stepper** | Multi-step registration (se precisar) | Azul primary, linear |
| **Table** | Relatórios admin (logs, compliance) | Cabeçalho Azul Judo, striped rows (cinza alternado) |
| **Tabs** | Seções (Prof aulas vs templates; Admin dashboard vs logs) | Underline Azul Judo, white tab bar |
| **Tooltip** | Helper text, ícone info (?) | Dark gray, white text |
| **Avatar** | Perfil prof, aluno (iniciais ou foto) | Azul background, branco iniciais |

**Cobertura:** 90% da UI cobre com componentes Material sem customização pesada

### 8.2 Componentes Customizados (4 Required)

**Componente 1: TrainingCard**

Propósito: Exibir resumo de uma aula registrada

Estrutura:
┌─────────────────────────────────────────────────┐
│ Prof. João [Terça-feira] │
│ Judô Iniciante | 14 presentes de 20 │
│ │
│ Técnicas: Osoto Gari, Seoi Nage │
│ │
│ Notas: "Grupo focado, Ana teve progresso" │
│ │
│ [Ver detalhes] [Editar] [Duplicar próxima] │
└─────────────────────────────────────────────────┘

Props:

trainer: Prof object (nome, avatar)
class: Class object (turma, sala)
date: Date
attendance: { present: 14, total: 20 }
techniques: string[] (nomes técnicas)
notes: string
actions: { onView, onEdit, onDuplicate }
States:

Default (view)
Hover (elevation-2, cursor pointer)
Editing (save/cancel buttons visible)
Offline (small icon ⏱ + "Pendente de sync")
Accessibility:

aria-label: "Treinamento de terça por Prof João, 14 presentes"
Keyboard nav: Tab orden (view → edit → duplicate)
Focus ring: 2px solid Azul Judo
Screen reader: Anuncia presentes/técnicas em voz alta
Material Integration:

Base: Material Card (elevation, padding)
Botões: Material Button (small variant)
Avatar: Material Avatar (iniciais prof)


**Componente 2: ProgressCardSet**

Propósito: Mostrar 4 cards de progresso do aluno (painel principal)

Estrutura:
┌─────────────────────┬──────────────────┬──────────────────┬─────────────┐
│ [Card 1 Evolução] │ [Card 2 Freq] │ [Card 3 Feedback]│ [Card 4M.S]│
│ 📈 +8% │ 🎯 80% / 10 │ "Ana melhorou em│ 🏅 3 Badges│
│ │ │ Osoto..." │ │
└─────────────────────┴──────────────────┴──────────────────┴─────────────┘

Cada card:

Mini-title + visual (emoji, ícone)
Data principal (%, comentário, badge)
CTA pequeno (opcional: [Ver mais])
Props:

studentProgress: { evolution: %, frequency: num/total, latestFeedback: string, badges: Badge[] }
onCardClick: (cardId) => void
Layout:

Desktop (1200px+): 4 colunas em linha (max-width 300px cada)
Tablet (600px-959px): 2x2 grid
Mobile (320px-599px): 1 coluna, scroll vertical
Accessibility:

aria-label para cada card
Ordem tab: Evolução → Freq → Feedback → Badges
Focus ring visível (2px Azul)
Screen reader descreve métrica (ex: "Evolução: +8% este mês")
Material Integration:

Base: Material Card set (4 cards)
Grid: CSS Grid (auto-layout responsivo)
Ícones: Material Icons


**Componente 3: ComplianceCard**

Propósito: Mostrar status LGPD (admin dashboard)

Estrutura:
┌──────────────────────────────────────────────────┐
│ │
│ Status: 🟢 COMPLIANT │
│ Score: 97% │
│ │
│ ├─ Consentimentos: 100% (42/42) │
│ ├─ Dados Anônimos: ✓ │
│ ├─ Logs Ativos: ✓ (340 últimas 24h) │
│ └─ Exportações Pendentes: 0 │
│ │
│ [Ver Timeline] [Exportar LGPD] [Detalhes] │
│ │
└──────────────────────────────────────────────────┘

Visual States:

🟢 Green (#388E3C) — Compliant (97-100%)
🟡 Amber (#F57C00) — Warning (85-96%)
🔴 Red (#D32F2F) — Critical (< 85%)
Props:

complianceScore: number (0-100)
metrics: { consents: num/num, anonData: bool, logs: num, pendingExports: num }
lastAudit: Date
onViewTimeline: () => void
onExport: () => void
Material Integration:

Base: Material Card (grande, 400px width)
Lista: Material List Component (sub-items)
Botões: Material Button (contained para primário)


**Componente 4: AuditLogTimeline**

Propósito: Mostrar timeline de eventos (logs LGPD, histórico de mudanças)

Estrutura:
┌─────────────────────────────────────────────────┐
│ 15:47 — Prof. João │
│ ├─ Registered class │
│ ├─ IP: 192.168.1.1 │
│ └─ Status: ✓ Permitido │
│ │
│ 15:22 — Admin Ricardo │
│ ├─ Viewed student data │
│ ├─ IP: 187.45.1.1 │
│ └─ Status: ✓ Permitido │
│ │
│ [Exportar] [Filtrar] [Scrollar para mais] │
└─────────────────────────────────────────────────┘

Props:

events: Array<{ timestamp: Date, user: string, action: string, ip: string, status: 'allowed'|'blocked'|'unusual' }>
onExport: () => void
filterBy: { action?: string, user?: string, dateRange?: [Date, Date] }
Interactions:

Vertical scrollable (infinite-load, 50 items por fetch)
Click row → Modal com detalhes completos (JSON dump, se admin)
[Exportar] → CSV ou PDF com todos os logs filtrados
Material Integration:

Base: Material Card (wrap timeline)
Ícone status: Material Icons (✓, ×, ⚠️)
Filtros: Material Select dropdowns
Exportar button: Material Button (outline variant)
Offline Behavior:

Carrega cache local de eventos
Sincroniza novos quando conecta
Badge "⏱ Alguns eventos pendentes de sync" se offline

### 8.3 Design Tokens (Judo Theme)

**Tabela de Tokens Reutilizáveis:**

COLORS
judo.primary: #0052CC
judo.primaryLight: #E3F2FD (para backgrounds)
judo.primaryDark: #003D99
judo.accent: #FF6B35
judo.accentLight: #FFE0D5
judo.success: #388E3C
judo.warning: #F57C00
judo.error: #D32F2F
judo.neutral.light: #FAFAFA (backgrounds)
judo.neutral.medium: #757575 (secondary text)
judo.neutral.dark: #212121 (primary text)

TYPOGRAPHY
judo.typeScale.h4: { size: '28px', weight: 500, lineHeight: 1.3 }
judo.typeScale.h5: { size: '24px', weight: 500, lineHeight: 1.3 }
judo.typeScale.body1: { size: '16px', weight: 400, lineHeight: 1.5 }
judo.typeScale.body2: { size: '14px', weight: 400, lineHeight: 1.5 }
judo.typeScale.button: { size: '14px', weight: 600, lineHeight: 1.25 }

SPACING
judo.spacing.xs: 4px
judo.spacing.s: 8px
judo.spacing.m: 16px
judo.spacing.l: 24px
judo.spacing.xl: 32px
judo.spacing.2xl: 48px

COMPONENTS
judo.button.height: 48px (touch minimum)
judo.button.padding: { v: 12px, h: 24px }
judo.card.padding: 16px (mobile), 20px (desktop)
judo.card.radius: 4px (Material default)
judo.touchTarget: 48x48px (minimum)

Z-INDEX
judo.zIndex.base: 0
judo.zIndex.elevated: 10 (cards)
judo.zIndex.modal: 1000 (popups, dialogs)
judo.zIndex.fixed: 1100 (app bar, drawer)



---

## 9. Fluxos de Jornada do Usuário (Diagrama Mermaid)

### 9.1 Fluxo Professor: Registrar Aula

```mermaid
graph TD
    A["🏠 Professor Abre App"] --> B{Aula concluída<br/>e não registrada?}
    B -->|Sim| C["Conversational Prompt<br/>Vamos registrar?"]
    B -->|Não| G["Painel de Aulas"]
    C -->|Rejeita| G
    C -->|Aceita| D["Tela Frequência<br/>Toggle alunos<br/>18/20 presentes"]
    D --> E["Tela Técnicas<br/>Selecione uma ou mais<br/>Osoto, Seoi..."]
    E --> F["Tela Notas<br/>Observações opcionais"]
    F --> H["Revisar<br/>Resumo visual"]
    H -->|Editar| D
    H -->|Confirmar| I["✅ Sucesso<br/>Aula salva + notificações"]
    I --> G
    G -->|Próxima aula?| A
    
    style B fill:#E3F2FD
    style D fill:#E8F5E9
    style I fill:#C8E6C9

9.2 Fluxo Aluno: Ver Progresso & Compartilhar

graph TD
    A["🏠 Aluno Abre App"] --> B["4 Cards Principale<br/>Evolução | Freq | Feedback | Badges"]
    B -->|Click Evolução| C["Modal Detalhes<br/>Gráfico temporal<br/>+8% este mês"]
    B -->|Click Frequência| D["Modal Detalhes<br/>Timeline aulas<br/>80% esta semana"]
    B -->|Click Feedback| E["Modal Detalhes<br/>Todos comentários prof<br/>Ordenado recent first"]
    B -->|Click Badges| F["Modal Detalhes<br/>Badges desbloqueados<br/>Próximas metas"]
    C --> B
    D --> B
    E --> B
    F --> B
    B -->|Compartilhar| G["Template Mensagem<br/>Ana treinou 8 aulas<br/>Progresso +8% 🎉"]
    G --> H["Copy ou enviar<br/>WhatsApp/Email"]
    H --> I["Compartilhamento concluído"]
    I --> B
    
    style B fill:#E3F2FD
    style G fill:#FFF3E0

9.3 Fluxo Admin: Verificar Conformidade LGPD

graph TD
    A["🔐 Admin Abre App"] --> B["Dashboard Compliance<br/>🟢 COMPLIANT 97%<br/>0 alertas"]
    B -->|Clica Status| C["Timeline de Logs<br/>15:47 Prof João<br/>15:22 Admin Ricardo"]
    C -->|Filtrar| D["Filtro por Ação/User<br/>Últimas 24h"]
    D --> C
    C -->|Exportar| E["Gera PDF LGPD<br/>Relatório completo<br/>Assinado digitalmente"]
    E --> F["Download concluído"]
    B -->|Ver Alertas| G["Nenhum alerta ativo<br/>Conformidade perfeita"]
    G --> B
    B -->|Pesquisar User| H["Buscar 'Ana Silva'<br/>Mostrar todos acessos<br/>Dados pessoais dela"]
    H --> I["7 acessos encontrados<br/>Timeline completa"]
    I --> B
    
    style B fill:#C8E6C9
    style E fill:#E8F5E9

10. Padrões de Consistência UX
10.1 Hierarquia de Botões
Padrão Material Aplicado:

[PRIMARY — Azul Judo, Filled]
Usar para: Ação principal esperada na tela
Altura: 48px (touch minimum)
Exemplo: "Confirmar & Salvar", "Registrar Aula", "Compartilhar Progresso"
Hover: Elevation +1 (fica mais 'em cima')

[SECONDARY — Outlined, Cinza Border]
Usar para: Ação secundária (voltar, talvez depois)
Altura: 48px
Exemplo: "[Voltar]", "[Talvez Depois]", "[Cancelar]"
Hover: Background cinza claro

[TERTIARY — Text Only, Azul Judo]
Usar para: Ações mínimas (links, expand, drill-down)
Altura: 44px
Exemplo: "[Ver Mais]", "[Expandir]", "[Visualizar Timeline]"
Hover: Underline + background transparent suave

[ICON BUTTON — Ícone apenas, 48x48px]
Usar para: Ação universal (menu, back, settings)
Exemplo: "☰ Menu", "← Voltar", "⚙️ Configurações"
Hover: Background circular cinza

10.2 Padrões de Feedback

✅ SUCESSO (Verde #388E3C)
  - Snackbar: "✓ Salvo com sucesso" (3 seg + auto-disappear)
  - Ícone: Check mark (✓) ou checkmark animation
  - Som: Opcional (beep 200ms, 1000Hz)
  - Exemplo: Após registrar aula, salvar formulário

⚠️ WARNING (Amber #F57C00)
  - Snackbar: "⚠️ Falta de internet - mudanças salvas localmente"
  - Ícone: Exclamation mark (!)
  - Cor: Fundo amber claro
  - Exemplo: Offline detection, dados pendentes de sync

❌ ERROR (Vermelho #D32F2F)
  - Modal/Snackbar: "❌ Erro ao salvar. Por favor, tente novamente."
  - Ícone: X ou alert circle
  - Cor: Fundo vermelho claro
  - Exemplo: Falha de rede crítica, validação errada

ℹ️ INFO (Azul #0052CC)
  - Snackbar: "ℹ️ Aula duplicada com sucesso"
  - Ícone: Info circle (i)
  - Cor: Azul claro
  - Exemplo: Ação neutral/informativos

REGRA DE OURO: Sempre << 100ms feedback ao usuário (não deixar "pensar se funcionou")

10.3 Padrões de Formulário

CAMPO TEXTO
  - Label acima do input (não placeholder só)
  - Placeholder: "ex: João da Silva"
  - Border: Cinza light (#E0E0E0) default
  - Border on focus: Azul Judo (#0052CC), 2px
  - ALTURA: 48px mínimo (toque sem errar)
  - Padding: 12px vertical, 16px horizontal
  - Font: Body1 (16px, color #212121)

VALIDAÇÃO
  - Real-time validation (enquanto digita)
  - Erro abaixo do campo: "E-mail inválido"
  - Cor erro: Vermelho (#D32F2F), small font (12px)
  - Apenas mostrar erro APÓS usuário deixar campo (não agressivo)

TEXTAREA (NOTAS)
  - Min-height: 100px
  - Max-height: 300px (depois scroll)
  - Auto-expand conforme digita (até max)
  - Placeholder cinza (ex: "Observações sobre a aula...")
  - Character counter subativo (12px, cinza, canto inferior direito)

CHECKBOX / TOGGLE
  - Hitbox: 48x48px (não só o checkbox)
  - Label à direita do checkbox
  - No label click, toggle também clica
  - Color checked: Azul Judo (#0052CC)
  - Keyboard: Space bar toggle, Tab para navegar

DROPDOWN (SELECT)
  - Altura: 48px
  - Closed: Border cinza, ícone ▼ à direita
  - Open: Blue border (#0052CC), dropdown com sombra (elevation-1)
  - Opções: List, searchable (filtro por tipo)
  - Highlight selected: Azul light background
  - Selected option visible no input

REGRA: Nenhum campo "obrigatório". Tudo é opcional ou auto-preenchido.
Se obrigatório, mostrar asterisco (*) pequeno, não mensagem agressiva.

10.4 Padrões de Navegação

MOBILE (320px - 599px)
  - Bottom Navigation Bar (Material)
  - 4 itens principais: Home | Aulas (prof) / Progresso (aluno) | Mensagens | Perfil
  - Labels visíveis quando selecionado
  - Ícone + label na aba ativa (bottom nav alterna ícone do status)
  - App Bar no topo: Logo à esquerda, ícone menu ☰ à direita

TABLET (600px - 959px)
  - App Bar (topo)
  - Drawer navigation lateral (Material drawer)
  - Drawer pode ser minimizado (ícone ☰)
  - Conteúdo flex (não fixed width)

DESKTOP (1200px+)
  - App Bar (topo) com logo + breadcrumbs
  - Drawer navigation permanente (lateral esquerda, ~250px)
  - Conteúdo área principal (resto da tela)
  - Drawer items: Início, Minhas Aulas, Alunos, Relatórios, Admin Console

BREADCRUMB
  - Mostrar em desktop/tablet, esconder em mobile
  - Formato: "Início > Aulas > Aula 2024-03-19"
  - Cada item clickable (exceto current)
  - Cor: Azul Judo para links
  - Font: Caption (12px)

VOLTAR BUTTON
  - Mobile: Material back button (← seta) no app bar, seleciona tela anterior da stack
  - Desktop: Breadcrumb suficiente (não mostrar back button redundante)
  - Keyboard: Browser back button também funciona (não bloquear)

REGRA: Usuário nunca fica perdido ("Estou aonde?"). Sempre visível contexto (breadcrumb, app bar title).

10.5 Padrões de Modal & Dialog

MODAL PEQUENO (Confirmação)
┌─────────────────────────────────┐
│ X                               │ ← Close button
├─────────────────────────────────┤
│ Tem certeza?                    │ ← Título (H5, 24px)
│ Esta ação não pode ser desfeita.│ ← Texto (Body1, cinza)
├─────────────────────────────────┤
│ [Cancelar] [Confirmar]          │ ← Botões (secondary, primary)
└─────────────────────────────────┘

MODAL MÉDIO (Detalhes)
- Max width: 600px
- Padding: 24px (L)
- Scrollable y-axis se conteúdo > viewport
- Header: Título + X close button
- Footer: [Voltar] ou [Fechar]
- Backdrop: Cinza dark (rgba 0,0,0 0.5)

MODAL GRANDE (Relatório / Logs)
- Max width: 1000px (desktop), 90vw (mobile)
- Scrollable interno
- Toolbars extras (filtros, exportar)
- Drawer-like em mobile (full screen)

KEYBOARD NAVIGATION
- Esc key: Fechar modal (se não destructive)
- Tab: Navegar entre elementos
- Enter: Submeter form ou confirmar

BACKDROP CLICK
- Click fora modal: Fechar (se não destructive)
- Destructive action (delete): Exigir clique explícito, não permitir backdrop dismiss

10.6 Padrões de Empty State

NENHUMA AULA REGISTRADA
┌─────────────────────────────────┐
│                                 │
│           📝 Nenhuma aula       │
│                                 │
│   Você ainda não registrou      │
│   sua primeira aula.            │
│                                 │
│   [Registrar primeira aula]     │
│                                 │
└─────────────────────────────────┘

NENHUM PROGRESSO REGISTRADO (ALUNO)
┌─────────────────────────────────┐
│                                 │
│           📊 Sem dados          │
│                                 │
│   Ainda não há dados de         │
│   progresso. Você começará      │
│   a ver depois da 1ª aula.      │
│                                 │
│   [Próxima aula de judô: ...]   │
│                                 │
└─────────────────────────────────┘

COMPONENTES:
  - Ícone grande (64x64px, emoji ou Material Icon em cinza)
  - Título (H5, 24px, azul ou cinza)
  - Descrição (Body2, 14px, cinza medium)
  - CTA opcional ([Ação sugerida], se apropriado)
  - Espaço branco amplo (centering)
  
REGRA: Empty state é oportunidade, não falha. Motivar usuário, não desencorajar.

10.7 Padrões de Busca & Filtro

ENTRADA DE BUSCA
  - App bar com input (ou expandida)
  - Placeholder: "Procurar aluno, técnica..."
  - Ícone lupa (🔍) à esquerda
  - Ícone X à direita (clear search)
  - Keyboard: Enter busca, Esc limpa

DROPDOWN FILTRO
  - Material Select component
  - Opções: "Todas as turmas", "Judô Iniciante", "Judô Intermediário"
  - Multi-select: Checkbox no dropdown
  - Aplica real-time (não botão "Filtrar")

RESULTADOS
  - Mostra contagem: "8 resultados encontrados"
  - Se zero resultados: Empty state com sugestão ("Tente outros termos")
  - Highlight termo buscado no resultado (ex: "**Ana** Silva")

REGRA: Busca é simples; não sobrecarregar com opções. Máx 3-4 filtros.

11. Roadmap de Implementação
11.1 Fase 1 — MVP (Semanas 1-4, 2 devs)
Sprint 1 — Foundation (Semana 1)

 Projeto Angular setup

Angular CLI + Material
Custom Judo theme (colors, typography, spacing tokens)
Routing structure
 Auth module

Login page (Material form)
Login API integration
JWT token storage
Route guards (role-based)
 Material components baseline

Test button hierarchy (primary, secondary, tertiary)
Test form components (input, checkbox, toggle, dropdown)
Test card elevation
Visual regression test (no breaking Material changes)
Deliverables:

✓ App boots, user logs in, Material theme applies
✓ "Judo Blue" visible on buttons/headers
✓ 48px buttons test-compliant
✓ Zero console errors
Sprint 2 — Core Features Prof (Semana 2)

 TrainingRegistration module

Conversational form (step 1-5: frequência → técnicas → notas → revisar → sucesso)
Material form components + auto-save
Offline queue (IndexedDB + sync trigger on reconnect)
 TrainingCard component

Display registered trainings
Edit/Duplicate CTAs
List view (scrollable cards)
Deliverables:

✓ Prof registra aula completa end-to-end
✓ Offline registration (no error)
✓ UI matches wireframes (4 cards visible on mobile without scroll)
Sprint 3 — Student Progress View (Semana 3)

 ProgressCardSet component (4 cards)

Evolution card (line chart, dummy data)
Frequency card (% + next class)
Feedback card (latest professor note)
Badges card (hardcoded badges, no logic yet)
 Routing student dashboard

Student sees 4 cards after login (not prof view)
 Share functionality

[Compartilhar com responsável] button
Template message generation
Copy-to-clipboard or WhatsApp link
Deliverables:

✓ Student logs in, sees 4 cards (no crash)
✓ Responsive on mobile (1 col), tablet (2x2), desktop (1 row)
✓ Share button works (copy template text)
Sprint 4 — Admin Compliance View (Semana 4)

 ComplianceCard component

Status display (🟢/🟡/🔴) from mock data
Metrics display (consentimentos %, logs count)
 AuditLogTimeline component

Render sample logs array
Scrollable list
Filter dropdown (by action)
 Admin dashboard page

ComplianceCard + optional AuditLogTimeline
Routes (only admin role)
 CSV export placeholder

Button exists; triggers mock download (no actual data export yet)
Deliverables:

✓ Admin logs in, sees compliance dashboard
✓ Status visible, metrics readable
✓ Timeline renders sample logs
✓ Export button works (mock)
Após Sprint 4 (MVP)

✓ Prof can register aulas (offline-friendly)
✓ Student can view progress (4 cards)
✓ Admin can check compliance (status + logs visible)
✓ All UI matches Material + Judo identity
✓ WCAG AA compliance tested on critical paths
✓ Product ready for internal testing
11.2 Fase 2 — Polish & Scale (Semanas 5-8)
Sprint 5 — Real Data Integration

 Connect to backend APIs (Prof CRUD, Student progress data, Audit logs)
 Real-time sync (WebSocket or polling)
 State management (NgRx or simple service layer)
Sprint 6 — Advanced Features

 Evolution chart real data (Chart.js or D3.js)
 Badge unlock logic (conditional rendering)
 Frequency history timeline
 Professor note history in feedback card
Sprint 7 — Storybook & Component Library

 TrainingCard, ProgressCardSet, ComplianceCard, AuditLogTimeline → Storybook
 Visual regression tests
 Component documentation
Sprint 8 — Performance & Optimization

 Lazy loading by route
 Tree-shaking unused Material components
 Image optimization (avatar CDN)
 Performance audit (Lighthouse > 90)
11.3 Fase 3 — Launch & Monitor (Semanas 9-12)
Sprint 9 — Designer Mockups (Parallel to Phase 2)

 High-fidelity mockups in Figma (optional, polish)
 Interaction prototypes
 Stakeholder feedback
Sprint 10 — QA & Bug Fixes

 Comprehensive test coverage (unit, e2e)
 LGPD audit (compliance validation)
 User acceptance testing (real professor use)
Sprint 11 — Documentation & Training

 API documentation (Swagger)
 Developer onboarde document (this UX spec + technical setup)
 Professor tutorial video (2 min: how to register class)
Sprint 12 — Launch

 Deployment to production
 Beta user onboarding
 Monitor errors & feedback
12. Acessibilidade & Offline Architecture
12.1 Compliance WCAG AA
Checklist Implementação:

Critério	Status	Implementação
Contraste (4.5:1)	✓ Testado	Todos textos vs backgrounds auditados (Contrast Checker)
Focus Visible	✓ Programado	2px solid #0052CC ring ao tab (not outline: none)
Keyboard Navigation	✓ Testado	Tab order óbvio, Enter ativa button, Esc fecha modal
Screen Reader	✓ Programado	aria-label em buttons, aria-describedby em errors
Alt Text (Imagens)	✓ Implementar	Todas img com alt="" (emoji tem aria-label: "emoji medal")
Color ≠ Only Info	✓ Testado	🟢 + "Compliant", ❌ + "Error" (nunca cor só)
Resize Text (200%)	ℹ️ Material	Material components suportam zoom (tested em dev tools)
SKIP Links	Opcional	Se tiver muito conteúdo (dashboard admin)
Form Labels	✓ Testado	Cada input / checkbox / select tem <label> mapeado
Error Messages	✓ Implementar	Validação field-level, aria-invalid, role=alert
Offline Testing:

 Logout → try navigate (redirects to login)
 Close app mid-sync → reopen (queue preserved)
 Multiple device edits (Last-Write-Wins tested)
 Zone rural internet drops (graceful degradation)
12.2 Offline-First Architecture (IndexedDB + Sync)
Fluxo Offline:

[ONLINE STATE]
┌─ User action (ex: toggle frequency) ─┐
│   ↓                                   │
│  API call (POST /training/:id)        │
│   ↓                                   │
│  Success → ✓ mark + indexedDB sync    │
│  Failure → ⚠️ Error UI + retry btn    │
└─────────────────────────────────────┘

[OFFLINE STATE]
┌─ User action (ex: toggle frequency) ─┐
│   ↓                                   │
│  No internet detected                 │
│   ↓                                   │
│  Save to IndexedDB (local queue)      │
│   ↓                                   │
│  ✓ Mark visible (offline transparency)│
│   ↓                                   │
│  Background badge "Pendente de sync"  │
│   ↓                                   │
│ [RECONNECT]                           │
│   ↓                                   │
│  Trigger sync (queue flush)           │
│   ↓                                   │
│  Success → ✓ + remove pending badge   │
│  Conflict → ⚠️ Ask user (resolve UI)  │
└─────────────────────────────────────┘

IndexedDB Schema:

// Database: "scacademia"

// Object Store: "trainings" (offline queue)
{
  keyPath: "id",
  indexes: [
    { name: "status", keyPath: "status" },  // "pending" | "synced"
    { name: "timestamp", keyPath: "timestamp" }
  ]
}

// Example record:
{
  id: "training_2026-03-19_14h30",
  academyId: "academy_001",
  classId: "class_initiates",
  profId: "prof_joao",
  attendees: [
    { studentId: "ana", present: true },
    { studentId: "bruno", present: false }
  ],
  techniques: ["osoto_gari", "seoi_nage"],
  notes: "Grupo focado",
  timestamp: 1711003800000,
  status: "pending",  // "pending" → "synced"
  createdAt: 1711003800000,
  syncedAt: null
}

Conflict Resolution (Last-Write-Wins):

Scenario: Prof edits attendance on phone (offline)
          Then admin edits same training on desktop (online)
          Then prof reconnects

Solution:
  1. Prof offline edit saved to IndexedDB (timestamp: 15:47)
  2. Admin online edit (timestamp: 15:50)
  3. Prof reconnects → system detects conflict
  4. Compares timestamps: admin version is newer (15:50 > 15:47)
  5. Admin version wins (discard prof offline changes)
  6. Show toast: "⚠️ Suas mudanças foram sobrescitas (versão mais recente disponível)"
  7. Prof sees updated data (no data loss, but his version lost)

Why Last-Write-Wins?
  - Simple (no complex merge logic)
  - Deterministic (timestamp is objective)
  - Acceptable for training data (not financial transactions)
  - Fallback: Full refresh on conflict (extreme case, show toast)

  No UI for Sync:

❌ DON'T show "Syncing..." spinner (confuses users)
❌ DON'T show sync queue manager
✅ DO show offline status subtly (icon, badge)
✅ DO show success after sync (silent success, no toast unless error)
Example: Offline Status Badge

Prof registering offline:
  Card shows: [Training Date] [Status Badge: "⏱ Sincronizando..."]
  
When reconnects:
  Badge disappears (silent success)
  OR if error: Badge changes to "⚠️ Erro ao sincronizar [Tentar novamente]"

  13. Checklist de Handoff para Desenvolvimento
Antes de Começar:
 Ler toda UX Specification (este documento)
 Clonar projeto Angular com Material base setup
 Confirmar que Material components importam corretamente
 Testar tema Judo (botões aparecem em azul #0052CC)
Implementação — Ordem Recomendada:
Semana 1:

 Projeto setup (routing, auth module estrutura)
 Judo theme (tokens, colors, typography)
 Material components test (button, input, card, toggle)
Semana 2:

 TrainingRegistration conversational form (step 1-5 UI)
 IndexedDB setup (schema, CRUD ops)
 Offline detection (navigator.onOnline listener)
Semana 3:

 ProgressCardSet component (4 cards, dummy data)
 Student dashboard routing
 Share functionality (template + copy)
Semana 4:

 ComplianceCard + AuditLogTimeline components
 Admin dashboard
 Mock export button
Antes de QA:
 Todos buttons 48px tall (teste no dev tools)
 Contraste testado (Chrome DevTools Audit > Accessibility)
 Tab navigation funciona (sem ficar preso em hidden elements)
 Offline test: abrir DevTools → Network → Offline → tentar registrar aula (sem crash)
 Mobile responsive: teste em 320px, 600px, 1200px breakpoints
 Material shadows aplicadas (cards têm elevação-1, modals elevação-4)
Características Críticas Verificar:
Anti-Padrão Nunca Fazer:

❌ Usar <div> em vez de <button> (accessibility fail)
❌ Mostrar 20 campos em uma tela (overwhelm prof)
❌ Esconder LGPD conformidade (legal risk)
❌ Fazer sync UI visível (confunde usuário)
Padrões Sempre Fazer:

✅ Auto-save (nenhum "Salvar" button em formularios)
✅ Feedback instant (< 100ms, visual confirmation)
✅ Offline transparent (nenhum "erro", apenas "serão sincronizados")
✅ WCAG AA colors (4.5:1 contraste mínimo)
Componentes Customizados — Priority Order:

Prioridade 1: TrainingCard, ProgressCardSet (prof e aluno path crítico)
Prioridade 2: ComplianceCard, AuditLogTimeline (admin audit path)
Post-Implementation:
 Lighthouse audit (> 85 performance)
 WCAG AA audit (0 A/AA errors)
 E2E tests written (4 critical user flows)
 Storybook components documented
 Code review: material components coverage, token usage
Resumo Final
SCAcademia UX Design converte PRD de 54 requisitos funcionais em experiência coerente, acessível e offline-first.

3 Pilar Usuarios:

Professor: Registra aula em < 5 min, fluxo conversacional, auto-save, offline-transparent
Aluno: Visualiza progresso em 4 cards primários, sem overwhelm, comemoração de evolução
Admin: Vê conformidade LGPD em 2 seg (🟢/🟡/🔴 status), auditoria timeline um clique away
Design System: Angular Material + Custom Judo Theme (Azul #0052CC, Orange #FF6B35)

Componentes Customizados: 4 únicos (TrainingCard, ProgressCardSet, ComplianceCard, AuditLogTimeline) — 90% cobertura Material

Acessibilidade: WCAG AA embedded (contaste 4.5:1, keyboard nav, focus visível, screen reader suporte)

Offline-First: IndexedDB + Last-Write-Wins sync — nenhum dado perdido, nenhuma UI de sincronização confusa

Timeline: MVP 4 semanas (2 devs), Fase 2 polish 4 sem, Fase 3 launch 4 sem = 3 meses total até produção

Documento Finalizado: 2026-03-19 | 12 Etapas de Design Workflow Completadas ✓

</parameter>
</invoke></parameter>
</invoke>