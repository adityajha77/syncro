import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt } from 'crypto';
import { config } from '../config.js';

/**
 * AES-256-GCM encryption for secrets at rest (OAuth access/refresh tokens).
 * Output format: base64(iv).base64(authTag).base64(ciphertext)
 */
function resolveKey(): Buffer {
  const raw = config.tokenEncryptionKey;
  if (raw) {
    const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
    if (key.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes');
    return key;
  }
  // Development fallback: derive from the JWT secret (config.ts refuses this in production).
  console.warn('[crypto] TOKEN_ENCRYPTION_KEY not set — deriving a dev key from JWT_SECRET.');
  return createHash('sha256').update(`syncro-token-key:${config.jwtSecret}`).digest();
}

let cachedKey: Buffer | null = null;
const key = () => (cachedKey ??= resolveKey());

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}

export function decryptSecret(payload: string): string {
  const [iv, tag, enc] = payload.split('.').map((p) => Buffer.from(p, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

// Unambiguous alphabet (no 0/O, 1/I/L) so codes are easy to read aloud and type.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Generates an invite code like `K7QX-M2PA`. */
export function generateInviteCode(): string {
  const pick = () => Array.from({ length: 4 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
  return `${pick()}-${pick()}`;
}

/** Normalizes user input: case-insensitive, tolerates missing dash/spaces. */
export function normalizeInviteCode(input: string): string {
  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return clean.length === 8 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}
