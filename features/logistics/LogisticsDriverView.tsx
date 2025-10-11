/**
 * Logistics Driver View
 * Mobile-optimized view for drivers to execute tasks
 */

import React, { useState, useEffect } from 'react';
import { taskService, type UpdateTaskInput } from '../../services/logistics/taskService';
import { podService } from '../../services/logistics/podService';
import { PODCaptureModal } from '../../components/logistics/PODCaptureModal';
import type { LogisticsTask, PODRecord } from '../../types';

export const LogisticsDriverView: React.FC<{ driverId: string }> = ({ driverId }) => {
    const [tasks, setTasks] = useState<LogisticsTask[]>([]);
    const [selectedTask, setSelectedTask] = useState<LogisticsTask | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPODModal, setShowPODModal] = useState(false);
    const [podTask, setPodTask] = useState<LogisticsTask | null>(null);

    useEffect(() => {
        loadDriverTasks();
        // Set up polling for real-time updates
        const interval = setInterval(loadDriverTasks, 30000);
        return () => clearInterval(interval);
    }, [driverId]);

    const loadDriverTasks = async () => {
        setLoading(true);
        try {
            const tasksData = await taskService.listTasks({ driver_id: driverId });
            setTasks(tasksData.filter(t => ['scheduled', 'in_progress'].includes(t.status)));
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartTask = async (taskId: string) => {
        try {
            await taskService.startTask(taskId);
            await loadDriverTasks();
            alert('Task started!');
        } catch (error: any) {
            alert(`Error starting task: ${error.message}`);
        }
    };

    const handleArrival = async (taskId: string, location: 'pickup' | 'dropoff') => {
        try {
            const updates: UpdateTaskInput = {
                task_id: taskId,
            };
            
            if (location === 'pickup') {
                updates.pickup_arrived_at = new Date().toISOString();
            } else {
                updates.dropoff_arrived_at = new Date().toISOString();
            }

            await taskService.updateTask(updates);
            await loadDriverTasks();
            alert(`Arrived at ${location}!`);
        } catch (error: any) {
            alert(`Error recording arrival: ${error.message}`);
        }
    };

    const handleOpenPODCapture = (task: LogisticsTask) => {
        setPodTask(task);
        setShowPODModal(true);
    };

    const handlePODComplete = async () => {
        try {
            if (podTask) {
                await taskService.completeTask(podTask.task_id);
                await loadDriverTasks();
                alert('Task completed successfully!');
            }
        } catch (error: any) {
            alert(`Error completing task: ${error.message}`);
        }
    };

    return (
        <div className="logistics-driver-view" style={{
            padding: '16px',
            maxWidth: '600px',
            margin: '0 auto',
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
            }}>
                <h1 style={{ fontSize: '24px', margin: 0 }}>🚚 My Tasks</h1>
                <button
                    onClick={loadDriverTasks}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#0066cc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Loading tasks...</p>
                </div>
            ) : tasks.length === 0 ? (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '8px',
                }}>
                    <p>No active tasks</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {tasks.map(task => (
                        <div
                            key={task.task_id}
                            style={{
                                backgroundColor: 'white',
                                border: '2px solid #ddd',
                                borderRadius: '8px',
                                padding: '16px',
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '12px',
                            }}>
                                <strong style={{ fontSize: '18px' }}>{task.task_number}</strong>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    backgroundColor:
                                        task.status === 'in_progress' ? '#44aa44' : '#888',
                                    color: 'white',
                                }}>
                                    {task.status.toUpperCase().replace('_', ' ')}
                                </span>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <p style={{ margin: '8px 0', fontSize: '16px' }}>
                                    <strong>📍 Pickup:</strong> {task.pickup.location}
                                </p>
                                <p style={{ margin: '8px 0', fontSize: '16px' }}>
                                    <strong>📍 Dropoff:</strong> {task.dropoff.location}
                                </p>
                                <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                                    {task.description}
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {task.status === 'scheduled' && (
                                    <button
                                        onClick={() => handleStartTask(task.task_id)}
                                        style={{
                                            padding: '12px',
                                            backgroundColor: '#0066cc',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        ▶️ Start Task
                                    </button>
                                )}

                                {task.status === 'in_progress' && !task.pickup_arrived_at && (
                                    <button
                                        onClick={() => handleArrival(task.task_id, 'pickup')}
                                        style={{
                                            padding: '12px',
                                            backgroundColor: '#44aa44',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        ✓ Arrived at Pickup
                                    </button>
                                )}

                                {task.status === 'in_progress' && task.pickup_arrived_at && !task.dropoff_arrived_at && (
                                    <button
                                        onClick={() => handleArrival(task.task_id, 'dropoff')}
                                        style={{
                                            padding: '12px',
                                            backgroundColor: '#44aa44',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        ✓ Arrived at Dropoff
                                    </button>
                                )}

                                {task.status === 'in_progress' && task.dropoff_arrived_at && (
                                    <button
                                        onClick={() => handleOpenPODCapture(task)}
                                        style={{
                                            padding: '12px',
                                            backgroundColor: '#ff9944',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        📸 Capture POD & Complete
                                    </button>
                                )}
                            </div>
                    </div>
                ))}
            </div>
        )}

        {podTask && (
            <PODCaptureModal
                isOpen={showPODModal}
                onClose={() => {
                    setShowPODModal(false);
                    setPodTask(null);
                }}
                task={podTask}
                onComplete={handlePODComplete}
            />
        )}
    </div>
);
};

