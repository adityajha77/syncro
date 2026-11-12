import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { workspacesRouter } from './workspaces.routes.js';
import { integrationsRouter } from './integrations.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/workspaces', workspacesRouter);
apiRouter.use('/integrations', integrationsRouter);
