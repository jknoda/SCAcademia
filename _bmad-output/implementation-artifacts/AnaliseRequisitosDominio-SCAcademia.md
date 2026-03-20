## Domain-Specific Requirements

### Conformidade Legal & LGPD

**LGPD Compliance (Lei Geral de Proteção de Dados - Brasil):**
- ✅ **Consentimento Explícito:** Todos os menores < 18 anos requerem consentimento do responsável legal ANTES de qualquer dado ser coletado
- ✅ **Direito ao Esquecimento:** Academia deve conseguir deletar todos dados de um aluno (ao pedido legal)
- ✅ **Transparência de Uso:** Deve estar claro quem acessa qual dado e por quê
- ✅ **Dados Minimizados:** Coletar APENAS dados necessários (não mais)

**Controle de Acesso por Menor:**
- Aluno < 18 anos: APENAS responsável legal pode editar dados de saúde
- Aluno < 18 anos: APENAS responsável legal autoriza consentimentos + permissões de imagem
- Aluno < 13 anos: Proteção EXTRA (COPPA - análogo ao LGPD em contexto educacional)

**Auditoria & Rastreabilidade:**
- Sistema deve logar: quem acessou qual dado, quando, de qual IP, por qual motivo
- Auditoria deve ser consultável pelo Admin (compliance verification)
- Retenção de logs por mínimo 12 meses

### Conformidade Saúde & Segurança

**Registro de Anamnese:**
- Histórico de saúde (condições médicas, medicamentos em uso)
- Alergias (crítico para responder em emergência)
- Limitações físicas (ombro inflamado, joelho frágil, etc.)
- Histórico de lesões prévias em judo
- Restrições atividade (por médico, se houver)

**Consentimento Médico:**
- Termo de responsabilidade assinado: academia não substitui médico
- Autorização de contato de emergência (responsável, mãe, pai)
- Confirmar que aluno pode participar de treino de judo (ou restrições)

**Código de Ética & Segurança:**
- Aceite de Código de Ética da Academia
- Termo de respeito entre alunos
- Autorização para contato e foto/vídeo é específico por tipo (redes sociais, relatório privado, etc.)

### Requisitos Regulatórios Judo-Específicos

**Filiação Federativa:**
- Registrar se aluno está filiado à confederação/federação brasileira de judo
- Impacto: Determina elegibilidade para competições
- Status pode ser: Não filiado, Filiado em dia, Filiado atrasado

**Código de Ética Judo:**
- Respeito ("judocas devem ser respeitosos")
- Disciplina
- Responsabilidade
- Honra
- Cortesia
- Humildade

### Requisitos Técnicos de Segurança & Privacy

**Encriptação em Trânsito:**
- HTTPS/TLS 1.2+ para todo tráfego
- Sem dados sensíveis (saúde, LGPD) em logs de network

**Encriptação em Repouso (Dados Sensíveis):**
- Dados de saúde (anamnese, alergias, histórico de lesões): encriptados no banco
- Dados de consentimentos: encriptados no banco

**Acesso Seguro:**
- Autenticação: Email + Senha com requisito mínimo de força
- Suporte a 2FA (optional, mas recomendado para Admin)
- Sessions expiram após 30 minutos de inatividade (para segurança em dispositivos compartilhados)

**Backup & Disaster Recovery:**
- Backup diário de dados
- Capacidade de restore em caso de corrupção
- Teste de restore a cada 3 meses

### Regras de Acesso & Isolamento de Dados

**Data Isolation (Multi-Academia Future-Ready):**
- Mesmo que MVP seja single-tenant, arquitetura deve permitir multi-tenant
- Admin vê APENAS dados de sua academia
- Professor vê APENAS alunos de suas turmas (não da academia toda)
- Aluno vê APENAS seus dados
- Responsável vê APENAS dados de seu(s) filho(s)

**Não há "Admin super":** Nem mesmo um Admin super deveria conseguir acessar dados de menores sem rastreabilidade

### Padrões de Domínio - Judo

**Conceitual - Sequência de Faixas (Correto):**
- Branca → Cinza → Azul → Amarela → Laranja → Verde → Roxa → Marrom → Preta
- Progresso não é linear (pode "pisar em seco" por um período)
- Competição é importante marco (primeira luta é momento significativo)
- Cada faixa representa ~6-12 meses de treinamento consistente

**Registros de Treino:**
- Estrutura típica: Aquecimento → Técnica → Randori (luta livre) → Alongamento
- Variações: Treino com ênfase técnica vs. competição vs. fortalecimento
- Feedback deve capturar: técnicas melhoradas, técnicas a trabalhar, evolução geral

### Riscos de Domínio & Mitigações

**Risco 1: Vazamento de Dados de Menores (CRÍTICO)**
- Impacto: LGPD fine + perda de confiança + responsabilidade criminal
- Mitigação: Encriptação forte + auditoria rigorosa + compliance testing

**Risco 2: Acesso Indevido (Professores vendo alunos de outros)**
- Impacto: Privacy violation, perda de confiança
- Mitigação: RBAC rigoroso testado, auditoria de acesso

**Risco 3: Responsável não conseguir consentir por menor (LGPD violation)**
- Impacto: Dados coletados ilegalmente
- Mitigação: Workflow obrigatório de consentimento ANTES de qualquer dado

**Risco 4: Sistema não consegue deletar dados (Direito ao Esquecimento)**
- Impacto: LGPD violation
- Mitigação: Implementar "soft delete" + hard delete functionality, testado

**Risco 5: Logs não rastreáveis (compliance failure)**
- Impacto: Não conseguir provar conformidade em auditoria
- Mitigação: Logs estruturados, retenção 12+ meses, consultáveis pelo Admin