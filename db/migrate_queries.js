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

if (!DATABASE_URL) {
    console.error('Error: VITE_TURSO_DATABASE_URL not found in .env file');
    process.exit(1);
}

const client = createClient({
    url: DATABASE_URL,
    authToken: AUTH_TOKEN || undefined,
});

async function migrate() {
    console.log('🚀 Starting migration...');
    try {
        console.log('Adding admin_query column...');
        await client.execute('ALTER TABLE tasks ADD COLUMN admin_query TEXT');

        console.log('Adding query_status column...');
        await client.execute("ALTER TABLE tasks ADD COLUMN query_status TEXT DEFAULT 'resolved' CHECK(query_status IN ('pending', 'resolved'))");

        console.log('Adding trainer_response column...');
        await client.execute('ALTER TABLE tasks ADD COLUMN trainer_response TEXT');

        console.log('✅ Migration completed successfully');
    } catch (error) {
        if (error.message.includes('duplicate column name')) {
            console.log('⚠️ Columns already exist, skipping...');
        } else {
            console.error('❌ Migration failed:', error);
        }
    }
}

migrate();
