Análise do Contexto Carregado
Visão do Projeto
SCAcademia é um sistema web especializado para academias de judo que centraliza:

Gestão de alunos e controle de presenças
Rastreamento multidimensional de progresso (técnica + participação + performance + evolução)
Conformidade LGPD e dados de saúde
4 perfis de usuários com permissões distintas
Diferencial: Primeiro sistema feito especificamente para judo — não é genérico.

Usuários-Alvo (Conforme Journeys)
Professor (PRIMARY - MVP Phase 1)

Registra treino em < 5 minutos (presença + desempenho)
Acessa histórico de alunos em < 30 segundos
Usa tablet durante/após aula
Aluno (SECONDARY - MVP Phase 1)

Visualiza progresso (gráficos + anotações) na primeira semana
Acessa app 2x+ por semana
Vê evolução técnica clara em 1-3 meses
Admin (TERTIARY - MVP Phase 1)

Dashboard de compliance LGPD (100% dos dados protegidos)
Métricas operacionais (presenças, evasão risk, conformidade)
Auditoria de acesso
Responsável (DEFERRED Phase 2)

Relatório automático de progresso do filho
Confiança no investimento mensal
Desafios UX Identificados
Offline-First + Sync: Professor regista treino sem internet → sincroniza depois
Multidimensional Data Visualization: Como mostrar progresso técnico + participação + performance de forma clara?
LGPD sem Friction: Termos, consentimentos, direito ao esquecimento — sem prejudicar UX
Tablet Responsiveness: Landscape (professor anotando) + portrait (navegação)
Performance: Gráficos devem renderizar em < 1s mesmo com 100+ dados
RBAC Subtle: Professor vê apenas seus alunos; aluno vê apenas seu progresso; admin vê tudo (sem violar privacidade)
Oportunidades UX
Visualização de Evolução Multidimensional: Gráficos que mostram padrões (não só números)
Onboarding Rápido: Professor consegue registrar treino no 1º dia sem tutorial
Confiança via Transparência: Responsável enxerga dados organizados = confiança no investimento (retenção)
Smart Defaults: Sistema auto-preenche lista de alunos, mark presentes = 2 cliques
Mobile-First Mental Model: Mesmo em desktop, interface é tocável (móvel first)
