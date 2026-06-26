'use client';

import React, { useEffect, useRef } from 'react';

export type AICommandId = 'continue' | 'rewrite' | 'summarize';

interface AICommand {
  id: AICommandId;
  label: string;
  description: string;
  icon: string;
  requiresSelection?: boolean;
}

const AI_COMMANDS: AICommand[] = [
  {
    id: 'continue',
    label: 'Continue writing',
    description: 'AI continues your text from the cursor',
    icon: '✦',
  },
  {
    id: 'rewrite',
    label: 'Rewrite selection',
    description: 'Rewrite selected text with AI',
    icon: '↺',
    requiresSelection: true,
  },
  {
    id: 'summarize',
    label: 'Summarize',
    description: 'Generate a summary of the document',
    icon: '≡',
  },
];

interface SlashMenuProps {
  isOpen: boolean;
  coords: { top: number; left: number };
  query: string;
  selectedIndex: number;
  hasSelection: boolean;
  onSelect: (commandId: AICommandId) => void;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export default function SlashMenu({
  isOpen,
  coords,
  query,
  selectedIndex,
  hasSelection,
  onSelect,
  onClose,
  onIndexChange,
}: SlashMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = AI_COMMANDS.filter((cmd) => {
    if (cmd.requiresSelection && !hasSelection) return false;
    if (!query) return true;
    return (
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
    );
  });

  // Clamp selectedIndex when filter changes
  const safeIndex = Math.min(selectedIndex, Math.max(filteredCommands.length - 1, 0));

  // Scroll active item into view
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const items = menu.querySelectorAll('[data-command-item]');
    const activeItem = items[safeIndex] as HTMLElement;
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [safeIndex]);

  if (!isOpen || filteredCommands.length === 0) return null;

  // Adjust position to stay within viewport
  const adjustedTop = Math.min(coords.top, window.innerHeight - 220);
  const adjustedLeft = Math.min(coords.left, window.innerWidth - 280);

  return (
    <>
      {/* Backdrop for click-outside-to-close */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 49 }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={menuRef}
        role="menu"
        aria-label="AI command palette"
        style={{
          position: 'fixed',
          top: adjustedTop,
          left: adjustedLeft,
          zIndex: 50,
          minWidth: 260,
          maxWidth: 320,
        }}
        className="slash-menu"
      >
        {/* Header */}
        <div className="slash-menu__header">
          <span className="slash-menu__header-icon">✦</span>
          <span className="slash-menu__header-text">AI Assistant</span>
        </div>

        {/* Commands */}
        <div className="slash-menu__list">
          {filteredCommands.map((cmd, index) => (
            <button
              key={cmd.id}
              role="menuitem"
              data-command-item
              className={`slash-menu__item ${index === safeIndex ? 'slash-menu__item--active' : ''}`}
              onClick={() => onSelect(cmd.id)}
              onMouseEnter={() => onIndexChange(index)}
              aria-label={cmd.label}
            >
              <span className="slash-menu__item-icon">{cmd.icon}</span>
              <div className="slash-menu__item-content">
                <span className="slash-menu__item-label">{cmd.label}</span>
                <span className="slash-menu__item-desc">{cmd.description}</span>
              </div>
              {index === safeIndex && (
                <span className="slash-menu__item-enter" aria-hidden>↵</span>
              )}
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="slash-menu__footer">
          <kbd>↑↓</kbd> navigate · <kbd>↵</kbd> select · <kbd>Esc</kbd> close
        </div>
      </div>

      <style>{`
        .slash-menu {
          background: #111;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.04);
          overflow: hidden;
          animation: slash-menu-in 0.15s ease;
          backdrop-filter: blur(20px);
        }

        @keyframes slash-menu-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .slash-menu__header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 0.875rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .slash-menu__header-icon {
          font-size: 0.75rem;
          background: linear-gradient(135deg, #818cf8, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .slash-menu__header-text {
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #78716c;
        }

        .slash-menu__list {
          padding: 0.375rem;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .slash-menu__item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.625rem 0.75rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.12s ease;
          color: #a8a29e;
        }

        .slash-menu__item:hover,
        .slash-menu__item--active {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        .slash-menu__item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(129, 140, 248, 0.1);
          color: #818cf8;
          font-size: 0.875rem;
          flex-shrink: 0;
          border: 1px solid rgba(129, 140, 248, 0.15);
        }

        .slash-menu__item-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .slash-menu__item-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: inherit;
        }

        .slash-menu__item-desc {
          font-size: 0.6875rem;
          color: #57534e;
        }

        .slash-menu__item--active .slash-menu__item-desc {
          color: #78716c;
        }

        .slash-menu__item-enter {
          font-size: 0.75rem;
          color: #57534e;
          flex-shrink: 0;
        }

        .slash-menu__footer {
          padding: 0.5rem 0.875rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 0.625rem;
          color: #57534e;
          letter-spacing: 0.02em;
        }

        .slash-menu__footer kbd {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          padding: 0.1em 0.3em;
          font-family: monospace;
          font-size: 0.6875rem;
        }
      `}</style>
    </>
  );
}
