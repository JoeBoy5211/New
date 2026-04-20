
const mysql = require('mysql2/promise');
require('dotenv').config();

const aivenUrl = process.env.DATABASE_URL;

async function checkDB() {
    console.log('Connecting to:', aivenUrl ? 'DATABASE_URL' : 'Local Config');
    const pool = aivenUrl 
        ? mysql.createPool(aivenUrl)
        : mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

    const tables = [
        'users',
        'profiles',
        'user_roles',
        'caterers',
        'bookings',
        'reviews',
        'menu_items',
        'promotions'
    ];

    try {
        console.log('--- Table Counts ---');
        for (const table of tables) {
            try {
                const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`${table}: ${rows[0].count}`);
            } catch (err) {
                console.log(`${table}: Error - ${err.message}`);
            }
        }

        console.log('\n--- Admin User Check ---');
        const [admins] = await pool.query(`
            SELECT u.email, ur.role 
            FROM users u 
            JOIN user_roles ur ON u.id = ur.user_id 
            WHERE ur.role = 'admin'
        `);
        console.log('Admins found:', admins.length);
        admins.forEach(a => console.log(`- ${a.email}`));

    } catch (error) {
        console.error('Connection Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkDB();
