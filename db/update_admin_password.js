
process.env.VITE_TURSO_DATABASE_URL = 'libsql://teamtracker-sahilg.aws-ap-south-1.turso.io';
process.env.VITE_TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk4ODM2ODQsImlkIjoiMTMwNjRlMDctNmE2MC00NGJkLWI0ZjgtYThhM2E1OWU1MWE5IiwicmlkIjoiYjJhMmIzMjgtYWE0NS00NmZkLWI0NTUtNTk5YjNkYWFjOTRiIn0.zS4hy7TDJvXKl48hmn_Nl9HdlzqOo8e7DB0nrYGt-n9YfabFGGbdXgLPpIngLZMucBx9j1m-WvqBFA8XEklyCQ';

import { executeQuery } from '../src/lib/tursoClient.js';
import bcrypt from 'bcryptjs';

async function updateAdminPassword() {
    try {
        console.log('Updating admin password...');

        const newPassword = 'SoniaDhiman@123';
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password for admin user (role='admin')
        // We also reset must_change_password to 0 just in case
        await executeQuery(
            "UPDATE users SET password_hash = ?, must_change_password = 0 WHERE role = 'admin'",
            [passwordHash]
        );

        console.log(`Admin password successfully changed to: ${newPassword}`);

    } catch (error) {
        console.error('Password update failed:', error);
    }
}

updateAdminPassword();
