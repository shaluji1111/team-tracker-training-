
// Env vars for Node
process.env.VITE_TURSO_DATABASE_URL = 'libsql://teamtracker-sahilg.aws-ap-south-1.turso.io';
process.env.VITE_TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk4ODM2ODQsImlkIjoiMTMwNjRlMDctNmE2MC00NGJkLWI0ZjgtYThhM2E1OWU1MWE5IiwicmlkIjoiYjJhMmIzMjgtYWE0NS00NmZkLWI0NTUtNTk5YjNkYWFjOTRiIn0.zS4hy7TDJvXKl48hmn_Nl9HdlzqOo8e7DB0nrYGt-n9YfabFGGbdXgLPpIngLZMucBx9j1m-WvqBFA8XEklyCQ';

import { executeQuery } from '../src/lib/tursoClient.js';
import bcrypt from 'bcryptjs';

async function debug() {
    try {
        // 1. Get a trainer
        console.log('Finding a trainer...');
        const users = await executeQuery("SELECT * FROM users WHERE role='trainer' LIMIT 1");
        if (users.rows.length === 0) {
            console.log('No trainers found.');
            return;
        }
        const trainer = users.rows[0];
        console.log('Trainer found:', trainer.name, trainer.id);

        // 2. Simulate Reset Password
        console.log('Resetting password...');
        const defaultPassword = 'Welcome@JS2026';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        await executeQuery(
            'UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?',
            [passwordHash, trainer.id]
        );
        console.log('Password reset executed.');

        // 3. Verify DB state
        const updatedUserRes = await executeQuery('SELECT * FROM users WHERE id = ?', [trainer.id]);
        const updatedUser = updatedUserRes.rows[0];
        console.log('Updated user must_change_password:', updatedUser.must_change_password);

        // 4. Simulate Login
        console.log('Attempting login with default password...');
        const match = await bcrypt.compare(defaultPassword, updatedUser.password_hash);
        console.log('Password match:', match);

        if (match) {
            console.log('Login successful! must_change_password is:', updatedUser.must_change_password);
        } else {
            console.log('Login failed: Password mismatch.');
        }

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

debug();
