'use client';

import React, { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { io, Socket } from 'socket.io-client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';

// We manage a Y.Doc reference outside React state to avoid re-renders causing re-initialization
export default function SpikePage() {
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<any>(null);
  const [status, setStatus] = useState('connecting');
  const [clientId] = useState(() => Math.floor(Math.random() * 10000));

  useEffect(() => {
    const socket: Socket = io('http://localhost:4001');

    socket.on('connect', () => {
      setStatus('connected');
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });

    // 1. Send local Y.js updates to the server
    ydoc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== provider) {
        socket.emit('y-update', update);
      }
    });

    // 2. Receive remote Y.js updates
    socket.on('y-update', (update: ArrayBuffer) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), provider);
    });

    // 3. Awareness/Cursor sync
    // The Y.js awareness instance is automatically created by the CollaborationCursor extension,
    // but without y-websocket or a standard provider, we have to wire it manually if we don't have a provider object.
    // Wait, Tiptap's CollaborationCursor requires a `provider` object that has an `awareness` property.
    // Let's create a minimal mock provider for the extension.
    
    // Y.js awareness usually comes from 'y-protocols/awareness'
    // but let's see if we can just skip cursor test here or implement a bare minimum
    const mockProvider = {
      on: () => {},
      off: () => {},
      awareness: null, // Will let Tiptap create it if null? No, Tiptap expects it.
    };
    
    setProvider(mockProvider);

    return () => {
      socket.disconnect();
      ydoc.destroy();
    };
  }, [ydoc, provider]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // History should be disabled when using collaboration
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      // We'll test text convergence first, if that works, the spike passes the hardest part.
    ],
  });

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Y.js + Socket.io Spike</h1>
      <p>Status: <strong>{status}</strong></p>
      <p>Client ID: {clientId}</p>
      
      <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '1rem', minHeight: '300px' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
