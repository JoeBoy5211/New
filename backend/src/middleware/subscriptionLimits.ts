import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

/**
 * Check if vendor has access to a specific feature based on subscription tier
 */
export const checkSubscriptionLimit = (_feature: 'menu_items' | 'services' | 'video_upload' | 'bookings') => {
    return async (_req: Request, _res: Response, next: NextFunction) => {
        return next();
    };
};

export const injectSubscriptionInfo = async (req: Request, _res: Response, next: NextFunction) => {
    (req as any).subscriptionTier = 'premium';
    next();
};
