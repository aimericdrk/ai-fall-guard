import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchFallEvents, acknowledgeFallEvent } from '../../store/fallDetectionSlice';
import { FallEvent } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import './FallEvents.css';

const FallEvents: React.FC = () => {
    const dispatch = useDispatch();
    const { events, loading } = useSelector((state: RootState) => state.fallDetection);
    const [selectedEvent, setSelectedEvent] = useState<FallEvent | null>(null);
    const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
    const [acknowledgeData, setAcknowledgeData] = useState({
        isFalseAlarm: false,
        falseAlarmReason: '',
    });

    useEffect(() => {
        dispatch(fetchFallEvents() as any);
    }, [dispatch]);

    const handleAcknowledge = (event: FallEvent) => {
        setSelectedEvent(event);
        setShowAcknowledgeModal(true);
    };

    const confirmAcknowledge = async () => {
        if (selectedEvent) {
            try {
                await dispatch(acknowledgeFallEvent({
                    id: selectedEvent._id,
                    ...acknowledgeData,
                }) as any);
                setShowAcknowledgeModal(false);
                setSelectedEvent(null);
                setAcknowledgeData({ isFalseAlarm: false, falseAlarmReason: '' });
            } catch (error) {
                console.error('Failed to acknowledge event:', error);
            }
        }
    };

    const getStatusBadge = (event: FallEvent) => {
        if (event.isAcknowledged) {
            if (event.isFalseAlarm) {
                return <span className="status-badge status-warning">False Alarm</span>;
            }
            return <span className="status-badge status-success">Confirmed</span>;
        }
        return <span className="status-badge status-danger">Pending</span>;
    };

    return (
        <div className="fall-events">
            <div className="page-header">
                <h1 className="page-title">Fall Events</h1>
                <button
                    onClick={() => dispatch(fetchFallEvents() as any)}
                    className="btn btn-primary"
                >
                    Refresh
                </button>
            </div>

            {/* Events Table */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Confidence</th>
                            <th>Angle</th>
                            <th>Velocity</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center">
                                    <div className="loading-container">
                                        <div className="loading-spinner"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : events.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center text-gray-500">
                                    No fall events recorded
                                </td>
                            </tr>
                        ) : (
                            events.map((event) => (
                                <tr key={event._id} className="table-row">
                                    <td>{formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}</td>
                                    <td>{Math.round(event.confidence * 100)}%</td>
                                    <td>{Math.round(event.angle)}°</td>
                                    <td>{event.velocity.toFixed(2)} m/s</td>
                                    <td>{getStatusBadge(event)}</td>
                                    <td>
                                        {!event.isAcknowledged && (
                                            <button
                                                onClick={() => handleAcknowledge(event)}
                                                className="btn btn-primary btn-sm"
                                            >
                                                Acknowledge
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Acknowledge Modal */}
            {showAcknowledgeModal && selectedEvent && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3 className="modal-title">Acknowledge Fall Event</h3>
                            <button className="modal-close" onClick={() => setShowAcknowledgeModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="mb-4">Was this a false alarm or a real fall?</p>

                            <div className="form-group">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="isFalseAlarm"
                                        checked={!acknowledgeData.isFalseAlarm}
                                        onChange={() => setAcknowledgeData({ ...acknowledgeData, isFalseAlarm: false })}
                                        className="mr-2"
                                    />
                                    Real fall
                                </label>
                            </div>

                            <div className="form-group">
                                <label className="radio-label">
                                    <input
                                        type="radio"
                                        name="isFalseAlarm"
                                        checked={acknowledgeData.isFalseAlarm}
                                        onChange={() => setAcknowledgeData({ ...acknowledgeData, isFalseAlarm: true })}
                                        className="mr-2"
                                    />
                                    False alarm
                                </label>
                            </div>

                            {acknowledgeData.isFalseAlarm && (
                                <div className="form-group">
                                    <label className="form-label">Reason</label>
                                    <textarea
                                        placeholder="Please describe why this was a false alarm..."
                                        value={acknowledgeData.falseAlarmReason}
                                        onChange={(e) => setAcknowledgeData({ ...acknowledgeData, falseAlarmReason: e.target.value })}
                                        className="form-input form-textarea"
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={confirmAcknowledge}
                                className="btn btn-primary"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => {
                                    setShowAcknowledgeModal(false);
                                    setSelectedEvent(null);
                                    setAcknowledgeData({ isFalseAlarm: false, falseAlarmReason: '' });
                                }}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FallEvents;