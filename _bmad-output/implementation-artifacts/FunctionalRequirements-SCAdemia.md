## Functional Requirements

### User Management & Authentication

- FR1: Admin pode criar uma nova academia/organização no sistema
- FR2: Admin pode adicionar novo professor com email e dados básicos
- FR3: Admin pode adicionar novo aluno com nome, data nascimento, faixa de judo
- FR4: Qualquer usuário pode fazer login com email + senha
- FR5: Professores podem visualizar lista de suas turmas e alunos associados
- FR6: Sistema deve garantir que responsável pode criar/editar dados apenas do seu (s) filho(s)
- FR7: Aluno ou responsável podem fazer logout e invalidar sessão

### Access Control & Role-Based Authorization

- FR8: Sistema deve impor 4 roles com permissões distintas: Admin, Professor, Aluno, Responsável
- FR9: Admin pode visualizar todos os dados (alunos, professores, turmas, presença)
- FR10: Professor pode visualizar APENAS alunos de suas turmas (não de outras turmas)
- FR11: Aluno pode visualizar APENAS seus dados de progresso e anotações
- FR12: Responsável pode visualizar APENAS dados de seu(s) filho(s)
- FR13: Professor pode editar anotações de desempenho de seus alunos
- FR14: Responsável NÃO pode editar dados de saúde — apenas visualizar

### Health Data & LGPD Compliance

- FR15: Sistema coleta anamnese obrigatória (histórico saúde, alergias, limitações, lesões prévias)
- FR16: Sistema requer consentimento explícito do responsável ANTES de qualquer dado ser coletado (menor < 18)
- FR17: Sistema coleta autorização para som/imagem (fotos/vídeos)
- FR18: Sistema coleta aceite de Código de Ética da Academia
- FR19: Todos os consentimentos são armazenados com timestamp e rastreamento de versão
- FR20: Dados sensíveis (saúde, alergias) são encriptados em repouso no banco
- FR21: Sistema mantém auditoria completa: quem acessou qual dado sensível, quando, de qual IP
- FR22: Auditoria é consultável pelo Admin para compliance verification
- FR23: Sistema deve permitir "soft delete" de aluno (mascarar dados, não deletar fisicamente)
- FR24: Sistema deve permitir "hard delete" após período retenção (compliance com direito esquecimento)

### Training Registration

- FR25: Professor pode criar/registrar novo treino especificando: data, horário, turma, descrição
- FR26: Sistema pré-carrega lista de alunos já cadastrados para a turma (auto-complete)
- FR27: Professor marca presença de cada aluno: "Presente" vs "Faltou"
- FR28: Sistema registra dato e hora da criação do treino (auditoria)
- FR29: Professor pode adicionar anotação individual de desempenho para cada aluno
- FR30: Professor pode salvar treino em < 5 minutos (incluindo presença + anotações)
- FR31: Professor pode editar treino já registrado (até X dias depois)
- FR32: Sistema não permite deletar treino (apenas soft-mark como "draft" se necessário)

### Performance Tracking & Visualization

- FR33: Aluno pode visualizar dashboard pessoal com: frequência, últimas anotações, evolução gráfica
- FR34: Sistema gera gráfico de frequência: participação ao longo dos meses
- FR35: Sistema gera lista com ALL anotações de desempenho do professor (histórico completo)
- FR36: Sistema exibe faixa atual do aluno e estrutura de faixas (referência)
- FR37: Professor pode visualizar frequência e performance de cada aluno em sua turma
- FR38: Admin pode visualizar frequência geral (todos alunos, por turma)
- FR39: Gráficos e visualizações são renderizados em < 1 segundo mesmo com 100+ registros

### Reporting & Data Export

- FR40: Admin pode gerar relatório de presenças (CSV ou PDF)
- FR41: Admin pode filtrar presenças por período (data range)
- FR42: Admin pode visualizar status de conformidade LGPD (% de alunos com consentimentos)
- FR43: Professor pode visualizar anotações de um aluno específico (timeline)
- FR44: Responsável pode visualizar relatório de progresso de seu filho (simples e visual)

### System Auditoria & Monitoring

- FR45: Sistema mantém logs estruturados de TODAS as ações: usuário, ação, recurso, timestamp, IP
- FR46: Logs de acesso a dados sensíveis incluem: WHO, WHAT, WHEN, WHY (motivo do acesso)
- FR47: Admin pode consultar auditoria por: usuário, período, tipo de ação
- FR48: Sistema retem logs por mínimo 12 meses
- FR49: Sistema monitora tentativas de acesso não autorizado (ex: usuário X tentando acessar dados de Y)
- FR50: Sistema deve ter backup automático diário com teste de restore

### Data Integrity & Offline Handling

- FR51: Se Professor perde conexão enquanto preenchendo treino, dados são salvos localmente (browser cache)
- FR52: quando reconectar, sistema sincroniza automaticamente dados locais com servidor
- FR53: Sistema detecta conflitos (mesmo treino editado em 2 lugares) e implementa conflicto resolution
- FR54: Usuário recebe notificação de status de sincronização: "Offline", "Sincronizando", "Em sincronia"

### Accessibility & Localization

- FR55: Todas interfaces seguem WCAG AA standards (color contrast, keyboard navigation, screen reader)
- FR56: Gráficos incluem alternativa em tabela (para screen reader users)
- FR57: Sistema é totalmente navegável via teclado (Tab, Arrow keys, Enter)
- FR58: Sistema está em Português Brasileiro