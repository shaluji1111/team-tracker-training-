import React from 'react';
import { Award, TrendingUp } from 'lucide-react';

export function Leaderboard({ performers }) {
    if (!performers || performers.length === 0) {
        return <div className="text-secondary text-center p-4">No performance data available.</div>;
    }

    return (
        <div className="leaderboard-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {performers.map((performer, index) => (
                <div
                    key={performer.id}
                    className="leaderboard-item"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                            className="rank-badge"
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: index === 0 ? 'var(--warning-color)' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'transparent',
                                color: index < 3 ? '#000' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                border: index >= 3 ? '1px solid var(--border-color)' : 'none'
                            }}
                        >
                            {index + 1}
                        </div>
                        <div>
                            <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{performer.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{performer.tasks_count} tasks</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--success-color)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {performer.total_hours} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>hrs</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
