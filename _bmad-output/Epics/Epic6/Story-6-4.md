Story 6.4: Lógica de Retry & Falhas Permanentes
Como Professor,
Quero que o aplicativo tente novamente sincronizar automaticamente quando a conexão volta,
Para que seus dados não fiquem órfãos indefinidamente.

Acceptance Criteria:

Given que tenho 8 ações pendentes offline
When reconecto após 3 minutos offline
Then o sistema deve tentar sincronizar com retry automático: 1s → 2s → 4s → 8s
And após 4 tentativas sem sucesso, aguardar 30s antes de próxima onda de retries

Given que ação retorna erro "409 Conflict - Versão superada"
When sistema tenta retry
Then o sistema deve primeiro fazer refresh de versão do servidor
And recalcular conflito com versão atualizada
And tentar sincronizar novamente com versão resolvida

Given que servidor retorna "500 Internal Server Error" 3 vezes
When 4ª tentativa de retry ocorre
Then o sistema deve marcar ação como "Sincronização Falhando - Contate Suporte"
And exibir modal: "Problema persistente. Detalhes: [error_message]. Ref: [error_id]"
And manter ação na fila (não descartar)

Given que ação falha com erro "401 - Token Expirado"
When sistem tenta retry
Then o sistema deve fazer silent refresh do JWT token (background)
And retentar com novo token (transparente ao usuário)
And se refresh falhar, exibir "Login Expirou - Faça login novamente"

Given que internet reconecta após estar offline > 24 horas
When sincronização inicia
Then o sistema deve validar que tokens ainda estão válidos
And se token expirado, forçar re-autenticação antes de sincronizar
And continuar sincronização após re-auth bem-sucedida

Technical Notes:

Use WorkManager (mobile) / Background Sync API (web) para retry persistente
Exponential backoff capping at 5 minutes between waves
After 10 failed retries: escalate to "needs_manual_review" flag (UI notification)
Log cada retry com timestamp + error_code em queue_retry_log table
Referência FR: FR52 (Sync queue with retry), FR51 (Offline persistence through retries)