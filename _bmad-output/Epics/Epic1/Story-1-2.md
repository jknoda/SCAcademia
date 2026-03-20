Story 1.2: Registro de Usuário (Professor ou Aluno)
Como um Professor ou Aluno,
Quero me registrar no sistema com email, senha e dados básicos,
Para que eu possa acessar a plataforma e começar a usar.

**Critérios de Aceitação:**

**Dado** que o usuário acessa a página de registro
**Quando** preenche o formulário com: email, senha (mín. 8 caracteres + maiúscula + número + especial), nome, tipo (Professor/Aluno)
**Então** o sistema valida os dados em tempo real
**E** exibe mensagens de erro se a senha não atender aos requisitos

**Dado** que o email já existe no sistema
**Quando** o usuário tenta registrar com esse email
**Então** o sistema exibe erro: "Email já registrado"
**E** sugere: "Fazer login" ou "Recuperar senha"

**Dado** que todos os dados são válidos
**Quando** o usuário clica "Registrar"
**Então** o sistema cria o usuário com role = Professor ou Aluno
**E** a senha é hasheada com bcryptjs (10 salt rounds)
**E** os dados são salvos no banco (PostgreSQL)
**E** o status de consentimento é marcado como "pendente"

**Dado** que o registro foi bem-sucedido
**Quando** a página recarrega
**Então** o sistema exibe: "✓ Registro realizado com sucesso"
**E** redireciona para página de login ou auto-login com sessão JWT

**Dado** que é um Aluno menor de idade (detectado pela data de nascimento)
**Quando** o sistema detecta data de nascimento < 18 anos
**Então** a plataforma marca "necessita_consentimento_responsavel = true"
**E** envia email ao responsável com link de consentimento
**E** o aluno não consegue acessar até que responsável consinta

**Dado** que o usuário se registra como Professor
**Quando** o registro é concluído
**Então** o sistema marca role = "Professor"
**E** o professor recebe email de boas-vindas com instruções
**E** pode fazer login imediatamente

**Dado** que houve erro ao salvar os dados
**Quando** o sistema detecta falha na inserção no banco
**Então** registra no audit log: erro de banco, IP do usuário, dados enviados
**E** exibe: "Erro ao registrar. Dados não foram salvos. Tente novamente"