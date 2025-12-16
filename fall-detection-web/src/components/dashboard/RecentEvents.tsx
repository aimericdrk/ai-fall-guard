import React from 'react';
import { Link } from 'react-router-dom';
import { FallEvent } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import './RecentEvents.css';

interface RecentEventsProps {
    events: FallEvent[];
    loading: boolean;
}

const RecentEvents: React.FC<RecentEventsProps> = ({ events, loading }) => {
    if (loading) {
        return (
            <div className="card">
                <h2 className="card-title">Recent Fall Events</h2>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">Recent Fall Events</h2>
                <Link to="/fall-events" className="card-link">
                    View all →
                </Link>
            </div>

            {events.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No fall events recorded</p>
            ) : (
                <div className="events-list">
                    {events.map((event) => (
                        <div key={event._id} className="event-item">
                            <div className="event-header">
                                <div>
                                    <p className="event-title">
                                        Fall detected with {Math.round(event.confidence * 100)}% confidence
                                    </p>
                                    <p className="event-meta">
                                        Angle: {Math.round(event.angle)}° | Velocity: {event.velocity.toFixed(2)} m/s
                                    </p>
                                    <p className="event-time">
                                        {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                                    </p>
                                </div>
                                <span className={`status-badge ${event.isAcknowledged
                                        ? event.isFalseAlarm
                                            ? 'status-warning'
                                            : 'status-success'
                                        : 'status-danger'
                                    }`}>
                                    {event.isAcknowledged
                                        ? event.isFalseAlarm ? 'False Alarm' : 'Confirmed'
                                        : 'Pending'
                                    }
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentEvents;