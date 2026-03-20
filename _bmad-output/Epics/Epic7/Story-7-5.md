Story 7.5: Produção Readiness Checklist
Como Tech Lead,
Quero ter um processo claro de validação antes de deploy à produção,
Para que minimizar risco de issues em production.

Acceptance Criteria:

Given que quero fazer deploy à produção
When abro PR checklist
Then devo validar:
✅ Todos testes E2E passam (cypress run)
✅ Bundle size dentro budget
✅ Lighthouse CI score ≥ 90
✅ Accessibility violations = 0
✅ Security audit (npm audit, SCA) = 0 criticals
✅ Performance monitore está funcionando (Prometheus scraping OK)
✅ Database backups tudo OK
✅ Disaster recovery plan testado (last 30 dias)
✅ Alertas configurados (CPU, memory, error_rate, latency)
✅ Rollback plan documented e testado

Given que rodo checklist
When encontro issue (ex: test falha)
Then devo marcar de RED e bloquear deploy
And descrever ação necessária (ex: "Revisar test_auth failing")

Given que todas ✅ boxes marcadas
When clico "Ready for Deploy"
Then deve criar tag git auto (ex: v1.2.3-staging-ready)
And trigger deploy automático para staging (não produção)

Given que staging deployment completa
When alertas/metrics mostram tudo OK (1 hora de smoke test)
Then manual approval necessário para produção (reviewer)
And após aprovação, trigger produção deploy (10% inicial, then 100% after 30min health check)

Given que deployment falha ou rollback necessário
When error crítico detectado em produção (> 1% error_rate)
Then automated rollback triggers (volta versão anterior)
And incident alert envia para on-call team
And post-mortem é criado automaticamente

Technical Notes:

Implement em GitHub Actions (checklist em PR template)
Automated enforcement: CI fails if any check missing
Manual approval stage antes de prod deploy
Canary deploy: 10% → monitor 30min → 100%
Automatic alerting on deployment: SMS + Slack
Referência FR: NFR19 (Release readiness), NFR20 (Deployment safety gates)

