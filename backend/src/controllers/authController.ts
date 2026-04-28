import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import crypto from 'crypto';
import { sendVerificationCodeEmail, sendPasswordResetEmail } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Login ───────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    console.log('[AUTH] Login attempt for:', email);

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT u.id, u.email, u.password_hash, ur.role, ur.is_super_admin, p.name, p.phone, p.avatar_url, c.is_approved, c.name as businessName, u.created_at 
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

        const role = user.role || 'customer';
        const isSuperAdmin = Boolean(user.is_super_admin) && role === 'admin';

        const token = jwt.sign(
            { id: user.id, email: user.email, role, isSuperAdmin },
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
                businessName: user.businessName,
                role,
                phone: user.phone,
                avatar_url: user.avatar_url,
                is_approved: role === 'vendor' ? Boolean(user.is_approved) : true,
                isSuperAdmin,
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

// ─── Request Verification Code (Signup) ─────────────────────────────────────

export const requestSignupCode = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    try {
        // Check if email is already taken
        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM users WHERE email = ?', [email]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists' });
        }

        const code = generateCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Delete any existing unused code for this email/purpose
        await pool.query(
            'DELETE FROM verification_codes WHERE email = ? AND purpose = ?',
            [email, 'signup']
        );

        // Insert new code
        await pool.query(
            'INSERT INTO verification_codes (id, email, code, purpose, expires_at) VALUES (UUID(), ?, ?, ?, ?)',
            [email, code, 'signup', expiresAt]
        );

        await sendVerificationCodeEmail(email, code);

        res.json({ success: true, message: 'Verification code sent to your email' });
    } catch (error) {
        console.error('[AUTH] Request signup code error:', error);
        const errMessage = error instanceof Error ? error.message : 'Failed to send verification code';
        res.status(500).json({ success: false, message: errMessage });
    }
};

// ─── Register (requires code) ─────────────────────────────────────────────────

export const register = async (req: Request, res: Response) => {
    const { name, email, password, phone, code, role = 'customer', businessName, location, cuisineType, tinNumber } = req.body;

    // Extract files from multer fields
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const competencyCertificateUrl = files?.['competencyCertificate']?.[0]?.path;
    const tradeLicenseUrl = files?.['tradeLicense']?.[0]?.path;

    if (!name || !email || !password || !code) {
        return res.status(400).json({ success: false, message: 'Name, email, password, and verification code are required' });
    }

    // Validation for vendor documents
    if (role === 'vendor') {
        if (!tinNumber) return res.status(400).json({ success: false, message: 'TIN number is required for vendors' });
        if (!competencyCertificateUrl) return res.status(400).json({ success: false, message: 'Competency Certificate is required' });
        if (!tradeLicenseUrl) return res.status(400).json({ success: false, message: 'Trade License is required' });
    }

    try {
        // Validate code
        const [codes] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM verification_codes WHERE email = ? AND purpose = ? AND code = ? AND expires_at > NOW()',
            [email, 'signup', code]
        );

        if (codes.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }

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
                'INSERT INTO caterers (id, vendor_id, name, email, location, cuisines, is_pending, is_approved, tin_number, competency_certificate_url, trade_license_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [catererId, userId, businessName || name, email, location || null, cuisineType || null, 1, 0, tinNumber, competencyCertificateUrl, tradeLicenseUrl]
            );
        }

        // Clean up used code
        await pool.query(
            'DELETE FROM verification_codes WHERE email = ? AND purpose = ?',
            [email, 'signup']
        );

        // Generate token for automatic login
        const token = jwt.sign(
            { id: userId, email, role, isSuperAdmin: false },
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
                businessName: businessName || name,
                role,
                phone,
                is_approved: role === 'vendor' ? false : true,
                isSuperAdmin: false,
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    try {
        // Check if user exists (don't reveal if not found for security best practice)
        const [users] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);

        if (users.length > 0) {
            const code = generateCode();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // Delete any existing reset codes
            await pool.query(
                'DELETE FROM verification_codes WHERE email = ? AND purpose = ?',
                [email, 'reset']
            );

            // Insert new code
            await pool.query(
                'INSERT INTO verification_codes (id, email, code, purpose, expires_at) VALUES (UUID(), ?, ?, ?, ?)',
                [email, code, 'reset', expiresAt]
            );

            await sendPasswordResetEmail(email, code);
        }

        // Always return success to avoid email enumeration
        res.json({ success: true, message: 'If an account with that email exists, a reset code has been sent' });
    } catch (error) {
        console.error('[AUTH] Forgot password error:', error);
        const errMessage = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ success: false, message: errMessage });
    }
};

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPassword = async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email, code, and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    try {
        // Validate code
        const [codes] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM verification_codes WHERE email = ? AND purpose = ? AND code = ? AND expires_at > NOW()',
            [email, 'reset', code]
        );

        if (codes.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
        }

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [hashedPassword, email]);

        // Clean up used code
        await pool.query(
            'DELETE FROM verification_codes WHERE email = ? AND purpose = ?',
            [email, 'reset']
        );

        res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        console.error('[AUTH] Reset password error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
