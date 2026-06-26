'use client';

import React, { useState, useCallback } from 'react';
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
import { SlashCommandExtension, setSlashCallbacks } from './SlashCommandExtension';
import type { SlashMenuState } from './SlashCommandExtension';
import { AIGhostExtension } from './AIGhostExtension';
import SlashMenu from './SlashMenu';
import type { AICommandId } from './SlashMenu';
import { useAISuggestion } from '../../hooks/useAISuggestion';
import MemberManagementModal, { DocumentMember } from './MemberManagementModal';

const lowlight = createLowlight(common);

interface EditorComponentProps {
  documentId: string;
  title: string;
  initialYDocBase64: string;
  role: 'owner' | 'editor' | 'viewer';
  userId: string;
  userName: string;
  initialMembers?: DocumentMember[];
}

export default function EditorComponent({ 
  documentId, 
  title, 
  initialYDocBase64, 
  role, 
  userId, 
  userName,
  initialMembers = []
}: EditorComponentProps) {
  const canEdit = role === 'owner' || role === 'editor';
  const [members, setMembers] = useState<DocumentMember[]>(initialMembers);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // ── Slash menu state ──────────────────────────────────────────────
  const [slashMenu, setSlashMenu] = useState<SlashMenuState & { selectedIndex: number }>({ 
    isOpen: false, coords: { top: 0, left: 0 }, query: '', range: { from: 0, to: 0 }, selectedIndex: 0,
  });
  
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
        placeholder: "Start writing, or type '/' for AI commands...",
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
      // F.4 — Slash command trigger detection
      SlashCommandExtension,
      // F.5 — Ghost decoration renderer (local-only, never synced via Y.js)
      AIGhostExtension,
    ],
    editable: canEdit,
  });

  // ── AI Suggestion hook (F.7 — orchestrates F.3, F.5, F.6) ───────
  const { status: aiStatus, triggerSuggestion } = useAISuggestion(editor);

  // ── Wire slash callbacks to the ProseMirror extension ────────────
  const hasSelection = editor ? !editor.state.selection.empty : false;

  const handleSlashOpen = useCallback((state: SlashMenuState) => {
    setSlashMenu({ ...state, selectedIndex: 0 });
  }, []);

  const handleSlashUpdate = useCallback((state: SlashMenuState) => {
    setSlashMenu((prev) => ({ ...state, selectedIndex: prev.selectedIndex }));
  }, []);

  const handleSlashClose = useCallback(() => {
    setSlashMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleSlashArrowUp = useCallback(() => {
    setSlashMenu((prev) => ({ 
      ...prev, 
      selectedIndex: Math.max(0, prev.selectedIndex - 1) 
    }));
  }, []);

  const handleSlashArrowDown = useCallback(() => {
    setSlashMenu((prev) => ({ 
      ...prev, 
      selectedIndex: prev.selectedIndex + 1 
    }));
  }, []);

  const handleSlashSelect = useCallback((commandId: AICommandId) => {
    if (!editor) return;
    // Delete the slash trigger text before generating
    const { range } = slashMenu;
    editor.chain().focus().deleteRange(range).run();
    handleSlashClose();

    const selText = editor.state.selection.empty
      ? undefined
      : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to);
    triggerSuggestion(commandId, selText);
  }, [editor, slashMenu, handleSlashClose, triggerSuggestion]);

  const handleSlashEnter = useCallback(() => {
    const commands: AICommandId[] = canEdit
      ? (hasSelection ? ['continue', 'rewrite', 'summarize'] : ['continue', 'summarize'])
      : [];
    const cmd = commands[slashMenu.selectedIndex];
    if (cmd) handleSlashSelect(cmd);
  }, [canEdit, hasSelection, slashMenu.selectedIndex, handleSlashSelect]);

  // Register callbacks with the ProseMirror extension (runs after editor mount)
  React.useEffect(() => {
    if (!editor) return;
    setSlashCallbacks({
      onOpen: handleSlashOpen,
      onUpdate: handleSlashUpdate,
      onClose: handleSlashClose,
      onArrowUp: handleSlashArrowUp,
      onArrowDown: handleSlashArrowDown,
      onEnter: handleSlashEnter,
    });
  }, [editor, handleSlashOpen, handleSlashUpdate, handleSlashClose, handleSlashArrowUp, handleSlashArrowDown, handleSlashEnter]);

  // Synchronize editor editability dynamically on role/permission updates
  React.useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(canEdit);
    }
  }, [editor, canEdit]);


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
        <div className="editor-header__right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <PresenceBar awareness={awareness} />
          {role === 'owner' && (
            <button 
              onClick={() => setIsMemberModalOpen(true)}
              className="editor-share-btn"
              title="Manage members and permissions"
              aria-label="Manage members"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Share
            </button>
          )}
        </div>
      </header>

      {/* Editor Workspace */}
      <main className="editor-workspace-main">
        <div className="editor-container">
          {canEdit && <EditorToolbar editor={editor} />}

          {/* F.4 — Slash command floating menu */}
          {canEdit && (
            <SlashMenu
              isOpen={slashMenu.isOpen}
              coords={slashMenu.coords}
              query={slashMenu.query}
              selectedIndex={slashMenu.selectedIndex}
              hasSelection={hasSelection}
              onSelect={handleSlashSelect}
              onClose={handleSlashClose}
              onIndexChange={(i) => setSlashMenu((prev) => ({ ...prev, selectedIndex: i }))}
            />
          )}

          {/* AI status indicator */}
          {aiStatus === 'streaming' && (
            <div className="ai-streaming-indicator">
              <span className="ai-streaming-dot" />
              AI is writing…
            </div>
          )}
          {aiStatus === 'suggested' && (
            <div className="ai-suggested-indicator">
              <span>Tab</span> to accept · <span>Esc</span> to reject
            </div>
          )}

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

      {/* G.3 — Document Member Management Modal */}
      {role === 'owner' && (
        <MemberManagementModal
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          documentId={documentId}
          currentUserId={userId}
          members={members}
          onMembersChange={setMembers}
        />
      )}

      <style>{`
        .editor-layout {
          display: flex; flex-direction: column; height: 100vh;
          background: #050505; color: #fff;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .editor-share-btn {
          display: flex; align-items: center; justify-content: center;
          height: 32px; padding: 0 0.875rem; border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #e7e5e4; font-size: 0.8125rem; font-weight: 500;
          cursor: pointer; transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.1s;
        }
        .editor-share-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.15);
          color: #fff;
        }
        .editor-share-btn:active {
          transform: scale(0.98);
        }

        /* ── AI Ghost Text (F.5) ── */
        .ai-ghost-text {
          color: #57534e;
          font-style: italic;
          pointer-events: none;
          user-select: none;
          opacity: 0.85;
        }

        /* ── AI Status Badges ── */
        .ai-streaming-indicator {
          position: absolute; bottom: 4.5rem; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.375rem 0.875rem; border-radius: 9999px;
          background: rgba(10,10,10,0.9); border: 1px solid rgba(129,140,248,0.3);
          font-size: 0.75rem; color: #818cf8; font-weight: 500;
          backdrop-filter: blur(8px); z-index: 30;
          animation: fade-in 0.2s ease;
        }
        .ai-streaming-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #818cf8; animation: pulse 1.2s infinite;
        }
        .ai-suggested-indicator {
          position: absolute; bottom: 4.5rem; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 0.375rem;
          padding: 0.375rem 0.875rem; border-radius: 9999px;
          background: rgba(10,10,10,0.9); border: 1px solid rgba(16,185,129,0.3);
          font-size: 0.75rem; color: #a8a29e;
          backdrop-filter: blur(8px); z-index: 30;
          animation: fade-in 0.2s ease;
        }
        .ai-suggested-indicator span {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px; padding: 0.1em 0.35em;
          font-family: monospace; font-size: 0.6875rem; color: #e7e5e4;
        }
        @keyframes fade-in { from { opacity: 0; transform: translateX(-50%) translateY(4px); } }

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
