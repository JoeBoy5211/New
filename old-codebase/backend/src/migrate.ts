import pool from './config/database';

async function migrate() {
    const migrations = [
        {
            description: 'Adding years_in_business to caterers table',
            sql: 'ALTER TABLE caterers ADD COLUMN years_in_business INT DEFAULT 0 AFTER max_guests;'
        },
        {
            description: 'Adding cuisines to caterers table',
            sql: 'ALTER TABLE caterers ADD COLUMN cuisines TEXT NULL AFTER years_in_business;'
        },
        {
            description: 'Adding event_types to caterers table',
            sql: 'ALTER TABLE caterers ADD COLUMN event_types TEXT NULL AFTER cuisines;'
        }
    ];

    for (const migration of migrations) {
        try {
            console.log(`Running migration: ${migration.description}...`);
            await pool.query(migration.sql);
            console.log(`  ✓ Done`);
        } catch (error: any) {
            if (error.code === 'ER_DUP_COLUMN_NAME') {
                console.log(`  - Column already exists. Skipping.`);
            } else {
                console.error(`  ✗ Migration failed:`, error.message);
            }
        }
    }

    console.log('All migrations complete.');
    process.exit();
}

migrate();
