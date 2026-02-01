import { createClient } from '@libsql/client';

let client = null;

export function getTursoClient() {
    if (!client) {
        const url = process.env.TURSO_DATABASE_URL || process.env.VITE_TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN || process.env.VITE_TURSO_AUTH_TOKEN;

        if (!url) {
            throw new Error('TURSO_DATABASE_URL (or VITE_TURSO_DATABASE_URL) is not set');
        }

        client = createClient({
            url,
            authToken: authToken || undefined,
        });
    }
    return client;
}

export async function executeQuery(query, params = []) {
    const db = getTursoClient();
    try {
        return await db.execute({ sql: query, args: params });
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

export async function executeBatch(statements) {
    const db = getTursoClient();
    try {
        return await db.batch(statements, 'write');
    } catch (error) {
        console.error('Database batch error:', error);
        throw error;
    }
}
