// Must be imported first — validates env vars and exits with clear errors if missing
import { env } from './lib/env.js';

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import { requireAuth } from './middleware/requireAuth.js';
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
// All /api routes require a valid NextAuth JWT in cookies.
// Add route modules here as they are built (C.2–C.8, G.1, F.1 etc.)
app.use('/api', requireAuth);

// Placeholder — will be replaced with actual route modules in C.2+
app.get('/api/ping', (req, res) => {
  res.json({ message: 'authenticated', userId: req.user?.id });
});

// --- Socket.io ---
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// --- Start Server ---
const PORT = env.PORT;
server.listen(PORT, () => {
  console.log(`[server] Express + Socket.io running on port ${PORT}`);
  console.log(`[server] Environment: ${env.NODE_ENV}`);
});
