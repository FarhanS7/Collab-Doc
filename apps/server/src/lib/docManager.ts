import * as Y from 'yjs';
import { prisma } from './prisma.js';

interface CachedDoc {
  ydoc: Y.Doc;
  updateCount: number;
  saveTimer: NodeJS.Timeout | null;
  isSaving: boolean;
}

const docCache = new Map<string, CachedDoc>();

/**
 * Loads a document's Y.Doc from memory cache or database.
 */
export async function getOrCreateDoc(documentId: string): Promise<Y.Doc> {
  const cached = docCache.get(documentId);
  if (cached) {
    return cached.ydoc;
  }

  // Fetch document from database
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { yDocState: true },
  });

  const ydoc = new Y.Doc();
  
  if (doc?.yDocState) {
    // Hydrate the server-side doc representation with db state
    Y.applyUpdate(ydoc, new Uint8Array(doc.yDocState));
  }

  docCache.set(documentId, {
    ydoc,
    updateCount: 0,
    saveTimer: null,
    isSaving: false,
  });

  return ydoc;
}

/**
 * Applies a binary Y.js update diff to the cached server document
 * and queues/triggers database writes.
 */
export async function applyUpdateAndQueueSave(documentId: string, update: Uint8Array): Promise<void> {
  const cached = docCache.get(documentId);
  const doc = cached ? cached.ydoc : await getOrCreateDoc(documentId);
  const cachedDoc = docCache.get(documentId)!;

  // Apply the update locally to merge concurrent client edits
  Y.applyUpdate(doc, update);

  cachedDoc.updateCount += 1;

  // Clear existing debounced idle timer
  if (cachedDoc.saveTimer) {
    clearTimeout(cachedDoc.saveTimer);
    cachedDoc.saveTimer = null;
  }

  // Count Trigger: Flush to DB if count reaches 30 events
  if (cachedDoc.updateCount >= 30) {
    await flushDocToDb(documentId);
  } else {
    // Idle Trigger: Flush to DB after 5 seconds of inactivity
    cachedDoc.saveTimer = setTimeout(async () => {
      try {
        await flushDocToDb(documentId);
      } catch (err) {
        console.error(`[DocManager] Idle save failed for doc ${documentId}:`, err);
      }
    }, 5000);
  }
}

/**
 * Serializes and flushes the cached Y.Doc state to PostgreSQL.
 */
export async function flushDocToDb(documentId: string): Promise<void> {
  const cachedDoc = docCache.get(documentId);
  if (!cachedDoc || cachedDoc.isSaving) return;

  // Clear any active timers
  if (cachedDoc.saveTimer) {
    clearTimeout(cachedDoc.saveTimer);
    cachedDoc.saveTimer = null;
  }

  cachedDoc.isSaving = true;

  try {
    const ydocState = Y.encodeStateAsUpdate(cachedDoc.ydoc);
    const yDocBuffer = Buffer.from(ydocState);

    await prisma.document.update({
      where: { id: documentId },
      data: { yDocState: yDocBuffer },
    });

    cachedDoc.updateCount = 0;
    console.log(`💾 [DocManager] Successfully saved document ${documentId} to database.`);
  } catch (err) {
    console.error(`❌ [DocManager] Failed to save document ${documentId} to database:`, err);
    throw err;
  } finally {
    cachedDoc.isSaving = false;
  }
}

/**
 * Performs a final save and unloads the Y.Doc from memory if no clients remain in the room.
 */
export async function unloadDocIfEmpty(documentId: string, activeRoomConnections: number): Promise<void> {
  if (activeRoomConnections > 0) return;

  const cachedDoc = docCache.get(documentId);
  if (!cachedDoc) return;

  console.log(`🔌 [DocManager] Room for doc ${documentId} is empty. Flushing final state and unloading.`);
  
  try {
    await flushDocToDb(documentId);
  } catch (err) {
    console.error(`[DocManager] Final flush failed for ${documentId}:`, err);
  } finally {
    docCache.delete(documentId);
    console.log(`🧹 [DocManager] Cache cleared for doc ${documentId}.`);
  }
}
