'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { AI_GHOST_PLUGIN_KEY, AI_GHOST_META, type AIGhostAction } from '../components/editor/AIGhostExtension';
import { requestAISuggestion, type AIMode, type AIStreamController } from '../lib/aiStream';

type SuggestionStatus = 'idle' | 'streaming' | 'suggested';

interface AISuggestionState {
  status: SuggestionStatus;
  text: string;
  triggerPos: number | null;
}

const INITIAL_STATE: AISuggestionState = {
  status: 'idle',
  text: '',
  triggerPos: null,
};

/**
 * useAISuggestion — AI Suggestion Orchestrator Hook (F.7)
 *
 * Orchestrates:
 *  - Calling the SSE AI streaming client (F.3)
 *  - Updating the ghost decoration plugin (F.5) with incoming tokens
 *  - Accepting suggestions via Tab key (F.6) — inserts a real Y.js transaction
 *  - Rejecting suggestions via Escape key (F.6) — clears the decoration
 *  - Aborting mid-stream when the user types or rejects
 *
 * Ghost decorations are LOCAL-ONLY — never synced via Y.js (per ADR-003).
 */
export function useAISuggestion(editor: Editor | null) {
  const [state, setState] = useState<AISuggestionState>(INITIAL_STATE);
  const streamControllerRef = useRef<AIStreamController | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Helper: dispatch a ghost decoration update to the ProseMirror plugin
  const updateGhost = useCallback(
    (text: string, triggerPos: number) => {
      if (!editor) return;
      const action: AIGhostAction = { type: 'update', text, triggerPos };
      editor.view.dispatch(
        editor.view.state.tr.setMeta(AI_GHOST_META, action),
      );
    },
    [editor],
  );

  // Helper: clear the ghost decoration from the editor
  const clearGhost = useCallback(() => {
    if (!editor) return;
    const action: AIGhostAction = { type: 'clear' };
    editor.view.dispatch(
      editor.view.state.tr.setMeta(AI_GHOST_META, action),
    );
  }, [editor]);

  // Start an AI suggestion request
  const triggerSuggestion = useCallback(
    (mode: AIMode, selectionText?: string) => {
      if (!editor) return;
      if (stateRef.current.status !== 'idle') {
        // Abort existing stream before starting a new one
        streamControllerRef.current?.abort();
        clearGhost();
        setState(INITIAL_STATE);
      }

      const { from, to } = editor.state.selection;
      const triggerPos = from;

      // Gather document context (up to 8000 chars around the cursor)
      const docText = editor.state.doc.textContent;
      const contextStart = Math.max(0, triggerPos - 4000);
      const contextEnd = Math.min(docText.length, triggerPos + 4000);
      const docContext = docText.slice(contextStart, contextEnd);

      setState({ status: 'streaming', text: '', triggerPos });

      let accumulatedText = '';

      const controller = requestAISuggestion(
        {
          mode,
          docContext,
          selectionText,
          prompt: '',
        },
        {
          onToken: (token) => {
            accumulatedText += token;
            setState((prev) => ({ ...prev, text: accumulatedText }));
            updateGhost(accumulatedText, triggerPos);
          },
          onComplete: () => {
            setState((prev) => ({
              ...prev,
              status: 'suggested',
              text: accumulatedText,
            }));
          },
          onError: (error) => {
            console.error('AI suggestion error:', error);
            clearGhost();
            setState(INITIAL_STATE);
          },
        },
      );

      streamControllerRef.current = controller;
    },
    [editor, updateGhost, clearGhost],
  );

  // Accept suggestion: insert text as a real Y.js transaction (Tab key — F.6)
  const acceptSuggestion = useCallback(() => {
    if (!editor || stateRef.current.status !== 'suggested') return;
    const { text, triggerPos } = stateRef.current;
    if (!text || triggerPos === null) return;

    // Get the current mapped position (may have shifted due to collaboration)
    const pluginState = AI_GHOST_PLUGIN_KEY.getState(editor.view.state);
    const insertPos = pluginState?.triggerPos ?? triggerPos;

    // Clear the ghost decoration first
    clearGhost();
    setState(INITIAL_STATE);

    // Insert into the document as a Y.js transaction
    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, text)
      .run();
  }, [editor, clearGhost]);

  // Reject / clear suggestion (Escape key or any typing — F.6)
  const rejectSuggestion = useCallback(() => {
    streamControllerRef.current?.abort();
    streamControllerRef.current = null;
    clearGhost();
    setState(INITIAL_STATE);
  }, [clearGhost]);

  // Bind keyboard shortcuts inside the editor
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { status } = stateRef.current;
      if (status === 'idle') return;

      if (event.key === 'Tab') {
        if (status === 'suggested') {
          event.preventDefault();
          acceptSuggestion();
        }
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        rejectSuggestion();
        return;
      }

      // Any other printable key while suggestion is active → reject
      if (
        status === 'streaming' || status === 'suggested'
      ) {
        if (!event.metaKey && !event.ctrlKey && !event.altKey) {
          if (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete') {
            rejectSuggestion();
          }
        }
      }
    };

    // Attach to the editor DOM element
    const editorDom = editor.view.dom;
    editorDom.addEventListener('keydown', handleKeyDown, true); // capture phase

    return () => {
      editorDom.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [editor, acceptSuggestion, rejectSuggestion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamControllerRef.current?.abort();
      clearGhost();
    };
  }, [clearGhost]);

  return {
    status: state.status,
    suggestionText: state.text,
    triggerSuggestion,
    acceptSuggestion,
    rejectSuggestion,
  };
}
