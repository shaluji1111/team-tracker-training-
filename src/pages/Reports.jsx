import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { KPIBadge } from '../components/KPIBadge';
import { getTrainerTasks } from '../lib/api';
import { exportToCSV } from '../lib/csvExport.js';
import { FileText, Calendar, Clock, Download, MessageSquare, X, Send } from 'lucide-react';
import './Reports.css';

export function Reports() {
    const [trainers, setTrainers] = useState([]);
    const [selectedTrainer, setSelectedTrainer] = useState('');
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState({ totalHours: 0, totalTasks: 0, avgHoursPerDay: 0 });
    const [dateRange, setDateRange] = useState('week'); // week, month, all, custom
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [exportingAll, setExportingAll] = useState(false);

    // Query Modal State
    const [queryModalOpen, setQueryModalOpen] = useState(false);
    const [selectedTaskForQuery, setSelectedTaskForQuery] = useState(null);
    const [queryText, setQueryText] = useState('');
    const [submittingQuery, setSubmittingQuery] = useState(false);

    // Load all trainers on mount
    useEffect(() => {
        loadTrainers();
    }, []);

    const loadTrainers = async () => {
        const { getTeamPerformance } = await import('../lib/api');
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const localDate = new Date(today.getTime() - (offset * 60 * 1000));
        const todayStr = localDate.toISOString().split('T')[0];
        const result = await getTeamPerformance(todayStr);
        if (result.success) {
            setTrainers(result.trainers);
            if (result.trainers.length > 0) {
                setSelectedTrainer(result.trainers[0].id.toString());
            }
        }
    };

    useEffect(() => {
        if (selectedTrainer) {
            // Only load if not custom, or if custom and both dates are present
            if (dateRange !== 'custom' || (customStartDate && customEndDate)) {
                loadTrainerData();
            }
        }
    }, [selectedTrainer, dateRange, customStartDate, customEndDate]);

    const loadTrainerData = async () => {
        setLoading(true);
        const { getTrainerTasks } = await import('../lib/api');
        const result = await getTrainerTasks(parseInt(selectedTrainer), dateRange, customStartDate, customEndDate);
        if (result.success) {
            setTasks(result.tasks);
            setStats(result.stats);
        }
        setLoading(false);
    };

    const selectedTrainerData = trainers.find(t => t.id.toString() === selectedTrainer);

    const handleExportReport = () => {
        if (!tasks.length || !selectedTrainerData) return;

        const dataToExport = tasks.map(t => ({
            'Date': new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            'Trainer': selectedTrainerData.name,
            'Task Type': t.task_type,
            'Remarks': t.remarks || '',
            'Hours': t.hours.toFixed(1),
            'Status': t.daily_hours < 7 ? 'Underperforming' : t.daily_hours <= 7.5 ? 'Normal' : 'Overperforming',
            'Query Status': t.query_status || 'None',
            'Admin Query': t.admin_query || ''
        }));

        exportToCSV(dataToExport, `report_${selectedTrainerData.name.replace(/\s+/g, '_')}_${dateRange}.csv`);
    };

    const handleExportAll = async () => {
        setExportingAll(true);
        try {
            const { getExportData } = await import('../lib/api');
            let start, end;
            const today = new Date();
            const offset = today.getTimezoneOffset();
            const localToday = new Date(today.getTime() - (offset * 60 * 1000));
            const todayStr = localToday.toISOString().split('T')[0];

            if (dateRange === 'custom') {
                start = customStartDate;
                end = customEndDate;
            } else if (dateRange === 'today') {
                start = todayStr;
                end = todayStr;
            } else {
                let days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 3650;
                const startDateObj = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));
                const localStart = new Date(startDateObj.getTime() - (offset * 60 * 1000));
                start = localStart.toISOString().split('T')[0];
                end = todayStr;
            }

            const result = await getExportData(start, end);
            if (result.success && result.data.length > 0) {
                const dataToExport = result.data.map(t => ({
                    'Date': new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
                    'Trainer': t.trainer_name,
                    'JS ID': t.js_id,
                    'Task Type': t.task_type,
                    'Remarks': t.remarks || '',
                    'Hours': t.hours.toFixed(1),
                    'Status': t.daily_hours < 7 ? 'Underperforming' : t.daily_hours <= 7.5 ? 'Normal' : 'Overperforming',
                    'Query Status': t.query_status || 'None',
                    'Admin Query': t.admin_query || ''
                }));
                exportToCSV(dataToExport, `all_trainers_report_${dateRange}.csv`);
            } else {
                alert('No data found for the selected period');
            }
        } catch (error) {
            console.error(error);
            alert('Error exporting data');
        } finally {
            setExportingAll(false);
        }
    };

    const openQueryModal = (task) => {
        setSelectedTaskForQuery(task);
        setQueryText(task.admin_query || '');
        setQueryModalOpen(true);
    };

    const handleSubmitQuery = async (e) => {
        e.preventDefault();
        setSubmittingQuery(true);

        try {
            const { raiseQuery } = await import('../lib/api');
            // Mock admin ID for now, in real app usage auth context
            const adminId = 1;
            const result = await raiseQuery(selectedTaskForQuery.id, queryText, adminId);

            if (result.success) {
                setQueryModalOpen(false);
                setQueryText('');
                loadTrainerData(); // Refresh data
            } else {
                alert('Failed to submit query');
            }
        } catch (error) {
            console.error(error);
            alert('Error submitting query');
        } finally {
            setSubmittingQuery(false);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="main-content">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="page-title">Individual Reports</h1>
                        <p className="page-subtitle">View detailed trainer performance</p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleExportAll}
                        disabled={exportingAll || (dateRange === 'custom' && (!customStartDate || !customEndDate))}
                    >
                        <Download size={18} />
                        {exportingAll ? 'Exporting...' : 'Export All Trainers'}
                    </button>
                </div>

                {/* Filters */}
                <div className="card filter-section">
                    <div className="filters-grid">
                        <div className="filter-group">
                            <label className="filter-label">Select Trainer</label>
                            <select
                                className="filter-select"
                                value={selectedTrainer}
                                onChange={(e) => setSelectedTrainer(e.target.value)}
                            >
                                {trainers.map((trainer) => (
                                    <option key={trainer.id} value={trainer.id}>
                                        {trainer.name} ({trainer.js_id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label className="filter-label">Time Period</label>
                            <select
                                className="filter-select"
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                            >
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                                <option value="all">All Time</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        {dateRange === 'custom' && (
                            <div className="filter-group" style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="filter-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        max={customEndDate || undefined}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className="filter-label">End Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        min={customStartDate || undefined}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {selectedTrainerData && (
                    <>
                        {/* Stats Cards */}
                        <div className="metrics-grid">
                            <div className="metric-card card">
                                <div className="metric-icon" style={{ background: 'rgba(163, 230, 53, 0.2)' }}>
                                    <Clock size={24} style={{ color: 'var(--accent-green)' }} />
                                </div>
                                <div className="metric-content">
                                    <div className="metric-value">{stats.totalHours.toFixed(1)}</div>
                                    <div className="metric-label">Total Hours</div>
                                </div>
                            </div>

                            <div className="metric-card card">
                                <div className="metric-icon" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                                    <FileText size={24} style={{ color: '#3b82f6' }} />
                                </div>
                                <div className="metric-content">
                                    <div className="metric-value">{stats.totalTasks}</div>
                                    <div className="metric-label">Total Tasks</div>
                                </div>
                            </div>

                            <div className="metric-card card">
                                <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                                    <Calendar size={24} style={{ color: 'var(--status-green)' }} />
                                </div>
                                <div className="metric-content">
                                    <div className="metric-value">{stats.avgHoursPerDay.toFixed(1)}</div>
                                    <div className="metric-label">Avg Hours/Day</div>
                                </div>
                            </div>
                        </div>

                        {/* Task History Table */}
                        <div className="card">
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 className="card-title" style={{ margin: 0 }}>Task History</h2>
                                <button className="btn btn-secondary btn-sm" onClick={handleExportReport} disabled={loading || tasks.length === 0}>
                                    <Download size={16} />
                                    Export CSV
                                </button>
                            </div>
                            {loading ? (
                                <div className="loading-state">Loading...</div>
                            ) : tasks.length > 0 ? (
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Task Type</th>
                                                <th>Remarks</th>
                                                <th>Hours</th>
                                                <th>Day Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.map((task, index) => (
                                                <tr key={index}>
                                                    <td>{new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                    <td>
                                                        {task.task_type}
                                                    </td>
                                                    <td>
                                                        {task.remarks ? (
                                                            <span className="text-muted" style={{ fontSize: '0.9em' }}>{task.remarks}</span>
                                                        ) : (
                                                            <span className="text-muted" style={{ fontSize: '0.9em', fontStyle: 'italic' }}>-</span>
                                                        )}
                                                    </td>
                                                    <td>{task.hours.toFixed(1)} hrs</td>
                                                    <td>
                                                        <KPIBadge hours={task.daily_hours} />
                                                    </td>
                                                    <td>
                                                        <button
                                                            className={`btn btn-xs ${task.admin_query ? 'btn-warning' : 'btn-secondary'}`}
                                                            onClick={() => openQueryModal(task)}
                                                            title={task.admin_query ? "View/Edit Query" : "Raise Query"}
                                                            style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                        >
                                                            <MessageSquare size={14} />
                                                            {task.admin_query ? 'View Query' : 'Query'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <FileText size={48} style={{ color: 'var(--text-muted)' }} />
                                    <p>No tasks found for this period</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* Query Modal */}
            {queryModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {selectedTaskForQuery?.admin_query ? 'Edit Query' : 'Raise Query'}
                            </h2>
                            <button className="close-button" onClick={() => setQueryModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitQuery}>
                            <div className="modal-body">
                                <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    Task: <strong>{selectedTaskForQuery?.task_type}</strong> on {new Date(selectedTaskForQuery?.date).toLocaleDateString()}
                                </p>
                                <div className="form-group">
                                    <label className="form-label">Query Message</label>
                                    <textarea
                                        className="form-input"
                                        rows="4"
                                        placeholder="Enter your question for the trainer..."
                                        value={queryText}
                                        onChange={(e) => setQueryText(e.target.value)}
                                        required
                                        autoFocus
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setQueryModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submittingQuery}>
                                    {submittingQuery ? 'Sending...' : (
                                        <>
                                            <Send size={16} />
                                            Send Query
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
