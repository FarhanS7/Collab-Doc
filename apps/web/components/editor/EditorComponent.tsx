'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import Collaboration from '@tiptap/extension-collaboration';
import debounce from 'lodash.debounce';
import * as Y from 'yjs';
import EditorToolbar from './EditorToolbar';
import { useCollabProvider } from '../../hooks/useCollabProvider';

const lowlight = createLowlight(common);

interface EditorComponentProps {
  documentId: string;
  initialYDocBase64: string;
  role: 'owner' | 'editor' | 'viewer';
}

export default function EditorComponent({ documentId, initialYDocBase64, role }: EditorComponentProps) {
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

  // Activate WebSocket collaboration provider
  const { status: collabStatus } = useCollabProvider({ documentId, ydoc });

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
    ],
    editable: canEdit,
  });

  return (
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

      <style>{`
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
      `}</style>
    </div>
  );
}
