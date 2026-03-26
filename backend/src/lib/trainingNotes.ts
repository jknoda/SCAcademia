import { pool } from './db';

export interface PresentStudent {
  userId: string;
  fullName: string;
  avatarInitials: string;
}

export interface SessionStudentNote {
  studentId: string;
  content: string;
  updatedAt: string;
}

export interface GetSessionNotesResponse {
  generalNotes: string | null;
  presentStudents: PresentStudent[];
  studentNotes: SessionStudentNote[];
}

const buildInitials = (fullName: string): string => {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return 'NA';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
};

const ensureSessionOwnership = async (
  academyId: string,
  professorId: string,
  sessionId: string
): Promise<void> => {
  const res = await pool.query(
    `SELECT 1
     FROM training_sessions ts
     WHERE ts.session_id = $1
       AND ts.academy_id = $2
       AND ts.professor_id = $3
       AND ts.deleted_at IS NULL
     LIMIT 1`,
    [sessionId, academyId, professorId]
  );

  if (res.rows.length === 0) {
    throw new Error('Sessão não encontrada para o professor atual');
  }
};

export const getSessionNotes = async (
  academyId: string,
  professorId: string,
  sessionId: string
): Promise<GetSessionNotesResponse> => {
  const sessionRes = await pool.query(
    `SELECT notes
     FROM training_sessions ts
     WHERE ts.session_id = $1
       AND ts.academy_id = $2
       AND ts.professor_id = $3
       AND ts.deleted_at IS NULL
     LIMIT 1`,
    [sessionId, academyId, professorId]
  );

  if (sessionRes.rows.length === 0) {
    throw new Error('Sessão não encontrada para o professor atual');
  }

  const studentsRes = await pool.query(
    `SELECT u.user_id, u.full_name
     FROM session_attendance sa
     JOIN users u
       ON u.user_id = sa.student_id
      AND u.academy_id = sa.academy_id
      AND u.deleted_at IS NULL
     WHERE sa.session_id = $1
       AND sa.academy_id = $2
       AND sa.status = 'present'
     ORDER BY u.full_name ASC`,
    [sessionId, academyId]
  );

  const notesRes = await pool.query(
    `SELECT sc.student_id, sc.content, sc.updated_at
     FROM session_comments sc
     WHERE sc.session_id = $1
       AND sc.academy_id = $2
       AND sc.deleted_at IS NULL
     ORDER BY sc.updated_at DESC`,
    [sessionId, academyId]
  );

  return {
    generalNotes: (sessionRes.rows[0].notes as string | null) || null,
    presentStudents: studentsRes.rows.map((row) => ({
      userId: row.user_id as string,
      fullName: row.full_name as string,
      avatarInitials: buildInitials(row.full_name as string),
    })),
    studentNotes: notesRes.rows.map((row) => ({
      studentId: row.student_id as string,
      content: row.content as string,
      updatedAt: new Date(row.updated_at as string).toISOString(),
    })),
  };
};

export const saveGeneralNotes = async (input: {
  academyId: string;
  professorId: string;
  sessionId: string;
  notes: string;
}): Promise<void> => {
  if (input.notes.length > 400) {
    throw new Error('Notas gerais não podem exceder 400 caracteres');
  }

  const res = await pool.query(
    `UPDATE training_sessions
     SET notes = $1,
         updated_at = NOW()
     WHERE session_id = $2
       AND academy_id = $3
       AND professor_id = $4
       AND deleted_at IS NULL
     RETURNING session_id`,
    [input.notes, input.sessionId, input.academyId, input.professorId]
  );

  if (res.rows.length === 0) {
    throw new Error('Sessão não encontrada para o professor atual');
  }
};

export const saveStudentNote = async (input: {
  academyId: string;
  professorId: string;
  sessionId: string;
  studentId: string;
  content: string;
}): Promise<void> => {
  if (input.content.length > 200) {
    throw new Error('Nota por aluno não pode exceder 200 caracteres');
  }

  await ensureSessionOwnership(input.academyId, input.professorId, input.sessionId);

  const studentAttendanceRes = await pool.query(
    `SELECT 1
     FROM session_attendance sa
     JOIN users u
       ON u.user_id = sa.student_id
      AND u.academy_id = sa.academy_id
      AND u.deleted_at IS NULL
     WHERE sa.session_id = $1
       AND sa.academy_id = $2
       AND sa.student_id = $3
       AND sa.status = 'present'
     LIMIT 1`,
    [input.sessionId, input.academyId, input.studentId]
  );

  if (studentAttendanceRes.rows.length === 0) {
    throw new Error('Aluno não está presente na sessão');
  }

  await pool.query(
    `INSERT INTO session_comments (
       comment_id,
       session_id,
       student_id,
       professor_id,
       academy_id,
       content,
       created_at,
       updated_at
     ) VALUES (
       gen_random_uuid(),
       $1,
       $2,
       $3,
       $4,
       $5,
       NOW(),
       NOW()
     )
     ON CONFLICT (session_id, student_id)
     DO UPDATE SET
       content = EXCLUDED.content,
       updated_at = NOW(),
       deleted_at = NULL`,
    [
      input.sessionId,
      input.studentId,
      input.professorId,
      input.academyId,
      input.content,
    ]
  );
};
