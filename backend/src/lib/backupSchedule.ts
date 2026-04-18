import fs from 'fs';
import path from 'path';
import { createBackupJob, getAcademyById } from './database';
import { cleanupOldBackups, runBackupJob } from './backupJobs';

export interface BackupScheduleConfig {
  academyId: string;
  generatedBy: string;
  frequency: 'daily';
  hour: number;
  minute: number;
  enabled: boolean;
  retentionDays: number;
  nextRunAt: string;
  updatedAt: string;
}

const backupScheduleFilePath = path.resolve(process.cwd(), 'storage', 'backup-schedules.json');
let schedulerStarted = false;

const ensureScheduleStorage = (): void => {
  const dir = path.dirname(backupScheduleFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(backupScheduleFilePath)) {
    fs.writeFileSync(backupScheduleFilePath, '[]', 'utf-8');
  }
};

const loadSchedules = (): BackupScheduleConfig[] => {
  ensureScheduleStorage();
  return JSON.parse(fs.readFileSync(backupScheduleFilePath, 'utf-8')) as BackupScheduleConfig[];
};

const saveSchedules = (items: BackupScheduleConfig[]): void => {
  ensureScheduleStorage();
  fs.writeFileSync(backupScheduleFilePath, JSON.stringify(items, null, 2), 'utf-8');
};

const computeNextRunAt = (hour: number, minute: number): string => {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next.toISOString();
};

export const listBackupSchedules = (): BackupScheduleConfig[] => loadSchedules();

export const getBackupSchedule = (academyId: string): BackupScheduleConfig | null => {
  return loadSchedules().find((item) => item.academyId === academyId) || null;
};

export const buildDefaultBackupSchedule = (
  academyId: string,
  generatedBy: string
): BackupScheduleConfig => ({
  academyId,
  generatedBy,
  frequency: 'daily',
  hour: 2,
  minute: 30,
  enabled: true,
  retentionDays: 30,
  nextRunAt: computeNextRunAt(2, 30),
  updatedAt: new Date().toISOString(),
});

export const upsertBackupSchedule = (input: {
  academyId: string;
  generatedBy: string;
  hour: number;
  minute: number;
  enabled: boolean;
  retentionDays: number;
}): BackupScheduleConfig => {
  const items = loadSchedules();
  const nextItem: BackupScheduleConfig = {
    academyId: input.academyId,
    generatedBy: input.generatedBy,
    frequency: 'daily',
    hour: input.hour,
    minute: input.minute,
    enabled: input.enabled,
    retentionDays: input.retentionDays,
    nextRunAt: computeNextRunAt(input.hour, input.minute),
    updatedAt: new Date().toISOString(),
  };

  const index = items.findIndex((item) => item.academyId === input.academyId);
  if (index >= 0) {
    items[index] = nextItem;
  } else {
    items.push(nextItem);
  }

  saveSchedules(items);
  return nextItem;
};

const processDueSchedules = async (): Promise<void> => {
  const schedules = loadSchedules();
  const now = new Date();
  const nextSchedules: BackupScheduleConfig[] = [];

  for (const schedule of schedules) {
    const academy = await getAcademyById(schedule.academyId);
    if (!academy) {
      console.warn(
        `[BackupScheduler] Removendo agenda órfã da academia ${schedule.academyId} (academia inexistente ou removida).`
      );
      continue;
    }

    if (!schedule.enabled || new Date(schedule.nextRunAt) > now) {
      nextSchedules.push(schedule);
      continue;
    }

    try {
      const job = await createBackupJob({
        academyId: schedule.academyId,
        type: 'auto',
        includeHistory: true,
        isEncrypted: false,
        initiatedBy: schedule.generatedBy,
        retentionDays: schedule.retentionDays,
      });

      await runBackupJob(job.id, schedule.academyId, {
        initiatedBy: schedule.generatedBy,
      }).catch((error) => {
        console.error('Erro ao executar backup automático agendado:', error);
      });

      await cleanupOldBackups(schedule.academyId, schedule.retentionDays).catch((error) => {
        console.error('Erro ao limpar backups expirados:', error);
      });

      schedule.nextRunAt = computeNextRunAt(schedule.hour, schedule.minute);
      schedule.updatedAt = new Date().toISOString();
      nextSchedules.push(schedule);
    } catch (error: any) {
      if (error?.code === '23503') {
        console.warn(
          `[BackupScheduler] Agenda removida após falha de FK para academia ${schedule.academyId}.`
        );
        continue;
      }

      console.error('Erro ao processar backup automático agendado:', error);
      // Defensive retry window: move to next planned run to avoid retry loop every minute.
      schedule.nextRunAt = computeNextRunAt(schedule.hour, schedule.minute);
      schedule.updatedAt = new Date().toISOString();
      nextSchedules.push(schedule);
    }
  }

  saveSchedules(nextSchedules);
};

export const runBackupSchedulerTick = async (): Promise<void> => {
  await processDueSchedules();
};

export const initializeBackupScheduler = (): void => {
  if (schedulerStarted) {
    return;
  }

  schedulerStarted = true;
  ensureScheduleStorage();
  setInterval(() => {
    processDueSchedules().catch((error) => {
      console.error('Erro no scheduler de backup:', error);
    });
  }, 60_000);
};