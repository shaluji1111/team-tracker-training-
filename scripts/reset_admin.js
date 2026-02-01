import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
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

async function resetAdmin() {
    console.log('🔄 Resetting admin credentials...');

    try {
        const password = 'Welcome@JS2026';
        const passwordHash = await bcrypt.hash(password, 10);

        await client.execute({
            sql: 'INSERT OR REPLACE INTO users (name, js_id, password_hash, role) VALUES (?, ?, ?, ?)',
            args: ['Sonia Dhiman', 'ADMIN_SONIA', passwordHash, 'admin'],
        });

        console.log('✅ Admin credentials updated successfully!');
        console.log('   Username: ADMIN_SONIA');
        console.log('   Password: Welcome@JS2026');

    } catch (error) {
        console.error('❌ Reset failed:', error);
    }
}

resetAdmin();
