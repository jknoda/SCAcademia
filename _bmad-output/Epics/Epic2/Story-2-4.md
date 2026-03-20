Story 2.4: Auditoria LGPD — Registrar Todos os Acessos
Como um Admin auditando conformidade,
Quero ver timeline de quem acessou dados pessoais de um aluno,
Para que a Academia possa demonstrar que dados foram acessados apropriadamente.

**Critérios de Aceitação:**

**Dado** que um Admin acessa ficha de aluno > "Auditoria de Acesso"
**Quando** carrega a seção
**Então** exibe timeline de todos os acessos aos dados pessoais daquele aluno:
  - Data/Hora
  - Quem acessou (nome + role do usuário)
  - Que dados foram acessados (health_history, performance_notes, etc)
  - IP de origem
  - Ação realizada (VIEW, EDIT, DELETE, EXPORT)

**Dado** que Admin quer filtrar os acessos
**Quando** aplica filtros
**Então** consegue filtrar por:
  - Período (data início - data fim)
  - Usuário (Professor, Admin, etc)
  - Tipo de ação (VIEW, EDIT, DELETE, EXPORT)
  - Tipo de dado (health, performance, attendance)

**Dado** que um Professor visualizou dados de aluno
**Quando** a ação é registrada no audit log
**Então** o sistema captura:
  - timestamp_preciso
  - professor_id
  - student_id
  - action = "VIEW"
  - resource = "health_history"
  - result = "success"
  - ip_address
  - user_agent

**Dado** que um Professor tenta editar dados de saúde de aluno
**Quando** a ação é rejeitada (sem permissão)
**Então** ainda assim registra no audit log:
  - resultado = "denied"
  - razão = "insufficient_permissions"
  - Para rastreabilidade de tentativas de acesso não autorizado

**Dado** que Admin quer exportar relatório de auditoria
**Quando** clica "Exportar Auditoria LGPD"
**Então** o sistema gera PDF com:
  - Cabeçalho: Academia, Aluno, Período
  - Tabela de acessos (todos os campos acima)
  - Áreas de assinatura (Admin, Data)
  - Versão (para fins legais)

**Dado** que um audit log foi criado
**Quando** o Admin tenta deletar/modificar esse log
**Então** a operação é bloqueada (tabela append-only)
**E** qualquer tentativa de modificação registra tentativa de acesso indevido

**Dado** que dados antigos precisam ser arquivados
**Quando** 1 ano passa desde último acesso
**Então** audit logs são movidos para storage de arquivo (S3/GCS)
**E** acesso ainda é possível (para compliance)
**E** mas não carrega na consulta diária por performance