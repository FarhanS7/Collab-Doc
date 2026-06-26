import { Extension } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const AI_GHOST_PLUGIN_KEY = new PluginKey<AIGhostState>('aiGhost');

interface AIGhostState {
  decorationSet: DecorationSet;
  triggerPos: number | null;
  text: string;
}

// Module-level setter so the hook can push updates without recreating the plugin
let _dispatchUpdate: ((text: string, triggerPos: number) => void) | null = null;
let _dispatchClear: (() => void) | null = null;

export function setAIGhostUpdater(
  onUpdate: (text: string, triggerPos: number) => void,
  onClear: () => void,
) {
  _dispatchUpdate = onUpdate;
  _dispatchClear = onClear;
}

// Transaction meta key for ghost decoration state updates
export const AI_GHOST_META = 'aiGhostMeta';

export type AIGhostAction =
  | { type: 'update'; text: string; triggerPos: number }
  | { type: 'clear' };

/**
 * AIGhostExtension — Tiptap Extension (F.5)
 *
 * Manages a ProseMirror plugin that renders the streaming AI suggestion
 * as a widget Decoration at the trigger position in the document.
 *
 * KEY properties:
 * - The decoration is LOCAL-ONLY — it is NEVER synced via Y.js.
 * - The trigger position is remapped through incoming transactions so
 *   the ghost stays correctly anchored when collaborators edit nearby.
 * - On any user keystroke (other than Tab/Escape handled externally),
 *   the decoration is cleared.
 */
export const AIGhostExtension = Extension.create({
  name: 'aiGhost',

  addProseMirrorPlugins() {
    return [
      new Plugin<AIGhostState>({
        key: AI_GHOST_PLUGIN_KEY,

        state: {
          init(_config, editorState) {
            return {
              decorationSet: DecorationSet.empty,
              triggerPos: null,
              text: '',
            };
          },

          apply(tr, pluginState, _oldState, newState) {
            const action: AIGhostAction | undefined = tr.getMeta(AI_GHOST_META);

            if (action?.type === 'clear') {
              return {
                decorationSet: DecorationSet.empty,
                triggerPos: null,
                text: '',
              };
            }

            if (action?.type === 'update') {
              const { text, triggerPos } = action;
              // Build the ghost decoration widget DOM node
              const widgetNode = document.createElement('span');
              widgetNode.className = 'ai-ghost-text';
              widgetNode.textContent = text;

              // Clamp position to document bounds
              const safePos = Math.min(triggerPos, newState.doc.content.size);
              const decoration = Decoration.widget(safePos, widgetNode, { side: 1 });

              return {
                decorationSet: DecorationSet.create(newState.doc, [decoration]),
                triggerPos: safePos,
                text,
              };
            }

            // Remap decoration positions through transaction mapping for collaboration safety
            if (pluginState.triggerPos !== null) {
              const mappedPos = tr.mapping.map(pluginState.triggerPos);
              const remappedSet = pluginState.decorationSet.map(tr.mapping, tr.doc);
              return {
                ...pluginState,
                decorationSet: remappedSet,
                triggerPos: mappedPos,
              };
            }

            return pluginState;
          },
        },

        props: {
          decorations(editorState) {
            return AI_GHOST_PLUGIN_KEY.getState(editorState)?.decorationSet ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },
});
