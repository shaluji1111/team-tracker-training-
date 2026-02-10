
// Wrapper for API calls
// Wrapper for API calls
async function apiCall(endpoint, body) {
    try {
        const response = await fetch(`/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            if (!response.ok) {
                // If the backend sent a JSON error response
                throw new Error(data.error || 'API call failed');
            }
            return data;
        } else {
            // It's not JSON (likely 404 HTML or empty)
            const text = await response.text();
            if (!response.ok) {
                throw new Error(text || `Request failed with status ${response.status}`);
            }
            // Should not happen for our API unless something is wrong
            console.error('Received non-JSON response:', text);
            return { success: false, error: 'Invalid server response' };
        }

    } catch (error) {
        console.error(`API Call error (${endpoint}):`, error);
        return { success: false, error: error.message };
    }
}

// Auth functions
export async function login(jsId, password) {
    return apiCall('auth', { action: 'login', jsId, password });
}

export async function changePassword(userId, newPassword) {
    return apiCall('auth', { action: 'change-password', userId, newPassword });
}

// User management functions (Trainers)
export async function getAllTrainers() {
    return apiCall('users', { action: 'get-all' });
}

export async function addTrainer(name, jsId, adminId) {
    return apiCall('users', { action: 'add', name, jsId, adminId });
}

export async function updateUser(userId, name, jsId, adminId) {
    return apiCall('users', { action: 'update', userId, name, jsId, adminId });
}

export async function deleteUser(userId, adminId) {
    return apiCall('users', { action: 'delete', userId, adminId });
}

export async function resetPassword(userId, adminId) {
    return apiCall('users', { action: 'reset-password', userId, adminId });
}

// Task management functions
export async function getUserTasks(userId, date = null) {
    return apiCall('tasks', { action: 'get-user-tasks', userId, date });
}

export async function addTask(userId, taskType, customTaskName, hours, date, startTime = null, endTime = null, remarks = null) {
    return apiCall('tasks', {
        action: 'add',
        userId,
        taskType,
        customTaskName,
        hours,
        date,
        startTime,
        endTime,
        remarks
    });
}

export async function updateTask(taskId, userId, taskType, customTaskName, hours, date, startTime = null, endTime = null, remarks = null) {
    return apiCall('tasks', {
        action: 'update',
        taskId,
        userId,
        taskType,
        customTaskName,
        hours,
        date,
        startTime,
        endTime,
        remarks
    });
}

export async function deleteTask(taskId, userId) {
    return apiCall('tasks', { action: 'delete', taskId, userId });
}

export async function getTodayHours(userId, date) {
    return apiCall('tasks', { action: 'get-today-hours', userId, date });
}

export async function raiseQuery(taskId, query, adminId) {
    return apiCall('tasks', { action: 'raise-query', taskId, query, adminId });
}

// Admin dashboard functions
export async function getTeamPerformance(date) {
    return apiCall('admin', { action: 'team-performance', date });
}

export async function getTeamTrends(days = 30) {
    return apiCall('admin', { action: 'team-trends', days });
}

export async function getTopPerformers(period = 'month') {
    return apiCall('admin', { action: 'top-performers', period });
}

export async function getAuditLogs(limit = 100) {
    return apiCall('admin', { action: 'audit-logs', limit });
}

// Individual trainer reports
export async function getTrainerTasks(trainerId, dateRange = 'week', startDate = null, endDate = null) {
    return apiCall('reports', { action: 'trainer-tasks', trainerId, dateRange, startDate, endDate });
}

// Announcements
export async function getAnnouncements(userId = null) {
    return apiCall('announcements', { action: 'get', userId });
}

export async function createAnnouncement(message, isUrgent, recipientIds) {
    return apiCall('announcements', { action: 'create', message, isUrgent, recipientIds });
}

// Task Types management
export async function getTaskTypes() {
    return apiCall('task-types', { action: 'get' });
}

export async function addTaskType(name, userId) {
    return apiCall('task-types', { action: 'add', name, userId });
}

export async function updateTaskType(id, name, userId) {
    return apiCall('task-types', { action: 'update', id, name, userId });
}

export async function deleteTaskType(id, userId) {
    return apiCall('task-types', { action: 'delete', id, userId });
}

// Export
export async function getExportData(startDate, endDate) {
    // Note: api/export.js handles POST directly with { startDate, endDate }
    // We reuse apiCall but it sends action: 'get' by default if we followed pattern, 
    // but export.js expects startDate/endDate in body.
    // Let's manually call it to be precise or adjust apiCall. 
    // Actually apiCall takes `body`. So:
    return apiCall('export', { startDate, endDate });
}
