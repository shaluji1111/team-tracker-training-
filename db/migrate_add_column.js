
// Set env vars before import (though function is lazy, this is safe)
process.env.VITE_TURSO_DATABASE_URL = 'libsql://teamtracker-sahilg.aws-ap-south-1.turso.io';
process.env.VITE_TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk4ODM2ODQsImlkIjoiMTMwNjRlMDctNmE2MC00NGJkLWI0ZjgtYThhM2E1OWU1MWE5IiwicmlkIjoiYjJhMmIzMjgtYWE0NS00NmZkLWI0NTUtNTk5YjNkYWFjOTRiIn0.zS4hy7TDJvXKl48hmn_Nl9HdlzqOo8e7DB0nrYGt-n9YfabFGGbdXgLPpIngLZMucBx9j1m-WvqBFA8XEklyCQ';

import { executeQuery } from '../src/lib/tursoClient.js';

async function migrate() {
    try {
        console.log('Adding must_change_password column to users table...');
        await executeQuery(
            'ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT 0'
        );
        console.log('Migration successful!');
    } catch (error) {
        if (error.message && error.message.includes('duplicate column')) {
            console.log('Column already exists.');
        } else {
            console.error('Migration failed:', error);
        }
    }
}

migrate();
