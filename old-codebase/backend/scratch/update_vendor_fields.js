
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function updateSchema() {
    const pool = mysql.createPool(process.env.DATABASE_URL);
    try {
        console.log('Updating caterers table...');
        await pool.query(`
            ALTER TABLE caterers 
            ADD COLUMN tin_number VARCHAR(50),
            ADD COLUMN competency_certificate_url TEXT,
            ADD COLUMN trade_license_url TEXT
        `);
        console.log('Schema updated successfully');
    } catch (error) {
        if (error.code === 'ER_DUP_COLUMN_NAME') {
            console.log('Columns already exist');
        } else {
            console.error('Error updating schema:', error);
        }
    } finally {
        await pool.end();
    }
}

updateSchema();
