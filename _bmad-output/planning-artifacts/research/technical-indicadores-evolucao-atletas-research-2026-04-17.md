---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
workflowType: 'research'
lastStep: 6
research_type: 'technical'
research_topic: 'implementação de indicadores configuráveis de evolução dos atletas'
research_goals: 'revisar a modelagem atual, propor arquitetura para grupos e indicadores com valor numérico, descrição e instrução de preenchimento, e orientar a manutenção dos dados dos alunos'
user_name: 'Noda'
date: '2026-04-17'
web_research_enabled: true
source_verification: true
---

# Indicadores Configuráveis de Evolução dos Atletas: Pesquisa Técnica Abrangente

**Date:** 2026-04-17
**Author:** Noda
**Research Type:** technical

---

## Executive Summary

Esta pesquisa técnica conclui que o SCAcademia já possui uma base sólida para evoluir o módulo de acompanhamento dos atletas sem reescrita estrutural. A melhor estratégia é ampliar o modelo existente para suportar grupos de indicadores configuráveis, metadados de preenchimento, valores compostos e projeções históricas por período, preservando o stack atual e reduzindo risco operacional.

Os achados mais fortes apontam para uma abordagem pragmática: manter o backend em Node.js + Express + TypeScript, o frontend em Angular com formulários dinâmicos e o PostgreSQL como fonte relacional principal, usando JSONB apenas como complemento flexível. Para indicadores de competição, como número de competições por período, a modelagem deve privilegiar persistência auditável no write model e visões agregadas no read model.

### Key Technical Findings

- a arquitetura atual suporta evolução incremental com baixo risco;
- formulários dinâmicos orientados por metadados são a opção mais sustentável;
- CQRS leve com snapshots e projeções melhora o consumo analítico;
- CI, pirâmide de testes e observabilidade são essenciais para qualidade contínua;
- o domínio de competição se beneficia de métricas estruturadas por período e não apenas texto livre.

### Technical Recommendations

- manter a solução como monólito modular bem delimitado;
- introduzir grupos e definições configuráveis com instruções e tipos de valor;
- adaptar o formulário de avaliação para consumir configuração dinâmica;
- tratar cálculos consolidados e alertas como efeitos derivados assíncronos;
- começar com rollout controlado para indicadores de competição e técnicos.

## Table of Contents

1. Research Overview
2. Technical Research Scope Confirmation
3. Technology Stack Analysis
4. Integration Patterns Analysis
5. Architectural Patterns and Design
6. Implementation Approaches and Technology Adoption
7. Technical Research Recommendations
8. Final Technical Synthesis
9. Source Verification Summary

## Research Overview

Pesquisa técnica iniciada para avaliar a melhor forma de implementar indicadores configuráveis de evolução dos atletas no contexto atual do SCAcademia.

---

## Technical Research Scope Confirmation

**Research Topic:** implementação de indicadores configuráveis de evolução dos atletas
**Research Goals:** revisar a modelagem atual, propor arquitetura para grupos e indicadores com valor numérico, descrição e instrução de preenchimento, e orientar a manutenção dos dados dos alunos

**Technical Research Scope:**

- Architecture Analysis - design patterns, frameworks, system architecture
- Implementation Approaches - development methodologies, coding patterns
- Technology Stack - languages, frameworks, tools, platforms
- Integration Patterns - APIs, protocols, interoperability
- Performance Considerations - scalability, optimization, patterns

**Research Methodology:**

- Current web data with rigorous source verification
- Multi-source validation for critical technical claims
- Confidence level framework for uncertain information
- Comprehensive technical coverage with architecture-specific insights

**Scope Confirmed:** 2026-04-17

## Technology Stack Analysis

### Programming Languages

O stack atual do projeto já está bem alinhado para este tipo de evolução incremental: TypeScript no backend e frontend reduz ambiguidade no contrato dos indicadores, permite tipagem forte para grupos, definições e payloads de lançamento, e favorece manutenção segura em cenários com muitos campos configuráveis.

Para este caso, a recomendação é manter TypeScript como linguagem única do módulo e expandir as interfaces já existentes para suportar metadados dos indicadores, formatos de entrada e campos auxiliares.

