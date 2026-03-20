Story 5.1: Dashboard Admin — Overview de Saúde da Academia
Como um Admin,
Quero visualizar um dashboard que mostra saúde geral da academia,
Para que eu tenha visão rápida de qualquer problema.

**Critérios de Aceitação:**

**Dado** que um Admin faz login
**Quando** acessa "Admin > Dashboard"
**Então** exibe dashboard com titulo: "Saúde da Academia"
**E** logo aplicação, data/hora último refresh

**Dado** que dashboard carrega
**Quando** renderiza
**Então** exibe 4 seções principais:

  **SEÇÃO 1 — STATUS GERAL (Topo, Grande)**
  Status Visual: 🟢 OPERACIONAL
  Compliance Score: 97% (cor verde)
  "Academia Judo SC - Última auditoria: HOJE"
  Botão: "[Auditoria Completa]"

  **SEÇÃO 2 — MÉTRICAS CRÍTICAS (4 Cards)**
  Card A: Usuários Ativos
    → "42 usuários" (28 alunos, 10 prof, 3 admin, 1 responsável)
    → Tendência: "↑ +3 novos esta semana"
  
  Card B: Consentimentos
    → "42/42 (100%)" com consentimento atual
    → Alertas: "0 expirados"
  
  Card C: Treinos Registrados
    → "156 treinos" (este mês)
    → Média: "5.2 por dia"
  
  Card D: Backup Status
    → "✓ Backup OK" (hoje, 02:30)
    → Próximo: "Amanhã, 02:30"

  **SEÇÃO 3 — ALERTAS RECENTES (Se houver)**
  Se nenhum: "✓ Nenhum alerta ativo"
  Se houver:
    → 🔴 "5 alunos com consentimento vencendo em 7 dias"
    → 🟡 "Sincronização de dados com delay (2 min)"
    → 🟡 "2 tentativas de login falhadas em último 1h"

  **SEÇÃO 4 — AÇÕES RÁPIDAS (Botões)**
  "[Ver Logs Auditoria]"
  "[Exportar Relatório LGPD]"
  "[Gerenciar Usuários]"
  "[Configurações]"

**Dado** que Admin está no dashboard
**Quando** hover sobre métrica
**Então** tooltip explicativo: "Compliance Score: Mede conformidade LGPD (consentimentos, dados, acesso)"

**Dado** que há alerta crítico (ex: backup falhou)
**Quando** dashboard detecta
**Então** status muda para: 🟡 ATENÇÃO REQUERIDA
**E** alerta fica em destaque vermelho (scroll automático)

**Dado** que Admin clica em Status
**Quando** clica no card principal
**Então** abre página detalhada "Status Sistema"
**E** mostra histórico de status últimos 7 dias (uptime %)

**Dado** que Admin quer refresh manual
**Quando** clica "[Atualizar]" ou F5
**Então** dados são refrescados em < 1s
**E** timestamp mostra: "Atualizado em [data/hora]"

**Dado** que é primeira vez do Admin acessando
**Quando** dashboard carrega
**Então** exibe tour/onboarding suave
**E** setas apontando cada seção: "Seu dashboard do SCAcademia"
**E** botão: "[Pular Tour]" se quer ignorar