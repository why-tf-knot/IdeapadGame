import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

// ─── Cross-service auth ─────────────────────────────────
// Validates JWTs issued by either founder-backend or investor-backend.
// Both services share the same JWT_SECRET so tokens are interoperable.

export interface AuthRequest extends Request {
  userId?: Types.ObjectId;
  userRole?: 'FOUNDER' | 'INVESTOR';
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: Types.ObjectId;
      role: 'FOUNDER' | 'INVESTOR';
    };

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

// ─── Service-to-service auth ─────────────────────────────
// Internal calls from founder-backend / investor-backend use a shared secret.

export const serviceAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const serviceSecret = req.header('X-Service-Secret');
  if (!serviceSecret || serviceSecret !== process.env.SERVICE_SECRET) {
    return res.status(403).json({ error: 'Invalid service credentials' });
  }
  next();
};
