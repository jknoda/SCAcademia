import { pool } from './db';

type ScheduleEntry = {
  dayName: string;
  dayIndex: number;
  timeText: string;
  startTimeText?: string;
  endTimeText?: string;
  hour: number;
  minute: number;
  turn?: string;
};

type TurmaWithNext = {
  turma: ProfessorTurmaEntry;
  nextAt: Date;
  schedule: { label: string; scheduledAtText: string };
};

export interface ProfessorTurmaEntry {
  turmaId: string;
  turmaName: string;
  description?: string;
  scheduleJson?: any;
  studentIds?: string[];
}

export interface CreateProfessorTurmaInput {
  academyId: string;
  professorId: string;
  turmaName: string;
  description?: string;
  scheduleJson?: any;
  studentIds?: string[];
}

export interface UpdateProfessorTurmaInput {
  academyId: string;
  professorId: string;
  turmaId: string;
  turmaName?: string;
  description?: string;
  scheduleJson?: any;
  isActive?: boolean;
  studentIds?: string[];
}

export interface TrainingEntryPointContext {
  greeting: string;
  isOfflineCapable: boolean;
  currentOrNextClass: {
    turmaId: string;
    turmaName: string;
    description?: string;
    label: string;
    scheduledAtText: string;
  } | null;
}

const toTurmaEntry = (row: any): ProfessorTurmaEntry => ({
  turmaId: row.turma_id,
  turmaName: row.name,
  description: row.description || undefined,
  scheduleJson: row.schedule_json || undefined,
  studentIds: Array.isArray(row.student_ids)
    ? row.student_ids.filter((value: unknown): value is string => typeof value === 'string')
    : undefined,
});

const normalizeStudentIds = (studentIds: string[] | undefined): string[] =>
  [...new Set((studentIds || []).filter((value) => typeof value === 'string' && value.trim().length > 0))];

const assertActiveAlunoIds = async (
  db: any,
  academyId: string,
  studentIds: string[]
): Promise<string[]> => {
  if (studentIds.length === 0) {
    return [];
  }

  const validStudentsRes = await db.query(
    `SELECT u.user_id
     FROM users u
     WHERE u.academy_id = $1
       AND u.role = 'Aluno'
       AND u.is_active = true
       AND u.deleted_at IS NULL
       AND u.user_id = ANY($2::uuid[])`,
    [academyId, studentIds]
  );

  const validStudentIds = validStudentsRes.rows.map((row: any) => row.user_id as string);
  if (validStudentIds.length !== studentIds.length) {
    throw new Error('studentIds inválidos para vínculo na turma');
  }

  return validStudentIds;
};

const upsertTurmaStudents = async (
  db: any,
  turmaId: string,
  academyId: string,
  studentIds: string[]
): Promise<void> => {
  if (studentIds.length === 0) {
    return;
  }

  await db.query(
    `INSERT INTO turma_students (
       enrollment_id,
       turma_id,
       student_id,
       academy_id,
       status,
       enrolled_at,
       dropped_at
     )
     SELECT
       gen_random_uuid(),
       $1,
       s.student_id,
       $2,
       'active',
       NOW(),
       NULL
     FROM UNNEST($3::uuid[]) AS s(student_id)
     ON CONFLICT (turma_id, student_id)
     DO UPDATE SET
       status = 'active',
       dropped_at = NULL`,
    [turmaId, academyId, studentIds]
  );
};

const syncTurmaStudents = async (
  db: any,
  turmaId: string,
  academyId: string,
  studentIds: string[]
): Promise<void> => {
  await db.query(
    `UPDATE turma_students
     SET status = 'dropped',
         dropped_at = NOW()
     WHERE turma_id = $1
       AND academy_id = $2
       AND status = 'active'
       AND ($3::uuid[] IS NULL OR student_id <> ALL($3::uuid[]))`,
    [turmaId, academyId, studentIds.length > 0 ? studentIds : null]
  );

  await upsertTurmaStudents(db, turmaId, academyId, studentIds);
};

