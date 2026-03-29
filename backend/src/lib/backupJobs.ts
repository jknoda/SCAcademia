import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import {
  BackupJobRecord,
  getBackupJobById,
  getUserById,
  updateBackupJob,
  listBackupJobs,
} from './database';
import { pool } from './db';
import { decryptBufferWithPassword, encryptBufferWithPassword } from './encryption';
import { sendEmail } from './email';
import { logAudit } from './audit';
import { verifyPassword } from './password';

type BackupRunOptions = {
  encryptionPassword?: string;
  initiatedBy?: string;
};

type RestoreRunOptions = {
  adminUserId: string;
  adminPassword: string;
  encryptionPassword?: string;
};

type BackupTableDump = {
  name: string;
  rows: Record<string, unknown>[];
};

type BackupDump = {
  version: 1;
  academyId: string;
  generatedAt: string;
  tables: BackupTableDump[];
};

type BackupContext = {
  userIds: Set<string>;
  turmaIds: Set<string>;
  sessionIds: Set<string>;
};

type BackupIntegrityResult = {
  valid: boolean;
  sizeBytes: number;
  reason?: string;
};

const BACKUP_TABLES = [
  'academies',
  'users',
  'auth_tokens',
  'consent_templates',
  'consents',
  'health_records',
  'techniques',
  'turmas',
  'training_sessions',
  'turma_students',
  'session_attendance',
  'session_comments',
  'session_techniques',
  'student_guardians',
  'student_progress',
  'student_badges',
  'judo_profile',
  'judo_belt_history',
  'sync_queue',
  'notifications',
  'alerts',
  'system_health',
  'audit_logs',
  'deletion_requests',
] as const;

const quoteIdentifier = (value: string): string => `"${value.replace(/"/g, '""')}"`;

const getBackupDirectory = (academyId: string): string => {
  const dir = path.resolve(process.cwd(), 'storage', 'backups', academyId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const buildFileName = (isEncrypted: boolean): string => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toISOString().slice(11, 19).replace(/:/g, '-');
  return `backup_${date}_${time}.sql.gz${isEncrypted ? '.enc' : ''}`;
};

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const getTableColumns = async (tableName: string): Promise<string[]> => {
  const res = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
     ORDER BY ordinal_position`,
    [tableName]
  );

  return res.rows.map((row) => row.column_name as string);
};

const getExistingTables = async (): Promise<Set<string>> => {
  const res = await pool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_type = 'BASE TABLE'`
  );

  return new Set(res.rows.map((row) => row.table_name as string));
};

const pickRowsQuery = (
  tableName: string,
  columns: string[],
  academyId: string,
  context: BackupContext
): { text: string; values: any[] } | null => {
  if (tableName === 'academies') {
    return {
      text: `SELECT * FROM ${quoteIdentifier(tableName)} WHERE academy_id = $1`,
      values: [academyId],
    };
  }

  if (columns.includes('academy_id')) {
    return {
      text: `SELECT * FROM ${quoteIdentifier(tableName)} WHERE academy_id = $1`,
      values: [academyId],
    };
  }

  if (columns.includes('turma_id') && context.turmaIds.size > 0) {
    return {
      text: `SELECT * FROM ${quoteIdentifier(tableName)} WHERE turma_id = ANY($1::uuid[])`,
      values: [[...context.turmaIds]],
    };
  }

  if (columns.includes('session_id') && context.sessionIds.size > 0) {
    return {
      text: `SELECT * FROM ${quoteIdentifier(tableName)} WHERE session_id = ANY($1::uuid[])`,
      values: [[...context.sessionIds]],
    };
  }

  if (columns.includes('user_id') && context.userIds.size > 0) {
    return {
      text: `SELECT * FROM ${quoteIdentifier(tableName)} WHERE user_id = ANY($1::uuid[])`,
      values: [[...context.userIds]],
    };
  }

  if (columns.includes('student_id') && context.userIds.size > 0) {
    return {
      text: `SELECT * FROM ${quoteIdentifier(tableName)} WHERE student_id = ANY($1::uuid[])`,
      values: [[...context.userIds]],
    };
  }

  if (columns.includes('guardian_id') && context.userIds.size > 0) {
    return {
      text: `SELECT * FROM ${quoteIdentifier(tableName)} WHERE guardian_id = ANY($1::uuid[])`,
      values: [[...context.userIds]],
    };
  }

  return null;
};

