Epic 2: Saúde & Conformidade LGPD
Overview do Epic 2
Objetivo: Academias capturam dados de saúde de alunos com consentimento legal explícito e podem demonstrar conformidade LGPD.

FRs Cobertos: FR15-FR24 (10 requisitos)

FR15-FR18: Anamnese (histórico saúde, alergias, restrições, medicamentos)
FR19-FR22: Consentimento LGPD (menores precisam consentimento responsável, versioning, assinatura digital)
FR23-FR24: Direito ao Esquecimento (soft delete, 30 dias graça, anonimizar dados)
NFRs Relevantes:

Segurança: Dados sensíveis encriptados AES-256
Compliance: Auditoria imutável de todos os acessos
Acessibilidade: Formulários WCAG AA

📊 Epic 2 Summary
Story	Título	Funcionalidade	Tamanho
2.1	Anamnese Inicial	Captura de dados de saúde	Médio
2.2	Consentimento LGPD	Formulário consentimento para menores	Grande
2.3	Versionamento Termos	Atualizar termos e re-consentimento	Médio
2.4	Auditoria de Acesso	Timeline de acessos a dados	Médio
2.5	Direito Esquecimento	Deletar dados do aluno	Grande
2.6	Relatório LGPD	Exportar conformidade para auditores	Médio
Total de FRs Cobertos: 10/10 ✅
Total de Stories: 6
Dependências: Story 2.2 depende de 2.1 (anamnese antes consentir)