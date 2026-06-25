import * as Y from 'yjs';
import { prisma } from '../lib/prisma.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../lib/errors.js';

// ─────────────────────────────────────────────
// C.2 — Create Document
// ─────────────────────────────────────────────
export async function createDocument(userId: string, title = 'Untitled') {
  // ✅ CRITICAL: init Y.js state with a real empty Y.Doc, NOT Buffer.alloc(0)
  // An empty encoding (~20 bytes) allows Y.applyUpdate to succeed.
  // Zero bytes causes a silent no-op when the editor loads the document.
  const emptyYDoc = new Y.Doc();
  const yDocState = Buffer.from(Y.encodeStateAsUpdate(emptyYDoc));

  // Atomic transaction: document + owner membership must both succeed or both fail
  const document = await prisma.$transaction(async (tx) => {
    const doc = await tx.document.create({
      data: {
        title,
        yDocState,
        ownerId: userId,
      },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });

    // Owner is always created as a DocumentMember — all permission checks go through this table
    await tx.documentMember.create({
      data: {
        userId,
        documentId: doc.id,
        role: 'owner',
      },
    });

    return doc;
  });

  return document;
}

// ─────────────────────────────────────────────
// C.3 — List Documents
// ─────────────────────────────────────────────
export async function listDocuments(userId: string) {
  // Query through DocumentMember to get all docs the user has any access to.
  // This also uses the @@index([userId]) we defined in the schema.
  const memberships = await prisma.documentMember.findMany({
    where: { userId },
    select: {
      role: true,
      document: {
        select: {
          id: true,
          title: true,
          updatedAt: true,
          deletedAt: true,
          owner: { select: { name: true } },
        },
      },
    },
    orderBy: { document: { updatedAt: 'desc' } },
  });

  // Filter out soft-deleted documents and shape the response
  return memberships
    .filter((m) => m.document.deletedAt === null)
    .map((m) => ({
      id: m.document.id,
      title: m.document.title,
      updatedAt: m.document.updatedAt,
      role: m.role,
      ownerName: m.document.owner.name ?? 'Unknown user',
    }));
}

// ─────────────────────────────────────────────
// C.4 — Get Single Document
// ─────────────────────────────────────────────
export async function getDocument(documentId: string, userId: string) {
  // First check access — don't fetch the Y.js blob unless the user is authorized
  const membership = await prisma.documentMember.findUnique({
    where: { userId_documentId: { userId, documentId } },
    select: { role: true },
  });

  if (!membership) {
    // Check if the document is public before returning 403
    const publicDoc = await prisma.document.findFirst({
      where: { id: documentId, isPublic: true, deletedAt: null },
      select: { id: true },
    });
    if (!publicDoc) throw new ForbiddenError('You do not have access to this document');
  }

  const document = await prisma.document.findFirst({
    where: { id: documentId, deletedAt: null },
    select: {
      id: true,
      title: true,
      yDocState: true,
      isPublic: true,
      publicAccessLevel: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, name: true, email: true } },
      members: {
        select: {
          role: true,
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!document) throw new NotFoundError('Document');

  return {
    id: document.id,
    title: document.title,
    // ⚠️ Encode as base64 — raw binary breaks JSON.parse on the client
    // Client decodes: Buffer.from(base64, 'base64') → Uint8Array → Y.applyUpdate
    yDocState: document.yDocState.toString('base64'),
    isPublic: document.isPublic,
    publicAccessLevel: document.publicAccessLevel,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    owner: document.owner,
    members: document.members.map((m) => ({ ...m.user, role: m.role })),
    currentUserRole: membership?.role ?? 'viewer',
  };
}

// ─────────────────────────────────────────────
// C.5 — Update Document Settings
// ─────────────────────────────────────────────
export async function updateDocument(
  documentId: string,
  data: { title?: string; isPublic?: boolean; publicAccessLevel?: string | null },
) {
  const document = await prisma.document.findFirst({
    where: { id: documentId, deletedAt: null },
  });
  if (!document) throw new NotFoundError('Document');

  return prisma.document.update({
    where: { id: documentId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      ...(data.publicAccessLevel !== undefined && { publicAccessLevel: data.publicAccessLevel }),
    },
    select: { id: true, title: true, isPublic: true, publicAccessLevel: true, updatedAt: true },
  });
}

// ─────────────────────────────────────────────
// C.6 — Soft Delete Document
// ─────────────────────────────────────────────
export async function deleteDocument(documentId: string) {
  const document = await prisma.document.findFirst({
    where: { id: documentId, deletedAt: null },
  });
  if (!document) throw new NotFoundError('Document');

  return prisma.document.update({
    where: { id: documentId },
    data: { deletedAt: new Date() },
    select: { id: true, deletedAt: true },
  });
}

// ─────────────────────────────────────────────
// C.7 — Add Member
// ─────────────────────────────────────────────
export async function addMember(
  documentId: string,
  inviterUserId: string,
  email: string,
  role: 'editor' | 'viewer',
) {
  // Prevent assigning owner role via invite
  if (role === ('owner' as string)) {
    throw new ValidationError("Cannot assign 'owner' role via invitation");
  }

  // Look up user by email — don't reveal whether they exist (user enumeration)
  const invitee = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  if (!invitee) {
    throw new NotFoundError('User with that email');
  }

  // Cannot invite yourself
  if (invitee.id === inviterUserId) {
    throw new ConflictError('SELF_INVITE', 'You cannot invite yourself');
  }

  // Check for duplicate membership
  const existing = await prisma.documentMember.findUnique({
    where: { userId_documentId: { userId: invitee.id, documentId } },
  });

  if (existing) {
    throw new ConflictError('ALREADY_MEMBER', 'This user is already a member of this document');
  }

  const member = await prisma.documentMember.create({
    data: { userId: invitee.id, documentId, role },
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  return { ...member.user, role: member.role };
}

// ─────────────────────────────────────────────
// C.8 — Remove Member
// ─────────────────────────────────────────────
export async function removeMember(documentId: string, targetUserId: string) {
  const membership = await prisma.documentMember.findUnique({
    where: { userId_documentId: { userId: targetUserId, documentId } },
    select: { role: true },
  });

  if (!membership) throw new NotFoundError('Member');

  // Cannot remove the owner
  if (membership.role === 'owner') {
    throw new ForbiddenError('Cannot remove the document owner');
  }

  await prisma.documentMember.delete({
    where: { userId_documentId: { userId: targetUserId, documentId } },
  });

  return { userId: targetUserId, removed: true };
}
