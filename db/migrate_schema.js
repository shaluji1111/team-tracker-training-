import { executeQuery } from '../api/_utils/db.js';
import fs from 'fs';

// Read .env file manually to support running via node
try {
    if (fs.existsSync('.env')) {
        const envContent = fs.readFileSync('.env', 'utf8');
        envContent.split(/\r?\n/).forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    process.env[match[1].trim()] = match[2].trim();
                }
            }
        });
    }
} catch (e) {
    console.warn('Warning: Could not read .env file');
}


async function migrate() {
    console.log('Running migration...');
    try {
        // Users table
        try {
            await executeQuery('ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0');
            console.log('Added must_change_password to users');
        } catch (e) {
            // Check for various "column exists" error messages depending on driver/db
            const msg = e.message.toLowerCase();
            if (!msg.includes('duplicate column') && !msg.includes('duplicate column name')) {
                console.log('must_change_password check:', e.message);
            } else {
                console.log('must_change_password already exists');
            }
        }

        // Tasks table
        try {
            await executeQuery('ALTER TABLE tasks ADD COLUMN start_time TEXT');
            console.log('Added start_time to tasks');
        } catch (e) {
            const msg = e.message.toLowerCase();
            if (!msg.includes('duplicate column') && !msg.includes('duplicate column name')) {
                console.log('start_time check:', e.message);
            } else {
                console.log('start_time already exists');
            }
        }

        try {
            await executeQuery('ALTER TABLE tasks ADD COLUMN end_time TEXT');
            console.log('Added end_time to tasks');
        } catch (e) {
            const msg = e.message.toLowerCase();
            if (!msg.includes('duplicate column') && !msg.includes('duplicate column name')) {
                console.log('end_time check:', e.message);
            } else {
                console.log('end_time already exists');
            }
        }

        // Announcements tables
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS announcements (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              message TEXT NOT NULL,
              is_urgent INTEGER DEFAULT 0,
              is_global INTEGER DEFAULT 1,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS announcement_recipients (
              announcement_id INTEGER,
              user_id INTEGER,
              FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              PRIMARY KEY (announcement_id, user_id)
            )
        `);
        console.log('Ensured announcements tables exist');

        console.log('Migration complete.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
