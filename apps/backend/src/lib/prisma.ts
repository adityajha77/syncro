import '../config.js';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const rawUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/syncro?schema=public';

/**
 * TLS for hosted Postgres (Supabase etc).
 *
 * node-pg lets `sslmode` in the URL override the `ssl` option, so we strip it
 * and configure TLS explicitly:
 *   - DATABASE_SSL_CA=path/to/ca.crt → full certificate verification (use this in production;
 *     Supabase: Project Settings → Database → SSL Configuration → Download certificate)
 *   - no CA in development → encrypted but unverified, with a warning
 *   - no CA in production → strict verification against Node's trust store
 */
function buildPoolConfig(urlString: string): pg.PoolConfig {
  const url = new URL(urlString);
  const isLocal = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname);
  const sslmode = url.searchParams.get('sslmode');
  url.searchParams.delete('sslmode');
  url.searchParams.delete('schema'); // Prisma-only param, unknown to pg

  if (isLocal || sslmode === 'disable') {
    return { connectionString: url.toString() };
  }

  const caPath = process.env.DATABASE_SSL_CA;
  if (caPath) {
    return { connectionString: url.toString(), ssl: { ca: fs.readFileSync(caPath, 'utf8'), rejectUnauthorized: true } };
  }
  if (process.env.NODE_ENV === 'production') {
    return { connectionString: url.toString(), ssl: { rejectUnauthorized: true } };
  }
  console.warn(
    `[DB] TLS to ${url.hostname} is encrypted but the certificate is NOT verified. ` +
      'Set DATABASE_SSL_CA to the provider CA cert to enable verification.'
  );
  return { connectionString: url.toString(), ssl: { rejectUnauthorized: false } };
}

const pool = new pg.Pool({ ...buildPoolConfig(rawUrl), max: 10 });
const adapter = new PrismaPg(pool);

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

export const prisma =
  global.__prismaClient ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prismaClient = prisma;
}
