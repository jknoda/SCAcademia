Story 7.3: Bundle Optimization & Code Splitting
Como Desenvolvedor,
Quero que aplicativo carregue rápido através de code splitting e lazy loading eficiente,
Para que melhorar performance em connections lentas.

Acceptance Criteria:

Given que usuário acessa aplicação
When página inicial carrega
Then initial bundle deve ser < 80KB (gzipped)
And deve conter apenas código roteador + layouts + homepage components
And tudo mais deve ser lazy-loaded no primeiro acesso

Given que Professor navega para "Dashboard"
When clica no link
Then dashboard bundle (~40KB) deve ser carregado em background
And URL muda imediatamente (não aguardar JS download)
And prefetch link para próxima rota provável durante idle (RequestIdleCallback)

Given que aplicação é construída
When build falha em budget
Then CI deve falhar com mensagem clara: "Bundle '[feature]' exedeu 50KB by 15KB"
And listar todos chunks e seus tamanhos (transparent reporting)

Given que múltiplos componentes usam mesma lib (ex: marked para markdown)
Then lib deve ser extraída para chunk compartilhado (~ commons.js)
And tamanho compartilhado não deve duplicar em cada chunk

Given que aplicação roda no navegador
When Service Worker é carregado
Then deve cachear:

Initial bundle (indefinido)
Lazy chunks (cache por 30 dias, stale-while-revalidate)
Dados de API (cache por 5 min, stale-while-revalidate)
Given que Storage < 50MB disponível
When Service Worker tenta cachear novo chunk
Then deve evitar cache se ficar < 10MB free (abort)
**And** limpar chunks > 30 dias old (LRU)

Technical Notes:

Use next/dynamic() para lazy routes (automatic code splitting)
Configure bundle analyzer (next-bundle-analyzer)
Setup performance budget in CI failing on breach
Tree-shake unused exports (production build only)
Implement granular component chunking (avoid one-size-fits-all chunks)
Referência FR: NFR4 (Performance - bundle optimization), NFR5 (Load time < 2s)

