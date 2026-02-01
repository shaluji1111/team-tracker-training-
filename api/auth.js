import bcrypt from 'bcryptjs';
import { executeQuery } from './_utils/db.js';
import { logAction } from './_utils/audit.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, ...data } = req.body;

    try {
        if (action === 'login') {
            const { jsId, password } = data;
            const result = await executeQuery(
                'SELECT * FROM users WHERE js_id = ? COLLATE NOCASE',
                [jsId]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }

            const user = result.rows[0];
            const passwordMatch = await bcrypt.compare(password, user.password_hash);

            if (!passwordMatch) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }

            const { password_hash, ...userWithoutPassword } = user;
            return res.status(200).json({ success: true, user: userWithoutPassword });

        } else if (action === 'change-password') {
            const { userId, newPassword } = data;
            const passwordHash = await bcrypt.hash(newPassword, 10);

            await executeQuery(
                'UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?',
                [passwordHash, userId]
            );

            await logAction(userId, 'CHANGE_PASSWORD', 'User changed their own password', req);
            return res.status(200).json({ success: true });
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
