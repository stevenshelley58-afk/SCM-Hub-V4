/**
 * Task Detail Modal
 * Comprehensive view of all task information
 */

import React, { useState } from 'react';
import { TaskTimeline } from './TaskTimeline';
import type { LogisticsTask } from '../../types';

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: LogisticsTask;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ isOpen, onClose, task }) => {
    const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'pod'>('details');

    if (!isOpen) return null;

    const getStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
            new: '#0066cc',
            scheduled: '#44aa44',
            in_progress: '#ff9944',
            completed: '#44aa44',
            verified: '#228822',
            closed: '#888',
            cancelled: '#ff4444',
            exception: '#ff4444',
            on_hold: '#ff9944',
        };
        return colors[status] || '#888';
    };

    const getPriorityColor = (priority: string): string => {
        const colors: Record<string, string> = {
            critical: '#ff4444',
            high: '#ff9944',
            normal: '#44aa44',
            low: '#888',
        };
        return colors[priority] || '#888';
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                maxWidth: '900px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #ddd',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div>
                        <h2 style={{ margin: 0, marginBottom: '8px' }}>{task.task_number}</h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                backgroundColor: getStatusColor(task.status),
                                color: 'white',
                                fontWeight: 'bold',
                            }}>
                                {task.status.toUpperCase().replace('_', ' ')}
                            </span>
                            <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                backgroundColor: getPriorityColor(task.priority),
                                color: 'white',
                                fontWeight: 'bold',
                            }}>
                                {task.priority.toUpperCase()}
                            </span>
                            <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                backgroundColor: '#f0f0f0',
                                color: '#333',
                            }}>
                                {task.type}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#666',
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid #ddd',
                    backgroundColor: '#f9f9f9',
                }}>
                    <button
                        onClick={() => setActiveTab('details')}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            backgroundColor: activeTab === 'details' ? 'white' : 'transparent',
                            borderBottom: activeTab === 'details' ? '2px solid #0066cc' : 'none',
                            fontWeight: activeTab === 'details' ? 'bold' : 'normal',
                            cursor: 'pointer',
                        }}
                    >
                        Details
                    </button>
                    <button
                        onClick={() => setActiveTab('timeline')}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            backgroundColor: activeTab === 'timeline' ? 'white' : 'transparent',
                            borderBottom: activeTab === 'timeline' ? '2px solid #0066cc' : 'none',
                            fontWeight: activeTab === 'timeline' ? 'bold' : 'normal',
                            cursor: 'pointer',
                        }}
                    >
                        Timeline
                    </button>
                    {task.pod && (
                        <button
                            onClick={() => setActiveTab('pod')}
                            style={{
                                padding: '12px 24px',
                                border: 'none',
                                backgroundColor: activeTab === 'pod' ? 'white' : 'transparent',
                                borderBottom: activeTab === 'pod' ? '2px solid #0066cc' : 'none',
                                fontWeight: activeTab === 'pod' ? 'bold' : 'normal',
                                cursor: 'pointer',
                            }}
                        >
                            POD
                        </button>
                    )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                    {activeTab === 'details' && (
                        <div>
                            {/* Description */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>Description</h3>
                                <p style={{ margin: 0 }}>{task.description}</p>
                                {task.special_instructions && (
                                    <div style={{
                                        marginTop: '12px',
                                        padding: '12px',
                                        backgroundColor: '#fff9e6',
                                        borderLeft: '3px solid #ffcc00',
                                        borderRadius: '4px',
                                    }}>
                                        <strong>⚠️ Special Instructions:</strong>
                                        <p style={{ margin: '4px 0 0 0' }}>{task.special_instructions}</p>
                                    </div>
                                )}
                            </div>

                            {/* Requester */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>Requester</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <InfoField label="Name" value={task.requester.name} />
                                    <InfoField label="Department" value={task.requester.department} />
                                    {task.requester.phone && <InfoField label="Phone" value={task.requester.phone} />}
                                    {task.requester.email && <InfoField label="Email" value={task.requester.email} />}
                                </div>
                            </div>

                            {/* Locations */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                {/* Pickup */}
                                <div>
                                    <h3 style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>📍 Pickup Location</h3>
                                    <div style={{
                                        padding: '12px',
                                        backgroundColor: '#f9f9f9',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                    }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{task.pickup.location}</div>
                                        {task.pickup.contact && <div style={{ fontSize: '14px', color: '#666' }}>Contact: {task.pickup.contact}</div>}
                                        {task.pickup.phone && <div style={{ fontSize: '14px', color: '#666' }}>Phone: {task.pickup.phone}</div>}
                                        {task.pickup.access_notes && (
                                            <div style={{
                                                marginTop: '8px',
                                                padding: '8px',
                                                backgroundColor: 'white',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                            }}>
                                                <strong>Access:</strong> {task.pickup.access_notes}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Dropoff */}
                                <div>
                                    <h3 style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>📍 Dropoff Location</h3>
                                    <div style={{
                                        padding: '12px',
                                        backgroundColor: '#f9f9f9',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                    }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{task.dropoff.location}</div>
                                        {task.dropoff.contact && <div style={{ fontSize: '14px', color: '#666' }}>Contact: {task.dropoff.contact}</div>}
                                        {task.dropoff.phone && <div style={{ fontSize: '14px', color: '#666' }}>Phone: {task.dropoff.phone}</div>}
                                        {task.dropoff.access_notes && (
                                            <div style={{
                                                marginTop: '8px',
                                                padding: '8px',
                                                backgroundColor: 'white',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                            }}>
                                                <strong>Access:</strong> {task.dropoff.access_notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Load Info */}
                            {task.load_info && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>Load Information</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                        {task.load_info.qty && <InfoField label="Quantity" value={`${task.load_info.qty} items`} />}
                                        {task.load_info.weight && <InfoField label="Weight" value={`${task.load_info.weight} kg`} />}
                                        {task.load_info.equipment_required && <InfoField label="Equipment Required" value={task.load_info.equipment_required} />}
                                    </div>
                                </div>
                            )}

                            {/* Assignment */}
                            {(task.driver || task.vehicle) && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>Assignment</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        {task.driver && <InfoField label="Driver" value={task.driver.name} />}
                                        {task.vehicle && <InfoField label="Vehicle" value={task.vehicle.registration} />}
                                        {task.assigned_at && <InfoField label="Assigned At" value={new Date(task.assigned_at).toLocaleString()} />}
                                    </div>
                                </div>
                            )}

                            {/* Timeline Timestamps */}
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>Timeline</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                    <InfoField label="Created" value={new Date(task.created_at).toLocaleString()} />
                                    <InfoField label="Requested Date" value={new Date(task.requested_date).toLocaleString()} />
                                    {task.started_at && <InfoField label="Started" value={new Date(task.started_at).toLocaleString()} />}
                                    {task.completed_at && <InfoField label="Completed" value={new Date(task.completed_at).toLocaleString()} />}
                                </div>
                            </div>

                            {/* Linked Entities */}
                            {(task.linked_mrf_id || task.linked_wo_id) && (
                                <div>
                                    <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>Linked Entities</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                        {task.linked_mrf_id && <InfoField label="MRF" value={task.linked_mrf_id} />}
                                        {task.linked_wo_id && <InfoField label="Work Order" value={task.linked_wo_id} />}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'timeline' && (
                        <TaskTimeline task={task} />
                    )}

                    {activeTab === 'pod' && task.pod && (
                        <div>
                            <h3 style={{ marginBottom: '16px' }}>Proof of Delivery</h3>
                            
                            {/* Delivery Info */}
                            <div style={{ marginBottom: '24px' }}>
                                <InfoField label="Delivered To" value={task.pod.delivered_to} />
                                {task.pod.delivered_to_phone && <InfoField label="Phone" value={task.pod.delivered_to_phone} />}
                                {task.pod.delivery_notes && (
                                    <div style={{ marginTop: '12px' }}>
                                        <strong>Notes:</strong>
                                        <p style={{ margin: '4px 0 0 0', color: '#666' }}>{task.pod.delivery_notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Photos */}
                            {task.pod.photos && task.pod.photos.length > 0 && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>
                                        Photos ({task.pod.photo_count})
                                    </h4>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                        gap: '12px',
                                    }}>
                                        {task.pod.photos.map((photo) => (
                                            <img
                                                key={photo.id}
                                                src={photo.url}
                                                alt="POD photo"
                                                style={{
                                                    width: '100%',
                                                    height: '150px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    border: '1px solid #ddd',
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Signature */}
                            {task.pod.signature_img && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>Signature</h4>
                                    <img
                                        src={task.pod.signature_img}
                                        alt="Signature"
                                        style={{
                                            maxWidth: '400px',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            backgroundColor: 'white',
                                        }}
                                    />
                                </div>
                            )}

                            {/* GPS */}
                            {task.pod.delivery_gps_lat && task.pod.delivery_gps_lng && (
                                <div>
                                    <h4 style={{ marginBottom: '12px', fontSize: '14px', color: '#666' }}>GPS Location</h4>
                                    <div style={{
                                        padding: '12px',
                                        backgroundColor: task.pod.gps_verified ? '#e8f5e9' : '#fff9e6',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd',
                                    }}>
                                        <div style={{ marginBottom: '4px' }}>
                                            📍 {task.pod.delivery_gps_lat.toFixed(6)}, {task.pod.delivery_gps_lng.toFixed(6)}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                            {task.pod.gps_verified ? '✅ Verified within site radius' : '⚠️ Outside expected site radius'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper component for info fields
const InfoField: React.FC<{ label: string; value: string | undefined }> = ({ label, value }) => {
    if (!value) return null;
    
    return (
        <div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>{value}</div>
        </div>
    );
};

