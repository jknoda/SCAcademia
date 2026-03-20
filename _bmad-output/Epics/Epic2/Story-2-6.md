Story 2.6: Conformidade LGPD — Exportar Relatório de Conformidade
Como um Admin auditando conformidade legal,
Quero exportar relatório que prove que Academia é LGPD-compliant,
Para que possa demonstrar para auditores/reguladores conformidade completa.

**Critérios de Aceitação:**

**Dado** que Admin acessa "Admin > Conformidade LGPD > Gerar Relatório"
**Quando** clica o botão
**Então** o sistema inicia processamento
**E** exibe: "Gerando relatório... (pode levar 2-3 min)"

**Dado** que processamento termina
**Quando** relatório é completo
**Então** exibe botão "Download PDF" com:
  - Cabeçalho: Academia SCAcademia, Data, Período
  
  - Seção 1: Estatísticas Gerais
    * Total de alunos
    * Total de menores (< 18 anos)
    * Total com consentimento atual
    * Total com consentimento expirado (warning)
  
  - Seção 2: Consentimentos
    * Tabela: Aluno | Data Consentimento | Versão | Saúde | Ética | Privacidade
    * Total aprovados: X/Y
    * Total pendentes: 0
  
  - Seção 3: Dados Deletados
    * Solicitações de deleção processadas: X
    * Solicitações pendentes: Y
    * Dados hard-deleted: [lista agregada]
  
  - Seção 4: Auditoria de Acesso
    * Acessos a dados sensíveis (últimos 90 dias)
    * Tentativas de acesso não autorizado: nenhuma (expected)
    * Anomalias detectadas: nenhuma (expected)
  
  - Seção 5: Encriptação & Segurança
    * Dados sensíveis encriptados: SIM (AES-256)
    * TLS em uso: SIM (HTTPS 1.2+)
    * Rate limiting ativo: SIM
    * Backup encriptado: SIM
  
  - Seção 6: Assinatura Legal
    * Assinado digitalmente por: Admin [Nome]
    * Data: [data]
    * Criptografia de assinatura: RSA-2048

**Dado** que relatório é completo
**Quando** Admin o baixa
**Então** arquivo PDF é gerado (não editável, apenas leitura)
**E** nome do arquivo: "LGPD_Conformidade_SCAcademia_2026-03-19.pdf"

**Dado** que há problemas de conformidade (ex: consentimento expirado)
**Quando** rel relatório é gerado
**Então** destaca em vermelho: "⚠️ ALERTA: X alunos com consentimento expirado"
**E** recomendação: "Contate responsáveis para renovar"

**Dado** que Admin quer scheduling automático de relatórios
**Quando** acessa "Configurações > Relatórios Automáticos"
**Então** consegue agendar: "Gerar relatório LGPD todo mês no dia 1"
**E** relatórios salvos em histórico para auditoria