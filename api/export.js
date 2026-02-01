import { executeQuery } from './_utils/db.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { startDate, endDate } = req.body;

    try {
        const query = `
            SELECT 
                t.date,
                u.name as trainer_name,
                u.js_id,
                t.task_type,
                t.custom_task_name,
                t.hours,
                t.start_time,
                t.end_time
            FROM tasks t
            JOIN users u ON t.user_id = u.id
            WHERE t.date >= ? AND t.date <= ?
            ORDER BY t.date DESC, u.name ASC
        `;

        const result = await executeQuery(query, [startDate, endDate]);
        return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Export API error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
