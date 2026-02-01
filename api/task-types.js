import { executeQuery } from './_utils/db.js';
import { logAction } from './_utils/audit.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, ...data } = req.body;

    try {
        if (action === 'get') {
            const result = await executeQuery('SELECT * FROM task_types ORDER BY name');
            return res.status(200).json({ success: true, types: result.rows });

        } else if (action === 'add') {
            const { name, userId } = data;

            try {
                await executeQuery('INSERT INTO task_types (name) VALUES (?)', [name]);
                if (userId) await logAction(userId, 'ADD_TASK_TYPE', { name }, req);
                return res.status(200).json({ success: true });
            } catch (e) {
                if (e.message && e.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ success: false, error: 'Task type already exists' });
                }
                throw e;
            }

        } else if (action === 'update') {
            const { id, name, userId } = data;

            try {
                await executeQuery('UPDATE task_types SET name = ? WHERE id = ?', [name, id]);
                if (userId) await logAction(userId, 'UPDATE_TASK_TYPE', { id, name }, req);
                return res.status(200).json({ success: true });
            } catch (e) {
                if (e.message && e.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ success: false, error: 'Task type already exists' });
                }
                throw e;
            }

        } else if (action === 'delete') {
            const { id, userId } = data;
            await executeQuery('DELETE FROM task_types WHERE id = ?', [id]);
            if (userId) await logAction(userId, 'DELETE_TASK_TYPE', { id }, req);
            return res.status(200).json({ success: true });

        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('TaskTypes API error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
