Story 5.6: Backup & Disaster Recovery — Automático & Manual
Como um Admin,
Quero garantir que dados estão backed up regularmente,
Para que eu possa recuperar dados em caso de desastre.

**Critérios de Aceitação:**

**Dado** que Admin acessa "Admin > Backup & Recovery"
**Quando** clica
**Então** exibe página com seções:

  **SEÇÃO 1 — STATUS DE BACKUP AUTOMÁTICO**
  - Frequência: "Diariamente às 02:30"
  - Última backup: "19 Mar 2026 - 02:30:15" (✓ Sucesso)
  - Próxima backup: "20 Mar 2026 - 02:30"
  - Último backup size: "256 MB"
  - Retenção: "30 dias (rotação automática)"

  **SEÇÃO 2 — HISTÓRICO DE BACKUPS (Últimos 10)**
  - Data | Hora | Tamanho | Status | Ações
  - "19 Mar" | "02:30" | "256 MB" | "✓ OK" | "[Download] [Testar Restore]"
  - "18 Mar" | "02:30" | "254 MB" | "✓ OK" | "[Download] [Testar Restore]"
  - [... mais backups]

  **SEÇÃO 3 — BACKUP MANUAL (On-Demand)**
  - Botão: "[Fazer Backup Agora]"
  - Checkbox: "Incluir dados históricos completos"
  - Checkbox: "Encriptar backup com senha"
  - Status: "Pronto. Última demanda: [data]"

**Dado** que Admin clica "[Fazer Backup Agora]"
**Quando** clica
**Então** sistema inicia:
  - "Processando backup... (pode levar 5-10 min)"
  - Barra de progresso
  - "Não feche essa página"

**Dado** que backup completa
**Quando** termina
**Então** exibe:
  - "✓ Backup concluído"
  - "Tamanho: [size]"
  - "Nome: backup_2026-03-19_15-47.sql.gz"
  - Botão: "[Download agora]" (expira em 24h)

**Dado** que Admin quer testar restore
**Quando** clica "[Testar Restore]" num backup antigo
**Então** exibe modal: "Testar restauração em ambiente sandbox?"
**E** "Isso NÃO afeta produção"
**E** se confirma: sistema clona backup para ambiente teste
**E** Admin consegue verificar dados após 5 min

**Dado** que há desastre e precisa restore
**Quando** Admin clica "[Restaurar Este Backup]"
**Então** exibe AVISO CRÍTICO (vermelho grande):
  - "⚠️ AÇÃO IRREVERSÍVEL"
  - "Isso SOBRESCREVERA todos dados atuais com [data backup]"
  - "Dados posteriores a [data] serão PERDIDOS"
  - Campos: "Digite sua senha para confirmar" + "Código autenticação 2FA"
  - Botão: "[RESTAURAR AGORA]" (vermelho, desabilitado até preencher)

**Dado** que Admin confirma restore
**Quando** valida senha + 2FA
**Então** inicia processo:
  - "Restaurando backup [data]..."
  - Barra de progresso
  - Sistema fica lentido (não bloqueado)
  - Email goto Admin: "Processo restore iniciado às [hora]"

**Dado** que restore completa
**Quando** finaliza
**Então** exibe:
  - "✓ Restauração Completa"
  - "Banco de dados está em [data backup]"
  - "RPO (Dados perdidos desde então): até [data últmo backup]"
  - Email: "Recovery bem-sucedido. Verifique dados à "

**Dado** que há encriptação de backup
**Quando** Admin marcou "Encriptar" no backup manual
**Então** arquivo é AES-256 + senha do admin
**E** para restaurar, Admin precisa fornecer senha

**Dado** que Admin quer reter backup além de 30 dias
**Quando** clica "[Arquivar Permanente]"
**Então** backup é movido para storage S3/GCS
**E** custo menor (archive storage)
**E** ainda pode ser restaurado (requer 4h para retrieve)