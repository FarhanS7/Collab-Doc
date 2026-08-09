import { Redis } from 'ioredis';
import { env } from './env.js';

function createRedisClient(name: string) {
  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    enableOfflineQueue: false,
    connectTimeout: 2000,
    retryStrategy: () => null,
  });

  client.on('error', (err) => {
    console.warn(`⚠️ [Redis ${name} Client Error]:`, err.message);
  });

  client.on('connect', () => {
    console.log(`🔌 Redis ${name} Client Connected`);
  });

  return client;
}

// Socket.io Redis adapter requires two distinct client connections
export const pubClient = createRedisClient('Pub');
export const subClient = createRedisClient('Sub');

export async function connectRedis() {
  try {
    await Promise.all([pubClient.connect(), subClient.connect()]);
    return true;
  } catch {
    return false;
  }
}