const getTurmaWithStudents = async (
  db: any,
  academyId: string,
  professorId: string,
  turmaId: string
): Promise<ProfessorTurmaEntry | null> => {
  const res = await db.query(
    `SELECT
       t.turma_id,
       t.name,
       t.description,
       t.schedule_json,
       t.is_active,
       COALESCE(
         ARRAY_AGG(ts.student_id ORDER BY u.full_name)
           FILTER (
             WHERE ts.status = 'active'
               AND u.deleted_at IS NULL
               AND u.role = 'Aluno'
               AND u.is_active = true
           ),
         '{}'::uuid[]
       ) AS student_ids
     FROM turmas t
     LEFT JOIN turma_students ts
       ON ts.turma_id = t.turma_id
      AND ts.academy_id = t.academy_id
     LEFT JOIN users u
       ON u.user_id = ts.student_id
      AND u.academy_id = ts.academy_id
     WHERE t.academy_id = $1
       AND t.professor_id = $2
       AND t.turma_id = $3
       AND t.deleted_at IS NULL
     GROUP BY t.turma_id, t.name, t.description, t.schedule_json, t.is_active
     LIMIT 1`,
    [academyId, professorId, turmaId]
  );

  return res.rows.length ? toTurmaEntry(res.rows[0]) : null;
};

const buildScheduleDisplay = (scheduleJson: any): { label: string; scheduledAtText: string } => {
  const fallback = {
    label: 'Próxima aula da sua turma',
    scheduledAtText: 'Horário da turma disponível no planejamento',
  };

  if (!scheduleJson) {
    return fallback;
  }

  // Supports common formats: array [{day,time}] or object {day,time,turno}
  const first = Array.isArray(scheduleJson) ? scheduleJson[0] : scheduleJson;
  if (!first || typeof first !== 'object') {
    return fallback;
  }

  const day = String(first.day || first.weekday || first.dia || '').trim();
  const startTime = String(first.startTime || first.start_time || first.start || '').trim();
  const endTime = String(first.endTime || first.end_time || first.finish || '').trim();
  const legacyTime = String(first.time || first.horario || '').trim();
  const time = legacyTime || (startTime && endTime ? `${startTime}-${endTime}` : startTime);
  const turn = String(first.turn || first.shift || first.turno || '').trim();

  const dayPart = day || 'Dia programado';
  const timePart = time || 'Horário programado';
  const turnPart = turn ? ` (${turn})` : '';

  return {
    label: `${dayPart}${turnPart}`,
    scheduledAtText: `${dayPart} • ${timePart}`,
  };
};

const weekDayByName: Record<string, number> = {
  domingo: 0,
  sunday: 0,
  segunda: 1,
  'segunda-feira': 1,
  monday: 1,
  terca: 2,
  'terca-feira': 2,
  'terça': 2,
  'terça-feira': 2,
  tuesday: 2,
  quarta: 3,
  'quarta-feira': 3,
  wednesday: 3,
  quinta: 4,
  'quinta-feira': 4,
  thursday: 4,
  sexta: 5,
  'sexta-feira': 5,
  friday: 5,
  sabado: 6,
  sábado: 6,
  saturday: 6,
};

const normalizeDayToken = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const parseTimeToken = (value: string): { hour: number; minute: number } | null => {
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
};

const extractScheduleEntries = (scheduleJson: any): ScheduleEntry[] => {
  if (!scheduleJson) {
    return [];
  }

  const rawItems = Array.isArray(scheduleJson) ? scheduleJson : [scheduleJson];
  const entries: ScheduleEntry[] = [];

  for (const item of rawItems) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const dayNameRaw = String(item.day || item.weekday || item.dia || '').trim();
    const dayNameNormalized = normalizeDayToken(dayNameRaw);
    const dayIndex = weekDayByName[dayNameNormalized];

    const startTimeRaw = String(item.startTime || item.start_time || item.start || '').trim();
    const endTimeRaw = String(item.endTime || item.end_time || item.finish || '').trim();
    const legacyTimeRaw = String(item.time || item.horario || '').trim();
    const canonicalTime = legacyTimeRaw || (startTimeRaw && endTimeRaw ? `${startTimeRaw}-${endTimeRaw}` : startTimeRaw);
    const parsedTime = parseTimeToken(startTimeRaw || legacyTimeRaw);
    if (dayIndex === undefined || !parsedTime) {
      continue;
    }

    const turn = String(item.turn || item.shift || item.turno || '').trim() || undefined;

    entries.push({
      dayName: dayNameRaw || 'Dia programado',
      dayIndex,
      timeText: canonicalTime || `${String(parsedTime.hour).padStart(2, '0')}:${String(parsedTime.minute).padStart(2, '0')}`,
      startTimeText: startTimeRaw || undefined,
      endTimeText: endTimeRaw || undefined,
      hour: parsedTime.hour,
      minute: parsedTime.minute,
      turn,
    });
  }

  return entries;
};

