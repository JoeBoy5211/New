
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// LOCAL connection
const localConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'catering_db',
};

// AIVEN connection from DATABASE_URL
const aivenUrl = process.env.DATABASE_URL!;

const TABLES_TO_MIGRATE = [
    'cuisine_categories',
    'event_types',
    'users',
    'profiles',
    'user_roles',
    'caterers',
    'menu_items',
    'bookings',
    'booking_items',
    'reviews',
    'favorites',
    'promotions',
    'promotion_likes',
    'promotion_saves',
    'caterer_follows',
    'promotion_comments',
];

async function migrate() {
    console.log('🔄 Connecting to local MySQL...');
    const local = await mysql.createConnection(localConfig);
    
    console.log('🔄 Connecting to Aiven...');
    const aiven = await mysql.createConnection({ uri: aivenUrl, multipleStatements: false });
    
    console.log('✅ Both connected. Starting migration...\n');

    await aiven.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of TABLES_TO_MIGRATE) {
        try {
            // Get all rows from local
            const [rows]: any = await local.query(`SELECT * FROM ${table}`);
            
            if (!rows || rows.length === 0) {
                console.log(`⏭️  ${table}: empty, skipping.`);
                continue;
            }

            // Clear existing data in Aiven (to avoid duplicates)
            await aiven.query(`DELETE FROM ${table}`);

            // Insert each row
            let inserted = 0;
            for (const row of rows) {
                const columns = Object.keys(row).map(c => `\`${c}\``).join(', ');
                const placeholders = Object.keys(row).map(() => '?').join(', ');
                const values = Object.values(row);
                try {
                    await aiven.query(
                        `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`,
                        values
                    );
                    inserted++;
                } catch (err: any) {
                    console.log(`  ⚠️  Row insert error in ${table}: ${err.message.substring(0, 80)}`);
                }
            }
            console.log(`✅ ${table}: migrated ${inserted}/${rows.length} rows.`);
        } catch (err: any) {
            console.log(`❌ ${table}: ${err.message.substring(0, 100)}`);
        }
    }

    await aiven.query('SET FOREIGN_KEY_CHECKS = 1');

    await local.end();
    await aiven.end();
    console.log('\n🎉 Migration complete!');
    process.exit(0);
}

migrate().catch(err => { console.error(err.message); process.exit(1); });
