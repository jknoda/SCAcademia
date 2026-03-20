Epic 5: Controle Admin — Monitoramento & Conformidade
Overview do Epic 5
Objetivo: Admins monitoram academia, auditam acessos de usuários, garantem conformidade LGPD e recebem alertas de anomalias.

FRs Cobertos: FR40-FR50 (11 requisitos)

FR40-FR44: Logs estruturados, auditoria, monitoramento de acessos
FR45-FR47: Alertas de anomalias, gestão de usuários
FR48-FR50: Backup automático, disaster recovery, relatórios compliance
NFRs Relevantes:

Auditoria: Logs append-only, imutáveis
Performance: Dashboard < 1s mesmo com 1000+ logs
Compliance: Retenção de logs 12 meses min, 8 anos archive

📊 Epic 5 Summary
Story	Título	Funcionalidade	Tamanho
5.1	Dashboard Admin	Overview saúde academia	Médio
5.2	Auditoria LGPD	Timeline acessos com filtros	Grande
5.3	Relatório Conformidade	Exportação regulatória	Médio
5.4	Alertas Tempo Real	Notificações anomalias	Pequeno
5.5	Gestão Usuários	Criar, editar, bloquear	Médio
5.6	Backup & Recovery	Automático + disaster recovery	Grande
5.7	Health Monitor	Monitoramento contínuo	Pequeno
