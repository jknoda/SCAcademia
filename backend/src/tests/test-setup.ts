import { pool } from '../lib/db';

beforeAll(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sync_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      professor_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      academy_id UUID NOT NULL REFERENCES academies(academy_id) ON DELETE CASCADE,
      batch_id UUID NOT NULL,
      sync_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      total_records INT NOT NULL,
      synced_count INT NOT NULL,
      failed_count INT NOT NULL,
      conflict_count INT NOT NULL,
      duration_ms INT,
      error_summary TEXT,
      client_version VARCHAR(20),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP
    )
  `);

  await pool.query(`ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid()`);
  await pool.query(`ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS batch_id UUID`);
  await pool.query(`ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS professor_id UUID REFERENCES users(user_id) ON DELETE CASCADE`);
  await pool.query(`ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS resource VARCHAR(50)`);
  await pool.query(`ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS payload JSONB`);
  await pool.query(`ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS server_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await pool.query(`ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`);
  await pool.query(`ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS next_retry TIMESTAMP`);
  await pool.query(`ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS resolved_with VARCHAR(20)`);
  await pool.query(`ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS conflict_detected BOOLEAN DEFAULT FALSE`);
  await pool.query(`ALTER TABLE sync_queue ADD COLUMN IF NOT EXISTS server_version JSONB`);

  await pool.query(`
    UPDATE sync_queue
    SET resource = COALESCE(resource, resource_type)
    WHERE resource IS NULL AND resource_type IS NOT NULL
  `);
  await pool.query(`
    UPDATE sync_queue
    SET payload = COALESCE(payload, payload_json)
    WHERE payload IS NULL AND payload_json IS NOT NULL
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sync_queue'
          AND column_name = 'resource_type'
          AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE sync_queue ALTER COLUMN resource_type DROP NOT NULL;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sync_queue'
          AND column_name = 'payload_json'
          AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE sync_queue ALTER COLUMN payload_json DROP NOT NULL;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sync_queue'
          AND column_name = 'resource_id'
          AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE sync_queue ALTER COLUMN resource_id DROP NOT NULL;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sync_queue'
          AND column_name = 'user_id'
          AND is_nullable = 'NO'
      ) THEN
        ALTER TABLE sync_queue ALTER COLUMN user_id DROP NOT NULL;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sync_queue'
          AND column_name = 'client_timestamp'
          AND data_type = 'timestamp without time zone'
      ) THEN
        ALTER TABLE sync_queue
          ALTER COLUMN client_timestamp TYPE BIGINT
          USING (EXTRACT(EPOCH FROM client_timestamp) * 1000)::BIGINT;
      END IF;
    END
    $$;
  `);

  await pool.query(`ALTER TABLE sync_queue DROP CONSTRAINT IF EXISTS valid_status`);
  await pool.query(`ALTER TABLE sync_queue DROP CONSTRAINT IF EXISTS status_valid`);
  await pool.query(`
    ALTER TABLE sync_queue
    ADD CONSTRAINT status_valid
    CHECK (status IN ('pending', 'synced', 'failed', 'retry'))
  `);
});

afterAll(async () => {
  await pool.end();
});