const updateContext = (context: BackupContext, rows: Record<string, unknown>[]): void => {
  for (const row of rows) {
    const userId = row['user_id'];
    const studentId = row['student_id'];
    const guardianId = row['guardian_id'];
    const turmaId = row['turma_id'];
    const sessionId = row['session_id'];

    if (typeof userId === 'string') {
      context.userIds.add(userId);
    }
    if (typeof studentId === 'string') {
      context.userIds.add(studentId);
    }
    if (typeof guardianId === 'string') {
      context.userIds.add(guardianId);
    }
    if (typeof turmaId === 'string') {
      context.turmaIds.add(turmaId);
    }
    if (typeof sessionId === 'string') {
      context.sessionIds.add(sessionId);
    }
  }
};

const collectBackupDump = async (academyId: string): Promise<BackupDump> => {
  const existingTables = await getExistingTables();
  const context: BackupContext = {
    userIds: new Set<string>(),
    turmaIds: new Set<string>(),
    sessionIds: new Set<string>(),
  };
  const tables: BackupTableDump[] = [];

  for (const tableName of BACKUP_TABLES) {
    if (!existingTables.has(tableName)) {
      continue;
    }

    const columns = await getTableColumns(tableName);
    const query = pickRowsQuery(tableName, columns, academyId, context);
    if (!query) {
      continue;
    }

    const res = await pool.query(query.text, query.values);
    const rows = res.rows as Record<string, unknown>[];
    if (rows.length === 0) {
      continue;
    }

    tables.push({ name: tableName, rows });
    updateContext(context, rows);
  }

  return {
    version: 1,
    academyId,
    generatedAt: new Date().toISOString(),
    tables,
  };
};

const serializeDump = (dump: BackupDump): Buffer => {
  const content = [
    '-- SCAcademia backup dump',
    '-- Format: JSON payload inside .sql.gz wrapper for tenant-scoped restore',
    JSON.stringify(dump, null, 2),
  ].join('\n');
  return Buffer.from(content, 'utf-8');
};

const parseDump = (buffer: Buffer): BackupDump => {
  const raw = buffer.toString('utf-8');
  const jsonStart = raw.indexOf('{');
  if (jsonStart < 0) {
    throw new Error('Dump de backup inválido');
  }

  return JSON.parse(raw.slice(jsonStart)) as BackupDump;
};

const readJobFileBuffer = async (
  job: BackupJobRecord,
  encryptionPassword?: string
): Promise<Buffer> => {
  if (!job.filePath) {
    throw new Error('Job de backup sem caminho de arquivo');
  }

  const fileBuffer = await fs.promises.readFile(job.filePath);
  if (job.isEncrypted) {
    if (!encryptionPassword) {
      throw new Error('Senha de criptografia obrigatória para restaurar backup criptografado');
    }

    return decryptBufferWithPassword(fileBuffer, encryptionPassword);
  }

  return fileBuffer;
};

