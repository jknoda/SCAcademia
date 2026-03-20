Story 1.5: RBAC — Controle de Acesso por Papel (4 Papéis)
Como um Admin/Professor/Aluno/Responsável,
Quero que o sistema respeite meu papel e me mostre apenas funcionalidades permitidas,
Para que dados sensíveis permaneçam protegidos e cada usuário veja apenas o necessário.

**Critérios de Aceitação:**

**Dado** que um usuário está logado com role = "Professor"
**Quando** tenta acessar rota /admin/compliance-dashboard
**Então** o middleware RBAC valida a permissão
**E** o servidor retorna 403 Forbidden
**E** redireciona para seu dashboard apropriado (/professor/dashboard)

**Dado** que um Professor está no dashboard
**Quando** carrega a página
**Então** vê apenas suas próprias turmas (query filtra professor_id = authenticated_user_id)
**E** os estudantes mostrados pertencem apenas às suas turmas
**E** não consegue ver dados de professores/alunos de outras academias

**Dado** que um Aluno está logado
**Quando** tenta acessar dados de outro Aluno
**Então** o middleware valida: student_id == authenticated_user_id
**E** se não corresponde, o servidor bloqueia (query-level filtering)
**E** exibe: "Você não tem permissão para acessar esses dados"

**Dado** que um Admin está logado (role = "Admin")
**Quando** acessa a academia
**Então** consegue ver todos os dados da academia (sem poderes além da academia)
**E** consegue gerenciar usuários, roles, permissões dentro da academia
**E** não consegue acessar dados de outras academias

**Dado** que um Responsável está logado
**Quando** tenta editar dados de saúde de um aluno
**Então** o sistema valida: tem_consentimento_para_editar = true
**E** verifica: is_responsavel_do_aluno = true
**E** se validações falham, retorna 403 "Sem permissão para editar saúde"

**Dado** que a API é chamada sem JWT token
**Quando** uma rota protegida é acessada
**Então** middleware JWT valida a presença e assinatura do token
**E** se inválido/ausente, retorna 401 Unauthorized
**E** se expirado, retorna 401 (cliente deve fazer refresh)

**Dado** que usuário é Admin
**Quando** tenta deletar um Aluno
**Então** o sistema permite (soft delete, não hard delete)
**E** registra no audit log: "Admin [João Silva] deletou Aluno [Pedro Santos]"
**E** nenhum outro papel consegue deletar usuários

**Dado** que um Professor tenta criar um novo Aluno
**Quando** submete os dados
**Então** o sistema valida: role = "Professor" tem permissão create:student
**E** se sim, cria o aluno ligado à academia do professor
**E** se não, retorna 403

**Dado** que um Aluno tenta editar seu próprio perfil
**Quando** submete mudanças (ex: telefone, data de nascimento)
**Então** o sistema valida: aluno_id == authenticated_user_id
**E** permite edição
**E** registra mudança no audit log