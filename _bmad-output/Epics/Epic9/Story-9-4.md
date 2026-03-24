Story 9.4: Cadastro e Edição Completa do Aluno
Como um Administrador ou Professor,
Quero cadastrar alunos com todos os dados completos e editá-los,
Para que a academia tenha registro completo dos alunos incluindo dados de contato, documentação e situação de menoridade para conformidade com LGPD.

**Contexto:** A Story 1.2 registra o aluno com dados mínimos. O schema tem ~20 campos adicionais relevantes: `document_id` (CPF), `birth_date`, `phone`, `address_*`, `is_minor`, `minor_consent_signed`, `data_entrada`. Para menores, a vinculação com responsável é crítica para LGPD.

**Critérios de Aceitação:**

**AC1 — Listar alunos da academia**
**Dado** que o Admin ou Professor está logado
**Quando** acessa `/admin/alunos` (Admin) ou `/professores/meus-alunos` (Professor)
**Então** o sistema carrega alunos ativos da academia
**E** professores veem apenas alunos de suas turmas (isolamento já implementado no backend)
**E** a lista mostra: Nome, Idade, Faixa, Status, Indicador de menor (se aplicável)

**AC2 — Formulário de cadastro completo do aluno**
**Dado** que o Admin ou Professor clica em "Novo Aluno"
**Quando** o formulário é exibido
**Então** contém:
- **Acesso:** Email (obrigatório), Senha temporária (obrigatório)
- **Dados Pessoais:** Nome completo (obrigatório), CPF (`document_id`, opcional), Data de Nascimento (obrigatório — detecta menoridade)
- **Contato:** Telefone do aluno (opcional)
- **Endereço:** Logradouro, Número, Complemento, Bairro, CEP, Cidade, Estado (todos opcionais)
- **Operacional:** Data de Entrada na academia (default hoje), Modalidade/Turma principal (opcional)
**E** o campo "Data de Nascimento" é obrigatório e causa recálculo automático de `is_minor`

**AC3 — Detecção automática de menoridade**
**Dado** que o Admin preenche a Data de Nascimento
**Quando** o valor é alterado
**Então** o sistema calcula a idade em tempo real
**E** se `idade < 18`:
  - Exibe aviso destacado: "⚠️ Aluno menor de idade — será necessário vincular responsável"
  - `is_minor = true` é marcado automaticamente
  - Campo "Responsável" aparece com opção de buscar/criar responsável
**E** se `idade >= 18`:
  - Nenhum aviso extra
  - `is_minor = false`

**AC4 — Salvar novo aluno**
**Dado** que o Admin preencheu os obrigatórios com dados válidos
**Quando** clica em "Cadastrar Aluno"
**Então** o sistema cria o aluno via `POST /api/users` com `role = 'Aluno'`
**E** exibe: "✓ Aluno [Nome] cadastrado"
**E** se `is_minor = true` e no responsável vinculado ainda: exibe aviso "Lembre-se de vincular um responsável para este aluno (Story 9.5)"
**E** redireciona para a ficha do aluno recém-criado

**AC5 — Editar aluno existente**
**Dado** que o Admin ou Professor clica em "Editar" de um aluno
**Quando** o formulário de edição carrega
**Então** todos os dados atuais do aluno são pré-preenchidos
**E** o campo email não é editável
**E** o campo `is_minor` é recalculado automaticamente se `birth_date` for alterado

**AC6 — Ativar / Desativar aluno**
**Dado** que o Admin visualiza um aluno ativo
**Quando** clica em "Desativar" e confirma
**Então** `is_active = false`, `data_saida = hoje` são salvos
**E** o aluno aparece como "Inativo" na lista
**E** o aluno não pode mais fazer login

**AC7 — Visualizar ficha completa do aluno**
**Dado** que o Admin ou Professor acessa a ficha de um aluno
**Quando** a ficha carrega
**Então** exibe:
  - Dados pessoais
  - Status LGPD: consentimento assinado (Sim/Não), data do consentimento
  - Status saúde: anamnese preenchida (Sim/Não) com link para ver/editar
  - Responsável vinculado (se menor)
  - Turmas em que está matriculado

**Notas Técnicas:**
- `is_minor = birth_date < NOW() - INTERVAL '18 years'` — calculado no backend também
- Professores não podem criar alunos de outras turmas — `academy_id` + RBAC
- Campo CPF/RG: `document_id VARCHAR(20)` no schema; aceitar CPF formatado
- Dados de saúde são exibidos como link, não no formulário de cadastro (ver Story 9.6)
