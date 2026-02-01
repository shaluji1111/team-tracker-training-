import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { getAuditLogs as fetchLogs } from '../lib/api';
import { RefreshCw, Filter, Search, User, MousePointer, Clock, Terminal } from 'lucide-react';
import './AdminDashboard.css';

export function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('all');

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        const result = await fetchLogs(100); // Fetch last 100 logs
        if (result.success) {
            setLogs(result.logs);
        }
        setLoading(false);
    };

    const handleRefresh = () => {
        loadLogs();
    };

    // Filter logs
    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            (log.user_name && log.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (log.action && log.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesAction = filterAction === 'all' || log.action === filterAction;

        return matchesSearch && matchesAction;
    });

    const getActionIcon = (action) => {
        if (action.includes('DELETE')) return <span className="text-red-400">DELETE</span>;
        if (action.includes('ADD') || action.includes('CREATE')) return <span className="text-green-400">ADD</span>;
        if (action.includes('UPDATE') || action.includes('CHANGE')) return <span className="text-blue-400">UPDATE</span>;
        return <span className="text-gray-400">{action}</span>;
    };

    const uniqueActions = [...new Set(logs.map(log => log.action))];

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Audit Logs</h1>
                        <p className="page-subtitle">Track system activity and user actions</p>
                    </div>
                    <button className="btn btn-secondary" onClick={handleRefresh} title="Refresh Logs">
                        <RefreshCw size={18} />
                    </button>
                </div>

                <div className="card mb-6">
                    <div className="flex flex-wrap gap-4 items-center justify-between" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="search-box" style={{ flex: 1, minWidth: '300px', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <Search size={18} className="text-muted" style={{ marginRight: '0.5rem' }} />
                            <input
                                type="text"
                                placeholder="Search by user, action, or details..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                            />
                        </div>

                        <div className="filter-box" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Filter size={18} className="text-muted" />
                            <select
                                className="form-select"
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                                style={{ padding: '0.5rem', background: '#1a1a2e', color: 'white', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                            >
                                <option value="all">All Actions</option>
                                {uniqueActions.map(action => (
                                    <option key={action} value={action}>{action}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">Loading audit logs...</div>
                ) : (
                    <div className="card" style={{ overflowX: 'auto' }}>
                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem' }}>Time</th>
                                    <th style={{ padding: '1rem' }}>User</th>
                                    <th style={{ padding: '1rem' }}>Action</th>
                                    <th style={{ padding: '1rem' }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map(log => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ padding: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
                                                        <User size={14} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '500' }}>{log.user_name || 'Unknown User'}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.js_id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                                {getActionIcon(log.action)}
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {log.details}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            No logs found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
