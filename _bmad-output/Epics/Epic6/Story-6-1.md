Story 6.1: Detecção de Conectividade & Cache Local
Como Professor ou Aluno,
Quero que o aplicativo continuar funcionando mesmo quando perder conexão com a internet,
Para que possa registrar treinos ou visualizar dados sem interrupção.

Acceptance Criteria:

Given que estou usando o aplicativo com conexão estável
When a conexão de internet é perdida
Then o aplicativo deve detectar em < 2 segundos (usando fetch + timeout logic)
And exibir indicador visual discreto no canto superior (Azul #0052CC, "Offline - Sincronizando")

Given que estou em modo offline
When acesso dados já visualizados (turma, histórico de treinos, progresso do aluno)
Then o aplicativo deve exibir dados do IndexedDB sem delay
And exibir badge "Dados locais" em gesto discreto (without alarming user)

Given que estou em modo offline
When tento acessar dados nunca sincronizados antes (ex: novo aluno)
Then o aplicativo deve exibir mensagem "Não disponível offline - Reconecte para carregar"
And fornecer link para tentar reconexão manual

Given que estou offline por > 5 minutos
When reconecto à internet
Then o aplicativo deve detectar reconexão em < 1 segundo
And iniciar sincronização automática (background)
And atualizar indicador para "Sincronizando..." (spinner Azul)

Given que estou em modo offline
When realizo múltiplas ações (ex: marcar frequência em múltiplos alunos)
Then o aplicativo deve armazenar todas as ações no IndexedDB com timestamp local
And cada ação marcada com status "Pendente Sincronização" (ícone ⏳)

Technical Notes:

Use Navigator.onLine + fetch timeout (3s) para detecção robusta
Store versioned schema em IndexedDB v3 (migração automática)
Index por timestamp + action_id para query performance
Limite cache a 100MB (storage.estimate API)
Clear cache se storage quota < 10%
Referência FR: FR51 (Offline data persistence), FR52 (Sync queue infrastructure)

