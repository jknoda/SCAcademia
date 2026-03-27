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

const ensureAcademyLogoColumn = async (): Promise<SchemaCheckResult> => {
  const checkRes = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'academies'
       AND column_name = 'logo_url'
     LIMIT 1`
  );

  if (checkRes.rows.length > 0) {
    return {
      applied: false,
      details: 'Column public.academies.logo_url already present',
    };
  }

  await pool.query('ALTER TABLE academies ADD COLUMN IF NOT EXISTS logo_url TEXT');

  return {
    applied: true,
    details: 'Column public.academies.logo_url created',
  };
};

const ensureUserPhotoColumn = async (): Promise<SchemaCheckResult> => {
  const checkRes = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'users'
       AND column_name = 'photo_url'
     LIMIT 1`
  );

  if (checkRes.rows.length > 0) {
    return {
      applied: false,
      details: 'Column public.users.photo_url already present',
    };
  }

  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT');

  return {
    applied: true,
    details: 'Column public.users.photo_url created',
  };
};

export const runStartupSchemaChecks = async (): Promise<void> => {
  const results = await Promise.all([
    ensureTurmasScheduleJsonColumn(),
    ensureAcademyLogoColumn(),
    ensureUserPhotoColumn(),
  ]);

  const applied = results.filter((result) => result.applied);

  if (applied.length > 0) {
    for (const result of applied) {
      console.warn(`⚠️ Startup schema patch applied: ${result.details}`);
    }
    console.warn('📌 Recommended: apply migration files in backend/src/database/migrations');
    return;
  }

  for (const result of results) {
    console.log(`✅ Startup schema check: ${result.details}`);
  }
};
