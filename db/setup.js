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

// Create Turso client
const client = createClient({
    url: DATABASE_URL,
    authToken: AUTH_TOKEN || undefined,
});

async function setupDatabase() {
    console.log('🚀 Starting database setup...\n');

    try {
        // Step 1: Create tables
        console.log('📋 Creating database tables...');

        const schema = fs.readFileSync('db/schema.sql', 'utf8');
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            await client.execute(statement);
        }
        console.log('✅ Tables created successfully\n');

        // Step 2: Seed users
        console.log('👥 Seeding users...');

        const defaultPassword = 'Welcome@JS2026';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        const trainers = [
            { name: 'Mukul Batish', jsId: 'JS18114' },
            { name: 'Kanwal Kishore', jsId: 'JS19328' },
            { name: 'Prerna Chhibber', jsId: 'JS19222' },
            { name: 'Shubham Arya', jsId: 'JS11090' },
            { name: 'Nitin Kumar', jsId: 'JS18022' },
            { name: 'Divya Srivastva', jsId: 'JS18679' },
            { name: 'Anchal Chauhan', jsId: 'JS13945' },
            { name: 'Gurpreet Kaur', jsId: 'JS19562' },
            { name: 'Mahesh Pal', jsId: 'JS16945' },
            { name: 'Manish Tanwar', jsId: 'JS18511' },
            { name: 'Sarita Kumari', jsId: 'JS20921' },
            { name: 'Yogyata Pendkalkar', jsId: 'JS20797' },
        ];

        // Insert admin
        await client.execute({
            sql: 'INSERT OR REPLACE INTO users (name, js_id, password_hash, role) VALUES (?, ?, ?, ?)',
            args: ['Admin User', 'admin', passwordHash, 'admin'],
        });
        console.log('✅ Admin created: Sonia Dhiman (ADMIN_SONIA)');

        // Insert trainers
        for (const trainer of trainers) {
            await client.execute({
                sql: 'INSERT OR REPLACE INTO users (name, js_id, password_hash, role) VALUES (?, ?, ?, ?)',
                args: [trainer.name, trainer.jsId, passwordHash, 'trainer'],
            });
            console.log(`✅ Trainer created: ${trainer.name} (${trainer.jsId})`);
        }

        console.log('\n🎉 Database setup completed successfully!');
        console.log('\n📝 Login credentials:');
        console.log('   Admin: ADMIN_SONIA / Welcome@JS2026');
        console.log('   Trainers: Use JS ID (e.g., JS18114) / Welcome@JS2026');

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    }
}

setupDatabase();