const resolveNextOccurrence = (entry: ScheduleEntry, now: Date): Date => {
  const nextAt = new Date(now);
  const deltaDays = (entry.dayIndex - now.getDay() + 7) % 7;
  nextAt.setDate(now.getDate() + deltaDays);
  nextAt.setHours(entry.hour, entry.minute, 0, 0);

  if (nextAt <= now) {
    nextAt.setDate(nextAt.getDate() + 7);
  }

  return nextAt;
};

const formatScheduleDisplayFromEntry = (entry: ScheduleEntry): { label: string; scheduledAtText: string } => {
  const turnPart = entry.turn ? ` (${entry.turn})` : '';
  return {
    label: `${entry.dayName}${turnPart}`,
    scheduledAtText: `${entry.dayName} • ${entry.timeText}`,
  };
};

const pickCurrentOrNextTurma = (turmas: ProfessorTurmaEntry[], now: Date): TurmaWithNext | null => {
  let best: TurmaWithNext | null = null;

  for (const turma of turmas) {
    const entries = extractScheduleEntries(turma.scheduleJson);
    for (const entry of entries) {
      const nextAt = resolveNextOccurrence(entry, now);
      if (!best || nextAt < best.nextAt) {
        best = {
          turma,
          nextAt,
          schedule: formatScheduleDisplayFromEntry(entry),
        };
      }
    }
  }

  return best;
};

export const getProfessorActiveTurmas = async (
  academyId: string,
  professorId: string
): Promise<ProfessorTurmaEntry[]> => {
  const res = await pool.query(
    `SELECT turma_id, name, description, schedule_json
     FROM turmas
     WHERE academy_id = $1
       AND professor_id = $2
       AND is_active = true
       AND deleted_at IS NULL
     ORDER BY updated_at DESC, created_at DESC`,
    [academyId, professorId]
  );

  return res.rows.map(toTurmaEntry);
};

export const getProfessorPrimaryTurma = async (
  academyId: string,
  professorId: string
): Promise<ProfessorTurmaEntry | null> => {
  const res = await pool.query(
    `SELECT turma_id, name, description, schedule_json
     FROM turmas
     WHERE academy_id = $1
       AND professor_id = $2
       AND is_active = true
       AND deleted_at IS NULL
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 1`,
    [academyId, professorId]
  );

  return res.rows.length ? toTurmaEntry(res.rows[0]) : null;
};

export const getProfessorTurmaById = async (
  academyId: string,
  professorId: string,
  turmaId: string
): Promise<ProfessorTurmaEntry | null> => {
  const res = await pool.query(
    `SELECT turma_id, name, description, schedule_json
     FROM turmas
     WHERE academy_id = $1
       AND professor_id = $2
       AND turma_id = $3
       AND is_active = true
       AND deleted_at IS NULL
     LIMIT 1`,
    [academyId, professorId, turmaId]
  );

  return res.rows.length ? toTurmaEntry(res.rows[0]) : null;
};

export const getProfessorTrainingEntryPointContext = async (
  academyId: string,
  professorId: string,
  professorName: string
): Promise<TrainingEntryPointContext> => {
  const turmas = await getProfessorActiveTurmas(academyId, professorId);
  const firstName = professorName.trim().split(' ')[0] || 'Professor';

  if (!turmas.length) {
    return {
      greeting: `Olá, Prof. ${firstName} 👋`,
      isOfflineCapable: true,
      currentOrNextClass: null,
    };
  }

  const now = new Date();
  const preferred = pickCurrentOrNextTurma(turmas, now);
  const selectedTurma = preferred?.turma || turmas[0];
  const schedule = preferred?.schedule || buildScheduleDisplay(selectedTurma.scheduleJson);

  return {
    greeting: `Olá, Prof. ${firstName} 👋`,
    isOfflineCapable: true,
    currentOrNextClass: {
      turmaId: selectedTurma.turmaId,
      turmaName: selectedTurma.turmaName,
      description: selectedTurma.description,
      label: schedule.label,
      scheduledAtText: schedule.scheduledAtText,
    },
  };
};