Popular Languages: TypeScript e JavaScript continuam sendo base natural para aplicações web full stack desse perfil.
Emerging Languages: não há ganho prático em trocar de stack para este caso.
Language Evolution: o valor maior aqui está em tipos derivados, contratos compartilhados e validação em tempo de compilação.
Performance Characteristics: o desempenho esperado é adequado para CRUD analítico e dashboards institucionais.
Source: https://www.typescriptlang.org/docs/

### Development Frameworks and Libraries

No frontend, Angular oferece suporte explícito a formulários dinâmicos baseados em metadados. A documentação oficial mostra que esse padrão é especialmente útil quando as perguntas ou campos mudam com frequência, exatamente o cenário dos grupos de indicadores de evolução.

No backend, Express continua apropriado para rotas modulares de cadastro de definições, consulta de indicadores e lançamento dos valores por aluno. O modelo atual do projeto já usa esse padrão com sucesso.

Major Frameworks: Angular para UI reativa e Node.js + Express para APIs.
Micro-frameworks: RxJS e formulários reativos complementam bem o fluxo configurável.
Evolution Trends: formulários guiados por metadados reduzem retrabalho de tela quando indicadores mudam.
Ecosystem Maturity: o ecossistema é maduro e já adotado no projeto.
Source: https://angular.dev/guide/forms/dynamic-forms
Source: https://expressjs.com/en/guide/routing.html

### Database and Storage Technologies

A base atual já segue uma linha correta: PostgreSQL relacional para entidades centrais e JSONB para snapshots e contexto flexível. A documentação oficial recomenda JSONB na maioria das aplicações quando há necessidade de eficiência, indexação e consultas estruturadas. Também ressalta que JSONB e relacional podem coexistir de forma complementar.

Para os novos indicadores, a melhor abordagem é híbrida:
- manter definições e valores principais em tabelas relacionais;
- usar JSONB apenas para metadados complementares, como regras extras, exemplos e contexto analítico.

Relational Databases: PostgreSQL é a melhor opção para persistir aluno, avaliação, definição de indicador e histórico auditável.
NoSQL Features Inside SQL: JSONB resolve flexibilidade sem perder consistência.
In-Memory Databases: não são necessários nesta fase para esse módulo.
Data Warehousing: fora do escopo do MVP.
Source: https://www.postgresql.org/docs/current/datatype-json.html

### Development Tools and Platforms

O projeto já está aderente a ferramentas adequadas para continuidade: Angular CLI para build e testes, Karma/Jasmine para frontend e TypeScript com tsconfig estruturado. Isso é suficiente para sustentar a evolução dos formulários de indicadores sem troca de plataforma.

IDE and Editors: VS Code + TypeScript tooling permanecem adequados.
Version Control: Git segue suficiente para incrementalismo do módulo.
Build Systems: Angular CLI e toolchain TypeScript suportam bem o fluxo.
Testing Frameworks: specs de componente e testes de API devem cobrir definições, permissões e persistência dos valores.
Source: https://www.typescriptlang.org/docs/

### Cloud Infrastructure and Deployment

Não há necessidade de nova infraestrutura para esse item. A recomendação é manter o mesmo padrão de deploy do sistema e apenas garantir que o backend rode sobre versões LTS do Node.js, já que a própria fundação Node reforça o uso de ramos LTS para produção.

Major Cloud Providers: indiferente neste momento.
Container Technologies: opcionais, sem impacto direto na modelagem.
Serverless Platforms: não trazem vantagem clara para esse módulo.
CDN and Edge Computing: irrelevantes para o lançamento dos indicadores.
Source: https://nodejs.org/en/about/previous-releases

### Technology Adoption Trends

A principal tendência tecnicamente relevante para essa demanda é a configuração orientada por metadados: em vez de criar um formulário fixo para cada grupo, o sistema passa a ler definições persistidas e montar dinamicamente campos, descrições e instruções. Isso aumenta a longevidade do módulo e reduz custo de manutenção.

