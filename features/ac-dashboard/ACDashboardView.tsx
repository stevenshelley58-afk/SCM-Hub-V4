

import React, { useState, useEffect, useMemo } from 'react';
import { Table } from '../../components/ui/Table';
import { SummaryCard } from '../../components/ui/SummaryCard';
import { LockedMaterialsModal } from '../../components/ui/Modal';
import { StatusPill } from '../../components/ui/StatusPill';
import { ICONS } from '../../components/ui/Icons';
import { mockRequestsData, mockMaterialLocks, masterGridData } from '../../services/api';
// Fix: Corrected import path for types.
import { MaterialRequest } from '../../types/index';

interface ACDashboardViewProps {
    navigate: (view: string, params?: any) => void;
    openDetailPanel: (request: MaterialRequest) => void;
}

const ACDraggablePriorityQueue = ({ requests, setRequests, openDetailPanel }: { requests: MaterialRequest[], setRequests: (reqs: MaterialRequest[]) => void, openDetailPanel: (req: MaterialRequest) => void }) => {
    const [draggedItem, setDraggedItem] = useState<MaterialRequest | null>(null);
    const [dragOverItem, setDragOverItem] = useState<MaterialRequest | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: MaterialRequest) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
        e.currentTarget.classList.add('dragging');
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, item: MaterialRequest) => {
        e.preventDefault();
        if (item.id !== draggedItem?.id) {
            setDragOverItem(item);
        }
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        setDragOverItem(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetItem: MaterialRequest) => {
        e.preventDefault();
        if (draggedItem && draggedItem.id !== targetItem.id) {
            const fromIndex = requests.findIndex(i => i.id === draggedItem.id);
            const toIndex = requests.findIndex(i => i.id === targetItem.id);
            const newItems = [...requests];
            const [removed] = newItems.splice(fromIndex, 1);
            newItems.splice(toIndex, 0, removed);
            setRequests(newItems.map((item, index) => ({...item, acPriority: index + 1})));
        }
        setDraggedItem(null);
        setDragOverItem(null);
    };
    
    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('dragging');
        setDraggedItem(null);
        setDragOverItem(null);
    };

    return React.createElement('div', { className: 'space-y-2' },
        requests.map(req => {
            const isDragOver = dragOverItem?.id === req.id;
            // Fix: Extracted props to an `any` typed object to bypass incorrect type inference for DOM attributes like `draggable`.
            const draggableDivProps: any = {
                key: req.id,
                draggable: true,
                onDragStart: (e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, req),
                onDragOver: (e: React.DragEvent<HTMLDivElement>) => handleDragOver(e, req),
                onDragLeave: handleDragLeave,
                onDrop: (e: React.DragEvent<HTMLDivElement>) => handleDrop(e, req),
                onDragEnd: handleDragEnd,
                onClick: () => openDetailPanel(req),
                className: 'flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:bg-gray-50 hover:shadow-sm'
            };

            return React.createElement('div', { key: req.id },
                isDragOver && draggedItem && requests.findIndex(i=>i.id === draggedItem.id) > requests.findIndex(i=>i.id === req.id) && React.createElement('div', {className: 'drop-indicator'}),
                React.createElement('div', draggableDivProps,
                    React.createElement('div', { className: 'flex items-center space-x-4' },
                        React.createElement('div', { className: 'text-gray-400 font-bold text-lg' }, req.acPriority),
                        React.createElement('div', null,
                            React.createElement('p', { className: 'font-semibold text-blue-600' }, req.id),
                            React.createElement('p', { className: 'text-sm text-gray-500' }, `To: ${req.DeliveryLocation} | Items: ${req.items}`)
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement('span', { className: `px-2 py-0.5 text-xs font-bold ${req.priority === 'P1' ? 'text-red-700 bg-red-100' : 'text-gray-600 bg-gray-100'} rounded-full`}, req.priority)
                    )
                ),
                isDragOver && draggedItem && requests.findIndex(i=>i.id === draggedItem.id) < requests.findIndex(i=>i.id === req.id) && React.createElement('div', {className: 'drop-indicator'})
            );
        })
    );
};

