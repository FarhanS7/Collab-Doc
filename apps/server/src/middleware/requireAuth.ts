import { jwtVerify } from 'jose';
import cookieParser from 'cookie-parser';
import type { Request, Response, NextFunction } from 'express';

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

// NextAuth uses different cookie names per environment
const COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

/**
 * requireAuth — Express middleware
 * Reads the NextAuth JWT from the cookie, verifies it with NEXTAUTH_SECRET,
 * and attaches req.user = { id, email } for downstream handlers.
 *
 * Returns 401 for missing, expired, or tampered tokens.
 * Never reveals WHY the token failed (security best practice).
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    return;
  }

  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    // Attach user identity to the request for all downstream route handlers
    req.user = {
      id: payload.id as string,
      email: payload.email as string,
    };

    next();
  } catch {
    // Do NOT reveal whether the token expired or had an invalid signature
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired session',
    });
  }
}

// Re-export cookie-parser for convenience — apply before requireAuth in Express app
export { cookieParser };
