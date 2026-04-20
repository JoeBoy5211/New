import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const aivenUrl = process.env.DATABASE_URL!;

async function uploadToCloudinary(localPath: string, folder: string): Promise<string | null> {
    // If the path starts with a slash, slice it so path.join works correctly relative to backend
    const cleanPath = localPath.startsWith('/') ? localPath.slice(1) : localPath;
    const fullPath = path.join(__dirname, cleanPath);
    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️ Local file not found: ${fullPath}`);
        return null;
    }

    try {
        const result = await cloudinary.uploader.upload(fullPath, {
            folder: `catering_app/${folder}`,
            resource_type: 'auto'
        });
        return result.secure_url;
    } catch (err: any) {
        console.error(`❌ Failed to upload ${localPath}:`, err.message);
        return null;
    }
}

async function migrateImages() {
    console.log('🔄 Connecting to Aiven Database...');
    const aiven = await mysql.createConnection({ uri: aivenUrl });
    console.log('✅ Connected.\n');

    // MIGRATING PROFILES
    const [profiles]: any = await aiven.query("SELECT id, avatar_url FROM profiles WHERE avatar_url LIKE '/uploads/%'");
    console.log(`Found ${profiles.length} profiles to update.`);
    for (const p of profiles) {
        console.log(`Uploading avatar for profile ${p.id}...`);
        const url = await uploadToCloudinary(p.avatar_url, 'profiles');
        if (url) await aiven.query("UPDATE profiles SET avatar_url = ? WHERE id = ?", [url, p.id]);
    }

    // MIGRATING CATERERS
    const [caterers]: any = await aiven.query("SELECT id, cover_image FROM caterers WHERE cover_image LIKE '/uploads/%'");
    console.log(`\nFound ${caterers.length} caterers to update.`);
    for (const c of caterers) {
        console.log(`Uploading cover image for caterer ${c.id}...`);
        const url = await uploadToCloudinary(c.cover_image, 'caterers');
        if (url) await aiven.query("UPDATE caterers SET cover_image = ? WHERE id = ?", [url, c.id]);
    }

    // MIGRATING MENU ITEMS
    const [menuItems]: any = await aiven.query("SELECT id, image FROM menu_items WHERE image LIKE '/uploads/%'");
    console.log(`\nFound ${menuItems.length} menu items to update.`);
    for (const m of menuItems) {
        console.log(`Uploading image for menu item ${m.id}...`);
        const url = await uploadToCloudinary(m.image, 'menus');
        if (url) await aiven.query("UPDATE menu_items SET image = ? WHERE id = ?", [url, m.id]);
    }

    // MIGRATING PROMOTIONS
    const [promotions]: any = await aiven.query("SELECT id, media_url FROM promotions WHERE media_url LIKE '/uploads/%'");
    console.log(`\nFound ${promotions.length} promotions to update.`);
    for (const promo of promotions) {
        console.log(`Uploading media for promotion ${promo.id}...`);
        const url = await uploadToCloudinary(promo.media_url, 'promotions');
        if (url) await aiven.query("UPDATE promotions SET media_url = ? WHERE id = ?", [url, promo.id]);
    }

    await aiven.end();
    console.log('\n🎉 Image migration complete!');
    process.exit(0);
}

migrateImages().catch(err => { console.error('Unhandled error:', err.message); process.exit(1); });
