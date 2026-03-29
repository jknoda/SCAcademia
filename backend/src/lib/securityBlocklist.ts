import fs from 'fs';
import path from 'path';

type BlockedIpRecord = {
  academyId: string;
  ip: string;
  blockedAt: string;
  blockedByUserId: string;
  source: 'admin-alert';
  reason?: string;
};

const STORAGE_PATH = path.resolve(process.cwd(), 'storage', 'admin-ip-blocklist.json');

const ensureStorage = (): void => {
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(STORAGE_PATH)) {
    fs.writeFileSync(STORAGE_PATH, '[]', 'utf-8');
  }
};

const loadRecords = (): BlockedIpRecord[] => {
  ensureStorage();
  return JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf-8')) as BlockedIpRecord[];
};

const saveRecords = (records: BlockedIpRecord[]): void => {
  ensureStorage();
  fs.writeFileSync(STORAGE_PATH, JSON.stringify(records, null, 2), 'utf-8');
};

const normalizeIp = (ip: string): string => {
  const value = String(ip || '').trim();
  if (!value) {
    return '';
  }

  if (value.startsWith('::ffff:')) {
    return value.slice(7);
  }

  if (value === '::1') {
    return '127.0.0.1';
  }

  return value;
};

const isIpv4 = (ip: string): boolean => {
  const parts = ip.split('.');
  if (parts.length !== 4) {
    return false;
  }

  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      return false;
    }
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
};

export const findFirstIpv4 = (text: string): string | null => {
  const matches = String(text || '').match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || [];
  for (const match of matches) {
    if (isIpv4(match)) {
      return match;
    }
  }
  return null;
};

export const blockIpForAcademy = (input: {
  academyId: string;
  ip: string;
  blockedByUserId: string;
  reason?: string;
}): { blocked: boolean; ip: string } => {
  const ip = normalizeIp(input.ip);
  if (!ip || !isIpv4(ip)) {
    return { blocked: false, ip };
  }

  const records = loadRecords();
  const existing = records.find((record) => record.academyId === input.academyId && record.ip === ip);
  if (existing) {
    return { blocked: true, ip };
  }

  records.push({
    academyId: input.academyId,
    ip,
    blockedAt: new Date().toISOString(),
    blockedByUserId: input.blockedByUserId,
    source: 'admin-alert',
    reason: input.reason,
  });

  saveRecords(records);
  return { blocked: true, ip };
};

export const isIpBlockedForAcademy = (academyId: string, ip: string): boolean => {
  const normalized = normalizeIp(ip);
  if (!normalized) {
    return false;
  }

  const records = loadRecords();
  return records.some((record) => record.academyId === academyId && record.ip === normalized);
};
