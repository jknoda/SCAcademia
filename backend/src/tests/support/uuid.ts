import { randomUUID } from 'crypto';

// Jest runs in CommonJS mode in this project; this shim avoids ESM parse issues from uuid.
export const v4 = (): string => randomUUID();
