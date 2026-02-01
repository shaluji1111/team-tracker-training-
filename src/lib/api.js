import bcrypt from 'bcryptjs';
import { executeQuery, executeBatch } from './tursoClient.js';

// Auth functions
export async function login(jsId, password) {
    try {
        const result = await executeQuery(
            'SELECT * FROM users WHERE js_id = ? COLLATE NOCASE',
            [jsId]
        );

        if (result.rows.length === 0) {
            return { success: false, error: 'Invalid credentials' };
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return { success: false, error: 'Invalid credentials' };
        }

        // Return user without password hash
        const { password_hash, ...userWithoutPassword } = user;
        return { success: true, user: userWithoutPassword };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Login failed' };
    }
}

// User management functions
export async function getAllTrainers() {
    try {
        const result = await executeQuery(
            "SELECT id, name, js_id, created_at FROM users WHERE role = 'trainer' ORDER BY name",
            []
        );
        return { success: true, trainers: result.rows };
    } catch (error) {
        console.error('Get trainers error:', error);
        return { success: false, error: 'Failed to fetch trainers' };
    }
}

export async function addTrainer(name, jsId, adminId) {
    try {
        const defaultPassword = 'Welcome@JS2026';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        await executeQuery(
            'INSERT INTO users (name, js_id, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, jsId, passwordHash, 'trainer']
        );

        if (adminId) {
            await logAction(adminId, 'ADD_TRAINER', { name, jsId });
        }

        return { success: true };
    } catch (error) {
        console.error('Add trainer error:', error);
        return { success: false, error: 'Failed to add trainer' };
    }
}

export async function updateUser(userId, name, jsId, adminId) {
    try {
        await executeQuery(
            'UPDATE users SET name = ? WHERE id = ?',
            [name, userId] // Only updating name for now based on snippet, wait.
            // Original code: 'UPDATE users SET name = ?, js_id = ? WHERE id = ?'
        );
        // Wait, the original code had jsId too.
        await executeQuery(
            'UPDATE users SET name = ?, js_id = ? WHERE id = ?',
            [name, jsId, userId]
        );

        if (adminId) {
            await logAction(adminId, 'UPDATE_TRAINER', { userId, name, jsId });
        }

        return { success: true };
    } catch (error) {
        console.error('Update user error:', error);
        return { success: false, error: 'Failed to update user' };
    }
}

export async function resetPassword(userId, adminId) {
    try {
        const defaultPassword = 'Welcome@JS2026';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        await executeQuery(
            'UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?',
            [passwordHash, userId]
        );

        if (adminId) {
            await logAction(adminId, 'RESET_PASSWORD', { userId });
        }

        return { success: true };
    } catch (error) {
        console.error('Reset password error:', error);
        return { success: false, error: 'Failed to reset password' };
    }
}

// Task management functions
export async function getUserTasks(userId, date = null) {
    try {
        let query = 'SELECT * FROM tasks WHERE user_id = ?';
        const params = [userId];

        if (date) {
            query += ' AND date = ?';
            params.push(date);
        }

        query += ' ORDER BY created_at DESC';

        const result = await executeQuery(query, params);
        return { success: true, tasks: result.rows };
    } catch (error) {
        console.error('Get tasks error:', error);
        return { success: false, error: 'Failed to fetch tasks' };
    }
}

export async function addTask(userId, taskType, customTaskName, hours, date, startTime = null, endTime = null) {
    try {
        await executeQuery(
            'INSERT INTO tasks (user_id, task_type, custom_task_name, hours, date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, taskType, customTaskName || null, hours, date, startTime, endTime]
        );

        if (result.rowsAffected > 0) {
            // Log action - safe to await as it's fire-and-forget in catch
            await logAction(userId, 'ADD_TASK', {
                task_type: taskType,
                hours,
                date
            });
            return { success: true };
        }
    } catch (error) {
        console.error('Add task error:', error);
        return { success: false, error: 'Failed to add task' };
    }
}