export const createProfessorTurma = async (
  input: CreateProfessorTurmaInput
): Promise<ProfessorTurmaEntry> => {
  const name = input.turmaName.trim();
  if (!name) {
    throw new Error('turmaName é obrigatório');
  }

  const description = typeof input.description === 'string' && input.description.trim()
    ? input.description.trim()
    : null;
  const scheduleJson = input.scheduleJson ?? null;
  const scheduleJsonDb = scheduleJson === null ? null : JSON.stringify(scheduleJson);
  const selectedStudentIds = normalizeStudentIds(input.studentIds);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const res = await client.query(
      `INSERT INTO turmas (
         academy_id,
         professor_id,
         name,
         description,
         schedule_json,
         is_active,
         created_at,
         updated_at
       ) VALUES (
         $1,
         $2,
         $3,
         $4,
         $5::jsonb,
         true,
         NOW(),
         NOW()
       )
       RETURNING turma_id, name, description, schedule_json`,
      [input.academyId, input.professorId, name, description, scheduleJsonDb]
    );

    const turmaId = res.rows[0].turma_id as string;
    const validStudentIds = await assertActiveAlunoIds(client, input.academyId, selectedStudentIds);
    await upsertTurmaStudents(client, turmaId, input.academyId, validStudentIds);

    await client.query('COMMIT');

    const created = await getTurmaWithStudents(client, input.academyId, input.professorId, turmaId);
    if (!created) {
      throw new Error('Falha ao carregar turma recém-criada');
    }

    return created;
  } catch (error: any) {
    await client.query('ROLLBACK');

    // Compatibility fallback for legacy schemas that still do not have schedule_json.
    if (error?.code === '42703') {
      const fallbackRes = await client.query(
        `INSERT INTO turmas (
           academy_id,
           professor_id,
           name,
           description,
           is_active,
           created_at,
           updated_at
         ) VALUES (
           $1,
           $2,
           $3,
           $4,
           true,
           NOW(),
           NOW()
         )
         RETURNING turma_id, name, description`,
        [input.academyId, input.professorId, name, description]
      );

      const turmaId = fallbackRes.rows[0].turma_id as string;
      const validStudentIds = await assertActiveAlunoIds(client, input.academyId, selectedStudentIds);
      await upsertTurmaStudents(client, turmaId, input.academyId, validStudentIds);

      return {
        turmaId: fallbackRes.rows[0].turma_id,
        turmaName: fallbackRes.rows[0].name,
        description: fallbackRes.rows[0].description || undefined,
        scheduleJson: scheduleJson || undefined,
        studentIds: validStudentIds,
      };
    }

    throw error;
  } finally {
    client.release();
  }
};

export const listProfessorTurmas = async (
  academyId: string,
  professorId: string
): Promise<Array<ProfessorTurmaEntry & { isActive: boolean }>> => {
  const res = await pool.query(
    `SELECT
       t.turma_id,
       t.name,
       t.description,
       t.schedule_json,
       t.is_active,
       COALESCE(
         ARRAY_AGG(ts.student_id ORDER BY u.full_name)
           FILTER (
             WHERE ts.status = 'active'
               AND u.deleted_at IS NULL
               AND u.role = 'Aluno'
               AND u.is_active = true
           ),
         '{}'::uuid[]
       ) AS student_ids
     FROM turmas t
     LEFT JOIN turma_students ts
       ON ts.turma_id = t.turma_id
      AND ts.academy_id = t.academy_id
     LEFT JOIN users u
       ON u.user_id = ts.student_id
      AND u.academy_id = ts.academy_id
     WHERE t.academy_id = $1
       AND t.professor_id = $2
       AND t.deleted_at IS NULL
     GROUP BY t.turma_id, t.name, t.description, t.schedule_json, t.is_active, t.updated_at, t.created_at
     ORDER BY t.is_active DESC, t.updated_at DESC, t.created_at DESC`,
    [academyId, professorId]
  );

  return res.rows.map((row) => ({
    ...toTurmaEntry(row),
    isActive: row.is_active === true,
  }));
};

