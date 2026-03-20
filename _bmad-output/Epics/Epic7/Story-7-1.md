Story 7.1: Performance Benchmarking & SLO Compliance
Como Ops/Admin,
Quero monitorar que applicativo atinge SLOs definidos (< 2s registration, < 1s dashboard),
Para que garantir experiência de usuário de qualidade em produção.

Acceptance Criteria:

Given que aplicativo está em produção
When lighthouse CI roda a cada commit
Then deve validar:

First Contentful Paint (FCP) < 1.5s (mobile on 4G throttled)
Largest Contentful Paint (LCP) < 2.5s
Cumulative Layout Shift (CLS) < 0.1
Time to Interactive (TTI) < 3s
Given que Professor faz login
When credenciais autenticadas
Then dashboard deve renderizar em < 1 segundo (antes Next.js interactive)
And 4 cards devem exibir dados em < 2 segundos (lazy-loaded após interação)

Given que Student acessa página de progresso
When página carrega
Then skeleton loaders devem aparecer em < 100ms
And gráficos/dados finais devem exibir em < 2 segundos total

Given que Admin acessa dashboard analytics
When página carrega com 12 meses de dados
Then chart deve renderizar em < 2 segundos
And navegação entre meses deve ser instant (< 200ms)

Given que aplicativo roda em mobile 4G
When qualquer navegação ocorre
Then transição deve ser perceptível (não ficar congelado > 500ms sem feedback visual)
And skeleton loaders devem sempre aparecer para dados async

Technical Notes:

Setup Lighthouse CI em GitHub Actions (fail on budget breach)
Performance budget: JS bundle < 200KB (gzipped), CSS < 50KB
Lazy load routes com Next.js dynamic imports
Image optimization: WebP + srcset, max 100KB per image
Montar Web Vitals tracking via NextAuth/analytics
Referência FR: NFR4 (Performance SLOs) + NFR6 (User Experience consistency)

