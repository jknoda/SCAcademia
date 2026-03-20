Epic 1: Fundação — Autenticação & Controle de Acesso
Overview do Epic 1
Objetivo: Usuários conseguem se registrar, fazer login com segurança e ter permissões baseadas em papéis (RBAC).

FRs Cobertos: FR1-FR14 (14 requisitos)

FR1-FR7: Gerenciamento de Usuários (registrar, adicionar usuários, login, credenciais)
FR8-FR14: Controle de Acesso (4 papéis, permissões, isolamento de dados)
NFRs Relevantes:

Segurança: HTTPS, JWT tokens, Hash de senha (bcryptjs)
Performance: Resposta de auth < 200ms
Acessibilidade: WCAG AA navegação por teclado

📊 Epic 1 Summary
Story	Título	Funcionalidade	Tamanho
1.1	Admin setup & Primeiro Admin	Inicialização academia + primeiro usuário	Médio
1.2	Registro de Usuário	Registrar Prof/Aluno/Responsável	Pequeno
1.3	Login JWT	Endpoint auth + geração de tokens	Médio
1.4	Recuperação de Senha	Fluxo de recuperação via email	Médio
1.5	RBAC Enforcement	Middleware de controle de acesso + queries	Grande
Total de FRs Cobertos: 14/14 ✅
