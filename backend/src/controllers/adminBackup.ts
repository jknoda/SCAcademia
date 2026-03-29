import fs from 'fs';
import { Response } from 'express';
import { cleanupExpiredBackupJobs, createBackupJob, getBackupJobById, listBackupJobs, updateBackupJob, getUserById } from '../lib/database';
import { buildDefaultBackupSchedule, getBackupSchedule, upsertBackupSchedule } from '../lib/backupSchedule';
import { cleanupOldBackups, runBackupJob, runRestoreJob, verifyBackupIntegrity } from '../lib/backupJobs';
import { logAudit } from '../lib/audit';
import { verifyPassword } from '../lib/password';
import { AuthenticatedRequest, RestoreBackupRequest, TriggerBackupRequest } from '../types';

const toJobResponse = (job: Awaited<ReturnType<typeof getBackupJobById>> extends infer R ? Exclude<R, undefined> : never) => ({
  id: job.id,
  academyId: job.academyId,
  type: job.type,
  status: job.status,
  fileName: job.fileName || null,
  filePath: job.filePath || null,
  fileSizeBytes: job.fileSizeBytes || 0,
  includeHistory: job.includeHistory,
  isEncrypted: job.isEncrypted,
  initiatedBy: job.initiatedBy || null,
  startedAt: job.startedAt?.toISOString() || null,
  completedAt: job.completedAt?.toISOString() || null,
  errorMessage: job.errorMessage || null,
  downloadExpiresAt: job.downloadExpiresAt?.toISOString() || null,
  retentionDays: job.retentionDays,
  archivedAt: job.archivedAt?.toISOString() || null,
  createdAt: job.createdAt.toISOString(),
});

export const listBackupJobsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const adminUserId = req.user!.userId;
    const schedule = getBackupSchedule(academyId) || buildDefaultBackupSchedule(academyId, adminUserId);

    const expired = await cleanupExpiredBackupJobs(academyId, schedule.retentionDays);
    if (expired.length > 0) {
      await cleanupOldBackups(academyId, schedule.retentionDays);
    }

    const jobs = await listBackupJobs(academyId, 10);
    const lastAutoBackup = jobs.find((job) => job.type === 'auto') || null;

    logAudit(adminUserId, 'BACKUP_LIST_VIEWED', 'backup_jobs', 'backup-jobs', academyId, req.ip, {
      total: jobs.length,
    });

    return res.json({
      jobs: jobs.map(toJobResponse),
      schedule,
      lastAutoBackup: lastAutoBackup ? toJobResponse(lastAutoBackup) : null,
    });
  } catch (error) {
    console.error('Error in listBackupJobsHandler:', error);
    return res.status(500).json({ error: 'Erro ao carregar backups da academia' });
  }
};

export const triggerBackupHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const adminUserId = req.user!.userId;
    const payload = (req.body || {}) as TriggerBackupRequest;
    const schedule = getBackupSchedule(academyId) || buildDefaultBackupSchedule(academyId, adminUserId);

    const job = await createBackupJob({
      academyId,
      type: 'manual',
      status: 'pending',
      includeHistory: Boolean(payload.includeHistory),
      isEncrypted: Boolean(payload.isEncrypted),
      initiatedBy: adminUserId,
      retentionDays: schedule.retentionDays,
    });

    void runBackupJob(job.id, academyId, {
      encryptionPassword: payload.encryptionPassword,
      initiatedBy: adminUserId,
    }).catch((error) => {
      console.error('Erro ao executar backup manual:', error);
    });

    logAudit(adminUserId, 'BACKUP_TRIGGERED', 'backup_jobs', job.id, academyId, req.ip, {
      includeHistory: Boolean(payload.includeHistory),
      isEncrypted: Boolean(payload.isEncrypted),
    });

    return res.status(202).json({
      jobId: job.id,
      message: 'Backup iniciado com sucesso',
    });
  } catch (error) {
    console.error('Error in triggerBackupHandler:', error);
    return res.status(500).json({ error: 'Erro ao iniciar backup' });
  }
};

export const getBackupJobStatusHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const jobId = req.params['jobId'] as string;
    const job = await getBackupJobById(jobId, academyId);
    if (!job) {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    return res.json({ job: toJobResponse(job) });
  } catch (error) {
    console.error('Error in getBackupJobStatusHandler:', error);
    return res.status(500).json({ error: 'Erro ao carregar status do backup' });
  }
};

