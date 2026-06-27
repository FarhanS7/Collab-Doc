import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { SignJWT } from 'jose';
import { app } from '../../index.js';
import { prisma } from '../../lib/prisma.js';

// Setup authentication token helper
async function generateTestToken(userId: string, email: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'super-secret-key-123');
  return new SignJWT({ id: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
}

describe('Documents REST API Integration Tests', () => {
  let ownerToken: string;
  let viewerToken: string;
  let ownerUser: any;
  let viewerUser: any;

  beforeEach(async () => {
    // 1. Create seed users in the database
    ownerUser = await prisma.user.create({
      data: {
        id: 'owner-user-id',
        email: 'owner@example.com',
        name: 'Owner User',
        provider: 'github',
      },
    });

    viewerUser = await prisma.user.create({
      data: {
        id: 'viewer-user-id',
        email: 'viewer@example.com',
        name: 'Viewer User',
        provider: 'github',
      },
    });

    // 2. Generate signed auth session tokens
    ownerToken = await generateTestToken(ownerUser.id, ownerUser.email);
    viewerToken = await generateTestToken(viewerUser.id, viewerUser.email);
  });

  it('should successfully execute full document CRUD cycle for the owner', async () => {
    // ── Create Document ──
    const createRes = await request(app)
      .post('/api/docs')
      .set('Cookie', [`next-auth.session-token=${ownerToken}`])
      .send({ title: 'My Integration Doc' });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data).toHaveProperty('id');
    expect(createRes.body.data.title).toBe('My Integration Doc');
    const docId = createRes.body.data.id;

    // ── Get Single Document Details ──
    const getRes = await request(app)
      .get(`/api/docs/${docId}`)
      .set('Cookie', [`next-auth.session-token=${ownerToken}`]);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.title).toBe('My Integration Doc');
    expect(getRes.body.data.currentUserRole).toBe('owner');

    // ── List Documents ──
    const listRes = await request(app)
      .get('/api/docs')
      .set('Cookie', [`next-auth.session-token=${ownerToken}`]);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);

    // ── Update Document Title ──
    const updateRes = await request(app)
      .patch(`/api/docs/${docId}`)
      .set('Cookie', [`next-auth.session-token=${ownerToken}`])
      .send({ title: 'Updated Doc Title' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Updated Doc Title');

    // ── Soft Delete Document ──
    const deleteRes = await request(app)
      .delete(`/api/docs/${docId}`)
      .set('Cookie', [`next-auth.session-token=${ownerToken}`]);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data).toHaveProperty('deletedAt');
  });

  it('should prevent non-owners from updating or deleting the document', async () => {
    // Owner creates a document
    const createRes = await request(app)
      .post('/api/docs')
      .set('Cookie', [`next-auth.session-token=${ownerToken}`])
      .send({ title: 'Secure Doc' });
    const docId = createRes.body.data.id;

    // Add viewer as a viewer member of the document
    await prisma.documentMember.create({
      data: {
        userId: viewerUser.id,
        documentId: docId,
        role: 'viewer',
      },
    });

    // 1. Viewer attempts to rename doc -> 403 Forbidden
    const renameRes = await request(app)
      .patch(`/api/docs/${docId}`)
      .set('Cookie', [`next-auth.session-token=${viewerToken}`])
      .send({ title: 'Hacked Title' });
    expect(renameRes.status).toBe(403);

    // 2. Viewer attempts to delete doc -> 403 Forbidden
    const deleteRes = await request(app)
      .delete(`/api/docs/${docId}`)
      .set('Cookie', [`next-auth.session-token=${viewerToken}`]);
    expect(deleteRes.status).toBe(403);
  });

  it('should support member management (add & remove members)', async () => {
    // Owner creates a document
    const createRes = await request(app)
      .post('/api/docs')
      .set('Cookie', [`next-auth.session-token=${ownerToken}`])
      .send({ title: 'Shared Doc' });
    const docId = createRes.body.data.id;

    // Owner invites viewer
    const inviteRes = await request(app)
      .post(`/api/docs/${docId}/members`)
      .set('Cookie', [`next-auth.session-token=${ownerToken}`])
      .send({ email: 'viewer@example.com', role: 'editor' });

    expect(inviteRes.status).toBe(201);
    expect(inviteRes.body.data.email).toBe('viewer@example.com');
    expect(inviteRes.body.data.role).toBe('editor');

    // Owner revokes member access
    const removeRes = await request(app)
      .delete(`/api/docs/${docId}/members/${viewerUser.id}`)
      .set('Cookie', [`next-auth.session-token=${ownerToken}`]);

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.data.removed).toBe(true);
  });
});
