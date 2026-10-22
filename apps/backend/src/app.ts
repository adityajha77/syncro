import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { apiRouter } from './routes/index.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || '*',
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger in dev
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[HTTP] ${req.method} ${req.url}`);
    }
    next();
  });

  // Base API v1 router
  app.use('/api/v1', apiRouter);

  // Root welcome
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Syncro Connected Workspace API',
      version: '0.1.0',
      docs: '/api/v1/health',
      realtimeEndpoint: '/ws',
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Endpoint not found: ${req.method} ${req.url}`,
    });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Error]', err.stack || err.message);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  });

  return app;
}
