import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export interface AuthRequest extends Request {
  userId?: Types.ObjectId;
  userRole?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: Types.ObjectId;
      role: string;
    };

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

/** Only allow FOUNDER role through */
export const founderOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'FOUNDER') {
    return res.status(403).json({ error: 'Access denied: founders only' });
  }
  next();
};
