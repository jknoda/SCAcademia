## Non-Functional Requirements

### Performance

**FR-NFR-1: Response Time for Critical Actions**
- Professor registra treino (presença + anotações): < 2 segundos para salvar
- Aluno visualiza dashboard pessoal: < 1 segundo (initial load da página)
- Gráfico de frequência renderiza: < 1 segundo mesmo com 100+ treinos
- Navegação entre abas/telas: < 500ms (SPA smooth transition)

**FR-NFR-2: Initial Page Load Performance**
- Primeira carga da aplicação (bundle + inicialização): < 3 segundos em conexão 4G
- Métrica: Largestful Contentful Paint (LCP) < 2.5s
- Métrica: Cumulative Layout Shift (CLS) < 0.1

**FR-NFR-3: Concurrent User Performance**
- O sistema mantém performance mesmo com 50+ usuários simultâneos (uma academia)
- Sem degradação significativa (max 10% aumento em response time)

### Security

**FR-NFR-4: Data Encryption**
- Dados em trânsito: HTTPS 1.2+ obrigatório (TLS encryption)
- Dados em repouso (sensíveis): Encriptados no banco (AES-256 ou similar)
- Dados sensíveis = saúde, alergias, consentimentos, dados de menores

**FR-NFR-5: Authentication & Session Management**
- JWT tokens com expiry: access token 15-60 minutos, refresh token 7 dias
- Logout invalida tokens no servidor
- Login falho após 5 tentativas = bloqueia por 15 minutos (brute force protection)
- Session timeout: 30 minutos de inatividade = logout automático

**FR-NFR-6: Access Control Enforcement**
- RBAC é testado rigorosamente: professor NÃO consegue acessar alunos de outra turma
- Aluno NÃO consegue acessar dados de outro aluno
- Responsável NÃO consegue editar dados de saúde
- Sistema rejeita requisições unauthorized com erro 403

**FR-NFR-7: Audit Log Security**
- Logs não podem ser alterados após criação (append-only)
- Logs incluem: usuário, ação, resource, timestamp, IP, resultado
- Logs são encriptados em repouso
- Apenas admin pode acessar logs (com auditoria de quem acessou)

**FR-NFR-8: LGPD Compliance - Data Minimization**
- Sistema coleta APENAS dados necessários (não mais)
- Exemplo: não coleta média móvel mensal de treinos (pode recomputar)
- Justificativa documentada para cada tipo de dado coletado

**FR-NFR-9: Password Security**
- Mínimo 8 caracteres, incluir maiúscula + número
- Sem dicionário comum (não aceita "123456", "password", etc.)
- Hash seguro: bcrypt ou scrypt (não MD5, SHA1)

**FR-NFR-10: External API Protection**
- Rate limiting: Max 100 requests/minuto por usuário, 1000/minuto por IP
- CSRF tokens em todos POST/PUT/DELETE requests
- Validação rigorosa de input (SQL injection, XSS protection)

### Scalability

**FR-NFR-11: Database Scalability**
- PostgreSQL deve suportar 50k+ treinos sem degradação significativa (<10%)
- Índices otimizados em queries frequentes (presença, aluno, data)
- Prepared statements para prevenir SQL injection + melhor performance

**FR-NFR-12: Horizontal Scaling Readiness**
- Aplicação é stateless (sem session local, tudo em JWT/redis)
- Backend pode escalar via múltiplas instâncias atrás de load balancer
- No MVP é 1 instância, mas arquitetura permite multi-instance

**FR-NFR-13: Growth Scenario Support**
- Suporta crescimento de 1 academia → 10 academias (Phase 2) sem refactor
- Suporta crescimento de 100 alunos/academia → 1000 alunos (Phase 3)
- Suporta crescimento de 20 turmas → 200 turmas

### Accessibility (WCAG AA)

**FR-NFR-14: Color Contrast & Visual Design**
- Texto normal: 4.5:1 contrast ratio (WCAG AA)
- Grandes tex (18pt+): 3:1 contrast ratio
- Não usa cor COMO ÚNICA forma de comunicar (sempre + ícone ou texto)

**FR-NFR-15: Keyboard Navigation**
- Todas funcionalidades acessíveis via teclado (Tab, Shift+Tab, Enter, Space, Arrow keys)
- Tab order é lógico (segue fluxo visual natural)
- Focus é sempre VISÍVEL (outline/border claro)
- Não há "keyboard traps" (usuário ficando preso em elemento)

**FR-NFR-16: Screen Reader Support**
- Uso correto de HTML semântico (buttons, labels, headings)
- Aria-labels para ícones e elementos sem texto visível
- Aria-live para notificações que aparecem dinamicamente
- Gráficos incluem tabela alternativa (legível por screen reader)

**FR-NFR-17: Mobile Responsiveness & Touch**
- Botões/elementos interativos: mínimo 48x48px (ADA guideline)
- Sem dependência de hover (tablet não tem hover)
- Zoom deve funcionar até 200% sem quebra de layout
- Touch targets não sobrepõem (mínimo 8px de espaço)

### Reliability & Data Integrity

**FR-NFR-18: Backup & Data Recovery**
- Backup automático: diário, retenção 30 dias
- Recovery Time Objective (RTO): < 2 horas (conseguir voltar ao ar)
- Recovery Point Objective (RPO): < 1 hora (perder no máximo 1 hora de dados)
- Teste de restore: mensal (verificar que backup realmente funciona)

**FR-NFR-19: Data Integrity**
- Transações ACID garantidas (não meio-treino no banco)
- Conflict resolution para offline sync (último write vence)
- Validação rigorosa de entrada (não salvar treino sem presença)

**FR-NFR-20: System Availability (MVP)**
- Uptime target: 99% (máx 3.6 horas de downtime/mês) no MVP
- Monitored 24/7 com alertas se down
- Graceful degradation: se gráfico falha, mais sistema funciona

**FR-NFR-21: Error Handling**
- Erros apresentados claramente ao usuário (não "500 error")
- Exemplo: "Falha ao salvar treino. Verificar conexão e tentar novamente."
- Erros técnicos logados para debug, sem expor detalhes ao usuário

### Offline & Sync Reliability

**FR-NFR-22: Offline Functionality**
- Professor consegue continuar registrando treino se perder conexão
- Dados persistem em localStorage/IndexedDB
- Sincroniza automaticamente quando reconecta

**FR-NFR-23: Conflict Resolution**
- Sistema detecta conflitos (treino modificado em 2 lugares)
- Usa timestamp: última escrita vence (Last-Write-Wins)
- Usuário recebe notificação de conflito resolvido