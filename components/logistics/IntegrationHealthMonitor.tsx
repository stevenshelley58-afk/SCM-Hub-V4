/**
 * Integration Health Monitor
 * Shows health status of Materials <-> Logistics integration
 */

import React, { useState, useEffect } from 'react';
import { redisStreams, STREAMS } from '../../services/integrations/redisStreams';
import { materialsEventConsumer } from '../../services/integrations/materialsEventConsumer';
import { syncService } from '../../services/logistics/syncService';
import type { SyncStatus } from '../../services/logistics/syncService';

interface HealthStatus {
    overall: 'healthy' | 'degraded' | 'down';
    lastCheck: string;
    streams: Record<string, {
        status: 'healthy' | 'error';
        lastMessage: string | null;
        messageCount: number;
    }>;
    consumer: {
        running: boolean;
        subscribedStreams: number;
    };
    sync: {
        online: boolean;
        syncing: boolean;
        pendingPODs: number;
        lastSyncAttempt: string | null;
    };
}

export const IntegrationHealthMonitor: React.FC = () => {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        // Initial check
        checkHealth();

        // Subscribe to sync status
        const unsubscribe = syncService.onSyncStatus((status) => {
            setSyncStatus(status);
        });

        // Periodic health check
        const interval = setInterval(checkHealth, 10000); // Every 10 seconds

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const checkHealth = async () => {
        try {
            const streamStatus: Record<string, any> = {};

            // Check all streams
            for (const [name, streamName] of Object.entries(STREAMS)) {
                const info = await redisStreams.getStreamInfo(streamName);
                streamStatus[name] = {
                    status: 'healthy',
                    lastMessage: info.lastId,
                    messageCount: info.length,
                };
            }

            // Check consumer
            const consumerStats = materialsEventConsumer.getStats();

            // Check sync
            const syncStats = await syncService.getSyncStatus();

            // Determine overall health
            let overall: 'healthy' | 'degraded' | 'down' = 'healthy';
            if (!consumerStats.running) {
                overall = 'degraded';
            }
            if (!navigator.onLine && syncStats.pendingPODs > 5) {
                overall = 'degraded';
            }

            setHealth({
                overall,
                lastCheck: new Date().toISOString(),
                streams: streamStatus,
                consumer: consumerStats,
                sync: syncStats,
            });
        } catch (error) {
            console.error('Error checking integration health:', error);
        }
    };

    const handleStartConsumer = async () => {
        await materialsEventConsumer.start();
        checkHealth();
    };

    const handleStopConsumer = () => {
        materialsEventConsumer.stop();
        checkHealth();
    };

    const handleManualSync = async () => {
        try {
            const result = await syncService.manualSync();
            alert(`Sync complete!\nPODs synced: ${result.podsSynced}\nFailed: ${result.podsFailed}`);
            checkHealth();
        } catch (error: any) {
            alert(`Sync failed: ${error.message}`);
        }
    };

    const getStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
            healthy: '#44aa44',
            degraded: '#ff9944',
            down: '#ff4444',
        };
        return colors[status] || '#888';
    };

    const getStatusIcon = (status: string): string => {
        const icons: Record<string, string> = {
            healthy: '✅',
            degraded: '⚠️',
            down: '❌',
        };
        return icons[status] || '•';
    };

    if (!health) {
        return (
            <div style={{
                padding: '12px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#888',
            }}>
                Loading integration status...
            </div>
        );
    }

    return (
        <div style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #ddd',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: expanded ? '16px' : '0',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{getStatusIcon(health.overall)}</span>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                            Integration Status: {health.overall.toUpperCase()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>
                            Last check: {new Date(health.lastCheck).toLocaleTimeString()}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    style={{
                        padding: '6px 12px',
                        backgroundColor: '#f0f0f0',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                    }}
                >
                    {expanded ? 'Hide Details' : 'Show Details'}
                </button>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div>
                    {/* Sync Status */}
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '8px',
                        marginBottom: '12px',
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px',
                        }}>
                            <strong style={{ fontSize: '14px' }}>Offline Sync</strong>
                            <button
                                onClick={handleManualSync}
                                disabled={health.sync.syncing || !navigator.onLine}
                                style={{
                                    padding: '4px 12px',
                                    backgroundColor: health.sync.syncing || !navigator.onLine ? '#ccc' : '#0066cc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: health.sync.syncing || !navigator.onLine ? 'not-allowed' : 'pointer',
                                    fontSize: '12px',
                                }}
                            >
                                {health.sync.syncing ? 'Syncing...' : 'Manual Sync'}
                            </button>
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                            Network: {health.sync.online ? '🟢 Online' : '🔴 Offline'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                            Pending PODs: {health.sync.pendingPODs}
                        </div>
                        {syncStatus && syncStatus.syncing && (
                            <div style={{
                                marginTop: '8px',
                                height: '6px',
                                backgroundColor: '#e0e0e0',
                                borderRadius: '3px',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    width: `${syncStatus.progress}%`,
                                    height: '100%',
                                    backgroundColor: '#0066cc',
                                    transition: 'width 0.3s',
                                }} />
                            </div>
                        )}
                    </div>

                    {/* Event Consumer */}
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '8px',
                        marginBottom: '12px',
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px',
                        }}>
                            <strong style={{ fontSize: '14px' }}>Event Consumer</strong>
                            {health.consumer.running ? (
                                <button
                                    onClick={handleStopConsumer}
                                    style={{
                                        padding: '4px 12px',
                                        backgroundColor: '#ff4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                    }}
                                >
                                    Stop
                                </button>
                            ) : (
                                <button
                                    onClick={handleStartConsumer}
                                    style={{
                                        padding: '4px 12px',
                                        backgroundColor: '#44aa44',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                    }}
                                >
                                    Start
                                </button>
                            )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                            Status: {health.consumer.running ? '🟢 Running' : '🔴 Stopped'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            Subscribed Streams: {health.consumer.subscribedStreams}
                        </div>
                    </div>

                    {/* Stream Status */}
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '8px',
                    }}>
                        <strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                            Event Streams
                        </strong>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {Object.entries(health.streams).map(([name, stream]) => (
                                <div
                                    key={name}
                                    style={{
                                        padding: '8px',
                                        backgroundColor: 'white',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd',
                                    }}
                                >
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                                        {name.replace(/_/g, ' ')}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>
                                        Messages: {stream.messageCount}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={checkHealth}
                        style={{
                            width: '100%',
                            marginTop: '12px',
                            padding: '8px',
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                        }}
                    >
                        🔄 Refresh Status
                    </button>
                </div>
            )}
        </div>
    );
};

