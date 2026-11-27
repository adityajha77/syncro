import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { publicUserSelect } from '../lib/auth.js';
import { wsManager } from '../lib/websocket.js';

/**
 * Board cards carry lightweight stats so the Kanban can show checklist
 * progress, comment counts and tracked time without opening each task.
 */
export const taskInclude = {
  assignee: { select: publicUserSelect },
  createdBy: { select: publicUserSelect },
  checklist: { select: { done: true } },
  _count: { select: { comments: true } },
} as const;

type TaskRow = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

/** Seconds of *finished* time entries per task (running timers are added live by the client). */
async function trackedSecondsByTask(taskIds: string[]): Promise<Map<string, number>> {
  if (!taskIds.length) return new Map();
  const rows = await prisma.$queryRaw<{ taskId: string; seconds: number }[]>`
    SELECT "taskId", COALESCE(SUM(EXTRACT(EPOCH FROM ("endedAt" - "startedAt"))), 0)::float AS seconds
    FROM time_entries
    WHERE "taskId" IN (${Prisma.join(taskIds)}) AND "endedAt" IS NOT NULL
    GROUP BY "taskId"`;
  return new Map(rows.map((r) => [r.taskId, Math.round(Number(r.seconds))]));
}

export async function serializeTasks(rows: TaskRow[]) {
  const tracked = await trackedSecondsByTask(rows.map((t) => t.id));
  return rows.map(({ checklist, _count, ...t }) => ({
    ...t,
    checklistTotal: checklist.length,
    checklistDone: checklist.filter((c) => c.done).length,
    commentCount: _count.comments,
    trackedSeconds: tracked.get(t.id) ?? 0,
  }));
}

export async function loadTask(taskId: string) {
  const row = await prisma.task.findUnique({ where: { id: taskId }, include: taskInclude });
  if (!row) return null;
  return (await serializeTasks([row]))[0];
}

/** Re-reads a task and pushes the fresh card to everyone in the workspace. */
export async function broadcastTask(workspaceId: string, taskId: string) {
  const task = await loadTask(taskId);
  if (task) wsManager.toWorkspace(workspaceId, 'TASK_UPDATED', task);
  return task;
}

/** Position that puts a card at the top of a column. */
export async function topPosition(workspaceId: string, status: Prisma.TaskWhereInput['status']) {
  const first = await prisma.task.findFirst({ where: { workspaceId, status }, orderBy: { position: 'asc' }, select: { position: true } });
  return (first?.position ?? 1024) - 1024;
}
