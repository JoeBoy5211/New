
const mysql = require('mysql2/promise');
require('dotenv').config();

const aivenUrl = process.env.DATABASE_URL;

async function testAdminQueries() {
    console.log('Connecting to Aiven...');
    const pool = mysql.createPool(aivenUrl);

    try {
        console.log('\n--- Testing getStats query ---');
        const [caterers] = await pool.query('SELECT COUNT(*) as total FROM caterers');
        const [users] = await pool.query('SELECT COUNT(*) as total FROM users WHERE id IN (SELECT user_id FROM user_roles WHERE role = "customer")');
        const [bookings] = await pool.query('SELECT COUNT(*) as total, SUM(total_amount) as revenue FROM bookings WHERE status IN ("completed", "confirmed")');
        const [pending] = await pool.query('SELECT COUNT(*) as total FROM caterers WHERE is_pending = 1');
        
        console.log('Caterers:', caterers[0].total);
        console.log('Users (Customers):', users[0].total);
        console.log('Bookings:', bookings[0].total);
        console.log('Revenue:', bookings[0].revenue);
        console.log('Pending:', pending[0].total);

        console.log('\n--- Testing getCaterers query ---');
        try {
            const [catererRows] = await pool.query(`
                SELECT 
                    c.*,
                    AVG(r.rating) as rating,
                    COUNT(DISTINCT r.id) as review_count
                FROM caterers c
                LEFT JOIN reviews r ON c.id = r.caterer_id
                GROUP BY c.id
            `);
            console.log('Caterers returned:', catererRows.length);
        } catch (err) {
            console.error('getCaterers Error:', err.message);
        }

        console.log('\n--- Testing getBookings query ---');
        try {
            const [bookingRows] = await pool.query(`
                SELECT 
                    b.*, 
                    p.name as customer_name,
                    c.name as caterer_name
                FROM bookings b
                LEFT JOIN profiles p ON b.customer_id = p.user_id
                LEFT JOIN caterers c ON b.caterer_id = c.id
                ORDER BY b.created_at DESC
            `);
            console.log('Bookings returned:', bookingRows.length);
        } catch (err) {
            console.error('getBookings Error:', err.message);
        }

    } catch (error) {
        console.error('Connection/Query Error:', error.message);
    } finally {
        await pool.end();
    }
}

testAdminQueries();
