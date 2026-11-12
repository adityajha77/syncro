import { Router, Request } from 'express';
import { z } from 'zod';
import { TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, parse, HttpError } from '../lib/http.js';
import { publicUserSelect } from '../lib/auth.js';
import { wsManager } from '../lib/websocket.js';
import { recordActivity } from '../services/activity.service.js';

// Mounted at /workspaces/:workspaceId/tasks behind requireMember()
export const tasksRouter = Router({ mergeParams: true });

const taskInclude = {
  assignee: { select: publicUserSelect },
  createdBy: { select: publicUserSelect },
} as const;

const STATUS_LABEL: Record<TaskStatus, string> = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };

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
});

const updateTaskSchema = createTaskSchema.partial();

async function assertAssigneeIsMember(workspaceId: string, assigneeId?: string | null) {
  if (!assigneeId) return;
  const m = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: assigneeId, workspaceId } },
  });
  if (!m) throw new HttpError(400, 'Assignee is not a member of this workspace');
}

// GET /tasks?status=TODO&overdue=true
tasksRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = parse(
      z.object({ status: z.nativeEnum(TaskStatus).optional(), overdue: z.enum(['true', 'false']).optional() }),
      req.query
    );
    const tasks = await prisma.task.findMany({
      where: {
        workspaceId: req.membership!.workspaceId,
        ...(q.status && { status: q.status }),
        ...(q.overdue === 'true' && { status: { not: 'DONE' }, dueDate: { lt: new Date() } }),
      },
      orderBy: [{ createdAt: 'desc' }],
      include: taskInclude,
    });
    res.json({ success: true, data: tasks });
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

    const task = await prisma.task.create({
      data: {
        ...body,
        assigneeId,
        workspaceId,
        createdById: req.userId!,
        completedAt: body.status === 'DONE' ? new Date() : null,
      },
      include: taskInclude,
    });

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

// PATCH /tasks/:taskId
tasksRouter.patch(
  '/:taskId',
  asyncHandler(async (req, res) => {
    canWrite(req);
    const body = parse(updateTaskSchema, req.body);
    const workspaceId = req.membership!.workspaceId;
    const before = await prisma.task.findFirst({ where: { id: String(req.params.taskId), workspaceId } });
    if (!before) throw new HttpError(404, 'Task not found');
    await assertAssigneeIsMember(workspaceId, body.assigneeId);

    const statusChanged = body.status !== undefined && body.status !== before.status;
    const task = await prisma.task.update({
      where: { id: before.id },
      data: {
        ...body,
        ...(statusChanged && { completedAt: body.status === 'DONE' ? new Date() : null }),
      },
      include: taskInclude,
    });

    wsManager.toWorkspace(workspaceId, 'TASK_UPDATED', task);

    if (statusChanged) {
      await recordActivity({
        workspaceId,
        actorId: req.userId!,
        type: task.status === 'DONE' ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED',
        summary:
          task.status === 'DONE'
            ? `completed task "${task.title}"`
            : `moved "${task.title}" from ${STATUS_LABEL[before.status]} to ${STATUS_LABEL[task.status]}`,
        entityType: 'task',
        entityId: task.id,
        metadata: { from: before.status, to: task.status },
      });
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

// DELETE /tasks/:taskId
tasksRouter.delete(
  '/:taskId',
  asyncHandler(async (req, res) => {
    canWrite(req);
    const workspaceId = req.membership!.workspaceId;
    const task = await prisma.task.findFirst({ where: { id: String(req.params.taskId), workspaceId } });
    if (!task) throw new HttpError(404, 'Task not found');
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
