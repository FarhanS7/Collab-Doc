import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { Readable } from 'stream';

describe('ai service provider selection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/collabeditor',
      REDIS_URL: 'redis://localhost:6379',
      NEXTAUTH_SECRET: '12345678901234567890123456789012',
      ANTHROPIC_API_KEY: 'sk-ant-api03-test',
      OPENROUTER_API_KEY: 'sk-or-v1-test',
      AI_PROVIDER: 'openrouter',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('streams content from OpenRouter when configured', async () => {
    const streamBody = Readable.from([
      Buffer.from('data: {"choices":[{"delta":{"content":"hello"}}]}\n\n'),
      Buffer.from('data: [DONE]\n\n'),
    ]);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: streamBody,
      headers: new Headers(),
    } as unknown as Response);

    const { generateAIStream } = await import('./ai.service.js');
    const stream = await generateAIStream({
      prompt: 'Test prompt',
      docContext: 'Some context',
      mode: 'continue',
    });

    const chunks: Array<{ type: string; delta?: { type?: string; text?: string } }> = [];
    for await (const chunk of stream) {
      chunks.push(chunk as { type: string; delta?: { type?: string; text?: string } });
    }

    expect(chunks).toEqual([
      expect.objectContaining({
        type: 'content_block_delta',
        delta: expect.objectContaining({
          type: 'text_delta',
          text: 'hello',
        }),
      }),
    ]);
  });
});
