Story 9.2: Perfil Completo do Administrador
Como um Administrador logado,
Quero visualizar e editar meu próprio perfil completo,
Para que meus dados pessoais, de contato e documentação estejam corretos na plataforma.

**Contexto:** O Admin foi criado na Story 1.1 apenas com `fullName, email, password`. O schema `users` tem ~15 campos adicionais. Esta story permite ao Admin editar seu próprio perfil (não de outros admins).

**Critérios de Aceitação:**

**AC1 — Acessar meu próprio perfil**
**Dado** que o Admin está logado
**Quando** acessa `/perfil` ou `/admin/meu-perfil`
**Então** o sistema carrega os dados do usuário logado via `GET /api/users/:userId/profile`
**E** exibe o formulário populado com os dados existentes
**E** o campo `email` aparece mas não é editável diretamente (protegido)

**AC2 — Campos do formulário de perfil do Admin**
**Dado** que o Admin está visualizando seu perfil
**Quando** o formulário é exibido
**Então** contém:
- **Dados Pessoais:** Nome completo (obrigatório), CPF (`document_id`, opcional), Data de Nascimento (opcional)
- **Contato:** Telefone (opcional), Email (exibido somente leitura)
- **Endereço:** Logradouro, Número, Complemento, Bairro, CEP, Cidade, Estado (todos opcionais)
**E** campos opcionais têm indicação visual "(opcional)"

**AC3 — Alterar senha**
**Dado** que o Admin deseja mudar sua senha
**Quando** clica em "Alterar Senha"
**Então** aparece um formulário inline (ou modal) com:
  - Senha atual (obrigatório)
  - Nova senha (mín. 8 chars, maiúscula, número, especial)
  - Confirmar nova senha
**Quando** preenche corretamente e confirma
**Então** o sistema chama `PUT /api/auth/change-password` (ou equivalente)
**E** exibe: "✓ Senha alterada com sucesso"
**E** o admin permanece logado (token não é revogado)

**AC4 — Salvar alterações de perfil**
**Dado** que o Admin preencheu os dados com dados válidos
**Quando** clica em "Salvar"
**Então** o sistema chama `PUT /api/users/:userId` com os campos atualizados
**E** exibe mensagem de sucesso: "✓ Perfil atualizado"
**E** o nome exibido no header/nav é atualizado se o `fullName` mudou

**AC5 — Controle de isolamento de academia**
**Dado** que existe um admin de outra academia
**Quando** o sistema processa a atualização
**Então** o backend valida que `academy_id` do token == `academy_id` do usuário sendo atualizado
**E** nunca permite cross-academy update

**Notas Técnicas:**
- Backend: `PUT /api/users/:userId` com `requireSelf` middleware já existente
- Validação CPF no frontend (formato `XXX.XXX.XXX-XX`)
- Data de nascimento: campo `date`, máximo hoje, mínimo 18 anos atrás para admins (admin deve ser maior de idade)
- `password_changed_at` deve ser atualizado ao trocar senha