const deleteTableRowsForAcademy = async (
  tableName: string,
  rows: Record<string, unknown>[],
  academyId: string
): Promise<void> => {
  const columns = await getTableColumns(tableName);
  if (tableName === 'academies') {
    await pool.query(`DELETE FROM ${quoteIdentifier(tableName)} WHERE academy_id = $1`, [academyId]);
    return;
  }

  if (columns.includes('academy_id')) {
    await pool.query(`DELETE FROM ${quoteIdentifier(tableName)} WHERE academy_id = $1`, [academyId]);
    return;
  }

  const collectIds = (columnName: string): string[] => {
    const values = rows
      .map((row) => row[columnName])
      .filter((value): value is string => typeof value === 'string');
    return [...new Set(values)];
  };

  if (columns.includes('session_id')) {
    const ids = collectIds('session_id');
    if (ids.length > 0) {
      await pool.query(`DELETE FROM ${quoteIdentifier(tableName)} WHERE session_id = ANY($1::uuid[])`, [ids]);
    }
    return;
  }

  if (columns.includes('turma_id')) {
    const ids = collectIds('turma_id');
    if (ids.length > 0) {
      await pool.query(`DELETE FROM ${quoteIdentifier(tableName)} WHERE turma_id = ANY($1::uuid[])`, [ids]);
    }
    return;
  }

  if (columns.includes('student_id')) {
    const ids = collectIds('student_id');
    if (ids.length > 0) {
      await pool.query(`DELETE FROM ${quoteIdentifier(tableName)} WHERE student_id = ANY($1::uuid[])`, [ids]);
    }
    return;
  }

  if (columns.includes('guardian_id')) {
    const ids = collectIds('guardian_id');
    if (ids.length > 0) {
      await pool.query(`DELETE FROM ${quoteIdentifier(tableName)} WHERE guardian_id = ANY($1::uuid[])`, [ids]);
    }
    return;
  }

  if (columns.includes('user_id')) {
    const ids = collectIds('user_id');
    if (ids.length > 0) {
      await pool.query(`DELETE FROM ${quoteIdentifier(tableName)} WHERE user_id = ANY($1::uuid[])`, [ids]);
    }
  }
};

const insertRow = async (tableName: string, row: Record<string, unknown>): Promise<void> => {
  const entries = Object.entries(row);
  if (entries.length === 0) {
    return;
  }

  const columns = entries.map(([column]) => quoteIdentifier(column)).join(', ');
  const placeholders = entries.map((_, index) => `$${index + 1}`).join(', ');
  const values = entries.map(([, value]) => value);

  await pool.query(
    `INSERT INTO ${quoteIdentifier(tableName)} (${columns}) VALUES (${placeholders})`,
    values
  );
};

const sendRestoreEmail = async (
  adminUserId: string,
  subject: string,
  text: string,
  html: string
): Promise<void> => {
  const admin = await getUserById(adminUserId);
  if (!admin) {
    return;
  }

  await sendEmail({
    to: admin.email,
    subject,
    text,
    html,
  });
};

export const runBackupJob = async (
  jobId: string,
  academyId: string,
  options: BackupRunOptions = {}
): Promise<BackupJobRecord> => {
  const existingJob = await getBackupJobById(jobId, academyId);
  if (!existingJob) {
    throw new Error('Job de backup não encontrado');
  }

  await updateBackupJob(jobId, academyId, {
    status: 'running',
    startedAt: new Date(),
    errorMessage: null,
  });

  try {
    const dump = await collectBackupDump(academyId);
    const rawBuffer = serializeDump(dump);
    const gzipped = zlib.gzipSync(rawBuffer);
    const finalBuffer = existingJob.isEncrypted
      ? encryptBufferWithPassword(gzipped, options.encryptionPassword || '')
      : gzipped;

    const fileName = buildFileName(existingJob.isEncrypted);
    const filePath = path.join(getBackupDirectory(academyId), fileName);
    await fs.promises.writeFile(filePath, finalBuffer);

    const updated = await updateBackupJob(jobId, academyId, {
      status: 'completed',
      fileName,
      filePath,
      fileSizeBytes: finalBuffer.byteLength,
      completedAt: new Date(),
      downloadExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      errorMessage: null,
    });

    if (!updated) {
      throw new Error('Falha ao atualizar job de backup concluído');
    }

    return updated;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao gerar backup';
    const failed = await updateBackupJob(jobId, academyId, {
      status: 'failed',
      completedAt: new Date(),
      errorMessage: message,
    });

    if (failed) {
      return failed;
    }

    throw error;
  }
};

