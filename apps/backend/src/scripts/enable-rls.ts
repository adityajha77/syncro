/**
 * Enables Row Level Security on every table in the public schema.
 *
 * Supabase exposes `public` tables through its REST/GraphQL Data API using the
 * (public) publishable/anon key. With RLS on and no policies, those APIs can't
 * read or write anything. Our backend connects as the `postgres` owner role,
 * which bypasses RLS, so the app is unaffected.
 *
 * Run after `db:push` on any new database:  npm run db:secure
 */
import { prisma } from '../lib/prisma.js';

async function main() {
  const tables: { relname: string }[] = await prisma.$queryRaw`
    SELECT relname FROM pg_class
    WHERE relnamespace = 'public'::regnamespace AND relkind = 'r' AND NOT relrowsecurity`;

  for (const { relname } of tables) {
    await prisma.$executeRawUnsafe(`ALTER TABLE public."${relname.replace(/"/g, '""')}" ENABLE ROW LEVEL SECURITY`);
    console.log(`RLS enabled: ${relname}`);
  }
  console.log(tables.length ? 'Done.' : 'All public tables already have RLS enabled.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
