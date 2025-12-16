import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../../store';
import { fetchNotifications } from '../../store/notificationSlice';
import { Notification as NotificationType } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import './NotificationPreview.css';

const NotificationPreview: React.FC = () => {
    const dispatch = useDispatch();
    const { notifications, loading } = useSelector((state: RootState) => state.notifications);

    useEffect(() => {
        dispatch(fetchNotifications() as any);
    }, [dispatch]);

    const recentNotifications = notifications.slice(0, 5);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'FALL_DETECTED':
                return '🚨';
            case 'FALL_CONFIRMED':
                return '✅';
            case 'FALL_FALSE_ALARM':
                return '❌';
            default:
                return '🔔';
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Recent Notifications</h2>
                <Link to="/notifications" className="card-link">
                    View all →
                </Link>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                </div>
            ) : recentNotifications.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No notifications</p>
            ) : (
                <div className="notifications-list">
                    {recentNotifications.map((notification) => (
                        <div key={notification._id} className={`notification-item ${!notification.isAcknowledged ? 'unread' : ''}`}>
                            <span className="notification-icon">{getNotificationIcon(notification.type)}</span>
                            <div className="notification-content">
                                <div className="notification-header">
                                    <h3 className="notification-title">
                                        {notification.title}
                                    </h3>
                                    <span className="notification-time">
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="notification-message">{notification.message}</p>
                                {notification.isEmergency && (
                                    <span className="emergency-badge">Emergency</span>
                                )}
                            </div>
                            {!notification.isAcknowledged && <span className="unread-indicator"></span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationPreview;