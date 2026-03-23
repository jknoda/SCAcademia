import { createHash, randomUUID } from 'crypto';
import { pool } from './db';

export interface Academy {
  id: string;
  name: string;
  location: string;
  email: string;
  phone: string;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  academyId: string;
  role: string; // 'Admin' | 'Professor' | 'Aluno'
  birthDate?: Date;
  consentStatus: 'pendente' | 'consentido' | 'negado';
  necessitaConsentimentoResponsavel: boolean;
  responsavelEmail?: string;
  createdAt: Date;
}

export interface AuthTokenRecord {
  tokenId: string;
  userId: string;
  academyId: string;
  tokenType: string;
  tokenHash: string;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
}

// Map a DB row (snake_case) to the Academy interface
const rowToAcademy = (row: any): Academy => ({
  id: row.academy_id,
  name: row.name,
  location: row.description || '',
  email: row.contact_email,
  phone: row.contact_phone || '',
  createdAt: row.created_at,
});

// Map a DB row (snake_case) to the User interface
const rowToUser = (row: any): User => ({
  id: row.user_id,
  email: row.email,
  fullName: row.full_name,
  passwordHash: row.password_hash,
  academyId: row.academy_id,
  role: row.role,
  birthDate: row.birth_date ? new Date(row.birth_date) : undefined,
  consentStatus: row.minor_consent_signed ? 'consentido' : 'pendente',
  necessitaConsentimentoResponsavel: row.is_minor || false,
  createdAt: row.created_at,
});

const rowToAuthToken = (row: any): AuthTokenRecord => ({
  tokenId: row.token_id,
  userId: row.user_id,
  academyId: row.academy_id,
  tokenType: row.token_type,
  tokenHash: row.token_hash,
  issuedAt: row.issued_at,
  expiresAt: row.expires_at,
  revokedAt: row.revoked_at || undefined,
});

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

// Academy operations
export const createAcademy = async (
  name: string,
  location: string,
  email: string,
  phone: string
): Promise<Academy> => {
  const id = randomUUID();
  const res = await pool.query(
    `INSERT INTO academies (academy_id, name, description, contact_email, contact_phone, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING *`,
    [id, name, location, email, phone]
  );
  return rowToAcademy(res.rows[0]);
};

export const getAcademyById = async (id: string): Promise<Academy | undefined> => {
  const res = await pool.query(
    'SELECT * FROM academies WHERE academy_id = $1 AND deleted_at IS NULL',
    [id]
  );
  return res.rows.length ? rowToAcademy(res.rows[0]) : undefined;
};

export const academyExists = async (): Promise<boolean> => {
  const res = await pool.query(
    'SELECT 1 FROM academies WHERE deleted_at IS NULL LIMIT 1'
  );
  return res.rows.length > 0;
};

export const getAllAcademies = async (): Promise<Academy[]> => {
  const res = await pool.query(
    'SELECT * FROM academies WHERE deleted_at IS NULL ORDER BY created_at'
  );
  return res.rows.map(rowToAcademy);
};

// User operations
export const createUser = async (
  email: string,
  fullName: string,
  passwordHash: string,
  academyId: string,
  role: string = 'Aluno',
  birthDate?: Date,
  responsavelEmail?: string
): Promise<User> => {
  const id = randomUUID();
  const age = birthDate
    ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : undefined;
  const isMinor = role === 'Aluno' && age !== undefined && age < 18;

  const res = await pool.query(
    `INSERT INTO users (user_id, academy_id, email, password_hash, full_name, role, birth_date,
                        is_minor, minor_consent_signed, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, true, NOW(), NOW())
     RETURNING *`,
    [id, academyId, email, passwordHash, fullName, role, birthDate || null, isMinor]
  );

  const user = rowToUser(res.rows[0]);
  if (isMinor && responsavelEmail) {
    user.responsavelEmail = responsavelEmail;
  }
  return user;
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  const res = await pool.query(
    'SELECT * FROM users WHERE user_id = $1 AND deleted_at IS NULL',
    [id]
  );
  return res.rows.length ? rowToUser(res.rows[0]) : undefined;
};

