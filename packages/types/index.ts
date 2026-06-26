// Core Database Entity Interfaces
export type DocumentRole = 'owner' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  provider: 'github' | 'google';
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  title: string;
  yDocState: Uint8Array; // Keep as Uint8Array for Y.js client side, Buffer on node.js
  ownerId: string;
  isPublic: boolean;
  publicAccessLevel: 'read' | 'edit' | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentMember {
  id: string;
  userId: string;
  documentId: string;
  role: DocumentRole;
  createdAt: Date;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  snapshotState: Uint8Array;
  createdAt: Date;
}

// WebSocket Payload Interfaces
export interface JoinRoomPayload {
  documentId: string;
}

export interface ClientToServerEvents {
  'join-room': (payload: JoinRoomPayload) => void;
  'y-update': (update: ArrayBuffer) => void;
  'y-awareness': (update: ArrayBuffer) => void;
  'y-sync-step-1': (stateVector: ArrayBuffer) => void;
}

export interface ServerToClientEvents {
  'y-update': (update: ArrayBuffer) => void;
  'y-awareness': (update: ArrayBuffer) => void;
  'y-sync-step-2': (payload: { diff: ArrayBuffer; stateVector: ArrayBuffer }) => void;
}
