import Anthropic from '@anthropic-ai/sdk';
import { env } from '../lib/env.js';

const anthropic = env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    })
  : null;

export type AIMode = 'continue' | 'rewrite' | 'summarize';

interface GenerateStreamOptions {
  prompt: string;
  docContext: string;
  selectionText?: string;
  mode: AIMode;
  signal?: AbortSignal;
}

interface AIStreamChunk {
  type: 'content_block_delta';
  delta: {
    type: 'text_delta';
    text: string;
  };
}

async function* streamOpenRouter({
  systemPrompt,
  userContent,
  signal,
}: {
  systemPrompt: string;
  userContent: string;
  signal?: AbortSignal;
}) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'CollabEditor',
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`OpenRouter request failed with status ${response.status}`);
  }

  const decoder = new TextDecoder();
  let buffer = '';

  const body = response.body as unknown as {
    getReader?: () => {
      read: () => Promise<{ value?: Uint8Array | Buffer; done: boolean }>;
    };
    [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array | Buffer | string>;
  };

  if (typeof body.getReader === 'function') {
    const reader = body.getReader();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value as Uint8Array, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed.startsWith('data:')) continue;

        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') {
          return;
        }

        const data = JSON.parse(payload);
        const token = data?.choices?.[0]?.delta?.content;
        if (typeof token === 'string' && token.length > 0) {
          yield {
            type: 'content_block_delta',
            delta: {
              type: 'text_delta',
              text: token,
            },
          } satisfies AIStreamChunk;
        }
      }
    }
  } else if (typeof body[Symbol.asyncIterator] === 'function') {
    for await (const chunk of body as AsyncIterable<Uint8Array | Buffer | string>) {
      buffer += decoder.decode(chunk as Uint8Array, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed.startsWith('data:')) continue;

        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') {
          return;
        }

        const data = JSON.parse(payload);
        const token = data?.choices?.[0]?.delta?.content;
        if (typeof token === 'string' && token.length > 0) {
          yield {
            type: 'content_block_delta',
            delta: {
              type: 'text_delta',
              text: token,
            },
          } satisfies AIStreamChunk;
        }
      }
    }
  } else {
    throw new Error('OpenRouter response body is not a supported stream type');
  }
}

/**
 * generateAIStream — Requests a streaming text generation from the configured AI provider.
 * Maps prompt modes to custom instructions and passes an abort signal to terminate execution mid-stream.
 */
export async function generateAIStream({
  prompt,
  docContext,
  selectionText,
  mode,
  signal,
}: GenerateStreamOptions) {
  let userContent = '';

  const systemPrompt =
    'You are an expert writing assistant integrated into a collaborative rich-text editor. ' +
    'Your goal is to generate text that inserts seamlessly into the editor at the cursor position. ' +
    'You MUST follow these strict rules:\n' +
    '1. Never output conversational filler (e.g. "Sure, here is...", "Here is the continuation:", "I\'d be happy to help", etc.).\n' +
    '2. Never explain your output or write notes.\n' +
    '3. Return ONLY the raw requested text content to be inserted directly into the document.\n' +
    '4. Match the tone, styling, and vocabulary of the surrounding context.\n' +
    '5. Do not wrap the output in markdown code blocks unless explicitly requested.';

  if (mode === 'continue') {
    userContent =
      `Surrounding Document Context:\n"""\n${docContext}\n"""\n\n` +
      `User instruction or direction: "${prompt || 'Continue writing naturally'}"\n\n` +
      `Generate a continuation of the document from the cursor position. Do not repeat the context. Output ONLY the continuation.`;
  } else if (mode === 'rewrite') {
    userContent =
      `Surrounding Document Context:\n"""\n${docContext}\n"""\n\n` +
      `Text selected by user to rewrite:\n"""\n${selectionText || ''}\n"""\n\n` +
      `Instruction for rewriting: "${prompt}"\n\n` +
      `Rewrite the selected text to satisfy the instruction. Output ONLY the rewritten text.`;
  } else if (mode === 'summarize') {
    userContent =
      `Surrounding Document Context:\n"""\n${docContext || selectionText || ''}\n"""\n\n` +
      `Summarize the document context clearly and concisely. Output ONLY the summary.`;
  } else {
    userContent = prompt;
  }

  if (env.AI_PROVIDER === 'openrouter') {
    return streamOpenRouter({ systemPrompt, userContent, signal });
  }

  if (!anthropic) {
    throw new Error('Anthropic provider is not configured');
  }

  return anthropic.messages.create(
    {
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
      stream: true,
    },
    {
      signal,
    }
  );
}
