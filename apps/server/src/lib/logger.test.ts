import { describe, it, expect } from '@jest/globals';
import { logger, createRequestLogger } from './logger.js';

describe('Logger Module', () => {
  it('should export a configured pino logger', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('should create a child logger with bound request context', () => {
    const childLogger = createRequestLogger({
      requestId: 'test-req-123',
      userId: 'user-456',
      docId: 'doc-789',
    });

    expect(childLogger).toBeDefined();
    expect(typeof childLogger.info).toBe('function');
    expect(childLogger.bindings()).toMatchObject({
      requestId: 'test-req-123',
      userId: 'user-456',
      docId: 'doc-789',
    });
  });
});
