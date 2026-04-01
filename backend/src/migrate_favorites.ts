
import pool from './config/database';

async function migrate() {
    try {
        console.log('Starting migration: Creating favorites table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS favorites (
                id CHAR(36) PRIMARY KEY,
                user_id CHAR(36) NOT NULL,
                caterer_id CHAR(36) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_favorite (user_id, caterer_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (caterer_id) REFERENCES caterers(id) ON DELETE CASCADE
            )
        `);
        console.log('Migration successful!');
    } catch (error: any) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrate();
