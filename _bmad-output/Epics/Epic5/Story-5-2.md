Story 5.2: Auditoria LGPD — Timeline de Acessos & Logs
Como um Admin,
Quero ver timeline de TODOS os acessos a dados pessoais,
Para que eu demonstre conformidade LGPD para reguladores.

**Critérios de Aceitação:**

**Dado** que Admin acessa "Admin > Auditoria LGPD"
**Quando** clica
**Então** exibe página: "Timeline de Acessos a Dados Sensíveis"
**E** mostra lista de logs ordenada: mais recente first

**Dado** que timeline carrega
**Quando** renderiza
**Então** cada log exibe:
  - Timestamp: "19 Mar 2026 - 15:47:32"
  - Usuário: Avatar + Nome + Role
  - Ação: "VIEW" | "EDIT" | "DELETE" | "EXPORT"
  - Recurso: "student_health" | "training_attendance" | "performance_notes"
  - Resultado: "✓ Success" | "✗ Denied"
  - IP/Navegador: "192.168.1.1 | Chrome/90"

**Dado** que há muitos logs (1000+)
**Quando** página renderiza
**Então** usa paginação (50 por página) ou infinite scroll (lazy load)
**E** busca/filtro fica no topo para performance

**Dado** que Admin quer filtrar logs
**Quando** clica "[Filtros Avançados]"
**Então** exibe painelexpandível:
  - Período: Data início | Data fim
  - Usuário: Dropdown com autocomplete
  - Ação: Checkboxes [VIEW] [EDIT] [DELETE] [EXPORT]
  - Recurso: [health] [attendance] [notes] [all]
  - Resultado: [Success] [Denied] [All]

**Dado** que Admin aplica filtro "Ação = DELETE, Última semana"
**Quando** aplica
**Então** lista é filtrada em < 200ms
**E** resultado: "3 logs encontrados"

**Dado** que Admin clica em um log específico
**Quando** clica
**Então** expande para detalhes completos:
  - Timestamp preciso
  - Usuário completo (ID + nome + role)
  - Ação detalhada (ex: "Editou health_history do aluno [ID]")
  - Campo alterado (ex: "allergies: [antes] → [depois]")
  - IP de origem + User-Agent
  - Resultado (Success/Denied) + motivo se denied

**Dado** que Admin quer exportar auditoria
**Quando** clica "[Exportar]"
**Então** gera arquivo:
  - Formato: CSV ou PDF (opção dropdown)
  - Nome: "Auditoria_LGPD_2026-03-19.csv"
  - Conteúdo: todos os logs do filtro aplicado
  - Assinado digitalmente (RSA-2048)

**Dado** que Admin exporta para PDF
**Quando** arquivo é gerado
**Então** inclui:
  - Cabeçalho: Academia, período, assinante
  - Tabela completa de logs
  - Rodapé: Data de geração, versão

**Dado** que Admin tenta modificar um log
**Quando** tenta editar ou deletar
**Então** operação é bloqueada (tabela append-only)
**E** mensagem: "Logs de auditoria são imutáveis por lei"

**Dado** que Admin quer monitorar acesso de usuário específico
**Quando** filtra "Usuário = João Silva"
**Então** vê TODOS os acessos daquele usuário:
  - O que acessou (dados de qual aluno?)
  - Quando acessou
  - Se conseguiu (Success/Denied)
  - De que IP/localização

**Dado** que há anomalia detectada (ex: 10 tentativas DELETE em 1 min)
**Quando** Admin visualiza timeline
**Então** logs anômalos são destacados em vermelho
**E** ícone ⚠️ ao lado
**E** sugestão: "[Bloquear Usuário?]" ou "[Investigar]"