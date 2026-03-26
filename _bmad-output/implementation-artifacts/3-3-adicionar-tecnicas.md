# Story 3.3: Adicionar Técnicas — Conversational Dropdown

Status: done

## Story

Como Professor,
Quero selecionar técnicas que foram praticadas na aula,
Para que o aluno saiba exatamente o que foi trabalhado.

## Contexto de Negócio

- Esta story é a etapa 3 do wizard iniciado em 3.1 e continuado em 3.2.
- Objetivo: Professor documenta técnicas de judô praticadas com baixa fricção e opções para técnicas customizadas.
- O escopo desta story é apenas a seleção e listagem de técnicas, **não inclui revisão final (Story 3.5) ou sincronização offline (Story 3.8)**.
- Schema de técnicas já existe em `V3_0__Training.sql` com tabelas `techniques` e `session_techniques`.
- Não criar novas tabelas nesta story.
- O professor deve poder reutilizar conjuntos de técnicas anteriores como "favoritos" para aulas futuras (salvar como template, não implementação completa de favorite, apenas dados).

## Acceptance Criteria

### AC1 - Renderização Inicial da Tela de Técnicas
- DADO que o Professor avançou da etapa de frequência (Story 3.2)
- QUANDO a tela de técnicas carrega
- ENTÃO exibe:
  - Pergunta principal conversacional: "Que técnicas foram praticadas?"
  - Nota orientadora: "(Selecione uma ou mais)"
  - Lista de checkboxes com as técnicas mais comuns (primeiras 4 técnicas básicas expandidas por padrão)
  - Agrupamento visual: "Técnicas Básicas" (expandido por padrão) e "Técnicas Avançadas" (colapsado)
  - Link acessível: "[+Mostrar todas as técnicas]" quando há técnicas ocultas
  - E nenhuma técnica está pré-selecionada

### AC2 - Catálogo de Técnicas com Agrupamento
- DADO que o sistema possui 30+ técnicas de judô cadastradas
- QUANDO carrega a tela
- ENTÃO agrupa automaticamente as técnicas em pelo menos 2 categorias:
  - "Técnicas Básicas" (4-6 técnicas comuns: Osoto Gari, Ouchi Gari, Seoi Nage, Armlock, etc.)
  - "Técnicas Avançadas" (restante das técnicas)
- E as Básicas iniciam expandidas, Avançadas colapsadas
- E cada técnica é exibida com:
  - Checkbox (☐ / ✓ formato visual)
  - Nome da técnica em português
  - Ícone visual pequeno (opcional, mas recomendado P/ ajudar memorização)

### AC3 - Toggle Simples de Seleção de Técnica
- DADO que o Professor vê uma técnica na lista
- QUANDO clica no checkbox ou na linha da técnica
- ENTÃO a técnica é selecionada (checkbox muda: ☐ → ✓) e destacada visualmente (ex.: cor azul ou fundo sutil)
- E nenhuma auto-submissão ou auto-advance ocorre (usuário seleciona múltiplas sem interrupção)
- E o Professor pode desselecionar clicando novamente (toggle simples, sem modal de confirmação)

### AC4 - Resumo Atualizado de Técnicas Selecionadas
- DADO que o Professor selecionou 1+ técnicas
- QUANDO a tela renderiza
- ENTÃO exibe resumo atualizado em tempo real:
  - Contador: "✓ X técnicas selecionadas"
  - Lista compacta: "✓ Osoto Gari, ✓ Seoi Nage"
  - Posicionado abaixo do checkout ou em local de destaque (não oculto)
- E o resumo atualiza a cada toggle sem delay perceptível

### AC5 - Validação de Seleção ao Avançar
- DADO que o Professor clica "Próximo: Notas" ou equivalente
- QUANDO nenhuma técnica está selecionada
- ENTÃO exibe validação suave: "Selecione pelo menos 1 técnica para continuar"
- E nenhuma navegação ocorre até que ≥1 técnica seja selecionada
- E a mensagem desaparece quando o Professor seleciona uma técnica

### AC6 - Opção de Técnica Customizada (Ad-Hoc)
- DADO que a lista de técnicas não contém exatamente o que o Professor praticou
- QUANDO scroll até fim e vê campo "[+Adicionar outra técnica]"
- ENTÃO campo de texto expande com placeholder: "Digite a técnica"
- E conforme digita, o sistema oferece autocomplete com sugestões da base existente
- E se nenhuma sugestão bater, o Professor pode confirmar (Enter ou botão + com ícone) para criar _candidato_ de técnica customizada
- E o sistema armazena esta entrada como `status: 'pending_review'` (admin revisa depois em relatório, Story 5.x)
- E a técnica customizada é imediatamente adicionada à listagem da aula (mesmo que pendente)
- E ao avançar, técnicas customizadas são incluídas no resumo

