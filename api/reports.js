import { executeQuery } from './_utils/db.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, ...data } = req.body;

    try {
        if (action === 'trainer-tasks') {
            const { trainerId, dateRange = 'week', startDate, endDate } = data;
            const today = new Date();
            let query = `
                SELECT 
                    task_type,
                    custom_task_name,
                    hours,
                    date,
                    remarks,
                    admin_query,
                    query_status,
                    trainer_response,
                    created_at
                FROM tasks 
                WHERE user_id = ?
            `;
            const params = [trainerId];

            if (dateRange === 'custom' && startDate && endDate) {
                query += ' AND date >= ? AND date <= ?';
                params.push(startDate, endDate);
            } else {
                let dateThreshold;
                if (dateRange === 'week') {
                    dateThreshold = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                } else if (dateRange === 'month') {
                    dateThreshold = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                } else if (dateRange === 'today') {
                    dateThreshold = today;
                } else {
                    dateThreshold = new Date('2020-01-01');
                }

                const offset = today.getTimezoneOffset();
                const localDate = new Date(dateThreshold.getTime() - (offset * 60 * 1000));
                const dateThresholdStr = localDate.toISOString().split('T')[0];

                query += ' AND date >= ?';
                params.push(dateThresholdStr);
            }

            query += ' ORDER BY date DESC, created_at DESC';

            const result = await executeQuery(query, params);

            const tasks = result.rows;

            // Calculate stats
            const dailyHours = {};
            tasks.forEach(task => {
                if (!dailyHours[task.date]) {
                    dailyHours[task.date] = 0;
                }
                dailyHours[task.date] += task.hours;
            });

            const tasksWithDailyHours = tasks.map(task => ({
                ...task,
                daily_hours: dailyHours[task.date] || 0
            }));

            const totalHours = tasks.reduce((sum, task) => sum + task.hours, 0);
            const totalTasks = tasks.length;
            const uniqueDays = new Set(tasks.map(t => t.date)).size;
            const avgHoursPerDay = uniqueDays > 0 ? totalHours / uniqueDays : 0;

            return res.status(200).json({
                success: true,
                tasks: tasksWithDailyHours,
                stats: {
                    totalHours,
                    totalTasks,
                    avgHoursPerDay
                }
            });

        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Reports API error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
