/**
 * Logistics Status Badge
 * Shows logistics task status for Material Requests
 */

import React, { useState, useEffect } from 'react';
import { redisStreams, STREAMS } from '../../services/integrations/redisStreams';
import type { StreamMessage } from '../../services/integrations/redisStreams';

interface LogisticsStatusBadgeProps {
    mrfId: string;
    compact?: boolean;
}

interface LogisticsStatus {
    status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'exception';
    taskNumber?: string;
    driver?: string;
    vehicle?: string;
    estimatedDelivery?: string;
    lastUpdate: string;
    details?: string;
}

export const LogisticsStatusBadge: React.FC<LogisticsStatusBadgeProps> = ({ mrfId, compact = false }) => {
    const [status, setStatus] = useState<LogisticsStatus>({
        status: 'pending',
        lastUpdate: new Date().toISOString(),
    });

    useEffect(() => {
        // Load initial status from localStorage
        loadStatus();

        // Subscribe to logistics events
        const unsubscribers: Array<() => void> = [];

        // Subscribe to accepted events
        redisStreams.subscribe(
            STREAMS.TASK_ACCEPTED,
            'materials',
            `mrf-${mrfId}`,
            (message) => handleTaskAccepted(message)
        ).then(unsub => unsubscribers.push(unsub));

        // Subscribe to in-transit events
        redisStreams.subscribe(
            STREAMS.TASK_IN_TRANSIT,
            'materials',
            `mrf-${mrfId}`,
            (message) => handleTaskInTransit(message)
        ).then(unsub => unsubscribers.push(unsub));

        // Subscribe to delivered events
        redisStreams.subscribe(
            STREAMS.TASK_DELIVERED,
            'materials',
            `mrf-${mrfId}`,
            (message) => handleTaskDelivered(message)
        ).then(unsub => unsubscribers.push(unsub));

        // Subscribe to exception events
        redisStreams.subscribe(
            STREAMS.TASK_EXCEPTION,
            'materials',
            `mrf-${mrfId}`,
            (message) => handleTaskException(message)
        ).then(unsub => unsubscribers.push(unsub));

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [mrfId]);

    const loadStatus = () => {
        try {
            const stored = localStorage.getItem(`logistics_status:${mrfId}`);
            if (stored) {
                setStatus(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading logistics status:', error);
        }
    };

    const saveStatus = (newStatus: LogisticsStatus) => {
        try {
            localStorage.setItem(`logistics_status:${mrfId}`, JSON.stringify(newStatus));
            setStatus(newStatus);
        } catch (error) {
            console.error('Error saving logistics status:', error);
        }
    };

    const handleTaskAccepted = (message: StreamMessage) => {
        const event = message.data;
        if (event.data.linked_mrf_id === mrfId) {
            saveStatus({
                status: 'accepted',
                taskNumber: event.data.task_number,
                driver: event.data.driver.name,
                vehicle: event.data.vehicle.registration,
                estimatedDelivery: event.data.estimated_delivery_time,
                lastUpdate: event.timestamp,
                details: `Assigned to ${event.data.driver.name}`,
            });
        }
    };

    const handleTaskInTransit = (message: StreamMessage) => {
        const event = message.data;
        if (event.data.linked_mrf_id === mrfId) {
            saveStatus({
                status: 'in_transit',
                taskNumber: event.data.task_number,
                driver: event.data.driver.name,
                estimatedDelivery: event.data.estimated_delivery_time,
                lastUpdate: event.timestamp,
                details: `In transit since ${new Date(event.data.pickup_time).toLocaleTimeString()}`,
            });
        }
    };

    const handleTaskDelivered = (message: StreamMessage) => {
        const event = message.data;
        if (event.data.linked_mrf_id === mrfId) {
            saveStatus({
                status: 'delivered',
                taskNumber: event.data.task_number,
                driver: event.data.driver.name,
                lastUpdate: event.timestamp,
                details: `Delivered to ${event.data.pod.delivered_to}`,
            });
        }
    };

    const handleTaskException = (message: StreamMessage) => {
        const event = message.data;
        if (event.data.linked_mrf_id === mrfId) {
            saveStatus({
                status: 'exception',
                taskNumber: event.data.task_number,
                driver: event.data.driver?.name,
                lastUpdate: event.timestamp,
                details: event.data.description,
            });
        }
    };

    const getStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
            pending: '#888',
            accepted: '#0066cc',
            in_transit: '#ff9944',
            delivered: '#44aa44',
            exception: '#ff4444',
        };
        return colors[status] || '#888';
    };

    const getStatusIcon = (status: string): string => {
        const icons: Record<string, string> = {
            pending: '⏳',
            accepted: '✓',
            in_transit: '🚚',
            delivered: '✅',
            exception: '⚠️',
        };
        return icons[status] || '•';
    };

    const getStatusLabel = (status: string): string => {
        const labels: Record<string, string> = {
            pending: 'Pending Pickup',
            accepted: 'Scheduled',
            in_transit: 'In Transit',
            delivered: 'Delivered',
            exception: 'Issue',
        };
        return labels[status] || status;
    };

    if (compact) {
        return (
            <div
                title={status.details}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: getStatusColor(status.status) + '20',
                    color: getStatusColor(status.status),
                    fontSize: '12px',
                    fontWeight: 'bold',
                    gap: '4px',
                }}
            >
                <span>{getStatusIcon(status.status)}</span>
                <span>{getStatusLabel(status.status)}</span>
            </div>
        );
    }

    return (
        <div style={{
            padding: '12px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #ddd',
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <span style={{ fontSize: '20px' }}>{getStatusIcon(status.status)}</span>
                    <strong style={{ fontSize: '14px' }}>{getStatusLabel(status.status)}</strong>
                </div>
                {status.taskNumber && (
                    <span style={{
                        fontSize: '12px',
                        color: '#666',
                        fontFamily: 'monospace',
                    }}>
                        {status.taskNumber}
                    </span>
                )}
            </div>

            {status.details && (
                <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '8px',
                }}>
                    {status.details}
                </div>
            )}

            {status.driver && (
                <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '4px',
                }}>
                    👤 {status.driver} {status.vehicle && `(${status.vehicle})`}
                </div>
            )}

            {status.estimatedDelivery && status.status !== 'delivered' && (
                <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '4px',
                }}>
                    🕐 ETA: {new Date(status.estimatedDelivery).toLocaleString()}
                </div>
            )}

            <div style={{
                fontSize: '11px',
                color: '#999',
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid #eee',
            }}>
                Last updated: {new Date(status.lastUpdate).toLocaleTimeString()}
            </div>
        </div>
    );
};

