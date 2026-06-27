import { jest } from '@jest/globals';
import { requestAISuggestion } from '../../../web/lib/aiStream.js';

describe('requestAISuggestion SSE Client Handler', () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('should read tokens from SSE chunks and trigger callbacks', (done) => {
    const mockStreamData = [
      'data: {"token": "Hello"}\n\n',
      'data: {"token": " World"}\n\n',
      'data: "[DONE]"\n\n',
    ];

    const textEncoder = new TextEncoder();
    let index = 0;

    // Mock readable stream reader
    const mockReader = {
      read: jest.fn().mockImplementation(async () => {
        if (index >= mockStreamData.length) {
          return { done: true, value: undefined };
        }
        const val = textEncoder.encode(mockStreamData[index++]);
        return { done: false, value: val };
      }),
    };

    const mockResponse = {
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    };

    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const tokens: string[] = [];

    requestAISuggestion(
      { mode: 'continue', docContext: 'context' },
      {
        onToken: (token) => {
          tokens.push(token);
        },
        onComplete: () => {
          try {
            expect(tokens).toEqual(['Hello', ' World']);
            done();
          } catch (e) {
            done(e);
          }
        },
        onError: (err) => {
          done(new Error('OnError triggered unexpectedly: ' + err));
        },
      }
    );
  });

  it('should handle partial chunks correctly using internal buffering', (done) => {
    // Simulate TCP cutting packets across frame boundaries
    const mockStreamData = [
      'data: {"tok', // partial frame 1
      'en": "Hello"}\n\ndata: {"token":', // complete frame 1, partial frame 2
      ' " World"}\n\n', // complete frame 2
      'data: "[DONE]"\n\n',
    ];

    const textEncoder = new TextEncoder();
    let index = 0;

    const mockReader = {
      read: jest.fn().mockImplementation(async () => {
        if (index >= mockStreamData.length) {
          return { done: true, value: undefined };
        }
        const val = textEncoder.encode(mockStreamData[index++]);
        return { done: false, value: val };
      }),
    };

    const mockResponse = {
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    };

    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const tokens: string[] = [];

    requestAISuggestion(
      { mode: 'continue' },
      {
        onToken: (token) => {
          tokens.push(token);
        },
        onComplete: () => {
          try {
            expect(tokens).toEqual(['Hello', ' World']);
            done();
          } catch (e) {
            done(e);
          }
        },
        onError: (err) => {
          done(new Error('OnError triggered unexpectedly: ' + err));
        },
      }
    );
  });
});
