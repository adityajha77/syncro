import { Router, Request } from 'express';
import { z } from 'zod';
import { TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, parse, HttpError } from '../lib/http.js';
import { publicUserSelect } from '../lib/auth.js';
import { wsManager } from '../lib/websocket.js';
import { recordActivity } from '../services/activity.service.js';
import { broadcastTask, loadTask, serializeTasks, taskInclude, topPosition } from '../services/task.service.js';

// Mounted at /workspaces/:workspaceId/tasks behind requireMember()
export const tasksRouter = Router({ mergeParams: true });

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
};

const canWrite = (req: Request) => {
  if (req.membership!.role === 'VIEWER') throw new HttpError(403, 'Viewers cannot modify tasks');
};

const dateInput = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date')
  .transform((v) => new Date(v));

const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(5000).optional(),
  status: z.nativeEnum(TaskStatus).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: dateInput.nullable().optional(),
  label: z.string().trim().max(60).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  estimateMinutes: z.coerce.number().int().min(0).max(100_000).nullable().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

async function assertAssigneeIsMember(workspaceId: string, assigneeId?: string | null) {
  if (!assigneeId) return;
  const m = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: assigneeId, workspaceId } },
  });
  if (!m) throw new HttpError(400, 'Assignee is not a member of this workspace');
}

async function findTask(req: Request) {
  const task = await prisma.task.findFirst({
    where: { id: String(req.params.taskId), workspaceId: req.membership!.workspaceId },
  });
  if (!task) throw new HttpError(404, 'Task not found');
  return task;
}

async function logStatusChange(req: Request, task: { id: string; title: string; status: TaskStatus }, from: TaskStatus) {
  await recordActivity({
    workspaceId: req.membership!.workspaceId,
    actorId: req.userId!,
    type: task.status === 'DONE' ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED',
    summary:
      task.status === 'DONE'
        ? `completed task "${task.title}"`
        : `moved "${task.title}" from ${STATUS_LABEL[from]} to ${STATUS_LABEL[task.status]}`,
    entityType: 'task',
    entityId: task.id,
    metadata: { from, to: task.status },
  });
}

// GET /tasks?status=TODO&overdue=true
tasksRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = parse(
      z.object({ status: z.nativeEnum(TaskStatus).optional(), overdue: z.enum(['true', 'false']).optional() }),
      req.query
    );
    const rows = await prisma.task.findMany({
      where: {
        workspaceId: req.membership!.workspaceId,
        ...(q.status && { status: q.status }),
        ...(q.overdue === 'true' && { status: { not: 'DONE' }, dueDate: { lt: new Date() } }),
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      include: taskInclude,
    });
    res.json({ success: true, data: await serializeTasks(rows) });
  })
);

// POST /tasks
tasksRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    canWrite(req);
    const body = parse(createTaskSchema, req.body);
    const workspaceId = req.membership!.workspaceId;
    // Default assignee is the creator, matching the dashboard's behaviour.
    const assigneeId = body.assigneeId === undefined ? req.userId! : body.assigneeId;
    await assertAssigneeIsMember(workspaceId, assigneeId);

    const created = await prisma.task.create({
      data: {
        ...body,
        assigneeId,
        workspaceId,
        position: await topPosition(workspaceId, body.status),
        createdById: req.userId!,
        completedAt: body.status === 'DONE' ? new Date() : null,
      },
    });
    const task = (await loadTask(created.id))!;

    wsManager.toWorkspace(workspaceId, 'TASK_CREATED', task);
    await recordActivity({
      workspaceId,
      actorId: req.userId!,
      type: 'TASK_CREATED',
      summary: `created task "${task.title}"`,
      entityType: 'task',
      entityId: task.id,
      metadata: { priority: task.priority },
    });
    res.status(201).json({ success: true, data: task });
  })
);

