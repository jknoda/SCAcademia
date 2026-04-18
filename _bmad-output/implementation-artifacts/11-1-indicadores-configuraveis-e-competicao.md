# Story 11.1: Indicadores Configuráveis e Métricas de Competição

Status: review

## Story

Como professor ou coordenação,
Quero configurar grupos e indicadores de evolução do atleta, incluindo métricas de competição por período,
Para adaptar a avaliação à realidade da academia e acompanhar cada atleta com mais precisão sem depender de campos fixos em código.

## Contexto de Negócio

- Esta story é uma extensão natural do módulo de evolução já entregue no Epic 10.
- O painel individual e o formulário de avaliação já existem, porém hoje a captura está fixa em poucos blocos predefinidos.
- A necessidade agora é permitir:
  - grupos configuráveis de indicadores;
  - descrição e instruções de preenchimento por item;
  - tipo, unidade e formato do valor;
  - suporte a valores compostos como 10:2;
  - indicadores agregados de competição, como número de competições por período.
- A pesquisa técnica consolidada recomendou abordagem incremental, compatível com o modelo atual e com foco inicial em competição e indicadores técnicos.

## Acceptance Criteria

### AC1 - Cadastro e ativação de grupos configuráveis
- DADO um usuário autorizado
- QUANDO cadastrar ou editar grupos de indicadores
- ENTÃO o sistema deve persistir nome, código, ordem de exibição, status ativo e escopo do grupo.

### AC2 - Metadados completos por indicador
- DADO um indicador configurável
- QUANDO ele for definido
- ENTÃO deve aceitar pelo menos nome, código, descrição, instrução de preenchimento, grupo, tipo de valor, unidade, formato e sinalização de comparação por período.

### AC3 - Suporte a valores estruturados
- DADO um indicador que exija valor composto
- QUANDO o professor informar um valor como 10:2 ou estrutura equivalente
- ENTÃO o backend deve armazenar a informação de forma canônica e a interface deve exibir o valor de maneira legível e consistente.

### AC4 - Formulário dinâmico de avaliação
- DADO que existam indicadores ativos
- QUANDO o professor abrir a tela de avaliação do atleta
- ENTÃO o formulário deve ser montado dinamicamente a partir da configuração, mantendo validação, mensagens de erro e boa usabilidade.

### AC5 - Indicadores de competição por período
- DADO registros de competição ou avaliações com dados competitivos
- QUANDO o painel consolidar um período
- ENTÃO deve exibir pelo menos número de competições por período e permitir comparação temporal dos indicadores configurados como agregáveis.

### AC6 - Compatibilidade com o histórico existente
- DADO avaliações antigas já salvas
- QUANDO a nova estrutura entrar em uso
- ENTÃO o histórico anterior deve continuar sendo exibido corretamente, sem quebra do dashboard ou da comparação entre períodos.

### AC7 - Segurança e perfis
- DADO que os dados do atleta são sensíveis
- QUANDO houver manutenção das configurações ou visualização dos resultados
- ENTÃO apenas perfis autorizados podem editar a configuração e perfis de leitura devem continuar restritos ao que já é permitido hoje.

## Tasks / Subtasks

- [x] Modelar persistência de grupos e definições de indicadores no backend
- [x] Definir contrato compatível para valores simples e estruturados
- [x] Adaptar endpoints de evolução para entregar configuração + histórico consolidado
- [x] Refatorar a tela de avaliação para renderização dinâmica por configuração ativa
- [x] Exibir indicadores de competição por período no painel individual
- [x] Preservar retrocompatibilidade com avaliações antigas
- [x] Cobrir o fluxo com testes automatizados de backend e frontend

## Dev Agent Context

### Situação atual já existente
- O dashboard individual de evolução está implementado e já consome histórico, comparações e alertas.
- O formulário de avaliação também existe, porém ainda trabalha com métricas hardcoded para técnico, físico e comportamental.
- A nova entrega deve evoluir essas bases sem regressão.

### Direção técnica obrigatória
- Manter a arquitetura atual de monólito modular com separação clara entre rotas, serviços e tipos compartilhados.
- Usar núcleo relacional para entidades estáveis e JSONB apenas quando realmente agregar flexibilidade ao valor estruturado ou metadados complementares.
- Evitar quebrar o payload atual do histórico do atleta; a expansão deve ser compatível com consumidores existentes.
- Tratar a configuração dinâmica como fonte de verdade para o formulário, mas permitir que indicadores atuais sejam carregados como seed inicial.

### Regras de modelagem recomendadas
- Grupo de indicador:
  - id
  - code
  - name
  - displayOrder
  - isActive
- Definição de indicador:
  - id
  - groupId
  - code
  - name
  - description
  - inputInstruction
  - valueType
  - unit
  - displayFormat
  - allowPeriodAggregation
  - isActive
- Valor avaliado:
  - primaryValue
  - secondaryValue opcional
  - displayValue opcional
  - structuredValue opcional

### Exemplo funcional esperado
- indicador: número de competições por período
- tipo: integer
- agregável por período: sim
- indicador composto: vitórias:derrotas
- exibição esperada: 10:2
- armazenamento sugerido: valores numéricos separados + representação pronta para display

### Arquivos prováveis de impacto
- Backend de evolução do atleta e rotas relacionadas ao histórico e às avaliações
- Serviço de API do frontend e tipos compartilhados de evolução
- Tela de formulário de avaliação do atleta
- Painel individual de evolução do atleta

### Guardrails para implementação
- Não reintroduzir campos fixos obrigatórios como única forma de avaliação.
- Não remover suporte às métricas atuais já exibidas no dashboard.
- Não assumir que todo indicador será numérico simples.
- Não expor edição de configuração para perfis sem permissão.
- Manter carregamento resiliente no frontend, especialmente em fluxos assíncronos de painel e formulário.

## Testing Requirements

### Backend
- Adicionar teste cobrindo criação e leitura de definições configuráveis
- Adicionar teste para persistência de valor estruturado como 10:2
- Adicionar teste para agregação de competição por período
- Validar retrocompatibilidade do histórico existente

### Frontend
- Adicionar teste para renderização dinâmica do formulário com base na configuração recebida
- Adicionar teste para submissão de payload estruturado
- Adicionar teste do painel exibindo o indicador de competição por período sem quebrar comparações já existentes

## Dependências

- Reaproveita a base entregue nas stories 10.3, 10.4 e 10.5
- Deve seguir as recomendações da pesquisa técnica de indicadores configuráveis
- Requer atenção às regras de acesso por perfil já existentes no projeto

## Fora de Escopo

- Motor avançado de IA para insights preditivos
- Integração com wearables ou sensores externos
- Ranking competitivo completo por federação

## Definition of Done

- Configuração dinâmica persistida e disponível por API
- Formulário renderizado a partir dessa configuração
- Histórico antigo preservado
- Indicadores de competição por período visíveis no painel
- Testes relevantes verdes em backend e frontend
- Build do projeto sem regressões

## Validação Executada

- Backend: suíte direcionada de evolução validada com 12/12 testes passando
- Frontend: suíte Angular validada com TOTAL: 227 SUCCESS
- Build: frontend gerado com sucesso; apenas warnings antigos de budget em estilos não relacionados à story

## Referências

- sprint-plan-evolucao-atletas.md
- technical-indicadores-evolucao-atletas-research-2026-04-17.md
- evolução já entregue no Epic 10
