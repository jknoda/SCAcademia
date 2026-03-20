Story 1.1: Admin Cria Academia & Primeiro Usuário Admin
Como um Administrador,
Quero criar uma nova academia e me registrar como o primeiro usuário admin,
Para que o sistema da academia seja inicializado e eu possa gerenciar outros usuários.

**Critérios de Aceitação:**

**Dado** que o sistema está vazio (nenhuma academia existe)
**Quando** um admin acessa o assistente de configuração inicial
**Então** o sistema apresenta um formulário para criar uma nova academia
**E** o formulário solicita: nome da academia, localização, email de contato, telefone

**Dado** que o formulário de academia é preenchido corretamente
**Quando** o admin clica "Criar Academia"
**Então** o sistema valida os dados (nome obrigatório, email válido, telefone formato correto)
**E** cria a academia no banco de dados
**E** a academia recebe um ID único

**Dado** que a academia foi criada
**Quando** o sistema passa para a próxima etapa
**Então** o sistema prepara o schema de banco de dados para aquela academia (arquitetura multi-tenant ready)
**E** cria as tabelas necessárias: users, roles, permissions, consents, trainings, etc.

**Dado** que o schema está pronto
**Quando** o sistema solicita os dados do primeiro admin
**Então** o admin preenche: email, senha (mínimo 8 caracteres + letra maiúscula + número + caractere especial), nome completo
**E** o email é validado (formato correto, não duplicado)

**Dado** que a senha atende aos requisitos de segurança
**Quando** o admin clica "Registrar Admin"
**Então** a senha é hasheada usando bcryptjs (10 salt rounds)
**E** o usuário admin é criado no banco com role = "Admin"
**E** o sistema registra a criação no audit log

**Dado** que o primeiro admin foi registrado
**Quando** o login é tentado com as credenciais corretas
**Então** o sistema gera JWT tokens (access_token: 15-60 minutos, refresh_token: 7 dias)
**E** o access_token é armazenado em memória
**E** o refresh_token é armazenado em cookie seguro (httpOnly, CSRF protegido)

**Dado** que o primeiro admin está autenticado
**Quando** acessa o dashboard
**Então** o sistema exibe: "Academia inicializada com sucesso - pronto para adicionar usuários"
**E** mostra menu de ações: "Adicionar Professor", "Adicionar Aluno", "Gerenciar Conformidade"
**E** o admin consegue proceder para convidar professores e alunos

**Dado** que houve erro durante a criação da academia
**Quando** o sistema detecta que a operação falhou
**Então** registra o erro detalhando: timestamp, tipo de erro, dados que foram enviados
**E** exibe ao usuário: "Erro ao criar academia. Tente novamente ou contate suporte"
