import { Request, Response, NextFunction } from 'express';

/**
 * Middleware that restricts access to super admins only.
 * Must be used AFTER authenticate() so req.user is populated.
 */
export const superAdminOnly = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated.' });
        return;
    }

    if (req.user.role !== 'admin' || !req.user.isSuperAdmin) {
        res.status(403).json({
            success: false,
            message: 'Access denied. Super admin privileges required.',
        });
        return;
    }

    next();
};
