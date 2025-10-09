/**
 * Task Filters Component
 * Advanced filtering and search for logistics tasks
 */

import React from 'react';
import type { LogisticsTaskType, LogisticsTaskStatus, LogisticsTaskPriority } from '../../types';

interface TaskFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    statusFilter: LogisticsTaskStatus | 'all';
    onStatusFilterChange: (value: LogisticsTaskStatus | 'all') => void;
    typeFilter: LogisticsTaskType | 'all';
    onTypeFilterChange: (value: LogisticsTaskType | 'all') => void;
    priorityFilter: LogisticsTaskPriority | 'all';
    onPriorityFilterChange: (value: LogisticsTaskPriority | 'all') => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    typeFilter,
    onTypeFilterChange,
    priorityFilter,
    onPriorityFilterChange,
}) => {
    return (
        <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            marginBottom: '16px',
        }}>
            <div style={{ marginBottom: '12px' }}>
                <input
                    type="search"
                    placeholder="Search tasks by description, task number, or location..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                    }}
                />
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
            }}>
                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#666',
                    }}>
                        Status
                    </label>
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusFilterChange(e.target.value as any)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                        }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="new">New</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="verified">Verified</option>
                        <option value="closed">Closed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="exception">Exception</option>
                        <option value="on_hold">On Hold</option>
                    </select>
                </div>

                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#666',
                    }}>
                        Task Type
                    </label>
                    <select
                        value={typeFilter}
                        onChange={(e) => onTypeFilterChange(e.target.value as any)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                        }}
                    >
                        <option value="all">All Types</option>
                        <option value="delivery">Delivery</option>
                        <option value="collection">Collection</option>
                        <option value="container_move">Container Move</option>
                        <option value="yard_work">Yard Work</option>
                        <option value="project_move">Project Move</option>
                        <option value="backload">Backload</option>
                        <option value="adhoc">Ad-hoc</option>
                    </select>
                </div>

                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#666',
                    }}>
                        Priority
                    </label>
                    <select
                        value={priorityFilter}
                        onChange={(e) => onPriorityFilterChange(e.target.value as any)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                        }}
                    >
                        <option value="all">All Priorities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>

            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all') && (
                <button
                    onClick={() => {
                        onSearchChange('');
                        onStatusFilterChange('all');
                        onTypeFilterChange('all');
                        onPriorityFilterChange('all');
                    }}
                    style={{
                        marginTop: '12px',
                        padding: '6px 12px',
                        backgroundColor: '#f0f0f0',
                        color: '#666',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                    }}
                >
                    Clear All Filters
                </button>
            )}
        </div>
    );
};

