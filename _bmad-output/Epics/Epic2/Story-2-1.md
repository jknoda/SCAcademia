Story 2.1: Anamnese Inicial — Captura de Dados de Saúde
Como um Professor ou Responsável,
Quero preencher formulário de anamnese (saúde do aluno),
Para que a academia tenha registro de alergias, restrições e dados médicos importantes.

**Critérios de Aceitação:**

**Dado** que um novo aluno é criado no sistema
**Quando** o Professor/Admin acessa a ficha do aluno
**Então** o sistema exibe seção "Anamnese" com status "Não preenchida"
**E** botão "Preencher Anamnese" direcionando para formulário

**Dado** que o formulário de anamnese é aberto
**Quando** o sistema carrega
**Então** exibe campos obrigatórios:
  - Data de nascimento
  - Tipo de sangue (A+, O-, etc)
  - Alergias (texto, múltiplas)
  - Medicamentos em uso (texto, múltiplas)
  - Restrições médicas (ex: lesão prévia, cirurgia)
  - Condições de saúde (asma, diabetes, etc)
  - Contato de emergência (nome, telefone)

**Dado** que os campos do formulário são preenchidos
**Quando** o usuário insere dados
**Então** o sistema valida em tempo real:
  - Data de nascimento: formato válido, não futuro
  - Alergias/medicamentos: sem campos vazios (min 1 caractere, max 500)
  - Telefone emergência: formato válido

**Dado** que todos os dados são válidos
**Quando** o usuário clica "Salvar Anamnese"
**Então** o sistema criptografa campos sensíveis (alergias, medicamentos, restrições) com AES-256
**E** armazena no banco em tabela: health_history
**E** registra: criacao_timestamp, criado_por (user_id), IP de origem

**Dado** que a anamnese foi salva
**Quando** a página recarrega
**Então** exibe: "✓ Anamnese salva com sucesso"
**E** mostra resumo dos dados capturados (sem exibir sensíveis em claro)
**E** status muda para "Preenchida"

**Dado** que um aluno menor de idade
**Quando** a anamnese é salva
**Então** o sistema marca: "Anamnese submeter a aprovação do responsável"
**E** envia notificação ao responsável: "Revisar anamnese do seu filho"

**Dado** que um Professor modifica a anamnese existente
**Quando** clica "Editar Anamnese"
**Então** o sistema carrega dados descriptografados (apenas para usuário autenticado)
**E** permite edição dos campos
**E** ao salvar, registra: "modificado_por, timestamp_modificacao, dados_antigos (audit trail)"

**Dado** que houve erro ao salvar
**Quando** o sistema detecta falha
**Então** exibe: "Erro ao salvar anamnese. Dados não foram alterados"
**E** registra no audit log: erro, timestamp, dados enviados