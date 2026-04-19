import { createHash, randomUUID } from 'crypto';
import { pool } from './db';
import { ensureAthleteProgressSchema } from './athleteProgress';

export interface Academy {
  id: string;
  name: string;
  fantasyName?: string;
  location: string;
  email: string;
  phone: string;
  logoUrl?: string;
  description?: string;
  documentId?: string;
  contactEmail?: string;
  contactPhone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
  isActive?: boolean;
  maxUsers?: number;
  storageLimitGb?: number;
  updatedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
}

export interface AcademyProfileUpdateInput {
  name: string;
  fantasyName?: string;
  logoUrl?: string;
  description?: string;
  documentId: string;
  contactEmail: string;
  contactPhone: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  academyId: string;
  role: string; // 'Admin' | 'Professor' | 'Aluno'
  photoUrl?: string;
  documentId?: string;
  birthDate?: Date;
  phone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
  dataEntrada?: Date;
  dataSaida?: Date;
  isActive?: boolean;
  passwordChangedAt?: Date;
  consentStatus: 'pendente' | 'consentido' | 'negado';
  necessitaConsentimentoResponsavel: boolean;
  responsavelEmail?: string;
  createdAt: Date;
  deletedAt?: Date;
}

export type AdminManagedUserRole = 'Admin' | 'Professor' | 'Aluno' | 'Responsavel';

export interface AdminUserListFilters {
  page: number;
  limit: number;
  role?: AdminManagedUserRole;
  status?: 'active' | 'blocked' | 'pending' | 'all';
  search?: string;
  includeDeleted?: boolean;
}

