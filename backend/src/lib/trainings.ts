import { pool } from './db';

type ScheduleEntry = {
  dayName: string;
  dayIndex: number;
  timeText: string;
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
});

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
  const time = String(first.time || first.start || first.horario || '').trim();
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

    const timeRaw = String(item.time || item.start || item.horario || '').trim();
    const parsedTime = parseTimeToken(timeRaw);
    if (dayIndex === undefined || !parsedTime) {
      continue;
    }

    const turn = String(item.turn || item.shift || item.turno || '').trim() || undefined;

    entries.push({
      dayName: dayNameRaw || 'Dia programado',
      dayIndex,
      timeText: timeRaw || `${String(parsedTime.hour).padStart(2, '0')}:${String(parsedTime.minute).padStart(2, '0')}`,
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

const toDateOnly = (value: Date): string => value.toISOString().slice(0, 10);
const toTimeOnly = (value: Date): string => value.toTimeString().slice(0, 8);

export const findOrCreateTrainingDraft = async (input: {
  academyId: string;
  professorId: string;
  turmaId: string;
}): Promise<{ sessionId: string; created: boolean }> => {
  if (!input.academyId?.trim() || !input.professorId?.trim() || !input.turmaId?.trim()) {
    throw new Error('academyId, professorId e turmaId são obrigatórios');
  }

  const now = new Date();
  const sessionDate = toDateOnly(now);

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
        toTimeOnly(now),
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