// GET /tasks/:taskId — full card: checklist, comments, time log, meetings
tasksRouter.get(
  '/:taskId',
  asyncHandler(async (req, res) => {
    const t = await findTask(req);
    const [task, checklist, comments, timeEntries, meetings] = await Promise.all([
      loadTask(t.id),
      prisma.checklistItem.findMany({ where: { taskId: t.id }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] }),
      prisma.taskComment.findMany({
        where: { taskId: t.id },
        orderBy: { createdAt: 'asc' },
        include: { author: { select: publicUserSelect } },
      }),
      prisma.timeEntry.findMany({
        where: { taskId: t.id },
        orderBy: { startedAt: 'desc' },
        take: 50,
        include: { user: { select: publicUserSelect } },
      }),
      prisma.meeting.findMany({ where: { taskId: t.id }, orderBy: { startsAt: 'desc' }, take: 10 }),
    ]);
    res.json({ success: true, data: { ...task, checklist, comments, timeEntries, meetings } });
  })
);

// PATCH /tasks/:taskId
tasksRouter.patch(
  '/:taskId',
  asyncHandler(async (req, res) => {
    canWrite(req);
    const body = parse(updateTaskSchema, req.body);
    const workspaceId = req.membership!.workspaceId;
    const before = await findTask(req);
    await assertAssigneeIsMember(workspaceId, body.assigneeId);

    const statusChanged = body.status !== undefined && body.status !== before.status;
    await prisma.task.update({
      where: { id: before.id },
      data: {
        ...body,
        ...(statusChanged && {
          completedAt: body.status === 'DONE' ? new Date() : null,
          position: await topPosition(workspaceId, body.status),
        }),
      },
    });
    const task = (await broadcastTask(workspaceId, before.id))!;

    if (statusChanged) {
      await logStatusChange(req, task, before.status);
    } else {
      const changed = Object.keys(body).filter((k) => k !== 'status');
      if (changed.length) {
        await recordActivity({
          workspaceId,
          actorId: req.userId!,
          type: 'TASK_UPDATED',
          summary: `updated ${changed.join(', ')} on "${task.title}"`,
          entityType: 'task',
          entityId: task.id,
          metadata: { fields: changed },
        });
      }
    }
    res.json({ success: true, data: task });
  })
);

// POST /tasks/:taskId/move { status, index } — drag & drop on the board.
// Re-numbers the destination column so ordering stays stable for everyone.
tasksRouter.post(
  '/:taskId/move',
  asyncHandler(async (req, res) => {
    canWrite(req);
    const body = parse(z.object({ status: z.nativeEnum(TaskStatus), index: z.number().int().min(0) }), req.body);
    const workspaceId = req.membership!.workspaceId;
    const before = await findTask(req);

    const column = await prisma.task.findMany({
      where: { workspaceId, status: body.status, id: { not: before.id } },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      select: { id: true },
    });
    const ids = column.map((c) => c.id);
    ids.splice(Math.min(body.index, ids.length), 0, before.id);

    const statusChanged = body.status !== before.status;
    await prisma.$transaction(
      ids.map((id, i) =>
        prisma.task.update({
          where: { id },
          data: {
            position: i * 1024,
            ...(id === before.id &&
              statusChanged && { status: body.status, completedAt: body.status === 'DONE' ? new Date() : null }),
          },
        })
      )
    );

    const task = (await loadTask(before.id))!;
    wsManager.toWorkspace(workspaceId, 'TASK_MOVED', {
      task,
      order: ids.map((id, i) => ({ id, position: i * 1024 })),
    });
    if (statusChanged) await logStatusChange(req, task, before.status);
    res.json({ success: true, data: task });
  })
);

// DELETE /tasks/:taskId
tasksRouter.delete(
  '/:taskId',
  asyncHandler(async (req, res) => {
    canWrite(req);
    const workspaceId = req.membership!.workspaceId;
    const task = await findTask(req);
    await prisma.task.delete({ where: { id: task.id } });

    wsManager.toWorkspace(workspaceId, 'TASK_DELETED', { id: task.id });
    await recordActivity({
      workspaceId,
      actorId: req.userId!,
      type: 'TASK_DELETED',
      summary: `deleted task "${task.title}"`,
      entityType: 'task',
      entityId: task.id,
    });
    res.json({ success: true, data: { id: task.id } });
  })
);

// ---------------- checklist ----------------
const broadcastDetail = (workspaceId: string, taskId: string) =>
  wsManager.toWorkspace(workspaceId, 'TASK_DETAIL_CHANGED', { taskId });

