import bcrypt from 'bcryptjs';
import { executeBatch } from '../src/lib/tursoClient.js';

async function seedDatabase() {
    console.log('Starting database seeding...');

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

    const statements = [
        // Insert admin
        {
            sql: 'INSERT OR REPLACE INTO users (name, js_id, password_hash, role) VALUES (?, ?, ?, ?)',
            args: ['Sonia Dhiman', 'ADMIN_SONIA', passwordHash, 'admin'],
        },
        // Insert trainers
        ...trainers.map((trainer) => ({
            sql: 'INSERT OR REPLACE INTO users (name, js_id, password_hash, role) VALUES (?, ?, ?, ?)',
            args: [trainer.name, trainer.jsId, passwordHash, 'trainer'],
        })),
    ];

    try {
        await executeBatch(statements);
        console.log('Database seeded successfully!');
        console.log('Admin: Sonia Dhiman (ADMIN_SONIA)');
        console.log(`${trainers.length} trainers added`);
        console.log('Default password for all users: Welcome@JS2026');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedDatabase();
