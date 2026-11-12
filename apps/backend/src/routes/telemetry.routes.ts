import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/http.js';
import { wsManager } from '../lib/websocket.js';

// Mounted at /workspaces/:workspaceId/telemetry behind requireMember()
// Pillar 3 (basic): workspace health computed from live data.
export const telemetryRouter = Router({ mergeParams: true });

telemetryRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const workspaceId = req.membership!.workspaceId;
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86_400_000);

    const dbStart = performance.now();
    const [byStatus, overdue, completedLast24h, commitsLast24h, activityLast24h] = await Promise.all([
      prisma.task.groupBy({ by: ['status'], where: { workspaceId }, _count: true }),
      prisma.task.count({ where: { workspaceId, status: { not: 'DONE' }, dueDate: { lt: now } } }),
      prisma.task.count({ where: { workspaceId, completedAt: { gte: dayAgo } } }),
      prisma.commit.count({ where: { workspaceId, committedAt: { gte: dayAgo } } }),
      prisma.activityRecord.count({ where: { workspaceId, createdAt: { gte: dayAgo } } }),
    ]);
    const dbLatencyMs = Math.round(performance.now() - dbStart);

    const count = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;
    const total = byStatus.reduce((n, b) => n + b._count, 0);
    const done = count('DONE');
    const completionRate = total ? Math.round((done / total) * 100) : 0;
    // Keep in sync with WorkspaceApp: on-time share weighs 70%, completion 30%.
    // A fresh board with nothing late is healthy (70); overdue work drags it down.
    const healthScore = total ? Math.round((1 - overdue / total) * 70 + completionRate * 0.3) : 100;

    res.json({
      success: true,
      data: {
        tasks: { total, todo: count('TODO'), inProgress: count('IN_PROGRESS'), done, overdue, completedLast24h },
        completionRate,
        healthScore,
        commitsLast24h,
        activityLast24h,
        onlineMembers: wsManager.getPresence(workspaceId).length,
        dbLatencyMs,
        generatedAt: now.toISOString(),
      },
    });
  })
);
