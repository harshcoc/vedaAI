import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Clerk JWT auth middleware.
 * For development simplicity, decodes the JWT payload to extract userId (sub claim).
 * For production, you should verify via Clerk's JWKS endpoint.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Unauthorized: Invalid token format' });
      return;
    }

    // Decode the JWT payload (base64url decode the middle segment)
    // In production, verify the token signature against Clerk's JWKS
    const parts = token.split('.');
    if (parts.length !== 3) {
      res.status(401).json({ error: 'Unauthorized: Malformed token' });
      return;
    }

    const payloadBase64 = parts[1];
    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);

    const userId = payload.sub;

    if (!userId || typeof userId !== 'string') {
      res.status(401).json({ error: 'Unauthorized: No user ID in token' });
      return;
    }

    req.userId = userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Token verification failed' });
  }
}
