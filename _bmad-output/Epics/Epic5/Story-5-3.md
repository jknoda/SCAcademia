Story 5.3: Relatório de Conformidade LGPD — Exportação Regulatória
Como um Admin auditando conformidade,
Quero gerar relatório oficial de conformidade LGPD,
Para que eu possa fornecer aos reguladores/auditores externos.

**Critérios de Aceitação:**

**Dado** que Admin acessa "Admin > Conformidade > Gerar Relatório"
**Quando** clica
**Então** exibe modal: "Gerar Relatório de Conformidade LGPD"
**E** opções:
  - Formato: [PDF] [Excel] [JSON]
  - Período: [Este mês] [Últimos 3 meses] [Custom]
  - Asinar Digitalmente: [Sim] [Não]

**Dado** que Admin escolhe período e clica "Gerar"
**Quando** processa
**Então** exibe: "Processando... (pode levar 2-3 minutos para dados grandes)"
**E** barra de progresso

**Dado** que processamento completa
**Quando** relatório está pronto
**Então** exibe botão download: "📥 Obter PDF"
**E** nome: "LGPD_Compliance_[Academia]_[Periodo].pdf"

**Dado** que PDF é gerado
**Quando** abre
**Então** contém seções:

  **PÁGINA 1 — CAPA**
  - Logo Academia
  - Título: "Relatório de Conformidade LGPD"
  - Data: "19 Mar 2026"
  - Período: "01 Jan - 31 Mar 2026"
  - Assinado por: [Admin Nome]

  **PÁGINA 2 — RESUMO EXECUTIVO**
  - Compliance Score: 97%
  - Status: ✓ COMPLIANT
  - Principais métricas:
    * Total alunos: 42
    * Com consentimento: 42 (100%)
    * Dados deletados: 0
    * Tentativas acesso negado: 0
    * Backups completados: 13/13
  
  **PÁGINA 3 — CONSENTIMENTOS**
  - Tabela: Aluno | Data Consentimento | Versão | Vigência
  - Total aprovados: 42
  - Total pendentes: 0
  - Total expirados: 0

  **PÁGINA 4 — AUDITORIA DE ACESSOS**
  - Total de acessos: 1247
  - Acessos bem-sucedidos: 1247 (100%)
  - Acessos negados: 0
  - Anomalias: 0
  - Tabela de acessos críticos (últimos 20)

  **PÁGINA 5 — DADOS DELETADOS**
  - Solicitações de deleção: 0
  - Processadas: 0
  - Pendentes: 0
  - Dados hard-deleted: None
  
  **PÁGINA 6 — SEGURANÇA TÉCNICA**
  - Encriptação: ✓ AES-256 em repouso
  - TLS: ✓ 1.2+ em trânsito
  - Backup: ✓ Diário, 30 dias retenção
  - Rate limiting: ✓ 100 req/min
  - Logs imutáveis: ✓ Append-only
  
  **ÚLTIMA PÁGINA — ASSINATURA**
  - Assinado por: [Admin Nome]
  - Data: [data geração]
  - Criptografia: RSA-2048
  - Hash: [SHA-256 do documento]
  - Observação legal: "Este relatório é válido por 12 meses"

**Dado** que Admin quer assinar digitalmente
**Quando** marca "Sim" antes de gerar
**Então** relatório é assinado com certificado digital
**E** reguladores conseguem verificar autenticidade

**Dado** que há problemas de conformidade
**Quando** relatório é gerado
**Então** destaca em VERMELHO seções problemas
**E** recomendações de correção incluídas
**E** "⚠️ STATUS: Não-Compliant - Ação Requerida"

**Dado** que Admin gera múltiplos relatórios
**Quando** cria histórico
**Então** todos ficam acessíveis em: "Admin > Relatórios"
**E** com datas e status