Story 5.4: Alertas em Tempo Real — Notificações Admin
Como um Admin,
Quero receber alertas quando anomalias ocorrem,
Para que eu reaja rapidamente a problemas de segurança.

**Critérios de Aceitação:**

**Dado** que algo anômalo ocorre no sistema
**Quando** sistema detecta
**Então** dispara alerta para Admin:
  - Push notification (se mobile)
  - Badge no dashboard (número vermelho)
  - Email (imediato ou agregado)

**Dado** que há anomalia crítica (ex: 5+ tentativas LOGIN não autorizado)
**Quando** detectada
**Então** alerta IMEDIATO:
  - Modal pop-up: "🚨 ALERTA DE SEGURANÇA"
  - "5 tentativas de login falhadas de IP: 192.168..."
  - "[Bloquear IP]" "[Investigar]" "[Ignorar]"

**Dado** que há consentimento vencendo em 7 dias
**Quando** sistema detecta
**Então** alerta PREVENTIVO (amarelo):
  - "⚠️ 5 alunos com consentimento expirando em 7 dias"
  - "[Contatar Responsáveis]"

**Dado** que backup falhou
**Quando** sistema detecta
**Então** alerta CRÍTICO (vermelho):
  - "🔴 Backup FALHOU às 02:30"
  - "[Tentar Novamente]" "[Contatar Suporte]"

**Dado** que Admin recebe muitos alertas
**Quando** acessa "Admin > Configurações > Alertas"
**Então** consegue customizar notificações:
  - Crítico: [ON/OFF] + método (push/email/sms)
  - Preventivo: [ON/OFF] + método
  - Info: [ON/OFF]

**Dado** que Admin quer mudo de notificações
**Quando** clica "[Silenciar por 1 hora]"
**Então** alertas são suprimidos nesse período
**E** depois retomam automaticamente

**Dado** que há alerta crítico pendente
**Quando** Admin vê dashboard
**Então** badge vermelho no bell icon: "🔴 3 alertas"
**E** clique mostra lista dos alertas
**E** [Espaço para ações rápidas]