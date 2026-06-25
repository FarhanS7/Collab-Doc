import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('y-update', (update) => {
    // Relay raw binary update to other clients in the same room
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    rooms.forEach(room => {
      socket.to(room).emit('y-update', update);
    });
  });

  socket.on('y-awareness', (awarenessUpdate) => {
    // Relay awareness (cursors, selections) to other clients in the same room
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    rooms.forEach(room => {
      socket.to(room).emit('y-awareness', awarenessUpdate);
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Serve the frontend using Vite in middleware mode
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'html',
  root: '.',
});

app.use(vite.middlewares);

app.use('*', async (req, res, next) => {
  const url = req.originalUrl;
  try {
    let template = fs.readFileSync(
      path.resolve(__dirname, 'index.html'),
      'utf-8'
    );
    template = await vite.transformIndexHtml(url, template);
    res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  Spike Server Running at http://localhost:${PORT}  `);
  console.log(`==================================================`);
});
