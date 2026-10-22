import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { wsManager } from '../lib/websocket.js';

export const activitiesRouter = Router();

// In-memory fallback if Postgres is not yet provisioned locally
const memoryActivities = [
  {
    id: 'act-1',
    type: 'PROJECT_CREATED',
    description: 'Syncro Connected Workspace was initialized',
    projectId: 'p-1',
    userId: 'u-1',
    userName: 'Alex Rivers (Admin)',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'act-2',
    type: 'TASK_CREATED',
    description: 'Created task "Initialize Syncro Monorepo Architecture"',
    projectId: 'p-1',
    userId: 'u-1',
    userName: 'Alex Rivers (Admin)',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'act-3',
    type: 'TASK_COMPLETED',
    description: 'Completed task "Configure tsconfig.json with strict mode"',
    projectId: 'p-1',
    userId: 'u-2',
    userName: 'Sarah Chen (Lead Dev)',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'act-4',
    type: 'EVENT_SCHEDULED',
    description: 'Workspace Sprint Kickoff event scheduled for tomorrow',
    projectId: 'p-1',
    userId: 'u-1',
    userName: 'Alex Rivers (Admin)',
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
];

// GET /api/v1/activities
activitiesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const activities = await prisma.activityRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: true, project: true },
    });
    res.json({ success: true, count: activities.length, data: activities, source: 'database' });
  } catch (error) {
    res.json({ success: true, count: memoryActivities.length, data: memoryActivities, source: 'fallback_store' });
  }
});

// POST /api/v1/activities
activitiesRouter.post('/', async (req: Request, res: Response) => {
  const { type, description, projectId = 'p-1', userId = 'u-1' } = req.body;

  if (!type || !description) {
    res.status(400).json({ success: false, error: 'Type and description are required' });
    return;
  }

  try {
    const activity = await prisma.activityRecord.create({
      data: {
        type,
        description,
        projectId,
        userId,
      },
      include: { user: true },
    });

    wsManager.broadcast('ACTIVITY_RECORDED', activity);
    res.status(201).json({ success: true, data: activity, source: 'database' });
  } catch (error) {
    const fallbackActivity = {
      id: `act-${Date.now()}`,
      type,
      description,
      projectId,
      userId,
      userName: 'Current User',
      createdAt: new Date().toISOString(),
    };
    memoryActivities.unshift(fallbackActivity);

    wsManager.broadcast('ACTIVITY_RECORDED', fallbackActivity);
    res.status(201).json({ success: true, data: fallbackActivity, source: 'fallback_store' });
  }
});
