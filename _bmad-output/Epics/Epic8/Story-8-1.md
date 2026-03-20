Story 8.1: Docker Containerization & Image Optimization
Como DevOps,
Quero containerizar aplicação (frontend + backend) em Docker com multi-stage builds,
Para que ter reprodutibilidade, escalabilidade e consistent deployment.

Acceptance Criteria:

Given que tenho código-fonte do projeto
When rodo docker build -t scacademia:latest .
Then deve gerar imagem < 300MB (frontend final image)
And backend image < 200MB (node:18-alpine base)
And build deve completar em < 5 minutos
And ambas imagens devem ser based em Alpine (minimal size)

Given que rodo frontend Dockerfile
When build executa
Then stages deve ser:

Build stage (node:18): npm install + npm run build (build artifacts em /out)
Serve stage (node:18-alpine): copy /out, setup nginx, expose 3000
ZERO source code em final image (production-only artifacts)
Given que rodo backend Dockerfile
When build executa
Then stages deve ser:

Build stage: npm install + npm run tsc (compile TS to JS)
Serve stage: node:18-alpine + apenas /dist folder + node_modules
ENV vars deve ser documentados (PORT, DB_HOST, etc)
Health check deve ser implementado (/health endpoint)
Given que rodo imagem em produção
When container inicia
Then logs deve ser JSON formatted (structured logging)
And health check endpoint deve responder (< 1s)
And graceful shutdown em SIGTERM deve ser implementado (flush pending requests)

Given que rodo ambas imagens
When componho docker-compose.yml
Then devo ter:

frontend service (port 3000)
backend service (port 4000)
postgres service (port 5432)
redis service (port 6379, cache)
volumes para data persistence
networks para inter-service communication
Given que testo docker-compose localmente
When rodo docker compose up -d
Then todos serviços devem health-check pass
And frontend deve acesso backend via http://backend:4000
And backend deve acesso postgres via postgres://postgres:5432
And dados devem persist após docker compose down (volumes preserved)

Technical Notes:

Multi-stage Dockerfile (reduce final image size)
Alpine base para production (minimal exploitable surface)
Non-root user para container security (USER node)
Resource limits em docker-compose (memory: 512m, cpus: 1)
Vulnerability scanning com Trivy (fail on HIGH/CRITICAL)
Referência FR: Infrastructure automation, NFR21 (Deployment reproducibility)

