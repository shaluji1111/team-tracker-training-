import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

// Read .env file manually to get credentials
const envPath = path.resolve(process.cwd(), '.env');
let envVars = {};

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                envVars[match[1].trim()] = match[2].trim();
            }
        }
    });
}

const DATABASE_URL = envVars.VITE_TURSO_DATABASE_URL;
const AUTH_TOKEN = envVars.VITE_TURSO_AUTH_TOKEN;

if (!DATABASE_URL) {
    console.error('Error: VITE_TURSO_DATABASE_URL not found in .env file');
    process.exit(1);
}

const client = createClient({
    url: DATABASE_URL,
    authToken: AUTH_TOKEN || undefined,
});

async function migrate() {
    console.log('🚀 Starting migration: Add remarks column to tasks table...');

    try {
        // Check if column exists (simple check by trying to select it, or just alter table and catch error if exists)
        // SQLite doesn't support IF NOT EXISTS in ADD COLUMN directly in all versions, but Turso/libSQL should be fine with standard SQL.
        // However, repeatedly adding same column will error.

        // Let's try to add the column.
        await client.execute('ALTER TABLE tasks ADD COLUMN remarks TEXT');

        console.log('✅ Successfully added "remarks" column to tasks table.');

    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log('ℹ️ Column "remarks" already exists. Skipping.');
        } else {
            console.error('❌ Migration failed:', error.message);
            process.exit(1);
        }
    }
}

migrate();
