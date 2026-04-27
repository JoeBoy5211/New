
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import catererRoutes from './routes/catererRoutes';
import bookingRoutes from './routes/bookingRoutes';
import vendorRoutes from './routes/vendorRoutes';
import reviewRoutes from './routes/reviewRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import promotionRoutes from './routes/promotionRoutes';
import paymentRoutes from './routes/paymentRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import uploadRoutes from './routes/uploadRoutes';
import pool from './config/database';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = Array.from(new Set([
    // Browser dev origins
    'http://localhost:5173',
    'http://localhost:8080',
    // Capacitor WebView default origins
    'https://localhost',
    'http://localhost',
    'capacitor://localhost',
    ...(process.env.FRONTEND_URL || '')
        .split(',')
        .map((o: string) => o.trim())
        .filter(Boolean),
]));

app.use(cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow in development
        if (process.env.NODE_ENV === 'development') return callback(null, true);

        // Allow non-browser clients (curl, Postman, mobile) with no Origin header
        if (!origin) return callback(null, true);

        // Allow any Vercel preview/production deployments and Render services
        if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
            return callback(null, true);
        }

        // Allow explicitly listed origins from FRONTEND_URL env
        if (allowedOrigins.includes(origin)) return callback(null, true);

        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
}));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
// Static files (kept for legacy support, but production uses Cloudinary)
if (process.env.NODE_ENV !== 'production') {
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/caterers', catererRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Database Initialization (Ensuring Reviews Table has Booking ID)
pool.query('ALTER TABLE reviews ADD COLUMN booking_id VARCHAR(255) AFTER id;').catch((err: any) => {
    // Ignore error if column already exists
    if (!err.message.includes('Duplicate column name')) {
        console.log('[DB] Review Fix Warning: ', err.message);
    }
});

// Ensure verification_codes table exists
pool.query(`
    CREATE TABLE IF NOT EXISTS verification_codes (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        purpose ENUM('signup', 'reset') NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_purpose (email, purpose)
    )
`).catch((err: any) => console.log('[DB] Verification Codes Table Warning: ', err.message));

// Ensure caterer_services table exists
pool.query(`
    CREATE TABLE IF NOT EXISTS caterer_services (
        id VARCHAR(36) PRIMARY KEY,
        caterer_id VARCHAR(36) NOT NULL,
        service_name VARCHAR(100) NOT NULL,
        description TEXT,
        sample_images JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (caterer_id) REFERENCES caterers(id) ON DELETE CASCADE
    )
`).catch((err: any) => console.log('[DB] Caterer Services Table Warning: ', err.message));

// Ensure vendor_subscriptions table exists
pool.query(`
    CREATE TABLE IF NOT EXISTS vendor_subscriptions (
        id VARCHAR(36) PRIMARY KEY,
        vendor_id VARCHAR(36) NOT NULL,
        current_tier ENUM('trial', 'free', 'premium') DEFAULT 'trial',
        previous_tier ENUM('trial', 'free', 'premium') NULL,
        trial_started_at TIMESTAMP NULL,
        trial_ends_at TIMESTAMP NULL,
        subscription_started_at TIMESTAMP NULL,
        subscription_ends_at TIMESTAMP NULL,
        tx_ref VARCHAR(255),
        payment_amount DECIMAL(10,2),
        payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        payment_method VARCHAR(50),
        paid_at TIMESTAMP NULL,
        converted_from_trial BOOLEAN DEFAULT FALSE,
        converted_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_vendor_current (vendor_id, current_tier),
        INDEX idx_payment_status (payment_status),
        INDEX idx_converted (converted_from_trial)
    )
`).catch((err: any) => console.log('[DB] Vendor Subscriptions Table Warning: ', err.message));

// Ensure is_super_admin column exists (migration)
async function ensureSuperAdminColumn() {
    try {
        const [columns] = await pool.query<any[]>(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'user_roles' 
            AND COLUMN_NAME = 'is_super_admin'
        `);
        if (columns.length === 0) {
            await pool.query('ALTER TABLE user_roles ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE');
            console.log('[DB] Added is_super_admin column to user_roles table');
        }
    } catch (err) {
        console.error('[DB] Migration failed:', err);
    }
}

// Ensure admin_notifications table exists
async function ensureAdminNotificationsTable() {
    try {
        const [tables] = await pool.query<any[]>(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'admin_notifications'
        `);
        if (tables.length === 0) {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS admin_notifications (
                    id CHAR(36) PRIMARY KEY,
                    admin_id CHAR(36) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT,
                    related_id CHAR(36),
                    related_type VARCHAR(50),
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_admin_read (admin_id, is_read),
                    INDEX idx_created (created_at DESC)
                )
            `);
            console.log('[DB] Created admin_notifications table');
        }
    } catch (err) {
        console.error('[DB] Notifications table creation failed:', err);
    }
}

// Ensure primary admin role is intact (Auto-healing)
async function ensureAdminRole() {
    try {
        // Ensure column and table exist first
        await ensureSuperAdminColumn();
        await ensureAdminNotificationsTable();
        
        const [users] = await pool.query<any[]>('SELECT id FROM users WHERE email = ?', ['admin@admin.com']);
        if (users.length > 0) {
            const adminId = users[0].id;
            const [roles] = await pool.query<any[]>('SELECT * FROM user_roles WHERE user_id = ? AND role = ?', [adminId, 'admin']);
            if (roles.length === 0) {
                await pool.query('INSERT INTO user_roles (user_id, role, is_super_admin) VALUES (?, ?, ?)', [adminId, 'admin', true]);
                console.log('[DB] Automatically recovered missing admin role for admin@admin.com');
            } else {
                // Ensure super admin flag is set
                await pool.query('UPDATE user_roles SET is_super_admin = TRUE WHERE user_id = ? AND role = ?', [adminId, 'admin']);
            }
        }
    } catch (err) {
        console.error('[DB] Admin role verification failed', err);
    }
}
ensureAdminRole();


// Root route for testing
app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Catering App Backend API is running' });
});

app.use('/api/upload', uploadRoutes);

// Lightweight pulse: no DB — used by mobile app on startup to warm Render dyno
app.get('/api/pulse', (_req: Request, res: Response) => {
    res.json({ ok: true, ts: Date.now() });
});

// Health Check & Database Connection Test
app.get('/api/health', async (req: Request, res: Response) => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({ status: 'error', database: 'disconnected', error: (error as Error).message });
    }
});

// Global error handler for uncaught exceptions (e.g. Multer/Cloudinary errors)
app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
    console.error('[SERVER ERROR]', err);
    res.status(500).json({ 
        success: false, 
        message: err.message || 'An unexpected error occurred during the request.' 
    });
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
