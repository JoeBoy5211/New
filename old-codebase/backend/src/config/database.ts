
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

function createPoolConfig() {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
        // mysql2 does NOT support `ssl-mode=REQUIRED` as a URL param.
        // Strip it and pass SSL config explicitly as required by Aiven.
        const cleanUrl = databaseUrl.replace(/[?&]ssl-mode=REQUIRED/i, '').replace(/[?&]ssl=true/i, '');
        return {
            uri: cleanUrl,
            ssl: { rejectUnauthorized: false },
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        };
    }

    return {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    };
}

const pool = mysql.createPool(createPoolConfig() as any);

export default pool;

