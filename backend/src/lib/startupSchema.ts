import { DB_SCHEMA, pool } from './db';

type SchemaCheckResult = {
  applied: boolean;
  details: string;
};

const ensureTurmasScheduleJsonColumn = async (): Promise<SchemaCheckResult> => {
  const checkRes = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = $1
       AND table_name = 'turmas'
       AND column_name = 'schedule_json'
     LIMIT 1`,
    [DB_SCHEMA]
  );

  if (checkRes.rows.length > 0) {
    return {
      applied: false,
      details: `Column ${DB_SCHEMA}.turmas.schedule_json already present`,
    };
  }

  await pool.query('ALTER TABLE turmas ADD COLUMN IF NOT EXISTS schedule_json JSONB');

  return {
    applied: true,
    details: `Column ${DB_SCHEMA}.turmas.schedule_json created`,
  };
};

const ensureAcademyLogoColumn = async (): Promise<SchemaCheckResult> => {
  const checkRes = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = $1
       AND table_name = 'academies'
       AND column_name = 'logo_url'
     LIMIT 1`,
    [DB_SCHEMA]
  );

  if (checkRes.rows.length > 0) {
    return {
      applied: false,
      details: `Column ${DB_SCHEMA}.academies.logo_url already present`,
    };
  }

  await pool.query('ALTER TABLE academies ADD COLUMN IF NOT EXISTS logo_url TEXT');

  return {
    applied: true,
    details: `Column ${DB_SCHEMA}.academies.logo_url created`,
  };
};

const ensureUserPhotoColumn = async (): Promise<SchemaCheckResult> => {
  const checkRes = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = $1
       AND table_name = 'users'
       AND column_name = 'photo_url'
     LIMIT 1`,
    [DB_SCHEMA]
  );

  if (checkRes.rows.length > 0) {
    return {
      applied: false,
      details: `Column ${DB_SCHEMA}.users.photo_url already present`,
    };
  }

  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT');

  return {
    applied: true,
    details: `Column ${DB_SCHEMA}.users.photo_url created`,
  };
};

const ensureBackupJobsTable = async (): Promise<SchemaCheckResult> => {
  const checkRes = await pool.query(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = $1
       AND table_name = 'backup_jobs'
     LIMIT 1`,
    [DB_SCHEMA]
  );

  if (checkRes.rows.length > 0) {
    return {
      applied: false,
      details: `Table ${DB_SCHEMA}.backup_jobs already present`,
    };
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS backup_jobs (
      backup_job_id UUID PRIMARY KEY,
      academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL,
      file_name TEXT,
      file_path TEXT,
      file_size_bytes BIGINT,
      include_history BOOLEAN NOT NULL DEFAULT false,
      is_encrypted BOOLEAN NOT NULL DEFAULT false,
      initiated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      error_message TEXT,
      download_expires_at TIMESTAMPTZ,
      retention_days INT NOT NULL DEFAULT 30,
      archived_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(
    'CREATE INDEX IF NOT EXISTS idx_backup_jobs_academy_created_at ON backup_jobs(academy_id, created_at DESC)'
  );

  return {
    applied: true,
    details: `Table ${DB_SCHEMA}.backup_jobs created`,
  };
};

export const runStartupSchemaChecks = async (): Promise<void> => {
  const results = await Promise.all([
    ensureTurmasScheduleJsonColumn(),
    ensureAcademyLogoColumn(),
    ensureUserPhotoColumn(),
    ensureBackupJobsTable(),
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
