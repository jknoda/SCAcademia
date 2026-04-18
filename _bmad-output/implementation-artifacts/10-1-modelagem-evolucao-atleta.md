# Story 10.1: Modelagem da Evolução do Atleta

Status: done

## Story

Como sistema,
Quero armazenar avaliações, métricas e snapshots de evolução do atleta,
Para que o histórico possa ser consultado com segurança e consistência.

## Contexto de Negócio

- Esta story inaugura o novo Epic 10 — Evolução do Atleta.
- Ela cria a base estrutural para dashboard, histórico, comparações e alertas.
- Deve reutilizar a base já existente de autenticação, perfis, LGPD e treinos.
- É a primeira entrega e bloqueia as demais histórias do épico.

## Acceptance Criteria

### AC1 - Estrutura de dados para evolução
- DADO que o projeto já possui alunos, professores e histórico de treino
- QUANDO a modelagem for implementada
- ENTÃO o sistema deve possuir entidades para armazenar métricas, avaliações e snapshots por atleta e por período.

### AC2 - Multi-tenant e LGPD preservados
- DADO que a aplicação é multi-tenant
- QUANDO dados de evolução forem persistidos
- ENTÃO todo registro deve estar vinculado à academia correta
- E deve respeitar controle de acesso por perfil.

### AC3 - Métricas flexíveis e extensíveis
- DADO que os indicadores podem crescer ao longo do tempo
- QUANDO novas métricas forem adicionadas
- ENTÃO o modelo deve permitir cadastro por tipo, unidade, categoria e origem sem quebra estrutural.

### AC4 - Auditoria mínima de alterações
- DADO que avaliações podem ser criadas ou ajustadas por professores
- QUANDO ocorrer inclusão ou edição
- ENTÃO o sistema deve manter rastreabilidade básica de autoria e data.

### AC5 - Base pronta para consulta histórica
- DADO que o módulo de dashboard será implementado nas próximas stories
- QUANDO a modelagem estiver concluída
- ENTÃO os dados devem permitir agregação por período, comparação e cálculo de tendência.

### AC6 - Cobertura de testes da camada de persistência
- DADO que a modelagem foi criada
- QUANDO os testes forem executados
- ENTÃO os cenários de criação, leitura e isolamento por academia devem passar.

## Tasks / Subtasks

- [x] Criar migration para entidades de evolução do atleta
- [x] Definir tabelas para snapshots, avaliações, métricas e valores
- [x] Garantir chaves estrangeiras para aluno, professor e academia
- [x] Implementar camada de acesso a dados no backend
- [x] Adicionar validações básicas de domínio e unidade de medida
- [x] Cobrir persistência com testes automatizados

## Dev Notes

### Sugestão de entidades
- athlete_progress_profile
- athlete_progress_snapshot
- athlete_assessment
- athlete_metric_definition
- athlete_metric_value
- athlete_progress_alert

### Campos recomendados
- academy_id
- athlete_id
- recorded_by_user_id
- metric_code
- metric_category
- metric_value
- metric_unit
- measured_at
- notes
- source
- created_at / updated_at / deleted_at

### Dependências
- Reaproveitar RBAC e autenticação já concluídos
- Seguir convenções de banco já usadas no backend
- Manter aderência às regras de LGPD do projeto

## Dev Agent Record

### Completion Notes
- Base de modelagem implementada no backend com entidades para perfis, avaliações, definições de métricas, valores, snapshots e alertas de evolução.
- Rotas protegidas adicionadas para registrar avaliação e consultar resumo, histórico consolidado e filtros por período.
- Validação de payload, isolamento por academia e rastreabilidade básica de autoria e data aplicados.
- Fundação confirmada como pronta para suportar dashboard, comparações e insights do Epic 10.

### Verification Evidence
- Build do backend executado com sucesso em 2026-04-17.
- Suíte dedicada de evolução do atleta executada com 11 de 11 testes aprovados em 2026-04-17.
- Persistência, leitura, filtros e isolamento por academia verificados com evidência local.

## File List
- backend/src/database/migrations/V6_4__athlete_progress_foundation.sql
- backend/src/lib/athleteProgress.ts
- backend/src/controllers/athleteProgress.ts
- backend/src/routes/athleteProgress.ts
- backend/src/lib/validators.ts
- backend/src/app.ts
- backend/src/lib/database.ts
- backend/src/tests/athlete-progress.test.ts

## Change Log
- 2026-04-17: Story 10.1 iniciada e base técnica do módulo de evolução do atleta implementada com validação local.
- 2026-04-17: Story 10.1 revalidada com 11/11 testes aprovados e movida para review.
