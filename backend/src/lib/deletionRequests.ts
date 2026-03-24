import { pool } from './db';

export interface DeletionRequest {
  deletionRequestId: string;
  academyId: string;
  studentId: string;
  requestedById: string;
  status: string;
  reason?: string | null;
  requestedAt: Date;
  deletionScheduledAt: Date;
  processedAt?: Date | null;
}

export interface DeletionRequestWithNames extends DeletionRequest {
  studentName?: string;
  requestedByName?: string;
}

export interface LinkedStudent {
  studentId: string;
  studentName: string;
  hasHealthScreening: boolean;
  healthScreeningUpdatedAt?: Date | null;
}

const rowToDeletionRequest = (row: any): DeletionRequest => ({
  deletionRequestId: row.deletion_request_id,
  academyId: row.academy_id,
  studentId: row.student_id,
  requestedById: row.requested_by_id,
  status: row.status,
  reason: row.reason,
  requestedAt: row.requested_at,
  deletionScheduledAt: row.deletion_scheduled_at,
  processedAt: row.processed_at || null,
});

const rowToDeletionRequestWithNames = (row: any): DeletionRequestWithNames => ({
  ...rowToDeletionRequest(row),
  studentName: row.student_name || undefined,
  requestedByName: row.requested_by_name || undefined,
});

export const hasPendingDeletionRequest = async (academyId: string, studentId: string): Promise<boolean> => {
  const res = await pool.query(
    `SELECT 1
     FROM deletion_requests
     WHERE academy_id = $1
       AND student_id = $2
       AND status = 'pending'
     LIMIT 1`,
    [academyId, studentId]
  );
  return res.rows.length > 0;
};

export const createDeletionRequest = async (
  academyId: string,
  studentId: string,
  requestedById: string,
  reason?: string
): Promise<DeletionRequest> => {
  const res = await pool.query(
    `INSERT INTO deletion_requests (
       deletion_request_id,
       academy_id,
       student_id,
       requested_by_id,
       status,
       reason,
       requested_at,
       deletion_scheduled_at
     ) VALUES (
       gen_random_uuid(),
       $1,
       $2,
       $3,
       'pending',
       $4,
       NOW(),
       NOW() + INTERVAL '30 days'
     )
     RETURNING *`,
    [academyId, studentId, requestedById, reason || null]
  );

  return rowToDeletionRequest(res.rows[0]);
};

export const listPendingDeletionRequests = async (academyId: string): Promise<DeletionRequestWithNames[]> => {
  const res = await pool.query(
    `SELECT dr.*, student.full_name AS student_name, requester.full_name AS requested_by_name
     FROM deletion_requests dr
     JOIN users student ON student.user_id = dr.student_id
     JOIN users requester ON requester.user_id = dr.requested_by_id
     WHERE dr.academy_id = $1
       AND dr.status = 'pending'
     ORDER BY dr.deletion_scheduled_at ASC`,
    [academyId]
  );

  return res.rows.map(rowToDeletionRequestWithNames);
};

export const getStudentDeletionStatus = async (
  academyId: string,
  studentId: string
): Promise<DeletionRequestWithNames | null> => {
  const res = await pool.query(
    `SELECT dr.*, student.full_name AS student_name, requester.full_name AS requested_by_name
     FROM deletion_requests dr
     JOIN users student ON student.user_id = dr.student_id
     JOIN users requester ON requester.user_id = dr.requested_by_id
     WHERE dr.academy_id = $1
       AND dr.student_id = $2
     ORDER BY dr.requested_at DESC
     LIMIT 1`,
    [academyId, studentId]
  );

  if (res.rows.length === 0) {
    return null;
  }

  return rowToDeletionRequestWithNames(res.rows[0]);
};

export const cancelDeletionRequest = async (
  academyId: string,
  deletionRequestId: string
): Promise<DeletionRequest | null> => {
  const res = await pool.query(
    `DELETE FROM deletion_requests
     WHERE deletion_request_id = $1
       AND academy_id = $2
       AND status = 'pending'
       AND deletion_scheduled_at > NOW()
     RETURNING *`,
    [deletionRequestId, academyId]
  );

  if (res.rows.length === 0) {
    return null;
  }

  return rowToDeletionRequest(res.rows[0]);
};

