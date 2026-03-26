import { QueryResult } from 'pg';
import { pool } from './db';

export interface TrainingSessionRow {
  session_id: string;
  session_date: string;
  session_time: string;
  turma_name: string;
  present_count: number;
  total_count: number;
  technique_names: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingHistoryFilters {
  dateFrom?: string; // ISO date
  dateTo?: string;   // ISO date
  turmaId?: string;  // UUID
  noteKeyword?: string; // text search
}

export interface TrainingHistoryResponse {
  trainings: TrainingSessionRow[];
  total: number;
}

/**
 * TASK 1: Query builder for listing trainings with filters
 * Fetches professor's trainings with optional filters for date, turma, and notes.
 */
export async function getTrainingsForProfessor(
  professorId: string,
  academyId: string,
  limit: number,
  offset: number,
  filters: TrainingHistoryFilters
): Promise<TrainingHistoryResponse> {
  // Clamp limit to 1-100 (safe default)
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);
  const safeOffset = Math.max(0, Math.floor(offset));

  // Build WHERE clause dynamically
  const whereClauses = [
    'ts.professor_id = $1',
    'ts.academy_id = $2',
    'ts.deleted_at IS NULL' // Soft delete filter
  ];
  
  let paramIndex = 3;
  const params: any[] = [professorId, academyId];

  if (filters.dateFrom) {
    whereClauses.push(`ts.session_date >= $${paramIndex}`);
    params.push(filters.dateFrom);
    paramIndex++;
  }

  if (filters.dateTo) {
    whereClauses.push(`ts.session_date <= $${paramIndex}`);
    params.push(filters.dateTo);
    paramIndex++;
  }

  if (filters.turmaId) {
    whereClauses.push(`ts.turma_id = $${paramIndex}`);
    params.push(filters.turmaId);
    paramIndex++;
  }

  if (filters.noteKeyword) {
    whereClauses.push(`LOWER(ts.notes) LIKE LOWER($${paramIndex})`);
    params.push(`%${filters.noteKeyword}%`);
    paramIndex++;
  }

  const whereSQL = whereClauses.join(' AND ');