### AC7 - Favoritos de Técnicas (Salvar Preset)
- DADO que o Professor selecionou técnicas e está satisfeito
- QUANDO clica em "💾 Salvar como favorito" ou "Guardar este conjunto"
- ENTÃO um modal/drawer surge:
  - Campo de texto: "Nomeie este conjunto (ex: 'Treino Básico Segunda')"
  - Botão "Salvar" e "Cancelar"
- Se confirma:
  - Sistema cria registro: `technique_presets (preset_id, professor_id, academy_id, name, technique_ids, created_at)`
  - Exibe confirmação suave: "✓ Favorito 'Treino Básico Segunda' salvo"
  - Fecha modal e retorna à tela de técnicas

### AC8 - Sugestão de Favoritos em Aulas Futuras
- DADO que o Professor teve favoritos salvos e está em uma nova aula (nova sessão)
- QUANDO a tela de técnicas carrega
- ENTÃO exibe sugestão no topo, acima da lista: "Usar favorito: 'Treino Básico Segunda'?  [Sim] [Não]"
- E se clica "Sim":
  - Todas as técnicas do favorito são pré-selecionadas
  - Resumo atualiza: "✓ 5 técnicas carregadas desde favorito"
  - Professor ainda pode adicionar/remover técnicas normalmente
- E se clica "Não":
  - Sugestão desaparece, lista limpa retorna

### AC9 - Navegação do Wizard
- DADO que o Professor está na etapa de técnicas
- QUANDO clica "Anterior: Frequência"
- ENTÃO retorna para a etapa anterior (Story 3.2) sem perder o estado já salvo
- QUANDO clica "Próximo: Notas" (ou equivalente da Story 3.4)
- ENTÃO persiste técnicas selecionadas e avança (desde que ≥1 técnica selecionada)
- E nenhuma navegação "penaliza" o Professor (sempre pode voltar)

### AC10 - Compatibilidade Offline
- DADO que o dispositivo está sem conexão durante seleção de técnicas
- QUANDO o Professor interage (checkboxes, favoritos)
- ENTÃO as ações são enfileiradas localmente (IndexedDB)
- E a UI não exibe erro de conexão nem comportamento bloqueante
- E quando reconecta, a fila sincroniza automaticamente (Story 3.8 completa implementação)
- MAS esta story prepara apenas o solo local sem UI de sync completa

### AC11 - Segurança, RBAC e Isolamento
- DADO que a API de técnicas é acessada
- QUANDO a requisição não possui token ou papel não é `Professor`
- ENTÃO o sistema bloqueia com resposta apropriada (401 ou 403)
- E o Professor só pode acessar/modificar técnicas de sua própria academia
- E o Professor não pode editar histórico de técnicas de outras sessões (apenas à atual)
- E técnicas customizadas criadas por um Professor não são visíveis a outros

### AC12 - Posicionamento Visual (UX Converational)
- DADO a tela renderiza
- ENTÃO o layout segue tom conversacional (não burocrático):
  - Pergunta em texto grande e amigável ("Que técnicas foram praticadas?")
  - Checkboxes generosos (48x48px mínimo para toque)
  - Espaçamento confortável entre linhas (32px mínimo)
  - Botões "Anterior" e "Próximo" com contraste claro e labels em português
  - Sem design "apertado" que intimide

## Tasks / Subtasks

> **⚠️ ATENÇÃO:** Os arquivos de backend e frontend **já existem** com implementação substancial.
> As tasks abaixo focam em **revisar, completar e corrigir** o código existente, NÃO criar do zero.
> **Leia o código existente antes de alterar qualquer arquivo.**

- [x] **Task 0 - Migration SQL obrigatória** (BLOQUEANTE — executar primeiro)
  - [x] Criar e aplicar `_bmad-output/V3_1__Training_Techniques_Enhanced.sql` (arquivo já gerado)
  - [x] A migration adiciona colunas faltantes em `techniques` e `session_techniques` e cria `technique_presets`
  - [x] Verificar que o banco local está migrando sem erros antes de qualquer implementação
  - [x] Confirmar que seed de técnicas foi inserido (30+ técnicas na academia de teste)

