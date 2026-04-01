const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const conn = await mysql.createConnection({
        user: 'root', 
        database: process.env.DB_NAME || 'catering_db',
        password: process.env.DB_PASSWORD || ''
    });
    try {
        const [res] = await conn.query('SELECT id, status FROM bookings ORDER BY created_at DESC LIMIT 1');
        if (res.length === 0) {
            console.log("No bookings found!");
            return;
        }
        const id = res[0].id;
        console.log("Found booking:", id);
        
        console.log("Calling localhost API...");
        try {
            const resp = await axios.post('http://localhost:3000/api/payments/initiate', {
                booking_id: id,
                method: 'chapa'
            });
            console.log("OK", resp.data);
        } catch (err) {
            console.error("ERR RESPONSE:", err.response?.data);
            console.error("ERR MESSAGE:", err.message);
        }
        
    } finally {
        await conn.end();
    }
}
run();
