import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';

interface UseCollabProviderProps {
  documentId: string;
  ydoc: Y.Doc;
}

export function useCollabProvider({ documentId, ydoc }: UseCollabProviderProps) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    
    // Establish connection to Socket.io server with NextAuth session cookies
    const socket: Socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setStatus('connected');
      socket.emit('join-room', { documentId });
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

    return () => {
      ydoc.off('update', handleLocalUpdate);
      socket.disconnect();
    };
  }, [documentId, ydoc]);

  return { status };
}
