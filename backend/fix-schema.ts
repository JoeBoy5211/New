import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function fixSchema() {
    const aiven = await createConnection({ uri: process.env.DATABASE_URL as string });

    try {
        await aiven.query("ALTER TABLE bookings MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'");
        console.log("✅ Fixed bookings schema");
    } catch (e: any) {
        if (e.message.includes('Duplicate column')) {
            console.log("⚠️ Columns already exist");
        } else {
            console.error("Error fixing schema:", e.message);
        }
    }

    await aiven.end();
}

fixSchema();
