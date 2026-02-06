import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { KPIBadge } from '../components/KPIBadge';
import { getTrainerTasks } from '../lib/api';
import { exportToCSV } from '../lib/csvExport.js';
import { FileText, Calendar, Clock, Download } from 'lucide-react';
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

    // Load all trainers on mount
    useEffect(() => {
        loadTrainers();
    }, []);

    const loadTrainers = async () => {
        // We'll call the API to get all trainers
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
            'Status': t.daily_hours < 7 ? 'Underperforming' : t.daily_hours <= 7.5 ? 'Normal' : 'Overperforming'
        }));

        exportToCSV(dataToExport, `report_${selectedTrainerData.name.replace(/\s+/g, '_')}_${dateRange}.csv`);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="main-content">
                <div className="page-header">
                    <h1 className="page-title">Individual Reports</h1>
                    <p className="page-subtitle">View detailed trainer performance</p>
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
        </div>
    );
}
