import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { KPIBadge } from '../components/KPIBadge';
import { useAuth } from '../context/AuthContext';
import { getTeamPerformance, getExportData, getTeamTrends, getTopPerformers } from '../lib/api';
import { exportData } from '../lib/exportUtils.js';
import { TrendsChart } from '../components/TrendsChart';
import { Leaderboard } from '../components/Leaderboard';
import { Users, TrendingUp, Clock, Download, X, Calendar, FileSpreadsheet, FileText, RefreshCw, BarChart2, Award } from 'lucide-react';
import './AdminDashboard.css';

export function AdminDashboard() {
    const { user } = useAuth();
    const [performance, setPerformance] = useState({
        underperforming: 0,
        normal: 0,
        overperforming: 0,
        onLeave: 0,
        holiday: 0,
    });
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teamTrends, setTeamTrends] = useState([]);
    const [topPerformers, setTopPerformers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const localDate = new Date(today.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    });

    // Export Modal State
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportConfig, setExportConfig] = useState({
        startDate: '',
        endDate: '',
        format: 'xlsx'
    });

    useEffect(() => {
        // Initialize export dates
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const localDate = new Date(today.getTime() - (offset * 60 * 1000));
        const todayStr = localDate.toISOString().split('T')[0];

        // Default start date to 1st of current month
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const localFirstDay = new Date(firstDay.getTime() - (offset * 60 * 1000));
        const firstDayStr = localFirstDay.toISOString().split('T')[0];

        setExportConfig(prev => ({ ...prev, startDate: firstDayStr, endDate: todayStr }));
    }, []);

    const loadData = async (date, isBackground = false) => {
        if (!isBackground) setLoading(true);

        const [perfResult, trendsResult, topPerfResult] = await Promise.all([
            getTeamPerformance(date),
            getTeamTrends(30),
            getTopPerformers('month')
        ]);

        if (perfResult.success) {
            setPerformance(perfResult.performance);
            setTrainers(perfResult.trainers);
        }

        if (trendsResult.success) {
            setTeamTrends(trendsResult.trends);
        }

        if (topPerfResult.success) {
            setTopPerformers(topPerfResult.performers);
        }

        setLoading(false);
    };

    useEffect(() => {
        loadData(selectedDate);
    }, [selectedDate]);

    const totalTrainers = trainers.length;
    const avgHours = trainers.length > 0
        ? (trainers.reduce((sum, t) => sum + t.hours, 0) / trainers.length).toFixed(1)
        : 0;

    const handleExportSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Using main loading state for simplicity

        const result = await getExportData(exportConfig.startDate, exportConfig.endDate);

        if (result.success) {
            exportData(result.data, `team_performance_${exportConfig.startDate}_to_${exportConfig.endDate}`, exportConfig.format);
            setExportModalOpen(false);
        } else {
            alert('Failed to export data');
        }
        setLoading(false);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="main-content">
                <div className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="page-title">Team Overview</h1>
                        <p className="page-subtitle">Performance metrics for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => loadData(selectedDate)}
                            title="Refresh Data"
                        >
                            <RefreshCw size={16} />
                        </button>

                        <div className="date-picker-container">
                            <label className="form-label" style={{ marginBottom: '0.25rem', fontSize: '0.75rem' }}>Select Date</label>
                            <div style={{ position: 'relative' }}>
                                <Clock size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="date"
                                    className="form-input"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    style={{ paddingLeft: '32px', width: 'auto' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Loading...</div>
                ) : (
                    <>
                        {/* Metrics Cards */}
                        <div className="metrics-grid">
                            <div className="metric-card card">
                                <div className="metric-icon" style={{ background: 'rgba(163, 230, 53, 0.2)' }}>
                                    <Users size={24} style={{ color: 'var(--accent-green)' }} />
                                </div>
                                <div className="metric-content">
                                    <div className="metric-value">{totalTrainers}</div>
                                    <div className="metric-label">Total Trainers</div>
                                </div>
                            </div>

                            <div className="metric-card card">
                                <div className="metric-icon" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                                    <Clock size={24} style={{ color: '#3b82f6' }} />
                                </div>
                                <div className="metric-content">
                                    <div className="metric-value">{avgHours}</div>
                                    <div className="metric-label">Average Hours</div>
                                </div>
                            </div>

                            <div className="metric-card card">
                                <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                                    <TrendingUp size={24} style={{ color: 'var(--status-green)' }} />
                                </div>
                                <div className="metric-content">
                                    <div className="metric-value">{performance.overperforming}</div>
                                    <div className="metric-label">Overperforming</div>
                                </div>
                            </div>
                        </div>

                        {/* Analytics Section */}
                        <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                            <div className="card">
                                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <BarChart2 size={20} className="text-primary" />
                                    Team Activity Trends (30 Days)
                                </h3>
                                <TrendsChart data={teamTrends} />
                            </div>
                            <div className="card">
                                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Award size={20} className="text-primary" />
                                    Top Performers (Month)
                                </h3>
                                <Leaderboard performers={topPerformers} />
                            </div>
                        </div>

                        {/* Performance Distribution */}
                        <div className="performance-section">
                            <div className="card">
                                <h2 className="card-title">Performance Distribution</h2>
                                <div className="performance-chart">
                                    <div className="chart-container">
                                        {/* Donut Chart */}
                                        <div
                                            className="donut-chart"
                                            style={{
                                                background: `conic-gradient(
                                                    from 0deg,
                                                    var(--status-red) 0deg ${(performance.underperforming / totalTrainers) * 360}deg,
                                                    var(--status-amber) ${(performance.underperforming / totalTrainers) * 360}deg ${((performance.underperforming + performance.normal) / totalTrainers) * 360}deg,
                                                    var(--status-green) ${((performance.underperforming + performance.normal) / totalTrainers) * 360}deg ${((performance.underperforming + performance.normal + performance.overperforming) / totalTrainers) * 360}deg,
                                                    #3b82f6 ${((performance.underperforming + performance.normal + performance.overperforming) / totalTrainers) * 360}deg ${((performance.underperforming + performance.normal + performance.overperforming + performance.onLeave) / totalTrainers) * 360}deg,
                                                    #a855f7 ${((performance.underperforming + performance.normal + performance.overperforming + performance.onLeave) / totalTrainers) * 360}deg 360deg
                                                )`
                                            }}
                                        >
                                            <div className="donut-hole">
                                                <div className="donut-center-value">{totalTrainers}</div>
                                                <div className="donut-center-label">Trainers</div>
                                            </div>
                                        </div>

                                        {/* Legend */}
                                        <div className="chart-legend">
                                            <div className="legend-item">
                                                <div className="legend-color" style={{ background: 'var(--status-red)' }}></div>
                                                <div className="legend-details">
                                                    <span className="legend-label">Underperforming</span>
                                                    <span className="legend-value">{performance.underperforming}</span>
                                                </div>
                                            </div>
                                            <div className="legend-item">
                                                <div className="legend-color" style={{ background: 'var(--status-amber)' }}></div>
                                                <div className="legend-details">
                                                    <span className="legend-label">Normal</span>
                                                    <span className="legend-value">{performance.normal}</span>
                                                </div>
                                            </div>
                                            <div className="legend-item">
                                                <div className="legend-color" style={{ background: 'var(--status-green)' }}></div>
                                                <div className="legend-details">
                                                    <span className="legend-label">Overperforming</span>
                                                    <span className="legend-value">{performance.overperforming}</span>
                                                </div>
                                            </div>
                                            <div className="legend-item">
                                                <div className="legend-color" style={{ background: '#3b82f6' }}></div>
                                                <div className="legend-details">
                                                    <span className="legend-label">On Leave</span>
                                                    <span className="legend-value">{performance.onLeave}</span>
                                                </div>
                                            </div>
                                            <div className="legend-item">
                                                <div className="legend-color" style={{ background: '#a855f7' }}></div>
                                                <div className="legend-details">
                                                    <span className="legend-label">Holiday</span>
                                                    <span className="legend-value">{performance.holiday}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Trainers Table */}
                        <div className="card">
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 className="card-title" style={{ margin: 0 }}>Team Status</h2>
                                <button className="btn btn-secondary btn-sm" onClick={() => setExportModalOpen(true)}>
                                    <Download size={16} />
                                    Export Data
                                </button>
                            </div>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>JS ID</th>
                                            <th>Today's Hours</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trainers.map((trainer) => (
                                            <tr key={trainer.id}>
                                                <td>
                                                    {trainer.name}
                                                    {trainer.isHalfDay && (
                                                        <span className="badge badge-blue" style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.1rem 0.5rem' }}>
                                                            Half Day
                                                        </span>
                                                    )}
                                                </td>
                                                <td>{trainer.js_id}</td>
                                                <td>{trainer.hours.toFixed(1)} hrs</td>
                                                <td>
                                                    <KPIBadge hours={trainer.hours} status={trainer.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Export Modal */}
            {exportModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Export Data</h2>
                            <button className="close-button" onClick={() => setExportModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleExportSubmit}>
                            <div className="form-group">
                                <label className="form-label">Date Range</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Start Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={exportConfig.startDate}
                                            onChange={(e) => setExportConfig({ ...exportConfig, startDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label" style={{ fontSize: '0.75rem' }}>End Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={exportConfig.endDate}
                                            onChange={(e) => setExportConfig({ ...exportConfig, endDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Format</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <label className={`recipient-chip ${exportConfig.format === 'xlsx' ? 'selected' : ''}`} style={{ flex: 1, justifyContent: 'center' }}>
                                        <input
                                            type="radio"
                                            name="format"
                                            value="xlsx"
                                            checked={exportConfig.format === 'xlsx'}
                                            onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value })}
                                            style={{ display: 'none' }}
                                        />
                                        <FileSpreadsheet size={16} />
                                        Excel (.xlsx)
                                    </label>
                                    <label className={`recipient-chip ${exportConfig.format === 'csv' ? 'selected' : ''}`} style={{ flex: 1, justifyContent: 'center' }}>
                                        <input
                                            type="radio"
                                            name="format"
                                            value="csv"
                                            checked={exportConfig.format === 'csv'}
                                            onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value })}
                                            style={{ display: 'none' }}
                                        />
                                        <FileText size={16} />
                                        CSV (.csv)
                                    </label>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setExportModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    <Download size={16} />
                                    Export
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
