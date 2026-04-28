import pool from '../config/database';

async function updateBookings() {
    try {
        const [result] = await pool.query("UPDATE bookings SET status = 'accepted' WHERE status = 'pending'");
        console.log("Update successful:", result);
    } catch (e) {
        console.error("Error updating bookings:", e);
    } finally {
        await pool.end();
    }
}

updateBookings();
