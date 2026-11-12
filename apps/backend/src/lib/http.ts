import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError, ZodType } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

/** Wraps an async route so thrown errors reach the Express error handler. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/** Parses input with a zod schema, throwing a 400 HttpError on failure. */
export function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new HttpError(400, 'Validation failed', result.error.flatten());
  }
  return result.data;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ success: false, error: err.message, details: err.details });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ success: false, error: 'Validation failed', details: err.flatten() });
    return;
  }
  // Prisma "record not found"
  if (typeof err === 'object' && err && 'code' in err && (err as { code: string }).code === 'P2025') {
    res.status(404).json({ success: false, error: 'Not found' });
    return;
  }
  const e = err as Error;
  console.error('[Error]', e?.stack || e);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? e?.message : undefined,
  });
}