export const getUserByEmail = async (email: string, academyId: string): Promise<User | undefined> => {
  const res = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND academy_id = $2 AND deleted_at IS NULL',
    [email, academyId]
  );
  return res.rows.length ? rowToUser(res.rows[0]) : undefined;
};

// Search across all academies (used by login when academyId is not known)
export const getUserByEmailAcrossAcademies = async (email: string): Promise<User | undefined> => {
  const res = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1',
    [email]
  );
  return res.rows.length ? rowToUser(res.rows[0]) : undefined;
};

export const getAllUsers = async (): Promise<User[]> => {
  const res = await pool.query(
    'SELECT * FROM users WHERE deleted_at IS NULL ORDER BY created_at'
  );
  return res.rows.map(rowToUser);
};

export const getUsersByAcademy = async (academyId: string): Promise<User[]> => {
  const res = await pool.query(
    'SELECT * FROM users WHERE academy_id = $1 AND deleted_at IS NULL ORDER BY created_at',
    [academyId]
  );
  return res.rows.map(rowToUser);
};

export const storeAuthToken = async (
  userId: string,
  academyId: string,
  tokenType: string,
  rawToken: string,
  expiresAt: Date,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthTokenRecord> => {
  const tokenHash = hashToken(rawToken);
  const res = await pool.query(
    `INSERT INTO auth_tokens (token_id, user_id, academy_id, token_type, token_hash, issued_at, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8)
     ON CONFLICT (token_hash)
     DO UPDATE SET
       user_id = EXCLUDED.user_id,
       academy_id = EXCLUDED.academy_id,
       token_type = EXCLUDED.token_type,
       issued_at = NOW(),
       expires_at = EXCLUDED.expires_at,
       revoked_at = NULL,
       ip_address = EXCLUDED.ip_address,
       user_agent = EXCLUDED.user_agent
     RETURNING *`,
    [randomUUID(), userId, academyId, tokenType, tokenHash, expiresAt, ipAddress || null, userAgent || null]
  );
  return rowToAuthToken(res.rows[0]);
};

export const getValidAuthToken = async (tokenType: string, rawToken: string): Promise<AuthTokenRecord | undefined> => {
  const tokenHash = hashToken(rawToken);
  const res = await pool.query(
    `SELECT *
     FROM auth_tokens
     WHERE token_type = $1
       AND token_hash = $2
       AND revoked_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [tokenType, tokenHash]
  );
  return res.rows.length ? rowToAuthToken(res.rows[0]) : undefined;
};

export const revokeAuthToken = async (rawToken: string): Promise<void> => {
  const tokenHash = hashToken(rawToken);
  await pool.query(
    `UPDATE auth_tokens
     SET revoked_at = NOW()
     WHERE token_hash = $1
       AND revoked_at IS NULL`,
    [tokenHash]
  );
};

export const updateUserPassword = async (userId: string, passwordHash: string): Promise<void> => {
  await pool.query(
    `UPDATE users
     SET password_hash = $1, password_changed_at = NOW(), updated_at = NOW()
     WHERE user_id = $2`,
    [passwordHash, userId]
  );
};

export const revokeAuthTokensByUser = async (userId: string, tokenType?: string): Promise<void> => {
  if (tokenType) {
    await pool.query(
      `UPDATE auth_tokens
       SET revoked_at = NOW()
       WHERE user_id = $1
         AND token_type = $2
         AND revoked_at IS NULL`,
      [userId, tokenType]
    );
    return;
  }

  await pool.query(
    `UPDATE auth_tokens
     SET revoked_at = NOW()
     WHERE user_id = $1
       AND revoked_at IS NULL`,
    [userId]
  );
};

// Test helper: truncate all tables (only use in non-production environments)
export const resetDatabase = async (): Promise<void> => {
  await pool.query(`
    TRUNCATE TABLE
      audit_logs, auth_tokens, consents, consent_templates,
      health_records, judo_belt_history, judo_profile, student_guardians,
      session_attendance, session_comments, session_techniques,
      student_badges, student_progress, sync_queue, notifications,
      training_sessions, turma_students, turmas, techniques,
      badges, alerts, system_health, role_permissions, roles, permissions,
      users, academies
    RESTART IDENTITY CASCADE
  `);
};
