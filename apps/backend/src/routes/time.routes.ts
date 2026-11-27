import { Router, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, parse, HttpError } from '../lib/http.js';
import { publicUserSelect } from '../lib/auth.js';
import { wsManager } from '../lib/websocket.js';
import { recordActivity } from '../services/activity.service.js';
import { broadcastTask, topPosition } from '../services/task.service.js';

// Mounted at /workspaces/:workspaceId/time behind requireMember()
// Live time tracking: one running timer per user, visible to the whole team.
export const timeRouter = Router({ mergeParams: true });

const entryInclude = {
  user: { select: publicUserSelect },
  task: { select: { id: true, title: true, status: true } },
} as const;

export const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${Math.max(1, m)}m`;
};

const canWrite = (req: Request) => {
  if (req.membership!.role === 'VIEWER') throw new HttpError(403, 'Viewers cannot track time');
};

/** Stops the user's running timer (in any workspace) and tells that workspace. */
async function stopRunning(userId: string) {
  const running = await prisma.timeEntry.findFirst({ where: { userId, endedAt: null } });
  if (!running) return null;
  const entry = await prisma.timeEntry.update({
    where: { id: running.id },
    data: { endedAt: new Date() },
    include: entryInclude,
  });
  const seconds = (entry.endedAt!.getTime() - entry.startedAt.getTime()) / 1000;
  wsManager.toWorkspace(entry.workspaceId, 'TIMER_STOPPED', entry);
  if (entry.taskId) await broadcastTask(entry.workspaceId, entry.taskId);
  if (seconds >= 60) {
    await recordActivity({
      workspaceId: entry.workspaceId,
      actorId: userId,
      type: 'TIMER_STOPPED',
      summary: `logged ${formatDuration(seconds)}${entry.task ? ` on "${entry.task.title}"` : ''}`,
      entityType: 'time',
      entityId: entry.id,
      metadata: { seconds: Math.round(seconds) },
    });
  }
  return entry;
}

// GET /time/active — everyone currently on the clock in this workspace
timeRouter.get(
  '/active',
  asyncHandler(async (req, res) => {
    const data = await prisma.timeEntry.findMany({
      where: { workspaceId: req.membership!.workspaceId, endedAt: null },
      include: entryInclude,
      orderBy: { startedAt: 'asc' },
    });
    res.json({ success: true, data });
  })
);

// POST /time/start { taskId?, note? }
timeRouter.post(
  '/start',
  asyncHandler(async (req, res) => {
    canWrite(req);
    const body = parse(
      z.object({ taskId: z.string().uuid().nullable().optional(), note: z.string().trim().max(200).optional() }),
      req.body
    );
    const workspaceId = req.membership!.workspaceId;
    const task = body.taskId ? await prisma.task.findFirst({ where: { id: body.taskId, workspaceId } }) : null;
    if (body.taskId && !task) throw new HttpError(404, 'Task not found');

    await stopRunning(req.userId!);

    // Starting work on a To Do card means it's in progress — do that for the user.
    if (task && task.status === 'TODO') {
      await prisma.task.update({
        where: { id: task.id },
        data: { status: 'IN_PROGRESS', position: await topPosition(workspaceId, 'IN_PROGRESS') },
      });
    }

    const entry = await prisma.timeEntry.create({
      data: { userId: req.userId!, workspaceId, taskId: task?.id ?? null, note: body.note, startedAt: new Date() },
      include: entryInclude,
    });
    wsManager.toWorkspace(workspaceId, 'TIMER_STARTED', entry);
    if (task) await broadcastTask(workspaceId, task.id);
    await recordActivity({
      workspaceId,
      actorId: req.userId!,
      type: 'TIMER_STARTED',
      summary: task ? `started working on "${task.title}"` : `started a focus session${body.note ? `: ${body.note}` : ''}`,
      entityType: 'time',
      entityId: entry.id,
    });
    res.status(201).json({ success: true, data: entry });
  })
);

// POST /time/stop
timeRouter.post(
  '/stop',
  asyncHandler(async (req, res) => {
    const entry = await stopRunning(req.userId!);
    res.json({ success: true, data: entry });
  })
);

// GET /time/entries?from&to&userId
timeRouter.get(
  '/entries',
  asyncHandler(async (req, res) => {
    const q = parse(
      z.object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        userId: z.string().uuid().optional(),
      }),
      req.query
    );
    const from = q.from ? new Date(q.from) : new Date(Date.now() - 7 * 86_400_000);
    const to = q.to ? new Date(q.to) : new Date();
    const data = await prisma.timeEntry.findMany({
      where: {
        workspaceId: req.membership!.workspaceId,
        ...(q.userId && { userId: q.userId }),
        startedAt: { lt: to },
        OR: [{ endedAt: null }, { endedAt: { gt: from } }],
      },
      include: entryInclude,
      orderBy: { startedAt: 'desc' },
      take: 1000,
    });
    res.json({ success: true, data });
  })
);

// POST /time/entries { taskId?, startedAt, minutes, note? } — log time after the fact
timeRouter.post(
  '/entries',
  asyncHandler(async (req, res) => {
    canWrite(req);
    const body = parse(
      z.object({
        taskId: z.string().uuid().nullable().optional(),
        startedAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),
        minutes: z.coerce.number().int().min(1, 'At least 1 minute').max(24 * 60, 'At most 24 hours'),
        note: z.string().trim().max(200).optional(),
      }),
      req.body
    );
    const workspaceId = req.membership!.workspaceId;
    const task = body.taskId ? await prisma.task.findFirst({ where: { id: body.taskId, workspaceId } }) : null;
    if (body.taskId && !task) throw new HttpError(404, 'Task not found');
    const startedAt = new Date(body.startedAt);
    if (startedAt.getTime() > Date.now()) throw new HttpError(400, 'Time can only be logged for the past');

    const entry = await prisma.timeEntry.create({
      data: {
        userId: req.userId!,
        workspaceId,
        taskId: task?.id ?? null,
        note: body.note,
        manual: true,
        startedAt,
        endedAt: new Date(startedAt.getTime() + body.minutes * 60_000),
      },
      include: entryInclude,
    });
    wsManager.toWorkspace(workspaceId, 'TIME_ENTRY_CREATED', entry);
    if (task) await broadcastTask(workspaceId, task.id);
    await recordActivity({
      workspaceId,
      actorId: req.userId!,
      type: 'TIME_LOGGED',
      summary: `logged ${formatDuration(body.minutes * 60)}${task ? ` on "${task.title}"` : ''}`,
      entityType: 'time',
      entityId: entry.id,
      metadata: { seconds: body.minutes * 60 },
    });
    res.status(201).json({ success: true, data: entry });
  })
);

// DELETE /time/entries/:entryId — your own entries (admins: anyone's)
timeRouter.delete(
  '/entries/:entryId',
  asyncHandler(async (req, res) => {
    const workspaceId = req.membership!.workspaceId;
    const entry = await prisma.timeEntry.findFirst({ where: { id: String(req.params.entryId), workspaceId } });
    if (!entry) throw new HttpError(404, 'Time entry not found');
    const isAdmin = req.membership!.role === 'OWNER' || req.membership!.role === 'ADMIN';
    if (entry.userId !== req.userId && !isAdmin) throw new HttpError(403, 'You can only delete your own time');
    await prisma.timeEntry.delete({ where: { id: entry.id } });
    wsManager.toWorkspace(workspaceId, 'TIME_ENTRY_DELETED', { id: entry.id, userId: entry.userId, running: !entry.endedAt });
    if (entry.taskId) await broadcastTask(workspaceId, entry.taskId);
    res.json({ success: true, data: { id: entry.id } });
  })
);
