import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { wsManager } from '../lib/websocket.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'healthy';
  let dbLatencyMs: number | null = null;

  try {
    const start = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Math.round(performance.now() - start);
  } catch (error) {
    dbStatus = 'disconnected (run db:migrate to initialize PostgreSQL)';
  }

  res.status(200).json({
    status: 'ok',
    service: 'syncro-backend',
    version: '0.1.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    realtime: {
      connectedClients: wsManager.getConnectedCount(),
      protocol: 'ws',
      endpoint: '/ws',
    },
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    system: {
      nodeVersion: process.version,
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  });
});
