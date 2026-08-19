import * as Y from 'yjs';
import { prisma } from './prisma.js';
import { logger } from './logger.js';
import { snapshotFailuresCounter } from './metrics.js';

export function shouldSnapshot(editCount: number): boolean {
  return editCount > 0 && editCount % 30 === 0;
}

export async function writeSnapshot(
  documentId: string,
  ydoc: Y.Doc
): Promise<void> {
  try {
    const stateUpdate = Y.encodeStateAsUpdate(ydoc);
    const snapshotBuffer = Buffer.from(stateUpdate);

    await prisma.$transaction(async (tx) => {
      // 1. Insert new snapshot version
      await tx.documentVersion.create({
        data: {
          documentId,
          snapshotState: snapshotBuffer,
        },
      });

      // 2. Fetch IDs beyond recent 50 versions to enforce cleanup cap
      const versionsToPrune = await tx.documentVersion.findMany({
        where: { documentId },
        orderBy: { createdAt: 'desc' },
        skip: 50,
        select: { id: true },
      });

      if (versionsToPrune.length > 0) {
        const pruneIds = versionsToPrune.map((v) => v.id);
        await tx.documentVersion.deleteMany({
          where: { id: { in: pruneIds } },
        });
      }
    });

    logger.info({ documentId, msg: 'Successfully recorded Y.js document version snapshot' });
  } catch (err) {
    snapshotFailuresCounter.inc();
    logger.warn({ err, documentId, msg: 'Failed to record document version snapshot' });
  }
}

export function maybeTakeSnapshot(
  documentId: string,
  ydoc: Y.Doc,
  editCount: number
): void {
  if (!shouldSnapshot(editCount)) {
    return;
  }

  // Defer snapshot persistence via setImmediate so socket y-update relay is never blocked
  setImmediate(() => {
    void writeSnapshot(documentId, ydoc);
  });
}
