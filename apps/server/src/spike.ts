import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('Spike client connected:', socket.id);
  const ROOM = 'spike-room';
  
  socket.join(ROOM);

  socket.on('y-update', (update) => {
    // PRD E.1: Ensure binary payload. 'update' should be a Buffer/Uint8Array
    socket.to(ROOM).emit('y-update', update);
  });

  socket.on('awareness-update', (update) => {
    socket.to(ROOM).emit('awareness-update', update);
  });

  socket.on('disconnect', () => {
    console.log('Spike client disconnected:', socket.id);
  });
});

const PORT = 4001;
httpServer.listen(PORT, () => {
  console.log(`[SPIKE] Server running on http://localhost:${PORT}`);
});
