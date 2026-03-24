Story 9.3: Cadastro e Edição Completa do Professor
Como um Administrador,
Quero cadastrar professores com todos os dados completos e editá-los posteriormente,
Para que a academia tenha um cadastro qualificado de seus professores para gestão e contato.

**Contexto:** A Story 1.2 permite registro do Professor com `fullName, email, password, role`. O schema tem campos adicionais relevantes para professores: `document_id` (CPF), `birth_date`, `phone`, `address_*`, `data_entrada`. Esta story expande o cadastro/edição do professor.

**Critérios de Aceitação:**

**AC1 — Listar professores da academia**
**Dado** que o Admin está logado
**Quando** acessa `/admin/professores`
**Então** o sistema carrega e exibe a lista de usuários com `role = 'Professor'` da academia
**E** a lista mostra: Nome, Email, Telefone, Data de entrada, Status (Ativo/Inativo)
**E** a lista tem opção de filtrar por nome e status

**AC2 — Cadastrar novo professor (formulário completo)**
**Dado** que o Admin clica em "Novo Professor"
**Quando** o formulário de cadastro é exibido
**Então** contém:
- **Acesso:** Email (obrigatório, único na academia), Senha temporária (obrigatório, gerada automaticamente ou manual)
- **Dados Pessoais:** Nome completo (obrigatório), CPF (`document_id`, opcional), Data de Nascimento (opcional)
- **Contato:** Telefone (opcional)
- **Endereço:** Logradouro, Número, Complemento, Bairro, CEP, Cidade, Estado (todos opcionais)
- **Operacional:** Data de Entrada na academia (opcional, default hoje)
**E** o campo de senha exibe botão "Gerar senha aleatória" que gera uma senha forte automaticamente

**AC3 — Salvar novo professor**
**Dado** que o Admin preencheu os campos obrigatórios com dados válidos
**Quando** clica em "Cadastrar Professor"
**Então** o sistema cria o usuário com `role = 'Professor'` via API
**E** exibe: "✓ Professor [Nome] cadastrado com sucesso"
**E** se senha foi gerada automaticamente, exibe a senha em um modal (única vez) com botão "Copiar"
**E** redireciona para a tela de lista de professores

**AC4 — Editar professor existente**
**Dado** que o Admin clica em "Editar" em um professor da lista
**Quando** o formulário de edição é exibido
**Então** todos os campos são carregados com os dados atuais do professor
**E** o campo email não é editável (está associado ao login)
**E** a senha pode ser redefinida pelo Admin (campo separado "Redefinir Senha")

**AC5 — Ativar / Desativar professor**
**Dado** que o Admin visualiza um professor ativo
**Quando** clica em "Desativar"
**Então** o sistema exibe confirmação: "Desativar [Nome]? O professor não conseguirá mais fazer login."
**Quando** confirma
**Então** `is_active = false` é salvo no banco
**E** o professor é listado como "Inativo" na lista
**E** `data_saida` é preenchida com a data atual

**AC6 — Validações**
**Dado** que o Admin preenche email já cadastrado na academia
**Quando** tenta salvar
**Então** o sistema exibe: "Email já cadastrado para outro usuário desta academia"
**Dado** que Admin preenche CPF com formato inválido
**Quando** perde o foco do campo
**Então** exibe erro inline: "CPF inválido"

**Notas Técnicas:**
- Rota backend: `POST /api/users` para criar, `PUT /api/users/:userId` para editar
- `requireRole(['Admin'])` em todas as operações
- Isolamento multi-tenant: `academy_id` vem do token JWT do Admin
- A senha temporária deve ser comunicada de forma segura (nunca salva em texto puro — apenas hasheada)
- `data_saida` deve ser preenchida ao desativar; limpa ao reativar
