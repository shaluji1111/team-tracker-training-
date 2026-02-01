import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { KPIBadge } from '../components/KPIBadge';
import { useAuth } from '../context/AuthContext';
import { getUserTasks, deleteTask } from '../lib/api';
import { GanttChart } from '../components/GanttChart';
import { Edit2, Trash2, Calendar, Clock, LayoutList, Trello } from 'lucide-react';
import './TaskHistory.css';
import './TaskHistory-override.css';

export function TaskHistory() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
    const [viewMode, setViewMode] = useState('list'); // list, timeline

    const loadTasks = async () => {
        setLoading(true);

        // Always fetch all tasks
        const result = await getUserTasks(user.id, null);

        if (result.success) {
            let filteredTasks = result.tasks;

            // Filter based on date range
            if (dateFilter !== 'all') {
                const today = new Date();

                // Get local date string (YYYY-MM-DD) instead of UTC
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const todayStr = `${year}-${month}-${day}`;

                if (dateFilter === 'today') {
                    // Only show tasks from today
                    filteredTasks = result.tasks.filter(task => task.date === todayStr);
                } else if (dateFilter === 'week') {
                    // Last 7 days
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    const weekYear = weekAgo.getFullYear();
                    const weekMonth = String(weekAgo.getMonth() + 1).padStart(2, '0');
                    const weekDay = String(weekAgo.getDate()).padStart(2, '0');
                    const weekAgoStr = `${weekYear}-${weekMonth}-${weekDay}`;

                    filteredTasks = result.tasks.filter(task => task.date >= weekAgoStr);
                } else if (dateFilter === 'month') {
                    // Current calendar month (e.g., all of February 2026)
                    const monthStr = `${year}-${month}`;
                    filteredTasks = result.tasks.filter(task => task.date.startsWith(monthStr));
                }
            }

            // Group tasks by date
            const grouped = {};
            filteredTasks.forEach(task => {
                if (!grouped[task.date]) {
                    grouped[task.date] = {
                        date: task.date,
                        tasks: [],
                        totalHours: 0
                    };
                }
                grouped[task.date].tasks.push(task);
                grouped[task.date].totalHours += task.hours;
            });

            // Convert to array and sort by date descending
            const groupedArray = Object.values(grouped).sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            );

            setTasks(groupedArray);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadTasks();
    }, [dateFilter]);

    const handleDelete = async (taskId) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        const result = await deleteTask(taskId, user.id);
        if (result.success) {
            loadTasks();
        } else {
            alert(result.error || 'Failed to delete task');
        }
    };

    const getDailyKPI = (hours) => {
        if (hours < 7) return 'Underperforming';
        if (hours >= 7 && hours <= 7.5) return 'Normal';
        return 'Overperforming';
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="main-content">
                <div className="page-header">
                    <h1 className="page-title">Task History</h1>
                    <p className="page-subtitle">View and manage all your logged tasks</p>
                </div>

                {/* View/Date Filter */}
                <div className="card filter-section">
                    <div className="flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div className="filter-tabs">
                            <button
                                className={`filter-tab ${dateFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setDateFilter('all')}
                            >
                                All Time
                            </button>
                            <button
                                className={`filter-tab ${dateFilter === 'today' ? 'active' : ''}`}
                                onClick={() => setDateFilter('today')}
                            >
                                Today
                            </button>
                            <button
                                className={`filter-tab ${dateFilter === 'week' ? 'active' : ''}`}
                                onClick={() => setDateFilter('week')}
                            >
                                This Week
                            </button>
                            <button
                                className={`filter-tab ${dateFilter === 'month' ? 'active' : ''}`}
                                onClick={() => setDateFilter('month')}
                            >
                                This Month
                            </button>
                        </div>

                        <div className="view-toggle" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
                            <button
                                style={{
                                    background: viewMode === 'list' ? 'var(--primary-color)' : 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                                onClick={() => setViewMode('list')}
                            >
                                <LayoutList size={16} /> List
                            </button>
                            <button
                                style={{
                                    background: viewMode === 'timeline' ? 'var(--primary-color)' : 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                                onClick={() => setViewMode('timeline')}
                            >
                                <Trello size={16} /> Timeline
                            </button>
                        </div>
                    </div>
                </div>

                {/* Task List */}
                {loading ? (
                    <div className="loading-state">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <Clock size={48} style={{ color: 'var(--text-muted)' }} />
                            <p>No tasks found for this period</p>
                        </div>
                    </div>
                ) : (
                    <div className="tasks-timeline">
                        {tasks.map((dayData) => (
                            <div key={dayData.date} className="day-group">
                                <div className="day-header">
                                    <div className="day-info">
                                        <Calendar size={20} />
                                        <h3 className="day-date">
                                            {new Date(dayData.date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </h3>
                                    </div>
                                    <div className="day-summary">
                                        <span className="day-hours">{dayData.totalHours.toFixed(1)} hrs</span>
                                        <KPIBadge hours={dayData.totalHours} />
                                    </div>
                                </div>

                                {viewMode === 'timeline' ? (
                                    <GanttChart tasks={dayData.tasks} date={dayData.date} />
                                ) : (
                                    <div className="tasks-list">
                                        {dayData.tasks.map((task) => (
                                            <div key={task.id} className="task-card card">
                                                <div className="task-content">
                                                    <div className="task-header">
                                                        <div className="task-type">
                                                            {task.task_type === 'Others' ? task.custom_task_name : task.task_type}
                                                        </div>
                                                    </div>
                                                    <div className="task-meta">
                                                        {task.start_time && task.end_time ? (
                                                            <span className="task-time">
                                                                <Clock size={14} />
                                                                {task.start_time} - {task.end_time}
                                                            </span>
                                                        ) : (
                                                            <span className="task-time">
                                                                <Clock size={14} />
                                                                Logged at {new Date(task.created_at).toLocaleTimeString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="task-actions">
                                                    <div className="task-hours">{task.hours}h</div>
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
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
