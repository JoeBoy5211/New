import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
    console.log("Connecting to database...");
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'caterconnect'
    });

    try {
        console.log("Checking if tx_ref exists in bookings...");
        const [columns] = await connection.query("SHOW COLUMNS FROM bookings LIKE 'tx_ref'");
        if (columns.length === 0) {
            console.log("Adding tx_ref column to bookings table...");
            await connection.query("ALTER TABLE bookings ADD COLUMN tx_ref VARCHAR(100) UNIQUE");
            console.log("Column tx_ref added successfully.");
        } else {
            console.log("Column tx_ref already exists.");
        }
    } catch (error) {
        console.error("Error modifying table:", error);
    } finally {
        await connection.end();
    }
}

run();
