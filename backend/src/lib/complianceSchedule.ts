import fs from 'fs';
import path from 'path';
import { generateAndStoreComplianceReport } from './complianceReports';

export interface ComplianceScheduleConfig {
  academyId: string;
  generatedBy: string;
  frequency: 'monthly';
  dayOfMonth: number;
  hour: number;
  minute: number;
  enabled: boolean;
  nextRunAt: string;
  updatedAt: string;
}

const scheduleFilePath = path.resolve(process.cwd(), 'storage', 'compliance-report-schedules.json');
let schedulerStarted = false;

const ensureScheduleStorage = (): void => {
  const dir = path.dirname(scheduleFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(scheduleFilePath)) {
    fs.writeFileSync(scheduleFilePath, '[]', 'utf-8');
  }
};

const loadSchedules = (): ComplianceScheduleConfig[] => {
  ensureScheduleStorage();
  return JSON.parse(fs.readFileSync(scheduleFilePath, 'utf-8')) as ComplianceScheduleConfig[];
};

const saveSchedules = (items: ComplianceScheduleConfig[]): void => {
  ensureScheduleStorage();
  fs.writeFileSync(scheduleFilePath, JSON.stringify(items, null, 2), 'utf-8');
};

const computeNextRunAt = (dayOfMonth: number, hour: number, minute: number): string => {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, hour, minute, 0, 0);
  if (next <= now) {
    next.setMonth(next.getMonth() + 1);
  }
  return next.toISOString();
};

export const listComplianceSchedules = (): ComplianceScheduleConfig[] => loadSchedules();

export const getComplianceSchedule = (academyId: string): ComplianceScheduleConfig | null => {
  return loadSchedules().find((item) => item.academyId === academyId) || null;
};

export const upsertComplianceSchedule = (input: {
  academyId: string;
  generatedBy: string;
  dayOfMonth: number;
  hour: number;
  minute: number;
  enabled: boolean;
}): ComplianceScheduleConfig => {
  const items = loadSchedules();
  const nextItem: ComplianceScheduleConfig = {
    academyId: input.academyId,
    generatedBy: input.generatedBy,
    frequency: 'monthly',
    dayOfMonth: input.dayOfMonth,
    hour: input.hour,
    minute: input.minute,
    enabled: input.enabled,
    nextRunAt: computeNextRunAt(input.dayOfMonth, input.hour, input.minute),
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

  for (const schedule of schedules) {
    if (!schedule.enabled || new Date(schedule.nextRunAt) > now) {
      continue;
    }

    await generateAndStoreComplianceReport({
      academyId: schedule.academyId,
      generatedBy: schedule.generatedBy,
      trigger: 'scheduled',
      options: {
        format: 'pdf',
        periodPreset: 'current-month',
        signDigital: true,
      },
    }).catch((error) => {
      console.error('Erro ao gerar relatório agendado de conformidade:', error);
    });

    schedule.nextRunAt = computeNextRunAt(schedule.dayOfMonth, schedule.hour, schedule.minute);
    schedule.updatedAt = new Date().toISOString();
  }

  saveSchedules(schedules);
};

export const initializeComplianceScheduler = (): void => {
  if (schedulerStarted) {
    return;
  }

  schedulerStarted = true;
  ensureScheduleStorage();
  setInterval(() => {
    processDueSchedules().catch((error) => {
      console.error('Erro no scheduler de conformidade LGPD:', error);
    });
  }, 60_000);
};