export const verifyBackupIntegrity = async (
  jobId: string,
  academyId: string
): Promise<BackupIntegrityResult> => {
  const job = await getBackupJobById(jobId, academyId);
  if (!job?.filePath) {
    return { valid: false, sizeBytes: 0, reason: 'Arquivo de backup não encontrado' };
  }

  if (!(await fileExists(job.filePath))) {
    return { valid: false, sizeBytes: 0, reason: 'Arquivo físico não encontrado' };
  }

  const stats = await fs.promises.stat(job.filePath);
  const handle = await fs.promises.open(job.filePath, 'r');
  const chunk = Buffer.alloc(2);

  try {
    await handle.read(chunk, 0, 2, 0);
  } finally {
    await handle.close();
  }

  if (job.isEncrypted) {
    return { valid: stats.size > 0, sizeBytes: stats.size, reason: stats.size > 0 ? undefined : 'Arquivo vazio' };
  }

  const isGzip = chunk[0] === 0x1f && chunk[1] === 0x8b;
  return {
    valid: isGzip,
    sizeBytes: stats.size,
    reason: isGzip ? undefined : 'Header gzip inválido',
  };
};

export const runRestoreJob = async (
  jobId: string,
  academyId: string,
  options: RestoreRunOptions
): Promise<void> => {
  const job = await getBackupJobById(jobId, academyId);
  if (!job) {
    throw new Error('Backup não encontrado');
  }

  const admin = await getUserById(options.adminUserId);
  if (!admin) {
    throw new Error('Administrador não encontrado');
  }

  const passwordMatches = await verifyPassword(options.adminPassword, admin.passwordHash);
  if (!passwordMatches) {
    throw new Error('Senha do administrador inválida');
  }

  await sendRestoreEmail(
    options.adminUserId,
    'Restore iniciado - SCAcademia',
    `O processo de restore do backup ${job.fileName || job.id} foi iniciado às ${new Date().toLocaleString('pt-BR')}.`,
    `<p>O processo de restore do backup <strong>${job.fileName || job.id}</strong> foi iniciado às ${new Date().toLocaleString('pt-BR')}.</p>`
  );

  await updateBackupJob(jobId, academyId, {
    status: 'running',
    startedAt: new Date(),
    errorMessage: null,
  });

  try {
    const fileBuffer = await readJobFileBuffer(job, options.encryptionPassword);
    const rawBuffer = zlib.gunzipSync(fileBuffer);
    const dump = parseDump(rawBuffer);

    await pool.query('BEGIN');
    for (const table of [...dump.tables].reverse()) {
      await deleteTableRowsForAcademy(table.name, table.rows, academyId);
    }
    for (const table of dump.tables) {
      for (const row of table.rows) {
        await insertRow(table.name, row);
      }
    }
    await pool.query('COMMIT');

    await updateBackupJob(jobId, academyId, {
      status: 'completed',
      completedAt: new Date(),
      errorMessage: null,
    });

    logAudit(options.adminUserId, 'BACKUP_RESTORE', 'backup_jobs', jobId, academyId, undefined, {
      fileName: job.fileName,
      isEncrypted: job.isEncrypted,
    });

    await sendRestoreEmail(
      options.adminUserId,
      'Restore concluído - SCAcademia',
      `O restore do backup ${job.fileName || job.id} foi concluído com sucesso.`,
      `<p>O restore do backup <strong>${job.fileName || job.id}</strong> foi concluído com sucesso.</p>`
    );
  } catch (error) {
    await pool.query('ROLLBACK');

    const message = error instanceof Error ? error.message : 'Erro ao restaurar backup';
    await updateBackupJob(jobId, academyId, {
      status: 'failed',
      completedAt: new Date(),
      errorMessage: message,
    });

    throw error;
  }
};

export const cleanupOldBackups = async (
  academyId: string,
  retentionDays: number
): Promise<number> => {
  const jobs = await listBackupJobs(academyId, 200);
  const threshold = Date.now() - Math.max(1, retentionDays) * 24 * 60 * 60 * 1000;
  let cleaned = 0;

  for (const job of jobs) {
    if (
      job.status !== 'completed' ||
      job.archivedAt ||
      !job.completedAt ||
      job.completedAt.getTime() >= threshold
    ) {
      continue;
    }

    if (job.filePath && (await fileExists(job.filePath))) {
      await fs.promises.unlink(job.filePath);
    }

    await updateBackupJob(job.id, academyId, {
      status: 'deleted',
      archivedAt: new Date(),
      errorMessage: null,
    });
    cleaned += 1;
  }

  return cleaned;
};