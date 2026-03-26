import { pool } from './db';

type SchemaCheckResult = {
  applied: boolean;
  details: string;
};

const ensureTurmasScheduleJsonColumn = async (): Promise<SchemaCheckResult> => {
  const checkRes = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'turmas'
       AND column_name = 'schedule_json'
     LIMIT 1`
  );

  if (checkRes.rows.length > 0) {
    return {
      applied: false,
      details: 'Column public.turmas.schedule_json already present',
    };
  }

  await pool.query('ALTER TABLE turmas ADD COLUMN IF NOT EXISTS schedule_json JSONB');

  return {
    applied: true,
    details: 'Column public.turmas.schedule_json created',
  };
};

export const runStartupSchemaChecks = async (): Promise<void> => {
  const result = await ensureTurmasScheduleJsonColumn();

  if (result.applied) {
    console.warn(`⚠️ Startup schema patch applied: ${result.details}`);
    console.warn('📌 Recommended: apply migration file backend/src/database/migrations/V6_1__training_turmas_schedule_json.sql');
    return;
  }

  console.log(`✅ Startup schema check: ${result.details}`);
};
