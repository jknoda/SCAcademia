Story 2.5: Direito ao Esquecimento — Deletar Dados do Aluno
Como um Responsável ou Admin,
Quero solicitar deleção de dados de um aluno menor,
Para que respeitar o direito ao esquecimento (LGPD) e não reter dados desnecessários.

**Critérios de Aceitação:**

**Dado** que um responsável quer deletar dados de seu filho
**Quando** acessa "Minha Conta > Dados do Meu Filho > Solicitar Deleção"
**Então** o sistema exibe:
  - Aviso: "Isso deletará permanentemente os dados após 30 dias de graça"
  - Checkbox: "Entendo e concordo"
  - Texto do aluno específico: [Nome Aluno]
  - Botão: "Solicitar Deleção"

**Dado** que a solicitação de deleção é submetida
**Quando** o sistema processa
**Então** cria record em: deletion_requests
  - student_id
  - requested_by_id (responsável ou admin)
  - status = "pending"
  - requested_at = agora
  - deletion_scheduled_at = agora + 30 dias
  - reason (opcional: "Direction of parent", "Direito ao esquecimento", etc)

**Dado** que 30 dias de graça iniciaram
**Quando** a Academia pode cancelar dentro desse período
**Então** Admin consegue via "Deletar > Cancelar Deleção"
**E** se cancelada, record é deletado e aluno pode continuar usando

**Dado** que 30 dias expiraram
**Quando** sistema processa agendamento
**Então** inicia cascade delete:
  1. soft_delete em tabela students (não hard delete)
  2. Anonimizar dados em training_attendance (remover nome, marcar como deleted)
  3. Anonimizar performance_notes (remover conteúdo, guardar apenas score)
  4. DELETE hard em health_history (dados sensíveis deletam de verdade)
  5. DELETE em consents (sem necessidade de conservar)
  6. Manter audit_logs (por lei, 8 anos/compliance)

**Dado** que dados foram deletados
**Quando** Admin/aluno tenta acessar perfil
**Então** exibe: "Perfil deletado em [data]"
**E** não expõe nenhuma informação pessoal do aluno

**Dado** que backup/restore precisa ser feito
**Quando** Admin faz restore de backup antigo
**Então** dados deletados NÃO são restaurados (criptografia garante inacessibilidade)
**E** soft deletes são respeitados no restore

**Dado** que era aluno menor AND responsável solicitou deleção
**Quando** aluno agora faz 18 anos
**Então** deleção respeitada mesmo que agora fosse legal ele consentir
**E** direito de menor é prioritário sobre direito de adulto