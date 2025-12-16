import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchNotifications, acknowledgeNotification, markAsRead } from '../../store/notificationSlice';
import { Notification as NotificationType } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import './Notifications.css';

const Notifications: React.FC = () => {
    const dispatch = useDispatch();
    const { notifications, loading } = useSelector((state: RootState) => state.notifications);

    useEffect(() => {
        dispatch(fetchNotifications() as any);
    }, [dispatch]);

    const handleAcknowledge = async (id: string) => {
        try {
            await dispatch(acknowledgeNotification(id) as any);
        } catch (error) {
            console.error('Failed to acknowledge notification:', error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await dispatch(markAsRead(id) as any);
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'FALL_DETECTED':
                return '🚨';
            case 'FALL_CONFIRMED':
                return '✅';
            case 'FALL_FALSE_ALARM':
                return '❌';
            case 'SYSTEM_ALERT':
                return '⚠️';
            case 'EMERGENCY_CONTACT':
                return '📞';
            default:
                return '🔔';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'FALL_DETECTED':
                return 'notification-danger';
            case 'FALL_CONFIRMED':
                return 'notification-success';
            case 'FALL_FALSE_ALARM':
                return 'notification-warning';
            case 'SYSTEM_ALERT':
                return 'notification-info';
            case 'EMERGENCY_CONTACT':
                return 'notification-primary';
            default:
                return 'notification-default';
        }
    };

    const unreadNotifications = notifications.filter(n => !n.isAcknowledged);
    const readNotifications = notifications.filter(n => n.isAcknowledged);

    return (
        <div className="notifications">
            <div className="page-header">
                <h1 className="page-title">Notifications</h1>
                <button
                    onClick={() => dispatch(fetchNotifications() as any)}
                    className="btn btn-primary"
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                </div>
            ) : (
                <>
                    {/* Unread Notifications */}
                    <div className="card mb-6">
                        <div className="card-header">
                            <h2 className="card-title">Unread Notifications ({unreadNotifications.length})</h2>
                        </div>
                        <div className="notifications-section">
                            {unreadNotifications.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No unread notifications</p>
                            ) : (
                                unreadNotifications.map((notification) => (
                                    <div key={notification._id} className={`notification-item ${getNotificationColor(notification.type)} unread`}>
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
                                            <div className="notification-actions">
                                                <button
                                                    onClick={() => handleAcknowledge(notification._id)}
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    Acknowledge
                                                </button>
                                                <button
                                                    onClick={() => handleMarkAsRead(notification._id)}
                                                    className="btn btn-outline btn-sm"
                                                >
                                                    Mark as Read
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Read Notifications */}
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Read Notifications ({readNotifications.length})</h2>
                        </div>
                        <div className="notifications-section">
                            {readNotifications.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No read notifications</p>
                            ) : (
                                readNotifications.map((notification) => (
                                    <div key={notification._id} className={`notification-item ${getNotificationColor(notification.type)}`}>
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
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Notifications;