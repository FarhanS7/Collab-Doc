// Must be imported first — validates env vars and exits with clear errors if missing
import { env } from './lib/env.js';

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from './lib/redis.js';
import { jwtVerify } from 'jose';
import { prisma } from './lib/prisma.js';
import cookieParser from 'cookie-parser';
import { requireAuth } from './middleware/requireAuth.js';
import { docsRouter } from './routes/docs.js';
import { aiRouter } from './routes/ai.js';
import { AppError } from './lib/errors.js';
import type { ClientToServerEvents, ServerToClientEvents, JoinRoomPayload } from '@collab/types';
import * as Y from 'yjs';
import { getOrCreateDoc, applyUpdateAndQueueSave, unloadDocIfEmpty } from './lib/docManager.js';

interface SocketData {
  user?: {
    id: string;
    email: string;
  };
  documentId?: string;
}

const app = express();
const server = http.createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? 'https://your-vercel-app.vercel.app'
      : 'http://localhost:3000',
    credentials: true, // Required for cookie-based auth
  },
});

// Configure Socket.io Redis adapter for horizontal scaling
io.adapter(createAdapter(pubClient, subClient));

// Subscribe to document updates from Redis Pub/Sub channels (cross-instance sync)
subClient.psubscribe('doc:*:updates').then(() => {
  console.log('[Redis] Subscribed to doc:*:updates pattern');
}).catch((err) => {
  console.error('[Redis] Failed to subscribe to doc:*:updates pattern:', err);
});

subClient.on('pmessage', async (pattern, channel, message) => {
  try {
    const channelParts = channel.split(':');
    const documentId = channelParts[1];
    const roomName = `doc:${documentId}`;

    const { sender, update: updateBase64 } = JSON.parse(message);
    const updateBuffer = Buffer.from(updateBase64, 'base64');
    
    // 1. If we are NOT the server node directly connected to the sender client,
    // apply the update to our local cache to keep the document state converged.
    const localSocket = io.sockets.sockets.get(sender);
    if (!localSocket) {
      const ydoc = await getOrCreateDoc(documentId);
      Y.applyUpdate(ydoc, new Uint8Array(updateBuffer));
    }

    // Get the ArrayBuffer representation safely from Node.js Buffer
    const arrayBuffer = updateBuffer.buffer.slice(
      updateBuffer.byteOffset,
      updateBuffer.byteOffset + updateBuffer.byteLength
    ) as ArrayBuffer;

    // Emit ONLY locally to clients in this room on this server instance (excluding original sender)
    const localRoomSockets = io.sockets.adapter.rooms.get(roomName);
    if (localRoomSockets) {
      for (const socketId of localRoomSockets) {
        if (socketId !== sender) {
          const clientSocket = io.sockets.sockets.get(socketId);
          if (clientSocket) {
            clientSocket.emit('y-update', arrayBuffer);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error handling Redis update message:', err);
  }
});

// --- Global Middleware ---
app.use(express.json());
app.use(cookieParser()); // Must come BEFORE requireAuth

// --- Public Routes ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Protected API Routes ---
app.use('/api', requireAuth);
app.use('/api/docs', docsRouter); // C.2-C.8 CRUD routes
app.use('/api/ai', aiRouter); // Phase F AI Assistant routes

// NextAuth uses different cookie names per environment
const COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

// Helper to parse cookies from handshake headers
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    const val = parts.join('=')?.trim();
    if (name) {
      list[name] = decodeURIComponent(val);
    }
  });

  return list;
}

// Socket.io Handshake Middleware (JWT Session Verification)
io.use(async (socket, next) => {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const token = cookies[COOKIE_NAME];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);

    socket.data.user = {
      id: payload.id as string,
      email: payload.email as string,
    };

    next();
  } catch (err) {
    console.error('Socket authentication failed:', err);
    next(new Error('Invalid or expired session'));
  }
});

