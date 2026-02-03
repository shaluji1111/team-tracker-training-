import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { KPIBadge } from '../components/KPIBadge';
import { ChangePassword } from '../components/ChangePassword';
import { useAuth } from '../context/AuthContext';
import { AnnouncementBanner } from '../components/AnnouncementBanner';
import { getUserTasks, addTask, updateTask, deleteTask, getTodayHours, getTaskTypes } from '../lib/api';
import { Plus, Clock, Edit2, Trash2 } from 'lucide-react';
import './TrainerDashboard.css';

const FALLBACK_TASK_TYPES = [
    'Shift Briefing', 'Refresher Session', 'Call Audit', 'Call Taking',
    'Meeting - Other', 'Team Meeting', 'Half Day', 'Leave', 'Holiday', 'Others'
];

export function TrainerDashboard() {
    const { user, loginUser } = useAuth();
    const [todayHours, setTodayHours] = useState(0);
    const [tasks, setTasks] = useState([]);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskTypes, setTaskTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mustChangePassword, setMustChangePassword] = useState(user?.must_change_password === 1);
    const [editingTask, setEditingTask] = useState(null);

    const [formData, setFormData] = useState({
        taskType: '',
        customTaskName: '',
        remarks: '',
        hours: '',
        date: (() => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        })(),
        startTime: '',
    });

    // Calculate end time based on start time and hours
    const calculateEndTime = (startTime, hours) => {
        if (!startTime || !hours) return '';

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const totalMinutes = startHour * 60 + startMinute + Math.floor(hours * 60);
        const endHour = Math.floor(totalMinutes / 60) % 24;
        const endMinute = totalMinutes % 60;

        return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
    };

    const endTime = calculateEndTime(formData.startTime, formData.hours);

    const leaveTask = tasks.find(t => t.task_type === 'Leave' || t.task_type === 'Holiday');
    const halfDayTask = tasks.find(t => t.task_type === 'Half Day');

    // Calculate status client-side
    let statusOverride = null;
    if (leaveTask) {
        statusOverride = leaveTask.task_type === 'Leave' ? 'On Leave' : 'Holiday';
    } else {
        const minHours = halfDayTask ? 3.5 : 7;
        const maxHours = halfDayTask ? 4.5 : 7.5;

        if (todayHours < minHours) statusOverride = 'underperforming';
        else if (todayHours <= maxHours) statusOverride = 'normal';
        else statusOverride = 'overperforming';
    }

    const loadData = async () => {
        // Get today's date in local timezone (not UTC)
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const [tasksResult, hoursResult, typesResult] = await Promise.all([
            getUserTasks(user.id, todayStr),
            getTodayHours(user.id, todayStr),
            getTaskTypes()
        ]);

        if (typesResult.success && typesResult.types.length > 0) {
            setTaskTypes(typesResult.types.map(t => t.name));
        } else if (taskTypes.length === 0) {
            setTaskTypes(FALLBACK_TASK_TYPES);
        }

        if (tasksResult.success) {
            setTasks(tasksResult.tasks);
        }
        if (hoursResult.success) {
            setTodayHours(hoursResult.hours);
        }
        setLoading(false);
    };

    const handlePasswordChanged = () => {
        // Update user object to reflect password change
        const updatedUser = { ...user, must_change_password: 0 };
        loginUser(updatedUser);
        setMustChangePassword(false);
    };

    useEffect(() => {
        loadData();
        // Poll for updates every 5 seconds
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, [user.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = editingTask
            ? await updateTask(
                editingTask.id,
                user.id,
                formData.taskType,
                formData.taskType === 'Others' ? formData.customTaskName : null,
                parseFloat(formData.hours),
                formData.date,
                formData.startTime || null,
                endTime || null,
                formData.remarks || null
            )
            : await addTask(
                user.id,
                formData.taskType,
                formData.taskType === 'Others' ? formData.customTaskName : null,
                parseFloat(formData.hours),
                formData.date,
                formData.startTime || null,
                endTime || null,
                formData.remarks || null
            );

        if (result.success) {
            // Reset form
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');

            setFormData({
                taskType: '',
                customTaskName: '',
                remarks: '',
                hours: '',
                date: `${year}-${month}-${day}`,
                startTime: '',
            });
            setShowTaskForm(false);
            setEditingTask(null);
            // Reload data immediately
            loadData();
        }

        setLoading(false);
    };

    const handleEdit = (task) => {
        setEditingTask(task);
        setFormData({
            taskType: task.task_type,
            customTaskName: task.custom_task_name || '',
            remarks: task.remarks || '',
            hours: task.hours.toString(),
            date: task.date,
            startTime: task.start_time || '',
        });
        setShowTaskForm(true);
    };

    const handleDelete = async (taskId) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        const result = await deleteTask(taskId, user.id);
        if (result.success) {
            loadData();
        } else {
            alert(result.error || 'Failed to delete task');
        }
    };

    const handleCancelEdit = () => {
        setEditingTask(null);
        setShowTaskForm(false);

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        setFormData({
            taskType: '',
            customTaskName: '',
            remarks: '',
            hours: '',
            date: `${year}-${month}-${day}`,
            startTime: '',
        });
    };

    return (
        <div className="dashboard-layout">
            {mustChangePassword && <ChangePassword onPasswordChanged={handlePasswordChanged} />}

            <Sidebar />

            <main className="main-content">
                <div className="page-header">
                    <h1 className="page-title">My Dashboard</h1>
                </div>



                <AnnouncementBanner />

                <div className="dashboard-grid">
                    {/* Status Card */}
                    <div className="status-card card">
                        <div className="status-header">
                            <div className="status-label">STATUS</div>
                            <KPIBadge hours={todayHours} status={statusOverride} />
                        </div>
                        <div className="status-hours">
                            <span className="hours-number">{todayHours.toFixed(1)}</span>
                            <span className="hours-unit">hrs</span>
                        </div>
                        <div className="status-footer">Total contribution today</div>
                    </div>

                    {/* Quick Add Task Button */}
                    <div className="quick-actions card">
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowTaskForm(!showTaskForm)}
                            disabled={!!leaveTask}
                            title={leaveTask ? "Delete Leave/Holiday task to add new tasks" : "Log New Task"}
                            style={leaveTask ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                            <Plus size={20} />
                            Log New Task
                        </button>
                        {leaveTask && (
                            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                You are marked as {leaveTask.task_type}. Delete this task to log other work.
                            </p>
                        )}
                        {halfDayTask && !leaveTask && (
                            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                You are on Half Day. Target hours adjusted (3.5 - 4.5 hrs).
                            </p>
                        )}
                    </div>
                </div>

                {/* Task Form */}
                {showTaskForm && (
                    <div className="card task-form-card fade-in">
                        <h3 className="card-title">{editingTask ? 'Edit Task' : 'Log Task'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Task Type</label>
                                    <select
                                        className="form-select"
                                        value={formData.taskType}
                                        onChange={(e) => {
                                            const type = e.target.value;
                                            const isLeaveOrHoliday = type === 'Leave' || type === 'Holiday' || type === 'Half Day';
                                            setFormData({
                                                ...formData,
                                                taskType: type,
                                                hours: isLeaveOrHoliday ? '0' : formData.hours
                                            });
                                        }}
                                        required
                                    >
                                        <option value="">Select a task type</option>
                                        {taskTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {formData.taskType === 'Others' && (
                                    <div className="form-group">
                                        <label className="form-label">Custom Task Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.customTaskName}
                                            onChange={(e) =>
                                                setFormData({ ...formData, customTaskName: e.target.value })
                                            }
                                            placeholder="Enter task name"
                                            required
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Remarks (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.remarks}
                                        onChange={(e) =>
                                            setFormData({ ...formData, remarks: e.target.value })
                                        }
                                        placeholder="Add remarks"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Hours</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="24"
                                        className="form-input"
                                        value={formData.hours}
                                        onChange={(e) =>
                                            setFormData({ ...formData, hours: e.target.value })
                                        }
                                        placeholder="e.g., 2.5"
                                        required={!['Leave', 'Holiday', 'Half Day'].includes(formData.taskType)}
                                        disabled={['Leave', 'Holiday', 'Half Day'].includes(formData.taskType)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Start Time (Optional)</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={formData.startTime}
                                        onChange={(e) =>
                                            setFormData({ ...formData, startTime: e.target.value })
                                        }
                                    />
                                </div>

                                {formData.startTime && formData.hours && (
                                    <div className="form-group">
                                        <label className="form-label">End Time (Calculated)</label>
                                        <input
                                            type="time"
                                            className="form-input"
                                            value={endTime}
                                            disabled
                                            style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.date}
                                        onChange={(e) =>
                                            setFormData({ ...formData, date: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                {editingTask && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCancelEdit}
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                                {!editingTask && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowTaskForm(false)}
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Saving...' : editingTask ? 'Update Task' : 'Save Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Activity Log */}
                <div className="card activity-card">
                    <h3 className="card-title">Today's Activity Log</h3>
                    {tasks.length === 0 ? (
                        <div className="empty-state">
                            <Clock size={48} />
                            <p>No tasks logged today</p>
                        </div>
                    ) : (
                        <div className="activity-list">
                            {tasks.map((task, index) => (
                                <div key={task.id} className="activity-item">
                                    <div className="activity-number">{index + 1}</div>
                                    <div className="activity-details">
                                        <div className="activity-name">
                                            {task.task_type === 'Others' ? task.custom_task_name : task.task_type}
                                            {task.remarks && <span className="text-muted" style={{ fontWeight: 'normal', marginLeft: '8px' }}>- {task.remarks}</span>}
                                        </div>
                                        <div className="activity-time">
                                            {task.start_time && task.end_time
                                                ? `${task.start_time} - ${task.end_time}`
                                                : new Date(task.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                    <div className="activity-badge-yellow">
                                        {task.hours}h
                                    </div>
                                    <div className="activity-actions">
                                        <button
                                            className="btn-icon btn-edit"
                                            onClick={() => handleEdit(task)}
                                            title="Edit task"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="btn-icon btn-delete"
                                            onClick={() => handleDelete(task.id)}
                                            title="Delete task"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
