import { executeQuery } from './_utils/db.js';
import { logAction } from './_utils/audit.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, ...data } = req.body;

    try {
        if (action === 'get-user-tasks') {
            const { userId, date } = data;
            let query = 'SELECT * FROM tasks WHERE user_id = ?';
            const params = [userId];

            if (date) {
                query += ' AND date = ?';
                params.push(date);
            }

            query += ' ORDER BY created_at DESC';

            const result = await executeQuery(query, params);
            return res.status(200).json({ success: true, tasks: result.rows });

        } else if (action === 'add') {
            const { userId, taskType, customTaskName, hours, date, startTime, endTime } = data;

            const result = await executeQuery(
                'INSERT INTO tasks (user_id, task_type, custom_task_name, hours, date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, taskType, customTaskName || null, hours, date, startTime || null, endTime || null]
            );

            if (result.rowsAffected > 0) {
                await logAction(userId, 'ADD_TASK', {
                    task_type: taskType,
                    hours,
                    date
                }, req);
            }
            return res.status(200).json({ success: true });

        } else if (action === 'update') {
            const { taskId, userId, taskType, customTaskName, hours, date, startTime, endTime } = data;

            // Verify ownership
            const checkResult = await executeQuery('SELECT user_id FROM tasks WHERE id = ?', [taskId]);
            if (checkResult.rows.length === 0 || checkResult.rows[0].user_id !== userId) {
                return res.status(403).json({ success: false, error: 'Unauthorized' });
            }

            await executeQuery(
                'UPDATE tasks SET task_type = ?, custom_task_name = ?, hours = ?, date = ?, start_time = ?, end_time = ? WHERE id = ?',
                [taskType, customTaskName || null, hours, date, startTime || null, endTime || null, taskId]
            );

            await logAction(userId, 'UPDATE_TASK', {
                taskId,
                task_type: taskType,
                hours,
                date
            }, req);

            return res.status(200).json({ success: true });

        } else if (action === 'delete') {
            const { taskId, userId } = data;

            // Verify ownership
            const checkResult = await executeQuery('SELECT user_id FROM tasks WHERE id = ?', [taskId]);
            if (checkResult.rows.length === 0 || checkResult.rows[0].user_id !== userId) {
                return res.status(403).json({ success: false, error: 'Unauthorized' });
            }

            await executeQuery('DELETE FROM tasks WHERE id = ?', [taskId]);

            await logAction(userId, 'DELETE_TASK', { taskId }, req);
            return res.status(200).json({ success: true });

        } else if (action === 'get-today-hours') {
            const { userId, date } = data;
            const result = await executeQuery(
                'SELECT SUM(hours) as total FROM tasks WHERE user_id = ? AND date = ?',
                [userId, date]
            );
            const total = result.rows[0]?.total || 0;
            return res.status(200).json({ success: true, hours: total });

        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Tasks API error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
