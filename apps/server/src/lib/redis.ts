import { Redis } from 'ioredis';
import { env } from './env.js';

// Socket.io Redis adapter requires two distinct client connections
export const pubClient = new Redis(env.REDIS_URL);
export const subClient = pubClient.duplicate();

pubClient.on('error', (err) => {
  console.error('❌ [Redis Pub Client Error]:', err);
});

subClient.on('error', (err) => {
  console.error('❌ [Redis Sub Client Error]:', err);
});

pubClient.on('connect', () => {
  console.log('🔌 Redis Pub Client Connected');
});

subClient.on('connect', () => {
  console.log('🔌 Redis Sub Client Connected');
});
