Story 9.5: Vinculação de Responsável ao Aluno Menor
Como um Administrador,
Quero vincular um responsável legal (pai/mãe/guardião) a um aluno menor de idade,
Para que a academia tenha o responsável registrado, possa enviar comunicações e garantir conformidade com a LGPD para dados de menores.

**Contexto:** O schema já tem suporte a `Responsavel` como `role`. A Story 2.2 (consentimento LGPD) já usa este vínculo. Esta story formaliza o cadastro do responsável e o processo de vinculação como parte do onboarding do aluno menor.

**Critérios de Aceitação:**

**AC1 — Iniciar vinculação a partir da ficha do aluno**
**Dado** que o Admin está na ficha de um aluno menor (`is_minor = true`) sem responsável vinculado
**Quando** visualiza a seção "Responsável Legal"
**Então** vê o status: "Nenhum responsável vinculado"
**E** vê o botão "Vincular Responsável"

**AC2 — Vincular responsável existente no sistema**
**Dado** que o Admin clica em "Vincular Responsável"
**Quando** o painel de vinculação abre
**Então** o Admin pode buscar por email ou nome de um responsável já cadastrado na academia
**E** a busca retorna resultados em tempo real (mínimo 3 caracteres)
**E** o Admin clica em "Vincular" no resultado desejado
**E** o sistema cria o vínculo via `POST /api/guardians/:guardianId/link/:studentId`
**E** exibe: "✓ Responsável [Nome] vinculado ao aluno [Nome]"

**AC3 — Cadastrar novo responsável e vincular**
**Dado** que o responsável ainda não tem cadastro no sistema
**Quando** o Admin clica em "Cadastrar Novo Responsável"
**Então** um formulário aparece com:
- Nome completo (obrigatório)
- Email (obrigatório — será o login do responsável)
- CPF (opcional)
- Telefone (obrigatório — necessário para comunicação urgente)
- Relação com aluno: "Pai", "Mãe", "Guardião Legal", "Outro" (select, obrigatório)
- Endereço (opcional)
**Quando** o Admin salva
**Então** o responsável é criado com `role = 'Responsavel'` e automaticamente vinculado ao aluno
**E** o sistema dispara email para o responsável com link de acesso à plataforma

**AC4 — Desvincular responsável**
**Dado** que um aluno menor tem um responsável vinculado
**Quando** o Admin clica em "Desvincular"
**Então** o sistema exibe confirmação: "Desvincular [Nome Responsável] de [Nome Aluno]?"
**E** avisa: "Atenção: o responsável precisará ser revinculado antes do próximo consentimento."
**Quando** o Admin confirma
**Então** o vínculo é removido
**E** o consentimento pendente é marcado como "requer_revisar"

**AC5 — Responsável com múltiplos filhos**
**Dado** que um responsável já está vinculado a outro aluno na academia
**Quando** o mesmo responsável é vinculado a outro aluno menor
**Então** o vínculo é criado normalmente (um responsável pode ter N filhos)
**E** no painel do responsável aparecem todos os filhos vinculados

**AC6 — Listar todos os alunos menores sem responsável**
**Dado** que o Admin acessa o painel de gestão LGPD
**Quando** filtra por "Menores sem Responsável"
**Então** o sistema retorna a lista de alunos menores com `is_minor = true` e sem responsável vinculado
**E** exibe alerta de conformidade: "⚠️ X alunos menores precisam de responsável vinculado"

**Notas Técnicas:**
- Tabela de vínculo: verificar se já existe `guardian_student` ou equivalente no schema; se não, criar migration
- `minor_consent_signed` na tabela `users` deve ser atualizado quando responsável completar consentimento (já coberto pelo Epic 2)
- `requireRole(['Admin'])` para todas as operações de vinculação
- Isolamento: alunos e responsáveis devem pertencer à mesma `academy_id`
- Se tabela de vínculo não existe, a migration será parte desta story
