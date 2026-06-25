// Must be imported first — validates env vars and exits with clear errors if missing
import { env } from './lib/env.js';

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import { requireAuth } from './middleware/requireAuth.js';
import { docsRouter } from './routes/docs.js';
import { AppError } from './lib/errors.js';
import type { ClientToServerEvents, ServerToClientEvents } from '@collab/types';

const app = express();
const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? 'https://your-vercel-app.vercel.app'
      : 'http://localhost:3000',
    credentials: true, // Required for cookie-based auth
  },
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

// --- Socket.io ---
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
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

// --- Start Server ---

const PORT = env.PORT;
server.listen(PORT, () => {
  console.log(`[server] Express + Socket.io running on port ${PORT}`);
  console.log(`[server] Environment: ${env.NODE_ENV}`);
});
