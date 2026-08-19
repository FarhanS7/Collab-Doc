import type http from 'http';
import type { Server } from 'socket.io';
import type { PrismaClient } from '@prisma/client';
import { pubClient, subClient } from './redis.js';
import { flushAllDocsToDb } from './docManager.js';
import { logger } from './logger.js';

let isShuttingDown = false;

export async function executeGracefulShutdown(
  server: http.Server,
  io: Server,
  prisma: PrismaClient,
  signal: string
): Promise<void> {
  if (isShuttingDown) {
    logger.warn({ signal, msg: 'Shutdown already in progress' });
    return;
  }

  isShuttingDown = true;
  logger.info({ signal, msg: `Received ${signal}. Initiating graceful shutdown...` });

  // 10-second failsafe timeout: force exit if operations hang
  const timeoutTimer = setTimeout(() => {
    logger.error({ signal, msg: 'Graceful shutdown timed out after 10s. Force exiting process.' });
    process.exit(1);
  }, 10000);

  // Unref timeout timer so Node event loop doesn't stay open solely for the timer
  timeoutTimer.unref();

  try {
    // 1. Close HTTP server (stop accepting new requests)
    await new Promise<void>((resolve) => {
      server.close((err) => {
        if (err) {
          logger.error({ err, msg: 'Error closing HTTP server' });
        } else {
          logger.info('• HTTP server closed successfully');
        }
        resolve();
      });
    });

    // 2. Close Socket.io server and disconnect clients cleanly
    await new Promise<void>((resolve) => {
      io.close(() => {
        logger.info('• Socket.io server closed successfully');
        resolve();
      });
    });

    // 3. Disconnect Redis Pub/Sub clients
    try {
      if (pubClient.status === 'ready' || pubClient.status === 'connect') {
        await pubClient.quit();
        logger.info('• Redis pubClient disconnected');
      }
    } catch (err) {
      logger.error({ err, msg: 'Error disconnecting Redis pubClient' });
    }

    try {
      if (subClient.status === 'ready' || subClient.status === 'connect') {
        await subClient.quit();
        logger.info('• Redis subClient disconnected');
      }
    } catch (err) {
      logger.error({ err, msg: 'Error disconnecting Redis subClient' });
    }

    // 4. Flush all pending in-memory document state to PostgreSQL
    try {
      await flushAllDocsToDb();
      logger.info('• All cached Y.Doc states saved to database');
    } catch (err) {
      logger.error({ err, msg: 'Error flushing documents during shutdown' });
    }

    // 5. Disconnect Prisma ORM connection pool
    try {
      await prisma.$disconnect();
      logger.info('• Prisma client disconnected');
    } catch (err) {
      logger.error({ err, msg: 'Error disconnecting Prisma client' });
    }

    logger.info('✨ Graceful shutdown completed cleanly.');
    clearTimeout(timeoutTimer);
    process.exit(0);
  } catch (err) {
    logger.error({ err, msg: 'Fatal error during graceful shutdown sequence' });
    process.exit(1);
  }
}

export function registerShutdownHandlers(
  server: http.Server,
  io: Server,
  prisma: PrismaClient
): void {
  const handler = (signal: string) => {
    void executeGracefulShutdown(server, io, prisma, signal);
  };

  process.on('SIGTERM', () => handler('SIGTERM'));
  process.on('SIGINT', () => handler('SIGINT'));
}
