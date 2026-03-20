Story 1.3: Login com Autenticação JWT
Como um Usuário (Professor, Aluno, Admin, Responsável),
Quero fazer login com email e senha,
Para que eu possa acessar minha conta e funcionalidades.

**Critérios de Aceitação:**

**Dado** que o usuário está na página de login
**Quando** insere email + senha válidos
**Então** o sistema valida as credenciais contra o hash bcryptjs armazenado
**E** compara a senha fornecida com o hash usando bcrypt.compare()

**Dado** que as credenciais estão corretas
**Quando** o sistema valida com sucesso
**Então** gera um JWT access_token (validade: 15-60 minutos)
**E** gera um JWT refresh_token (validade: 7 dias, armazenado em httpOnly cookie)
**E** retorna ao cliente: { accessToken, refreshToken, user: { id, email, role, nomeCompleto } }

**Dado** que o login foi bem-sucedido
**Quando** o cliente recebe os tokens
**Então** o access_token é armazenado em memória (limpo ao logout)
**E** o refresh_token é armazenado em httpOnly cookie (CSRF protegido)
**E** o cliente é redirecionado ao dashboard apropriado (Professor, Aluno, Admin ou Responsável)

**Dado** que as credenciais são inválidas
**Quando** o login é tentado
**Então** o sistema exibe: "Email ou senha incorretos"
**E** não especifica qual campo está errado (por segurança)
**E** registra a tentativa de login falhada no audit log

**Dado** que o usuário digita email/senha errado 3 vezes
**Quando** tenta novamente
**Então** o sistema aplica rate limiting: "Muitas tentativas. Tente novamente em 5 minutos"
**E** bloqueia o IP/email temporariamente
**E** registra todas as tentativas no audit log

**Dado** que o usuário está logado
**Quando** o access_token expira
**Então** o cliente tenta fazer refresh usando o refresh_token
**E** se refresh_token é válido, o sistema gera um novo access_token
**E** se refresh_token expirou, o sistema força re-login

**Dado** que o usuário clica "Logout"
**Quando** a requisição é processada
**Então** o access_token armazenado em memória é limpo
**E** o refresh_token (cookie) é deletado
**E** a sessão é encerrada no servidor
**E** o usuário é redirecionado para página de login

**Dado** que o usuário tenta acessar uma rota protegida sem token
**Quando** a requisição é feita
**Então** o middleware JWT valida a presença do token
**E** se ausente, retorna 401 Unauthorized
**E** o cliente redireciona para login