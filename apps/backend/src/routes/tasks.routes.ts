import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { wsManager } from '../lib/websocket.js';

export const tasksRouter = Router();

// In-memory fallback if Postgres is not yet provisioned locally
const memoryTasks = [
  {
    id: 't-1',
    title: 'Initialize Syncro Monorepo Architecture',
    description: 'Set up workspaces, Express backend, Prisma schema, and Vite React frontend',
    status: 'DONE',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    projectId: 'p-1',
    assigneeId: 'u-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-2',
    title: 'Configure Real-time WebSocket Protocol',
    description: 'Establish bidirectional event bus for workspace activity updates',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    dueDate: new Date(Date.now() + 172800000).toISOString(),
    projectId: 'p-1',
    assigneeId: 'u-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't-3',
    title: 'Design Unified Activity Timeline & Dashboard',
    description: 'Create responsive visual UI with metrics and workspace summary',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 259200000).toISOString(),
    projectId: 'p-1',
    assigneeId: 'u-2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /api/v1/tasks
tasksRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      include: { assignee: true, project: true },
    });
    res.json({ success: true, count: tasks.length, data: tasks, source: 'database' });
  } catch (error) {
    // Graceful fallback to memory store if DB is offline
    res.json({ success: true, count: memoryTasks.length, data: memoryTasks, source: 'fallback_store' });
  }
});

// POST /api/v1/tasks
tasksRouter.post('/', async (req: Request, res: Response) => {
  const { title, description, status = 'TODO', priority = 'MEDIUM', dueDate, projectId = 'p-1', assigneeId } = req.body;

  if (!title) {
    res.status(400).json({ success: false, error: 'Task title is required' });
    return;
  }

  try {
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
      },
      include: { assignee: true },
    });

    // Broadcast real-time event
    wsManager.broadcast('TASK_CREATED', newTask);

    res.status(201).json({ success: true, data: newTask, source: 'database' });
  } catch (error) {
    // In-memory fallback
    const fallbackTask = {
      id: `t-${Date.now()}`,
      title,
      description: description || null,
      status: status || 'TODO',
      priority: priority || 'MEDIUM',
      dueDate: dueDate || null,
      projectId,
      assigneeId: assigneeId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryTasks.unshift(fallbackTask);

    // Broadcast real-time event
    wsManager.broadcast('TASK_CREATED', fallbackTask);

    res.status(201).json({ success: true, data: fallbackTask, source: 'fallback_store' });
  }
});

// PATCH /api/v1/tasks/:id
tasksRouter.patch('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { status, title, description, priority } = req.body;

  try {
    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
      },
    });

    wsManager.broadcast('TASK_UPDATED', updated);
    res.json({ success: true, data: updated });
  } catch (error) {
    const taskIndex = memoryTasks.findIndex((t) => t.id === id);
    if (taskIndex !== -1) {
      memoryTasks[taskIndex] = {
        ...memoryTasks[taskIndex],
        ...(status && { status }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
        updatedAt: new Date().toISOString(),
      };
      const updated = memoryTasks[taskIndex];
      wsManager.broadcast('TASK_UPDATED', updated);
      res.json({ success: true, data: updated });
      return;
    }
    res.status(404).json({ success: false, error: 'Task not found' });
  }
});
