# Sprint Planning — Evolução dos Atletas

## Resumo executivo

**Recomendação de roadmap:** tratar esta iniciativa como um **novo Épico 10 — Evolução do Atleta**, aproveitando a base já concluída dos módulos de treino, engajamento, perfis e LGPD. Isso evita misturar escopo de produto com os épicos técnicos 6, 7 e 8.

**Janela sugerida:** próxima sprint funcional após a estabilização mínima do backlog técnico crítico, podendo acontecer em paralelo parcial com melhorias de infraestrutura.

---

## 1. Objetivo da sprint

Entregar o planejamento executável de um MVP de acompanhamento da evolução dos atletas, permitindo visualizar progresso histórico, registrar avaliações e consolidar indicadores de treino e desempenho em um painel seguro, útil e incremental.

---

## 2. Backlog priorizado

### Prioridade P1 — MVP obrigatório
1. Estruturar modelo de dados de evolução do atleta
2. Criar endpoint de consulta do histórico consolidado
3. Implementar painel de evolução individual
4. Permitir registro de avaliações por professor
5. Exibir frequência, observações e indicadores básicos
6. Aplicar regras de acesso por perfil e LGPD

### Prioridade P2 — Valor alto na sequência
7. Comparação por período
8. Gráficos de tendência e progresso
9. Resumo automático de evolução e alertas de regressão
10. Filtros por janela de tempo, tipo de indicador e categoria

### Prioridade P3 — Pós-MVP
11. Ranking comparativo por turma ou categoria
12. Indicadores psicológicos estruturados
13. Integração com fontes externas ou wearables
14. Recomendações automáticas de treino

---

## 3. Histórias sugeridas

### Epic 10 — Evolução do Atleta

**10.1 — Modelagem da evolução do atleta**  
Como sistema, quero armazenar snapshots e avaliações de evolução para compor um histórico confiável por atleta.

**10.2 — Consulta consolidada da evolução**  
Como professor, quero visualizar os dados históricos do atleta em uma única visão para acompanhar progresso e regressão.

**10.3 — Painel de evolução individual**  
Como atleta ou responsável autorizado, quero ver um painel com métricas-chave e evolução por período.

**10.4 — Registro de avaliação do professor**  
Como professor, quero registrar observações técnicas, físicas e comportamentais para atualizar o histórico do atleta.

**10.5 — Comparação entre períodos**  
Como usuário autorizado, quero comparar desempenho entre períodos para identificar evolução real.

**10.6 — Alertas e insights básicos**  
Como coordenação ou professor, quero receber alertas de estagnação, regressão ou baixa frequência para agir rapidamente.

---

## 4. Proposta de fatiamento da sprint

### Fase 1 — Base técnica
- 10.1 Modelagem da evolução do atleta
- 10.2 Consulta consolidada da evolução

### Fase 2 — Entrega visível ao usuário
- 10.3 Painel de evolução individual
- 10.4 Registro de avaliação do professor

### Fase 3 — Ganho analítico
- 10.5 Comparação entre períodos
- 10.6 Alertas e insights básicos

---

## 5. Dependências

### Técnicas
- dados já existentes de treino, frequência, perfil do aluno e histórico já concluídos em épicos anteriores;
- autenticação, RBAC e controle de acesso já disponíveis;
- estrutura frontend para dashboards e cards já existente.

### Funcionais
- definição dos indicadores mínimos do MVP;
- alinhamento com professores sobre periodicidade e padrão de avaliação;
- validação com coordenação sobre visualização para responsáveis.

### Dependências recomendadas
- priorizar uma fonte de verdade inicial interna ao sistema;
- evitar depender de integrações externas no MVP.

---

## 6. Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Excesso de indicadores no MVP | atraso e complexidade | limitar MVP a métricas essenciais |
| Baixa qualidade dos dados informados | análises pouco confiáveis | padronizar formulário e validações |
| Sensibilidade dos dados de saúde e performance | risco de privacidade | aplicar RBAC, trilha de auditoria e consentimento |
| Dependência excessiva de input manual do professor | baixa adesão | tornar registro rápido e objetivo |
| Escopo competir com épicos técnicos pendentes | atraso de roadmap | executar como épico funcional paralelo e incremental |

---

## 7. Arquitetura técnica recomendada

### Backend
- criar módulo de evolução do atleta no domínio de progresso;
- expor endpoints para:
  - consulta resumida do dashboard;
  - consulta histórica por período;
  - criação de avaliações;
  - comparação entre datas ou ciclos.

### Banco de dados
Sugestão de entidades:
- athlete_progress_profile
- athlete_progress_snapshot
- athlete_assessment
- athlete_metric_definition
- athlete_metric_value
- athlete_progress_alert

### Frontend
- nova área de painel de evolução por atleta;
- cards de resumo no topo;
- gráfico temporal por métrica;
- tabela de histórico e observações;
- filtros por período, tipo de métrica e origem.

### Segurança e conformidade
- acesso por perfil;
- mascaramento e minimização de dados sensíveis;
- auditoria de alterações em avaliações;
- aderência aos fluxos já existentes de LGPD.

---

## 8. Critérios de validação e testes

### Backend
- validar autorização por perfil;
- validar consistência das métricas armazenadas;
- validar filtros de período e agregações;
- garantir respostas corretas mesmo com histórico parcial.

### Frontend
- renderização correta do painel sem dados, com dados parciais e com histórico completo;
- comparação visual entre períodos;
- usabilidade do formulário de avaliação.

### Negócio
- professor consegue registrar avaliação em poucos passos;
- atleta ou responsável consegue entender a evolução sem ambiguidade;
- coordenação consegue identificar casos de atenção.

---

## 9. Recomendação final de encaixe no roadmap

**Sugestão:** abrir um **Epic 10 — Evolução do Atleta**.

### Motivo
- aproveita funcionalidades já prontas dos épicos 3, 4 e 9;
- gera valor direto ao usuário final;
- não conflita conceitualmente com os épicos técnicos 6, 7 e 8;
- pode ser entregue de forma incremental com MVP claro.

### Próxima ação BMAD
1. Criar o novo épico e as histórias 10.1 a 10.6
2. Iniciar pela história 10.1
3. Depois seguir para 10.2 e 10.3, formando o primeiro incremento demonstrável
