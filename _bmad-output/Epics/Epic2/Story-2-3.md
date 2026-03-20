Story 2.3: Versionamento de Consentimento — Atualizar Termos
Como um Admin da academia,
Quero atualizar termos de consentimento (ex: nova política de privacidade),
Para que responsáveis reenconsentem com novos termos quando necessário.

**Critérios de Aceitação:**

**Dado** que um novo termo de consentimento precisa ser implementado
**Quando** o Admin acessa "Configurações > Termos de Consentimento"
**Então** exibe formulário para editar:
  - Texto de Saúde (wysiwyg editor)
  - Texto de Ética (wysiwyg editor)
  - Texto de Privacidade (wysiwyg editor)
  - Versão (auto-increment: 1.0 → 1.1 → 2.0)

**Dado** que novos textos são salvos
**Quando** o Admin clica "Publicar Nova Versão"
**Então** o sistema cria novo record em: consent_templates com version = 1.1
**E** marca anterior como "deprecated"
**E** exibe: "✓ Nova versão publicada. Responsáveis com versão anterior precisam reconsentir"

**Dado** que nova versão é publicada
**Quando** sistema processa
**Então** responsáveis com versão antiga (< 1.1) recebem notificação:
  - Email: "Termos de privacidade atualizados. Precisamos de sua confirmação"
  - Link direcionando para re-consentimento

**Dado** que responsável clica no link de re-consentimento
**Quando** acessa página
**Então** exibe: "Mudanças em relação à versão anterior:" (destaque em amarelo das alterações)
**E** exibe novo formulário de consentimento (passos 1-3)
**E** botão "Estou Ciente" (re-consentimento rápido se confiança)

**Dado** que responsável quer revisar texto antigo
**Quando** clica "Comparar com versão anterior"
**Então** exibe lado-a-lado: versão antiga | nova versão
**E** diferenças são destacadas (insert/delete em cores)

**Dado** que responsável não reconsentir em 60 dias
**Quando** sistema processa
**Então** aluno é marcado: "consentimento_expirado"
**E** Academia não consegue registrar novos treinos para aluno
**E** notificação é enviada: "Consentimento expirado. Contate responsável"