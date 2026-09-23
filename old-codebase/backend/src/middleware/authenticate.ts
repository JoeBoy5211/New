import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JwtPayload {
    id: string;
    email: string;
    role: 'customer' | 'vendor' | 'admin';
    isSuperAdmin?: boolean;
}

// Augment the global Express Request interface so req.user is typed everywhere
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

/**
 * Verifies the Bearer JWT in the Authorization header.
 * On success, attaches the decoded payload to req.user and calls next().
 * On failure, returns 401.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            message: 'Access denied. No authentication token provided.',
        });
        return;
    }

    const token = authHeader.slice(7); // strip "Bearer "

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please sign in again.',
        });
    }
};
