/**
 * Rebuilds the demo workspace (4 teammates, a full board, a week of tracked
 * time, live timers, meetings, comments).  npm run db:seed-demo
 *
 * Sign in to it with the "Try the live demo" button on /login
 * (requires DEMO_LOGIN=true in apps/backend/.env).
 */
import { seedDemoWorkspace } from '../services/demo.service.js';
import { prisma } from '../lib/prisma.js';

seedDemoWorkspace()
  .then((r) => console.log(`Demo workspace ready: ${r.workspaceId}`))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
