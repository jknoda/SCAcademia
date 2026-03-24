# Story 2.5: Direito ao Esquecimento

Status: in-progress

## Story

Como um Responsavel ou Admin,
Quero solicitar delecao de dados de um aluno menor,
Para que respeitar o direito ao esquecimento (LGPD) e nao reter dados desnecessarios.

## Contexto de Negocio

- Foco em conformidade LGPD para menores de idade e seus responsaveis.
- Story depende das bases ja implementadas em saude/consentimento/auditoria (Epic 2).
- Delecao deve preservar rastreabilidade legal (audit logs), mas remover/anonimizar dados pessoais e sensiveis.
- Fluxo inclui janela de graca de 30 dias com possibilidade de cancelamento.

## Acceptance Criteria

### AC1 - Solicitar Delecao (UI + Confirmacao)
- DADO que um responsavel quer deletar dados de seu filho
- QUANDO acessa "Minha Conta > Dados do Meu Filho > Solicitar Delecao"
- ENTAO o sistema exibe:
  - Aviso: "Isso deletara permanentemente os dados apos 30 dias de graca"
  - Checkbox: "Entendo e concordo"
  - Texto do aluno especifico: [Nome Aluno]
  - Botao: "Solicitar Delecao"

### AC2 - Persistir Solicitacao
- DADO que a solicitacao de delecao e submetida
- QUANDO o sistema processa
- ENTAO cria record em `deletion_requests`:
  - `student_id`
  - `requested_by_id` (responsavel ou admin)
  - `status = pending`
  - `requested_at = agora`
  - `deletion_scheduled_at = agora + 30 dias`
  - `reason` (opcional)

### AC3 - Cancelamento Durante Janela de Graca
- DADO que 30 dias de graca iniciaram
- QUANDO a academia cancela dentro desse periodo
- ENTAO Admin consegue via "Deletar > Cancelar Delecao"
- E se cancelada, record e removido e aluno pode continuar usando

### AC4 - Execucao de Delecao Apos 30 Dias
- DADO que 30 dias expiraram
- QUANDO sistema processa agendamento
- ENTAO inicia cascade delete:
  1. `soft_delete` em `students`
  2. Anonimizar dados em `training_attendance`
  3. Anonimizar `performance_notes`
  4. `DELETE` hard em `health_history`
  5. `DELETE` em `consents`
  6. Manter `audit_logs` (compliance)

### AC5 - Comportamento Pos-Delecao
- DADO que dados foram deletados
- QUANDO Admin/aluno tenta acessar perfil
- ENTAO exibe: "Perfil deletado em [data]"
- E nao expoe nenhuma informacao pessoal do aluno

### AC6 - Restore de Backup Respeita Delecao
- DADO que backup/restore precisa ser feito
- QUANDO Admin faz restore de backup antigo
- ENTAO dados deletados NAO sao restaurados
- E soft deletes sao respeitados no restore

### AC7 - Prioridade do Direito do Menor
- DADO que era aluno menor e responsavel solicitou delecao
- QUANDO aluno completa 18 anos
- ENTAO delecao permanece valida
- E direito do menor prevalece

## Tasks / Subtasks

- [ ] **Task 1 - Modelagem e persistencia de `deletion_requests`** (AC2)
  - [ ] Criar schema/tabela e indice por `status` e `deletion_scheduled_at`
  - [ ] Repository/lib para criar, consultar e cancelar solicitacoes

- [ ] **Task 2 - Endpoints de solicitacao e cancelamento** (AC1, AC2, AC3)
  - [ ] Endpoint para solicitar delecao com validacao de permissao
  - [ ] Endpoint para cancelar dentro da janela de 30 dias
  - [ ] Auditoria completa das acoes (request/cancel)

- [ ] **Task 3 - Job de processamento agendado** (AC4)
  - [ ] Implementar rotina segura e idempotente
  - [ ] Aplicar policy de soft delete + anonimiza + hard delete por dominio
  - [ ] Registrar trilha de auditoria da execucao

- [ ] **Task 4 - Regras de acesso pos-delecao** (AC5)
  - [ ] Bloquear exposicao de PII no perfil deletado
  - [ ] Exibir mensagem padronizada com data de delecao

- [ ] **Task 5 - Integridade em backup/restore** (AC6)
  - [ ] Definir mecanismo para impedir restauracao de dados deletados
  - [ ] Testar cenarios de restore com soft delete e anonimiza

- [ ] **Task 6 - Frontend fluxo de solicitacao/cancelamento** (AC1, AC3)
  - [ ] Tela de confirmacao com checkbox obrigatorio
  - [ ] Status visivel da solicitacao e data programada
  - [ ] Acao de cancelamento para Admin no prazo

- [ ] **Task 7 - Testes de integracao e regressao** (AC1-AC7)
  - [ ] Cobrir request, cancel, expiracao, execucao e pos-delecao
  - [ ] Cobrir tentativa de acesso indevido e trilha de auditoria
  - [ ] Cobrir restore respeitando delecoes

## Dev Notes

- Manter `audit_logs` como fonte legal de rastreabilidade (append-only).
- Garantir que operacoes de delecao sejam idempotentes para evitar duplicidade em reprocessamento.
- Tratar dados sensiveis com prioridade: remover definitivamente quando exigido por LGPD.
- Padronizar mensagens de erro/sucesso em pt-BR, consistente com backend/frontend atual.
