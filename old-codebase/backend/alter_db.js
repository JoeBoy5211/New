import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
    console.log("Connecting to database...");
    const databaseUrl = process.env.DATABASE_URL;
    let config;
    if (databaseUrl) {
        const cleanUrl = databaseUrl.replace(/[?&]ssl-mode=REQUIRED/i, '').replace(/[?&]ssl=true/i, '');
        config = { uri: cleanUrl, ssl: { rejectUnauthorized: false } };
    } else {
        config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'caterconnect'
        };
    }
    const connection = await mysql.createConnection(config);

    try {
        // Migration 1: tx_ref column
        console.log("Checking if tx_ref exists in bookings...");
        const [txRefColumns] = await connection.query("SHOW COLUMNS FROM bookings LIKE 'tx_ref'");
        if (txRefColumns.length === 0) {
            console.log("Adding tx_ref column to bookings table...");
            await connection.query("ALTER TABLE bookings ADD COLUMN tx_ref VARCHAR(100) UNIQUE");
            console.log("Column tx_ref added successfully.");
        } else {
            console.log("Column tx_ref already exists.");
        }

        // Migration 2: max_bookings_per_day column
        console.log("Checking if max_bookings_per_day exists in caterers...");
        const [mbpdColumns] = await connection.query("SHOW COLUMNS FROM caterers LIKE 'max_bookings_per_day'");
        if (mbpdColumns.length === 0) {
            console.log("Adding max_bookings_per_day column to caterers table...");
            await connection.query("ALTER TABLE caterers ADD COLUMN max_bookings_per_day INT NOT NULL DEFAULT 3");
            console.log("Column max_bookings_per_day added successfully.");
        } else {
            console.log("Column max_bookings_per_day already exists.");
        }

        // Migration 3: vendor_unavailability table
        console.log("Creating vendor_unavailability table if not exists...");
        await connection.query(`
            CREATE TABLE IF NOT EXISTS vendor_unavailability (
                id INT AUTO_INCREMENT PRIMARY KEY,
                caterer_id VARCHAR(255) NOT NULL,
                type ENUM('temporary', 'permanent_recurring') NOT NULL DEFAULT 'temporary',
                unavailable_date DATE NULL,
                day_of_week TINYINT NULL,
                reason VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table vendor_unavailability ready.");
    } catch (error) {
        console.error("Error modifying table:", error);
    } finally {
        await connection.end();
    }
}

run();
