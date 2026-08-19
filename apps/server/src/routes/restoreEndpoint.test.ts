import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as Y from 'yjs';

const mockYDocState = Buffer.from(Y.encodeStateAsUpdate(new Y.Doc()));

jest.unstable_mockModule('../lib/prisma.js', () => ({
  prisma: {
    documentVersion: {
      findFirst: jest.fn<(args: any) => Promise<any>>().mockImplementation(async (args: any) => {
        if (args.where.id === 'v-1' && args.where.documentId === 'doc-1') {
          return {
            id: 'v-1',
            documentId: 'doc-1',
            snapshotState: mockYDocState,
          };
        }
        return null;
      }),
    },
    document: {
      update: jest.fn().mockResolvedValue({ id: 'doc-1' } as any),
    },
  },
}));

const { restoreVersion } = await import('../services/docs.service.js');

describe('Restore Endpoint Service Module', () => {
  let mockIo: any;

  beforeEach(() => {
    mockIo = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should restore version snapshot, flush to DB, and broadcast socket event', async () => {
    const result = await restoreVersion('doc-1', 'v-1', mockIo);
    expect(result).toEqual({ restored: true, versionId: 'v-1' });
    expect(mockIo.to).toHaveBeenCalledWith('doc:doc-1');
  });

  it('should throw NotFoundError if version snapshot does not exist', async () => {
    await expect(restoreVersion('doc-1', 'v-invalid', mockIo)).rejects.toThrow();
  });
});