export const downloadBackupHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const adminUserId = req.user!.userId;
    const jobId = req.params['jobId'] as string;
    const job = await getBackupJobById(jobId, academyId);

    if (!job?.filePath || !job.fileName) {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    if (job.status !== 'completed') {
      return res.status(409).json({ error: 'Backup ainda não está concluído' });
    }

    if (job.downloadExpiresAt && job.downloadExpiresAt.getTime() <= Date.now()) {
      return res.status(410).json({ error: 'Link de download expirou' });
    }

    if (!fs.existsSync(job.filePath)) {
      return res.status(404).json({ error: 'Arquivo de backup não encontrado' });
    }

    logAudit(adminUserId, 'BACKUP_DOWNLOADED', 'backup_jobs', job.id, academyId, req.ip, {
      fileName: job.fileName,
      isEncrypted: job.isEncrypted,
    });

    res.setHeader('Content-Type', job.isEncrypted ? 'application/octet-stream' : 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${job.fileName}"`);
    fs.createReadStream(job.filePath).pipe(res);
  } catch (error) {
    console.error('Error in downloadBackupHandler:', error);
    return res.status(500).json({ error: 'Erro ao baixar backup' });
  }
};

export const verifyBackupHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const adminUserId = req.user!.userId;
    const jobId = req.params['jobId'] as string;
    const result = await verifyBackupIntegrity(jobId, academyId);

    logAudit(adminUserId, 'BACKUP_VERIFIED', 'backup_jobs', jobId, academyId, req.ip, {
      valid: result.valid,
      reason: result.reason,
    });

    return res.json(result);
  } catch (error) {
    console.error('Error in verifyBackupHandler:', error);
    return res.status(500).json({ error: 'Erro ao verificar integridade do backup' });
  }
};

export const restoreBackupHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const adminUserId = req.user!.userId;
    const jobId = req.params['jobId'] as string;
    const payload = (req.body || {}) as RestoreBackupRequest;
    const job = await getBackupJobById(jobId, academyId);
    const admin = await getUserById(adminUserId);

    if (!job) {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    if (!admin) {
      return res.status(401).json({ error: 'Administrador não encontrado' });
    }

    const passwordMatches = await verifyPassword(payload.adminPassword, admin.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Senha do administrador inválida' });
    }

    if (job.isEncrypted && !payload.encryptionPassword) {
      return res.status(400).json({ error: 'Senha de criptografia obrigatória para este backup' });
    }

    logAudit(adminUserId, 'BACKUP_RESTORE_INITIATED', 'backup_jobs', job.id, academyId, req.ip, {
      isEncrypted: job.isEncrypted,
    });

    void runRestoreJob(job.id, academyId, {
      adminUserId,
      adminPassword: payload.adminPassword,
      encryptionPassword: payload.encryptionPassword,
    }).catch((error) => {
      console.error('Erro ao restaurar backup:', error);
    });

    return res.status(202).json({ message: 'Restore iniciado. Você receberá email ao concluir.' });
  } catch (error) {
    console.error('Error in restoreBackupHandler:', error);
    return res.status(500).json({ error: 'Erro ao iniciar restore do backup' });
  }
};

export const getBackupScheduleHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const adminUserId = req.user!.userId;
    const schedule = getBackupSchedule(academyId) || buildDefaultBackupSchedule(academyId, adminUserId);
    return res.json(schedule);
  } catch (error) {
    console.error('Error in getBackupScheduleHandler:', error);
    return res.status(500).json({ error: 'Erro ao carregar agendamento de backup' });
  }
};

export const upsertBackupScheduleHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const adminUserId = req.user!.userId;
    const schedule = upsertBackupSchedule({
      academyId,
      generatedBy: adminUserId,
      hour: Number(req.body?.hour),
      minute: Number(req.body?.minute),
      enabled: Boolean(req.body?.enabled),
      retentionDays: Number(req.body?.retentionDays || 30),
    });

    logAudit(adminUserId, 'BACKUP_SCHEDULE_UPDATED', 'backup_jobs', academyId, academyId, req.ip, {
      hour: schedule.hour,
      minute: schedule.minute,
      enabled: schedule.enabled,
      retentionDays: schedule.retentionDays,
    });

    return res.json(schedule);
  } catch (error) {
    console.error('Error in upsertBackupScheduleHandler:', error);
    return res.status(500).json({ error: 'Erro ao salvar agendamento de backup' });
  }
};

export const deleteBackupJobHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const adminUserId = req.user!.userId;
    const jobId = req.params['jobId'] as string;
    const job = await getBackupJobById(jobId, academyId);

    if (!job) {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }

    if (job.status === 'running') {
      return res.status(409).json({ error: 'Não é permitido deletar backup em execução' });
    }

    if (job.filePath && fs.existsSync(job.filePath)) {
      await fs.promises.unlink(job.filePath);
    }

    await updateBackupJob(job.id, academyId, {
      status: 'deleted',
      archivedAt: new Date(),
    });

    logAudit(adminUserId, 'BACKUP_DELETED', 'backup_jobs', job.id, academyId, req.ip, {
      fileName: job.fileName,
    });

    return res.json({ message: 'Backup removido com sucesso' });
  } catch (error) {
    console.error('Error in deleteBackupJobHandler:', error);
    return res.status(500).json({ error: 'Erro ao remover backup' });
  }
};