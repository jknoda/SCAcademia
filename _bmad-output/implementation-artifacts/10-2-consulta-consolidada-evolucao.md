# Story 10.2: Consulta Consolidada da Evolução

Status: done

## Story

Como professor,
Quero consultar a evolução histórica do atleta em uma única visão consolidada,
Para que eu consiga avaliar progresso, regressão e necessidades de intervenção.

## Contexto de Negócio

- Esta story depende da base de dados criada na 10.1.
- Ela disponibiliza o backend do painel de evolução.
- Deve priorizar uma resposta simples, rápida e adequada ao MVP.

## Acceptance Criteria

### AC1 - Endpoint de resumo do atleta
- DADO um atleta válido da mesma academia
- QUANDO o professor consultar a evolução
- ENTÃO o sistema deve retornar resumo consolidado com métricas essenciais, última avaliação e tendências básicas.

### AC2 - Filtro por período
- DADO que o usuário deseja analisar janelas diferentes
- QUANDO informar período como semana, mês ou intervalo customizado
- ENTÃO a API deve devolver dados filtrados corretamente.

### AC3 - Histórico cronológico
- DADO que existem registros de evolução
- QUANDO a consulta for realizada
- ENTÃO o sistema deve retornar a linha do tempo das medições e avaliações em ordem coerente.

### AC4 - Segurança de acesso
- DADO usuários com perfis diferentes
- QUANDO tentarem consultar dados sem permissão
- ENTÃO o sistema deve bloquear o acesso conforme RBAC e tenant.

### AC5 - Performance mínima do MVP
- DADO que o dashboard será consumido com frequência
- QUANDO a consulta for executada
- ENTÃO a resposta deve ser paginável e otimizada para uso em tela.

## Tasks / Subtasks

- [x] Criar endpoint para resumo do progresso do atleta
- [x] Criar endpoint para histórico temporal com filtros por período
- [x] Implementar agregações e mapeamento de DTOs para frontend
- [x] Validar permissões por perfil e academia
- [x] Adicionar testes de sucesso, acesso indevido e ausência de dados

## Dev Notes

### Sugestão de endpoints
- GET /api/athletes/:athleteId/progress/summary
- GET /api/athletes/:athleteId/progress/history?from=&to=&groupBy=

### Resposta mínima esperada
- dados do atleta
- resumo das métricas principais
- últimas avaliações
- série histórica por período
- flags de risco ou estagnação quando houver

### Dependência principal
- Story 10.1 concluída
