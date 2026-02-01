import { executeQuery } from './db.js';

export async function logAction(userId, action, details, req) {
    try {
        const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;

        let ipAddress = null;
        if (req) {
            // Vercel/Node IP headers
            ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            if (ipAddress && typeof ipAddress === 'string' && ipAddress.includes(',')) {
                ipAddress = ipAddress.split(',')[0].trim();
            }
        }

        await executeQuery(
            'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
            [userId, action, detailsStr, ipAddress]
        );
    } catch (error) {
        console.error('Log action error:', error);
    }
}
