import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

jest.unstable_mockModule('../lib/prisma.js', () => ({
  prisma: {
    documentVersion: {
      findMany: jest.fn<() => Promise<any>>().mockResolvedValue([
        { id: 'v-1', createdAt: new Date('2026-08-19T10:00:00Z') },
        { id: 'v-2', createdAt: new Date('2026-08-19T09:00:00Z') },
      ]),
      findFirst: jest.fn<(args: any) => Promise<any>>().mockImplementation(async (args: any) => {
        if (args.where.id === 'v-1' && args.where.documentId === 'doc-1') {
          return {
            id: 'v-1',
            documentId: 'doc-1',
            snapshotState: Buffer.from('mock-yjs-bytes'),
            createdAt: new Date('2026-08-19T10:00:00Z'),
          };
        }
        return null;
      }),
    },
  },
}));

const { listVersions, getVersion } = await import('../services/docs.service.js');

describe('Version History Endpoints Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list document versions returning metadata array without snapshotState', async () => {
    const versions = await listVersions('doc-1');
    expect(versions).toHaveLength(2);
    expect(versions[0]).toHaveProperty('id', 'v-1');
    expect(versions[0]).not.toHaveProperty('snapshotState');
  });

  it('should get single version detail with base64 snapshotState', async () => {
    const version = await getVersion('doc-1', 'v-1');
    expect(version).toBeDefined();
    expect(version.id).toBe('v-1');
    expect(version.snapshotState).toBe(Buffer.from('mock-yjs-bytes').toString('base64'));
  });

  it('should enforce IDOR check and throw NotFoundError when versionId does not match documentId', async () => {
    await expect(getVersion('doc-other', 'v-1')).rejects.toThrow();
  });
});
