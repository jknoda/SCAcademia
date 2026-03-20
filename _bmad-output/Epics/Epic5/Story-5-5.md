Story 5.5: Gestão de Usuários — Criar, Editar, Bloquear
Como um Admin,
Quero gerenciar usuários da academia (criar, editar, bloquear, deletar),
Para que eu controle acessos e permissões.

**Critérios de Aceitação:**

**Dado** que Admin acessa "Admin > Gerenciar Usuários"
**Quando** clica
**Então** exibe lista de todos os usuários (paginada, 20 por página)
**E** tabela com colunas:
  - Nome | Email | Role | Status | Ações

**Dado** que Admin quer adicionar novo usuário
**Quando** clica "[+ Novo Usuário]"
**Então** exibe formulário:
  - Email (obrigatório)
  - Nome Completo (obrigatório)
  - Role: [Professor] [Aluno] [Admin] [Responsável]
  - Status: [Ativo] [Bloqueado]
  - Enviar convite: [Sim] (email com link setup)

**Dado** que Admin preenche formulário
**Quando** clica "Criar"
**Então** usuário é criado
**E** sistema envia email com link: "Clique para completar cadastro"
**E** usuário recebe: "Um admin criou sua conta em SCAcademia"

**Dado** que Admin quer editar usuário existente
**Quando** clica "[Editar]" em uma linha
**Então** abre modal com:
  - Nome (editável)
  - Email (não editável, é ID)
  - Role (alterável se admin)
  - Status (alterável)

**Dado** que Admin muda o role de "Aluno" para "Professor"
**Quando** salva
**Então** permissões mudam imediatamente
**E** usuário vê novo dashboard no próximo refresh
**E** evento é registrado no audit log

**Dado** que um usuário está tendo comportamento suspeito
**Quando** Admin clica "[Bloquear]"
**Então** exibe modal de confirmação
**E** motivo (checkbox): [Segurança] [Violação Termos] [Outro]
**E** se confirma, usuário é marcado blocked=true
**E** próximo login falha: "Sua conta foi desativada. Contate admin"

**Dado** que Admin quer desbloquear usuário
**Quando** clica "[Desbloquear]"
**Então** usuário recupera acesso imediatamente

**Dado** que Admin quer deletar usuário (ex: aluno deixou academia)
**Quando** clica "[Deletar]"
**Então** exibe warning: "Soft delete! Dados não serão perdidos"
**E** confirmação: "Tem certeza?"
**E** se sim, soft_delete=true + deleted_at=now
**E** dados permanecem (audit trails, histórico)

**Dado** que há múltiplos usuários
**Quando** Admin quer filtrar
**Então** filtros disponíveis:
  - Role: [Professor] [Aluno] [Admin] [Responsável]
  - Status: [Ativo] [Bloqueado] [Pendente]
  - Busca por nome/email

**Dado** que Admin busca "João"
**Quando** digita
**Então** lista filtra em real-time (< 200ms)
**E** destaca matches: "João Silva, João Santos, Joana"

**Dado** que Admin exporta lista de usuários
**Quando** clica "[Exportar]"
**Então** gera CSV: "Usuarios_[Academia]_[Data].csv"