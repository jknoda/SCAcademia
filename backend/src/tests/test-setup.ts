import { pool } from '../lib/db';

afterAll(async () => {
  await pool.end();
});
