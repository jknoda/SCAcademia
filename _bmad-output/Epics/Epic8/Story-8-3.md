Story 8.3: Monitoring & Alerting Infrastructure
Como Ops/Admin,
Quero ter visibilidade completa em saúde da aplicação através de metrics, logs, traces,
Para que detectar problemas antes que user experiencem.

Acceptance Criteria:

Given que aplicação roda em produção
When Prometheus scraper executa a cada 15 segundos
Then deve coletar metrics:

HTTP requests (request_count, response_time, error_rate)
Application (active_users, sessions, auth_failures)
Database (connections, query_time, slow_queries)
System (cpu%, memory%, disk%, network io)
All metrics com dimensões (service, endpoint, method, status)
Given que coletei 30 dias de metrics
When visualizo em Grafana dashboard
Then devo ver:

🟢 Green: all components healthy, requests < 200ms, error_rate < 0.1%
🟡 Yellow: degradation (requests 200-1000ms, error_rate 0.1-1%)
🔴 Red: failure (requests > 1000ms, error_rate > 1%, service down)
Histórico heatmaps mostrando padrões (quando é peak load?)
Given que aplicação gera logs (stderr, stdout)
When logs fluem para centralized logging (Loki)
Then devo ser capaz:

Query por labels (service=backend, pod=pod-1, level=ERROR)
Ver full context (timestamps, stacktraces, request_id)
Search full-text (grep-like) em corpus de logs
Alertar se error_rate > threshold
Given que ocorre evento crítico (ex: database down)
When alert triggers
Then devo receber notificação via:

Slack (channel #alerts) em tempo real
SMS para on-call engineer (phone number)
PagerDuty incident criado automaticamente
Slack thread deve ter runbook link ("See runbook: ...")
Given que sou on-call
When clico Slack alert
Then devo ter:

Contexto (o quê falhou, onde, quando)
Histórico (aconteceu antes? padrão?)
Ações recomendadas (escalation, rollback, etc)
Links diretos (Grafana, logs, debugging tools)
Given que evento resolvido (service recupera)
When Prometheus detecta recovery
Then alert deve ser auto-resolved (not manual)
And notificar Slack que "✅ Service recovered at [timestamp]"

Given que quero customizar severity
When defino alert rule
Then posso especificar: critical, warning, info
And cada severity tem timeout antes de escalate (warning: 15min → crítica)

Technical Notes:

Stack: Prometheus (metrics) + Loki (logs) + Grafana (visualization) + AlertManager (routing)
Deploy stack em Kubernetes (Helm charts) ou Docker Compose
SLO-based alerting (not just threshold-based)
Runbooks linkados em cada alert template
On-call rotation via PagerDuty integration
Referência FR: NFR18 (Real-time monitoring), NFR19 (Production observability)

