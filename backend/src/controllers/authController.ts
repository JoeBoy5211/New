
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    console.log('[AUTH] Login attempt for:', email);

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT u.id, u.email, u.password_hash, ur.role, p.name, p.phone, p.avatar_url, c.is_approved, u.created_at 
             FROM users u 
             LEFT JOIN user_roles ur ON u.id = ur.user_id 
             LEFT JOIN profiles p ON u.id = p.user_id 
             LEFT JOIN caterers c ON u.id = c.vendor_id 
             WHERE u.email = ?`,
            [email]
        );

        console.log('[AUTH] Found rows:', rows.length);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const user = rows[0];

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
                avatar_url: user.avatar_url,
                is_approved: user.role === 'vendor' ? Boolean(user.is_approved) : true,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('[AUTH] Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

export const register = async (req: Request, res: Response) => {
    const { name, email, password, phone, role = 'customer', businessName, location, cuisineType } = req.body;

    try {
        // Check if user exists
        const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = crypto.randomUUID();

        // Create user
        await pool.query('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)', [userId, email, hashedPassword]);
        await pool.query('INSERT INTO user_roles (user_id, role) VALUES (?, ?)', [userId, role]);
        await pool.query('INSERT INTO profiles (id, user_id, name, phone) VALUES (UUID(), ?, ?, ?)', [userId, name, phone]);

        // If vendor, create caterer entry
        if (role === 'vendor') {
            const catererId = crypto.randomUUID();
            await pool.query(
                'INSERT INTO caterers (id, vendor_id, name, email, location, cuisines, is_pending, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [catererId, userId, businessName || name, email, location || null, cuisineType || null, 1, 0]
            );
        }

        // Generate token for automatic login
        const token = jwt.sign(
            { id: userId, email, role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: userId,
                email,
                name,
                role,
                phone,
                is_approved: role === 'vendor' ? false : true,
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