Migration Patterns: sair de avaliação fixa para avaliação configurável por definição.
Emerging Technologies: uso de formulários dinâmicos e metadados versionados.
Legacy Technology: evitar hardcode de campos diretamente no componente.
Community Trends: forte preferência por contratos tipados e formulários dinâmicos em cenários regulatórios e de domínio variável.
Source: https://angular.dev/guide/forms/dynamic-forms

## Integration Patterns Analysis

### Current Integration Fit With the Codebase

O código atual já expõe um padrão REST consistente para o domínio de evolução: rotas HTTP sob o mesmo módulo, autenticação obrigatória, autorização por papel e limitação de taxa. Isso indica que a evolução dos indicadores deve preservar o modelo HTTP + JSON já adotado, em vez de introduzir um segundo protocolo para o mesmo fluxo funcional.

No repositório, as rotas atuais de avaliações e consultas seguem exatamente essa linha, o que reduz risco de regressão e simplifica a adoção incremental no frontend Angular.

Integration Fit: alta aderência ao padrão REST já existente.
Codebase Evidence: uso de authMiddleware, requireRole e endpoints modulares em athleteProgress.
Recommendation Strength: alta.

### Recommended API Integration Pattern

A especificação OpenAPI define um contrato padronizado e independente de linguagem para APIs HTTP, favorecendo entendimento humano, geração de documentação e interoperabilidade entre cliente e servidor. Para este módulo, isso combina muito bem com o stack atual e com a necessidade de formularios configuráveis orientados por metadados.

A recomendação é manter uma API RESTful orientada a recursos, adicionando endpoints específicos para configuração e consumo dos indicadores:

- grupos de indicadores: listar, criar, ordenar, ativar e desativar;
- definições de indicadores: manter código, nome, descrição, instrução de preenchimento, unidade e formato;
- configuração de formulário por atleta ou por grupo: retornar metadados para montagem dinâmica da tela;
- lançamentos de avaliação: continuar centralizados em assessments, mas aceitando indicadores vindos da configuração persistida.

Sugestão de recursos de API:
- GET /api/athlete-progress/indicator-groups
- POST /api/athlete-progress/indicator-groups
- GET /api/athlete-progress/metric-definitions?group=competition&active=true
- POST /api/athlete-progress/metric-definitions
- PUT /api/athlete-progress/metric-definitions/:metricDefinitionId
- GET /api/athlete-progress/athletes/:athleteId/form-config
- POST /api/athlete-progress/assessments

Source: https://spec.openapis.org/oas/latest.html

### Payload and Interoperability Strategy

Para manter interoperabilidade e consistência entre backend e frontend, o valor do indicador não deve depender somente de uma string livre como 10:2. O ideal é trafegar um payload canônico com campos estruturados e deixar a representação textual como apoio visual.

Exemplo conceitual de interoperabilidade:
- valueType: integer, decimal, percentage, time, ratio, text
- primaryValue: valor principal numérico
- secondaryValue: valor secundário quando aplicável
- displayValue: representação amigável, como 10:2
- unitLabel: kg, %, pontos, repetições
- inputInstruction: orientação exibida na tela

Esse desenho permite que o Angular monte formulários dinâmicos, que o backend valide por tipo e que relatórios futuros filtrem e agreguem dados de forma confiável.

Interoperability Pattern: contrato tipado compartilhado + metadados da definição.
Backward Compatibility: alta, pois o endpoint de assessments pode ser estendido sem quebrar a leitura histórica.

### Security and Authorization Pattern

A RFC 6750 recomenda explicitamente o envio de bearer tokens no cabeçalho Authorization e não em URLs. Também reforça uso obrigatório de TLS e desencoraja o transporte do token em query string por risco de exposição em logs, histórico e caches.

Aplicando isso ao SCAcademia, o padrão recomendado é:
- autenticação via bearer token no cabeçalho;
- proibição de token em query string;
- 401 para token ausente ou inválido;
- 403 para escopo ou papel insuficiente;
- manutenção do RBAC atual, onde Professor e Admin configuram e lançam avaliações, enquanto Responsavel e Aluno ficam em leitura;
- auditoria de alterações de definição, ativação, desativação e lançamento.

A própria especificação também recomenda contratos de segurança explícitos por operação, o que reforça a utilidade de documentar o módulo com OpenAPI.