export interface AdminUserListResult {
  items: User[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

export type BackupJobType = 'auto' | 'manual';

export type BackupJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'deleted';

export interface BackupJobRecord {
  id: string;
  academyId: string;
  type: BackupJobType;
  status: BackupJobStatus;
  fileName?: string;
  filePath?: string;
  fileSizeBytes?: number;
  includeHistory: boolean;
  isEncrypted: boolean;
  initiatedBy?: string;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  downloadExpiresAt?: Date;
  retentionDays: number;
  archivedAt?: Date;
  createdAt: Date;
}

// Map a DB row (snake_case) to the Academy interface
const rowToAcademy = (row: any): Academy => ({
  id: row.academy_id,
  name: row.name,
  fantasyName: row.fantasy_name || undefined,
  location: row.description || '',
  email: row.contact_email,
  phone: row.contact_phone || '',
  logoUrl: row.logo_url || undefined,
  description: row.description || '',
  documentId: row.document_id || undefined,
  contactEmail: row.contact_email,
  contactPhone: row.contact_phone || '',
  addressStreet: row.address_street || '',
  addressNumber: row.address_number || '',
  addressComplement: row.address_complement || '',
  addressNeighborhood: row.address_neighborhood || '',
  addressPostalCode: row.address_postal_code || '',
  addressCity: row.address_city || '',
  addressState: row.address_state || '',
  isActive: typeof row.is_active === 'boolean' ? row.is_active : undefined,
  maxUsers: typeof row.max_users === 'number' ? row.max_users : undefined,
  storageLimitGb: typeof row.storage_limit_gb === 'number' ? row.storage_limit_gb : undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at || undefined,
});

// Map a DB row (snake_case) to the User interface
const rowToUser = (row: any): User => ({
  id: row.user_id,
  email: row.email,
  fullName: row.full_name,
  passwordHash: row.password_hash,
  academyId: row.academy_id,
  role: row.role,
  photoUrl: row.photo_url || undefined,
  documentId: row.document_id || undefined,
  birthDate: row.birth_date ? new Date(row.birth_date) : undefined,
  phone: row.phone || undefined,
  addressStreet: row.address_street || undefined,
  addressNumber: row.address_number || undefined,
  addressComplement: row.address_complement || undefined,
  addressNeighborhood: row.address_neighborhood || undefined,
  addressPostalCode: row.address_postal_code || undefined,
  addressCity: row.address_city || undefined,
  addressState: row.address_state || undefined,
  dataEntrada: row.data_entrada ? new Date(row.data_entrada) : undefined,
  dataSaida: row.data_saida ? new Date(row.data_saida) : undefined,
  isActive: typeof row.is_active === 'boolean' ? row.is_active : undefined,
  passwordChangedAt: row.password_changed_at ? new Date(row.password_changed_at) : undefined,
  consentStatus: row.minor_consent_signed ? 'consentido' : 'pendente',
  necessitaConsentimentoResponsavel: row.is_minor || false,
  createdAt: row.created_at,
  deletedAt: row.deleted_at || undefined,
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

const rowToBackupJob = (row: any): BackupJobRecord => ({
  id: row.backup_job_id,
  academyId: row.academy_id,
  type: row.type,
  status: row.status,
  fileName: row.file_name || undefined,
  filePath: row.file_path || undefined,
  fileSizeBytes: typeof row.file_size_bytes === 'number' ? row.file_size_bytes : undefined,
  includeHistory: Boolean(row.include_history),
  isEncrypted: Boolean(row.is_encrypted),
  initiatedBy: row.initiated_by || undefined,
  startedAt: row.started_at ? new Date(row.started_at) : undefined,
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  errorMessage: row.error_message || undefined,
  downloadExpiresAt: row.download_expires_at ? new Date(row.download_expires_at) : undefined,
  retentionDays: typeof row.retention_days === 'number' ? row.retention_days : 30,
  archivedAt: row.archived_at ? new Date(row.archived_at) : undefined,
  createdAt: row.created_at ? new Date(row.created_at) : new Date(),
});

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

// Academy operations
export const createAcademy = async (
  name: string,
  location: string,
  email: string,
  phone: string,
  logoUrl?: string,
  fantasyName?: string
): Promise<Academy> => {
  const id = randomUUID();
  const normalizedFantasyName = fantasyName?.trim() ? fantasyName.trim() : null;

  const res = await pool.query(
    `INSERT INTO academies (academy_id, name, description, contact_email, contact_phone, logo_url, fantasy_name, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [id, name, location, email, phone, logoUrl || null, normalizedFantasyName]
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

export const updateAcademyProfile = async (
  academyId: string,
  input: AcademyProfileUpdateInput
): Promise<Academy | undefined> => {
  const res = await pool.query(
    `UPDATE academies
     SET
       name = $2,
       logo_url = $3,
       description = $4,
       document_id = $5,
       contact_email = $6,
       contact_phone = $7,
       address_street = $8,
       address_number = $9,
       address_complement = $10,
       address_neighborhood = $11,
       address_postal_code = $12,
       address_city = $13,
       address_state = $14,
       fantasy_name = $15,
       updated_at = NOW()
     WHERE academy_id = $1
       AND deleted_at IS NULL
     RETURNING *`,
    [
      academyId,
      input.name,
      input.logoUrl || null,
      input.description || null,
      input.documentId,
      input.contactEmail,
      input.contactPhone,
      input.addressStreet || null,
      input.addressNumber || null,
      input.addressComplement || null,
      input.addressNeighborhood || null,
      input.addressPostalCode || null,
      input.addressCity || null,
      input.addressState || null,
      input.fantasyName !== undefined ? input.fantasyName : input.name,
    ]
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
  responsavelEmail?: string,
  dataEntrada?: Date,
  photoUrl?: string
): Promise<User> => {
  const id = randomUUID();
  const age = birthDate
    ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : undefined;
  const isMinor = role === 'Aluno' && age !== undefined && age < 18;

  const res = await pool.query(
    `INSERT INTO users (user_id, academy_id, email, password_hash, full_name, role, birth_date,
                        photo_url, is_minor, minor_consent_signed, is_active, data_entrada, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, true, $10, NOW(), NOW())
     RETURNING *`,
    [id, academyId, email, passwordHash, fullName, role, birthDate || null, photoUrl || null, isMinor, dataEntrada || null]
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

export const getUserByIdIncludingDeleted = async (id: string): Promise<User | undefined> => {
  const res = await pool.query(
    'SELECT * FROM users WHERE user_id = $1',
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

export const listAcademyUsersPaginated = async (
  academyId: string,
  filters: AdminUserListFilters
): Promise<AdminUserListResult> => {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const offset = (page - 1) * limit;
  const values: any[] = [academyId];
  const where: string[] = ['u.academy_id = $1'];

  if (!filters.includeDeleted) {
    where.push('u.deleted_at IS NULL');
  }

  if (filters.role) {
    values.push(filters.role);
    where.push(`u.role = $${values.length}`);
  }

  const status = (filters.status || 'all').toLowerCase();
  if (status === 'active') {
    where.push('u.is_active = true');
  } else if (status === 'blocked') {
    where.push('u.is_active = false');
  } else if (status === 'pending') {
    where.push('u.is_active = true');
    where.push('u.password_changed_at IS NULL');
  }

  if (filters.search && filters.search.trim()) {
    values.push(`%${filters.search.trim().toLowerCase()}%`);
    where.push(`(LOWER(u.full_name) LIKE $${values.length} OR LOWER(u.email) LIKE $${values.length})`);
  }

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM users u
     WHERE ${where.join(' AND ')}`,
    values
  );
  const total = countRes.rows[0]?.total || 0;

  values.push(limit);
  values.push(offset);

  const listRes = await pool.query(
    `SELECT u.*
     FROM users u
     WHERE ${where.join(' AND ')}
     ORDER BY u.full_name ASC
     LIMIT $${values.length - 1}
     OFFSET $${values.length}`,
    values
  );

  return {
    items: listRes.rows.map(rowToUser),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const updateAcademyManagedUser = async (
  userId: string,
  academyId: string,
  input: { fullName?: string; role?: AdminManagedUserRole; isActive?: boolean }
): Promise<User | undefined> => {
  const res = await pool.query(
    `UPDATE users
     SET
       full_name = COALESCE($3, full_name),
       role = COALESCE($4, role),
       is_active = COALESCE($5, is_active),
       data_saida = CASE
         WHEN COALESCE($5, is_active) = true THEN NULL
         WHEN COALESCE($5, is_active) = false THEN COALESCE(data_saida, CURRENT_DATE)
         ELSE data_saida
       END,
       updated_at = NOW()
     WHERE user_id = $1
       AND academy_id = $2
       AND deleted_at IS NULL
     RETURNING *`,
    [
      userId,
      academyId,
      input.fullName || null,
      input.role || null,
      typeof input.isActive === 'boolean' ? input.isActive : null,
    ]
  );

  return res.rows.length ? rowToUser(res.rows[0]) : undefined;
};

export const softDeleteAcademyUser = async (
  userId: string,
  academyId: string
): Promise<User | undefined> => {
  const res = await pool.query(
    `UPDATE users
     SET
       deleted_at = NOW(),
       is_active = false,
       data_saida = COALESCE(data_saida, CURRENT_DATE),
       updated_at = NOW()
     WHERE user_id = $1
       AND academy_id = $2
       AND deleted_at IS NULL
     RETURNING *`,
    [userId, academyId]
  );

  return res.rows.length ? rowToUser(res.rows[0]) : undefined;
};

export const createBackupJob = async (input: {
  academyId: string;
  type: BackupJobType;
  status?: BackupJobStatus;
  includeHistory?: boolean;
  isEncrypted?: boolean;
  initiatedBy?: string;
  retentionDays?: number;
}): Promise<BackupJobRecord> => {
  const res = await pool.query(
    `INSERT INTO backup_jobs (
       backup_job_id,
       academy_id,
       type,
       status,
       include_history,
       is_encrypted,
       initiated_by,
       retention_days,
       created_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     RETURNING *`,
    [
      randomUUID(),
      input.academyId,
      input.type,
      input.status || 'pending',
      Boolean(input.includeHistory),
      Boolean(input.isEncrypted),
      input.initiatedBy || null,
      input.retentionDays || 30,
    ]
  );

  return rowToBackupJob(res.rows[0]);
};

export const updateBackupJob = async (
  backupJobId: string,
  academyId: string,
  updates: {
    status?: BackupJobStatus;
    fileName?: string | null;
    filePath?: string | null;
    fileSizeBytes?: number | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
    errorMessage?: string | null;
    downloadExpiresAt?: Date | null;
    archivedAt?: Date | null;
  }
): Promise<BackupJobRecord | undefined> => {
  const assignments: string[] = [];
  const values: any[] = [backupJobId, academyId];

  const pushUpdate = (column: string, value: any): void => {
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  };

  if (typeof updates.status === 'string') {
    pushUpdate('status', updates.status);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'fileName')) {
    pushUpdate('file_name', updates.fileName ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'filePath')) {
    pushUpdate('file_path', updates.filePath ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'fileSizeBytes')) {
    pushUpdate('file_size_bytes', updates.fileSizeBytes ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'startedAt')) {
    pushUpdate('started_at', updates.startedAt ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'completedAt')) {
    pushUpdate('completed_at', updates.completedAt ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'errorMessage')) {
    pushUpdate('error_message', updates.errorMessage ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'downloadExpiresAt')) {
    pushUpdate('download_expires_at', updates.downloadExpiresAt ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'archivedAt')) {
    pushUpdate('archived_at', updates.archivedAt ?? null);
  }

  if (assignments.length === 0) {
    return getBackupJobById(backupJobId, academyId);
  }

  const res = await pool.query(
    `UPDATE backup_jobs
     SET ${assignments.join(', ')}
     WHERE backup_job_id = $1
       AND academy_id = $2
     RETURNING *`,
    values
  );

  return res.rows.length ? rowToBackupJob(res.rows[0]) : undefined;
};

export const getBackupJobById = async (
  backupJobId: string,
  academyId: string
): Promise<BackupJobRecord | undefined> => {
  const res = await pool.query(
    `SELECT *
     FROM backup_jobs
     WHERE backup_job_id = $1
       AND academy_id = $2
     LIMIT 1`,
    [backupJobId, academyId]
  );

  return res.rows.length ? rowToBackupJob(res.rows[0]) : undefined;
};

export const listBackupJobs = async (
  academyId: string,
  limit: number = 10
): Promise<BackupJobRecord[]> => {
  const safeLimit = Math.min(100, Math.max(1, limit));
  const res = await pool.query(
    `SELECT *
     FROM backup_jobs
     WHERE academy_id = $1
       AND status <> 'deleted'
     ORDER BY created_at DESC
     LIMIT $2`,
    [academyId, safeLimit]
  );

  return res.rows.map(rowToBackupJob);
};

export const cleanupExpiredBackupJobs = async (
  academyId: string,
  retentionDays: number
): Promise<BackupJobRecord[]> => {
  const safeRetentionDays = Math.max(1, retentionDays);
  const res = await pool.query(
    `SELECT *
     FROM backup_jobs
     WHERE academy_id = $1
       AND status = 'completed'
       AND archived_at IS NULL
       AND completed_at IS NOT NULL
       AND completed_at < NOW() - ($2::text || ' days')::interval`,
    [academyId, safeRetentionDays]
  );

  return res.rows.map(rowToBackupJob);
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

export interface UserProfileUpdateInput {
  fullName: string;
  photoUrl?: string;
  documentId?: string;
  birthDate?: string;
  phone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
}

export interface ProfessorListFilters {
  name?: string;
  status?: 'active' | 'inactive' | 'all';
}

export interface ProfessorUpdateInput {
  fullName: string;
  photoUrl?: string;
  documentId?: string;
  birthDate?: string;
  phone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
  dataEntrada?: string;
}

export interface StudentListFilters {
  name?: string;
  status?: 'active' | 'inactive' | 'all';
}

export interface StudentCreateInput {
  fullName: string;
  photoUrl?: string;
  documentId?: string;
  birthDate: string;
  phone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
  dataEntrada?: string;
}

export interface StudentUpdateInput {
  fullName: string;
  photoUrl?: string;
  documentId?: string;
  birthDate: string;
  phone?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressPostalCode?: string;
  addressCity?: string;
  addressState?: string;
  dataEntrada?: string;
}

export interface StudentTurmaInfo {
  turmaId: string;
  turmaName: string;
  isActive: boolean;
}

export interface StudentGuardianInfo {
  guardianId: string;
  guardianName: string;
  guardianEmail: string;
  relationship?: string;
  isPrimary: boolean;
}

export interface StudentProfileView {
  user: User;
  faixa?: string;
  consentSignedAt?: Date;
  healthRecordExists: boolean;
  healthRecordUpdatedAt?: Date;
  turmas: StudentTurmaInfo[];
  guardian?: StudentGuardianInfo;
}

export interface GuardianSearchResult {
  guardianId: string;
  fullName: string;
  email: string;
  phone?: string;
  linkedStudentsCount: number;
}

export interface StudentGuardianLinkResult {
  studentId: string;
  guardianId: string;
  relationship?: string;
  isPrimary: boolean;
  createdAt: Date;
}

export interface MinorWithoutGuardianItem {
  studentId: string;
  fullName: string;
  birthDate?: Date;
  isActive: boolean;
}

export interface StudentWithoutHealthScreeningItem {
  studentId: string;
  fullName: string;
  birthDate?: Date;
  isActive: boolean;
  faixa?: string;
  hasGuardian: boolean;
}

export interface StudentDashboardCommentItem {
  content: string;
  professorName: string;
  sessionDate?: Date;
  createdAt: Date;
}

export interface StudentDashboardBeltHistoryItem {
  belt: string;
  receivedDate: Date;
  promotedBy?: string;
  notes?: string;
  durationDays: number;
}

export interface StudentProgressDashboard {
  evolution: {
    currentMonthPresentCount: number;
    previousMonthPresentCount: number;
    delta: number;
    monthlySeries: Array<{
      monthStart: string;
      presentCount: number;
      totalCount: number;
    }>;
    weeklySeries: Array<{
      weekNumber: number;
      date: string;
      proficiencyPercent: number;
    }>;
  };
  attendance: {
    presentCount90d: number;
    totalCount90d: number;
    attendancePercentage90d: number;
    nextClass?: {
      turmaName: string;
      sessionDate: string;
      sessionTime: string;
    };
    recentSessions: Array<{
      sessionDate: string;
      status: 'present' | 'absent' | 'justified';
    }>;
  };
  comments: {
    latest?: StudentDashboardCommentItem;
    totalComments: number;
    timeline: StudentDashboardCommentItem[];
  };
  beltAndAchievements: {
    currentBelt?: string;
    beltDate?: Date;
    isFederated: boolean;
    federationDate?: Date;
    federationRegistration?: string;
    totalBadges: number;
    latestBadges: Array<{
      name: string;
      earnedAt: Date;
    }>;
    currentStreak: number;
  };
  beltHistory: StudentDashboardBeltHistoryItem[];
}

export interface StudentAttendanceHistoryItem {
  sessionDate: string;
  turmaName: string;
  status: 'present' | 'absent' | 'justified';
  absenceReason?: string;
}

export interface StudentAttendanceHistoryResult {
  items: StudentAttendanceHistoryItem[];
  total: number;
  limit: number;
  offset: number;
  attendancePercentage: number;
  warningBelow70: boolean;
  currentStreak: number;
  currentStreakDays: number;
}

// Story 4-4: Comment History
export interface StudentCommentHistoryResult {
  items: Array<{
    content: string;
    professorName: string;
    sessionDate?: string;
    createdAt: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}

export interface StudentBadgesHistoryResult {
  unlocked: Array<{
    badgeId: string;
    name: string;
    description: string;
    iconUrl?: string;
    earnedAt: string;
    shareText: string;
  }>;
  upcoming: Array<{
    badgeId: string;
    name: string;
    description: string;
    iconUrl?: string;
    criteriaType: 'streak' | 'attendance_percentage' | 'sessions_total' | 'milestone';
    criteriaValue: number;
    currentValue: number;
    progressPercent: number;
    remaining: number;
    etaHint?: string;
  }>;
  totals: {
    unlocked: number;
    upcoming: number;
  };
}

export interface StudentMonthlyStats {
  monthStart: string;
  monthLabel: string;
  frequencia: {
    presentCount: number;
    totalCount: number;
    pct: number;
  };
  tecnicas: number;
  comentarios: number;
}

export interface StudentMonthlyComparisonResult {
  currentMonth: StudentMonthlyStats;
  previousMonth: StudentMonthlyStats | null;
  history: StudentMonthlyStats[];
  hasEnoughData: boolean;
}

export interface StudentNotificationItem {
  notificationId: string;
  type: 'badge_earned' | 'attendance_reminder' | 'alert_system' | 'comment_received';
  category: 'badges' | 'frequencia' | 'comentarios' | 'lembretes';
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  createdAt: string;
  sentAt?: string;
  readAt?: string;
  isRead: boolean;
}

export interface StudentNotificationFeedResult {
  items: StudentNotificationItem[];
  total: number;
  limit: number;
  offset: number;
  unreadCount: number;
}

// Story 4-8: Belt History
export interface StudentBeltHistoryEntry {
  beltHistoryId: number;
  belt: string;
  receivedDate: string;
  promotedBy?: string;
  notes?: string;
  durationDays: number;
  isCurrentBelt: boolean;
}

export interface StudentBeltHistoryResult {
  entries: StudentBeltHistoryEntry[];
  stats: {
    totalBelts: number;
    longestBeltName: string;
    longestBeltDays: number;
    lastBeltDate?: string;
    dataEntrada?: string;
  };
  judoProfile: {
    currentBelt?: string;
    isFederated: boolean;
    federationRegistration?: string;
    federationDate?: string;
  };
}

export const updateUserProfile = async (
  userId: string,
  academyId: string,
  input: UserProfileUpdateInput
): Promise<User | undefined> => {
  const res = await pool.query(
    `UPDATE users
     SET
       full_name = $3,
      photo_url = $4,
      document_id = $5,
      birth_date = $6,
      phone = $7,
      address_street = $8,
      address_number = $9,
      address_complement = $10,
      address_neighborhood = $11,
      address_postal_code = $12,
      address_city = $13,
      address_state = $14,
       updated_at = NOW()
     WHERE user_id = $1
       AND academy_id = $2
       AND deleted_at IS NULL
     RETURNING *`,
    [
      userId,
      academyId,
      input.fullName,
      input.photoUrl || null,
      input.documentId || null,
      input.birthDate || null,
      input.phone || null,
      input.addressStreet || null,
      input.addressNumber || null,
      input.addressComplement || null,
      input.addressNeighborhood || null,
      input.addressPostalCode || null,
      input.addressCity || null,
      input.addressState || null,
    ]
  );

  return res.rows.length ? rowToUser(res.rows[0]) : undefined;
};

export const listAcademyProfessors = async (
  academyId: string,
  filters: ProfessorListFilters
): Promise<User[]> => {
  const values: any[] = [academyId, 'Professor'];
  const where: string[] = ['academy_id = $1', 'role = $2', 'deleted_at IS NULL'];

  if (filters.name && filters.name.trim()) {
    values.push(`%${filters.name.trim().toLowerCase()}%`);
    where.push(`LOWER(full_name) LIKE $${values.length}`);
  }

  if (filters.status === 'active') {
    where.push('is_active = true');
  } else if (filters.status === 'inactive') {
    where.push('is_active = false');
  }

  const res = await pool.query(
    `SELECT *
     FROM users
     WHERE ${where.join(' AND ')}
     ORDER BY full_name ASC`,
    values
  );

  return res.rows.map(rowToUser);
};

export const getProfessorById = async (
  userId: string,
  academyId: string
): Promise<User | undefined> => {
  const res = await pool.query(
    `SELECT *
     FROM users
     WHERE user_id = $1
       AND academy_id = $2
       AND role = 'Professor'
       AND deleted_at IS NULL
     LIMIT 1`,
    [userId, academyId]
  );

  return res.rows.length ? rowToUser(res.rows[0]) : undefined;
};

export const updateProfessorProfile = async (
  userId: string,
  academyId: string,
  input: ProfessorUpdateInput
): Promise<User | undefined> => {
  const res = await pool.query(
    `UPDATE users
     SET
       full_name = $3,
      photo_url = $4,
      document_id = $5,
      birth_date = $6,
      phone = $7,
      address_street = $8,
      address_number = $9,
      address_complement = $10,
      address_neighborhood = $11,
      address_postal_code = $12,
      address_city = $13,
      address_state = $14,
      data_entrada = $15,
       updated_at = NOW()
     WHERE user_id = $1
       AND academy_id = $2
       AND role = 'Professor'
       AND deleted_at IS NULL
     RETURNING *`,
    [
      userId,
      academyId,
      input.fullName,
      input.photoUrl || null,
      input.documentId || null,
      input.birthDate || null,
      input.phone || null,
      input.addressStreet || null,
      input.addressNumber || null,
      input.addressComplement || null,
      input.addressNeighborhood || null,
      input.addressPostalCode || null,
      input.addressCity || null,
      input.addressState || null,
      input.dataEntrada || null,
    ]
  );

  return res.rows.length ? rowToUser(res.rows[0]) : undefined;
};

export const updateProfessorStatus = async (
  userId: string,
  academyId: string,
  isActive: boolean
): Promise<User | undefined> => {
  const res = await pool.query(
    `UPDATE users
     SET
       is_active = $3,
       data_saida = CASE WHEN $3 THEN NULL ELSE CURRENT_DATE END,
       updated_at = NOW()
     WHERE user_id = $1
       AND academy_id = $2
       AND role = 'Professor'
       AND deleted_at IS NULL
     RETURNING *`,
    [userId, academyId, isActive]
  );

  return res.rows.length ? rowToUser(res.rows[0]) : undefined;
};

export const listAcademyStudents = async (
  academyId: string,
  filters: StudentListFilters
): Promise<Array<User & {
  faixa?: string;
  consentSignedAt?: Date;
  hasHealthScreening: boolean;
  hasGuardian: boolean;
}>> => {
  const values: any[] = [academyId, 'Aluno'];
  const where: string[] = ['u.academy_id = $1', 'u.role = $2', 'u.deleted_at IS NULL'];

  if (filters.name && filters.name.trim()) {
    values.push(`%${filters.name.trim().toLowerCase()}%`);
    where.push(`LOWER(u.full_name) LIKE $${values.length}`);
  }

  if (filters.status === 'active') {
    where.push('u.is_active = true');
  } else if (filters.status === 'inactive') {
    where.push('u.is_active = false');
  }

  const res = await pool.query(
    `SELECT u.*, jp.current_belt, MAX(c.signed_at) AS consent_signed_at,
            EXISTS(
              SELECT 1
              FROM health_records hr
              WHERE hr.user_id = u.user_id
                AND hr.academy_id = u.academy_id
            ) AS has_health_screening,
            EXISTS(
              SELECT 1
              FROM student_guardians sg
              WHERE sg.student_id = u.user_id
                AND sg.academy_id = u.academy_id
            ) AS has_guardian
     FROM users u
     LEFT JOIN judo_profile jp
       ON jp.student_id = u.user_id
      AND jp.academy_id = u.academy_id
     LEFT JOIN consents c
       ON c.user_id = u.user_id
      AND c.status = 'accepted'
     WHERE ${where.join(' AND ')}
     GROUP BY u.user_id, jp.current_belt
     ORDER BY u.full_name ASC`,
    values
  );

  return res.rows.map((row) => ({
    ...rowToUser(row),
    faixa: row.current_belt || undefined,
    consentSignedAt: row.consent_signed_at ? new Date(row.consent_signed_at) : undefined,
    hasHealthScreening: row.has_health_screening === true,
    hasGuardian: row.has_guardian === true,
  }));
};

export const listProfessorStudents = async (
  academyId: string,
  professorId: string,
  filters: StudentListFilters
): Promise<Array<User & {
  faixa?: string;
  consentSignedAt?: Date;
  hasHealthScreening: boolean;
  hasGuardian: boolean;
}>> => {
  const values: any[] = [academyId, professorId, 'Aluno'];
  const where: string[] = [
    'u.academy_id = $1',
    't.professor_id = $2',
    'u.role = $3',
    'u.deleted_at IS NULL',
    't.deleted_at IS NULL',
    't.is_active = true',
    "ts.status = 'active'",
  ];

  if (filters.name && filters.name.trim()) {
    values.push(`%${filters.name.trim().toLowerCase()}%`);
    where.push(`LOWER(u.full_name) LIKE $${values.length}`);
  }

  if (filters.status === 'active') {
    where.push('u.is_active = true');
  } else if (filters.status === 'inactive') {
    where.push('u.is_active = false');
  }

  const res = await pool.query(
    `SELECT u.*, jp.current_belt, MAX(c.signed_at) AS consent_signed_at,
            EXISTS(
              SELECT 1
              FROM health_records hr
              WHERE hr.user_id = u.user_id
                AND hr.academy_id = u.academy_id
            ) AS has_health_screening,
            EXISTS(
              SELECT 1
              FROM student_guardians sg
              WHERE sg.student_id = u.user_id
                AND sg.academy_id = u.academy_id
            ) AS has_guardian
     FROM users u
     INNER JOIN turma_students ts
       ON ts.student_id = u.user_id
      AND ts.academy_id = u.academy_id
     INNER JOIN turmas t
       ON t.turma_id = ts.turma_id
      AND t.academy_id = ts.academy_id
     LEFT JOIN judo_profile jp
       ON jp.student_id = u.user_id
      AND jp.academy_id = u.academy_id
     LEFT JOIN consents c
       ON c.user_id = u.user_id
      AND c.status = 'accepted'
     WHERE ${where.join(' AND ')}
     GROUP BY u.user_id, jp.current_belt
     ORDER BY u.full_name ASC`,
    values
  );

  return res.rows.map((row) => ({
    ...rowToUser(row),
    faixa: row.current_belt || undefined,
    consentSignedAt: row.consent_signed_at ? new Date(row.consent_signed_at) : undefined,
    hasHealthScreening: row.has_health_screening === true,
    hasGuardian: row.has_guardian === true,
  }));
};

export const listStudentsWithoutHealthScreening = async (
  academyId: string
): Promise<StudentWithoutHealthScreeningItem[]> => {
  const res = await pool.query(
    `SELECT u.user_id,
            u.full_name,
            u.birth_date,
            u.is_active,
            jp.current_belt,
            EXISTS(
              SELECT 1
              FROM student_guardians sg
              WHERE sg.student_id = u.user_id
                AND sg.academy_id = u.academy_id
            ) AS has_guardian
     FROM users u
     LEFT JOIN judo_profile jp
       ON jp.student_id = u.user_id
      AND jp.academy_id = u.academy_id
     WHERE u.academy_id = $1
       AND u.role = 'Aluno'
       AND u.is_active = true
       AND u.deleted_at IS NULL
       AND NOT EXISTS (
         SELECT 1
         FROM health_records hr
         WHERE hr.user_id = u.user_id
           AND hr.academy_id = u.academy_id
       )
     ORDER BY u.full_name ASC`,
    [academyId]
  );

  return res.rows.map((row) => ({
    studentId: row.user_id,
    fullName: row.full_name,
    birthDate: row.birth_date ? new Date(row.birth_date) : undefined,
    isActive: row.is_active === true,
    faixa: row.current_belt || undefined,
    hasGuardian: row.has_guardian === true,
  }));
};

export const getStudentById = async (
  userId: string,
  academyId: string
): Promise<User | undefined> => {
  const res = await pool.query(
    `SELECT *
     FROM users
     WHERE user_id = $1
       AND academy_id = $2
       AND role = 'Aluno'
       AND deleted_at IS NULL
     LIMIT 1`,
    [userId, academyId]
  );

  return res.rows.length ? rowToUser(res.rows[0]) : undefined;
};

export const getGuardianById = async (
  guardianId: string,
  academyId: string
): Promise<User | undefined> => {
  const res = await pool.query(
    `SELECT *
     FROM users
     WHERE user_id = $1
       AND academy_id = $2
       AND role = 'Responsavel'
       AND deleted_at IS NULL
     LIMIT 1`,
    [guardianId, academyId]
  );

  return res.rows.length ? rowToUser(res.rows[0]) : undefined;
};

export const getGuardianByEmail = async (
  academyId: string,
  email: string
): Promise<User | undefined> => {
  const res = await pool.query(
    `SELECT *
     FROM users
     WHERE academy_id = $1
       AND role = 'Responsavel'
       AND LOWER(email) = LOWER($2)
       AND deleted_at IS NULL
     LIMIT 1`,
    [academyId, email.trim()]
  );

  return res.rows.length ? rowToUser(res.rows[0]) : undefined;
};

export const searchGuardianByEmail = async (
  academyId: string,
  email: string
): Promise<GuardianSearchResult | undefined> => {
  const res = await pool.query(
    `SELECT
      u.user_id,
      u.full_name,
      u.email,
      u.phone,
      COUNT(sg.student_id)::int AS linked_students_count
     FROM users u
     LEFT JOIN student_guardians sg
       ON sg.guardian_id = u.user_id
      AND sg.academy_id = u.academy_id
     WHERE u.academy_id = $1
       AND u.role = 'Responsavel'
       AND LOWER(u.email) = LOWER($2)
       AND u.deleted_at IS NULL
     GROUP BY u.user_id, u.full_name, u.email, u.phone
     LIMIT 1`,
    [academyId, email.trim()]
  );

  if (!res.rows.length) {
    return undefined;
  }

  return {
    guardianId: res.rows[0].user_id,
    fullName: res.rows[0].full_name,
    email: res.rows[0].email,
    phone: res.rows[0].phone || undefined,
    linkedStudentsCount: res.rows[0].linked_students_count || 0,
  };
};

export const linkGuardianToStudent = async (
  academyId: string,
  studentId: string,
  guardianId: string,
  relationship?: string,
  isPrimary: boolean = true
): Promise<StudentGuardianLinkResult> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (isPrimary) {
      await client.query(
        `UPDATE student_guardians
         SET is_primary = false
         WHERE academy_id = $1
           AND student_id = $2`,
        [academyId, studentId]
      );
    }

    const linkRes = await client.query(
      `INSERT INTO student_guardians (
         student_id,
         guardian_id,
         academy_id,
         relationship,
         is_primary,
         created_at
       ) VALUES (
         $1,
         $2,
         $3,
         $4,
         $5,
         NOW()
       )
       ON CONFLICT (student_id, guardian_id)
       DO UPDATE SET
         relationship = EXCLUDED.relationship,
         is_primary = EXCLUDED.is_primary
       RETURNING student_id, guardian_id, relationship, is_primary, created_at`,
      [studentId, guardianId, academyId, relationship || null, isPrimary]
    );

    await client.query(
      `UPDATE users
       SET minor_consent_signed = false,
           updated_at = NOW()
       WHERE user_id = $1
         AND academy_id = $2
         AND role = 'Aluno'`,
      [studentId, academyId]
    );

    await client.query(
      `UPDATE consents
       SET status = 'pending',
           signed_at = NULL
       WHERE academy_id = $1
         AND user_id = $2
         AND status = 'accepted'`,
      [academyId, studentId]
    );

    await client.query('COMMIT');

    const row = linkRes.rows[0];
    return {
      studentId: row.student_id,
      guardianId: row.guardian_id,
      relationship: row.relationship || undefined,
      isPrimary: row.is_primary === true,
      createdAt: row.created_at,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const unlinkGuardianFromStudent = async (
  academyId: string,
  studentId: string,
  guardianId: string
): Promise<boolean> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const deleted = await client.query(
      `DELETE FROM student_guardians
       WHERE academy_id = $1
         AND student_id = $2
         AND guardian_id = $3
       RETURNING student_id`,
      [academyId, studentId, guardianId]
    );

    if (!deleted.rows.length) {
      await client.query('ROLLBACK');
      return false;
    }

    await client.query(
      `UPDATE users
       SET minor_consent_signed = false,
           updated_at = NOW()
       WHERE user_id = $1
         AND academy_id = $2
         AND role = 'Aluno'`,
      [studentId, academyId]
    );

    await client.query(
      `UPDATE consents
       SET status = 'pending',
           signed_at = NULL
       WHERE academy_id = $1
         AND user_id = $2
         AND status = 'accepted'`,
      [academyId, studentId]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const listMinorsWithoutGuardian = async (
  academyId: string
): Promise<MinorWithoutGuardianItem[]> => {
  const res = await pool.query(
    `SELECT u.user_id, u.full_name, u.birth_date, u.is_active
     FROM users u
     LEFT JOIN student_guardians sg
       ON sg.student_id = u.user_id
      AND sg.academy_id = u.academy_id
     WHERE u.academy_id = $1
       AND u.role = 'Aluno'
       AND u.is_minor = true
       AND u.deleted_at IS NULL
       AND sg.student_id IS NULL
     ORDER BY u.full_name ASC`,
    [academyId]
  );

  return res.rows.map((row) => ({
    studentId: row.user_id,
    fullName: row.full_name,
    birthDate: row.birth_date ? new Date(row.birth_date) : undefined,
    isActive: row.is_active === true,
  }));
};

export const getStudentByIdForProfessor = async (
  userId: string,
  academyId: string,
  professorId: string
): Promise<User | undefined> => {
  const res = await pool.query(
    `SELECT DISTINCT u.*
     FROM users u
     INNER JOIN turma_students ts
       ON ts.student_id = u.user_id
      AND ts.academy_id = u.academy_id
     INNER JOIN turmas t
       ON t.turma_id = ts.turma_id
      AND t.academy_id = ts.academy_id
     WHERE u.user_id = $1
       AND u.academy_id = $2
       AND u.role = 'Aluno'
       AND u.deleted_at IS NULL
       AND t.professor_id = $3
       AND t.deleted_at IS NULL
       AND t.is_active = true
       AND ts.status = 'active'
     LIMIT 1`,
    [userId, academyId, professorId]
  );

  return res.rows.length ? rowToUser(res.rows[0]) : undefined;
};

export const updateStudentProfile = async (
  userId: string,
  academyId: string,
  input: StudentUpdateInput
): Promise<User | undefined> => {
  const res = await pool.query(
    `UPDATE users
     SET
       full_name = $3,
      photo_url = $4,
      document_id = $5,
      birth_date = $6,
      phone = $7,
      address_street = $8,
      address_number = $9,
      address_complement = $10,
      address_neighborhood = $11,
      address_postal_code = $12,
      address_city = $13,
      address_state = $14,
      data_entrada = $15,
      is_minor = CASE WHEN $6::date > (CURRENT_DATE - INTERVAL '18 years') THEN true ELSE false END,
       updated_at = NOW()
     WHERE user_id = $1
       AND academy_id = $2
       AND role = 'Aluno'
       AND deleted_at IS NULL
     RETURNING *`,
    [
      userId,
      academyId,
      input.fullName,
      input.photoUrl || null,
      input.documentId || null,
      input.birthDate,
      input.phone || null,
      input.addressStreet || null,
      input.addressNumber || null,
      input.addressComplement || null,
      input.addressNeighborhood || null,
      input.addressPostalCode || null,
      input.addressCity || null,
      input.addressState || null,
      input.dataEntrada || null,
    ]
  );

  return res.rows.length ? rowToUser(res.rows[0]) : undefined;
};

export const updateStudentStatus = async (
  userId: string,
  academyId: string,
  isActive: boolean
): Promise<User | undefined> => {
  const res = await pool.query(
    `UPDATE users
     SET
       is_active = $3,
       data_saida = CASE WHEN $3 THEN NULL ELSE CURRENT_DATE END,
       updated_at = NOW()
     WHERE user_id = $1
       AND academy_id = $2
       AND role = 'Aluno'
       AND deleted_at IS NULL
     RETURNING *`,
    [userId, academyId, isActive]
  );

  return res.rows.length ? rowToUser(res.rows[0]) : undefined;
};

export const assignStudentToTurma = async (
  academyId: string,
  turmaId: string,
  studentId: string
): Promise<void> => {
  await pool.query(
    `INSERT INTO turma_students (enrollment_id, turma_id, student_id, academy_id, status, enrolled_at, dropped_at)
     VALUES (gen_random_uuid(), $1, $2, $3, 'active', NOW(), NULL)
     ON CONFLICT (turma_id, student_id)
     DO UPDATE SET status = 'active', dropped_at = NULL`,
    [turmaId, studentId, academyId]
  );
};

export const getTurmaByIdInAcademy = async (
  academyId: string,
  turmaId: string
): Promise<{ turmaId: string; professorId: string } | undefined> => {
  const res = await pool.query(
    `SELECT turma_id, professor_id
     FROM turmas
     WHERE academy_id = $1
       AND turma_id = $2
       AND deleted_at IS NULL
       AND is_active = true
     LIMIT 1`,
    [academyId, turmaId]
  );

  return res.rows.length
    ? {
      turmaId: res.rows[0].turma_id,
      professorId: res.rows[0].professor_id,
    }
    : undefined;
};

export const getStudentProfileView = async (
  academyId: string,
  studentId: string
): Promise<StudentProfileView | undefined> => {
  const studentRes = await pool.query(
    `SELECT u.*, jp.current_belt, MAX(c.signed_at) AS consent_signed_at
     FROM users u
     LEFT JOIN judo_profile jp
       ON jp.student_id = u.user_id
      AND jp.academy_id = u.academy_id
     LEFT JOIN consents c
       ON c.user_id = u.user_id
      AND c.status = 'accepted'
     WHERE u.user_id = $1
       AND u.academy_id = $2
       AND u.role = 'Aluno'
       AND u.deleted_at IS NULL
     GROUP BY u.user_id, jp.current_belt
     LIMIT 1`,
    [studentId, academyId]
  );

  if (!studentRes.rows.length) {
    return undefined;
  }

  const studentRow = studentRes.rows[0];

  const [healthRes, turmasRes, guardianRes] = await Promise.all([
    pool.query(
      `SELECT updated_at
       FROM health_records
       WHERE user_id = $1
         AND academy_id = $2
       ORDER BY updated_at DESC
       LIMIT 1`,
      [studentId, academyId]
    ),
    pool.query(
      `SELECT t.turma_id, t.name, t.is_active
       FROM turma_students ts
       INNER JOIN turmas t
         ON t.turma_id = ts.turma_id
        AND t.academy_id = ts.academy_id
       WHERE ts.student_id = $1
         AND ts.academy_id = $2
         AND ts.status = 'active'
         AND t.deleted_at IS NULL
       ORDER BY t.name ASC`,
      [studentId, academyId]
    ),
    pool.query(
      `SELECT sg.guardian_id, u.full_name, u.email, sg.relationship, sg.is_primary
       FROM student_guardians sg
       INNER JOIN users u
         ON u.user_id = sg.guardian_id
        AND u.academy_id = sg.academy_id
       WHERE sg.student_id = $1
         AND sg.academy_id = $2
       ORDER BY sg.is_primary DESC, sg.created_at ASC
       LIMIT 1`,
      [studentId, academyId]
    ),
  ]);

  return {
    user: rowToUser(studentRow),
    faixa: studentRow.current_belt || undefined,
    consentSignedAt: studentRow.consent_signed_at ? new Date(studentRow.consent_signed_at) : undefined,
    healthRecordExists: healthRes.rows.length > 0,
    healthRecordUpdatedAt: healthRes.rows[0]?.updated_at ? new Date(healthRes.rows[0].updated_at) : undefined,
    turmas: turmasRes.rows.map((row) => ({
      turmaId: row.turma_id,
      turmaName: row.name,
      isActive: row.is_active === true,
    })),
    guardian: guardianRes.rows.length
      ? {
        guardianId: guardianRes.rows[0].guardian_id,
        guardianName: guardianRes.rows[0].full_name,
        guardianEmail: guardianRes.rows[0].email,
        relationship: guardianRes.rows[0].relationship || undefined,
        isPrimary: guardianRes.rows[0].is_primary === true,
      }
      : undefined,
  };
};

export const getStudentProgressDashboard = async (
  academyId: string,
  studentId: string
): Promise<StudentProgressDashboard> => {
  const [
    monthlyEvolutionRes,
    weeklyEvolutionRes,
    attendance90dRes,
    nextClassRes,
    recentAttendanceRes,
    latestCommentRes,
    commentsTimelineRes,
    commentsCountRes,
    judoProfileRes,
    beltHistoryRes,
    badgesRes,
    badgesCountRes,
    progressRes,
  ] = await Promise.all([
    pool.query(
      `SELECT
        date_trunc('month', ts.session_date)::date AS month_start,
        SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END)::int AS present_count,
        COUNT(*)::int AS total_count
       FROM session_attendance sa
       INNER JOIN training_sessions ts
         ON ts.session_id = sa.session_id
        AND ts.academy_id = sa.academy_id
       WHERE sa.academy_id = $1
         AND sa.student_id = $2
         AND ts.deleted_at IS NULL
         AND ts.session_date >= (date_trunc('month', CURRENT_DATE) - INTERVAL '3 months')::date
       GROUP BY date_trunc('month', ts.session_date)
       ORDER BY month_start ASC`,
      [academyId, studentId]
    ),
    // Story 4-2: Weekly evolution data for chart
    pool.query(
      `SELECT
        DATE_TRUNC('week', ts.session_date)::date AS week_start,
        EXTRACT(WEEK FROM ts.session_date)::int AS week_number,
        SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END)::int AS present_count,
        COUNT(*)::int AS total_count
       FROM session_attendance sa
       INNER JOIN training_sessions ts
         ON ts.session_id = sa.session_id
        AND ts.academy_id = sa.academy_id
       WHERE sa.academy_id = $1
         AND sa.student_id = $2
         AND ts.deleted_at IS NULL
         AND ts.session_date >= (CURRENT_DATE - INTERVAL '12 weeks')::date
       GROUP BY DATE_TRUNC('week', ts.session_date), EXTRACT(WEEK FROM ts.session_date)
       ORDER BY week_start ASC`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT
        SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END)::int AS present_count,
        COUNT(*)::int AS total_count
       FROM session_attendance sa
       INNER JOIN training_sessions ts
         ON ts.session_id = sa.session_id
        AND ts.academy_id = sa.academy_id
       WHERE sa.academy_id = $1
         AND sa.student_id = $2
         AND ts.deleted_at IS NULL
         AND ts.session_date >= (CURRENT_DATE - INTERVAL '90 days')::date`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT t.name AS turma_name, ts.session_date, ts.session_time
       FROM turma_students tstu
       INNER JOIN turmas t
         ON t.turma_id = tstu.turma_id
        AND t.academy_id = tstu.academy_id
       INNER JOIN training_sessions ts
         ON ts.turma_id = tstu.turma_id
        AND ts.academy_id = tstu.academy_id
       WHERE tstu.academy_id = $1
         AND tstu.student_id = $2
         AND tstu.status = 'active'
         AND t.deleted_at IS NULL
         AND t.is_active = true
         AND ts.deleted_at IS NULL
         AND (
           ts.session_date > CURRENT_DATE
           OR (ts.session_date = CURRENT_DATE AND ts.session_time >= CURRENT_TIME)
         )
       ORDER BY ts.session_date ASC, ts.session_time ASC
       LIMIT 1`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT ts.session_date, sa.status
       FROM session_attendance sa
       INNER JOIN training_sessions ts
         ON ts.session_id = sa.session_id
        AND ts.academy_id = sa.academy_id
       WHERE sa.academy_id = $1
         AND sa.student_id = $2
         AND ts.deleted_at IS NULL
       ORDER BY ts.session_date DESC, ts.session_time DESC
       LIMIT 8`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT sc.content, sc.created_at, ts.session_date, p.full_name AS professor_name
       FROM session_comments sc
       LEFT JOIN training_sessions ts
         ON ts.session_id = sc.session_id
        AND ts.academy_id = sc.academy_id
       LEFT JOIN users p
         ON p.user_id = sc.professor_id
        AND p.academy_id = sc.academy_id
       WHERE sc.academy_id = $1
         AND sc.student_id = $2
         AND sc.deleted_at IS NULL
       ORDER BY sc.created_at DESC
       LIMIT 1`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT sc.content, sc.created_at, ts.session_date, p.full_name AS professor_name
       FROM session_comments sc
       LEFT JOIN training_sessions ts
         ON ts.session_id = sc.session_id
        AND ts.academy_id = sc.academy_id
       LEFT JOIN users p
         ON p.user_id = sc.professor_id
        AND p.academy_id = sc.academy_id
       WHERE sc.academy_id = $1
         AND sc.student_id = $2
         AND sc.deleted_at IS NULL
       ORDER BY sc.created_at DESC
       LIMIT 10`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total_comments
       FROM session_comments
       WHERE academy_id = $1
         AND student_id = $2
         AND deleted_at IS NULL`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT current_belt, belt_date, is_federated, federation_date, federation_registration
       FROM judo_profile
       WHERE academy_id = $1
         AND student_id = $2
       LIMIT 1`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT h.belt, h.received_date, h.notes, p.full_name AS promoted_by
       FROM judo_belt_history h
       LEFT JOIN users p
         ON p.user_id = h.promoted_by_user_id
        AND p.academy_id = h.academy_id
       WHERE h.academy_id = $1
         AND h.student_id = $2
       ORDER BY h.received_date ASC`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT b.name, sb.earned_at
       FROM student_badges sb
       INNER JOIN badges b
         ON b.badge_id = sb.badge_id
        AND b.academy_id = sb.academy_id
       WHERE sb.academy_id = $1
         AND sb.student_id = $2
       ORDER BY sb.earned_at DESC
       LIMIT 5`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total_badges
       FROM student_badges
       WHERE academy_id = $1
         AND student_id = $2`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT streak_current
       FROM student_progress
       WHERE academy_id = $1
         AND student_id = $2
       LIMIT 1`,
      [academyId, studentId]
    ),
  ]);

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthKey = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, '0')}`;

  let currentMonthPresentCount = 0;
  let previousMonthPresentCount = 0;

  const monthlySeries = monthlyEvolutionRes.rows.map((row) => {
    const monthStartDate = new Date(row.month_start);
    const monthStart = monthStartDate.toISOString().slice(0, 10);
    const monthKey = monthStart.slice(0, 7);
    const presentCount = Number(row.present_count || 0);
    const totalCount = Number(row.total_count || 0);

    if (monthKey === currentMonthKey) {
      currentMonthPresentCount = presentCount;
    }
    if (monthKey === previousMonthKey) {
      previousMonthPresentCount = presentCount;
    }

    return {
      monthStart,
      presentCount,
      totalCount,
    };
  });

  // Story 4-2: Process weekly evolution for chart
  const weeklySeries = weeklyEvolutionRes.rows.map((row, index) => {
    const weekStartDate = new Date(row.week_start);
    const date = weekStartDate.toISOString().slice(0, 10);
    const presentCount = Number(row.present_count || 0);
    const totalCount = Number(row.total_count || 0);
    const proficiencyPercent = totalCount > 0
      ? Math.round((presentCount / totalCount) * 100)
      : 0;

    return {
      weekNumber: index + 1,
      date,
      proficiencyPercent,
    };
  });

  const attendance90d = attendance90dRes.rows[0] || {};
  const presentCount90d = Number(attendance90d.present_count || 0);
  const totalCount90d = Number(attendance90d.total_count || 0);
  const attendancePercentage90d = totalCount90d > 0
    ? Math.round((presentCount90d / totalCount90d) * 100)
    : 0;

  const nextClassRow = nextClassRes.rows[0];
  const latestCommentRow = latestCommentRes.rows[0];
  const judoProfileRow = judoProfileRes.rows[0];

  const commentsTimeline: StudentDashboardCommentItem[] = commentsTimelineRes.rows.map((row) => ({
    content: String(row.content || ''),
    professorName: String(row.professor_name || 'Professor'),
    sessionDate: row.session_date ? new Date(row.session_date) : undefined,
    createdAt: new Date(row.created_at),
  }));

  const beltHistoryChronological = beltHistoryRes.rows.map((row) => ({
    belt: String(row.belt || '-'),
    receivedDate: new Date(row.received_date),
    promotedBy: row.promoted_by ? String(row.promoted_by) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
  }));

  const beltHistory: StudentDashboardBeltHistoryItem[] = beltHistoryChronological
    .map((item, index, allItems) => {
      const nextDate = allItems[index + 1]?.receivedDate;
      const endDate = nextDate || new Date();
      const durationDays = Math.max(
        0,
        Math.floor((endDate.getTime() - item.receivedDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      return {
        ...item,
        durationDays,
      };
    })
    .sort((a, b) => b.receivedDate.getTime() - a.receivedDate.getTime());

  return {
    evolution: {
      currentMonthPresentCount,
      previousMonthPresentCount,
      delta: currentMonthPresentCount - previousMonthPresentCount,
      monthlySeries,
      weeklySeries,
    },
    attendance: {
      presentCount90d,
      totalCount90d,
      attendancePercentage90d,
      nextClass: nextClassRow
        ? {
          turmaName: String(nextClassRow.turma_name || '-'),
          sessionDate: new Date(nextClassRow.session_date).toISOString().slice(0, 10),
          sessionTime: String(nextClassRow.session_time || '').slice(0, 5),
        }
        : undefined,
      recentSessions: recentAttendanceRes.rows.map((row) => ({
        sessionDate: new Date(row.session_date).toISOString().slice(0, 10),
        status: String(row.status) as 'present' | 'absent' | 'justified',
      })),
    },
    comments: {
      latest: latestCommentRow
        ? {
          content: String(latestCommentRow.content || ''),
          professorName: String(latestCommentRow.professor_name || 'Professor'),
          sessionDate: latestCommentRow.session_date ? new Date(latestCommentRow.session_date) : undefined,
          createdAt: new Date(latestCommentRow.created_at),
        }
        : undefined,
      totalComments: Number(commentsCountRes.rows[0]?.total_comments || 0),
      timeline: commentsTimeline,
    },
    beltAndAchievements: {
      currentBelt: judoProfileRow?.current_belt ? String(judoProfileRow.current_belt) : undefined,
      beltDate: judoProfileRow?.belt_date ? new Date(judoProfileRow.belt_date) : undefined,
      isFederated: judoProfileRow?.is_federated === true,
      federationDate: judoProfileRow?.federation_date ? new Date(judoProfileRow.federation_date) : undefined,
      federationRegistration: judoProfileRow?.federation_registration
        ? String(judoProfileRow.federation_registration)
        : undefined,
      totalBadges: Number(badgesCountRes.rows[0]?.total_badges || 0),
      latestBadges: badgesRes.rows.map((row) => ({
        name: String(row.name || ''),
        earnedAt: new Date(row.earned_at),
      })),
      currentStreak: Number(progressRes.rows[0]?.streak_current || 0),
    },
    beltHistory,
  };
};

export const getStudentAttendanceHistory = async (
  academyId: string,
  studentId: string,
  options?: {
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }
): Promise<StudentAttendanceHistoryResult> => {
  const limit = Math.min(Math.max(Number(options?.limit || 20), 1), 100);
  const offset = Math.max(Number(options?.offset || 0), 0);

  const whereConditions = [
    'sa.academy_id = $1',
    'sa.student_id = $2',
    'ts.deleted_at IS NULL',
  ];
  const params: Array<string | number> = [academyId, studentId];

  if (options?.dateFrom) {
    params.push(options.dateFrom);
    whereConditions.push(`ts.session_date >= $${params.length}::date`);
  }
  if (options?.dateTo) {
    params.push(options.dateTo);
    whereConditions.push(`ts.session_date <= $${params.length}::date`);
  }

  const whereClause = whereConditions.join(' AND ');

  const [historyRes, totalRes, attendanceRes, streakRes] = await Promise.all([
    pool.query(
      `SELECT
        ts.session_date,
        t.name AS turma_name,
        sa.status
       FROM session_attendance sa
       INNER JOIN training_sessions ts
         ON ts.session_id = sa.session_id
        AND ts.academy_id = sa.academy_id
       LEFT JOIN turmas t
         ON t.turma_id = ts.turma_id
        AND t.academy_id = ts.academy_id
       WHERE ${whereClause}
       ORDER BY ts.session_date DESC, ts.session_time DESC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM session_attendance sa
       INNER JOIN training_sessions ts
         ON ts.session_id = sa.session_id
        AND ts.academy_id = sa.academy_id
       WHERE ${whereClause}`,
      params
    ),
    pool.query(
      `SELECT
        SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END)::int AS present_count,
        COUNT(*)::int AS total_count
       FROM session_attendance sa
       INNER JOIN training_sessions ts
         ON ts.session_id = sa.session_id
        AND ts.academy_id = sa.academy_id
       WHERE ${whereClause}`,
      params
    ),
    pool.query(
      `WITH ordered AS (
         SELECT
           ts.session_date,
           sa.status,
           ROW_NUMBER() OVER (ORDER BY ts.session_date DESC, ts.session_time DESC) AS rn
         FROM session_attendance sa
         INNER JOIN training_sessions ts
           ON ts.session_id = sa.session_id
          AND ts.academy_id = sa.academy_id
         WHERE sa.academy_id = $1
           AND sa.student_id = $2
           AND ts.deleted_at IS NULL
       ),
       first_absence AS (
         SELECT MIN(rn) AS rn
         FROM ordered
         WHERE status <> 'present'
       )
       SELECT
         COUNT(*)::int AS streak_count,
         CASE
           WHEN COUNT(*) = 0 THEN 0
           ELSE GREATEST(
             1,
             (MAX(session_date)::date - MIN(session_date)::date + 1)
           )::int
         END AS streak_days
       FROM ordered
       WHERE status = 'present'
         AND rn < COALESCE((SELECT rn FROM first_absence), 1000000)`,
      [academyId, studentId]
    ),
  ]);

  const attendanceRow = attendanceRes.rows[0] || {};
  const presentCount = Number(attendanceRow.present_count || 0);
  const totalCount = Number(attendanceRow.total_count || 0);
  const attendancePercentage = totalCount > 0
    ? Math.round((presentCount / totalCount) * 100)
    : 0;

  const streakRow = streakRes.rows[0] || {};
  const currentStreak = Number(streakRow.streak_count || 0);
  const currentStreakDays = Number(streakRow.streak_days || 0);

  return {
    items: historyRes.rows.map((row) => ({
      sessionDate: new Date(row.session_date).toISOString().slice(0, 10),
      turmaName: String(row.turma_name || 'Turma'),
      status: String(row.status) as 'present' | 'absent' | 'justified',
    })),
    total: Number(totalRes.rows[0]?.total || 0),
    limit,
    offset,
    attendancePercentage,
    warningBelow70: totalCount > 0 && attendancePercentage < 70,
    currentStreak,
    currentStreakDays,
  };
};

// Story 4-4: Dedicated comment history with pagination + keyword search
export const getStudentCommentHistory = async (
  academyId: string,
  studentId: string,
  options?: {
    keyword?: string;
    limit?: number;
    offset?: number;
  }
): Promise<StudentCommentHistoryResult> => {
  const limit = Math.min(Math.max(Number(options?.limit || 20), 1), 100);
  const offset = Math.max(Number(options?.offset || 0), 0);

  const whereConditions = [
    'sc.academy_id = $1',
    'sc.student_id = $2',
    'sc.deleted_at IS NULL',
  ];
  const params: Array<string | number> = [academyId, studentId];

  if (options?.keyword) {
    const safeKeyword = options.keyword.replace(/([%_\\])/g, '\\$1');
    params.push(`%${safeKeyword}%`);
    whereConditions.push(`sc.content ILIKE $${params.length} ESCAPE '\\'`);
  }

  const whereClause = whereConditions.join(' AND ');

  const [itemsRes, totalRes] = await Promise.all([
    pool.query(
      `SELECT
        sc.content,
        sc.created_at,
        ts.session_date,
        u.full_name AS professor_name
       FROM session_comments sc
       INNER JOIN users u
         ON u.user_id = sc.professor_id
       LEFT JOIN training_sessions ts
         ON ts.session_id = sc.session_id
        AND ts.academy_id = sc.academy_id
       WHERE ${whereClause}
       ORDER BY sc.created_at DESC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM session_comments sc
       INNER JOIN users u
         ON u.user_id = sc.professor_id
       WHERE ${whereClause}`,
      params
    ),
  ]);

  return {
    items: itemsRes.rows.map((row) => ({
      content: String(row.content || ''),
      professorName: String(row.professor_name || 'Professor'),
      sessionDate: row.session_date ? new Date(row.session_date).toISOString().slice(0, 10) : undefined,
      createdAt: new Date(row.created_at).toISOString(),
    })),
    total: Number(totalRes.rows[0]?.total || 0),
    limit,
    offset,
  };
};

// Story 4-5: Full badges view for student card 4 expansion
export const getStudentBadgesHistory = async (
  academyId: string,
  studentId: string,
  options?: {
    limitUnlocked?: number;
    limitUpcoming?: number;
  }
): Promise<StudentBadgesHistoryResult> => {
  const limitUnlocked = Math.min(Math.max(Number(options?.limitUnlocked || 20), 1), 100);
  const limitUpcoming = Math.min(Math.max(Number(options?.limitUpcoming || 5), 1), 20);

  const [unlockedRes, unlockedCountRes, progressRes, catalogRes] = await Promise.all([
    pool.query(
      `SELECT b.badge_id, b.name, b.description, b.icon_url, sb.earned_at
       FROM student_badges sb
       INNER JOIN badges b
         ON b.badge_id = sb.badge_id
        AND b.academy_id = sb.academy_id
       WHERE sb.academy_id = $1
         AND sb.student_id = $2
       ORDER BY sb.earned_at DESC
       LIMIT $3`,
      [academyId, studentId, limitUnlocked]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total_unlocked
       FROM student_badges
       WHERE academy_id = $1
         AND student_id = $2`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT total_sessions, streak_current, total_attendance_percentage
       FROM student_progress
       WHERE academy_id = $1
         AND student_id = $2
       LIMIT 1`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT b.badge_id, b.name, b.description, b.icon_url, b.criteria_type, b.criteria_value
       FROM badges b
       WHERE b.academy_id = $1
         AND NOT EXISTS (
           SELECT 1
           FROM student_badges sb
           WHERE sb.academy_id = $1
             AND sb.student_id = $2
             AND sb.badge_id = b.badge_id
         )
       ORDER BY b.name ASC
       LIMIT $3`,
      [academyId, studentId, limitUpcoming * 5]
    ),
  ]);

  const progressRow = progressRes.rows[0] || {};
  const streakCurrent = Number(progressRow.streak_current || 0);
  const totalSessions = Number(progressRow.total_sessions || 0);
  const attendancePercentage = Number(progressRow.total_attendance_percentage || 0);

  const getCurrentValue = (criteriaType: string): number => {
    if (criteriaType === 'streak') {
      return streakCurrent;
    }
    if (criteriaType === 'attendance_percentage') {
      return attendancePercentage;
    }
    return totalSessions;
  };

  const getEtaHint = (criteriaType: string, remaining: number): string | undefined => {
    if (remaining <= 0) {
      return undefined;
    }
    if (criteriaType === 'streak') {
      return `Treine por mais ${remaining} dia(s) consecutivo(s).`;
    }
    if (criteriaType === 'attendance_percentage') {
      return `Mantenha presença alta para subir ${remaining} ponto(s) percentuais.`;
    }
    const weeks = Math.max(1, Math.ceil(remaining / 3));
    if (weeks >= 8) {
      return `No ritmo de 3 aulas/semana: cerca de ${Math.ceil(weeks / 4)} mes(es).`;
    }
    return `No ritmo de 3 aulas/semana: cerca de ${weeks} semana(s).`;
  };

  const upcoming = catalogRes.rows
    .map((row) => {
      const criteriaType = String(row.criteria_type || 'milestone') as 'streak' | 'attendance_percentage' | 'sessions_total' | 'milestone';
      const criteriaValue = Number(row.criteria_value || 0);
      const currentValue = getCurrentValue(criteriaType);
      const remaining = Math.max(0, criteriaValue - currentValue);
      const progressPercent = criteriaValue > 0
        ? Math.min(100, Math.max(0, Math.round((currentValue / criteriaValue) * 100)))
        : 0;

      return {
        badgeId: String(row.badge_id),
        name: String(row.name || ''),
        description: String(row.description || ''),
        iconUrl: row.icon_url ? String(row.icon_url) : undefined,
        criteriaType,
        criteriaValue,
        currentValue,
        progressPercent,
        remaining,
        etaHint: getEtaHint(criteriaType, remaining),
      };
    })
    .sort((a, b) => {
      if (a.remaining !== b.remaining) {
        return a.remaining - b.remaining;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, limitUpcoming);

  const unlocked = unlockedRes.rows.map((row) => {
    const name = String(row.name || 'Badge');
    return {
      badgeId: String(row.badge_id),
      name,
      description: String(row.description || ''),
      iconUrl: row.icon_url ? String(row.icon_url) : undefined,
      earnedAt: new Date(row.earned_at).toISOString(),
      shareText: `🏅 Desbloqueei '${name}' em SCAcademia!`,
    };
  });

  return {
    unlocked,
    upcoming,
    totals: {
      unlocked: Number(unlockedCountRes.rows[0]?.total_unlocked || 0),
      upcoming: catalogRes.rows.length,
    },
  };
};

export const getStudentMonthlyComparison = async (
  academyId: string,
  studentId: string,
  monthsInput?: number
): Promise<StudentMonthlyComparisonResult> => {
  const months = Math.min(Math.max(Number(monthsInput || 6), 2), 12);
  const monthNamesPt = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const buildMonthLabel = (monthStart: string): string => {
    const [yearRaw, monthRaw] = monthStart.split('-');
    const year = Number(yearRaw || 0);
    const month = Number(monthRaw || 0);
    const monthName = monthNamesPt[month - 1] || 'Mês';
    return `${monthName} ${year}`;
  };

  const [frequencyRes, techniquesRes, commentsRes] = await Promise.all([
    pool.query(
      `SELECT
        date_trunc('month', ts.session_date)::date AS month_start,
        SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END)::int AS present_count,
        COUNT(*)::int AS total_count
       FROM session_attendance sa
       INNER JOIN training_sessions ts
         ON ts.session_id = sa.session_id
        AND ts.academy_id = sa.academy_id
       WHERE sa.academy_id = $1
         AND sa.student_id = $2
         AND ts.deleted_at IS NULL
         AND ts.session_date >= (date_trunc('month', CURRENT_DATE) - make_interval(months => $3::int))::date
       GROUP BY date_trunc('month', ts.session_date)
       ORDER BY month_start DESC`,
      [academyId, studentId, months - 1]
    ),
    pool.query(
      `SELECT
        date_trunc('month', ts.session_date)::date AS month_start,
        COUNT(DISTINCT st.technique_id)::int AS techniques_count
       FROM session_attendance sa
       INNER JOIN training_sessions ts
         ON ts.session_id = sa.session_id
        AND ts.academy_id = sa.academy_id
       INNER JOIN session_techniques st
         ON st.session_id = sa.session_id
        AND st.academy_id = sa.academy_id
       WHERE sa.academy_id = $1
         AND sa.student_id = $2
         AND sa.status = 'present'
         AND ts.deleted_at IS NULL
         AND ts.session_date >= (date_trunc('month', CURRENT_DATE) - make_interval(months => $3::int))::date
       GROUP BY date_trunc('month', ts.session_date)
       ORDER BY month_start DESC`,
      [academyId, studentId, months - 1]
    ),
    pool.query(
      `SELECT
        date_trunc('month', sc.created_at)::date AS month_start,
        COUNT(*)::int AS comments_count
       FROM session_comments sc
       WHERE sc.academy_id = $1
         AND sc.student_id = $2
         AND sc.deleted_at IS NULL
         AND sc.created_at >= (date_trunc('month', CURRENT_DATE) - make_interval(months => $3::int))
       GROUP BY date_trunc('month', sc.created_at)
       ORDER BY month_start DESC`,
      [academyId, studentId, months - 1]
    ),
  ]);

  const frequencyByMonth = new Map<string, { presentCount: number; totalCount: number }>();
  for (const row of frequencyRes.rows) {
    const monthStart = new Date(row.month_start).toISOString().slice(0, 10);
    const monthKey = monthStart.slice(0, 7);
    frequencyByMonth.set(monthKey, {
      presentCount: Number(row.present_count || 0),
      totalCount: Number(row.total_count || 0),
    });
  }

  const techniquesByMonth = new Map<string, number>();
  for (const row of techniquesRes.rows) {
    const monthStart = new Date(row.month_start).toISOString().slice(0, 10);
    const monthKey = monthStart.slice(0, 7);
    techniquesByMonth.set(monthKey, Number(row.techniques_count || 0));
  }

  const commentsByMonth = new Map<string, number>();
  for (const row of commentsRes.rows) {
    const monthStart = new Date(row.month_start).toISOString().slice(0, 10);
    const monthKey = monthStart.slice(0, 7);
    commentsByMonth.set(monthKey, Number(row.comments_count || 0));
  }

  const monthStartsDesc: string[] = [];
  const now = new Date();
  for (let i = 0; i < months; i += 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-01`;
    monthStartsDesc.push(monthStart);
  }

  const statsByMonth = new Map<string, StudentMonthlyStats>();
  for (const monthStart of monthStartsDesc) {
    const monthKey = monthStart.slice(0, 7);
    const freq = frequencyByMonth.get(monthKey) || { presentCount: 0, totalCount: 0 };
    const pct = freq.totalCount > 0
      ? Math.round((freq.presentCount / freq.totalCount) * 100)
      : 0;

    statsByMonth.set(monthKey, {
      monthStart,
      monthLabel: buildMonthLabel(monthStart),
      frequencia: {
        presentCount: freq.presentCount,
        totalCount: freq.totalCount,
        pct,
      },
      tecnicas: techniquesByMonth.get(monthKey) ?? 0,
      comentarios: commentsByMonth.get(monthKey) ?? 0,
    });
  }

  const currentMonthKey = monthStartsDesc[0].slice(0, 7);
  const previousMonthKey = monthStartsDesc[1].slice(0, 7);

  const currentMonth = statsByMonth.get(currentMonthKey)!;
  const previousMonth = statsByMonth.get(previousMonthKey) || null;
  const hasEnoughData = Boolean(previousMonth && previousMonth.frequencia.totalCount > 0);

  const history = [...monthStartsDesc]
    .reverse()
    .map((monthStart) => statsByMonth.get(monthStart.slice(0, 7))!)
    .filter(Boolean);

  return {
    currentMonth,
    previousMonth,
    history,
    hasEnoughData,
  };
};

const LEMBRETE_TITLE_PREFIXES = ['⏰ Lembrete', '🥋 Sua aula'];

const resolveNotificationCategory = (
  type: string,
  title: string
): 'badges' | 'frequencia' | 'comentarios' | 'lembretes' => {
  if (type === 'badge_earned') {
    return 'badges';
  }
  if (type === 'comment_received') {
    return 'comentarios';
  }
  if (type === 'attendance_reminder') {
    if (LEMBRETE_TITLE_PREFIXES.some((prefix) => title.startsWith(prefix))) {
      return 'lembretes';
    }
    return 'frequencia';
  }
  return 'lembretes';
};

const ensureStudentProactiveNotifications = async (
  academyId: string,
  studentId: string
): Promise<void> => {
  const [progressRes, latestBadgeRes, latestCommentRes, nextClassRes] = await Promise.all([
    pool.query(
      `SELECT total_sessions, streak_current, total_attendance_percentage
       FROM student_progress
       WHERE academy_id = $1
         AND student_id = $2
       LIMIT 1`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT b.name, sb.earned_at
       FROM student_badges sb
       INNER JOIN badges b
         ON b.badge_id = sb.badge_id
        AND b.academy_id = sb.academy_id
       WHERE sb.academy_id = $1
         AND sb.student_id = $2
       ORDER BY sb.earned_at DESC
       LIMIT 1`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT sc.content, p.full_name AS professor_name
       FROM session_comments sc
       LEFT JOIN users p
         ON p.user_id = sc.professor_id
        AND p.academy_id = sc.academy_id
       WHERE sc.academy_id = $1
         AND sc.student_id = $2
         AND sc.deleted_at IS NULL
       ORDER BY sc.created_at DESC
       LIMIT 1`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT t.name AS turma_name, ts.session_date, ts.session_time
       FROM turma_students tstu
       INNER JOIN turmas t
         ON t.turma_id = tstu.turma_id
        AND t.academy_id = tstu.academy_id
       INNER JOIN training_sessions ts
         ON ts.turma_id = tstu.turma_id
        AND ts.academy_id = tstu.academy_id
       WHERE tstu.academy_id = $1
         AND tstu.student_id = $2
         AND tstu.status = 'active'
         AND t.deleted_at IS NULL
         AND t.is_active = true
         AND ts.deleted_at IS NULL
         AND (
           ts.session_date > CURRENT_DATE
           OR (ts.session_date = CURRENT_DATE AND ts.session_time >= CURRENT_TIME)
         )
       ORDER BY ts.session_date ASC, ts.session_time ASC
       LIMIT 1`,
      [academyId, studentId]
    ),
  ]);

  const insertDailyNotification = async (
    type: 'badge_earned' | 'attendance_reminder' | 'comment_received',
    title: string,
    message: string
  ): Promise<void> => {
    await pool.query(
      `INSERT INTO notifications (user_id, academy_id, type, title, message, channels, status, sent_at)
       SELECT $1, $2, $3, $4, $5, 1, 'sent', NOW()
       WHERE NOT EXISTS (
         SELECT 1
         FROM notifications n
         WHERE n.user_id = $1
           AND n.academy_id = $2
           AND n.type = $3
           AND n.title = $4
           AND n.created_at::date = CURRENT_DATE
       )`,
      [studentId, academyId, type, title, message]
    );
  };

  const progressRow = progressRes.rows[0] || {};
  const totalSessions = Number(progressRow.total_sessions || 0);
  const streakCurrent = Number(progressRow.streak_current || 0);
  const attendancePercentage = Number(progressRow.total_attendance_percentage || 0);

  if (latestBadgeRes.rows.length > 0) {
    const badgeName = String(latestBadgeRes.rows[0]?.name || 'Novo badge');
    await insertDailyNotification(
      'badge_earned',
      '🏅 Novo badge desbloqueado!',
      `Você desbloqueou ${badgeName}. Continue evoluindo!`
    );
  }

  if (streakCurrent >= 30) {
    await insertDailyNotification(
      'attendance_reminder',
      '🔥 Parabéns pelo seu streak!',
      'Você completou 30 dias sem faltar. Continue assim!'
    );
  }

  if (attendancePercentage > 0 && attendancePercentage < 60) {
    await insertDailyNotification(
      'attendance_reminder',
      '⚠️ Vamos retomar o ritmo?',
      `Sua frequência está em ${attendancePercentage}%. Que tal treinar mais na próxima semana?`
    );
  }

  if (totalSessions === 1) {
    await insertDailyNotification(
      'attendance_reminder',
      '🎓 Primeira aula concluída!',
      'Bem-vindo(a)! Você completou sua primeira aula. Bora continuar!'
    );
  }

  if (latestCommentRes.rows.length > 0) {
    const professorName = String(latestCommentRes.rows[0]?.professor_name || 'Professor');
    const content = String(latestCommentRes.rows[0]?.content || '').slice(0, 90);
    await insertDailyNotification(
      'comment_received',
      '💬 Novo comentário do professor',
      `Prof. ${professorName}: "${content}${content.length >= 90 ? '...' : ''}"`
    );
  }

  const nextClassRow = nextClassRes.rows[0];
  if (nextClassRow) {
    const sessionDate = String(new Date(nextClassRow.session_date).toISOString().slice(0, 10));
    const sessionTime = String(nextClassRow.session_time || '00:00:00').slice(0, 8);
    const classDate = new Date(`${sessionDate}T${sessionTime}`);
    const now = new Date();
    const diffHours = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours >= 22 && diffHours <= 26) {
      await insertDailyNotification(
        'attendance_reminder',
        '⏰ Lembrete da aula de amanhã',
        `Sua aula é amanhã às ${sessionTime.slice(0, 5)}. Que tal confirmar presença?`
      );
    }

    if (diffHours >= 1 && diffHours <= 3) {
      await insertDailyNotification(
        'attendance_reminder',
        '🥋 Sua aula começa em 2 horas',
        'Prepare-se para a aula e mantenha seu ritmo de evolução!'
      );
    }
  }
};

export const listStudentNotifications = async (
  academyId: string,
  studentId: string,
  options?: {
    status?: 'pending' | 'sent' | 'failed' | 'bounced';
    limit?: number;
    offset?: number;
  }
): Promise<StudentNotificationFeedResult> => {
  const limit = Math.min(Math.max(Number(options?.limit || 20), 1), 100);
  const offset = Math.max(Number(options?.offset || 0), 0);

  if (offset === 0) {
    await ensureStudentProactiveNotifications(academyId, studentId);
  }

  const whereConditions = [
    'n.academy_id = $1',
    'n.user_id = $2',
  ];
  const params: Array<string | number> = [academyId, studentId];

  if (options?.status) {
    params.push(options.status);
    whereConditions.push(`n.status = $${params.length}`);
  }

  const whereClause = whereConditions.join(' AND ');

  const [itemsRes, totalRes, unreadRes] = await Promise.all([
    pool.query(
      `SELECT n.notification_id, n.type, n.title, n.message, n.status, n.created_at, n.sent_at, n.read_at
       FROM notifications n
       WHERE ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM notifications n
       WHERE ${whereClause}`,
      params
    ),
    pool.query(
      `SELECT COUNT(*)::int AS unread_count
       FROM notifications n
       WHERE ${whereClause}
         AND n.read_at IS NULL`,
      params
    ),
  ]);

  const items: StudentNotificationItem[] = itemsRes.rows.map((row) => {
    const type = String(row.type || 'attendance_reminder') as StudentNotificationItem['type'];
    const title = String(row.title || 'Notificação');
    return {
      notificationId: String(row.notification_id),
      type,
      category: resolveNotificationCategory(type, title),
      title,
      message: String(row.message || ''),
      status: String(row.status || 'sent') as StudentNotificationItem['status'],
      createdAt: new Date(row.created_at).toISOString(),
      sentAt: row.sent_at ? new Date(row.sent_at).toISOString() : undefined,
      readAt: row.read_at ? new Date(row.read_at).toISOString() : undefined,
      isRead: Boolean(row.read_at),
    };
  });

  return {
    items,
    total: Number(totalRes.rows[0]?.total || 0),
    limit,
    offset,
    unreadCount: Number(unreadRes.rows[0]?.unread_count || 0),
  };
};

export const markStudentNotificationRead = async (
  academyId: string,
  studentId: string,
  notificationId: string
): Promise<boolean> => {
  const res = await pool.query(
    `UPDATE notifications
     SET read_at = COALESCE(read_at, NOW())
     WHERE academy_id = $1
       AND user_id = $2
       AND notification_id = $3
     RETURNING notification_id`,
    [academyId, studentId, notificationId]
  );

  return res.rows.length > 0;
};

export const markAllStudentNotificationsRead = async (
  academyId: string,
  studentId: string
): Promise<number> => {
  const res = await pool.query(
    `UPDATE notifications
     SET read_at = COALESCE(read_at, NOW())
     WHERE academy_id = $1
       AND user_id = $2
       AND read_at IS NULL
     RETURNING notification_id`,
    [academyId, studentId]
  );

  return res.rowCount || 0;
};

// Story 4-8: Dedicated belt history for full timeline view
export const getStudentBeltHistory = async (
  academyId: string,
  studentId: string
): Promise<StudentBeltHistoryResult> => {
  const [beltHistoryRes, judoProfileRes] = await Promise.all([
    pool.query(
      `SELECT
        h.belt_history_id,
        h.belt,
        h.received_date,
        h.notes,
        u_prof.full_name AS promoted_by_name
       FROM judo_belt_history h
       LEFT JOIN users u_prof
         ON u_prof.user_id = h.promoted_by_user_id
        AND u_prof.academy_id = h.academy_id
       WHERE h.academy_id = $1
         AND h.student_id = $2
       ORDER BY h.received_date ASC`,
      [academyId, studentId]
    ),
    pool.query(
      `SELECT
        jp.current_belt,
        jp.is_federated,
        jp.federation_registration,
        jp.federation_date,
        u.data_entrada
       FROM judo_profile jp
       INNER JOIN users u
         ON u.user_id = jp.student_id
        AND u.academy_id = jp.academy_id
       WHERE jp.academy_id = $1
         AND jp.student_id = $2
       LIMIT 1`,
      [academyId, studentId]
    ),
  ]);

  const profileRow = judoProfileRes.rows[0];
  const rawEntries = beltHistoryRes.rows.map((row) => ({
    beltHistoryId: Number(row.belt_history_id),
    belt: String(row.belt || ''),
    receivedDate: new Date(row.received_date),
    promotedBy: row.promoted_by_name ? String(row.promoted_by_name) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
  }));

  const entries: StudentBeltHistoryEntry[] = rawEntries.map((item, index) => {
    const nextDate = rawEntries[index + 1]?.receivedDate;
    const endDate = nextDate || new Date();
    const durationDays = Math.max(
      0,
      Math.floor((endDate.getTime() - item.receivedDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const isCurrentBelt = index === rawEntries.length - 1;
    return {
      ...item,
      receivedDate: item.receivedDate.toISOString().slice(0, 10),
      durationDays,
      isCurrentBelt,
    };
  });

  let longestBeltName = '';
  let longestBeltDays = 0;
  for (const entry of entries) {
    if (entry.durationDays > longestBeltDays) {
      longestBeltDays = entry.durationDays;
      longestBeltName = entry.belt;
    }
  }

  const lastEntry = entries[entries.length - 1];
  const dataEntrada = profileRow?.data_entrada
    ? new Date(profileRow.data_entrada).toISOString().slice(0, 10)
    : undefined;

  return {
    entries,
    stats: {
      totalBelts: entries.length,
      longestBeltName,
      longestBeltDays,
      lastBeltDate: lastEntry?.receivedDate,
      dataEntrada,
    },
    judoProfile: {
      currentBelt: profileRow?.current_belt ? String(profileRow.current_belt) : undefined,
      isFederated: profileRow?.is_federated === true,
      federationRegistration: profileRow?.federation_registration
        ? String(profileRow.federation_registration)
        : undefined,
      federationDate: profileRow?.federation_date
        ? new Date(profileRow.federation_date).toISOString().slice(0, 10)
        : undefined,
    },
  };
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
  await ensureAthleteProgressSchema();

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

  await pool.query(`
    TRUNCATE TABLE
      backup_jobs,
      audit_logs, auth_tokens, consents, consent_templates,
      athlete_metric_values, athlete_progress_snapshots, athlete_progress_alerts, athlete_assessments,
      athlete_progress_metric_definitions, athlete_progress_profiles,
      health_records, judo_belt_history, judo_profile, student_guardians,
      session_attendance, session_comments, session_techniques,
      student_badges, student_progress, sync_queue, notifications,
      training_sessions, turma_students, turmas, techniques,
      badges, alerts, system_health, role_permissions, roles, permissions,
      users, academies
    RESTART IDENTITY CASCADE
  `);
};
