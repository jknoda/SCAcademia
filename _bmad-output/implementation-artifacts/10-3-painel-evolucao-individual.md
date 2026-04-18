# Story 10.3: Painel de Evolução Individual

Status: done

## Story

Como atleta, responsável ou professor autorizado,
Quero visualizar um painel individual de evolução,
Para que eu compreenda o progresso do atleta ao longo do tempo.

## Contexto de Negócio

- Esta é a primeira entrega visível ao usuário final no Epic 10.
- Reaproveita o padrão de dashboards e cards já existente no projeto.
- O objetivo é entregar clareza visual sem excesso de complexidade no MVP.

## Acceptance Criteria

### AC1 - Visão resumida do progresso
- DADO que o usuário acessa a área de evolução do atleta
- QUANDO o painel carregar
- ENTÃO ele deve ver cards com métricas principais, status recente e observações resumidas.

### AC2 - Histórico por período
- DADO que existem dados registrados
- QUANDO o usuário alternar o período
- ENTÃO o painel deve atualizar gráficos e histórico com coerência.

### AC3 - Estados de tela
- DADO que pode haver ausência parcial de dados
- QUANDO o painel for exibido
- ENTÃO a interface deve tratar estados vazio, carregando, erro e dados parciais.

### AC4 - Acesso conforme perfil
- DADO que o usuário possui permissão válida
- QUANDO abrir o painel
- ENTÃO verá apenas os atletas permitidos pelo seu papel no sistema.

### AC5 - Boa legibilidade no MVP
- DADO que o painel exibe múltiplos indicadores
- QUANDO o usuário analisar a tela
- ENTÃO a apresentação deve ser clara, objetiva e escaneável.

## Tasks / Subtasks

- [x] Criar rota e página do painel de evolução individual
- [x] Implementar cards de resumo no topo
- [x] Exibir gráfico temporal com filtros de período
- [x] Exibir histórico resumido e observações recentes
- [x] Tratar loading, empty state e erro
- [x] Cobrir componentes críticos com testes de interface

## Dev Notes

### Blocos sugeridos da interface
- resumo geral
- frequência e assiduidade
- desempenho técnico
- evolução física
- observações recentes do professor

### Dependências
- Story 10.2 para consumo de dados consolidados
- Reaproveitar componentes visuais dos dashboards do aluno e admin

## Dev Agent Record

### Implementação concluída
- criada a rota do painel individual em atleta-progress/:studentId/dashboard
- criado componente dedicado com cards de resumo, filtros 30d/90d/tudo, gráfico temporal e histórico de observações
- adicionados atalhos de navegação pela ficha do aluno e pela home do aluno/responsável
- reforçado o controle de acesso no backend para impedir que aluno veja outro atleta e que responsável sem vínculo acesse dados indevidos

### Validação
- backend: 7/7 testes da suíte athlete-progress passaram
- frontend: 206/206 testes executados com sucesso no Karma
- frontend build: concluído com sucesso, apenas warnings já conhecidos de budget SCSS