- [x] **Task 1 - Backend: revisar `lib/trainingTechniques.ts`** (AC1, AC2, AC11)
  - [x] **Arquivo existe:** `backend/src/lib/trainingTechniques.ts` — revisar, não criar
  - [x] Verificar que `getAcademyTechniques` ordena por `display_order ASC, name ASC` ✓
  - [x] Verificar que `getSessionTechniques` faz JOIN em `techniques` com `deleted_at IS NULL` ✓
  - [x] Verificar que `selectSessionTechnique` faz upsert correto omitindo `technique_order` (agora opcional após V3_1)
  - [x] Verificar que `addCustomTechnique` insere com `is_pending=TRUE` e `created_by_professor_id`

- [x] **Task 2 - Backend: revisar `controllers/trainingTechniques.ts`** (AC3, AC4, AC11)
  - [x] **Arquivo existe:** `backend/src/controllers/trainingTechniques.ts` — revisar, não criar
  - [x] Verificar auth/role check em todos os handlers (`requireRole(['Professor'])`)
  - [x] Verificar validação de UUID em todos os params (:sessionId, :techniqueId, :presetId)
  - [x] Verificar isolamento `academyId !== requester.academyId` nas rotas de academia
  - [x] Verificar que `logAudit` é chamado em select/deselect/custom/preset operations

- [x] **Task 3 - Backend: verificar `routes/trainings.ts`** (AC1-AC11)
  - [x] **Arquivo existe:** já contém todas as rotas de técnicas — apenas verificar
  - [x] Confirmar que `GET /api/academies/:academyId/techniques` está registrado em `app.ts` (não em trainings router) para URL correta
  - [x] Se a rota de academia estiver sob `/trainings`, mover para um router de academias ou registrar separadamente em `app.ts`
  - [x] Confirmar rotas de presets: `POST /presets` e `GET /presets` (usam `req.user!.userId` internamente)

- [x] **Task 4 - Backend: criar testes de integração** (AC1-AC11)
  - [x] Criar `backend/src/tests/training-techniques.test.ts`
  - [x] Cobrir: listar técnicas com categorização, select/deselect, técnica customizada, salvar/aplicar preset
  - [x] Cobrir: isolamento por academy/professor (403 para sessão de outro professor)
  - [x] Cobrir: bloqueio para papel não-Professor (401/403)
  - [x] Usar padrão dos testes existentes (`training-attendance.test.ts` como referência)

- [x] **Task 5 - Frontend: revisar `training-techniques.component.ts`** (AC1-AC12)
  - [x] **Arquivo existe:** `frontend/src/components/training-techniques/` — revisar, não criar
  - [x] Verificar que `ngOnInit` carrega técnicas da sessão E presets do professor
  - [x] Verificar typo: `technigueGroups` → deve ser `techniqueGroups` (bug visual identificado no código existente)
  - [x] Verificar que autocomplete de técnica customizada usa lista local (`allTechniques`) sem nova chamada API
  - [x] Verificar que sugestão de preset (`suggestedPreset`) mostra apenas o mais recente/relevante
  - [x] Verificar validação AC5: bloqueia navegação se zero técnicas selecionadas

- [x] **Task 6 - Frontend: revisar template e estilos** (AC12)
  - [x] **Arquivos existem:** `training-techniques.component.html` e `.scss` — revisar, não criar
  - [x] Verificar checkboxes com área mínima 48x48px (Material Design padrão)
  - [x] Verificar espaçamento 32px entre linhas de técnica
  - [x] Verificar que resumo de seleção é sempre visível (não dentro de expansion panel fechado)
  - [x] Verificar responsividade mobile (wizard corre em dispositivo do professor)

- [x] **Task 7 - Frontend: navegação do wizard** (AC9)
  - [x] Verificar rota configurada em `app.routing.module.ts` para `/training/:sessionId/techniques`
  - [x] Verificar que botão "Próximo: Notas" redireciona para `/training/:sessionId/notes` (Story 3.4)
  - [x] Se componente 3.4 não existir, criar placeholder `training-notes-placeholder` (similar ao `training-attendance-placeholder` existente)
  - [x] Verificar que `sessionId` é preservado via rota params entre etapas

