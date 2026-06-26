import { z } from 'zod';
import type { Request, Response, RequestHandler } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { ValidationError, AppError } from '../lib/errors.js';
import * as aiService from '../services/ai.service.js';

// ─── Zod Schema ───────────────────────────────────────────────
const aiCompleteSchema = z.object({
  prompt: z.string().max(2000).optional().default(''),
  docContext: z.string().max(50000).optional().default(''),
  selectionText: z.string().max(10000).optional(),
  mode: z.enum(['continue', 'rewrite', 'summarize']),
});

function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new ValidationError(message);
  }
  return result.data;
}

/**
 * generateAISuggestion — Handles POST /api/ai/complete
 * Sets up an SSE text/event-stream connection, invokes the Anthropic streaming API,
 * and relays text delta tokens. Listens for client connection close events to abort
 * the upstream Anthropic stream immediately.
 */
export const generateAISuggestion: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const { prompt = '', docContext = '', selectionText, mode } = parseBody(aiCompleteSchema, req.body);

  // Set up AbortController for client disconnect cleanup
  const abortController = new AbortController();

  req.on('close', () => {
    console.log('🔌 Client disconnected from AI stream. Aborting Anthropic request...');
    abortController.abort();
  });

  // Set headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Establish stream connection immediately

  try {
    const stream = await aiService.generateAIStream({
      prompt,
      docContext,
      selectionText,
      mode,
      signal: abortController.signal,
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        const token = chunk.delta.text;
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    }

    // Write final SSE completion sentinel
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    // If the request was aborted, it is a clean close rather than an error
    if (err.name === 'AbortError' || abortController.signal.aborted) {
      console.log('🤖 Anthropic stream aborted successfully.');
      if (!res.writableEnded) {
        res.end();
      }
      return;
    }

    console.error('❌ AI Streaming Error:', err);

    // If headers are already sent, we must send a structured SSE stream error
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: 'STREAM_ERROR', message: 'Failed to generate content stream' })}\n\n`);
      res.end();
    } else {
      throw new AppError(500, 'STREAM_ERROR', 'Failed to generate content stream');
    }
  }
});
