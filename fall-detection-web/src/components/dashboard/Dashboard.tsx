import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchFallStats } from '../../store/fallDetectionSlice';
import { fetchUnreadCount } from '../../store/notificationSlice';
import StatsCard from './StatsCard';
import RecentEvents from './RecentEvents';
import NotificationPreview from './NotificationPreview';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const dispatch = useDispatch();
    const { stats, events, loading } = useSelector((state: RootState) => state.fallDetection);
    const { unreadCount } = useSelector((state: RootState) => state.notifications);

    useEffect(() => {
        dispatch(fetchFallStats(30) as any);
        dispatch(fetchUnreadCount() as any);
    }, [dispatch]);

    const recentEvents = events.slice(0, 5);

    // Fix: Explicitly type the stats array to avoid TypeScript inference issues
    const dashboardStats: Array<{
        title: string;
        value: string | number;
        icon: string;
        color: 'red' | 'green' | 'blue' | 'yellow';
        trend: 'up' | 'down' | 'stable';
    }> = [
            {
                title: 'Total Falls (30 days)',
                value: stats?.totalFalls || 0,
                icon: '🚨',
                color: 'red',
                trend: stats && stats.totalFalls > 0 ? 'up' : 'stable',
            },
            {
                title: 'Acknowledged',
                value: stats?.acknowledgedFalls || 0,
                icon: '✅',
                color: 'green',
                trend: 'stable',
            },
            {
                title: 'False Alarms',
                value: stats?.falseAlarms || 0,
                icon: '❌',
                color: 'yellow',
                trend: 'stable',
            },
            {
                title: 'Avg Confidence',
                value: stats ? `${Math.round(stats.avgConfidence * 100)}%` : '0%',
                icon: '🎯',
                color: 'blue',
                trend: 'stable',
            },
        ];

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1 className="dashboard-title">Dashboard</h1>
                {unreadCount > 0 && (
                    <div className="emergency-badge">
                        {unreadCount} unread notifications
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {dashboardStats.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            <div className="dashboard-grid">
                {/* Recent Events */}
                <RecentEvents events={recentEvents} loading={loading} />

                {/* Notification Preview */}
                <NotificationPreview />
            </div>
        </div>
    );
};

export default Dashboard;