- [x] **Task 8 - Frontend: preparação offline** (AC10)
  - [x] Verificar estruturação de dados em IndexedDB para `session_techniques`
  - [x] Implementar fila de operações sem UI bloqueante
  - [x] Garantir que checkboxes funcionam offline (ações enfileiradas)
  - [x] (Sincronização real é Story 3.8)

- [x] **Task 9 - Testes de regressão E2E** (AC1-AC12)
  - [x] Verificar que testes existentes de attendance (3.2) continuam passando
  - [x] Cobrir toggle simples (select/deselect sem modal/confirmação)
  - [x] Cobrir técnica customizada com autocomplete
  - [x] Cobrir salvamento e reaplicação de favorito
  - [x] Cobrir estado offline (fila local, sem erro bloqueante na tela)

## Dev Notes

### Estado do Código Existente (LEIA ANTES DE IMPLEMENTAR)

> **CRÍTICO:** O backend de técnicas já foi parcialmente implementado em contexto anterior.
> Arquivos existentes com código funcional que DEVE ser revisado, não sobrescrito:
> - `backend/src/lib/trainingTechniques.ts` (~380 linhas)
> - `backend/src/controllers/trainingTechniques.ts` (todos handlers)
> - `backend/src/routes/trainings.ts` (rotas registradas)
> - `frontend/src/components/training-techniques/` (componente completo com 3 arquivos)
>
> Story 3.2 (`training-attendance`) é código confiável e em produção — use como referência de padrões.

### Escopo Deliberadamente Limitado

- Esta story **não** implementa revisão final (Story 3.5), notas (Story 3.4 precedente), ou sincronização offline completa (Story 3.8).
- Favoritos são salvos como presets, mas recomendação inteligente (aprender padrões do professor) fica para fase 2+.
- Técnicas customizadas são armazenadas com `is_pending=TRUE`, admin revisa em Story 5.x (admin dashboard).

### UX Obrigatória

- Tom conversacional: "Que técnicas foram praticadas?" em vez de "Selecione técnicas".
- Sem botão "Salvar" explícito (um único "Próximo" avança após validação).
- Checkboxes com 48x48px mínimo para touch sem erros.
- Resumo sempre visível (não oculto em expansion/drill).
- Espaçamento generoso (32px linha a linha).

### Padrões de Implementação (Projeto Atual)

**Backend:**
- Usar funções exportadas, sem classes OO.
- Usar `AuthenticatedRequest`, `req.user!.userId`, `req.user!.academyId`, `req.user!.role`.
- Erros: `res.status(x).json({ error: 'mensagem pt-BR' })`.
- Reutilizar `authMiddleware`, `requireRole(['Professor'])`.
- Auditoria: `logAudit()` de `backend/src/lib/audit.ts`.
- Rate limiting: `limitTrainingOperations` middleware de `backend/src/middleware/rate-limit.ts`.

**Frontend:**
- Angular module-based (`standalone: false`).
- Rotas em `frontend/src/app.routing.module.ts`.
- Componentes declarados em `frontend/src/app.module.ts`.
- HTTP exclusivamente via `ApiService`.
- RxJS + `@ngrx/store` para estado (se aplicável).
- NgMaterial ou Bootstrap para UI (manter consistência).

### Schema Real Confirmado

> **ATENÇÃO:** O schema base está em `V3_0__Training.sql`, mas técnicas precisam de colunas adicionais.
> **Migration obrigatória:** `_bmad-output/V3_1__Training_Techniques_Enhanced.sql` (já gerado).
> Aplicar ANTES de qualquer implementação ou teste.

Esquema após V3_0 + V3_1 aplicados:

```sql
-- Catálogo de técnicas (V3_0 + colunas adicionadas por V3_1)
techniques (
  technique_id UUID PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES academies,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),          -- 'Básica' ou 'Avançada'
  is_favorite BOOLEAN DEFAULT false,  -- V3_0
  icon_url VARCHAR(255),              -- V3_1 ADD
  display_order INT DEFAULT 0,        -- V3_1 ADD
  is_pending BOOLEAN DEFAULT FALSE,   -- V3_1 ADD (TRUE se customizada)
  created_by_professor_id UUID,       -- V3_1 ADD (FK users)
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(academy_id, name, deleted_at)
);

-- Técnicas praticadas em uma sessão (V3_0 + colunas adicionadas por V3_1)
session_techniques (
  session_technique_id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  technique_id UUID NOT NULL,
  academy_id UUID NOT NULL,
  technique_order INT DEFAULT 0,      -- V3_1: relaxado para nullable, CHECK removido
  is_pending BOOLEAN DEFAULT FALSE,   -- V3_1 ADD
  updated_at TIMESTAMP,               -- V3_1 ADD
  deleted_at TIMESTAMP,               -- V3_1 ADD
  created_at TIMESTAMP,
  UNIQUE(session_id, technique_id)
);

-- Favoritos do professor (V3_1 CREATE TABLE)
technique_presets (
  preset_id UUID PRIMARY KEY,
  professor_id UUID NOT NULL REFERENCES users,
  academy_id UUID NOT NULL REFERENCES academies,
  name VARCHAR(255) NOT NULL,
  technique_ids TEXT NOT NULL,  -- JSON array: ["uuid1","uuid2",...]
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(professor_id, academy_id, name)
);
```

