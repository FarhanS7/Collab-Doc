import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import type http from 'http';
import type { Server } from 'socket.io';
import type { PrismaClient } from '@prisma/client';

jest.unstable_mockModule('./redis.js', () => ({
  pubClient: { status: 'ready', quit: jest.fn<() => Promise<string>>().mockResolvedValue('OK') },
  subClient: { status: 'ready', quit: jest.fn<() => Promise<string>>().mockResolvedValue('OK') },
}));

jest.unstable_mockModule('./docManager.js', () => ({
  flushAllDocsToDb: jest.fn<() => Promise<void>>().mockResolvedValue(),
}));

const { executeGracefulShutdown } = await import('./shutdown.js');
const { flushAllDocsToDb } = await import('./docManager.js');
const { pubClient, subClient } = await import('./redis.js');

describe('Shutdown Handler Module', () => {
  let mockServer: Partial<http.Server>;
  let mockIo: Partial<Server>;
  let mockPrisma: Partial<PrismaClient>;
  let exitSpy: any;

  beforeEach(() => {
    mockServer = {
      close: jest.fn((cb?: (err?: Error) => void) => {
        if (cb) cb();
        return mockServer as http.Server;
      }) as any,
    };

    mockIo = {
      close: jest.fn((cb?: () => void) => {
        if (cb) cb();
      }) as any,
    };

    mockPrisma = {
      $disconnect: jest.fn<() => Promise<void>>().mockResolvedValue(),
    };

    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    exitSpy.mockRestore();
  });

  it('should execute shutdown steps in sequence and exit with code 0', async () => {
    await executeGracefulShutdown(
      mockServer as http.Server,
      mockIo as Server,
      mockPrisma as PrismaClient,
      'SIGTERM'
    );

    expect(mockServer.close).toHaveBeenCalled();
    expect(mockIo.close).toHaveBeenCalled();
    expect(pubClient.quit).toHaveBeenCalled();
    expect(subClient.quit).toHaveBeenCalled();
    expect(flushAllDocsToDb).toHaveBeenCalled();
    expect(mockPrisma.$disconnect).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
