import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';

interface UseCollabProviderProps {
  documentId: string;
  ydoc: Y.Doc;
  userId: string;
  userName: string;
}

export function useCollabProvider({ documentId, ydoc, userId, userName }: UseCollabProviderProps) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [awareness] = useState(() => new Awareness(ydoc));

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    
    // Establish connection to Socket.io server with NextAuth session cookies
    const socket: Socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    // Helper to get a stable visual color based on the user ID hash
    const getDeterministicColor = (id: string) => {
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
      }
      const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444', '#06B6D4', '#14B8A6'];
      return colors[Math.abs(hash) % colors.length];
    };

    socket.on('connect', () => {
      setStatus('connected');
      socket.emit('join-room', { documentId });

      // Hydrate local awareness state with user profile details
      awareness.setLocalStateField('user', {
        name: userName || 'Anonymous',
        color: getDeterministicColor(userId),
      });
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket Connection Error]:', error);
      setStatus('disconnected');
    });

    // 1. Listen for local Y.Doc changes and publish them to the server
    const handleLocalUpdate = (update: Uint8Array, origin: any) => {
      // Prevent infinite loops by only transmitting updates originated locally (not from socket)
      if (origin !== 'socket-sync') {
        socket.emit('y-update', update.buffer);
      }
    };
    ydoc.on('update', handleLocalUpdate);

    // 2. Receive remote changes from the server and merge them locally
    socket.on('y-update', (update: ArrayBuffer) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), 'socket-sync');
    });

    // 3. Listen for local awareness changes and publish them to the server
    const handleAwarenessUpdate = ({ added, updated, removed }: any) => {
      const localChanges = added.concat(updated, removed);
      const update = encodeAwarenessUpdate(awareness, localChanges);
      socket.emit('y-awareness', update.buffer);
    };
    awareness.on('update', handleAwarenessUpdate);

    // 4. Receive remote awareness changes from the server and merge them locally
    socket.on('y-awareness', (update: ArrayBuffer) => {
      applyAwarenessUpdate(awareness, new Uint8Array(update), 'socket-sync');
    });

    return () => {
      ydoc.off('update', handleLocalUpdate);
      awareness.off('update', handleAwarenessUpdate);
      socket.disconnect();
    };
  }, [documentId, ydoc, userId, userName, awareness]);

  return { status, awareness };
}
