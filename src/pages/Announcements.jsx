import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { getAllTrainers, createAnnouncement, getAnnouncements } from '../lib/api';
import { Megaphone, Send, AlertTriangle, Clock, Search, Check, Users } from 'lucide-react';

export function Announcements() {
    const [message, setMessage] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);
    const [recipients, setRecipients] = useState(['all']);
    const [allTrainers, setAllTrainers] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTrainers = allTrainers.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        loadTrainers();
        loadHistory();
    }, []);

    const loadTrainers = async () => {
        const result = await getAllTrainers();
        if (result.success) setAllTrainers(result.trainers);
    };

    const loadHistory = async () => {
        const result = await getAnnouncements(); // Admin gets all
        if (result.success) setHistory(result.announcements);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        // If 'all' is selected, send empty array (API handles it as global)
        const recipientIds = recipients.includes('all') ? [] : recipients;

        const result = await createAnnouncement(message, isUrgent, recipientIds);

        if (result.success) {
            setSuccess('Announcement sent successfully!');
            setMessage('');
            setIsUrgent(false);
            setRecipients(['all']);
            loadHistory();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            alert('Failed to send announcement');
        }
        setLoading(false);
    };

    const toggleRecipient = (id) => {
        if (id === 'all') {
            setRecipients(['all']);
            return;
        }

        let newRecipients = [...recipients];
        if (newRecipients.includes('all')) {
            newRecipients = [];
        }

        if (newRecipients.includes(id)) {
            newRecipients = newRecipients.filter(r => r !== id);
        } else {
            newRecipients.push(id);
        }

        if (newRecipients.length === 0) {
            newRecipients = ['all'];
        }

        setRecipients(newRecipients);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Announcements</h1>
                        <p className="page-subtitle">Broadcast messages to your team</p>
                    </div>
                </div>

                <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) minmax(300px, 1fr)', gap: '2rem' }}>
                    {/* Compose Card */}
                    <div className="card">
                        <h2 className="card-title">Compose Message</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Message</label>
                                <textarea
                                    className="form-input"
                                    rows="4"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write your announcement here..."
                                    required
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Recipients</label>

                                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        className={`btn ${recipients.includes('all') ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => toggleRecipient('all')}
                                        style={{ flex: 1 }}
                                    >
                                        <Users size={16} />
                                        All Trainers
                                    </button>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Search trainer..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{ paddingLeft: '32px' }}
                                        />
                                    </div>
                                </div>

                                <div className="recipient-selector" style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem',
                                    padding: '1rem',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-subtle)',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}>
                                    {filteredTrainers.map(t => {
                                        const isSelected = recipients.includes(t.id);
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                className={`recipient-chip ${isSelected ? 'selected' : ''}`}
                                                onClick={() => toggleRecipient(t.id)}
                                            >
                                                {isSelected && <Check size={14} />}
                                                {t.name}
                                            </button>
                                        );
                                    })}
                                    {filteredTrainers.length === 0 && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '0.5rem' }}>No trainers found</p>
                                    )}
                                </div>
                            </div>

                            <div className="form-row" style={{ alignItems: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={isUrgent}
                                        onChange={(e) => setIsUrgent(e.target.checked)}
                                        style={{ width: '18px', height: '18px', accentColor: 'var(--status-red)' }}
                                    />
                                    <span style={{ color: isUrgent ? 'var(--status-red)' : 'inherit', fontWeight: isUrgent ? 600 : 400 }}>
                                        Mark as Urgent
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className={`btn ${isUrgent ? 'btn-danger' : 'btn-primary'}`}
                                disabled={loading}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                {loading ? 'Sending...' : (
                                    <>
                                        <Send size={18} />
                                        Send Announcement
                                    </>
                                )}
                            </button>
                            {success && (
                                <p className="success-message fade-in" style={{ marginTop: '1rem', color: 'var(--status-green)', textAlign: 'center' }}>
                                    {success}
                                </p>
                            )}
                        </form>
                    </div>

                    {/* History Card */}
                    <div className="card">
                        <h2 className="card-title">Recent History</h2>
                        <div className="announcement-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {history.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No announcements yet.</p>
                            ) : (
                                history.map(item => (
                                    <div key={item.id} className="history-item" style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        background: 'var(--bg-primary)',
                                        borderLeft: `4px solid ${item.is_urgent ? 'var(--status-red)' : 'var(--accent-blue)'}`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                            {item.is_urgent === 1 && <AlertTriangle size={14} color="var(--status-red)" />}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{item.message}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            To: {item.is_global ? 'Everyone' : 'Specific Trainers'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
