import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env['DATA_ENCRYPTION_KEY'];
  if (!key || key.length !== 64) {
    throw new Error(
      'DATA_ENCRYPTION_KEY deve ter 64 caracteres hexadecimais (256 bits)'
    );
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a Buffer with layout: [IV (16 bytes)] + [AuthTag (16 bytes)] + [Ciphertext]
 */
export const encryptField = (plaintext: string): Buffer => {
  const iv = randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
};

/**
 * Decrypts a Buffer produced by encryptField.
 * Verifies the GCM auth tag — throws if data is tampered.
 */
export const decryptField = (data: Buffer): string => {
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
};

/** Encrypts if value is non-empty, otherwise returns null. */
export const encryptOrNull = (value: string | undefined | null): Buffer | null => {
  if (!value) return null;
  return encryptField(value);
};

/** Decrypts if Buffer is present, otherwise returns null. */
export const decryptOrNull = (data: Buffer | null | undefined): string | null => {
  if (!data) return null;
  return decryptField(data);
};
