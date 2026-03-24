Epic 9: Cadastros Completos — Perfis de Academia, Admin, Professor, Aluno e Saúde
Overview do Epic 9
Objetivo: Todas as entidades da plataforma possuem cadastros completos e editáveis, garantindo que a academia opere com dados de qualidade para LGPD, gestão operacional e segurança.

**Contexto:** O Epic 1 (Fundação) implementou apenas os dados mínimos de autenticação para cada entidade (email + senha + nome). Este Epic expande todos os perfis para seus formulários completos, alinhados ao schema do banco de dados existente e aos requisitos da LGPD.

FRs Cobertos: FR1-FR4 (expandidos), FR15-FR20 (Gestão de Perfis)

- FR1-FR7 (parcial): Dados completos de usuários e academia no cadastro/edição
- FR15: Administrador consegue visualizar e editar dados completos da academia
- FR16: Admin consegue cadastrar professor com todos os campos obrigatórios
- FR17: Admin/Professor consegue cadastrar aluno com dados pessoais completos
- FR18: Responsável é vinculado ao aluno menor de idade durante o cadastro
- FR19: Cadastro de saúde do aluno integrado ao fluxo de onboarding
- FR20: Todos os perfis são editáveis por quem tem permissão

NFRs Relevantes:
- Segurança: Dados sensíveis (CPF, telefone menor, saúde) com controle de acesso RBAC
- LGPD: Campos de saúde seguem criptografia AES-256 já implementada
- Usabilidade: Formulários com validação em tempo real, campos obrigatórios sinalizados
- Performance: Carregamento de perfil existente < 1s

📊 Epic 9 Summary

| Story | Título | Funcionalidade | Tamanho |
|-------|--------|----------------|---------|
| 9.1 | Perfil Completo da Academia | Editar CNPJ, endereço, horários, contato | Médio |
| 9.2 | Perfil Completo do Administrador | Editar dados pessoais do Admin logado | Pequeno |
| 9.3 | Cadastro e Edição do Professor | CRUD completo do professor | Médio |
| 9.4 | Cadastro e Edição do Aluno | CRUD completo do aluno + validação menor | Grande |
| 9.5 | Vinculação de Responsável ao Aluno | Linkage responsável ↔ aluno menor | Médio |
| 9.6 | Saúde do Aluno no Onboarding | Integrar anamnese ao fluxo de cadastro | Médio |

Total de Stories: 6
Total estimado: ~3 sprints de desenvolvimento
Status inicial: backlog
