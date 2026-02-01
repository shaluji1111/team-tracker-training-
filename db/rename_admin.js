
process.env.VITE_TURSO_DATABASE_URL = 'libsql://teamtracker-sahilg.aws-ap-south-1.turso.io';
process.env.VITE_TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk4ODM2ODQsImlkIjoiMTMwNjRlMDctNmE2MC00NGJkLWI0ZjgtYThhM2E1OWU1MWE5IiwicmlkIjoiYjJhMmIzMjgtYWE0NS00NmZkLWI0NTUtNTk5YjNkYWFjOTRiIn0.zS4hy7TDJvXKl48hmn_Nl9HdlzqOo8e7DB0nrYGt-n9YfabFGGbdXgLPpIngLZMucBx9j1m-WvqBFA8XEklyCQ';

import { executeQuery } from '../src/lib/tursoClient.js';

async function renameAdmin() {
    try {
        console.log('Renaming admin user...');

        // Check if admin exists
        const result = await executeQuery("SELECT * FROM users WHERE role = 'admin'");
        if (result.rows.length === 0) {
            console.log('No admin user found.');
            return;
        }

        const admin = result.rows[0];
        console.log(`Found admin: ${admin.name} (${admin.js_id})`);

        // Update admin
        await executeQuery(
            "UPDATE users SET js_id = 'admin', name = 'Admin' WHERE role = 'admin'"
        );

        console.log('Admin renamed successfully to "Admin" with js_id "admin".');

    } catch (error) {
        console.error('Rename failed:', error);
    }
}

renameAdmin();
