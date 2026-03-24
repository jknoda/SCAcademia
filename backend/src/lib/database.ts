import { createHash, randomUUID } from 'crypto';
import { pool } from './db';

export interface Academy {
  id: string;
  name: string;
  location: string;
  email: string;
  phone: string;
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

export const updateAcademyProfile = async (
  academyId: string,
  input: AcademyProfileUpdateInput
): Promise<Academy | undefined> => {
  const res = await pool.query(
    `UPDATE academies
     SET
       name = $2,
       description = $3,
       document_id = $4,
       contact_email = $5,
       contact_phone = $6,
       address_street = $7,
       address_number = $8,
       address_complement = $9,
       address_neighborhood = $10,
       address_postal_code = $11,
       address_city = $12,
       address_state = $13,
       updated_at = NOW()
     WHERE academy_id = $1
       AND deleted_at IS NULL
     RETURNING *`,
    [
      academyId,
      input.name,
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
  dataEntrada?: Date
): Promise<User> => {
  const id = randomUUID();
  const age = birthDate
    ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : undefined;
  const isMinor = role === 'Aluno' && age !== undefined && age < 18;

  const res = await pool.query(
    `INSERT INTO users (user_id, academy_id, email, password_hash, full_name, role, birth_date,
                        is_minor, minor_consent_signed, is_active, data_entrada, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, true, $9, NOW(), NOW())
     RETURNING *`,
    [id, academyId, email, passwordHash, fullName, role, birthDate || null, isMinor, dataEntrada || null]
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

export const updateUserProfile = async (
  userId: string,
  academyId: string,
  input: UserProfileUpdateInput
): Promise<User | undefined> => {
  const res = await pool.query(
    `UPDATE users
     SET
       full_name = $3,
       document_id = $4,
       birth_date = $5,
       phone = $6,
       address_street = $7,
       address_number = $8,
       address_complement = $9,
       address_neighborhood = $10,
       address_postal_code = $11,
       address_city = $12,
       address_state = $13,
       updated_at = NOW()
     WHERE user_id = $1
       AND academy_id = $2
       AND deleted_at IS NULL
     RETURNING *`,
    [
      userId,
      academyId,
      input.fullName,
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
       document_id = $4,
       birth_date = $5,
       phone = $6,
       address_street = $7,
       address_number = $8,
       address_complement = $9,
       address_neighborhood = $10,
       address_postal_code = $11,
       address_city = $12,
       address_state = $13,
       data_entrada = $14,
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
       document_id = $4,
       birth_date = $5,
       phone = $6,
       address_street = $7,
       address_number = $8,
       address_complement = $9,
       address_neighborhood = $10,
       address_postal_code = $11,
       address_city = $12,
       address_state = $13,
       data_entrada = $14,
       is_minor = CASE WHEN $5::date > (CURRENT_DATE - INTERVAL '18 years') THEN true ELSE false END,
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
