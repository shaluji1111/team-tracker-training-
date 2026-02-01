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

const client = createClient({
    url: DATABASE_URL,
    authToken: AUTH_TOKEN || undefined,
});

async function updateAdmin() {
    console.log('🔄 Updating admin username to "admin"...');

    try {
        const password = 'Welcome@JS2026';
        const passwordHash = await bcrypt.hash(password, 10);

        // Delete old admin if exists
        await client.execute({
            sql: "DELETE FROM users WHERE js_id = 'ADMIN_SONIA'",
            args: []
        });

        // Insert new admin
        await client.execute({
            sql: 'INSERT OR REPLACE INTO users (name, js_id, password_hash, role) VALUES (?, ?, ?, ?)',
            args: ['Admin User', 'admin', passwordHash, 'admin'],
        });

        console.log('✅ Admin updated successfully!');
        console.log('   New Username: admin (case-insensitive)');
        console.log('   Password: Welcome@JS2026');

    } catch (error) {
        console.error('❌ Update failed:', error);
    }
}

updateAdmin();
