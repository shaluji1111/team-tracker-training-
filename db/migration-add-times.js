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
        console.log('Adding time tracking columns...');

        // Add start_time column
        try {
            await client.execute('ALTER TABLE tasks ADD COLUMN start_time TIME');
            console.log('✅ start_time column added');
        } catch (error) {
            if (error.message.includes('duplicate column name')) {
                console.log('ℹ️  start_time column already exists');
            } else {
                throw error;
            }
        }

        // Add end_time column
        try {
            await client.execute('ALTER TABLE tasks ADD COLUMN end_time TIME');
            console.log('✅ end_time column added');
        } catch (error) {
            if (error.message.includes('duplicate column name')) {
                console.log('ℹ️  end_time column already exists');
            } else {
                throw error;
            }
        }

        console.log('\n🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