Source: https://datatracker.ietf.org/doc/html/rfc6750
Source: https://spec.openapis.org/oas/latest.html

### Event-Driven and Async Side Effects

Para o cenário atual, não há evidência técnica de necessidade de migrar para gRPC nem para uma arquitetura de mensageria pesada. A documentação oficial do gRPC mostra que ele é especialmente útil em ambientes distribuídos, com contratos gerados por proto e comunicação serviço-a-serviço de alta eficiência. Esse não é o caso principal do módulo atual, que é um sistema web institucional, centrado em frontend Angular e API Express monolítica/modular.

Portanto, a recomendação é:
- manter CRUD síncrono via REST para definições e avaliações;
- executar efeitos derivados de forma assíncrona após a gravação, como recomputar snapshots, gerar alertas e persistir auditoria;
- só considerar mensageria dedicada se o volume analítico ou integrações externas crescerem significativamente.

Source: https://grpc.io/docs/what-is-grpc/introduction/

### Integration Recommendation Summary

A melhor estratégia de integração para os indicadores configuráveis é ampliar o padrão existente, não substituí-lo:

- manter REST + JSON como interface principal;
- formalizar os contratos com OpenAPI;
- usar JWT bearer no cabeçalho com RBAC por papel e escopo de academia;
- expor metadados de grupos e indicadores para montagem dinâmica do formulário no frontend;
- tratar recálculo de snapshots e alertas como efeito derivado assíncrono, preservando boa experiência de uso.

Confidence Level: alta.
Rationale: a recomendação está alinhada com o código atual do projeto e com documentação oficial de OpenAPI, OAuth Bearer e gRPC.

## Architectural Patterns and Design

### System Architecture Patterns

Para este contexto, a arquitetura mais adequada não é uma quebra imediata em microserviços, mas sim a evolução de um monólito modular em camadas, preservando a separação entre apresentação, regras de negócio e persistência. A documentação da Microsoft destaca N-tier como abordagem apropriada para domínios empresariais tradicionais e também mostra que Web-Queue-Worker é útil quando existem tarefas assíncronas ou mais pesadas. Martin Fowler reforça que equipes costumam ter melhores resultados começando com monólito bem modularizado e só extraindo serviços quando os limites estiverem maduros.

Aplicando isso ao SCAcademia, a recomendação é manter:
- Angular como camada de apresentação;
- Express controllers e routes como camada de entrada HTTP;
- um núcleo de domínio para definições de indicadores, avaliações, snapshots e alertas;
- PostgreSQL como fonte principal de verdade.

Architectural Direction: modular monolith + layered architecture.
Microservices Decision: não recomendado nesta fase.
Source: https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/
Source: https://martinfowler.com/bliki/MonolithFirst.html

### Design Principles and Best Practices

A melhor decisão arquitetural é separar claramente o que é cadastro/configuração do que é consulta analítica. O código atual já aponta nessa direção, pois possui avaliações transacionais e também snapshots, histórico agrupado e alertas. A orientação mais segura é consolidar isso como um CQRS leve: comandos para manter definições e lançar avaliações; consultas otimizadas para dashboards, comparação por período e indicadores como número de competições por período.

Isso reduz acoplamento e facilita evolução futura dos indicadores sem reescrever telas ou regras centrais.

Recommended Principles:
- separação entre modelo de escrita e modelo de leitura;
- contratos tipados compartilhados entre backend e frontend;
- bounded context claro para evolução do atleta;
- versionamento de definições de indicador para preservar histórico.
Source: https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs

### Scalability and Performance Patterns

A documentação de CQRS mostra que separar leituras e escritas ajuda quando o sistema precisa otimizar consultas, reduzir contenção e entregar visões específicas para a interface. Para este módulo, isso se traduz em manter a gravação das avaliações como fluxo transacional simples e recalcular visões de leitura derivadas para o dashboard.

Padrões recomendados:
- projeções de leitura por atleta e por período;
- snapshots periódicos para evitar recomputação completa;
- índices por atleta, data, grupo e código do indicador;
- processamento assíncrono para alertas e consolidações após cada avaliação ou resultado de competição.

Esses padrões também se alinham aos pilares de desempenho, confiabilidade e excelência operacional do AWS Well-Architected.

Source: https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs
Source: https://aws.amazon.com/architecture/well-architected/

### Integration and Communication Patterns

Em vez de distribuir o domínio em vários serviços, o mais consistente é manter comunicação síncrona por REST para as operações principais e reservar comunicação assíncrona apenas para efeitos derivados. Isso combina com o estilo Web-Queue-Worker descrito pela Microsoft, no qual a aplicação web recebe a requisição e delega tarefas de maior custo para processamento posterior.

No cenário do SCAcademia, os efeitos assíncronos ideais são:
- recomputar ranking e resumos de competição;
- atualizar snapshots de evolução;
- recalcular alertas de estagnação ou regressão;
- registrar auditoria detalhada.

Source: https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/

### Security Architecture Patterns

A arquitetura deve tratar segurança como atributo estrutural e não apenas validação de endpoint. Os pilares do AWS Well-Architected enfatizam segurança, confiabilidade e excelência operacional como critérios permanentes de desenho. Para este módulo, isso significa isolamento por academia, trilha de auditoria, RBAC por perfil e proteção do canal com autenticação já consolidada.

Decisões arquiteturais recomendadas:
- professor e admin com escrita;
- aluno e responsável com leitura controlada;
- auditoria para criação, edição, ativação e desativação de indicadores;
- versionamento das definições para rastreabilidade histórica;
- segregação entre dados sensíveis de saúde e indicadores esportivos exibidos em painéis.

Source: https://aws.amazon.com/architecture/well-architected/

### Data Architecture Patterns

O desenho de dados deve combinar consistência relacional com flexibilidade controlada. O write model continua relacional para grupos, definições, avaliações e valores. Já o read model pode usar snapshots e estruturas materializadas para responder rapidamente a perguntas de negócio, inclusive métricas de competição agregadas por semana, mês ou ciclo esportivo.

A recomendação mais forte é:
- tabelas relacionais para group, indicator definition, assessment e metric value;
- metadados complementares em JSONB apenas quando a estrutura variar;
- snapshots materializados para leitura rápida;
- histórico imutável suficiente para reprocessamento futuro.

Source: https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs
Source: https://www.postgresql.org/docs/current/datatype-json.html

### Deployment and Operations Architecture

Operacionalmente, o módulo deve continuar simples de publicar e observar. A recomendação arquitetural não exige nova plataforma, mas pede disciplina operacional: logs estruturados, monitoramento de erros de processamento, retries seguros para jobs assíncronos e execução em Node LTS.

Boas práticas operacionais:
- manter pipeline atual de build e testes;
- adicionar observabilidade para falhas de recálculo;
- criar jobs idempotentes para snapshots e alertas;
- evitar dependências distribuídas desnecessárias nesta fase.

Source: https://aws.amazon.com/architecture/well-architected/
Source: https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/

### Architectural Recommendation Summary

A recomendação arquitetural para os indicadores configuráveis de evolução dos atletas é clara:

- evoluir o módulo como monólito modular bem delimitado;
- aplicar CQRS leve para separar escrita operacional e leitura analítica;
- usar projeções e snapshots para indicadores históricos e competição por período;
- reservar processamento assíncrono para consolidação, alertas e auditoria;
- manter a porta principal do sistema em REST, com segurança e observabilidade reforçadas.

Confidence Level: alta.
Reasoning: a solução aproveita a base já existente no projeto, reduz complexidade desnecessária e segue boas práticas atuais de arquitetura em fontes reconhecidas.

## Implementation Approaches and Technology Adoption

### Technology Adoption Strategies

A adoção recomendada para este módulo deve ser incremental, não disruptiva. Em vez de trocar a experiência atual de uma vez, a melhor estratégia é introduzir o modelo configurável por trás das telas já existentes e ativá-lo progressivamente por grupo de indicadores, começando pelos de competição e técnicos. Esse caminho reduz risco funcional e ajuda a validar o desenho com professores antes de ampliar o escopo.

A própria literatura de integração e evolução de software favorece mudanças pequenas, frequentes e reversíveis, com uso de feature flags, migrações progressivas e rollout controlado.

Source: https://martinfowler.com/articles/continuousIntegration.html

### Development Workflows and Tooling

A forma mais segura de implementar essa evolução é manter integração frequente na branch principal, build automatizado e validação contínua do frontend e backend. A documentação do GitHub Actions confirma que a plataforma suporta fluxos completos de automação para build, teste e CI/CD diretamente no repositório.

Fluxo recomendado:
- commits pequenos e frequentes;
- pipeline com lint, testes e build a cada push relevante;
- revisão enxuta e focada em risco;
- rastreabilidade das mudanças de schema, payload e UI.

Ferramentas adequadas no contexto atual:
- Git + fluxo curto de integração;
- GitHub Actions para automações;
- Angular CLI e testes do frontend;
- testes de API/backend e migrações versionadas.

Source: https://docs.github.com/en/actions
Source: https://martinfowler.com/articles/continuousIntegration.html

### Testing and Quality Assurance

A abordagem mais indicada é uma pirâmide de testes prática: muitos testes pequenos e rápidos, alguns testes de integração e poucos testes end-to-end realmente críticos. Fowler mostra que o valor está em feedback rápido, evitar duplicação e descer o máximo possível a verificação para níveis mais baratos e confiáveis.

Para os indicadores configuráveis, isso significa:
- testes unitários para builders de formulário, normalização de payload e regras de validação;
- testes de integração para persistência de definições, avaliações, snapshots e cálculos por período, como número de competições por período;
- poucos testes end-to-end para o fluxo professor cria indicador → avalia atleta → dashboard atualiza.

Source: https://martinfowler.com/articles/practical-test-pyramid.html

### Deployment and Operations Practices

As práticas operacionais devem privilegiar automação, observabilidade e deploy seguro. A documentação de Operational Excellence da Microsoft enfatiza cultura DevOps, automação, observabilidade e práticas seguras de implantação como fundamentos para manter qualidade contínua do workload.

Recomendações práticas:
- logs estruturados para criação/edição de indicadores e avaliações;
- monitoramento de jobs de snapshot e alertas;
- rollback simples de mudanças de schema e feature flags;
- ambientes de teste próximos do comportamento de produção;
- rastreamento visível do status do pipeline e da versão implantada.

Source: https://learn.microsoft.com/en-us/azure/well-architected/operational-excellence/
Source: https://martinfowler.com/articles/continuousIntegration.html

### Team Organization and Skills

O nível de habilidade configurado no projeto é intermediário, então a implementação deve evitar padrões sofisticados demais logo de início. O desenho mais adequado é aquele que o time atual consegue sustentar: formulários dinâmicos em Angular, contratos tipados em TypeScript, migrações pequenas e testes direcionados ao comportamento real.

Competências prioritárias para o time:
- tipagem e contratos compartilhados em TypeScript;
- formulários dinâmicos e reativos em Angular;
- evolução de schema com segurança;
- desenho de testes de integração e regressão;
- observabilidade básica para diagnosticar falhas no recálculo dos painéis.

Source: https://learn.microsoft.com/en-us/azure/well-architected/operational-excellence/

### Cost Optimization and Resource Management

O melhor custo-benefício aqui vem da reutilização da base existente. Não há justificativa técnica para adicionar novos bancos, brokers complexos ou plataformas distribuídas caras nesta etapa. A otimização mais importante é investir em boa modelagem, automação de testes e processamento assíncrono pontual, evitando retrabalho futuro.

Em termos de custo operacional:
- reaproveitar o backend e frontend atuais;
- usar snapshots para reduzir consultas repetitivas pesadas;
- limitar end-to-end ao fluxo essencial;
- automatizar regressões para diminuir custo humano de validação manual.

Source: https://aws.amazon.com/architecture/well-architected/

### Risk Assessment and Mitigation

Os principais riscos de implementação já aparecem claramente no contexto do projeto: excesso de flexibilidade sem governança, baixa adesão do professor, inconsistência de dados e acoplamento indevido entre modelo histórico e nova configuração. A mitigação é feita com rollout progressivo, defaults úteis, validação de payload, auditoria e testes de regressão.

