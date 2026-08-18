import pino from 'pino';
import pinoHttpModule from 'pino-http';
import type { RequestHandler, Request, Response } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import { nanoid } from 'nanoid';
import { env } from './env.js';

const isProduction = env.NODE_ENV === 'production';

// Support both ESM default and CJS module exports
const pinoHttp = typeof pinoHttpModule === 'function' ? pinoHttpModule : (pinoHttpModule as any).default || pinoHttpModule;

export const logger = pino({
  level: env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
});

export interface RequestContext {
  requestId: string;
  userId?: string;
  docId?: string;
}

export function createRequestLogger(context: RequestContext) {
  return logger.child(context);
}

export const pinoHttpMiddleware: RequestHandler = pinoHttp({
  logger,
  genReqId: (req: IncomingMessage) => {
    const existingHeader = req.headers['x-request-id'];
    if (typeof existingHeader === 'string' && existingHeader.trim().length > 0) {
      return existingHeader;
    }
    return nanoid(10);
  },
  customProps: (req: IncomingMessage) => {
    const expressReq = req as unknown as Request;
    return {
      userId: expressReq.user?.id,
    };
  },
  serializers: {
    req: (req: any) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res: ServerResponse) => ({
      statusCode: res.statusCode,
    }),
  },
});
