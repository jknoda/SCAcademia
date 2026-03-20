## Web App Specific Requirements

### Arquitetura de Frontend (SPA)

**Framework & Stack:**
- Frontend: Angular (Single Page App)
- Backend: Node.js (Express ou similar)
- Database: PostgreSQL
- Deployment: Cloud (AWS/GCP/DigitalOcean)

**SPA Architecture Implications:**
- ✅ Aplicação carrega UMA VEZ
- ✅ Navegação entre páginas = requisições AJAX (rápido, sem reload)
- ✅ Estado mantido em cliente (until refresh)
- ⚠️ Primeira carga pode ser mais pesada (bundle size importante)
- ⚠️ SEO não funciona nativamente (OK, pois app é privado/login required)

**Build & Bundle:**
- Minificação de assets (JS, CSS)
- Tree-shaking de dependências não usadas
- Lazy loading de modules para reduzir bundle inicial
- Gzip compression em trânsito

### Suporte de Browsers & Devices

**Desktop Browsers:**
- Chrome (últimas 2 versões)
- Firefox (últimas 2 versões)
- Safari (últimas 2 versões)
- Edge (últimas 2 versões)

**Mobile & Tablet:**
- iOS Safari (iPad, iPhone) — últimas 2 versões
- Chrome Mobile — últimas 2 versões
- Android Firefox — últimas 2 versões
- ⚠️ Suporte especial para TABLETS (landscape + portrait)

**Resolução Mínima:**
- Desktop: 1024x768
- Tablet: 768x1024 (landscape)
- Mobile: 320x568 (stretch goal, não MVP)

### Mobile Responsiveness (Tablet-First)

**Design Responsive:**
- Layout adapta para tela de tablet (>= 768px)
- Touch-friendly: botões >= 48x48px
- Formulários otimizados para touch (sem hover, tap-able)
- Orientação landscape para tablet em treino (professor anotando)

**Offline Scenarios (Graceful Degradation):**
- Professor perde conexão enquanto preenche formulário?
- ✅ Dados são salvos localmente (localStorage/IndexedDB)
- ✅ Quando reconectar, sincronizar automaticamente (com conflito detection)
- ✅ Não perder dados

### Performance & UX

**Métricas de Performance:**
- Primeira carga (initial bundle): < 3s em conexão 4G
- Navegação entre telas: < 500ms
- Responsividade: Input feedback < 100ms
- Gráficos renderizam em < 1s mesmo com 100+ dados

**Lazy Loading & Code Splitting:**
- Cada feature area carrega seu módulo sob demand
- Admin dashboard carrega separado de student dashboard
- Gráficos carregam com dados pré-agregados

**Caching Estratégia:**
- Browser cache: 1 dia para assets estáticos
- API responses: Cache local com invalidação manual ou time-based (5-10 min)

### Acessibilidade (WCAG AA)

**Requisitos WCAG AA:**
- Color contrast: 4.5:1 para texto, 3:1 para elementos gráficos
- Teclado navegável: Tab/Shift+Tab, Enter/Space para ações
- Screen reader support: Aria labels, semantic HTML
- Focus visible: Sempre mostrar onde está o foco
- Alternativas de texto: Imagens, gráficos, ícones

**Implementação Específica:**
- Gráficos de evolução: Incluir tabela de dados como alternativa
- Botões: Não usar só cor (ex: "erro = vermelho") — incluir ícone ou texto
- Formulários: Labels associados aos inputs
- Notificações: Acessíveis via screen reader, não apenas visuais

### Sincronização de Dados (Eventual Consistency)

**Requisito de Delay:**
- Real-time NOT necessário
- Delay aceitável: 5-10 segundos
- Professor registra treino → Aluno vê em seu dashboard em ~10 segundos (OK)

**Implementação:**
- Polling: Cliente pede dados a cada 10-30s (simples, não requer WebSocket)
- OU Webhook: Backend notifica cliente quando dados mudarem
- Conflito resolution: Última escrita vence (ou implementar merge lógic)

**Offline + Online Transitions:**
- Detectar quando reconecta à internet
- Sincronizar dados locais com servidor
- Indicar ao usuário: "Offline", "Sincronizando", "Em sincronia"

### Requisitos de Segurança Web

**HTTPS & TLS:**
- Apenas HTTPS 1.2+ (sem HTTP)
- Certificate valid e não expired

**Cross-Site Request Forgery (CSRF):**
- CSRF tokens em todos os forms e AJAX requests
- SameSite cookies configuradas

**Cross-Site Scripting (XSS) Prevention:**
- Input sanitization (especialmalmente em anotações de professor)
- Output encoding
- Content Security Policy headers

**Authentication & Sessions:**
- JWT tokens (não cookie-based, para melhor mobile/SPA experience)
- Token refresh: Refresh token com validade maior, access token curta (15-60 min)
- Logout: Invalidate tokens no servidor

**API Rate Limiting:**
- Previne brute force e DoS
- Rate limit: 100 requests / minute por usuário
- Rate limit: 1000 requests / minute por IP

### Deployment & DevOps

**Hosting:**
- Cloud provider (AWS/GCP/DigitalOcean)
- Auto-scaling se traffic aumentar
- CDN para assets estáticos (melhor performance global)

**CI/CD:**
- Automated tests rodam em cada push
- Automated deploy para staging
- Manual approval para produção

**Monitoring:**
- Error tracking (Sentry ou similar)
- Performance monitoring (New Relic, Datadog, ou similar)
- Uptime monitoring (PagerDuty ou similar)
- Alertas para erro rates críticos