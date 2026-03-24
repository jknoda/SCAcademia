import { pool } from './db';

export type AttendanceStatus = 'present' | 'absent' | 'justified';

export interface AttendanceStudentItem {
  studentId: string;
  studentName: string;
  status: AttendanceStatus | null;
  hasHealthScreening: boolean;
}

export interface AttendanceTotals {
  total: number;
  present: number;
}

export interface TrainingAttendancePayload {
  sessionId: string;
  turmaId: string;
  turmaName: string;
  totals: AttendanceTotals;
  students: AttendanceStudentItem[];
}

type SessionScope = {
  sessionId: string;
  turmaId: string;
  turmaName: string;
};

const ACTIVE_ENROLLMENT_STATUS = ['active', 'ativo'];

const getSessionForProfessor = async (
  academyId: string,
  professorId: string,
  sessionId: string
): Promise<SessionScope | null> => {
  const res = await pool.query(
    `SELECT ts.session_id, ts.turma_id, t.name AS turma_name
     FROM training_sessions ts
     JOIN turmas t ON t.turma_id = ts.turma_id
     WHERE ts.session_id = $1
       AND ts.academy_id = $2
       AND ts.professor_id = $3
       AND ts.deleted_at IS NULL
       AND t.deleted_at IS NULL
     LIMIT 1`,
    [sessionId, academyId, professorId]
  );

  if (res.rows.length === 0) {
    return null;
  }

  return {
    sessionId: res.rows[0].session_id,
    turmaId: res.rows[0].turma_id,
    turmaName: res.rows[0].turma_name,
  };
};

const listTurmaStudentsWithAttendance = async (
  academyId: string,
  sessionId: string,
  turmaId: string
): Promise<AttendanceStudentItem[]> => {
  const res = await pool.query(
    `SELECT u.user_id AS student_id,
            u.full_name AS student_name,
            sa.status AS attendance_status,
            EXISTS(
              SELECT 1
              FROM health_records hr
              WHERE hr.user_id = u.user_id
                AND hr.academy_id = u.academy_id
            ) AS has_health_screening
     FROM turma_students ts
     JOIN users u
       ON u.user_id = ts.student_id
      AND u.academy_id = ts.academy_id
      AND u.deleted_at IS NULL
      AND u.role = 'Aluno'
     LEFT JOIN session_attendance sa
       ON sa.session_id = $1
      AND sa.student_id = ts.student_id
      AND sa.academy_id = ts.academy_id
     WHERE ts.academy_id = $2
       AND ts.turma_id = $3
       AND LOWER(ts.status) = ANY($4::text[])
     ORDER BY u.full_name ASC`,
    [sessionId, academyId, turmaId, ACTIVE_ENROLLMENT_STATUS]
  );

  return res.rows.map((row) => ({
    studentId: row.student_id,
    studentName: row.student_name,
    status: row.attendance_status || null,
    hasHealthScreening: row.has_health_screening === true,
  }));
};

const calculateTotals = (students: AttendanceStudentItem[]): AttendanceTotals => ({
  total: students.length,
  present: students.filter((student) => student.status === 'present').length,
});

export const getTrainingAttendance = async (
  academyId: string,
  professorId: string,
  sessionId: string
): Promise<TrainingAttendancePayload | null> => {
  const session = await getSessionForProfessor(academyId, professorId, sessionId);
  if (!session) {
    return null;
  }

  const students = await listTurmaStudentsWithAttendance(academyId, session.sessionId, session.turmaId);
  return {
    sessionId: session.sessionId,
    turmaId: session.turmaId,
    turmaName: session.turmaName,
    totals: calculateTotals(students),
    students,
  };
};

export const upsertTrainingAttendance = async (input: {
  academyId: string;
  professorId: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
}): Promise<{
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  hasHealthScreening: boolean;
  totals: AttendanceTotals;
} | null> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const sessionRes = await client.query(
      `SELECT ts.session_id, ts.turma_id
       FROM training_sessions ts
       WHERE ts.session_id = $1
         AND ts.academy_id = $2
         AND ts.professor_id = $3
         AND ts.deleted_at IS NULL
       LIMIT 1`,
      [input.sessionId, input.academyId, input.professorId]
    );

    if (sessionRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const turmaId = sessionRes.rows[0].turma_id as string;

    const enrollmentRes = await client.query(
      `SELECT 1
       FROM turma_students ts
       WHERE ts.academy_id = $1
         AND ts.turma_id = $2
         AND ts.student_id = $3
         AND LOWER(ts.status) = ANY($4::text[])
       LIMIT 1`,
      [input.academyId, turmaId, input.studentId, ACTIVE_ENROLLMENT_STATUS]
    );

    if (enrollmentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      `INSERT INTO session_attendance (
         attendance_id,
         session_id,
         student_id,
         academy_id,
         status,
         marked_by_user_id,
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
         status = EXCLUDED.status,
         marked_by_user_id = EXCLUDED.marked_by_user_id,
         updated_at = NOW()`,
      [input.sessionId, input.studentId, input.academyId, input.status, input.professorId]
    );

    const totalsRes = await client.query(
      `SELECT
         COUNT(*)::int AS total_students,
         SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END)::int AS present_students
       FROM turma_students ts
       LEFT JOIN session_attendance sa
         ON sa.session_id = $1
        AND sa.student_id = ts.student_id
        AND sa.academy_id = ts.academy_id
       WHERE ts.academy_id = $2
         AND ts.turma_id = $3
         AND LOWER(ts.status) = ANY($4::text[])`,
      [input.sessionId, input.academyId, turmaId, ACTIVE_ENROLLMENT_STATUS]
    );

    const healthRes = await client.query(
      `SELECT EXISTS(
         SELECT 1
         FROM health_records hr
         WHERE hr.user_id = $1
           AND hr.academy_id = $2
       ) AS has_health_screening`,
      [input.studentId, input.academyId]
    );

    await client.query('COMMIT');

    return {
      sessionId: input.sessionId,
      studentId: input.studentId,
      status: input.status,
      hasHealthScreening: healthRes.rows[0]?.has_health_screening === true,
      totals: {
        total: totalsRes.rows[0]?.total_students || 0,
        present: totalsRes.rows[0]?.present_students || 0,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
