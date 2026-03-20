Story 3.8: Sincronização Offline — Queue & Conflict Resolution
Como um Professor trabalhando offline,
Quero que meus dados sejam salvos localmente e sincronizem automaticamente,
Para que não perca nenhum registro mesmo sem internet.

**Critérios de Aceitação:**

**Dado** que Professor está em zona com internet intermitente
**Quando** clica "Confirmar & Salvar"
**Então** sistema detecta: "Sem conexão"
**E** salva em IndexedDB (sync_queue table):

{
id: "training_2026-03-19_15h30",
action: "CREATE",
resource: "training",
payload: { training_data },
timestamp: 1711003800000,
status: "pending"
}

**E** UI exibe: "✓ Salvo localmente (sincronizará quando conectar)"

**Dado** que Professor tem múltiplos registros offline
**Quando** internet retorna
**Então** sistema detecta conexão automáticamente
**E** inicia sincronização: "Sincronizando 3 registros..."
**E** envia queue ao servidor em batch

**Dado** que servidor processa batch
**Quando** recebe
**Então** valida cada registro:
- Dados completos? SIM
- Nenhum conflito? SIM
- Aluno ainda existe? SIM

**Dado** que validação passa
**Quando** servidor persiste
**Então** registra: training.id, training_attendance, performance_notes
**E** retorna confirmação: "3/3 sincronizados"

**Dado** que há conflito (ex: admin editou treino enquanto offline)
**Quando** servidor detecta:
- Local timestamp: 15:30
- Server timestamp: 16:00 (admin editou)
**Então** aplica Last-Write-Wins: server ganha
**E** cliente recebe a versão server
**E** UI mostra: "⚠️ Conflito resolvido: versão mais recente do servidor aplicada"

**Dado** que sincronização é bem-sucedida
**Quando** completa
**Então** IndexedDB queue é limpo (registros movidos para "synced=true")
**E** UI exibe: "✓ Tudo sincronizado"
**E** nenhuma notificação intrusiva (auto-resolve silencioso)

**Dado** que erro persiste mesmo após retry
**Quando** 5 tentativas falham
**Então** exibe: "Erro ao sincronizar. Seus dados estão salvos. [Tentar Novamente]"
**E** notify Admin para debug

**Dado** que data é muito antiga offline
**Quando** Professor sincroniza depois de 2 semanas
**Então** sistema ainda aceita (não rejeita por "muito velho")
**E** timestamp original é mantido (não sobrescrito)