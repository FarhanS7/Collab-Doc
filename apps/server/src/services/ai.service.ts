import Anthropic from '@anthropic-ai/sdk';
import { env } from '../lib/env.js';

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
});

export type AIMode = 'continue' | 'rewrite' | 'summarize';

interface GenerateStreamOptions {
  prompt: string;
  docContext: string;
  selectionText?: string;
  mode: AIMode;
  signal?: AbortSignal;
}

/**
 * generateAIStream — Requests a streaming text generation from Anthropic Claude API.
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

  // Call Anthropic Messages API with streaming enabled
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
