Story 9.6: Saúde do Aluno Integrada ao Fluxo de Onboarding
Como um Administrador ou Responsável,
Quero preencher a anamnese de saúde do aluno como parte do processo de cadastro,
Para que nenhum aluno inicie atividades físicas na academia sem triagem de saúde registrada, garantindo segurança e conformidade operacional.

**Contexto:** O Epic 2 implementou o backend e front da anamnese de saúde (`health-screening-form`) de forma independente. A rota existe: `/health-screening/:studentId`. Esta story **não reimplementa** a anamnese — ela a **integra ao fluxo de onboarding** do aluno, tornando o preenchimento parte natural do cadastro.

**Critérios de Aceitação:**

**AC1 — Indicador de saúde na ficha do aluno**
**Dado** que o Admin acessa a ficha de um aluno
**Quando** visualiza a seção "Saúde"
**Então** o sistema exibe o status da anamnese:
  - 🟢 "Anamnese preenchida" (data do último preenchimento) + link "Visualizar / Editar"
  - 🔴 "Anamnese não preenchida" + botão "Preencher Agora"
**E** professores veem status simplificado (Sim/Não), sem link para dados completos (RBAC)

**AC2 — Botão "Preencher Anamnese" abre o formulário existente**
**Dado** que o aluno não tem anamnese
**Quando** o Admin clica em "Preencher Agora"
**Então** o sistema navega para `/health-screening/:studentId` (rota já existente)
**Ou** abre o formulário existente `HealthScreeningFormComponent` em modal/painel lateral
**E** ao salvar, retorna para a ficha do aluno

**AC3 — Status de prontidão do aluno para treinar**
**Dado** que o aluno está na lista da academia
**Quando** o Admin visualiza a lista
**Então** um ícone de status indica:
  - ✅ Completo: dados pessoais + responsável (se menor) + anamnese
  - ⚠️ Incompleto: faltando um ou mais itens acima
**E** ao passar o cursor sobre o ícone ⚠️, exibe tooltip com o que está faltando

**AC4 — Alerta ao registrar treino sem anamnese**
**Dado** que o Professor está marcando presença (Story 3.2) e um aluno sem anamnese está na lista
**Quando** o Professor tenta registrar o aluno como "Presente"
**Então** o sistema exibe aviso (não bloqueante): "⚠️ [Nome] não tem anamnese preenchida. Recomendamos preencher antes de registrar treino."
**E** o Professor pode continuar (aviso não impede o registro)

**AC5 — Relatório de alunos sem anamnese**
**Dado** que o Admin acessa `/admin/gestao-alunos` com filtro "Pendentes"
**Quando** aplica o filtro "Sem Anamnese"
**Então** o sistema lista todos os alunos ativos sem `health_record`
**E** exibe contagem: "X alunos sem anamnese preenchida"
**E** oferece botão de ação rápida "Preencher" por aluno

**AC6 — Responsável preenche anamnese (fluxo mobile-friendly)**
**Dado** que o Admin enviou link de acesso para o responsável
**Quando** o responsável (logado) acessa o sistema
**Então** vê no seu dashboard um cartão de ação: "Preencher Saúde de [Nome Filho]"
**E** ao clicar, acessa o formulário `HealthScreeningFormComponent` para o filho
**E** ao salvar, o status do filho é atualizado para "Anamnese preenchida"

**Notas Técnicas:**
- Esta story é principalmente de integração de UI — o backend de saúde já existe (Story 2.1)
- `GET /api/health-screening/:studentId` já retorna 404 se não existe → usar para checar status
- Indicador de completude do aluno pode ser calculado no frontend com 3 chamadas: perfil + anamnese + responsável (se menor)
- O aviso na Story 3.2 (AC4) requer pequena modificação no `training-attendance.component` para carregar status de anamnese dos alunos — avaliar custo (pode ser flag simples no endpoint de lista de alunos)
- Não usar dados de saúde sensíveis no aviso da Story 3.2 — apenas boolean "tem/não tem anamnese"
