import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as Y from 'yjs';

jest.unstable_mockModule('./prisma.js', () => ({
  prisma: {
    $transaction: jest.fn(async (cb: any) => {
      const mockTx = {
        documentVersion: {
          create: jest.fn().mockResolvedValue({ id: 'ver-1' } as any),
          findMany: jest.fn().mockResolvedValue([] as any),
          deleteMany: jest.fn().mockResolvedValue({ count: 0 } as any),
        },
      };
      return cb(mockTx);
    }),
  },
}));

jest.unstable_mockModule('./metrics.js', () => ({
  snapshotFailuresCounter: { inc: jest.fn() },
}));

const { shouldSnapshot, writeSnapshot, maybeTakeSnapshot } = await import('./versionService.js');
const { prisma } = await import('./prisma.js');

describe('Version Snapshot Service Module', () => {
  let ydoc: Y.Doc;

  beforeEach(() => {
    ydoc = new Y.Doc();
    const text = ydoc.getText('codemirror');
    text.insert(0, 'Test Document Content');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should correct evaluate shouldSnapshot for multiples of 30', () => {
    expect(shouldSnapshot(0)).toBe(false);
    expect(shouldSnapshot(15)).toBe(false);
    expect(shouldSnapshot(30)).toBe(true);
    expect(shouldSnapshot(31)).toBe(false);
    expect(shouldSnapshot(60)).toBe(true);
  });

  it('should write Y.js snapshot to prisma within transaction', async () => {
    await writeSnapshot('doc-123', ydoc);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should ignore non-snapshot edit counts in maybeTakeSnapshot', () => {
    maybeTakeSnapshot('doc-123', ydoc, 15);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
