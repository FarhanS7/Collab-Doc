'use client';

import { Extension } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const SLASH_PLUGIN_KEY = new PluginKey('slashCommand');

export interface SlashMenuState {
  isOpen: boolean;
  coords: { top: number; left: number };
  query: string;
  range: { from: number; to: number };
  selectedIndex: number;
}

/**
 * SlashCommandExtension — Tiptap Extension (F.4)
 *
 * Detects when the user types "/" at a word boundary, computes the
 * cursor viewport coordinates, and notifies the host component via the
 * onOpen / onKeyDown callbacks so a React floating menu can be rendered.
 *
 * Navigation (ArrowUp/Down, Enter, Escape) is delegated back to the host
 * component via onNavigate / onSelect / onClose.
 */
type SlashCallbacks = {
  onOpen: (state: SlashMenuState) => void;
  onUpdate: (state: SlashMenuState) => void;
  onClose: () => void;
  onArrowUp: () => void;
  onArrowDown: () => void;
  onEnter: () => void;
};

// We store callbacks in a module-level ref so they can be updated without
// recreating the ProseMirror plugin.
let _callbacks: SlashCallbacks | null = null;

export function setSlashCallbacks(cb: SlashCallbacks) {
  _callbacks = cb;
}

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: SLASH_PLUGIN_KEY,

        props: {
          handleKeyDown(view, event) {
            const { state } = view;
            const { selection } = state;
            const { $from } = selection;

            // Check if the slash menu should handle this event
            const meta = SLASH_PLUGIN_KEY.getState(state);
            if (!meta?.active) return false;

            if (event.key === 'ArrowUp') {
              event.preventDefault();
              _callbacks?.onArrowUp();
              return true;
            }
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              _callbacks?.onArrowDown();
              return true;
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              _callbacks?.onEnter();
              return true;
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              _callbacks?.onClose();
              return true;
            }

            return false;
          },
        },

        state: {
          init() {
            return { active: false };
          },
          apply(tr, value) {
            const meta = tr.getMeta(SLASH_PLUGIN_KEY);
            if (meta !== undefined) return meta;
            return value;
          },
        },

        view() {
          return {
            update(view) {
              const { state } = view;
              const { selection, doc } = state;
              const { $from, empty } = selection;

              if (!empty) {
                // If there's a selection range, close the menu
                const current = SLASH_PLUGIN_KEY.getState(state);
                if (current?.active) {
                  const tr = view.state.tr.setMeta(SLASH_PLUGIN_KEY, { active: false });
                  view.dispatch(tr);
                  _callbacks?.onClose();
                }
                return;
              }

              // Get text content of the current block from the start to cursor
              const lineStart = $from.start();
              const textBefore = $from.parent.textBetween(
                Math.max(0, $from.parentOffset - 50),
                $from.parentOffset,
                undefined,
                '\ufffc',
              );

              // Look for a "/" trigger — must be at start of block or after a space
              const slashIndex = textBefore.lastIndexOf('/');
              if (slashIndex === -1) {
                const current = SLASH_PLUGIN_KEY.getState(state);
                if (current?.active) {
                  const tr = view.state.tr.setMeta(SLASH_PLUGIN_KEY, { active: false });
                  view.dispatch(tr);
                  _callbacks?.onClose();
                }
                return;
              }

              const charBeforeSlash = textBefore[slashIndex - 1];
              const isWordBoundary =
                slashIndex === 0 || charBeforeSlash === ' ' || charBeforeSlash === '\n';

              if (!isWordBoundary) {
                const current = SLASH_PLUGIN_KEY.getState(state);
                if (current?.active) {
                  const tr = view.state.tr.setMeta(SLASH_PLUGIN_KEY, { active: false });
                  view.dispatch(tr);
                  _callbacks?.onClose();
                }
                return;
              }

              const query = textBefore.slice(slashIndex + 1);

              // Compute cursor DOM coords for menu positioning
              const coords = view.coordsAtPos($from.pos);

              const rangeFrom = lineStart + $from.parentOffset - (query.length + 1);
              const rangeTo = $from.pos;

              const menuState: SlashMenuState = {
                isOpen: true,
                coords: { top: coords.bottom + 8, left: coords.left },
                query,
                range: { from: rangeFrom, to: rangeTo },
                selectedIndex: 0,
              };

              const currentPluginState = SLASH_PLUGIN_KEY.getState(state);
              if (!currentPluginState?.active) {
                const tr = view.state.tr.setMeta(SLASH_PLUGIN_KEY, { active: true });
                view.dispatch(tr);
                _callbacks?.onOpen(menuState);
              } else {
                _callbacks?.onUpdate(menuState);
              }
            },
          };
        },
      }),
    ];
  },
});
