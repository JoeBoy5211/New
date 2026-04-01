
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDB() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        const [users] = await pool.query('SELECT id, email FROM users');
        console.log('Users:', JSON.stringify(users, null, 2));

        const [roles] = await pool.query('SELECT * FROM user_roles');
        console.log('Roles:', JSON.stringify(roles, null, 2));

        const [profiles] = await pool.query('SELECT * FROM profiles');
        console.log('Profiles:', JSON.stringify(profiles, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkDB();
