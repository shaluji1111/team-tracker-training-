import bcrypt from 'bcryptjs';
import { executeQuery } from './_utils/db.js';
import { logAction } from './_utils/audit.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, ...data } = req.body;

    try {
        if (action === 'get-all') {
            const result = await executeQuery(
                "SELECT id, name, js_id, role, must_change_password, created_at FROM users WHERE role = 'trainer' ORDER BY name",
                []
            );
            return res.status(200).json({ success: true, trainers: result.rows });

        } else if (action === 'add') {
            const { name, jsId, adminId } = data;
            const defaultPassword = 'Welcome@JS2026';
            const passwordHash = await bcrypt.hash(defaultPassword, 10);

            await executeQuery(
                'INSERT INTO users (name, js_id, password_hash, role, must_change_password) VALUES (?, ?, ?, ?, 1)',
                [name, jsId, passwordHash, 'trainer']
            );

            if (adminId) {
                await logAction(adminId, 'ADD_TRAINER', { name, jsId }, req);
            }
            return res.status(200).json({ success: true });

        } else if (action === 'update') {
            const { userId, name, jsId, adminId } = data;

            await executeQuery(
                'UPDATE users SET name = ?, js_id = ? WHERE id = ?',
                [name, jsId, userId]
            );

            if (adminId) {
                await logAction(adminId, 'UPDATE_TRAINER', { userId, name, jsId }, req);
            }
            return res.status(200).json({ success: true });

        } else if (action === 'delete') {
            const { userId, adminId } = data;
            // First delete all tasks for this user
            await executeQuery('DELETE FROM tasks WHERE user_id = ?', [userId]);
            // Then delete the user
            await executeQuery('DELETE FROM users WHERE id = ?', [userId]);

            if (adminId) {
                await logAction(adminId, 'DELETE_TRAINER', { userId }, req);
            }
            return res.status(200).json({ success: true });

        } else if (action === 'reset-password') {
            const { userId, adminId } = data;
            const defaultPassword = 'Welcome@JS2026';
            const passwordHash = await bcrypt.hash(defaultPassword, 10);

            await executeQuery(
                'UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?',
                [passwordHash, userId]
            );

            if (adminId) {
                await logAction(adminId, 'RESET_PASSWORD', { userId }, req);
            }
            return res.status(200).json({ success: true });

        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Users API error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
