import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';

export interface TokenPayload {
  sub: string; // user id
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId } satisfies TokenPayload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (typeof decoded === 'object' && typeof decoded.sub === 'string') {
      return { sub: decoded.sub };
    }
    return null;
  } catch {
    return null;
  }
}

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/** Public shape of a user — never leak passwordHash. */
export const publicUserSelect = { id: true, email: true, name: true, createdAt: true } as const;
