
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkSchema() {
    const pool = mysql.createPool(process.env.DATABASE_URL);
    try {
        const [rows] = await pool.query('DESCRIBE caterers');
        console.log('CATERERS SCHEMA:');
        rows.forEach(row => {
            console.log(`${row.Field} - ${row.Type}`);
        });
    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        await pool.end();
    }
}

checkSchema();
