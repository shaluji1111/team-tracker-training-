import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { getAnnouncements } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function AnnouncementBanner() {
    const { user } = useAuth();
    const [announcement, setAnnouncement] = useState(null);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (user) {
            loadAnnouncement();
        }
    }, [user]);

    const loadAnnouncement = async () => {
        const result = await getAnnouncements(user.id);
        if (result.success && result.announcements.length > 0) {
            // Get the latest one
            setAnnouncement(result.announcements[0]);
        }
    };

    if (!announcement || !visible) return null;

    const isUrgent = announcement.is_urgent === 1;

    return (
        <div
            className={`announcement-banner fade-in ${isUrgent ? 'urgent' : 'normal'}`}
            style={{
                background: isUrgent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                border: `1px solid ${isUrgent ? 'var(--status-red)' : '#3b82f6'}`,
                color: isUrgent ? 'var(--status-red)' : '#3b82f6',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'start',
                gap: '1rem',
                position: 'relative'
            }}
        >
            <div style={{ marginTop: '2px' }}>
                {isUrgent ? <AlertTriangle size={20} /> : <Info size={20} />}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                    {isUrgent ? 'URGENT ANNOUNCEMENT' : 'ANNOUNCEMENT'}
                </div>
                <div style={{ fontSize: '0.95rem', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                    {announcement.message}
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>
                    {new Date(announcement.created_at).toLocaleString()}
                </div>
            </div>
            <button
                onClick={() => setVisible(false)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    padding: '4px',
                    opacity: 0.7
                }}
            >
                <X size={18} />
            </button>
        </div>
    );
}
