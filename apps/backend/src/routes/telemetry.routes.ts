import { Router } from 'express';
import { z } from 'zod';
import { publicUserSelect } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, parse } from '../lib/http.js';
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
        tasks: { total, todo: count('TODO'), inProgress: count('IN_PROGRESS'), review: count('REVIEW'), done, overdue, completedLast24h },
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

/** Seconds of finished entries overlapping [from, now). Running timers are ticked live by the client. */
const finishedSecondsSince = (entries: { startedAt: Date; endedAt: Date | null }[], from: Date) =>
  Math.round(
    entries.reduce((sum, e) => {
      if (!e.endedAt) return sum;
      const start = Math.max(e.startedAt.getTime(), from.getTime());
      return sum + Math.max(0, e.endedAt.getTime() - start) / 1000;
    }, 0)
  );

/**
 * GET /telemetry/team?dayStart&weekStart — the live "who is doing what" view
 * plus an autonomous standup (Pillar 4) per member, all derived from real data.
 * The client passes its local midnight / week start so "today" matches the user.
 */
telemetryRouter.get(
  '/team',
  asyncHandler(async (req, res) => {
    const workspaceId = req.membership!.workspaceId;
    const now = new Date();
    const q = parse(z.object({ dayStart: z.string().datetime().optional(), weekStart: z.string().datetime().optional() }), req.query);
    const dayStart = q.dayStart ? new Date(q.dayStart) : new Date(now.getTime() - 86_400_000);
    const weekStart = q.weekStart ? new Date(q.weekStart) : new Date(now.getTime() - 7 * 86_400_000);
    const since24h = new Date(now.getTime() - 86_400_000);
    const earliest = weekStart < since24h ? weekStart : since24h;

    const [members, tasks, entries, commits] = await Promise.all([
      prisma.workspaceMember.findMany({
        where: { workspaceId },
        include: { user: { select: publicUserSelect } },
        orderBy: { joinedAt: 'asc' },
      }),
      prisma.task.findMany({
        where: { workspaceId, assigneeId: { not: null } },
        select: { id: true, title: true, status: true, priority: true, dueDate: true, completedAt: true, assigneeId: true },
      }),
      prisma.timeEntry.findMany({
        where: { workspaceId, OR: [{ endedAt: null }, { endedAt: { gt: earliest } }] },
        include: { task: { select: { id: true, title: true, status: true } } },
      }),
      prisma.commit.groupBy({ by: ['authorId'], where: { workspaceId, committedAt: { gte: since24h } }, _count: true }),
    ]);
    const online = new Set(wsManager.getPresence(workspaceId).map((p) => p.userId));

    const data = members.map((m) => {
      const mine = tasks.filter((t) => t.assigneeId === m.userId);
      const myEntries = entries.filter((e) => e.userId === m.userId);
      const running = myEntries.find((e) => !e.endedAt) ?? null;
      const overdue = mine.filter((t) => t.status !== 'DONE' && t.dueDate && t.dueDate < now);
      const byStatus = (s: string) => mine.filter((t) => t.status === s);
      const pick = (list: typeof mine) => list.slice(0, 6).map((t) => ({ id: t.id, title: t.title, priority: t.priority }));
      return {
        user: m.user,
        role: m.role,
        online: online.has(m.userId),
        activeTimer: running && { id: running.id, startedAt: running.startedAt, note: running.note, task: running.task },
        todaySeconds: finishedSecondsSince(myEntries, dayStart),
        weekSeconds: finishedSecondsSince(myEntries, weekStart),
        counts: {
          todo: byStatus('TODO').length,
          inProgress: byStatus('IN_PROGRESS').length,
          review: byStatus('REVIEW').length,
          doneToday: mine.filter((t) => t.completedAt && t.completedAt >= dayStart).length,
          overdue: overdue.length,
        },
        standup: {
          done: pick(mine.filter((t) => t.completedAt && t.completedAt >= since24h)),
          doing: pick([...byStatus('IN_PROGRESS'), ...byStatus('REVIEW')]),
          next: pick(byStatus('TODO').sort((a, b) => (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity))),
          blockers: pick(overdue),
          trackedSeconds24h: finishedSecondsSince(myEntries, since24h),
          commits24h: commits.find((c) => c.authorId === m.userId)?._count ?? 0,
        },
      };
    });
    res.json({ success: true, data: { generatedAt: now.toISOString(), members: data } });
  })
);
