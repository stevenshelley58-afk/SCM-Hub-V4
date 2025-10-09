/**
 * Task Timeline Component
 * Shows event history and timeline for a logistics task
 */

import React, { useState, useEffect } from 'react';
import { taskService } from '../../services/logistics/taskService';
import type { TaskEvent, LogisticsTask } from '../../types';

interface TaskTimelineProps {
    task: LogisticsTask;
}

export const TaskTimeline: React.FC<TaskTimelineProps> = ({ task }) => {
    const [events, setEvents] = useState<TaskEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, [task.task_id]);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const eventsData = await taskService.getTaskEvents(task.task_id);
            setEvents(eventsData);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEventIcon = (eventType: string): string => {
        const icons: Record<string, string> = {
            created: '🆕',
            assigned: '👤',
            status_changed: '🔄',
            driver_started: '🚀',
            arrived: '📍',
            completed: '✅',
            exception: '⚠️',
            note_added: '📝',
            cancelled: '❌',
            on_hold: '⏸️',
            resumed: '▶️',
        };
        return icons[eventType] || '•';
    };

    const getEventColor = (eventType: string): string => {
        const colors: Record<string, string> = {
            created: '#0066cc',
            assigned: '#44aa44',
            status_changed: '#888',
            driver_started: '#0066cc',
            arrived: '#44aa44',
            completed: '#44aa44',
            exception: '#ff4444',
            note_added: '#888',
            cancelled: '#ff4444',
            on_hold: '#ff9944',
            resumed: '#44aa44',
        };
        return colors[eventType] || '#888';
    };

    const formatEventDescription = (event: TaskEvent): string => {
        switch (event.event_type) {
            case 'created':
                return 'Task created';
            case 'assigned':
                return `Assigned to driver`;
            case 'status_changed':
                return `Status changed: ${event.status_from} → ${event.status_to}`;
            case 'driver_started':
                return 'Driver started task';
            case 'arrived':
                return event.notes || 'Arrived at location';
            case 'completed':
                return 'Task completed';
            case 'exception':
                return `Exception: ${event.notes || 'Issue reported'}`;
            case 'note_added':
                return `Note: ${event.notes}`;
            case 'cancelled':
                return `Cancelled: ${event.notes}`;
            case 'on_hold':
                return `Put on hold: ${event.notes}`;
            case 'resumed':
                return 'Resumed from hold';
            default:
                return event.notes || event.event_type;
        }
    };

    const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                Loading timeline...
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                No events recorded yet
            </div>
        );
    }

    return (
        <div style={{ padding: '16px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>
                Task Timeline
            </h3>
            <div style={{ position: 'relative', paddingLeft: '32px' }}>
                {/* Timeline line */}
                <div style={{
                    position: 'absolute',
                    left: '12px',
                    top: '8px',
                    bottom: '8px',
                    width: '2px',
                    backgroundColor: '#ddd',
                }} />

                {events.map((event, index) => (
                    <div key={event.event_id} style={{ position: 'relative', marginBottom: '16px' }}>
                        {/* Event icon */}
                        <div style={{
                            position: 'absolute',
                            left: '-26px',
                            top: '0',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: getEventColor(event.event_type),
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            border: '2px solid white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}>
                            {getEventIcon(event.event_type)}
                        </div>

                        {/* Event content */}
                        <div style={{
                            backgroundColor: index === 0 ? '#f0f8ff' : 'white',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '4px',
                            }}>
                                <strong style={{ fontSize: '14px' }}>
                                    {formatEventDescription(event)}
                                </strong>
                                <span style={{ fontSize: '12px', color: '#888' }}>
                                    {formatTimestamp(event.timestamp)}
                                </span>
                            </div>

                            {event.actor_name && (
                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                    by {event.actor_name} {event.actor_role ? `(${event.actor_role})` : ''}
                                </div>
                            )}

                            {event.gps_lat && event.gps_lng && (
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    📍 {event.gps_lat.toFixed(6)}, {event.gps_lng.toFixed(6)}
                                </div>
                            )}

                            {event.photo_refs && event.photo_refs.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    marginTop: '8px',
                                    flexWrap: 'wrap',
                                }}>
                                    {event.photo_refs.map((photo) => (
                                        <img
                                            key={photo.id}
                                            src={photo.thumbnail_url || photo.url}
                                            alt="Event photo"
                                            style={{
                                                width: '60px',
                                                height: '60px',
                                                objectFit: 'cover',
                                                borderRadius: '4px',
                                                border: '1px solid #ddd',
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

