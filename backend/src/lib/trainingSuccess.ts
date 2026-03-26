import { pool } from './db';

export interface RecentTrainingSummary {
  sessionId: string;
  sessionDate: string;
  turmaName: string;
  presentCount: number;
  techniquePreview: string[];
}

export const getRecentTrainings = async (
  academyId: string,
  professorId: string,
  limit: number = 3
): Promise<RecentTrainingSummary[]> => {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 50);

  const res = await pool.query(
    `SELECT
       ts.session_id,
       ts.session_date,
       t.name AS turma_name,
       COALESCE(att.present_count, 0) AS present_count,
       COALESCE(tech.names, ARRAY[]::text[]) AS technique_names
     FROM training_sessions ts
     JOIN turmas t ON t.turma_id = ts.turma_id
     LEFT JOIN (
       SELECT session_id, COUNT(*) FILTER (WHERE status = 'present') AS present_count
       FROM session_attendance
       GROUP BY session_id
     ) att ON att.session_id = ts.session_id
     LEFT JOIN (
       SELECT st.session_id, (ARRAY_AGG(tk.name ORDER BY tk.name))[1:3] AS names
       FROM session_techniques st
       JOIN techniques tk ON tk.technique_id = st.technique_id
       WHERE st.deleted_at IS NULL
         AND tk.deleted_at IS NULL
       GROUP BY st.session_id
     ) tech ON tech.session_id = ts.session_id
     WHERE ts.academy_id = $1
       AND ts.professor_id = $2
       AND ts.deleted_at IS NULL
       AND t.deleted_at IS NULL
       AND ts.offline_synced_at IS NOT NULL
     ORDER BY ts.session_date DESC, ts.session_time DESC
     LIMIT $3`,
    [academyId, professorId, safeLimit]
  );

  return res.rows.map((row) => ({
    sessionId: String(row.session_id),
    sessionDate: new Date(row.session_date as string).toISOString().slice(0, 10),
    turmaName: String(row.turma_name),
    presentCount: Number(row.present_count),
    techniquePreview: ((row.technique_names as string[]) || []),
  }));
};