  // List query with pagination
  const listSQL = `
    SELECT
      ts.session_id,
      ts.session_date::TEXT,
      ts.session_time::TEXT,
      t.name AS turma_name,
      COALESCE(
        (SELECT COUNT(*) FROM session_attendance
         WHERE session_id = ts.session_id AND status = 'present'),
        0
      ) AS present_count,
      COALESCE(
        (SELECT COUNT(*) FROM turma_students
         WHERE turma_id = ts.turma_id AND dropped_at IS NULL),
        0
      ) AS total_count,
      COALESCE(
        (SELECT ARRAY_AGG(tk.name ORDER BY st.technique_order)
         FROM session_techniques st
         JOIN techniques tk ON st.technique_id = tk.technique_id
         WHERE st.session_id = ts.session_id AND tk.deleted_at IS NULL),
        ARRAY[]::TEXT[]
      ) AS technique_names,
      ts.notes,
      ts.created_at::TEXT,
      ts.updated_at::TEXT
    FROM training_sessions ts
    JOIN turmas t ON ts.turma_id = t.turma_id AND t.deleted_at IS NULL
    WHERE ${whereSQL}
    ORDER BY ts.session_date DESC, ts.session_time DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(safeLimit);
  params.push(safeOffset);

  // Count query
  const countSQL = `
    SELECT COUNT(*) as total
    FROM training_sessions ts
    WHERE ${whereSQL}
  `;

  const countParams = params.slice(0, paramIndex - 1);

  try {
    const [listResult, countResult] = await Promise.all([
      pool.query(listSQL, params),
      pool.query(countSQL, countParams)
    ]);

    return {
      trainings: listResult.rows,
      total: parseInt(countResult.rows[0].total, 10)
    };
  } catch (error) {
    console.error('[trainingHistory] getTrainingsForProfessor error:', error);
    throw error;
  }
}

/**
 * Get single training session details with full attendance and techniques
 */
export async function getTrainingDetails(
  sessionId: string,
  professorId: string,
  academyId: string
): Promise<any | null> {
  const sql = `
    SELECT
      ts.session_id,
      ts.turma_id,
      ts.professor_id,
      ts.session_date::TEXT,
      ts.session_time::TEXT,
      ts.duration_minutes,
      ts.notes,
      t.name AS turma_name,
      ts.created_at::TEXT,
      ts.updated_at::TEXT,
      ts.deleted_at
    FROM training_sessions ts
    JOIN turmas t ON ts.turma_id = t.turma_id
    WHERE ts.session_id = $1
      AND ts.professor_id = $2
      AND ts.academy_id = $3
      AND ts.deleted_at IS NULL
  `;

  try {
    const result = await pool.query(sql, [sessionId, professorId, academyId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('[trainingHistory] getTrainingDetails error:', error);
    throw error;
  }
}

/**
 * Get full attendance records for a session
 */
export async function getSessionAttendance(sessionId: string): Promise<any[]> {
  const sql = `
    SELECT
      sa.student_id,
      u.full_name AS student_name,
      sa.status
    FROM session_attendance sa
    JOIN users u ON sa.student_id = u.user_id AND u.academy_id = sa.academy_id AND u.deleted_at IS NULL
    WHERE sa.session_id = $1
    ORDER BY u.full_name
  `;

  try {
    const result = await pool.query(sql, [sessionId]);
    return result.rows;
  } catch (error) {
    console.error('[trainingHistory] getSessionAttendance error:', error);
    throw error;
  }
}

/**
 * Get ordered technique names for a session
 */
export async function getSessionDetailTechniques(sessionId: string): Promise<Array<{ technique_id: string; name: string; category: string }>> {
  const sql = `
    SELECT
      tk.technique_id,
      tk.name,
      COALESCE(tk.category, '') AS category
    FROM session_techniques st
    JOIN techniques tk ON tk.technique_id = st.technique_id AND tk.deleted_at IS NULL
    WHERE st.session_id = $1
      AND st.deleted_at IS NULL
    ORDER BY st.technique_order, tk.name
  `;
  try {
    const result = await pool.query(sql, [sessionId]);
    return result.rows;
  } catch (error) {
    console.error('[trainingHistory] getSessionDetailTechniques error:', error);
    throw error;
  }
}

/**
 * TASK 4: Update training session with audit trail
 */
export async function updateTrainingSession(
  sessionId: string,
  professorId: string,
  academyId: string,
  updates: {
    notes?: string;
    attendance?: Array<{ studentId: string; status: 'present' | 'absent' | 'justified' }>;
    techniques?: string[]; // technique IDs
  }
): Promise<any | null> {
  // Start transaction
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get old values before update
    const oldSession = await client.query(
      `SELECT session_id, notes, updated_at FROM training_sessions
       WHERE session_id = $1 AND professor_id = $2 AND academy_id = $3 AND deleted_at IS NULL`,
      [sessionId, professorId, academyId]
    );

    if (oldSession.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const oldData = oldSession.rows[0];

    // Update session notes if provided
    if (updates.notes !== undefined) {
      await client.query(
        `UPDATE training_sessions SET notes = $1, updated_at = CURRENT_TIMESTAMP
         WHERE session_id = $2`,
        [updates.notes, sessionId]
      );
    }

    // Update attendance if provided
    if (updates.attendance) {
      for (const record of updates.attendance) {
        await client.query(
          `UPDATE session_attendance SET status = $1, updated_at = CURRENT_TIMESTAMP
           WHERE session_id = $2 AND student_id = $3`,
          [record.status, sessionId, record.studentId]
        );
      }
    }

    // Update techniques if provided
    if (updates.techniques) {
      await client.query(
        `DELETE FROM session_techniques WHERE session_id = $1`,
        [sessionId]
      );

      for (let i = 0; i < updates.techniques.length; i++) {
        await client.query(
          `INSERT INTO session_techniques (session_id, technique_id, academy_id, technique_order)
           VALUES ($1, $2, $3, $4)`,
          [sessionId, updates.techniques[i], academyId, i + 1]
        );
      }
    }

    // Get updated session
    const updatedSession = await client.query(
      `SELECT * FROM training_sessions WHERE session_id = $1`,
      [sessionId]
    );

    await client.query('COMMIT');
    return updatedSession.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[trainingHistory] updateTrainingSession error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * TASK 5: Soft-delete training session
 */
export async function softDeleteTrainingSession(
  sessionId: string,
  professorId: string,
  academyId: string
): Promise<boolean> {
  const sql = `
    UPDATE training_sessions
    SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE session_id = $1
      AND professor_id = $2
      AND academy_id = $3
      AND deleted_at IS NULL
  `;

  try {
    const result = await pool.query(sql, [sessionId, professorId, academyId]);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('[trainingHistory] softDeleteTrainingSession error:', error);
    throw error;
  }
}

/**
 * TASK 6: Restore (undo) soft-deleted training session
 */
export async function restoreTrainingSession(
  sessionId: string,
  professorId: string,
  academyId: string
): Promise<boolean> {
  const sql = `
    UPDATE training_sessions
    SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE session_id = $1
      AND professor_id = $2
      AND academy_id = $3
      AND deleted_at IS NOT NULL
  `;

  try {
    const result = await pool.query(sql, [sessionId, professorId, academyId]);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('[trainingHistory] restoreTrainingSession error:', error);
    throw error;
  }
}