export const updateProfessorTurma = async (
  input: UpdateProfessorTurmaInput
): Promise<(ProfessorTurmaEntry & { isActive: boolean }) | null> => {
  const nextName = typeof input.turmaName === 'string' ? input.turmaName.trim() : undefined;
  if (nextName !== undefined && !nextName) {
    throw new Error('turmaName inválido');
  }

  const nextDescription = typeof input.description === 'string'
    ? (input.description.trim() || null)
    : undefined;

  const nextScheduleJson = input.scheduleJson === undefined ? undefined : input.scheduleJson;
  const nextScheduleJsonDb = nextScheduleJson === undefined
    ? undefined
    : JSON.stringify(nextScheduleJson);
  const nextIsActive = typeof input.isActive === 'boolean' ? input.isActive : undefined;
  const normalizedStudentIds = input.studentIds === undefined
    ? undefined
    : normalizeStudentIds(input.studentIds);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const res = await client.query(
      `UPDATE turmas
       SET name = COALESCE($4, name),
           description = COALESCE($5, description),
           schedule_json = COALESCE($6::jsonb, schedule_json),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE academy_id = $1
         AND professor_id = $2
         AND turma_id = $3
         AND deleted_at IS NULL
       RETURNING turma_id, name, description, schedule_json, is_active`,
      [
        input.academyId,
        input.professorId,
        input.turmaId,
        nextName,
        nextDescription,
        nextScheduleJsonDb,
        nextIsActive,
      ]
    );

    if (!res.rows.length) {
      await client.query('ROLLBACK');
      return null;
    }

    if (normalizedStudentIds !== undefined) {
      const validStudentIds = await assertActiveAlunoIds(client, input.academyId, normalizedStudentIds);
      await syncTurmaStudents(client, input.turmaId, input.academyId, validStudentIds);
    }

    const updated = await getTurmaWithStudents(client, input.academyId, input.professorId, input.turmaId);
    if (!updated) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('COMMIT');

    return {
      ...updated,
      isActive: res.rows[0].is_active === true,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const listEligibleTurmaStudents = async (
  academyId: string,
  nameFilter?: string
): Promise<Array<{ studentId: string; fullName: string }>> => {
  const values: any[] = [academyId];
  let nameClause = '';

  const trimmedName = typeof nameFilter === 'string' ? nameFilter.trim() : '';
  if (trimmedName) {
    values.push(`%${trimmedName.toLowerCase()}%`);
    nameClause = ` AND LOWER(u.full_name) LIKE $${values.length}`;
  }

  const res = await pool.query(
    `SELECT u.user_id, u.full_name
     FROM users u
     WHERE u.academy_id = $1
       AND u.role = 'Aluno'
       AND u.is_active = true
       AND u.deleted_at IS NULL
       ${nameClause}
     ORDER BY u.full_name ASC`,
    values
  );

  return res.rows.map((row) => ({
    studentId: row.user_id as string,
    fullName: row.full_name as string,
  }));
};

const toDateOnly = (value: Date): string => value.toISOString().slice(0, 10);
const toTimeOnly = (value: Date): string => value.toTimeString().slice(0, 8);

export const findOrCreateTrainingDraft = async (input: {
  academyId: string;
  professorId: string;
  turmaId: string;
  sessionDate?: string;  // YYYY-MM-DD; defaults to today
  sessionTime?: string;  // HH:MM:SS; defaults to current time
}): Promise<{ sessionId: string; created: boolean }> => {
  if (!input.academyId?.trim() || !input.professorId?.trim() || !input.turmaId?.trim()) {
    throw new Error('academyId, professorId e turmaId são obrigatórios');
  }

  const now = new Date();
  const sessionDate = input.sessionDate || toDateOnly(now);
  const sessionTime = input.sessionTime || toTimeOnly(now);

  const lockKey = `${input.academyId}:${input.professorId}:${input.turmaId}:${sessionDate}`;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [lockKey]);

    const existingRes = await client.query(
      `SELECT session_id
       FROM training_sessions
       WHERE academy_id = $1
         AND professor_id = $2
         AND turma_id = $3
         AND session_date = $4
         AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [input.academyId, input.professorId, input.turmaId, sessionDate]
    );

    if (existingRes.rows.length > 0) {
      await client.query('COMMIT');
      return {
        sessionId: existingRes.rows[0].session_id,
        created: false,
      };
    }

    const createdRes = await client.query(
      `INSERT INTO training_sessions (
         turma_id,
         professor_id,
         academy_id,
         session_date,
         session_time,
         duration_minutes,
         notes,
         client_created_at,
         server_received_at,
         last_write_wins_timestamp,
         created_at,
         updated_at
       ) VALUES (
         $1,
         $2,
         $3,
         $4,
         $5,
         $6,
         NULL,
         $7,
         NOW(),
         NOW(),
         NOW(),
         NOW()
       )
       RETURNING session_id`,
      [
        input.turmaId,
        input.professorId,
        input.academyId,
        sessionDate,
        sessionTime,
        90,
        now,
      ]
    );

    await client.query('COMMIT');

    return {
      sessionId: createdRes.rows[0].session_id,
      created: true,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
