Story 2.2: Consentimento LGPD — Formulário para Menores
Como um Responsável de aluno menor,
Quero aprovar consentimento LGPD (saúde, ética, privacidade),
Para que meu filho possa usar a plataforma de forma legal e segura.

**Critérios de Aceitação:**

**Dado** que um aluno < 18 anos é criado no sistema
**Quando** a academia tenta usar dados do aluno
**Então** o sistema detecta: "necessita_consentimento_responsavel = true"
**E** bloqueia acesso do aluno até consentimento

**Dado** que o sistema precisa do consentimento
**Quando** gera o link de consentimento
**Então** cria JWT anônimo (válido por 7 dias)
**E** envia email ao responsável: "Autorizar uso de dados do seu filho - [Nome Aluno]"
**E** email contém link com token: /consent/approve/[JWT_token]

**Dado** que o responsável clica no link
**Quando** acessa página de consentimento
**Então** o sistema valida o JWT token (não expirou, assinatura válida)
**E** exibe formulário em 3 passos:
  - Passo 1: "Dados de Saúde" - "Autorizo compartilhamento de alergias, medicamentos e restrições"
  - Passo 2: "Código de Ética" - "Concordo com código de ética do judô"
  - Passo 3: "Privacidade" - "Autorizo fotos/vídeos para: [ ] Relatórios [ ] Redes Sociais [ ] Nenhum"

**Dado** que o responsável preenche cada passo
**Quando** marca os checkboxes
**Então** cada passo exibe explicação clara do que significa aquela permissão
**E** sem jargão técnico (linguagem simples)

**Dado** que todos os passos são preenchidos
**Quando** clica "Concordar e Assinar"
**Então** o sistema exige:
  - Aceitar termos (checkbox obrigatório)
  - Digitação do nome completo (validação)
  - Clique em "Assinar Digitalmente" (timestamp + IP capturados)

**Dado** que o consentimento é assinado
**Quando** o sistema registra
**Então** cria registro na tabela: consents
  - student_id
  - responsible_id
  - consent_type (health, ethics, privacy)
  - accepted = true
  - accepted_at = agora
  - signed_by_name = nome responsável
  - ip_address = IP de origem
  - user_agent = navegador
  - version = 1.0

**Dado** que o consentimento foi registrado
**Quando** a página recarrega
**Então** exibe: "✓ Consentimento registrado com sucesso"
**E** envia email de confirmação ao responsável
**E** copia de consentimento assinada é gerada (PDF)
**E** o aluno consegue fazer login e acessar a plataforma

**Dado** que o responsável diferencia os consentimentos
**Quando** preenche: Saúde=SIM, Fotos=NÃO
**Então** o sistema respeita cada permissão separadamente
**E** professor consegue ver alergias (saúde)
**E** mas não consegue usar fotos do aluno (privacidade negada)

**Dado** que um responsável nega todas as permissões
**Quando** submete o formulário
**Então** o sistema exibe: "Nenhuma permissão foi autorizada"
**E** oferece opção: "Entrar em contato com academia" ou "Preencher novamente"

**Dado** que 30 dias passam sem responsável confirmar
**Quando** academia tenta usar dados do aluno
**Então** o sistema bloqueia: "Consentimento pendente há mais de 30 dias"
**E** envia notificação ao Admin: "Aluno [Nome] sem consentimento"