export const ACDashboardView = ({ openDetailPanel }: ACDashboardViewProps) => {
    const [activeTab, setActiveTab] = useState('priorityQueue');
    const [isLockedModalOpen, setLockedModalOpen] = useState(false);
    const [priorityQueue, setPriorityQueue] = useState<MaterialRequest[]>([]);

    useEffect(() => {
        const submitted = mockRequestsData
            .filter(r => r.status === 'Submitted')
            .sort((a,b) => (a.acPriority || 999) - (b.acPriority || 999)) as MaterialRequest[];
        setPriorityQueue(submitted);
    }, []);

    const handleSetPriorityQueue = (newQueue: MaterialRequest[]) => {
        setPriorityQueue(newQueue);
        newQueue.forEach(item => {
            const masterItem = mockRequestsData.find(r => r.id === item.id);
            if (masterItem) masterItem.acPriority = item.acPriority;
        });
    };

    const tableColumns = useMemo(() => [
        { accessorKey: 'id', header: 'Request ID', cell: ({value}: {value: string}) => React.createElement('span', { className: 'font-mono font-semibold text-blue-600'}, value) },
        { accessorKey: 'status', header: 'Status', cell: ({value}: {value: string}) => React.createElement(StatusPill, { status: value }) },
        { accessorKey: 'priority', header: 'Priority', cell: ({value}: {value: string}) => React.createElement('span', { className: `px-2 py-0.5 text-xs font-bold ${value === 'P1' ? 'text-red-700 bg-red-100' : 'text-gray-600 bg-gray-100'} rounded-full`}, value) },
        { accessorKey: 'items', header: '# of Items' },
        { accessorKey: 'workOrders', header: 'Work Order(s)', cell: ({value}: {value: string}) => React.createElement('span', {className: 'font-mono'}, value) },
        { accessorKey: 'createdDate', header: 'Created Date' },
    ], []);
    
    const dataWithClick = useMemo(() => mockRequestsData.map(req => ({ ...req, onClick: openDetailPanel })), [openDetailPanel]);

    return React.createElement('div', { className: 'space-y-6' },
        React.createElement(LockedMaterialsModal, { isOpen: isLockedModalOpen, onClose: () => setLockedModalOpen(false), mockMaterialLocks, masterGridData }),
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
            React.createElement(SummaryCard, { 
                title: "⚠️ My Scope's Partial Picks", 
                value: mockRequestsData.filter(r => r.status === 'Partial Pick - Open' || r.status === 'Partial Pick - Closed').length, 
                icon: React.createElement(ICONS.ExclamationTriangleIcon, {}),
                color: 'amber',
                onClick: () => alert('Navigate to pre-filtered list of exceptions.')
            }),
            React.createElement(SummaryCard, {
                title: "... My Scope's Queue Position",
                icon: React.createElement(ICONS.QueueListIcon, {className: 'h-6 w-6'}),
                color: 'blue',
            }, React.createElement('div', {className: 'mt-2 text-xs space-y-1 text-gray-600'},
                React.createElement('p', null, React.createElement('strong', {className: 'font-bold text-gray-800'}, '8 requests'), ' in the Qube queue.'),
                React.createElement('p', null, React.createElement('strong', {className: 'font-bold text-gray-800'}, 'Highest Priority Item: '), 'MRF-1232 at position #2.'),
                React.createElement('p', null, React.createElement('strong', {className: 'font-bold text-gray-800'}, 'Next Item to be Picked: '), 'MRF-1235 at position #7.')
            )),
            React.createElement(SummaryCard, {
                title: "🔒 Locked Materials",
                value: Object.keys(mockMaterialLocks).length,
                icon: React.createElement(ICONS.LockClosedIcon, {}),
                color: 'gray',
                onClick: () => setLockedModalOpen(true)
            })
        ),
        React.createElement('div', { className: 'bg-white rounded-xl border border-gray-200' },
            React.createElement('div', { className: 'border-b px-4' },
                React.createElement('nav', { className: '-mb-px flex space-x-6' },
                    React.createElement('button', {
                        onClick: () => setActiveTab('priorityQueue'),
                        className: `py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'priorityQueue' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                    }, '🚀 AC Priority Queue'),
                    React.createElement('button', {
                        onClick: () => setActiveTab('allRequests'),
                        className: `py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'allRequests' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                    }, 'All Scope Requests')
                )
            ),
            React.createElement('div', { className: 'p-4' },
                activeTab === 'priorityQueue' ?
                    React.createElement(ACDraggablePriorityQueue, { requests: priorityQueue, setRequests: handleSetPriorityQueue, openDetailPanel }) :
                    React.createElement(Table, { data: dataWithClick, columns: tableColumns, uniqueId: 'id' })
            )
        )
    );
};