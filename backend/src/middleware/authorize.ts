import { Request, Response, NextFunction } from 'express';

/**
 * Role-based access control middleware.
 * Must be used AFTER authenticate() so req.user is populated.
 *
 * Usage: router.patch('/...', authenticate, authorize('vendor', 'admin'), handler)
 */
export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated.' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}.`,
            });
            return;
        }

        next();
    };
};
