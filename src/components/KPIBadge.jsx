import React from 'react';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';

export function KPIBadge({ hours, status: statusOverride }) {
    const getStatus = () => {
        if (statusOverride === 'On Leave') {
            return {
                label: 'On Leave',
                className: 'badge-blue',
                icon: <Zap size={18} style={{ opacity: 0.5 }} />,
            };
        }
        if (statusOverride === 'Holiday') {
            return {
                label: 'Holiday',
                className: 'badge-purple',
                icon: <Zap size={18} style={{ opacity: 0.5 }} />,
            };
        }

        if (statusOverride === 'underperforming') {
            return {
                label: 'Underperforming',
                className: 'badge-red',
                icon: <TrendingDown size={18} />,
            };
        }

        if (statusOverride === 'normal') {
            return {
                label: 'Normal',
                className: 'badge-amber',
                icon: <Zap size={18} />,
            };
        }

        if (statusOverride === 'overperforming') {
            return {
                label: 'Overperforming',
                className: 'badge-green',
                icon: <TrendingUp size={18} />,
            };
        }

        if (hours < 7) {
            return {
                label: 'Underperforming',
                className: 'badge-red',
                icon: <TrendingDown size={18} />,
            };
        } else if (hours <= 7.5) {
            return {
                label: 'Normal',
                className: 'badge-amber',
                icon: <Zap size={18} />,
            };
        } else {
            return {
                label: 'Overperforming',
                className: 'badge-green',
                icon: <TrendingUp size={18} />,
            };
        }
    };

    const status = getStatus();

    return (
        <div className={`badge ${status.className}`}>
            {status.icon}
            <span>{status.label}</span>
        </div>
    );
}
