Story 4.7: Sistema de Notificações — Motivação Proativa
Como um Aluno,
Quero receber notificações motivadoras sobre meu progresso,
Para que eu seja motivado a continuar treinando (sem ser assustado).

**Critérios de Aceitação:**

**Dado** que Aluno desbloqueou novo badge
**Quando** milestone é atingido
**Então** sistema gera notificação:
  - Push notification (se habilitado): "🏅 Você desbloqueou Faixa Amarela!"
  - In-app toast (canto inferior direito): aparece por 5 seg
  - Email (1x por dia, agregado): "Seus badges esta semana: [link]"

**Dado** que Aluno alcançou 30 dias sem faltar
**Quando** streak atinge 30 dias
**Então** notificação especial: "🔥 Parabéns! 1 mês sem faltar! 🎉"
**E** convite para compartilhar (optional)

**Dado** que Aluno tem frequência abaixo de 60%
**Quando** sistema processa semanal
**Então** notificação suave: "⚠️ Sua frequência está em 50%. Que tal treinar mais semana que vem?"
**E** link direto para: "Agendar próxima aula"

**Dado** que Aluno completou primeira aula
**Quando** milestone inicial
**Então** notificação celebratória: "🎓 Bem-vindo! Você completou sua primeira aula!"

**Dado** que novo comentário positivo foi adicionado
**Quando** professor cria
**Então** notificação: "💬 Prof. João deixou um comentário: '[truncated]'"
**E** link para ler completo

**Dado** que Aluno quer controlar frequency
**Quando** acessa "Configurações > Notificações"
**Então** sliders permitem controlar:
  - Badges: [ON/OFF]
  - Frequência: [ON/OFF]
  - Comentários: [ON/OFF]
  - Motivation Reminders: [ON/OFF]

**Dado** que Aluno desligou notificações
**Quando** acessa dashboard
**Então** ainda vê badges/progresso visualmente
**E** apenas não recebe notificações (não intrusivo)

**Dado** que é quinta-feira (dia antes aula)
**Quando** sistema processa lembretes
**Então** notificação suave: "⏰ Lembrete: Sua aula é amanhã às 15:00"
**E** link: "Confirmar presença"

**Dado** que é dia de aula
**Quando** horário está próximo (2h antes)
**Então** notificação: "🥋 Sua aula começa em 2 horas! Já está pronto?"