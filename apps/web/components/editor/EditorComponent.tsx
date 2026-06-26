'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import EditorToolbar from './EditorToolbar';
import PresenceBar from './PresenceBar';
import { useCollabProvider } from '../../hooks/useCollabProvider';

const lowlight = createLowlight(common);

interface EditorComponentProps {
  documentId: string;
  title: string;
  initialYDocBase64: string;
  role: 'owner' | 'editor' | 'viewer';
  userId: string;
  userName: string;
}

export default function EditorComponent({ 
  documentId, 
  title, 
  initialYDocBase64, 
  role, 
  userId, 
  userName 
}: EditorComponentProps) {
  const canEdit = role === 'owner' || role === 'editor';
  
  // Hydrate Y.Doc with initial server-rendered state during state initialization
  const [ydoc] = useState(() => {
    const doc = new Y.Doc();
    try {
      if (initialYDocBase64) {
        const binary = Uint8Array.from(atob(initialYDocBase64), (c) => c.charCodeAt(0));
        if (binary.length > 0) {
          Y.applyUpdate(doc, binary);
        }
      }
    } catch (e) {
      console.error('[Editor] Failed to hydrate initial Y.Doc state:', e);
    }
    return doc;
  });

  // Activate WebSocket collaboration & awareness provider
  const { status: collabStatus, awareness } = useCollabProvider({ 
    documentId, 
    ydoc, 
    userId, 
    userName 
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Collaboration handles undo/redo queue internally, disable default history
        undoRedo: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: { awareness } as any,
        user: {
          name: userName,
          color: '#F59E0B', // Deterministic color is populated dynamically by awareness hook
        },
      }),
    ],
    editable: canEdit,
  });

  return (
    <div className="editor-layout">
      {/* Top Navbar */}
      <header className="editor-header">
        <div className="editor-header__left">
          <a href="/dashboard" className="editor-header__back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </a>
          <div className="editor-header__info">
            <h1 className="editor-header__title">{title}</h1>
            <span className={`role-badge role-badge--${role}`}>
              {role}
            </span>
          </div>
        </div>
        <div className="editor-header__right">
          <PresenceBar awareness={awareness} />
        </div>
      </header>

      {/* Editor Workspace */}
      <main className="editor-workspace-main">
        <div className="editor-container">
          {canEdit && <EditorToolbar editor={editor} />}
          
          <div className="editor-content-wrapper">
            <EditorContent editor={editor} className="tiptap-editor" />
          </div>

          <div className="editor-status">
            {collabStatus === 'connecting' && (
              <span className="status-badge status-connecting">
                <span className="status-dot dot-connecting"></span> Syncing...
              </span>
            )}
            {collabStatus === 'connected' && (
              <span className="status-badge status-connected">
                <span className="status-dot dot-connected"></span> Sync Connected
              </span>
            )}
            {collabStatus === 'disconnected' && (
              <span className="status-badge status-disconnected">
                <span className="status-dot dot-disconnected"></span> Offline
              </span>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .editor-layout {
          display: flex; flex-direction: column; height: 100vh;
          background: #050505; color: #fff;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .editor-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 1.5rem; height: 56px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(5,5,5,0.8);
          backdrop-filter: blur(12px);
          z-index: 10;
        }

        .editor-header__left { display: flex; align-items: center; gap: 1rem; }
        .editor-header__back {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 6px;
          color: #a8a29e; transition: background 0.2s, color 0.2s;
          text-decoration: none;
        }
        .editor-header__back:hover { background: rgba(255,255,255,0.05); color: #fff; }

        .editor-header__info { display: flex; align-items: center; gap: 0.75rem; }
        .editor-header__title { font-size: 0.9375rem; font-weight: 500; margin: 0; }

        .role-badge {
          font-size: 0.625rem; font-weight: 600; text-transform: uppercase;
          padding: 0.1875rem 0.5rem; border-radius: 9999px; letter-spacing: 0.05em;
        }
        .role-badge--owner { background: rgba(59,130,246,0.1); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }
        .role-badge--editor { background: rgba(34,197,94,0.1); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
        .role-badge--viewer { background: rgba(107,114,128,0.1); color: #9ca3af; border: 1px solid rgba(107,114,128,0.2); }

        .editor-workspace-main {
          flex: 1; overflow: hidden; display: flex; flex-direction: column;
        }

        .editor-container {
          flex: 1; display: flex; flex-direction: column; height: 100%;
          position: relative;
        }

        .editor-content-wrapper {
          flex: 1; overflow-y: auto; padding: 2rem 1.5rem 6rem;
          display: flex; justify-content: center;
        }

        .tiptap-editor {
          width: 100%; max-width: 800px;
        }

        .editor-status {
          position: absolute; bottom: 1.5rem; right: 1.5rem; z-index: 20;
        }

        .status-badge {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.375rem 0.75rem; border-radius: 9999px;
          font-size: 0.75rem; font-weight: 500;
          background: rgba(10,10,10,0.8); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.05);
        }

        .status-connecting { color: #a8a29e; }
        .status-connected { color: #10b981; }
        .status-disconnected { color: #fca5a5; border-color: rgba(239,68,68,0.2); }

        .status-dot {
          width: 6px; height: 6px; border-radius: 50%;
        }

        .dot-connecting {
          background: #f59e0b;
          animation: pulse 1.5s infinite;
        }

        .dot-connected {
          background: #10b981;
        }

        .dot-disconnected {
          background: #ef4444;
        }

        @keyframes pulse {
          0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; }
        }

        /* ── TIPTAP PROSEMIRROR STYLES ── */
        .ProseMirror {
          min-height: 100%; outline: none; font-family: 'Inter', sans-serif;
          color: #e7e5e4; line-height: 1.7; font-size: 1rem;
        }

        .ProseMirror p { margin-bottom: 1.2rem; }

        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
          color: #fff; font-weight: 500; letter-spacing: -0.02em;
          margin-top: 2rem; margin-bottom: 1rem;
        }
        .ProseMirror h1 { font-size: 2.25rem; }
        .ProseMirror h2 { font-size: 1.5rem; }
        .ProseMirror h3 { font-size: 1.25rem; }

        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5rem; margin-bottom: 1.2rem;
        }
        .ProseMirror li p { margin-bottom: 0.5rem; }

        .ProseMirror blockquote {
          border-left: 3px solid rgba(255,255,255,0.1);
          padding-left: 1rem; color: #a8a29e;
          font-style: italic; margin: 1.5rem 0;
        }

        .ProseMirror code {
          background: rgba(255,255,255,0.05); border-radius: 4px;
          padding: 0.2em 0.4em; font-family: monospace; font-size: 0.875em;
        }

        .ProseMirror pre {
          background: #000; border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px; padding: 1rem; overflow-x: auto;
          margin: 1.5rem 0;
        }
        .ProseMirror pre code {
          background: none; padding: 0; font-size: 0.875em; color: inherit;
        }

        /* Placeholder */
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder); float: left;
          color: #57534e; pointer-events: none; height: 0;
        }

        /* ── COLLABORATION CURSOR STYLES ── */
        .collaboration-cursor__caret {
          position: relative;
          margin-left: -1px;
          margin-right: -1px;
          border-left: 2px solid;
          border-right: 2px solid;
          border-color: currentColor;
          word-break: normal;
          animation: caret-blink 1s step-end infinite;
        }

        .collaboration-cursor__label {
          position: absolute;
          top: -1.4em;
          left: -1px;
          font-size: 0.75rem;
          font-style: normal;
          font-weight: 600;
          line-height: normal;
          user-select: none;
          color: #fff;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          border-bottom-left-radius: 0;
          background: currentColor;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 10;
        }

        /* Show label on caret hover */
        .collaboration-cursor__caret:hover .collaboration-cursor__label {
          opacity: 1;
        }

        @keyframes caret-blink {
          from, to { border-color: transparent }
          50% { border-color: currentColor }
        }
      `}</style>
    </div>
  );
}
