Story 8.4: Production Deployment & Rollback Automation
Como DevOps,
Quero deployar mudanças em produção com zero-downtime e rollback automático,
Para que garantir disponibilidade mesmo durante atualizações.

Acceptance Criteria:

Given que tenho versão aprovada para deploy (v1.2.3)
When clico "Deploy to Production" no GitHub Actions
Then deployment deve executar em stages:

Canary (10%): Deploy v1.2.3 para 10% de replicas, monitor 30 minutos
Validation: Check metrics (error_rate, latency, 500 errors = 0)
Progressive (50%): If canary OK, deploy para 50% de replicas
Full (100%): If 50% OK, deploy remaining 50%
Total time: < 10 minutos para rollout completo
Given que deployment em progresso
When healthcheck falha em alguma replica (5xx errors > 1%)
Then deve PAUSAR deployment
And notificar on-call: "Deployment paused - health check failed at 50% stage"
And criar incident ticket (link para logs/metrics)

Given que deployment pausado
When on-call reviewer analisa problema
Then pode:

[Resume] continuar deployment (problem resolvido)
[Investigate] access logs/metrics sem finalizar (timeout: 30 min)
[Rollback] reverter para versão anterior imediatamente
Given que clico [Rollback]
When rollback inicia
Then deve:

Stop traffic para pods novos (v1.2.3)
Restart pods antigos (v1.2.2)
Wait healthcheck pass on all old pods
Complete in < 2 minutos
Notify Slack: "🔄 Rollback completed. Now running v1.2.2"
Given que deployment completou 100%
When all replicas em versão nova (v1.2.3)
Then deve:

Verificar healthchecks novamente (final validation)
If OK: marcar como "Ready - Production"
If NOT: automatic rollback para versão anterior
Notificar resultado no Slack
Given que deployment bem-sucedido
When quero verificar que todos estão online
Then acesso Kubernetes dashboard / ArgoCD UI:

Ver todos replicas em v1.2.3
Logs tráfego normal
Métrics dentro SLO
Database migrations executaram (se relevante)
Given que deployment falho e rollback executou
When post-mortem process inicia
Then deve:

Capturar logs (últimos 30 minutos)
Capturar metrics (gráficos mostrando degradação)
Auto-create document: "Incident Report: v1.2.3 Deployment"
Assign para team review + RCA (Root Cause Analysis)
Technical Notes:

Implement usando Kubernetes Deployment + Rolling Update strategy
Or manage via ArgoCD (GitOps: git source of truth)
Healthchecks: liveness (restart dead pods) + readiness (remove from load balancer)
Database migrations: run pre-deployment, tested em staging
Feature flags: decouple deployment from feature release (can flip live)
Referência FR: NFR20 (Zero-downtime deployment), NFR21 (Automated rollback)