export const isGuardianOfStudent = async (
  academyId: string,
  guardianId: string,
  studentId: string
): Promise<boolean> => {
  const res = await pool.query(
    `SELECT 1
     FROM student_guardians
     WHERE academy_id = $1
       AND guardian_id = $2
       AND student_id = $3
     LIMIT 1`,
    [academyId, guardianId, studentId]
  );
  return res.rows.length > 0;
};

export const listGuardianStudents = async (
  academyId: string,
  guardianId: string
): Promise<LinkedStudent[]> => {
  const res = await pool.query(
    `SELECT u.user_id AS student_id,
            u.full_name AS student_name,
            hr.updated_at AS health_screening_updated_at,
            (hr.health_record_id IS NOT NULL) AS has_health_screening
     FROM student_guardians sg
     JOIN users u ON u.user_id = sg.student_id
     LEFT JOIN LATERAL (
       SELECT health_record_id, updated_at
       FROM health_records hr
       WHERE hr.user_id = u.user_id
         AND hr.academy_id = sg.academy_id
       ORDER BY hr.updated_at DESC
       LIMIT 1
     ) hr ON true
     WHERE sg.academy_id = $1
       AND sg.guardian_id = $2
       AND u.role = 'Aluno'
       AND u.deleted_at IS NULL
     ORDER BY u.full_name ASC`,
    [academyId, guardianId]
  );

  return res.rows.map((row) => ({
    studentId: row.student_id,
    studentName: row.student_name,
    hasHealthScreening: row.has_health_screening === true,
    healthScreeningUpdatedAt: row.health_screening_updated_at || null,
  }));
};

export const executeDeletionRequest = async (
  deletionRequestId: string,
  processedById: string
): Promise<DeletionRequest | null> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const reqRes = await client.query(
      `SELECT *
       FROM deletion_requests
       WHERE deletion_request_id = $1
         AND status = 'pending'
       FOR UPDATE`,
      [deletionRequestId]
    );

    if (reqRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const req = reqRes.rows[0];
    const academyId = req.academy_id;
    const studentId = req.student_id;

    await client.query(
      `UPDATE users
       SET full_name = 'Perfil deletado',
           email = CONCAT('deleted+', user_id::text, '@deleted.local'),
           document_id = NULL,
           birth_date = NULL,
           phone = NULL,
           address_street = NULL,
           address_number = NULL,
           address_complement = NULL,
           address_neighborhood = NULL,
           address_postal_code = NULL,
           address_city = NULL,
           address_state = NULL,
           is_active = false,
           deleted_at = COALESCE(deleted_at, NOW()),
           updated_at = NOW()
       WHERE user_id = $1
         AND academy_id = $2`,
      [studentId, academyId]
    );

    await client.query(
      `UPDATE session_comments
       SET content = '[anonimizado LGPD]',
           sentiment = NULL,
           deleted_at = COALESCE(deleted_at, NOW()),
           updated_at = NOW()
       WHERE student_id = $1
         AND academy_id = $2`,
      [studentId, academyId]
    );

    await client.query(
      `DELETE FROM health_records
       WHERE user_id = $1
         AND academy_id = $2`,
      [studentId, academyId]
    );

    await client.query(
      `DELETE FROM consents
       WHERE user_id = $1
         AND academy_id = $2`,
      [studentId, academyId]
    );

    await client.query(
      `DELETE FROM student_guardians
       WHERE academy_id = $1
         AND student_id = $2`,
      [academyId, studentId]
    );

    const doneRes = await client.query(
      `UPDATE deletion_requests
       SET status = 'processed',
           processed_at = NOW(),
           processed_by_id = $2
       WHERE deletion_request_id = $1
       RETURNING *`,
      [deletionRequestId, processedById]
    );

    await client.query('COMMIT');

    return rowToDeletionRequest(doneRes.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const processDueDeletionRequests = async (
  academyId: string,
  processedById: string
): Promise<DeletionRequest[]> => {
  const dueRes = await pool.query(
    `SELECT deletion_request_id
     FROM deletion_requests
     WHERE academy_id = $1
       AND status = 'pending'
       AND deletion_scheduled_at <= NOW()
     ORDER BY deletion_scheduled_at ASC
     LIMIT 100`,
    [academyId]
  );

  const processed: DeletionRequest[] = [];
  for (const row of dueRes.rows) {
    const item = await executeDeletionRequest(row.deletion_request_id, processedById);
    if (item) {
      processed.push(item);
    }
  }

  return processed;
};