// --- Socket.io Events ---
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id, 'User:', socket.data.user?.email);

  socket.on('join-room', async ({ documentId }: JoinRoomPayload) => {
    try {
      const userId = socket.data.user?.id;
      if (!userId) {
        console.warn(`[Socket ${socket.id}] Attempted to join room without user ID`);
        return;
      }

      // Check document existence and access permissions via Prisma
      const doc = await prisma.document.findFirst({
        where: { id: documentId, deletedAt: null },
        select: { id: true, isPublic: true },
      });

      if (!doc) {
        console.warn(`[Socket ${socket.id}] Document ${documentId} not found or deleted`);
        return;
      }

      const membership = await prisma.documentMember.findUnique({
        where: { userId_documentId: { userId, documentId } },
        select: { role: true },
      });

      const isMember = !!membership;
      const isPublic = doc.isPublic;

      if (!isMember && !isPublic) {
        console.warn(`[Socket ${socket.id}] User ${userId} unauthorized to access document ${documentId}`);
        return;
      }

      const roomName = `doc:${documentId}`;
      socket.join(roomName);
      socket.data.documentId = documentId; // Save documentId to socket data for cleanup on disconnect
      console.log(`[Socket ${socket.id}] User ${userId} successfully joined room ${roomName}`);

      // Get the in-memory cached doc or load it from database
      const serverDoc = await getOrCreateDoc(documentId);

      // Hydrate client with the latest unified Y.js document state (safely sliced Buffer -> ArrayBuffer)
      const yDocState = Y.encodeStateAsUpdate(serverDoc);
      const arrayBuffer = yDocState.buffer.slice(
        yDocState.byteOffset,
        yDocState.byteOffset + yDocState.byteLength
      ) as ArrayBuffer;
      socket.emit('y-update', arrayBuffer);
    } catch (err) {
      console.error(`Error in join-room handler for socket ${socket.id}:`, err);
    }
  });

  socket.on('y-update', async (update: ArrayBuffer) => {
    try {
      const documentId = socket.data.documentId;
      if (!documentId) return;

      const updateBuffer = new Uint8Array(update);

      // Apply to local cached Y.Doc AND queue/debounce save to database
      await applyUpdateAndQueueSave(documentId, updateBuffer);

      // Broadcast this update via Redis Pub/Sub to all other server nodes
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      rooms.forEach((room) => {
        if (room.startsWith('doc:')) {
          const redisChannel = `doc:${documentId}:updates`;

          const payload = JSON.stringify({
            sender: socket.id,
            update: Buffer.from(update).toString('base64'),
          });

          pubClient.publish(redisChannel, payload).catch((err) => {
            console.error(`[Redis] Failed to publish update for document ${documentId}:`, err);
          });
        }
      });
    } catch (err) {
      console.error(`Error in y-update socket event handler:`, err);
    }
  });

  socket.on('y-awareness', (update: ArrayBuffer) => {
    try {
      const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      rooms.forEach((room) => {
        if (room.startsWith('doc:')) {
          socket.to(room).emit('y-awareness', update);
        }
      });
    } catch (err) {
      console.error(`Error in y-awareness socket event handler:`, err);
    }
  });

  socket.on('y-sync-step-1', async (stateVector: ArrayBuffer) => {
    try {
      const documentId = socket.data.documentId;
      if (!documentId) return;

      // Get the in-memory cached doc or load it from database
      const serverDoc = await getOrCreateDoc(documentId);
      
      const clientStateVector = new Uint8Array(stateVector);
      const serverDiff = Y.encodeStateAsUpdate(serverDoc, clientStateVector);
      const serverStateVector = Y.encodeStateVector(serverDoc);

      const diffAB = serverDiff.buffer.slice(
        serverDiff.byteOffset,
        serverDiff.byteOffset + serverDiff.byteLength
      ) as ArrayBuffer;

      const svAB = serverStateVector.buffer.slice(
        serverStateVector.byteOffset,
        serverStateVector.byteOffset + serverStateVector.byteLength
      ) as ArrayBuffer;

      socket.emit('y-sync-step-2', {
        diff: diffAB,
        stateVector: svAB,
      });
    } catch (err) {
      console.error(`Error in y-sync-step-1 socket event handler:`, err);
    }
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id, 'User:', socket.data.user?.email);
    
    const documentId = socket.data.documentId;
    if (documentId) {
      const roomName = `doc:${documentId}`;
      const localRoom = io.sockets.adapter.rooms.get(roomName);
      const activeConnectionsCount = localRoom ? localRoom.size : 0;
      
      // Perform final flush and clear from cache memory if no local connections remain
      await unloadDocIfEmpty(documentId, activeConnectionsCount);
    }
  });
});

// --- Global Error Handler ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
    });
    return;
  }

  // Unhandled errors
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
});

// --- Graceful Shutdown Handler ---
const shutdown = async () => {
  console.log('\nShutting down server gracefully...');
  
  // Close socket.io connections
  io.close(() => {
    console.log('• Socket.io server closed');
  });

  // Close HTTP server
  server.close(() => {
    console.log('• HTTP server closed');
  });

  // Disconnect Redis clients
  try {
    await pubClient.quit();
    console.log('• Redis pubClient disconnected');
  } catch (err) {
    console.error('Error disconnecting Redis pubClient:', err);
  }

  try {
    await subClient.quit();
    console.log('• Redis subClient disconnected');
  } catch (err) {
    console.error('Error disconnecting Redis subClient:', err);
  }

  // Disconnect Prisma
  try {
    await prisma.$disconnect();
    console.log('• Prisma disconnected');
  } catch (err) {
    console.error('Error disconnecting Prisma:', err);
  }

  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// --- Start Server ---
const PORT = env.PORT;
server.listen(PORT, () => {
  console.log(`[server] Express + Socket.io running on port ${PORT}`);
  console.log(`[server] Environment: ${env.NODE_ENV}`);
});

