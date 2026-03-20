Story 5.7: Dashboard de Saúde — Monitoramento Contínuo
Como um Admin,
Quero monitorar saúde do sistema em tempo real,
Para que eu saiba imediatamente se algo está offline.

**Critérios de Aceitação:**

**Dado** que Admin acessa "Admin > Dashboard > Saúde do Sistema"
**Quando** clica
**Então** exibe página: "Health Monitor"
**E** mostra status de cada componente:

  **COMPONENTES ESSENCIAIS:**
  - [🟢 API Server] Status: ✓ OK | Uptime: 99.8% | Response: 45ms
  - [🟢 Database] Status: ✓ OK | Connections: 12/100 | Last backup: 2h
  - [🟢 Cache (Redis)] Status: ✓ OK | Usage: 45% | Hits: 98.2%
  - [🟢 Email Service] Status: ✓ OK | Enviados: 234 | Failed: 0
  - [🟢 Storage] Status: ✓ OK | Used: 256MB / 1TB | Backups: OK

**Dado** que um componente está com problema
**Quando** sistema detecta
**Então** status muda:
  - [🟡 API Server] Status: ⚠️ DEGRADED | Response: 2500ms | Retries: 45
  - Admin recebe alerta imediato

**Dado** que um componente falha completamente
**Quando** sistema detecta
**Então** status muda:
  - [🔴 Database] Status: ✗ OFFLINE | Error: Connection timeout | Last: 10 min atrás
  - Audio alert (se Admin em aba)
  - Email crítico enviado

**Dado** que há métrica importante
**Quando** Admin visualiza
**Então** gráficos mostram timeseries de 24h:
  - API Response Time (linha verde)
  - CPU Usage (barra azul)
  - Memory Usage (barra roxa)
  - Database Connections (linha cinza)

**Dado** que Admin quer histórico completo
**Quando** clica "[Ver Histórico 30 dias]"
**Então** exibe gráficos maiores com dados dos últimos 30 dias
**E** identifica padrões (ex: "Picos toda sexta-feira às 16h")

**Dado** que há alerta de CPU alto
**Quando** Admin vê no dashboard
**Então** tooltip: "CPU 85%. Recomendação: Verificar queries lentas"
**E** link direto para: "Logs de Query Lenta"

**Dado** que há inatividade de backup
**Quando** Admin detecta erro
**Então** status backup fica 🟡 ATENÇÃO
**E** recomendação: "[Tentar Backup Manual]"