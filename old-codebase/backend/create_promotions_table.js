
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS promotions (
                id CHAR(36) PRIMARY KEY,
                caterer_id CHAR(36) NOT NULL,
                media_url TEXT NOT NULL,
                media_type ENUM('image', 'video') NOT NULL,
                caption TEXT,
                tags TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (caterer_id) REFERENCES caterers(id) ON DELETE CASCADE
            );
        `);
        console.log('Table created');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
