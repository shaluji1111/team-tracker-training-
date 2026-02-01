import { createClient } from '@libsql/client';
import fs from 'fs';

// Read .env file manually
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            envVars[match[1].trim()] = match[2].trim();
        }
    }
});

const DATABASE_URL = envVars.VITE_TURSO_DATABASE_URL;
const AUTH_TOKEN = envVars.VITE_TURSO_AUTH_TOKEN;

// Create Turso client
const client = createClient({
    url: DATABASE_URL,
    authToken: AUTH_TOKEN || undefined,
});

async function runMigration() {
    try {
        console.log('Running migration to add must_change_password column...');

        // Add column (will fail silently if already exists)
        try {
            await client.execute('ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 1');
            console.log('✅ Column added successfully');
        } catch (error) {
            if (error.message.includes('duplicate column name')) {
                console.log('ℹ️  Column already exists, skipping...');
            } else {
                throw error;
            }
        }

        // Update admin to not require password change
        await client.execute({
            sql: 'UPDATE users SET must_change_password = 0 WHERE role = ?',
            args: ['admin']
        });
        console.log('✅ Admin password requirement removed');

        console.log('\n🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
