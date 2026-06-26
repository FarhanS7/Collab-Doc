export type AIMode = 'continue' | 'rewrite' | 'summarize';

export interface AIStreamPayload {
  prompt?: string;
  docContext?: string;
  selectionText?: string;
  mode: AIMode;
}

export interface AIStreamCallbacks {
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

export interface AIStreamController {
  abort: () => void;
}

/**
 * requestAISuggestion — Contacts the Express AI complete endpoint.
 * Decodes the response body dynamically using a stream reader and parses
 * lines starting with `data: ` to extract JSON tokens or error messages.
 */
export function requestAISuggestion(
  payload: AIStreamPayload,
  callbacks: AIStreamCallbacks
): AIStreamController {
  const abortController = new AbortController();
  const { onToken, onComplete, onError } = callbacks;

  const runStream = async () => {
    try {
      const response = await fetch('/api/ai/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to generate AI suggestion';
        try {
          const parsed = JSON.parse(errorText);
          errorMessage = parsed.message || errorMessage;
        } catch {
          // Fall back if response is not JSON
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('Response stream is not readable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append newly decoded text chunk to the buffer
        buffer += decoder.decode(value, { stream: true });

        // Split buffer by double newline (SSE frame boundary)
        const frames = buffer.split('\n\n');
        
        // Stash the last incomplete slice in the buffer for the next network packet
        buffer = frames.pop() || '';

        for (const frame of frames) {
          const trimmed = frame.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();

            if (dataStr === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                onError(parsed.message || parsed.error);
                return;
              }
              if (parsed.token !== undefined) {
                onToken(parsed.token);
              }
            } catch (err) {
              console.warn('⚠️ [SSE Parse Error]: Failed parsing chunk:', dataStr, err);
            }
          }
        }
      }

      // Check for any residual data left in buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6).trim();
          if (dataStr === '[DONE]') {
            onComplete();
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.token !== undefined) {
              onToken(parsed.token);
            }
          } catch {
            // Ignore partial trailing data errors
          }
        }
      }

      onComplete();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('🤖 AI completion stream fetch aborted successfully.');
        return;
      }
      onError(err.message || 'AI streaming connection failed.');
    }
  };

  runStream();

  return {
    abort: () => abortController.abort(),
  };
}
