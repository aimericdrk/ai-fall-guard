import React from 'react';
import './StatsCard.css';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: string;
    color: 'red' | 'green' | 'blue' | 'yellow';
    trend: 'up' | 'down' | 'stable';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color, trend }) => {
    const colorClasses = {
        red: 'stats-card-red',
        green: 'stats-card-green',
        blue: 'stats-card-blue',
        yellow: 'stats-card-yellow',
    };

    const trendIcons = {
        up: '↗️',
        down: '↘️',
        stable: '➡️',
    };

    return (
        <div className={`stats-card ${colorClasses[color]}`}>
            <div className="stats-header">
                <div>
                    <p className="stats-title">{title}</p>
                    <p className="stats-value">{value}</p>
                </div>
                <div className="stats-icon">{icon}</div>
            </div>
            <div className="stats-trend">
                <span className="trend-icon">{trendIcons[trend]}</span>
                <span>
                    {trend === 'up' ? 'Increased' : trend === 'down' ? 'Decreased' : 'Stable'}
                </span>
            </div>
        </div>
    );
};

export default StatsCard;