import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { tasksRouter } from './tasks.routes.js';
import { activitiesRouter } from './activities.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/tasks', tasksRouter);
apiRouter.use('/activities', activitiesRouter);