// Update task
export async function updateTask(taskId, userId, taskType, customTaskName, hours, date, startTime = null, endTime = null) {
    try {
        // Verify the task belongs to this user
        const checkResult = await executeQuery(
            'SELECT user_id FROM tasks WHERE id = ?',
            [taskId]
        );

        if (checkResult.rows.length === 0 || checkResult.rows[0].user_id !== userId) {
            return { success: false, error: 'Task not found or unauthorized' };
        }

        await executeQuery(
            'UPDATE tasks SET task_type = ?, custom_task_name = ?, hours = ?, date = ?, start_time = ?, end_time = ? WHERE id = ?',
            [taskType, customTaskName || null, hours, date, startTime, endTime, taskId]
        );

        await logAction(userId, 'UPDATE_TASK', {
            taskId,
            task_type: taskType,
            hours,
            date
        });

        return { success: true };
    } catch (error) {
        console.error('Update task error:', error);
        return { success: false, error: 'Failed to update task' };
    }
}

// Delete task
export async function deleteTask(taskId, userId) {
    try {
        // Verify the task belongs to this user
        const checkResult = await executeQuery(
            'SELECT user_id FROM tasks WHERE id = ?',
            [taskId]
        );

        if (checkResult.rows.length === 0 || checkResult.rows[0].user_id !== userId) {
            return { success: false, error: 'Task not found or unauthorized' };
        }

        await executeQuery(
            'DELETE FROM tasks WHERE id = ?',
            [taskId]
        );

        await logAction(userId, 'DELETE_TASK', { taskId });

        return { success: true };
    } catch (error) {
        console.error('Delete task error:', error);
        return { success: false, error: 'Failed to delete task' };
    }
}

export async function getTodayHours(userId, date) {
    try {
        const result = await executeQuery(
            'SELECT SUM(hours) as total FROM tasks WHERE user_id = ? AND date = ?',
            [userId, date]
        );

        const total = result.rows[0]?.total || 0;
        return { success: true, hours: total };
    } catch (error) {
        console.error('Get today hours error:', error);
        return { success: false, error: 'Failed to calculate hours' };
    }
}

// Admin dashboard functions
export async function getTeamPerformance(date) {
    try {
        // Get all trainers
        const trainersResult = await executeQuery(
            "SELECT id, name, js_id FROM users WHERE role = 'trainer'",
            []
        );

        const trainers = trainersResult.rows;
        const performance = { underperforming: 0, normal: 0, overperforming: 0, onLeave: 0, holiday: 0 };
        const trainerDetails = [];

        for (const trainer of trainers) {
            const tasksDetailsResult = await executeQuery(
                'SELECT task_type FROM tasks WHERE user_id = ? AND date = ?',
                [trainer.id, date]
            );

            const userTasks = tasksDetailsResult.rows.map(t => t.task_type);
            const isOnLeave = userTasks.includes('Leave');
            const isHoliday = userTasks.includes('Holiday');
            const isHalfDay = userTasks.includes('Half Day');

            const hoursResult = await executeQuery(
                'SELECT SUM(hours) as total FROM tasks WHERE user_id = ? AND date = ?',
                [trainer.id, date]
            );

            const hours = hoursResult.rows[0]?.total || 0;
            let status;

            if (isOnLeave) {
                performance.onLeave++;
                status = 'On Leave';
            } else if (isHoliday) {
                performance.holiday++;
                status = 'Holiday';
            } else {
                // Determine thresholds based on Half Day
                let minHours = 7;
                let maxHours = 7.5;

                if (isHalfDay) {
                    minHours = 3.5;
                    maxHours = 4.5;
                }

                if (hours < minHours) {
                    performance.underperforming++;
                    status = 'underperforming';
                } else if (hours <= maxHours) {
                    performance.normal++;
                    status = 'normal';
                } else {
                    performance.overperforming++;
                    status = 'overperforming';
                }
            }

            trainerDetails.push({
                ...trainer,
                hours,
                status,
                isHalfDay,
            });
        }

        return { success: true, performance, trainers: trainerDetails };
    } catch (error) {
        console.error('Get team performance error:', error);
        return { success: false, error: 'Failed to fetch team performance' };
    }
}

