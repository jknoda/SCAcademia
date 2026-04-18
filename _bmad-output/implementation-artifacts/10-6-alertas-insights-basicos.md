# Story 10.6: Alertas e Insights Básicos

Status: done

## Story

Como professor ou coordenação,
Quero receber alertas e insights simples sobre a evolução do atleta,
Para que eu possa agir rapidamente em casos de regressão, estagnação ou baixa frequência.

## Contexto de Negócio

- Esta é a camada inicial de inteligência do Epic 10.
- Deve ser leve, explicável e baseada em regras simples no MVP.
- Não depende de IA complexa para gerar valor imediato.

## Acceptance Criteria

### AC1 - Geração de alertas básicos
- DADO que existam dados suficientes de evolução
- QUANDO o sistema detectar baixa frequência, regressão ou estagnação
- ENTÃO deve gerar um alerta simples e compreensível.

### AC2 - Visualização no painel
- DADO que há alertas ativos
- QUANDO o usuário autorizado abrir o painel
- ENTÃO deve visualizar os avisos em destaque com contexto mínimo.

### AC3 - Regras transparentes
- DADO que o alerta foi exibido
- QUANDO o usuário consultá-lo
- ENTÃO deve ser possível entender de forma clara o motivo do aviso.

### AC4 - Segurança e perfil
- DADO que existem dados sensíveis
- QUANDO os insights forem mostrados
- ENTÃO apenas perfis autorizados devem acessá-los.

## Tasks / Subtasks

- [x] Definir regras simples de geração de alertas no backend
- [x] Persistir alertas relevantes por atleta quando necessário
- [x] Exibir alertas no painel de evolução
- [x] Permitir distinguir severidade ou tipo do alerta
- [x] Adicionar testes de regra e exibição

## Dev Notes

### Exemplos de alertas do MVP
- baixa frequência recente
- queda de desempenho técnico
- ausência de avaliações recentes
- regressão física percebida

### Dependências
- Stories 10.2 a 10.5
- Regras devem ser simples e auditáveis no MVP

### Validação realizada
- Backend: suíte de evolução do atleta com 9/9 testes aprovados
- Frontend: suíte Angular com TOTAL: 208 SUCCESS
- Build backend e build frontend executadas com sucesso
