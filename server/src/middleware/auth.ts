import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';

/**
 * Express middleware to verify Firebase ID tokens.
 * Extracts the Bearer token from the Authorization header,
 * verifies it with Firebase Admin SDK, and attaches the
 * decoded user info to req.user.
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    // Attach user info to the request object for downstream use
    (req as any).user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