Matriz resumida:
- risco de complexidade excessiva → iniciar com grupos prioritários e formatos padronizados;
- risco de dados ruins → instruções claras de preenchimento e validação por tipo;
- risco de regressão → manter compatibilidade com assessments existentes e adicionar testes de história real;
- risco operacional → observabilidade e jobs idempotentes.

Source: https://learn.microsoft.com/en-us/azure/well-architected/operational-excellence/

## Technical Research Recommendations

### Implementation Roadmap

1. introduzir entidade de grupo/configuração de indicador;
2. estender definições com descrição, instrução e tipo de valor;
3. adaptar endpoint de form-config para retornar metadados dinâmicos;
4. migrar a tela de avaliação para formulário configurável;
5. recalcular snapshots e comparações por período, incluindo métricas de competição;
6. validar com rollout inicial em poucos grupos de indicadores.

### Technology Stack Recommendations

- manter Angular + Reactive Forms no frontend;
- manter Node/Express + TypeScript no backend;
- manter PostgreSQL relacional com JSONB apenas para metadados complementares;
- usar automação de pipeline existente como base do CI.

### Skill Development Requirements

- reforçar boas práticas de formulários dinâmicos;
- padronizar escrita de testes de integração e regressão;
- treinar versionamento de schema e rollout seguro;
- consolidar convenções de contratos tipados entre frontend e backend.

### Success Metrics and KPIs

- tempo para cadastrar novo indicador sem mudança de código;
- percentual de avaliações preenchidas pelos professores;
- taxa de falhas de validação por payload;
- tempo de resposta do dashboard após atualização;
- quantidade de regressões detectadas automaticamente antes de produção.

### Final Recommendation Summary

A implementação ideal para esta iniciativa é pragmática e incremental:

- evoluir o que já existe, sem reescrever o módulo;
- introduzir configuração guiada por metadados com rollout progressivo;
- sustentar a mudança com CI, pirâmide de testes e observabilidade;
- priorizar valor prático, começando por indicadores de competição e técnicos que já têm demanda explícita do negócio.

Confidence Level: alta.
Reasoning: as recomendações estão alinhadas com o estado atual do repositório e com fontes atuais e reconhecidas sobre CI, automação, testes e excelência operacional.

## Final Technical Synthesis

A síntese final desta pesquisa mostra que a demanda do negócio pode ser atendida com segurança sem ruptura arquitetural. O ponto central não é criar um sistema totalmente novo, mas transformar o módulo atual em uma plataforma de indicadores configuráveis, com governança, boa experiência de uso e histórico consistente.

Do ponto de vista técnico, a decisão mais forte é combinar:
- persistência relacional confiável para definições e lançamentos;
- metadados controlados para configuração de UI e validação;
- leitura otimizada por snapshots e projeções históricas;
- rollout incremental apoiado por automação e observabilidade.

Isso atende tanto os indicadores simples quanto valores compostos e indicadores por período, inclusive no eixo de competição.

## Source Verification Summary

A pesquisa foi consolidada com base em documentação técnica oficial e referências amplamente reconhecidas na indústria, incluindo:

- Angular documentation para formulários dinâmicos;
- Express documentation para rotas e integração HTTP;
- PostgreSQL documentation para JSONB e modelagem híbrida;
- OpenAPI Specification para contratos de API;
- RFC 6750 para segurança com bearer token;
- Microsoft Azure Well-Architected para excelência operacional;
- Martin Fowler para CI, rollout seguro e estratégia de testes;
- AWS Well-Architected para princípios operacionais e de confiabilidade.

## Final Conclusion

A recomendação final para o SCAcademia é seguir com a implementação dos indicadores configuráveis usando a arquitetura atual como base, priorizando indicadores de competição, técnicos e físicos mais relevantes para o MVP. O sistema está maduro o suficiente para essa evolução, desde que a mudança seja entregue em fatias pequenas, verificáveis e sustentadas por testes reais.

**Workflow Status:** complete
**Research Status:** finalized and ready to inform implementation
**Next Recommended Action:** converter esta pesquisa em histórias técnicas e iniciar a implementação do item 6 do plano de sprint