tasksRouter.post(
  '/:taskId/checklist',
  asyncHandler(async (req, res) => {
    canWrite(req);
    const body = parse(z.object({ text: z.string().trim().min(1, 'Item text is required').max(300) }), req.body);
    const task = await findTask(req);
    const last = await prisma.checklistItem.findFirst({ where: { taskId: task.id }, orderBy: { position: 'desc' } });
    const item = await prisma.checklistItem.create({
      data: { taskId: task.id, text: body.text, position: (last?.position ?? 0) + 1024 },
    });
    await broadcastTask(task.workspaceId, task.id);
    broadcastDetail(task.workspaceId, task.id);
    res.status(201).json({ success: true, data: item });
  })
);

tasksRouter.patch(
  '/:taskId/checklist/:itemId',
  asyncHandler(async (req, res) => {
    canWrite(req);
    const body = parse(z.object({ text: z.string().trim().min(1).max(300).optional(), done: z.boolean().optional() }), req.body);
    const task = await findTask(req);
    const existing = await prisma.checklistItem.findFirst({ where: { id: String(req.params.itemId), taskId: task.id } });
    if (!existing) throw new HttpError(404, 'Checklist item not found');
    const item = await prisma.checklistItem.update({ where: { id: existing.id }, data: body });

    const card = await broadcastTask(task.workspaceId, task.id);
    broadcastDetail(task.workspaceId, task.id);
    // Log the satisfying moment: the whole checklist got ticked off.
    if (body.done && card && card.checklistTotal > 0 && card.checklistDone === card.checklistTotal) {
      await recordActivity({
        workspaceId: task.workspaceId,
        actorId: req.userId!,
        type: 'CHECKLIST_UPDATED',
        summary: `finished the checklist on "${task.title}"`,
        entityType: 'task',
        entityId: task.id,
      });
    }
    res.json({ success: true, data: item });
  })
);

tasksRouter.delete(
  '/:taskId/checklist/:itemId',
  asyncHandler(async (req, res) => {
    canWrite(req);
    const task = await findTask(req);
    const { count } = await prisma.checklistItem.deleteMany({ where: { id: String(req.params.itemId), taskId: task.id } });
    if (!count) throw new HttpError(404, 'Checklist item not found');
    await broadcastTask(task.workspaceId, task.id);
    broadcastDetail(task.workspaceId, task.id);
    res.json({ success: true, data: { id: req.params.itemId } });
  })
);

// ---------------- comments ----------------
tasksRouter.post(
  '/:taskId/comments',
  asyncHandler(async (req, res) => {
    // Viewers may comment: discussion is how they take part.
    const body = parse(z.object({ body: z.string().trim().min(1, 'Comment cannot be empty').max(5000) }), req.body);
    const task = await findTask(req);
    const comment = await prisma.taskComment.create({
      data: { taskId: task.id, authorId: req.userId!, body: body.body },
      include: { author: { select: publicUserSelect } },
    });
    await broadcastTask(task.workspaceId, task.id);
    broadcastDetail(task.workspaceId, task.id);
    await recordActivity({
      workspaceId: task.workspaceId,
      actorId: req.userId!,
      type: 'COMMENT_ADDED',
      summary: `commented on "${task.title}"`,
      entityType: 'task',
      entityId: task.id,
      metadata: { preview: body.body.slice(0, 120) },
    });
    res.status(201).json({ success: true, data: comment });
  })
);

tasksRouter.delete(
  '/:taskId/comments/:commentId',
  asyncHandler(async (req, res) => {
    const task = await findTask(req);
    const comment = await prisma.taskComment.findFirst({ where: { id: String(req.params.commentId), taskId: task.id } });
    if (!comment) throw new HttpError(404, 'Comment not found');
    const isAdmin = req.membership!.role === 'OWNER' || req.membership!.role === 'ADMIN';
    if (comment.authorId !== req.userId && !isAdmin) throw new HttpError(403, 'You can only delete your own comments');
    await prisma.taskComment.delete({ where: { id: comment.id } });
    await broadcastTask(task.workspaceId, task.id);
    broadcastDetail(task.workspaceId, task.id);
    res.json({ success: true, data: { id: comment.id } });
  })
);
