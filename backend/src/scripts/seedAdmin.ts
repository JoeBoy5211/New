
import bcrypt from 'bcrypt';
import pool from '../config/database';
import crypto from 'crypto';

async function seedAdmin() {
    const email = 'admin@admin.com';
    const password = 'admin123';
    const name = 'Default Admin';

    try {
        // Check if admin already exists
        const [existing] = await pool.query<any[]>('SELECT id FROM users WHERE email = ?', [email]);

        if (existing.length > 0) {
            console.log('Admin user already exists.');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = crypto.randomUUID();

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Create user
            await connection.query(
                'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
                [userId, email, hashedPassword]
            );

            // Create profile
            await connection.query(
                'INSERT INTO profiles (id, user_id, name, email) VALUES (UUID(), ?, ?, ?)',
                [userId, name, email]
            );

            // Assign role
            await connection.query(
                'INSERT INTO user_roles (user_id, role) VALUES (?, ?)',
                [userId, 'admin']
            );

            await connection.commit();
            console.log('Default admin created successfully!');
            console.log('Email: admin@admin.com');
            console.log('Password: admin123');
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        process.exit(0);
    }
}

seedAdmin();
