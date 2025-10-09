/**
 * Workflow Diagram View
 * Visual representation of the status workflow and valid transitions
 */

import React from 'react';
import { statusTransitions, getTransitionDescription, WorkflowStatus } from '../../utils/workflowStateMachine';
import { ICONS } from '../../components/ui/Icons';

export const WorkflowDiagramView: React.FC = () => {
    const statuses = Object.keys(statusTransitions) as WorkflowStatus[];

    return React.createElement('div', { className: 'space-y-6 p-6' },
        // Header
        React.createElement('div', { className: 'bg-blue-50 border-l-4 border-blue-600 p-4' },
            React.createElement('div', { className: 'flex items-start' },
                React.createElement('div', { className: 'flex-shrink-0' },
                    React.createElement(ICONS.DocumentTextIcon, { className: 'h-6 w-6 text-blue-600' })
                ),
                React.createElement('div', { className: 'ml-3' },
                    React.createElement('h3', { className: 'text-lg font-medium text-blue-800' }, 'Material Request Workflow'),
                    React.createElement('p', { className: 'mt-2 text-sm text-blue-700' }, 
                        'This diagram shows all valid status transitions in the system. MC god mode can override restrictions.'
                    )
                )
            )
        ),

        // Legend
        React.createElement('div', { className: 'bg-white rounded-lg shadow p-4' },
            React.createElement('h4', { className: 'font-semibold text-gray-800 mb-3' }, 'Legend'),
            React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-3 text-sm' },
                React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('div', { className: 'w-4 h-4 bg-green-200 border-2 border-green-600 rounded' }),
                    React.createElement('span', null, 'Normal Status')
                ),
                React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('div', { className: 'w-4 h-4 bg-yellow-200 border-2 border-yellow-600 rounded' }),
                    React.createElement('span', null, 'Hold/Review')
                ),
                React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('div', { className: 'w-4 h-4 bg-blue-200 border-2 border-blue-600 rounded' }),
                    React.createElement('span', null, 'In Progress')
                ),
                React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('div', { className: 'w-4 h-4 bg-gray-300 border-2 border-gray-600 rounded' }),
                    React.createElement('span', null, 'Terminal')
                )
            )
        ),

        // Workflow states
        React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
            React.createElement('h4', { className: 'font-semibold text-gray-800 mb-4' }, 'Status Transitions'),
            React.createElement('div', { className: 'space-y-6' },
                statuses.map(status => {
                    const transitions = statusTransitions[status];
                    const getStatusColor = (s: string) => {
                        if (s === 'Cancelled') return 'bg-red-200 border-red-600 text-red-800';
                        if (s === 'Delivered') return 'bg-gray-300 border-gray-600 text-gray-800';
                        if (s === 'On Hold' || s === 'Pending Approval') return 'bg-yellow-200 border-yellow-600 text-yellow-800';
                        if (s === 'Picking' || s === 'In Transit') return 'bg-blue-200 border-blue-600 text-blue-800';
                        return 'bg-green-200 border-green-600 text-green-800';
                    };

                    return React.createElement('div', { key: status, className: 'border-l-4 border-gray-300 pl-4' },
                        React.createElement('div', { 
                            className: `inline-block px-4 py-2 rounded-lg border-2 font-semibold text-sm mb-3 ${getStatusColor(status)}`
                        }, status),
                        
                        transitions.length > 0 
                            ? React.createElement('div', { className: 'ml-8 space-y-2' },
                                React.createElement('p', { className: 'text-xs text-gray-500 font-semibold mb-2' }, 'CAN TRANSITION TO:'),
                                transitions.map(nextStatus => React.createElement('div', { 
                                    key: nextStatus, 
                                    className: 'flex items-start gap-2 text-sm'
                                },
                                    React.createElement('span', { className: 'text-gray-400 mt-1' }, '→'),
                                    React.createElement('div', null,
                                        React.createElement('span', { 
                                            className: `inline-block px-3 py-1 rounded-md border font-medium text-xs ${getStatusColor(nextStatus)}`
                                        }, nextStatus),
                                        React.createElement('p', { className: 'text-xs text-gray-600 mt-1' },
                                            getTransitionDescription(status, nextStatus)
                                        )
                                    )
                                ))
                            )
                            : React.createElement('p', { className: 'ml-8 text-sm text-gray-500 italic' }, 
                                '🔒 Terminal state - no forward transitions (MC can override)'
                            )
                    );
                })
            )
        ),

        // Notes
        React.createElement('div', { className: 'bg-purple-50 border-l-4 border-purple-600 p-4' },
            React.createElement('div', { className: 'flex items-start' },
                React.createElement('div', { className: 'flex-shrink-0' },
                    React.createElement(ICONS.ShieldCheckIcon, { className: 'h-6 w-6 text-purple-600' })
                ),
                React.createElement('div', { className: 'ml-3' },
                    React.createElement('h4', { className: 'text-sm font-medium text-purple-800' }, 'Material Coordinator (MC) God Mode'),
                    React.createElement('p', { className: 'mt-2 text-sm text-purple-700' },
                        'MCs can override any status transition, including backwards moves and transitions from terminal states. All overrides are logged in the audit trail.'
                    )
                )
            )
        )
    );
};

