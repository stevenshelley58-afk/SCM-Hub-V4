/**
 * Logistics Dispatcher View
 * Main view for MLC (Materials Logistics Coordinator) to manage task queue
 */

import React, { useState, useEffect } from 'react';
import { taskService } from '../../services/logistics/taskService';
import { driverService } from '../../services/logistics/driverService';
import { vehicleService } from '../../services/logistics/vehicleService';
import { CreateTaskModal } from '../../components/logistics/CreateTaskModal';
import { SLACountdown } from '../../components/logistics/SLACountdown';
import { TaskFilters } from '../../components/logistics/TaskFilters';
import { TaskDetailModal } from '../../components/logistics/TaskDetailModal';
import type { LogisticsTask, Driver, Vehicle, LogisticsTaskType, LogisticsTaskStatus, LogisticsTaskPriority } from '../../types';

export const LogisticsDispatcherView: React.FC = () => {
    const [tasks, setTasks] = useState<LogisticsTask[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedTask, setSelectedTask] = useState<LogisticsTask | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<LogisticsTaskStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<LogisticsTaskType | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = useState<LogisticsTaskPriority | 'all'>('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [tasksData, driversData, vehiclesData] = await Promise.all([
                taskService.listTasks({}),
                driverService.listDrivers(true),
                vehicleService.listVehicles(true),
            ]);

            setTasks(tasksData);
            setDrivers(driversData);
            setVehicles(vehiclesData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter tasks based on search and filters
    const filteredTasks = tasks.filter(task => {
        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                task.task_number.toLowerCase().includes(searchLower) ||
                task.description.toLowerCase().includes(searchLower) ||
                task.pickup.location.toLowerCase().includes(searchLower) ||
                task.dropoff.location.toLowerCase().includes(searchLower) ||
                task.requester.name.toLowerCase().includes(searchLower);
            
            if (!matchesSearch) return false;
        }

        // Status filter
        if (statusFilter !== 'all' && task.status !== statusFilter) {
            return false;
        }

        // Type filter
        if (typeFilter !== 'all' && task.type !== typeFilter) {
            return false;
        }

        // Priority filter
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
            return false;
        }

        return true;
    });

    const handleAssignTask = async (taskId: string, driverId: string, vehicleId: string) => {
        try {
            await taskService.assignTask(taskId, driverId, vehicleId);
            await loadData();
            alert('Task assigned successfully!');
        } catch (error: any) {
            alert(`Error assigning task: ${error.message}`);
        }
    };

    const getTasksByStatus = (tasksToGroup: LogisticsTask[]) => {
        return tasksToGroup.reduce((acc, task) => {
            if (!acc[task.status]) {
                acc[task.status] = [];
            }
            acc[task.status].push(task);
            return acc;
        }, {} as Record<string, LogisticsTask[]>);
    };

    const tasksByStatus = getTasksByStatus(filteredTasks);

    return (
        <div className="logistics-dispatcher-view" style={{ padding: '20px' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px' 
            }}>
                <h1>📦 Logistics Dispatcher</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#44aa44',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }}
                    >
                        + Create Task
                    </button>
                </div>
            </div>

            <TaskFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                priorityFilter={priorityFilter}
                onPriorityFilterChange={setPriorityFilter}
            />

            <div style={{ 
                display: 'flex', 
                gap: '10px',
                marginBottom: '20px' 
            }}>
                <button 
                    onClick={() => setStatusFilter('all')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: statusFilter === 'all' ? '#0066cc' : '#f0f0f0',
                            color: statusFilter === 'all' ? 'white' : 'black',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        All Tasks ({filteredTasks.length})
                    </button>
                    <button 
                        onClick={() => setStatusFilter('new')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: statusFilter === 'new' ? '#0066cc' : '#f0f0f0',
                            color: statusFilter === 'new' ? 'white' : 'black',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        New ({tasksByStatus['new']?.length || 0})
                    </button>
                    <button 
                        onClick={() => setStatusFilter('scheduled')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: statusFilter === 'scheduled' ? '#0066cc' : '#f0f0f0',
                            color: statusFilter === 'scheduled' ? 'white' : 'black',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        Scheduled ({tasksByStatus['scheduled']?.length || 0})
                    </button>
                    <button 
                        onClick={() => setStatusFilter('in_progress')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: statusFilter === 'in_progress' ? '#0066cc' : '#f0f0f0',
                            color: statusFilter === 'in_progress' ? 'white' : 'black',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        In Progress ({tasksByStatus['in_progress']?.length || 0})
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Loading tasks...</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                    {/* Task Queue */}
                    <div>
                        <h2>Task Queue ({filteredTasks.length})</h2>
                        {filteredTasks.length === 0 ? (
                            <div style={{
                                padding: '40px',
                                textAlign: 'center',
                                backgroundColor: '#f9f9f9',
                                borderRadius: '8px',
                            }}>
                                <p>No tasks found matching your filters</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {filteredTasks.map(task => (
                                    <div
                                        key={task.task_id}
                                        onClick={() => {
                                            setSelectedTask(task);
                                            setShowDetailModal(true);
                                        }}
                                        style={{
                                            padding: '16px',
                                            backgroundColor: selectedTask?.task_id === task.task_id ? '#e6f3ff' : 'white',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <strong>{task.task_number}</strong>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    backgroundColor: 
                                                        task.priority === 'critical' ? '#ff4444' :
                                                        task.priority === 'high' ? '#ff9944' :
                                                        task.priority === 'normal' ? '#44aa44' : '#888',
                                                    color: 'white',
                                                }}>
                                                    {task.priority.toUpperCase()}
                                                </span>
                                                {task.sla_target_at && (
                                                    <SLACountdown 
                                                        slaTargetAt={task.sla_target_at} 
                                                        status={task.status} 
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                                            <strong>{task.type}</strong> - {task.description}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                            From: {task.pickup.location} → To: {task.dropoff.location}
                                        </div>
                                        {task.driver && (
                                            <div style={{ fontSize: '12px', color: '#0066cc', marginTop: '4px' }}>
                                                Driver: {task.driver.name}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Task Details & Assignment */}
                    <div>
                        {selectedTask ? (
                            <div style={{
                                backgroundColor: 'white',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '16px',
                            }}>
                                <h3>Task Details</h3>
                                <div style={{ marginBottom: '16px' }}>
                                    <p><strong>Task Number:</strong> {selectedTask.task_number}</p>
                                    <p><strong>Type:</strong> {selectedTask.type}</p>
                                    <p><strong>Priority:</strong> {selectedTask.priority}</p>
                                    <p><strong>Status:</strong> {selectedTask.status}</p>
                                    <p><strong>Description:</strong> {selectedTask.description}</p>
                                    <p><strong>Requester:</strong> {selectedTask.requester.name}</p>
                                    <p><strong>Pickup:</strong> {selectedTask.pickup.location}</p>
                                    <p><strong>Dropoff:</strong> {selectedTask.dropoff.location}</p>
                                    <p><strong>Requested Date:</strong> {new Date(selectedTask.requested_date).toLocaleString()}</p>
                                </div>

                                {selectedTask.status === 'new' && (
                                    <div>
                                        <h4>Assign Driver & Vehicle</h4>
                                        <div style={{ marginTop: '8px' }}>
                                            <label style={{ display: 'block', marginBottom: '4px' }}>Driver:</label>
                                            <select 
                                                id="driver-select"
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    marginBottom: '12px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #ddd',
                                                }}
                                            >
                                                <option value="">Select Driver</option>
                                                {drivers.filter(d => d.availability).map(driver => (
                                                    <option key={driver.driver_id} value={driver.driver_id}>
                                                        {driver.name} ({driver.status})
                                                    </option>
                                                ))}
                                            </select>

                                            <label style={{ display: 'block', marginBottom: '4px' }}>Vehicle:</label>
                                            <select 
                                                id="vehicle-select"
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    marginBottom: '12px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #ddd',
                                                }}
                                            >
                                                <option value="">Select Vehicle</option>
                                                {vehicles.filter(v => v.status === 'available').map(vehicle => (
                                                    <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                                                        {vehicle.registration} ({vehicle.vehicle_type})
                                                    </option>
                                                ))}
                                            </select>

                                            <button
                                                onClick={() => {
                                                    const driverSelect = document.getElementById('driver-select') as HTMLSelectElement;
                                                    const vehicleSelect = document.getElementById('vehicle-select') as HTMLSelectElement;
                                                    const driverId = driverSelect.value;
                                                    const vehicleId = vehicleSelect.value;
                                                    
                                                    if (driverId && vehicleId) {
                                                        handleAssignTask(selectedTask.task_id, driverId, vehicleId);
                                                    } else {
                                                        alert('Please select both driver and vehicle');
                                                    }
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    backgroundColor: '#0066cc',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                Assign Task
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{
                                backgroundColor: '#f9f9f9',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                padding: '40px',
                                textAlign: 'center',
                            }}>
                                <p>Select a task to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <CreateTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onTaskCreated={loadData}
            />

            {selectedTask && (
                <TaskDetailModal
                    isOpen={showDetailModal}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedTask(null);
                    }}
                    task={selectedTask}
                />
            )}
        </div>
    );
};

