import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';

// Mock the jose library using ES module mocking
jest.unstable_mockModule('jose', () => ({
  jwtVerify: jest.fn(),
}));

// Import modules dynamically after mocking
const { jwtVerify } = await import('jose');
const { requireAuth } = await import('./requireAuth.js');

describe('requireAuth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let statusMock: any;
  let jsonMock: any;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
    };
    next = jest.fn() as unknown as NextFunction;
    process.env.NEXTAUTH_SECRET = 'super-secret-key-123';
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if token cookie is missing', async () => {
    req = {
      cookies: {},
    };

    await requireAuth(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should verify token and populate req.user on valid token', async () => {
    req = {
      cookies: {
        'next-auth.session-token': 'valid-token-string',
      },
    };

    const mockPayload = { id: 'user-123', email: 'user@example.com' };
    (jwtVerify as any).mockResolvedValueOnce({ payload: mockPayload });

    await requireAuth(req as Request, res as Response, next);

    expect(jwtVerify).toHaveBeenCalledWith(
      'valid-token-string',
      new TextEncoder().encode('super-secret-key-123')
    );
    expect(req.user).toEqual({
      id: 'user-123',
      email: 'user@example.com',
    });
    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('should return 401 if jwtVerify throws an error', async () => {
    req = {
      cookies: {
        'next-auth.session-token': 'invalid-token-string',
      },
    };

    (jwtVerify as any).mockRejectedValueOnce(new Error('Invalid token'));

    await requireAuth(req as Request, res as Response, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired session',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
