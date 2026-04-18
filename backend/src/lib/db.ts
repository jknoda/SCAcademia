import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const rawSchemaName = (process.env.DB_SCHEMA || 'scacademia').trim();

if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(rawSchemaName)) {
  throw new Error(`Invalid DB_SCHEMA value: ${rawSchemaName}`);
}

export const DB_SCHEMA = rawSchemaName;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Jknoda100468!@localhost:5432/scacademia',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  options: `-c search_path=${DB_SCHEMA},public`,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

export const testConnection = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${DB_SCHEMA}`);
    const result = await client.query<{ search_path: string }>('SHOW search_path');
    console.log(`✅ PostgreSQL connected using schema ${DB_SCHEMA} (${result.rows[0]?.search_path ?? 'unknown'})`);
  } finally {
    client.release();
  }
};
