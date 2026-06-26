import type { Request, Response, NextFunction } from 'express';
import { pubClient } from '../lib/redis.js';
import { AppError } from '../lib/errors.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

/**
 * rateLimit — Redis-based rolling window rate limiter middleware.
 * Restricts user requests to a maximum 'max' requests within a rolling 'windowMs' window.
 *
 * Employs a Redis ZSET where each request is stored as a timestamp score/member.
 * Fails open if Redis is unavailable or errors to preserve user access.
 */
export function rateLimit(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
      return;
    }

    const key = `rate_limit:ai:${userId}`;
    const now = Date.now();
    const clearBefore = now - options.windowMs;

    try {
      const multi = pubClient.multi();
      multi.zremrangebyscore(key, 0, clearBefore);
      multi.zcard(key);
      multi.zadd(key, now, `${now}-${Math.random()}`); // Avoid collision if multiple requests are within the same millisecond
      multi.expire(key, Math.ceil(options.windowMs / 1000));

      const results = await multi.exec();

      if (!results) {
        next();
        return;
      }

      // results is Array of [Error | null, result]
      const cardPair = results[1];
      const count = cardPair ? (cardPair[1] as number) : 0;

      if (count >= options.max) {
        // Calculate retry duration by fetching the oldest active request score
        const oldestRange = await pubClient.zrange(key, 0, 0, 'WITHSCORES');
        let retryAfter = Math.ceil(options.windowMs / 1000);

        if (oldestRange && oldestRange.length >= 2) {
          const oldestTime = parseInt(oldestRange[1], 10);
          if (!isNaN(oldestTime)) {
            const timePassed = now - oldestTime;
            retryAfter = Math.ceil((options.windowMs - timePassed) / 1000);
            if (retryAfter < 1) retryAfter = 1;
          }
        }

        res.setHeader('Retry-After', retryAfter.toString());
        next(new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.'));
        return;
      }

      next();
    } catch (err) {
      console.error('⚠️ [Rate Limiter Error]:', err);
      // Fail-open: do not block the request if Redis operations fail
      next();
    }
  };
}
