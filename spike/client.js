import { io } from 'socket.io-client';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';

const ROOM_ID = 'collab-spike-room';

// Helper function to bind custom Socket.io sync to Y.Doc and Awareness
function setupSocketProvider(socket, yDoc, awareness, clientName) {
  // Join the document room
  socket.emit('join-room', ROOM_ID);

  // --- Document Sync ---
  // Emit local changes to the server
  yDoc.on('update', (update, origin) => {
    if (origin !== `${clientName}-sync`) {
      console.log(`[${clientName}] Local Y.Doc update generated, emitting...`);
      socket.emit('y-update', update.buffer);
    }
  });

  // Apply remote updates from the server
  socket.on('y-update', (updateBuffer) => {
    console.log(`[${clientName}] Remote Y.Doc update received, applying...`);
    // Pass origin identifier to prevent echo loop
    Y.applyUpdate(yDoc, new Uint8Array(updateBuffer), `${clientName}-sync`);
  });

  // --- Awareness Sync (Cursors & Presence) ---
  // Emit local cursor/selection changes to the server
  awareness.on('update', ({ added, updated, removed }) => {
    const changedClients = added.concat(updated).concat(removed);
    const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients);
    socket.emit('y-awareness', update.buffer);
  });

  // Apply remote awareness updates
  socket.on('y-awareness', (updateBuffer) => {
    awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(updateBuffer), `${clientName}-sync`);
  });

  // Connection UI listeners
  const dotElement = document.getElementById(`dot-${clientName.toLowerCase().slice(-1)}`);
  socket.on('connect', () => {
    if (dotElement) {
      dotElement.classList.add('connected');
      dotElement.nextElementSibling.textContent = 'Socket Connected';
    }
  });
  socket.on('disconnect', () => {
    if (dotElement) {
      dotElement.classList.remove('connected');
      dotElement.nextElementSibling.textContent = 'Socket Disconnected';
    }
  });
}

// --- Initialize Client A (Pink) ---
const socketA = io('http://localhost:3000');
const yDocA = new Y.Doc();
const awarenessA = new awarenessProtocol.Awareness(yDocA);
setupSocketProvider(socketA, yDocA, awarenessA, 'ClientA');

const editorA = new Editor({
  element: document.querySelector('#editor-a'),
  extensions: [
    StarterKit.configure({
      history: false, // Turn off history so Collaboration extension takes care of undo/redo stack
    }),
    Collaboration.configure({
      document: yDocA,
    }),
    CollaborationCursor.configure({
      awareness: awarenessA,
      user: {
        name: 'User A (Pink)',
        color: '#ec4899',
      },
    }),
  ],
  content: `
    <h1>Hello, Collaborative Editor!</h1>
    <p>This is a throwaway spike validating the real-time collaboration pipeline.</p>
    <blockquote>Try typing here and watch the panel to the right update in real-time.</blockquote>
    <p>We are using <code>Y.js</code> for CRDT-based sync and <code>Socket.io</code> for binary transport.</p>
  `,
});

// --- Initialize Client B (Blue) ---
const socketB = io('http://localhost:3000');
const yDocB = new Y.Doc();
const awarenessB = new awarenessProtocol.Awareness(yDocB);
setupSocketProvider(socketB, yDocB, awarenessB, 'ClientB');

const editorB = new Editor({
  element: document.querySelector('#editor-b'),
  extensions: [
    StarterKit.configure({
      history: false,
    }),
    Collaboration.configure({
      document: yDocB,
    }),
    CollaborationCursor.configure({
      awareness: awarenessB,
      user: {
        name: 'User B (Blue)',
        color: '#06b6d4',
      },
    }),
  ],
  // Start Editor B empty; it should receive the synced content immediately from Editor A via Socket.io
  content: '',
});

// --- Bind Custom Toolbars ---
function bindToolbar(editor, toolbarId) {
  const toolbar = document.querySelector(toolbarId);
  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('.toolbar-btn');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'bold') editor.chain().focus().toggleBold().run();
    if (action === 'italic') editor.chain().focus().toggleItalic().run();
    if (action === 'heading1') editor.chain().focus().toggleHeading({ level: 1 }).run();
    if (action === 'heading2') editor.chain().focus().toggleHeading({ level: 2 }).run();
    if (action === 'blockquote') editor.chain().focus().toggleBlockquote().run();
  });

  // Track active state of formatting buttons
  editor.on('transaction', () => {
    const btns = toolbar.querySelectorAll('.toolbar-btn');
    btns.forEach(btn => {
      const action = btn.dataset.action;
      let active = false;
      if (action === 'bold') active = editor.isActive('bold');
      if (action === 'italic') active = editor.isActive('italic');
      if (action === 'heading1') active = editor.isActive('heading', { level: 1 });
      if (action === 'heading2') active = editor.isActive('heading', { level: 2 });
      if (action === 'blockquote') active = editor.isActive('blockquote');

      if (active) btn.classList.add('is-active');
      else btn.classList.remove('is-active');
    });
  });
}

bindToolbar(editorA, '#toolbar-a');
bindToolbar(editorB, '#toolbar-b');
