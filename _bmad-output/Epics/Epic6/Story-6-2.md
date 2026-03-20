Story 6.2: Fila de Sincronização & Ordenação Inteligente
Como Sistema,
Quero gerenciar uma fila ordenada de mudanças offline para sincronizar na ordem correta,
Para que evitar conflitos e manter integridade de dados durante sincronização.

Acceptance Criteria:

Given que tenho 15 ações pendentes offline (frequência, anotações, técnicas)
When reconecto à internet
Then o sistema deve sincronizar ações na ordem: [Usuário] → [Frequência] → [Técnicas] → [Anotações]
And processar cada ação de forma dependente (frequência antes de anotações associadas)

Given que estou sincronizando fila de 15 ações
When ocorre erro em ação #5 (conflito de versão)
Then o sistema deve pausar sincronização
And exibir modal "Conflito detectado - Revisar ação #5"
And fornecer opções: [Manter local] [Usar servidor] [Revisar ambas]

Given que seleciono [Manter local] em ação conflitada
When pressiono confirmar
Then o sistema deve sobrescrever versão do servidor com versão local
And registrar decisão (user action) em auditoria LGPD
And continuar sincronização com próximas ações

Given que tenho fila de 5 ações
When adiciono nova ação enquanto sincronização está em progresso
Then o sistema deve adicionar nova ação ao final da fila
And processar na sequência após ações atuais (não interromper sync atual)

Given que uma ação falhou 3 vezes com erro "400 Bad Request"
When sistema tenta quarta sincronização
Then o sistema deve pausar e exibir erro detalhado ao usuário
And marcar ação como "Erro Permanente - Requer Ação Manual"
And manter ação na fila (não descartar automaticamente)

Technical Notes:

Use transaction-based IndexedDB write (all-or-nothing per batch of 5 actions)
Implement exponential backoff: 1s → 2s → 4s → 8s (max 60s)
Log cada tentativa de sync em tabela queue_history (auditoria)
Se fila > 50 ações: notificar user "Muitas alterações pendentes - Sincronização longa"
Referência FR: FR52 (Sync queue management), FR53 (Conflict resolution infrastructure)