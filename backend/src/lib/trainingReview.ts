import { pool } from './db';
import { getTrainingAttendance } from './trainingAttendance';
import { getSessionTechniques } from './trainingTechniques';
import { getSessionNotes } from './trainingNotes';

const parseTimeToken = (value: string): number | null => {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return (hours * 60) + minutes;
};

const normalizeTime = (value: string): string | null => {
  const minutes = parseTimeToken(value);
  if (minutes === null) {
    return null;
  }

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const getDurationFromSchedule = (scheduleJson: unknown, sessionTime: string): number | null => {
  if (!scheduleJson) {
    return null;
  }

  const scheduleItems = Array.isArray(scheduleJson) ? scheduleJson : [scheduleJson];
  const sessionStart = normalizeTime(sessionTime);

  let fallbackDuration: number | null = null;

  for (const item of scheduleItems) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const obj = item as Record<string, unknown>;
    const directStart = String(obj['startTime'] || obj['start_time'] || obj['start'] || '').trim();
    const directEnd = String(obj['endTime'] || obj['end_time'] || obj['finish'] || '').trim();
    const legacyTime = String(obj['time'] || obj['horario'] || '').trim();
    const [legacyStart, legacyEnd] = legacyTime.includes('-') ? legacyTime.split('-', 2) : ['', ''];

    const start = normalizeTime(directStart || legacyStart);
    const end = normalizeTime(directEnd || legacyEnd);
    if (!start || !end) {
      continue;
    }

    const startMinutes = parseTimeToken(start);
    const endMinutes = parseTimeToken(end);
    if (startMinutes === null || endMinutes === null) {
      continue;
    }

    const delta = endMinutes - startMinutes;
    if (delta <= 0) {
      continue;
    }

    if (fallbackDuration === null) {
      fallbackDuration = delta;
    }

    if (sessionStart && start === sessionStart) {
      return delta;
    }
  }

  return fallbackDuration;
};

export interface TrainingReviewSummaryResponse {
  session: {
    sessionId: string;
    turmaId: string;
    turmaName: string;
    sessionDate: string;
    sessionTime: string;
    durationMinutes: number;
  };
  attendance: {
    total: number;
    present: number;
    absentNames: string[];
  };
  techniques: {
    count: number;
    names: string[];
  };
  notes: {
    general: string;
  };
}

const getSessionScope = async (
  academyId: string,
  professorId: string,
  sessionId: string
): Promise<{
  sessionId: string;
  turmaId: string;
  turmaName: string;
  sessionDate: string;
  sessionTime: string;
  durationMinutes: number;
}> => {
  const res = await pool.query(
    `SELECT ts.session_id,
            ts.turma_id,
            t.name AS turma_name,
            ts.session_date,
            ts.session_time,
            ts.duration_minutes,
            t.schedule_json
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
    throw new Error('Sessão não encontrada para o professor atual');
  }

  const sessionTime = String(res.rows[0].session_time);
  const durationFromSchedule = getDurationFromSchedule(res.rows[0].schedule_json, sessionTime);
  const storedDuration = Number(res.rows[0].duration_minutes);

  return {
    sessionId: res.rows[0].session_id as string,
    turmaId: res.rows[0].turma_id as string,
    turmaName: res.rows[0].turma_name as string,
    sessionDate: new Date(res.rows[0].session_date as string).toISOString().slice(0, 10),
    sessionTime,
    durationMinutes: durationFromSchedule ?? storedDuration,
  };
};

export const getTrainingReviewSummary = async (
  academyId: string,
  professorId: string,
  sessionId: string
): Promise<TrainingReviewSummaryResponse> => {
  const session = await getSessionScope(academyId, professorId, sessionId);

  const attendance = await getTrainingAttendance(academyId, professorId, sessionId);
  if (!attendance) {
    throw new Error('Sessão não encontrada para o professor atual');
  }

  const techniques = await getSessionTechniques(academyId, professorId, sessionId);
  const notes = await getSessionNotes(academyId, professorId, sessionId);

  const absentNames = attendance.students
    .filter((student) => student.status !== 'present')
    .map((student) => student.studentName);

  return {
    session,
    attendance: {
      total: attendance.totals.total,
      present: attendance.totals.present,
      absentNames,
    },
    techniques: {
      count: techniques.summary.count,
      names: techniques.summary.names,
    },
    notes: {
      general: notes.generalNotes || '',
    },
  };
};

export const confirmTrainingSession = async (input: {
  academyId: string;
  professorId: string;
  sessionId: string;
}): Promise<{ confirmedAt: string; studentsNotified: boolean }> => {
  const summary = await getTrainingReviewSummary(input.academyId, input.professorId, input.sessionId);

  if (summary.attendance.total < 1) {
    throw new Error('Não é possível confirmar sem ao menos 1 aluno vinculado');
  }

  if (summary.techniques.count < 1) {
    throw new Error('Não é possível confirmar sem ao menos 1 técnica selecionada');
  }

  const now = new Date();

  const updateRes = await pool.query(
    `UPDATE training_sessions
     SET offline_synced_at = COALESCE(offline_synced_at, $1),
         server_received_at = COALESCE(server_received_at, $1),
         last_write_wins_timestamp = $1,
         updated_at = $1
     WHERE session_id = $2
       AND academy_id = $3
       AND professor_id = $4
       AND deleted_at IS NULL`,
    [now, input.sessionId, input.academyId, input.professorId]
  );

  if (!updateRes.rowCount || updateRes.rowCount === 0) {
    throw new Error('Sessão não encontrada para o professor atual');
  }

  return {
    confirmedAt: now.toISOString(),
    studentsNotified: false,
  };
};
