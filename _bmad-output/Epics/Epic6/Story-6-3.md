Story 6.3: Resolução de Conflitos — Last-Write-Wins
Como Sistema,
Quero resolver automaticamente conflitos de mesma ação modificada em client + server,
Para que manter sincronização sem travamento do usuário.

Acceptance Criteria:

Given que Professor modifica nota de aluno offline (16:45:30 local)
When servidor recebe nota do Admin modificada (16:42:00 server-time, but 16:45:20 server-received)
Then o sistema deve comparar timestamps (16:45:30 > 16:45:20)
And adotar versão Professor (timestamp mais recente)
And registrar conflito resolvido em auditoria (WHO: Professor, WHAT: Last-Write-Wins, WHEN: sync timestamp)

Given que Professor e Admin modificam frequência de mesmo aluno (within 5 seconds clock-skew)
When sincronização ocorre
Then o sistema deve usar server_received_timestamp como tiebreaker (não local timestamp)
And exibir toast notificação: "Frequência sincronizada (versão admin aplicada)"

Given que versão local foi descartada em conflito Last-Write-Wins
When Professor abre modal "Histórico de Mudanças"
Then o sistema deve exibir entrada: "Conflito resolvido em [timestamp] - Versão descartada: [professor_value]"
And permitir Professor revert para versão local se desejar

Given que sistema detecta clock skew > 10 segundos entre client e server
When sincronização inicia
Then o sistema deve exibir aviso: "Relógio local desalinhado - Sincronização com cuidado"
And usar exclusivamente server timestamps para resolução de conflitos (ignorar local timing)

Technical Notes:

Store both client_timestamp + server_received_timestamp em queue table
Tiebreaker order: server_received_timestamp > server_timestamp > client_timestamp
Log resulução em audit_log com {old_value, new_value, conflict_reason}
If conflict, notify user async (not blocking sync)
Referência FR: FR53 (Conflict resolution - Last-Write-Wins pattern), FR52 (Sync queue handling)

