import { jest, describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { server } from '../../index.js';
import { io as clientIo } from 'socket.io-client';
import { SignJWT } from 'jose';
import { prisma } from '../../lib/prisma.js';

async function generateTestToken(userId: string, email: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'super-secret-key-123');
  return new SignJWT({ id: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
}

describe('WebSocket Collaboration Integration Tests', () => {
  let serverAddress: string;
  let ownerToken: string;
  let ownerUser: any;
  let docId: string;
  let activeSockets: any[] = [];

  beforeAll((done) => {
    process.env.NODE_ENV = 'test';
    process.env.NEXTAUTH_SECRET = 'super-secret-key-123';

    // Start server dynamically on a random free port
    server.listen(0, async () => {
      const address = server.address();
      const port = typeof address === 'string' ? address : address?.port;
      serverAddress = `http://localhost:${port}`;

      // Create test document and owner in DB
      try {
        ownerUser = await prisma.user.create({
          data: {
            id: 'collab-owner-id',
            email: 'collab-owner@example.com',
            name: 'Collab Owner',
            provider: 'github',
          },
        });

        ownerToken = await generateTestToken(ownerUser.id, ownerUser.email);

        const doc = await prisma.document.create({
          data: {
            id: 'collab-doc-id',
            title: 'Collab Doc',
            yDocState: Buffer.alloc(0),
            ownerId: ownerUser.id,
          },
        });

        await prisma.documentMember.create({
          data: {
            userId: ownerUser.id,
            documentId: doc.id,
            role: 'owner',
          },
        });

        docId = doc.id;
        done();
      } catch (err: any) {
        done(err);
      }
    });
  });

  afterAll((done) => {
    // Disconnect any active sockets to prevent hanging test suites
    activeSockets.forEach((s) => s.disconnect());
    server.close(done);
  });

  afterEach(() => {
    activeSockets.forEach((s) => s.disconnect());
    activeSockets = [];
  });

  it('should block unauthenticated clients from connecting', (done) => {
    const socket = clientIo(serverAddress, {
      transports: ['websocket'],
      extraHeaders: {
        Cookie: '', // No JWT cookie
      },
    });

    activeSockets.push(socket);

    socket.on('connect_error', (err) => {
      expect(err.message).toContain('Authentication error');
      done();
    });

    socket.on('connect', () => {
      done(new Error('Connection succeeded unexpectedly without cookies'));
    });
  });

  it('should successfully establish authenticated connection and join a room', (done) => {
    // Construct cookie header
    const cookieHeader = `next-auth.session-token=${ownerToken}`;

    const socket = clientIo(serverAddress, {
      transports: ['websocket'],
      extraHeaders: {
        Cookie: cookieHeader,
      },
    });

    activeSockets.push(socket);

    socket.on('connect', () => {
      // Emit room join request
      socket.emit('join-room', { documentId: docId }, (err: any) => {
        if (err) {
          done(new Error('Failed to join room: ' + err.message));
        } else {
          done();
        }
      });
    });

    socket.on('connect_error', (err) => {
      done(new Error('Connection failed: ' + err.message));
    });
  });
});
