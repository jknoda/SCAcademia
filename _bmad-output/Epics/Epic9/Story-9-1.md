Story 9.1: Perfil Completo da Academia
Como um Administrador da academia,
Quero visualizar e editar o cadastro completo da minha academia,
Para que os dados operacionais, fiscais e de contato estejam atualizados e completos.

**Contexto:** O fluxo atual (Story 1.1) criou a academia apenas com `name, location, email, phone`. O schema do banco tem ~15 campos adicionais (CNPJ/CNPJ via `document_id`, endereço completo, `is_active`, `max_users`). Esta story expande o formulário e garante que o Admin consiga editar esses dados.

**Critérios de Aceitação:**

**AC1 — Visualizar perfil atual da academia**
**Dado** que o Admin está logado
**Quando** acessa `/admin/perfil-academia` (ou equivalente)
**Então** o sistema exibe os dados atuais da academia carregados da API `GET /api/academies/:academyId`
**E** todos os campos preenchidos no cadastro original aparecem populados
**E** campos ainda não preenchidos aparecem vazios (mas editáveis)

**AC2 — Campos do formulário completo**
**Dado** que o Admin está na tela de edição do perfil
**Quando** visualiza o formulário
**Então** o formulário contém:
- **Dados Gerais:** Nome da academia (obrigatório), Descrição (opcional)
- **Documento:** CNPJ ou CPF (`document_id`, obrigatório, único no sistema)
- **Contato:** Email de contato (obrigatório), Telefone (obrigatório)
- **Endereço:** Logradouro, Número, Complemento, Bairro, CEP (obrigatório), Cidade (obrigatório), Estado (obrigatório, select UF)
**E** todos os campos obrigatórios têm marcação visual
**E** o campo CEP tem máscara `00000-000`

**AC3 — Validação de formulário em tempo real**
**Dado** que o Admin está editando o perfil
**Quando** preenche um campo com dado inválido
**Então** o campo exibe mensagem de erro inline (ex: "CNPJ inválido", "CEP deve ter 8 dígitos")
**Quando** o campo é corrigido
**Então** o erro desaparece e o campo é marcado como válido

**AC4 — Salvar alterações com sucesso**
**Dado** que o Admin preencheu todos os campos obrigatórios com dados válidos
**Quando** clica em "Salvar Alterações"
**Então** o sistema chama `PUT /api/academies/:academyId` com os dados atualizados
**E** exibe mensagem de sucesso: "✓ Dados da academia atualizados"
**E** o formulário permanece na tela com os dados recém-salvos
**E** `updated_at` é atualizado no banco

**AC5 — Erros de validação do servidor**
**Dado** que existe outra academia com o mesmo `document_id`
**Quando** o Admin tenta salvar com esse CNPJ/CPF
**Então** o sistema exibe erro inline no campo: "Documento já cadastrado no sistema"
**E** não salva os dados

**AC6 — Controle de acesso**
**Dado** que um usuário com papel `Professor` ou `Aluno` tenta acessar a tela
**Quando** tenta navegar para `/admin/perfil-academia`
**Então** o sistema redireciona para `/home` ou exibe erro 403
**E** não exibe dados da academia

**Notas Técnicas:**
- Backend: `PUT /api/academies/:academyId` com autenticação + `requireRole(['Admin'])`
- `document_id` deve validar formato CNPJ (`XX.XXX.XXX/XXXX-XX`) ou CPF (`XXX.XXX.XXX-XX`) no frontend
- CEP pode ter integração com ViaCEP API para auto-preenchimento (opcional, mas desejável)
- `max_users` e `storage_limit_gb` são campos somente leitura (gerenciados por SCAcademia plataforma)
