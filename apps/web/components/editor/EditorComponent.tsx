'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
// @ts-expect-error no types for lodash.debounce default import
import debounce from 'lodash.debounce';
import * as Y from 'yjs';
import EditorToolbar from './EditorToolbar';

const lowlight = createLowlight(common);

interface EditorComponentProps {
  documentId: string;
  initialYDocBase64: string;
  role: 'owner' | 'editor' | 'viewer';
}

export default function EditorComponent({ documentId, initialYDocBase64, role }: EditorComponentProps) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [initialHtml, setInitialHtml] = useState<string>('');
  const canEdit = role === 'owner' || role === 'editor';
  
  // Ref to hold the latest content for beforeunload
  const contentRef = useRef<string>('');

  useEffect(() => {
    try {
      // Decode the Y.js state from the server and extract our temporary HTML field
      const ydoc = new Y.Doc();
      const binary = Uint8Array.from(atob(initialYDocBase64), c => c.charCodeAt(0));
      if (binary.length > 0) {
        Y.applyUpdate(ydoc, binary);
      }
      const html = ydoc.getText('html').toString();
      setInitialHtml(html);
      contentRef.current = html;
    } catch (e) {
      console.error('Failed to decode initial document state', e);
    }
  }, [initialYDocBase64]);

  // Synchronous save function (used by beforeunload)
  const saveContentSync = useCallback((htmlContent: string) => {
    if (!canEdit) return;
    
    // TEMPORARY: Encode HTML into a Y.js doc for D.4 naive saving.
    // This will be replaced by native Y.js syncing in Module E.
    const ydoc = new Y.Doc();
    ydoc.getText('html').insert(0, htmlContent);
    const binary = Y.encodeStateAsUpdate(ydoc);
    const base64 = btoa(Array.from(binary).map(b => String.fromCharCode(b)).join(''));

    // use fetch with keepalive: true for beforeunload
    fetch(`/api/docs/${documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yDocState: base64 }),
      keepalive: true,
    }).catch(e => console.error('Sync save failed', e));
  }, [documentId, canEdit]);

  // Debounced save function for normal typing
  const debouncedSave = useCallback(
    debounce(async (htmlContent: string) => {
      if (!canEdit) return;
      setSaveStatus('saving');
      
      const ydoc = new Y.Doc();
      ydoc.getText('html').insert(0, htmlContent);
      const binary = Y.encodeStateAsUpdate(ydoc);
      const base64 = btoa(Array.from(binary).map(b => String.fromCharCode(b)).join(''));

      try {
        const res = await fetch(`/api/docs/${documentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ yDocState: base64 }),
        });
        if (!res.ok) throw new Error('Failed to save');
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('error');
      }
    }, 2000),
    [documentId, canEdit]
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'saving') {
        saveContentSync(contentRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      debouncedSave.cancel();
      // Ensure we save if unmounting while changes are pending
      if (saveStatus === 'saving') {
        saveContentSync(contentRef.current);
      }
    };
  }, [saveStatus, saveContentSync, debouncedSave]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: initialHtml,
    editable: canEdit,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      contentRef.current = html;
      setSaveStatus('saving');
      debouncedSave(html);
    },
  }, [initialHtml, canEdit]); // Re-initialize when initialHtml is parsed

  // We only render the editor once initialHtml is extracted
  if (initialHtml === '' && initialYDocBase64 !== '') {
     // Still parsing
  }

  return (
    <div className="editor-container">
      {canEdit && <EditorToolbar editor={editor} />}
      
      <div className="editor-content-wrapper">
        <EditorContent editor={editor} className="tiptap-editor" />
      </div>

      <div className="editor-status">
        {saveStatus === 'saving' && <span className="status-badge status-saving"><span className="status-dot"></span> Saving...</span>}
        {saveStatus === 'saved' && <span className="status-badge status-saved">✓ Saved</span>}
        {saveStatus === 'error' && <span className="status-badge status-error">⚠ Save Failed</span>}
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
          display: flex; align-items: center; gap: 0.375rem;
          padding: 0.375rem 0.75rem; border-radius: 9999px;
          font-size: 0.75rem; font-weight: 500;
          background: rgba(10,10,10,0.8); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.05);
        }

        .status-saving { color: #a8a29e; }
        .status-saved { color: #a8a29e; }
        .status-error { color: #fca5a5; border-color: rgba(239,68,68,0.2); }

        .status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #a8a29e; animation: pulse 1.5s infinite;
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