**Seed de técnicas:** V3_1 inclui 33 técnicas de judô (6 Básicas + 27 Avançadas) para a academia de teste (`550e8400-...0001`). Confirme com:
```sql
SELECT category, count(*) FROM techniques
WHERE academy_id = '550e8400-e29b-41d4-a716-446655440001'
GROUP BY category;
-- Deve retornar: Básica=6, Avançada=27
```

### Estrutura de Arquivos (Estado Atual)

**Backend — arquivos já existem (REVISAR, não criar):**
```
backend/src/lib/trainingTechniques.ts         ✅ Existe (~380 linhas)
backend/src/controllers/trainingTechniques.ts ✅ Existe (todos handlers)
backend/src/routes/trainings.ts               ✅ Existe (rotas registradas)
backend/src/types/index.ts                    ← verificar se interfaces de técnicas estão
```

**Backend — migration a criar/aplicar:**
```
_bmad-output/V3_1__Training_Techniques_Enhanced.sql  ✅ Arquivo gerado, aplicar ao banco
```

**Backend — testes a criar:**
```
backend/src/tests/training-techniques.test.ts  ← criar (usar training-attendance.test.ts como modelo)
```

**Frontend — arquivos já existem (REVISAR, não criar):**
```
frontend/src/components/training-techniques/
  training-techniques.component.ts   ✅ Existe
  training-techniques.component.html ✅ Existe
  training-techniques.component.scss ✅ Existe
```

**Frontend — verificar/alterar:**
```
frontend/src/app.module.ts           ← confirmar componente declarado
frontend/src/app.routing.module.ts   ← confirmar rota /training/:sessionId/techniques
frontend/src/services/api.service.ts ← confirmar métodos de técnicas
frontend/src/types/index.ts          ← confirmar interfaces Technique, TechniquePreset
```

**Nota de rota de academia:**
A handler `getAcademyTechniquesHandler` gerencia `GET /api/academies/:academyId/techniques`.
Certifique-se de que esta rota está registrada separadamente em `backend/src/app.ts` (não sob o prefixo `/trainings`):
```ts
// backend/src/app.ts (verificar/adicionar se necessário)
import academiesRouter from './routes/academies'; // ou criar routes/academies.ts
app.use('/api/academies', academiesRouter);
// ou inline:
app.get('/api/academies/:academyId/techniques', authMiddleware, requireRole(['Professor']), getAcademyTechniquesHandler);
```

### Contratos de API Recomendados

```ts
// GET /api/academies/:academyId/techniques
{
  academies: {
    byId: {
      [techniqueId]: {
        techniqueId: string,
        name: string,
        category: 'Básica' | 'Avançada',
        iconUrl?: string,
        displayOrder: number
      }
    },
    categories: {
      'Básica': string[], // [techniqueId, ...]
      'Avançada': string[]
    }
  }
}

// GET /api/trainings/:sessionId/techniques
{
  selectedTechniqueIds: string[],
  summary: {
    count: number,
    names: string[] // joined by ", " for display
  }
}

// POST /api/trainings/:sessionId/techniques
// Body: { techniqueId: string }
{
  success: true,
  selectedTechniqueIds: string[],
  summary: { count: number, names: string[] }
}

// POST /api/trainings/:sessionId/techniques/custom
// Body: { name: string }
{
  techniqueId: string, // temporary/UUID
  name: string,
  isPending: true,
  success: true
}

// POST /api/professors/:professorId/technique-presets
// Body: { name: string, techniqueIds: string[] }
{
  presetId: string,
  name: string,
  techniqueCount: number,
  createdAt: string,
  success: true
}

// GET /api/professors/:professorId/technique-presets
{
  presets: [
    { presetId, name, techniqueCount, createdAt },
    ...
  ]
}

// POST /api/trainings/:sessionId/apply-preset/:presetId
{
  success: true,
  presetName: string,
  selectedTechniqueIds: string[],
  summary: { count: number, names: string[] }
}
```

