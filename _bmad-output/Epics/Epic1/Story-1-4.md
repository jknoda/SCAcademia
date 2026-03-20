Story 1.4: Recuperação de Senha via Email
Como um Usuário que esqueceu a senha,
Quero redefinir a senha via email,
Para que eu possa recuperar acesso à minha conta.

**Critérios de Aceitação:**

**Dado** que o usuário acessa "Esqueci a senha"
**Quando** insere seu email registrado no sistema
**Então** o sistema busca o usuário no banco de dados
**E** se encontrado, gera um token de reset (JWT temporário, validade: 1 hora)

**Dado** que o token foi gerado
**Quando** o sistema envia o email
**Então** o email contém: link "Redefinir Senha" com o token incluído
**E** o email é enviado usando serviço de email (ex: SendGrid, AWS SES)
**E** o token_hash é armazenado no banco com timestamp de criação

**Dado** que o usuário clica no link do email
**Quando** acessa a página de reset com o token válido
**Então** o sistema valida o token (não expirou, hash corresponde ao armazenado)
**E** exibe formulário: "Digite sua nova senha"

**Dado** que o usuário insere nova senha válida
**Quando** submete o formulário
**Então** o sistema valida a senha (8+ caracteres, maiúscula, número, especial)
**E** a nova senha é hasheada com bcryptjs
**E** o banco é atualizado com novo password_hash
**E** o reset_token é anulado/deletado do banco
**E** todos os refresh_tokens antigos são invalidados (force re-login)

**Dado** que o reset foi bem-sucedido
**Quando** a página recarrega
**Então** exibe: "✓ Senha redefinida com sucesso"
**E** redireciona para página de login
**E** usuário consegue fazer login com a nova senha
**E** o evento é registrado no audit log

**Dado** que o token de reset expirou (> 1 hora)
**Quando** o usuário tenta usar o link
**Então** o sistema detecta expiração
**E** exibe: "Link expirado. Solicite novo reset"
**E** oferece botão para gerar novo token
**E** redireciona para página "Esqueci a senha"

**Dado** que o usuário não confirmou o reset em 1 hora
**Quando** tenta usar o link posteriormente
**Então** o token é considerado inválido
**E** um novo link deve ser solicitado