import { pool } from './db';

export interface Technique {
  techniqueId: string;
  name: string;
  description?: string;
  category: 'Básica' | 'Avançada';
  iconUrl?: string;
  displayOrder: number;
}

export interface SessionTechnique {
  sessionTechniqueId: string;
  sessionId: string;
  techniqueId: string;
  isPending: boolean;
  createdAt: Date;
}

export interface TechniquePreset {
  presetId: string;
  professorId: string;
  academyId: string;
  name: string;
  techniqueIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GetTechniquesResponse {
  byId: Record<string, Technique>;
  categories: Record<string, string[]>;
}

const toTechnique = (row: any): Technique => ({
  techniqueId: row.technique_id,
  name: row.name,
  description: row.description || undefined,
  category: row.category,
  iconUrl: row.icon_url || undefined,
  displayOrder: row.display_order || 0,
});

const toSessionTechnique = (row: any): SessionTechnique => ({
  sessionTechniqueId: row.session_technique_id,
  sessionId: row.session_id,
  techniqueId: row.technique_id,
  isPending: row.is_pending || false,
  createdAt: new Date(row.created_at),
});

const toTechniquePreset = (row: any): TechniquePreset => ({
  presetId: row.preset_id,
  professorId: row.professor_id,
  academyId: row.academy_id,
  name: row.name,
  techniqueIds: row.technique_ids ? JSON.parse(row.technique_ids) : [],
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

/**
 * Get all techniques for an academy, grouped by category
 */
export const getAcademyTechniques = async (academyId: string): Promise<GetTechniquesResponse> => {
  const res = await pool.query(
    `SELECT technique_id, name, description, category, icon_url, display_order
     FROM techniques
     WHERE academy_id = $1
       AND deleted_at IS NULL
     ORDER BY display_order ASC, name ASC`,
    [academyId]
  );

  const byId: Record<string, Technique> = {};
  const categories: Record<string, string[]> = {};

  for (const row of res.rows) {
    const technique = toTechnique(row);
    byId[technique.techniqueId] = technique;

    if (!categories[technique.category]) {
      categories[technique.category] = [];
    }
    categories[technique.category].push(technique.techniqueId);
  }

  // Ensure categories exist even if empty
  if (!categories['Básica']) {
    categories['Básica'] = [];
  }
  if (!categories['Avançada']) {
    categories['Avançada'] = [];
  }

  return { byId, categories };
};

/**
 * Get techniques selected for a specific training session
 */
export const getSessionTechniques = async (
  academyId: string,
  professorId: string,
  sessionId: string
): Promise<{
  selectedTechniqueIds: string[];
  summary: { count: number; names: string[] };
  allTechniques: GetTechniquesResponse;
}> => {
  // Verify session belongs to professor and academy
  const sessionRes = await pool.query(
    `SELECT session_id FROM training_sessions
     WHERE session_id = $1
       AND academy_id = $2
       AND professor_id = $3
       AND deleted_at IS NULL
     LIMIT 1`,
    [sessionId, academyId, professorId]
  );

  if (!sessionRes.rows.length) {
    throw new Error('Sessão não encontrada');
  }

  // Get selected techniques
  const selectedRes = await pool.query(
    `SELECT st.technique_id, t.name
     FROM session_techniques st
     JOIN techniques t ON st.technique_id = t.technique_id
     WHERE st.session_id = $1
       AND st.deleted_at IS NULL
     ORDER BY COALESCE(st.technique_order, 9999) ASC, st.created_at ASC, t.name ASC`,
    [sessionId]
  );

  const selectedTechniqueIds = selectedRes.rows.map((row) => row.technique_id);
  const selectedNames = selectedRes.rows.map((row) => row.name);

  // Get all techniques for reference
  const allTechniques = await getAcademyTechniques(academyId);

  return {
    selectedTechniqueIds,
    summary: { count: selectedTechniqueIds.length, names: selectedNames },
    allTechniques,
  };
};

/**
 * Select a technique for a training session (upsert)
 */
export const selectSessionTechnique = async (
  academyId: string,
  professorId: string,
  sessionId: string,
  techniqueId: string
): Promise<boolean> => {
  // Verify session belongs to professor
  const sessionRes = await pool.query(
    `SELECT session_id FROM training_sessions
     WHERE session_id = $1
       AND academy_id = $2
       AND professor_id = $3
       AND deleted_at IS NULL
     LIMIT 1`,
    [sessionId, academyId, professorId]
  );

  if (!sessionRes.rows.length) {
    throw new Error('Sessão não encontrada');
  }

  // Verify technique exists and belongs to academy
  const techniqueRes = await pool.query(
    `SELECT technique_id FROM techniques
     WHERE technique_id = $1
       AND academy_id = $2
       AND deleted_at IS NULL
     LIMIT 1`,
    [techniqueId, academyId]
  );

  if (!techniqueRes.rows.length) {
    throw new Error('Técnica não encontrada');
  }

  const orderRes = await pool.query(
    `SELECT COALESCE(MAX(technique_order), 0) + 1 AS next_order
     FROM session_techniques
     WHERE session_id = $1
       AND deleted_at IS NULL`,
    [sessionId]
  );
  const nextOrder = Number(orderRes.rows[0]?.next_order || 1);

  // Insert or reactivate a previously soft-deleted relation.
  await pool.query(
    `INSERT INTO session_techniques (session_id, technique_id, academy_id, technique_order, is_pending, created_at, updated_at)
     VALUES ($1, $2, $3, $4, FALSE, NOW(), NOW())
     ON CONFLICT (session_id, technique_id) DO UPDATE
       SET academy_id = EXCLUDED.academy_id,
           technique_order = COALESCE(session_techniques.technique_order, EXCLUDED.technique_order),
           is_pending = FALSE,
           deleted_at = NULL,
           updated_at = NOW()`,
    [sessionId, techniqueId, academyId, nextOrder]
  );

  return true;
};

/**
 * Deselect a technique from a training session
 */
export const deselectSessionTechnique = async (
  academyId: string,
  professorId: string,
  sessionId: string,
  techniqueId: string
): Promise<boolean> => {
  // Verify session belongs to professor
  const sessionRes = await pool.query(
    `SELECT session_id FROM training_sessions
     WHERE session_id = $1
       AND academy_id = $2
       AND professor_id = $3
       AND deleted_at IS NULL
     LIMIT 1`,
    [sessionId, academyId, professorId]
  );

  if (!sessionRes.rows.length) {
    throw new Error('Sessão não encontrada');
  }

  // Soft delete the session_technique record
  await pool.query(
    `UPDATE session_techniques
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE session_id = $1
       AND technique_id = $2
       AND deleted_at IS NULL`,
    [sessionId, techniqueId]
  );

  return true;
};

/**
 * Add a custom technique to a session
 */
export const addCustomTechnique = async (
  academyId: string,
  professorId: string,
  sessionId: string,
  techniqueeName: string
): Promise<Technique> => {
  // Verify session belongs to professor
  const sessionRes = await pool.query(
    `SELECT session_id FROM training_sessions
     WHERE session_id = $1
       AND academy_id = $2
       AND professor_id = $3
       AND deleted_at IS NULL
     LIMIT 1`,
    [sessionId, academyId, professorId]
  );

  if (!sessionRes.rows.length) {
    throw new Error('Sessão não encontrada');
  }

  // Create custom technique directly in academy catalog.
  const res = await pool.query(
    `INSERT INTO techniques (academy_id, name, category, is_pending, created_by_professor_id, created_at, updated_at)
     VALUES ($1, $2, 'Avançada', FALSE, $3, NOW(), NOW())
     RETURNING technique_id, name, description, category, icon_url, display_order`,
    [academyId, techniqueeName.trim(), professorId]
  );

  const customTechnique = toTechnique(res.rows[0]);

  const orderRes = await pool.query(
    `SELECT COALESCE(MAX(technique_order), 0) + 1 AS next_order
     FROM session_techniques
     WHERE session_id = $1
       AND deleted_at IS NULL`,
    [sessionId]
  );
  const nextOrder = Number(orderRes.rows[0]?.next_order || 1);

  // Immediately add to session (or reactivate if it was previously removed).
  await pool.query(
    `INSERT INTO session_techniques (session_id, technique_id, academy_id, technique_order, is_pending, created_at, updated_at)
     VALUES ($1, $2, $3, $4, FALSE, NOW(), NOW())
     ON CONFLICT (session_id, technique_id) DO UPDATE
       SET academy_id = EXCLUDED.academy_id,
           technique_order = COALESCE(session_techniques.technique_order, EXCLUDED.technique_order),
           is_pending = FALSE,
           deleted_at = NULL,
           updated_at = NOW()`,
    [sessionId, customTechnique.techniqueId, academyId, nextOrder]
  );

  return customTechnique;
};

/**
 * Save a technique preset (favorito) for a professor
 */
export const saveTechniquePreset = async (
  professorId: string,
  academyId: string,
  name: string,
  techniqueIds: string[]
): Promise<TechniquePreset> => {
  const techniqueIdsJson = JSON.stringify(techniqueIds);

  const res = await pool.query(
    `INSERT INTO technique_presets (professor_id, academy_id, name, technique_ids, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (professor_id, academy_id, name) DO UPDATE
       SET technique_ids = $4, updated_at = NOW()
     RETURNING preset_id, professor_id, academy_id, name, technique_ids, created_at, updated_at`,
    [professorId, academyId, name.trim(), techniqueIdsJson]
  );

  return toTechniquePreset(res.rows[0]);
};

/**
 * Get all presets for a professor
 */
export const getProfessorTechniquePresets = async (
  professorId: string,
  academyId: string
): Promise<Array<{ presetId: string; name: string; techniqueCount: number; createdAt: Date }>> => {
  const res = await pool.query(
    `SELECT preset_id, name, technique_ids, created_at
     FROM technique_presets
     WHERE professor_id = $1
       AND academy_id = $2
       AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [professorId, academyId]
  );

  return res.rows.map((row) => ({
    presetId: row.preset_id,
    name: row.name,
    techniqueCount: row.technique_ids ? JSON.parse(row.technique_ids).length : 0,
    createdAt: new Date(row.created_at),
  }));
};

/**
 * Get a specific preset and apply to session
 */
export const applyPresetToSession = async (
  academyId: string,
  professorId: string,
  sessionId: string,
  presetId: string
): Promise<{ presetName: string; selectedTechniqueIds: string[] }> => {
  // Verify session belongs to professor
  const sessionRes = await pool.query(
    `SELECT session_id FROM training_sessions
     WHERE session_id = $1
       AND academy_id = $2
       AND professor_id = $3
       AND deleted_at IS NULL
     LIMIT 1`,
    [sessionId, academyId, professorId]
  );

  if (!sessionRes.rows.length) {
    throw new Error('Sessão não encontrada');
  }

  // Get preset
  const presetRes = await pool.query(
    `SELECT preset_id, name, technique_ids
     FROM technique_presets
     WHERE preset_id = $1
       AND professor_id = $2
       AND academy_id = $3
       AND deleted_at IS NULL
     LIMIT 1`,
    [presetId, professorId, academyId]
  );

  if (!presetRes.rows.length) {
    throw new Error('Favorito não encontrado');
  }

  const preset = presetRes.rows[0];
  const techniqueIds: string[] = preset.technique_ids ? JSON.parse(preset.technique_ids) : [];

  const orderRes = await pool.query(
    `SELECT COALESCE(MAX(technique_order), 0) AS max_order
     FROM session_techniques
     WHERE session_id = $1
       AND deleted_at IS NULL`,
    [sessionId]
  );
  const baseOrder = Number(orderRes.rows[0]?.max_order || 0);

  // Add all techniques from preset to session and reactivate any soft-deleted rows.
  for (let i = 0; i < techniqueIds.length; i += 1) {
    const techniqueId = techniqueIds[i];
    await pool.query(
      `INSERT INTO session_techniques (session_id, technique_id, academy_id, technique_order, is_pending, created_at, updated_at)
       VALUES ($1, $2, $3, $4, FALSE, NOW(), NOW())
       ON CONFLICT (session_id, technique_id) DO UPDATE
         SET academy_id = EXCLUDED.academy_id,
             technique_order = COALESCE(session_techniques.technique_order, EXCLUDED.technique_order),
             is_pending = FALSE,
             deleted_at = NULL,
             updated_at = NOW()`,
      [sessionId, techniqueId, academyId, baseOrder + i + 1]
    );
  }

  return {
    presetName: preset.name,
    selectedTechniqueIds: techniqueIds,
  };
};

export const createAcademyTechnique = async (
  academyId: string,
  professorId: string,
  name: string,
  category: 'Básica' | 'Avançada',
  description?: string
): Promise<Technique> => {
  const orderRes = await pool.query(
    `SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order
     FROM techniques
     WHERE academy_id = $1
       AND deleted_at IS NULL`,
    [academyId]
  );
  const nextOrder = Number(orderRes.rows[0]?.next_order || 1);

  const res = await pool.query(
    `INSERT INTO techniques (
       academy_id,
       name,
       description,
       category,
       display_order,
       is_pending,
       created_by_professor_id,
       created_at,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, FALSE, $6, NOW(), NOW())
     RETURNING technique_id, name, description, category, icon_url, display_order`,
    [academyId, name.trim(), description || null, category, nextOrder, professorId]
  );

  return toTechnique(res.rows[0]);
};

export const deleteAcademyTechnique = async (
  academyId: string,
  techniqueId: string
): Promise<Technique> => {
  const usageRes = await pool.query(
    `SELECT COUNT(*)::int AS linked_count
     FROM session_techniques st
     JOIN training_sessions ts ON ts.session_id = st.session_id
     WHERE st.technique_id = $1
       AND st.deleted_at IS NULL
       AND ts.academy_id = $2
       AND ts.deleted_at IS NULL`,
    [techniqueId, academyId]
  );

  if ((usageRes.rows[0]?.linked_count || 0) > 0) {
    throw new Error('Não é possível excluir técnica vinculada a treinos ativos. Remova o vínculo antes de excluir.');
  }

  const res = await pool.query(
    `UPDATE techniques
     SET deleted_at = NOW(),
         updated_at = NOW()
     WHERE academy_id = $1
       AND technique_id = $2
       AND deleted_at IS NULL
     RETURNING technique_id, name, description, category, icon_url, display_order`,
    [academyId, techniqueId]
  );

  if (!res.rows.length) {
    throw new Error('Técnica não encontrada');
  }

  return toTechnique(res.rows[0]);
};

export const reorderSessionTechniques = async (
  academyId: string,
  professorId: string,
  sessionId: string,
  orderedTechniqueIds: string[]
): Promise<void> => {
  const sessionRes = await pool.query(
    `SELECT session_id FROM training_sessions
     WHERE session_id = $1
       AND academy_id = $2
       AND professor_id = $3
       AND deleted_at IS NULL
     LIMIT 1`,
    [sessionId, academyId, professorId]
  );

  if (!sessionRes.rows.length) {
    throw new Error('Sessão não encontrada');
  }

  const selectedRes = await pool.query(
    `SELECT technique_id
     FROM session_techniques
     WHERE session_id = $1
       AND deleted_at IS NULL`,
    [sessionId]
  );

  const selectedSet = new Set<string>(selectedRes.rows.map((row) => row.technique_id));
  const orderedSet = new Set<string>(orderedTechniqueIds);

  if (orderedSet.size !== selectedSet.size) {
    throw new Error('Lista de técnicas inválida para reordenação');
  }

  for (const techniqueId of orderedSet) {
    if (!selectedSet.has(techniqueId)) {
      throw new Error('Lista de técnicas inválida para reordenação');
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < orderedTechniqueIds.length; i += 1) {
      await client.query(
        `UPDATE session_techniques
         SET technique_order = $3,
             updated_at = NOW()
         WHERE session_id = $1
           AND technique_id = $2
           AND deleted_at IS NULL`,
        [sessionId, orderedTechniqueIds[i], i + 1]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
