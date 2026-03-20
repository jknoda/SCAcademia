---
stepsCompleted: [1, 2, 2b, 2c, 3, 4, 5, 6, 7, 8, 9, 10]
inputDocuments: [product-brief-SCAcademia.md]
date: 2026-03-19
author: Noda
project: SCAcademia
version: 1.0-Draft
status: Ready for Review
classification:
  projectType: Web App
  domain: EdTech + Healthcare
  complexity: MÉDIA-ALTA
  projectContext: Greenfield
  model: Single-Tenant
---

# Product Requirements Document - SCAcademia
## Sistema de Gestão de Academia de Judo, Especializado em Rastreamento de Performance e Conformidade LGPD

---

## Executive Summary

**SCAcademia** é um sistema web especializado para academias de judo que centraliza gestão de alunos, rastreamento de performance e conformidade legal — transformando como academias fazem decisões e aumentando retenção através de visibilidade clara de progresso.

O diferencial competitivo é capturar a natureza **multidimensional do progresso em judo**: técnica aprendida, consistência de participação, performance em competições e evolução ao longo do tempo — tudo em um único lugar com dados estatísticos atualizados.

**Stakeholders-Chave:**
- **Alunos (12-18):** Veem evolução técnica e performance → Motivação visual aumenta retenção
- **Professores:** Histórico organizado de todos os alunos → Menos papel, melhor qualidade de treino
- **Responsáveis:** Dados confiáveis sobre progresso → Confiança no investimento
- **Academia (Admin):** Conformidade LGPD garantida + dados para decisões → Diferencial competitivo

**Impacto Esperado:** Aumentar retenção de alunos e melhorar qualidade de treino.

### O Que Torna Isto Especial

SCAcademia é o **primeiro sistema feito especificamente para judo** — não genérico. Capture o contexto específico: faixas, técnicas, competições, ética do esporte.

**Core Insight:** Judocas precisam ver padrões de progresso multidimensional, não apenas resultados isolados. Quando aluno visualiza evolução técnica + participação + performance em 1-3 meses, a decisão de continuar muda.

### Project Classification

- **Tipo:** Web App (desktop/mobile-responsive via browser)
- **Domínio:** EdTech + Healthcare (treino esportivo + conformidade saúde)
- **Complexidade:** MÉDIA-ALTA (LGPD compliance crítico + RBAC complexo)
- **Contexto:** Greenfield (novo produto do zero)
- **Modelo:** Single-Tenant (MVP), arquitetura multi-tenant ready para Phase 2

---

## Success Criteria

### User Success Metrics

**Professor** (Principal User - Proof Point):
- Registra treino completo (presença + desempenho) em < 5 minutos
- Acessa histórico de aluno específico em < 30 segundos
- Taxa de adoção: 70%+ usando regularmente

**Aluno** (Engagement Point):
- Visualiza progresso (gráfico + anotações) na primeira semana
- Acessa app 2x+ por semana
- Percebe evolução clara em 1-3 meses

**Responsável** (Retention Point):
- Recebe relatório de progresso com clareza
- Acessa app quando quer verificar performance

**Admin** (Compliance Point):
- 100% de presenças registradas digitalmente
- Conformidade LGPD documentada e verificável
- Dados de saúde organizados

### Business Success

- **Taxa de Retenção:** +5-10% em 6 meses
- **Novas Inscrições:** 20% via recomendação de pais
- **% Treinos com Histórico:** 100% em Mês 2
- **% Responsáveis Acessando Relatórios:** 70%+ em Mês 3
- **Sistema Operacional:** MVP lançável em 3-4 meses

---

## User Journeys

[Consolidação das 4 journeys narrativas: Pedro (Aluno), Carla (Professor), Fernanda (Responsável), Ricardo (Admin)]

[Cada journey descreve: Situação Inicial → Journey com passos → Momento Aha → Retenção]

---

## Domain-Specific Requirements

### Conformidade Legal & LGPD

[Requerimentos consolidados: Consentimento, Direito ao Esquecimento, Auditoria, RBAC por menor, Encriptação]

### Conformidade Saúde & Segurança

[Anamnese, Consentimento Médico, Código de Ética]

### Requisitos Técnicos de Segurança

[Encriptação em trânsito/repouso, Autenticação, 2FA, Backup & Disaster Recovery]

---

## Project Scoping & Phased Development

### MVP Strategy: Problem-Solving MVP
**Goal:** Professores conseguem registrar treino em < 5 min, sem papel

