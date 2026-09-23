
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrate() {
    const pool = mysql.createPool(process.env.DATABASE_URL);
    try {
        console.log('Adding is_active to caterers...');
        await pool.query('ALTER TABLE caterers ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER is_approved');
        
        console.log('Adding is_active to caterer_services...');
        await pool.query('ALTER TABLE caterer_services ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER sample_images');
        
        console.log('Migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
