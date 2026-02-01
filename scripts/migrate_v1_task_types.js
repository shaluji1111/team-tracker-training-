import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

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

const TASK_TYPES = [
    'Shift Briefing',
    'Refresher Session',
    'Aligned in NHT Batch',
    'Call Audit',
    'Call Taking',
    'Dip Checks',
    'Creating PPT',
    'Updation in PPT',
    'Interviews',
    'Team Meeting',
    'Meeting - Other',
    'Aligned in Webinar',
    'Session in NHT Batch',
    'Online Training Session',
    'Online Induction Training',
    'Aligned in 72 Hours',
    'Branch Visit',
    'Half Day',
    'Leave',
    'Holiday',
    'Others',
];

async function migrate() {
    console.log('🚀 Starting migration: v1_task_types...\n');

    try {
        // 1. Create table
        console.log('📋 Creating task_types table...');
        await client.execute(`
            CREATE TABLE IF NOT EXISTS task_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Table created successfully');

        // 2. Seed data
        console.log('🌱 Seeding task types...');

        // Use a transaction for seeding
        const statements = TASK_TYPES.map(type => ({
            sql: 'INSERT OR IGNORE INTO task_types (name) VALUES (?)',
            args: [type]
        }));

        await client.batch(statements, 'write');
        console.log(`✅ Seeded ${TASK_TYPES.length} task types`);

        console.log('\n🎉 Migration completed successfully!');
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
