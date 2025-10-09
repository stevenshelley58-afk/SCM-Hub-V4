/**
 * Priority Queue Management View
 * MC can visually manage and reorder the warehouse pick queue
 * Features:
 * - Drag-and-drop reordering
 * - MC priority flag (override AC priority)
 * - Visual queue position
 * - Auto-save changes
 */

import React, { useState, useEffect, useCallback } from 'react';
import { StatusPill } from '../../components/ui/StatusPill';
import { ICONS } from '../../components/ui/Icons';
import { mockRequestsData } from '../../services/api';
import { hasPermission } from '../../utils/permissions';
import { addStatusHistoryEntry } from '../../utils/statusHelpers';
import { MaterialRequest, User } from '../../types/index';

interface PriorityQueueViewProps {
    navigate: (view: string, params?: any) => void;
    currentUser: User;
}

export const PriorityQueueView: React.FC<PriorityQueueViewProps> = ({ navigate, currentUser }) => {
    const [queueData, setQueueData] = useState<MaterialRequest[]>([]);
    const [draggedItem, setDraggedItem] = useState<MaterialRequest | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkActions, setShowBulkActions] = useState(false);

    // Check permissions
    const canManageQueue = hasPermission(currentUser, 'god_mode');

    useEffect(() => {
        // Get all submitted and picking requests
        const activeRequests = mockRequestsData.filter(
            r => r.status === 'Submitted' || r.status === 'Picking'
        ) as MaterialRequest[];

        // Sort by current priority
        activeRequests.sort((a, b) => {
            // MC priority flag takes precedence
            if (a.MC_Priority_Flag && !b.MC_Priority_Flag) return -1;
            if (!a.MC_Priority_Flag && b.MC_Priority_Flag) return 1;
            
            // Then by MC queue position if set
            if (a.MC_Queue_Position !== undefined && b.MC_Queue_Position !== undefined) {
                return a.MC_Queue_Position - b.MC_Queue_Position;
            }
            if (a.MC_Queue_Position !== undefined) return -1;
            if (b.MC_Queue_Position !== undefined) return 1;
            
            // Then by priority (P1 > P2 > P3 > P4)
            const priorityOrder = { 'P1': 1, 'P2': 2, 'P3': 3, 'P4': 4 };
            const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 5;
            const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 5;
            if (aPriority !== bPriority) return aPriority - bPriority;
            
            // Finally by timestamp (earlier first)
            return new Date(a.RequiredByTimestamp).getTime() - new Date(b.RequiredByTimestamp).getTime();
        });

        setQueueData(activeRequests);
    }, []);

    const handleDragStart = useCallback((e: React.DragEvent, item: MaterialRequest) => {
        if (!canManageQueue) return;
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
    }, [canManageQueue]);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (!canManageQueue) return;
        setDragOverIndex(index);
    }, [canManageQueue]);

    const handleDragLeave = useCallback(() => {
        setDragOverIndex(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (!draggedItem || !canManageQueue) return;

        const dragIndex = queueData.findIndex(item => item.id === draggedItem.id);
        if (dragIndex === dropIndex) {
            setDraggedItem(null);
            setDragOverIndex(null);
            return;
        }

        // Reorder array
        const newQueue = [...queueData];
        const [removed] = newQueue.splice(dragIndex, 1);
        newQueue.splice(dropIndex, 0, removed);

        // Update MC_Queue_Position for all items
        newQueue.forEach((item, index) => {
            item.MC_Queue_Position = index + 1;
        });

        setQueueData(newQueue);
        setDraggedItem(null);
        setDragOverIndex(null);
        setHasChanges(true);
    }, [draggedItem, queueData, canManageQueue]);

    const handleToggleMCPriority = useCallback((request: MaterialRequest) => {
        if (!canManageQueue) return;

        const updated = queueData.map(r => {
            if (r.id === request.id) {
                const newFlag = !r.MC_Priority_Flag;
                
                // Add status history entry
                addStatusHistoryEntry(r, r.status, currentUser.name, 
                    newFlag ? 'MC Priority Flag ADDED' : 'MC Priority Flag REMOVED'
                );
                
                return { ...r, MC_Priority_Flag: newFlag };
            }
            return r;
        });

        // Re-sort with new priority
        updated.sort((a, b) => {
            if (a.MC_Priority_Flag && !b.MC_Priority_Flag) return -1;
            if (!a.MC_Priority_Flag && b.MC_Priority_Flag) return 1;
            if (a.MC_Queue_Position !== undefined && b.MC_Queue_Position !== undefined) {
                return a.MC_Queue_Position - b.MC_Queue_Position;
            }
            return 0;
        });

        setQueueData(updated);
        setHasChanges(true);
    }, [queueData, currentUser, canManageQueue]);

    const handleSaveChanges = useCallback(() => {
        // Update mockRequestsData with new queue positions
        queueData.forEach(item => {
            const request = mockRequestsData.find(r => r.id === item.id);
            if (request) {
                request.MC_Queue_Position = item.MC_Queue_Position;
                request.MC_Priority_Flag = item.MC_Priority_Flag;
                if (item.statusHistory) {
                    request.statusHistory = item.statusHistory;
                }
            }
        });

        setHasChanges(false);
        alert('✅ Queue order saved successfully!');
    }, [queueData]);

    const handleResetQueue = useCallback(() => {
        if (!confirm('Reset queue to default priority order? This will remove all MC overrides.')) return;

        const reset = queueData.map(r => ({
            ...r,
            MC_Queue_Position: undefined,
            MC_Priority_Flag: false
        }));

        // Re-sort by default priority
        reset.sort((a, b) => {
            const priorityOrder = { 'P1': 1, 'P2': 2, 'P3': 3, 'P4': 4 };
            const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 5;
            const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 5;
            if (aPriority !== bPriority) return aPriority - bPriority;
            return new Date(a.RequiredByTimestamp).getTime() - new Date(b.RequiredByTimestamp).getTime();
        });

        setQueueData(reset);
        setHasChanges(true);
    }, [queueData]);

    // Bulk selection handlers
    const handleSelectItem = useCallback((id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
        setShowBulkActions(newSelected.size > 0);
    }, [selectedIds]);

    const handleSelectAll = useCallback(() => {
        if (selectedIds.size === queueData.length) {
            setSelectedIds(new Set());
            setShowBulkActions(false);
        } else {
            setSelectedIds(new Set(queueData.map(r => r.id)));
            setShowBulkActions(true);
        }
    }, [queueData, selectedIds]);

    // Bulk action handlers
    const handleBulkAddMCPriority = useCallback(() => {
        if (selectedIds.size === 0) return;
        
        const updated = queueData.map(r => {
            if (selectedIds.has(r.id) && !r.MC_Priority_Flag) {
                addStatusHistoryEntry(r, r.status, currentUser.name, 'MC Priority Flag ADDED (bulk)');
                return { ...r, MC_Priority_Flag: true };
            }
            return r;
        });

        setQueueData(updated);
        setHasChanges(true);
        setSelectedIds(new Set());
        setShowBulkActions(false);
        alert(`✅ Added MC Priority flag to ${selectedIds.size} request(s)`);
    }, [selectedIds, queueData, currentUser]);

    const handleBulkRemoveMCPriority = useCallback(() => {
        if (selectedIds.size === 0) return;
        
        const updated = queueData.map(r => {
            if (selectedIds.has(r.id) && r.MC_Priority_Flag) {
                addStatusHistoryEntry(r, r.status, currentUser.name, 'MC Priority Flag REMOVED (bulk)');
                return { ...r, MC_Priority_Flag: false };
            }
            return r;
        });

        setQueueData(updated);
        setHasChanges(true);
        setSelectedIds(new Set());
        setShowBulkActions(false);
        alert(`✅ Removed MC Priority flag from ${selectedIds.size} request(s)`);
    }, [selectedIds, queueData, currentUser]);

    const handleBulkMoveToTop = useCallback(() => {
        if (selectedIds.size === 0) return;
        
        const selected = queueData.filter(r => selectedIds.has(r.id));
        const notSelected = queueData.filter(r => !selectedIds.has(r.id));
        
        const newQueue = [...selected, ...notSelected];
        newQueue.forEach((item, index) => {
            item.MC_Queue_Position = index + 1;
            if (selectedIds.has(item.id)) {
                addStatusHistoryEntry(item, item.status, currentUser.name, 'Moved to top of queue (bulk)');
            }
        });

        setQueueData(newQueue);
        setHasChanges(true);
        setSelectedIds(new Set());
        setShowBulkActions(false);
        alert(`✅ Moved ${selected.length} request(s) to top of queue`);
    }, [selectedIds, queueData, currentUser]);

    const handleBulkMoveToBottom = useCallback(() => {
        if (selectedIds.size === 0) return;
        
        const notSelected = queueData.filter(r => !selectedIds.has(r.id));
        const selected = queueData.filter(r => selectedIds.has(r.id));
        
        const newQueue = [...notSelected, ...selected];
        newQueue.forEach((item, index) => {
            item.MC_Queue_Position = index + 1;
            if (selectedIds.has(item.id)) {
                addStatusHistoryEntry(item, item.status, currentUser.name, 'Moved to bottom of queue (bulk)');
            }
        });

        setQueueData(newQueue);
        setHasChanges(true);
        setSelectedIds(new Set());
        setShowBulkActions(false);
        alert(`✅ Moved ${selected.length} request(s) to bottom of queue`);
    }, [selectedIds, queueData, currentUser]);

    if (!canManageQueue) {
        return React.createElement('div', { className: 'p-6' },
            React.createElement('div', { className: 'bg-red-50 border-l-4 border-red-600 p-4' },
                React.createElement('div', { className: 'flex items-start' },
                    React.createElement('div', { className: 'flex-shrink-0' },
                        React.createElement('span', { className: 'text-3xl' }, '🔒')
                    ),
                    React.createElement('div', { className: 'ml-3' },
                        React.createElement('h3', { className: 'text-sm font-medium text-red-800' }, 'Access Denied'),
                        React.createElement('p', { className: 'mt-2 text-sm text-red-700' }, 
                            'Only Material Coordinators (MC) can manage the priority queue.'
                        )
                    )
                )
            )
        );
    }

    return React.createElement('div', { className: 'space-y-4' },
        // Header with instructions
        React.createElement('div', { className: 'bg-blue-50 border-l-4 border-blue-600 p-4' },
            React.createElement('div', { className: 'flex items-start' },
                React.createElement('div', { className: 'flex-shrink-0' },
                    React.createElement(ICONS.QueueListIcon, { className: 'h-6 w-6 text-blue-600' })
                ),
                React.createElement('div', { className: 'ml-3 flex-1' },
                    React.createElement('h3', { className: 'text-sm font-medium text-blue-800' }, 'Priority Queue Management'),
                    React.createElement('div', { className: 'mt-2 text-sm text-blue-700' },
                        React.createElement('p', null, '🔄 Drag and drop to reorder the warehouse pick queue'),
                        React.createElement('p', null, '🚩 Click the flag icon to mark as MC Priority (moves to top)'),
                        React.createElement('p', null, '💾 Changes are saved automatically to the system')
                    )
                )
            )
        ),

        // Action buttons
        React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('div', { className: 'flex items-center gap-4' },
                React.createElement('div', { className: 'text-sm text-gray-600' },
                    React.createElement('span', { className: 'font-semibold' }, queueData.length),
                    ' requests in active queue'
                ),
                queueData.length > 0 && React.createElement('label', { className: 'flex items-center gap-2 text-sm text-gray-700 cursor-pointer' },
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: selectedIds.size === queueData.length && queueData.length > 0,
                        onChange: handleSelectAll,
                        className: 'w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                    }),
                    'Select All'
                )
            ),
            React.createElement('div', { className: 'flex gap-2' },
                hasChanges && React.createElement('button', {
                    onClick: handleSaveChanges,
                    className: 'px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 flex items-center gap-2'
                },
                    React.createElement('span', null, '💾'),
                    'Save Changes'
                ),
                React.createElement('button', {
                    onClick: handleResetQueue,
                    className: 'px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700'
                }, 'Reset Queue')
            )
        ),

        // Bulk actions toolbar
        showBulkActions && React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
            React.createElement('div', { className: 'flex items-center justify-between' },
                React.createElement('div', { className: 'text-sm font-medium text-blue-900' },
                    React.createElement('span', { className: 'font-bold' }, selectedIds.size),
                    ' request(s) selected'
                ),
                React.createElement('div', { className: 'flex flex-wrap gap-2' }, [
                    React.createElement('button', {
                        key: 'add-priority',
                        onClick: handleBulkAddMCPriority,
                        className: 'px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 flex items-center gap-1'
                    },
                        React.createElement('span', null, '🚩'),
                        'Add MC Priority'
                    ),
                    React.createElement('button', {
                        key: 'remove-priority',
                        onClick: handleBulkRemoveMCPriority,
                        className: 'px-3 py-1.5 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700'
                    }, 'Remove Priority'),
                    React.createElement('button', {
                        key: 'move-top',
                        onClick: handleBulkMoveToTop,
                        className: 'px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center gap-1'
                    },
                        React.createElement('span', null, '⬆️'),
                        'Move to Top'
                    ),
                    React.createElement('button', {
                        key: 'move-bottom',
                        onClick: handleBulkMoveToBottom,
                        className: 'px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center gap-1'
                    },
                        React.createElement('span', null, '⬇️'),
                        'Move to Bottom'
                    ),
                    React.createElement('button', {
                        key: 'deselect',
                        onClick: () => {
                            setSelectedIds(new Set());
                            setShowBulkActions(false);
                        },
                        className: 'px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50'
                    }, 'Deselect All')
                ])
            )
        ),

        // Queue list
        React.createElement('div', { className: 'bg-white rounded-lg shadow' },
            queueData.length === 0 ? React.createElement('div', { className: 'p-8 text-center text-gray-500' },
                React.createElement('p', null, 'No active requests in queue')
            ) : React.createElement('div', { className: 'divide-y divide-gray-200' },
                queueData.map((request, index) => React.createElement('div', {
                    key: request.id,
                    draggable: true,
                    onDragStart: (e) => handleDragStart(e, request),
                    onDragOver: (e) => handleDragOver(e, index),
                    onDragLeave: handleDragLeave,
                    onDrop: (e) => handleDrop(e, index),
                    className: `p-4 flex items-center gap-4 cursor-move hover:bg-gray-50 transition-colors ${
                        dragOverIndex === index ? 'border-t-4 border-blue-500' : ''
                    } ${draggedItem?.id === request.id ? 'opacity-50' : ''} ${
                        selectedIds.has(request.id) ? 'bg-blue-50' : ''
                    }`
                },
                    // Checkbox
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: selectedIds.has(request.id),
                        onChange: () => handleSelectItem(request.id),
                        onClick: (e: React.MouseEvent) => e.stopPropagation(),
                        className: 'w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0'
                    }),

                    // Queue position badge
                    React.createElement('div', { className: 'flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-lg text-gray-700' },
                        index + 1
                    ),

                    // Drag handle
                    React.createElement('div', { className: 'flex-shrink-0 text-gray-400' },
                        React.createElement(ICONS.EllipsisHorizontalIcon, { className: 'h-6 w-6 rotate-90' })
                    ),

                    // Request info
                    React.createElement('div', { className: 'flex-1 min-w-0' },
                        React.createElement('div', { className: 'flex items-center gap-2 mb-1' },
                            React.createElement('span', { className: 'font-mono font-semibold text-blue-600' }, request.id),
                            React.createElement(StatusPill, { status: request.status }),
                            request.MC_Priority_Flag && React.createElement('span', { className: 'px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full' }, 
                                '🚩 MC PRIORITY'
                            )
                        ),
                        React.createElement('div', { className: 'text-sm text-gray-600' },
                            React.createElement('span', null, `${request.items} items • ${request.priority} • Required: ${new Date(request.RequiredByTimestamp).toLocaleString()}`)
                        ),
                        request.DeliveryLocation && React.createElement('div', { className: 'text-xs text-gray-500 mt-1' },
                            `📍 ${request.DeliveryLocation}`
                        )
                    ),

                    // MC Priority toggle
                    React.createElement('button', {
                        onClick: () => handleToggleMCPriority(request),
                        className: `flex-shrink-0 p-2 rounded-full transition-colors ${
                            request.MC_Priority_Flag 
                                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`,
                        title: request.MC_Priority_Flag ? 'Remove MC Priority Flag' : 'Add MC Priority Flag'
                    },
                        React.createElement('span', { className: 'text-xl' }, '🚩')
                    ),

                    // View details button
                    React.createElement('button', {
                        onClick: () => navigate('picking', { request }),
                        className: 'flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700'
                    }, 'View')
                ))
            )
        ),

        // Warning if unsaved changes
        hasChanges && React.createElement('div', { className: 'bg-yellow-50 border-l-4 border-yellow-600 p-4' },
            React.createElement('div', { className: 'flex items-start' },
                React.createElement('div', { className: 'flex-shrink-0' },
                    React.createElement(ICONS.ExclamationTriangleIcon, { className: 'h-5 w-5 text-yellow-600' })
                ),
                React.createElement('div', { className: 'ml-3' },
                    React.createElement('p', { className: 'text-sm text-yellow-800 font-medium' }, 
                        '⚠️ You have unsaved changes. Click "Save Changes" to apply them to the warehouse queue.'
                    )
                )
            )
        )
    );
};

