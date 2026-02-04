import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define what the decoded token looks like
interface AuthPayload {
  id: string;
  role: string;
}

// Extend the Express Request type to include the user
export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    // Format: "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Token is invalid or expired' });
      }

      // Attach the user info (id and role) to the request object
      req.user = decoded as AuthPayload;
      next(); // Move to the actual route
    });
  } else {
    res.status(401).json({ message: 'Authorization header missing' });
  }
};