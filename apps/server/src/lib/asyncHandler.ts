import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps async Express route handlers to automatically catch rejected promises
 * and forward them to next() — which hits the global error handler.
 *
 * Without this, unhandled promise rejections in routes crash the process in Node <16
 * and are silently swallowed in Node >=16.
 *
 * Usage:
 *   router.get('/docs', asyncHandler(async (req, res) => { ... }));
 */
export function asyncHandler(fn: AsyncFn): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
