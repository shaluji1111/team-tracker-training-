import { executeQuery, executeBatch } from './_utils/db.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, ...data } = req.body;

    try {
        if (action === 'get') {
            const { userId } = data;
            let query;
            let params = [];

            if (userId) {
                query = `
                    SELECT DISTINCT a.* 
                    FROM announcements a
                    LEFT JOIN announcement_recipients ar ON a.id = ar.announcement_id
                    WHERE a.is_global = 1 OR ar.user_id = ?
                    ORDER BY a.created_at DESC
                    LIMIT 5
                `;
                params = [userId];
            } else {
                query = 'SELECT * FROM announcements ORDER BY created_at DESC LIMIT 20';
            }

            const result = await executeQuery(query, params);
            return res.status(200).json({ success: true, announcements: result.rows });

        } else if (action === 'create') {
            const { message, isUrgent, recipientIds } = data;
            const isGlobal = recipientIds.length === 0 || recipientIds.includes('all');

            const result = await executeQuery(
                'INSERT INTO announcements (message, is_urgent, is_global) VALUES (?, ?, ?) RETURNING id',
                [message, isUrgent ? 1 : 0, isGlobal ? 1 : 0]
            );

            // If inserted, we get id. Note: Turso/libsql over http might return rows for RETURNING
            const announcementId = result.rows[0].id;

            if (!isGlobal && recipientIds.length > 0) {
                const statements = recipientIds.map(uid => ({
                    sql: 'INSERT INTO announcement_recipients (announcement_id, user_id) VALUES (?, ?)',
                    args: [announcementId, Number(uid)]
                }));
                await executeBatch(statements);
            }

            return res.status(200).json({ success: true });

        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Announcements API error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
