Story 6.5: Indicadores Offline & UX Discreto
Como Professor,
Quero saber de forma clara mas discretá se estou offline e qual é status de sincronização,
Para que ter controle sobre meus dados e saber quando é seguro fechar o aplicativo.

Acceptance Criteria:

Given que perdi conexão com internet
When indicador offline aparece
Then deve aparecer no canto superior-direito: badge azul #0052CC com ícone 📡 + texto "Offline"
And o indicador deve ser discreto (não chamar atenção desnecessária)
And não bloquear nenhuma ação já implementada (edit, save, navigate)

Given que estou offline e realizando ações (frequência, notas)
When completo cada ação
Then cada item salvo deve exibir ícone ⏳ (hourglass) próximo ao item
And ao passar mouse/tap no ícone, exibir tooltip: "Pendente sincronização quando online"

Given que estou sincronizando fila após reconectar
When sincronização está em progresso
Then indicador deve atualizar para: spinner Azul + "Sincronizando (5 de 12)"
And barra de progresso deve aparecer sutilmente abaixo do indicador

Given que sincronização completa com sucesso
When todas ações sincronizadas
Then todos ícones ⏳ devem desaparecer
And indicador Offline deve desaparecer
And exibir toast verde: "✓ Dados sincronizados com sucesso"
And toast deve desaparecer após 3 segundos

Given que sincronização falha em algumas ações
When erro permanente ocorre
Then indicador deve mudar para: ⚠ Laranja + "Sync com Problemas"
And ações com erro devem ficar com ícone ❌ (não apenas ⏳)
And modal deve aparecer: "3 ações falharam na sincronização. [Revisar]"

Given que User está em sessão longa (> 30 min) offline
When nenhuma reconexão ocorreu
Then página deve exibir aviso sutil: "Você está offline por 30+ minutos - Dados não sincronizados"
And botão para "Tentar Conectar Agora" (força reconexão check)

Technical Notes:

Use CSS animations para indicadores (spin para sincronizando, pulse para erro)
Indicador deve estar em posição fixa, visível em scroll
Aria-labels para acessibilidade: "Estado offline" etc
Suportar 48x48px touch target para mobile users
Referência FR: FR54 (Offline UX indicators), FR51 (Offline visibility)