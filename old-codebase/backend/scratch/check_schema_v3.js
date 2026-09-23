
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkSchema() {
    const pool = mysql.createPool(process.env.DATABASE_URL);
    try {
        console.log('CATERERS SCHEMA:');
        const [cRows] = await pool.query('DESCRIBE caterers');
        cRows.forEach(row => console.log(`${row.Field}`));

        console.log('\nCATERER_SERVICES SCHEMA:');
        const [sRows] = await pool.query('DESCRIBE caterer_services');
        sRows.forEach(row => console.log(`${row.Field}`));
    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        await pool.end();
    }
}

checkSchema();
