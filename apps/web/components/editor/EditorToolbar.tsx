'use client';

import { Editor } from '@tiptap/react';
import React from 'react';

interface EditorToolbarProps {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) {
    return <div className="editor-toolbar editor-toolbar--skeleton" />;
  }

  return (
    <div className="editor-toolbar">
      {/* Text styles */}
      <div className="toolbar-group">
        <ToolbarButton 
          isActive={editor.isActive('bold')} 
          onClick={() => editor.chain().focus().toggleBold().run()}
          ariaLabel="Bold (Mod-B)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton 
          isActive={editor.isActive('italic')} 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          ariaLabel="Italic (Mod-I)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton 
          isActive={editor.isActive('strike')} 
          onClick={() => editor.chain().focus().toggleStrike().run()}
          ariaLabel="Strikethrough (Mod-Shift-X)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/>
          </svg>
        </ToolbarButton>
      </div>

      <div className="toolbar-divider" />

      {/* Headings */}
      <div className="toolbar-group">
        <ToolbarButton 
          isActive={editor.isActive('heading', { level: 1 })} 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          ariaLabel="Heading 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton 
          isActive={editor.isActive('heading', { level: 2 })} 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          ariaLabel="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton 
          isActive={editor.isActive('heading', { level: 3 })} 
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          ariaLabel="Heading 3"
        >
          H3
        </ToolbarButton>
      </div>

      <div className="toolbar-divider" />

      {/* Lists */}
      <div className="toolbar-group">
        <ToolbarButton 
          isActive={editor.isActive('bulletList')} 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          ariaLabel="Bullet List"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><line x1="4" y1="6" x2="4.01" y2="6"/><line x1="4" y1="12" x2="4.01" y2="12"/><line x1="4" y1="18" x2="4.01" y2="18"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton 
          isActive={editor.isActive('orderedList')} 
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          ariaLabel="Ordered List"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
          </svg>
        </ToolbarButton>
      </div>

      <div className="toolbar-divider" />

      {/* Code */}
      <div className="toolbar-group">
        <ToolbarButton 
          isActive={editor.isActive('codeBlock')} 
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          ariaLabel="Code Block"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton 
          isActive={editor.isActive('blockquote')} 
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          ariaLabel="Blockquote"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.99c1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
          </svg>
        </ToolbarButton>
      </div>

      <style>{`
        .editor-toolbar {
          position: sticky; top: 0; z-index: 10;
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(10,10,10,0.8);
          backdrop-filter: blur(12px);
          overflow-x: auto;
        }

        .editor-toolbar--skeleton {
          height: 48px; background: rgba(255,255,255,0.02);
        }

        .toolbar-group {
          display: flex; align-items: center; gap: 0.25rem;
        }

        .toolbar-divider {
          width: 1px; height: 1.5rem;
          background: rgba(255,255,255,0.1);
          margin: 0 0.25rem;
        }

        .toolbar-btn {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 6px;
          border: 1px solid transparent; background: transparent;
          color: #a8a29e; cursor: pointer; transition: all 0.2s;
          font-family: inherit; font-size: 0.8125rem; font-weight: 500;
        }

        .toolbar-btn:hover {
          background: rgba(255,255,255,0.05); color: #fff;
        }

        .toolbar-btn--active {
          background: rgba(255,255,255,0.1); color: #fff;
          border-color: rgba(255,255,255,0.1);
        }
      `}</style>
    </div>
  );
}

// Separate component to prevent unnecessary re-renders via React.memo if needed
// For now, it's a simple wrapper
function ToolbarButton({ 
  isActive, 
  onClick, 
  ariaLabel, 
  children 
}: { 
  isActive: boolean; 
  onClick: () => void; 
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`toolbar-btn ${isActive ? 'toolbar-btn--active' : ''}`}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      title={ariaLabel}
    >
      {children}
    </button>
  );
}