### Referências

- Story 3.1: [Entry Point Conversacional](./3-1-entry-point-conversacional.md) — status: `done`
- Story 3.2: [Marcar Frequência](./3-2-marcar-frequencia.md) — status: `done` (código confiável, usar como modelo de padrões)
- Story 3.4: Adicionar Notas (próxima — ainda não existe, criar placeholder se necessário)
- **Migration base:** `_bmad-output/V3_0__Training.sql`
- **Migration obrigatória:** `_bmad-output/V3_1__Training_Techniques_Enhanced.sql`
- Epics: `_bmad-output/Epics/Epic3/Epic3.md`
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Arquitetura: `_bmad-output/planning-artifacts/architect.md`
- Project Context: `_bmad-output/project-context.md`

### Bug Conhecido no Componente Frontend

Typo detectado em `training-techniques.component.ts`:
```ts
// Linha atual (incorreta):
technigueGroups: TechniqueGroup[] = [];
// Corrigir para:
techniqueGroups: TechniqueGroup[] = [];
```
Verificar todos os usos do template HTML e corrigir consistentemente.

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Ajuste de rota da academia: endpoint `GET /api/academies/:academyId/techniques` registrado em `backend/src/app.ts` com `authMiddleware` e `requireRole(['Professor'])`.
- Correção de compatibilidade de presets: handlers `saveTechniquePresetHandler` e `getProfessorPresetsHandler` agora usam `req.user!.userId` quando rota não recebe `:professorId`.
- Correção de bug frontend: `technigueGroups` renomeado para `techniqueGroups` no componente e template.
- Correção de contrato frontend: `ApiService.saveTechniquePreset` ajustado para `SaveTechniquePresetPayload` -> `SaveTechniquePresetResponse`.
- Correção de bloqueio pré-existente em `backend/src/controllers/users.ts`: remoção de duplicações de handlers/utility que causavam TS2451 no Jest.
- Correção de persistência em `session_techniques`: INSERTs ajustados para incluir `academy_id` em select/custom/preset apply.
- Implementada fila offline IndexedDB para operações de técnicas/favoritos e sincronização automática ao reconectar.
- Validação executada: `npm test -- src/tests/training-techniques.test.ts`, `npm test -- src/tests/training-attendance.test.ts` e `npm test -- --watch=false --include src/components/training-techniques/training-techniques.component.spec.ts`.

### Completion Notes List

- Implementado endpoint explícito para catálogo de técnicas por academia conforme AC1/AC2/AC11.
- Ajustado fluxo de presets para rotas reais em `/api/trainings/presets`, mantendo isolamento por professor.
- Adicionado teste de integração `training-techniques.test.ts` cobrindo listagem, toggle, técnica customizada, preset e RBAC/isolamento.
- Adicionado placeholder da etapa de notas e rota `/training/session/:sessionId/notes` para manter fluxo do wizard sem quebra até Story 3.4.
- Ajustados estilos para AC12 (área de toque 48x48 e espaçamento vertical de 32px).
- Preparação offline implementada com enfileiramento local e sincronização posterior sem travar a UI.
- Story pronta para code review (`review`).

### File List

- backend/src/app.ts
- backend/src/controllers/trainingTechniques.ts
- backend/src/routes/trainings.ts
- backend/src/tests/training-techniques.test.ts (novo)
- frontend/src/app.module.ts
- frontend/src/app.routing.module.ts
- frontend/src/components/training-techniques/training-techniques.component.ts
- frontend/src/components/training-techniques/training-techniques.component.html
- frontend/src/components/training-techniques/training-techniques.component.scss
- frontend/src/components/training-techniques/training-techniques.component.spec.ts (novo)
- frontend/src/components/training-notes-placeholder/training-notes-placeholder.component.ts (novo)
- frontend/src/components/training-notes-placeholder/training-notes-placeholder.component.html (novo)
- frontend/src/components/training-notes-placeholder/training-notes-placeholder.component.scss (novo)
- frontend/src/services/api.service.ts
- frontend/src/services/training-techniques-offline.service.ts (novo)
- _bmad-output/implementation-artifacts/sprint-status.yaml