// Individual trainer reports
export async function getTrainerTasks(trainerId, dateRange = 'week') {
    try {
        // Calculate date threshold based on range
        const today = new Date();
        let dateThreshold;

        if (dateRange === 'week') {
            dateThreshold = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (dateRange === 'month') {
            dateThreshold = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (dateRange === 'today') {
            dateThreshold = today;
        } else {
            // All time - use a very old date
            dateThreshold = new Date('2020-01-01');
        }

        // Get local date string YYYY-MM-DD
        const offset = today.getTimezoneOffset();
        const localDate = new Date(dateThreshold.getTime() - (offset * 60 * 1000));
        const dateThresholdStr = localDate.toISOString().split('T')[0];

        // Get all tasks for this trainer in the date range
        const tasksResult = await executeQuery(
            `SELECT 
                task_type,
                custom_task_name,
                hours,
                date,
                created_at
            FROM tasks 
            WHERE user_id = ? AND date >= ?
            ORDER BY date DESC, created_at DESC`,
            [trainerId, dateThresholdStr]
        );

        const tasks = tasksResult.rows;

        // Calculate daily totals for KPI badges
        const dailyHours = {};
        tasks.forEach(task => {
            if (!dailyHours[task.date]) {
                dailyHours[task.date] = 0;
            }
            dailyHours[task.date] += task.hours;
        });

        // Add daily hours to each task
        const tasksWithDailyHours = tasks.map(task => ({
            ...task,
            daily_hours: dailyHours[task.date] || 0
        }));

        // Calculate statistics
        const totalHours = tasks.reduce((sum, task) => sum + task.hours, 0);
        const totalTasks = tasks.length;

        // Calculate unique days with tasks
        const uniqueDays = new Set(tasks.map(t => t.date)).size;
        const avgHoursPerDay = uniqueDays > 0 ? totalHours / uniqueDays : 0;

        return {
            success: true,
            tasks: tasksWithDailyHours,
            stats: {
                totalHours,
                totalTasks,
                avgHoursPerDay
            }
        };
    } catch (error) {
        console.error('Get trainer tasks error:', error);
        return { success: false, error: 'Failed to fetch trainer tasks' };
    }
}

// Change password
export async function changePassword(userId, newPassword) {
    try {
        const passwordHash = await bcrypt.hash(newPassword, 10);

        await executeQuery(
            'UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?',
            [passwordHash, userId]
        );

        await logAction(userId, 'CHANGE_PASSWORD', 'User changed their own password');

        return { success: true };
    } catch (error) {
        console.error('Change password error:', error);
        return { success: false, error: 'Failed to change password' };
    }
}
// Delete user (trainer)
export async function deleteUser(userId, adminId) {
    try {
        // First delete all tasks for this user
        await executeQuery(
            'DELETE FROM tasks WHERE user_id = ?',
            [userId]
        );

        // Then delete the user
        await executeQuery(
            'DELETE FROM users WHERE id = ?',
            [userId]
        );

        if (adminId) {
            await logAction(adminId, 'DELETE_TRAINER', { userId });
        }

        return { success: true };
    } catch (error) {
        console.error('Delete user error:', error);
        return { success: false, error: 'Failed to delete user' };
    }
}

// Announcements
export async function createAnnouncement(message, isUrgent, recipientIds) {
    try {
        const isGlobal = recipientIds.length === 0 || recipientIds.includes('all');

        const result = await executeQuery(
            'INSERT INTO announcements (message, is_urgent, is_global) VALUES (?, ?, ?) RETURNING id',
            [message, isUrgent ? 1 : 0, isGlobal ? 1 : 0]
        );

        const announcementId = result.rows[0].id; // Turso/SQLite returns id on insert if requested

        if (!isGlobal && recipientIds.length > 0) {
            const statements = recipientIds.map(userId => ({
                sql: 'INSERT INTO announcement_recipients (announcement_id, user_id) VALUES (?, ?)',
                args: [Number(announcementId), Number(userId)]
            }));
            await executeBatch(statements);
        }

        return { success: true };
    } catch (error) {
        console.error('Create announcement error:', error);
        return { success: false, error: 'Failed to create announcement' };
    }
}

export async function getAnnouncements(userId = null) {
    try {
        let query;
        let params = [];

        if (userId) {
            // For trainers: Global announcements OR specific ones
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
            // For admin (all history)
            query = 'SELECT * FROM announcements ORDER BY created_at DESC LIMIT 20';
        }

        const result = await executeQuery(query, params);
        return { success: true, announcements: result.rows };
    } catch (error) {
        console.error('Get announcements error:', error);
        return { success: false, error: 'Failed to fetch announcements' };
    }
}

export async function getExportData(startDate, endDate) {
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

    } catch (error) {
        console.error('Get export data error:', error);
        return { success: false, error: 'Failed to fetch export data' };
    }
}

// Task Types management
export async function getTaskTypes() {
    try {
        const result = await executeQuery('SELECT * FROM task_types ORDER BY name');
        return { success: true, types: result.rows };
    } catch (error) {
        console.error('Get task types error:', error);
        return { success: false, error: 'Failed to fetch task types' };
    }
}

export async function addTaskType(name, userId) {
    try {
        const result = await executeQuery(
            'INSERT INTO task_types (name) VALUES (?)',
            [name]
        );

        if (userId) {
            await logAction(userId, 'ADD_TASK_TYPE', { name });
        }

        return { success: true };
    } catch (error) {
        console.error('Add task type error:', error);
        if (error.message.includes('UNIQUE constraint failed')) {
            return { success: false, error: 'Task type already exists' };
        }
        return { success: false, error: 'Failed to add task type' };
    }
}

export async function updateTaskType(id, name, userId) {
    try {
        await executeQuery(
            'UPDATE task_types SET name = ? WHERE id = ?',
            [name, id]
        );

        if (userId) {
            await logAction(userId, 'UPDATE_TASK_TYPE', { id, name });
        }

        return { success: true };
    } catch (error) {
        console.error('Update task type error:', error);
        if (error.message.includes('UNIQUE constraint failed')) {
            return { success: false, error: 'Task type already exists' };
        }
        return { success: false, error: 'Failed to update task type' };
    }
}

export async function deleteTaskType(id, userId) {
    try {
        await executeQuery(
            'DELETE FROM task_types WHERE id = ?',
            [id]
        );

        if (userId) {
            await logAction(userId, 'DELETE_TASK_TYPE', { id });
        }

        return { success: true };
    } catch (error) {
        console.error('Delete task type error:', error);
        return { success: false, error: 'Failed to delete task type' };
    }
}

// Analytics
export async function getTeamTrends(days = 30) {
    try {
        const today = new Date();
        const dateThreshold = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
        // Clean date string YYYY-MM-DD
        const offset = today.getTimezoneOffset();
        const localDate = new Date(dateThreshold.getTime() - (offset * 60 * 1000));
        const dateThresholdStr = localDate.toISOString().split('T')[0];

        const query = `
            SELECT 
                date,
                SUM(hours) as total_hours,
                COUNT(DISTINCT user_id) as active_trainers
            FROM tasks
            WHERE date >= ?
            GROUP BY date
            ORDER BY date ASC
        `;

        const result = await executeQuery(query, [dateThresholdStr]);
        return { success: true, trends: result.rows };
    } catch (error) {
        console.error('Get team trends error:', error);
        return { success: false, error: 'Failed to fetch team trends' };
    }
}

export async function getTopPerformers(period = 'month') {
    try {
        const today = new Date();
        let dateThreshold;

        if (period === 'week') {
            dateThreshold = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
            // Default to month (30 days)
            dateThreshold = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const offset = today.getTimezoneOffset();
        const localDate = new Date(dateThreshold.getTime() - (offset * 60 * 1000));
        const dateThresholdStr = localDate.toISOString().split('T')[0];

        const query = `
            SELECT 
                u.id, 
                u.name, 
                ROUND(SUM(t.hours), 1) as total_hours,
                COUNT(t.id) as tasks_count
            FROM tasks t
            JOIN users u ON t.user_id = u.id
            WHERE t.date >= ?
            GROUP BY u.id, u.name
            ORDER BY total_hours DESC
            LIMIT 5
        `;

        const result = await executeQuery(query, [dateThresholdStr]);
        return { success: true, performers: result.rows };
    } catch (error) {
        console.error('Get top performers error:', error);
        return { success: false, error: 'Failed to fetch top performers' };
    }
}

// Audit Logging
export async function logAction(userId, action, details) {
    try {
        const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;
        await executeQuery(
            'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
            [userId, action, detailsStr]
        );
    } catch (error) {
        console.error('Log action error:', error);
        // Don't fail the operation if logging fails
    }
}

export async function getAuditLogs(limit = 100) {
    try {
        const query = `
            SELECT 
                a.*,
                u.name as user_name,
                u.js_id
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT ?
        `;
        const result = await executeQuery(query, [limit]);
        return { success: true, logs: result.rows };
    } catch (error) {
        console.error('Get audit logs error:', error);
        return { success: false, error: 'Failed to fetch audit logs' };
    }
}
