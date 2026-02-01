import React, { useMemo } from 'react';
import '../pages/AdminDashboard.css';

export function TrendsChart({ data }) {
    // Determine max value for scaling
    const maxHours = useMemo(() => {
        if (!data || data.length === 0) return 10;
        return Math.max(...data.map(d => d.total_hours)) * 1.1; // 10% buffering
    }, [data]);

    if (!data || data.length === 0) {
        return <div className="text-secondary text-center p-4">No trend data available for the last 30 days.</div>;
    }

    return (
        <div className="trends-chart-container" style={{
            height: '250px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
            padding: '20px 0',
            overflowX: 'auto'
        }}>
            {data.map((day, index) => {
                const height = (day.total_hours / maxHours) * 100;
                const isWeekend = new Date(day.date).getDay() === 0 || new Date(day.date).getDay() === 6;

                return (
                    <div
                        key={day.date}
                        className="trend-bar-wrapper"
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: '20px',
                            gap: '4px'
                        }}
                    >
                        <div
                            className="trend-bar"
                            title={`${day.date}: ${day.total_hours.toFixed(1)} hrs (${day.active_trainers} active)`}
                            style={{
                                width: '100%',
                                height: `${height}%`,
                                backgroundColor: isWeekend ? 'var(--text-secondary)' : 'var(--primary-color)',
                                opacity: isWeekend ? 0.3 : 0.8,
                                borderRadius: '4px 4px 0 0',
                                transition: 'height 0.3s ease'
                            }}
                        />
                        {/* Show date label every 5 days or for last day */}
                        {(index % 5 === 0 || index === data.length - 1) && (
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                {new Date(day.date).getDate()}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
