Story 8.2: CI/CD Pipeline Setup (GitHub Actions)
Como Developer,
Quero que toda mudança passe por automated testing + build + deploy automaticamente,
Para que minimizar human error e acelerar feedback loop.

Acceptance Criteria:

Given que faço push para branch feature
When push chega no GitHub
Then GitHub Actions workflow deve trigger automaticamente:

Fetch code
Setup Node v18 + cache dependencies
Run unit tests (jest)
Run E2E tests (cypress)
Run linting (eslint)
Run security scan (npm audit, SCA)
Build docker images
Push para registry (ghcr.io)
Deploy para staging
Run smoke tests em staging
(Tudo deve completar em < 15 minutos)
Given que testes falham
When workflow roda
Then deve falhar com status RED
And notificar autor do PR com detalhes
And bloquear merge até fix (branch protection)

Given que todos testes passam
When PR é mergiado para main
Then deve trigger deployment automático:

Build imagens com tag vX.Y.Z-prod (extracted from package.json)
Push para production registry
Deploy para staging (canary: subset of replicas)
Monitor metrics por 30 minutos
Se OK: deploy 100% produção (rolling deployment)
Se erro: automated rollback para versão anterior
Given que deployment falha
When error detectado após deploy
Then deve trigger automatic rollback
And notificar on-call team (Slack + SMS)
And criar incident ticket automaticamente

Given que job falha
When erro ocorre (ex: docker push fails)
Then deve ter retry logic (3 tentativas com exponential backoff)
And se ainda falhar: bloquear merge / notify team

Given que quero fazer rollback manual
When acesso GitHub Actions console
Then devo ver botão "Rollback to vX.Y.Z-previous"
And clicking deve trigger deployment da versão anterior
And completar em < 5 minutos

Technical Notes:

.github/workflows/ci-cd.yml com múltiplos jobs (parallelized)
Cache npm dependencies (~3 min savings per run)
Matrix testing: Node 18 + latest browsers
Secrets management via GitHub Secrets (DB_PASSWORD, etc)
Deployment via blue-green ou rolling strategy
Referência FR: NFR20 (Automated deployment), NFR21 (CI/CD pipeline)