**Personas Priorizadas:** Professor (PRIMARY), Aluno (SECONDARY), Admin (TERTIARY)  
**Responsável:** Adicionado em Phase 2 com relatórios

### Phase 1 (Meses 1-4): Professor Love Launch
- Registro rápido de treinos
- Anamnese + Consentimentos (LGPD MVP)
- Visualização básica de progresso
- RBAC funcional

### Phase 2 (Meses 5-7): Adoption + Responsável
- Dashboard de responsáveis
- Score subjetivo 1-10
- Relatórios automáticos
- 2FA opcional

### Phase 3 (Meses 8-12): Advanced Features
- Gestão de competições
- IA/Insights básicos
- Export avançado
- Multi-tenant prep

---

## Web App Technical Requirements

**Stack:** Angular SPA + Node.js + PostgreSQL

### Architecture & Performance
- SPA com módulos lazy-loaded
- Performance: Initial < 3s, Treino registration < 500ms
- Gráficos < 1s mesmo com 100+ dados
- Real-time NOT necessário (eventual consistency OK, ~10s delay)

### Browser & Device Support
- Chrome, Firefox, Safari, Edge (2 últimas versões)
- iOS Safari, Android Chrome, Mobile Firefox
- Tablet-responsive em landscape
- Offline + auto-sync com localStorage/IndexedDB

### Accessibility (WCAG AA)
- Contraste 4.5:1 (texto), keyboard navegável
- Screen reader support com aria-labels
- Gráficos com alternativa em tabela
- Touch targets 48x48px mínimo

---

## Functional Requirements

### User Management & Authentication (FR1-FR7)
- FR1: Admin cria academia
- FR2: Admin adiciona professor/aluno
- FR3: Qualquer usuário faz login com email+senha
- [... 54 FRs totais organizados por capability area ...]

### Access Control (FR8-FR14)
- FR8: 4 roles com permissões distintas (Admin, Professor, Aluno, Responsável)
- [...]

### Health Data & LGPD (FR15-FR24)
- FR15: Anamnese obrigatória
- FR16: Consentimento do responsável para menores
- [...]

### Training Registration (FR25-FR32)
- FR25: Professor cria treino
- FR26: Auto-preenchimento de alunos
- FR27: Marca presença com 2 cliques
- [...]

### Performance Tracking (FR33-FR39)
- Dashboard de aluno, professor, admin
- Gráficos de frequência e evolução
- [...]

### Auditoria & Monitoring (FR45-FR50)
- Logs estruturados com WHO/WHAT/WHEN/WHY
- Backup automático diário
- [...]

---

## Non-Functional Requirements

### Performance (FR-NFR-1 to FR-NFR-3)
- Registro de treino: < 2s para salvar
- Dashboard load: < 1s
- Gráficos render: < 1s com 100+ dados
- Concurrent users: 50+ sem degradação

### Security (FR-NFR-4 to FR-NFR-10)
- HTTPS 1.2+ obrigatório
- Dados sensíveis encriptados AES-256
- JWT tokens: access 15-60 min, refresh 7 dias
- Rate limiting: 100 req/min por usuário

### Scalability (FR-NFR-11 to FR-NFR-13)
- DB suporta 50k+ treinos
- Stateless (horizontal scaling ready)
- Arquitetura multi-tenant-ready

### Accessibility (FR-NFR-14 to FR-NFR-17)
- WCAG AA compliance
- Keyboard navigation completa
- Screen reader support
- Touch-friendly (48x48px mínimo)

### Reliability (FR-NFR-18 to FR-NFR-23)
- Backup diário, RTO < 2h, RPO < 1h
- Uptime 99% (MVP)
- Offline sync com conflict resolution
---

## Out of Scope (Deliberately Excluded MVP)

- Responsável reportes (Phase 2)
- Score subjetivo 1-10 (Phase 2)
- Relatórios automáticos (Phase 2)
- Integração federação (Phase 3)
- IA/Insights (Phase 3)
- App mobile (Phase 3+)
- Chat/Messaging
- Planejamento automático de treinos

---

## Referências & Decisões

| Decisão | Rationale |
|---------|-----------|
| MVP sem app mobile | Reduz complexidade, web é acessível |
| Registro DEPOIS do treino | Menos fricção, mais preciso |
| Gráfico de evolução multidimensional | Judo é qualitativo + quantitativo |
| LGPD-first | Compliance desde início, não retrofit |
| Eventual consistency OK | Real-time não é crítico para judo |
| 2 fullstack + 1 ano | Tempo suficiente, equipe enxuta |