import React, { useState } from 'react';
import { MaterialRequest } from '../../types/index';
import { mockRequestItems } from '../../services/api';

interface SplitMRFModalProps {
    isOpen: boolean;
    request: MaterialRequest;
    onClose: () => void;
    onConfirm: (splits: { splitA: string[]; splitB: string[] }, reason: string) => void;
    currentUserName: string;
}

export const SplitMRFModal: React.FC<SplitMRFModalProps> = ({ isOpen, request, onClose, onConfirm, currentUserName }) => {
    const items = mockRequestItems[request.id as keyof typeof mockRequestItems] || [];
    const [splitA, setSplitA] = useState<string[]>([]);
    const [splitB, setSplitB] = useState<string[]>([]);
    const [reason, setReason] = useState('');

    const handleToggleItem = (pKey: string, target: 'A' | 'B') => {
        if (target === 'A') {
            if (splitA.includes(pKey)) {
                setSplitA(splitA.filter(k => k !== pKey));
            } else {
                setSplitA([...splitA, pKey]);
                setSplitB(splitB.filter(k => k !== pKey));
            }
        } else {
            if (splitB.includes(pKey)) {
                setSplitB(splitB.filter(k => k !== pKey));
            } else {
                setSplitB([...splitB, pKey]);
                setSplitA(splitA.filter(k => k !== pKey));
            }
        }
    };

    const handleSubmit = () => {
        if (splitA.length === 0 || splitB.length === 0) {
            alert('Both splits must have at least one item.');
            return;
        }
        if (!reason.trim()) {
            alert('Please provide a reason for splitting this request.');
            return;
        }
        if (splitA.length + splitB.length !== items.length) {
            alert('All items must be assigned to a split.');
            return;
        }
        onConfirm({ splitA, splitB }, reason);
        handleReset();
    };

    const handleReset = () => {
        setSplitA([]);
        setSplitB([]);
        setReason('');
    };

    const handleCancel = () => {
        handleReset();
        onClose();
    };

    if (!isOpen) return null;

    const unassigned = items.filter(item => !splitA.includes(item.pKey) && !splitB.includes(item.pKey));

    return React.createElement('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4',
        onClick: (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) handleCancel();
        }
    },
        React.createElement('div', {
            className: 'bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto'
        },
            // Header
            React.createElement('div', { className: 'mb-4 border-b pb-4' },
                React.createElement('h2', { className: 'text-xl font-bold text-gray-900' }, `Split ${request.id}`),
                React.createElement('p', { className: 'text-sm text-gray-500 mt-1' }, 
                    `Divide this request into two separate MRFs. Total items: ${items.length}`
                )
            ),
            
            // Reason
            React.createElement('div', { className: 'mb-6' },
                React.createElement('label', {
                    htmlFor: 'splitReason',
                    className: 'block text-sm font-medium text-gray-700 mb-2'
                }, 'Reason for Split *'),
                React.createElement('select', {
                    id: 'splitReason',
                    value: reason,
                    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setReason(e.target.value),
                    className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                },
                    React.createElement('option', { value: '' }, '-- Select Reason --'),
                    React.createElement('option', { value: 'Partial materials available' }, 'Partial materials available'),
                    React.createElement('option', { value: 'Urgent items need priority' }, 'Urgent items need priority'),
                    React.createElement('option', { value: 'Different delivery locations' }, 'Different delivery locations'),
                    React.createElement('option', { value: 'Split between teams' }, 'Split between teams'),
                    React.createElement('option', { value: 'Capacity constraints' }, 'Capacity constraints'),
                    React.createElement('option', { value: 'Other' }, 'Other')
                )
            ),

            // Split containers
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-6' },
                // Unassigned items
                React.createElement('div', { className: 'border-2 border-dashed border-gray-300 rounded-lg p-4' },
                    React.createElement('h3', { className: 'font-semibold text-gray-700 mb-3 text-center' }, 
                        `Unassigned (${unassigned.length})`
                    ),
                    React.createElement('div', { className: 'space-y-2' },
                        unassigned.map(item =>
                            React.createElement('div', {
                                key: item.pKey,
                                className: 'p-3 bg-gray-50 rounded border border-gray-200 text-sm'
                            },
                                React.createElement('p', { className: 'font-medium text-gray-900' }, item.materialDescription),
                                React.createElement('p', { className: 'text-xs text-gray-500 mt-1' }, `Qty: ${item.qtyRequested}`),
                                React.createElement('div', { className: 'flex gap-2 mt-2' },
                                    React.createElement('button', {
                                        onClick: () => handleToggleItem(item.pKey, 'A'),
                                        className: 'flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600'
                                    }, '→ Split A'),
                                    React.createElement('button', {
                                        onClick: () => handleToggleItem(item.pKey, 'B'),
                                        className: 'flex-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600'
                                    }, '→ Split B')
                                )
                            )
                        ),
                        unassigned.length === 0 && React.createElement('p', { className: 'text-center text-gray-400 text-sm py-8' }, 
                            'All items assigned'
                        )
                    )
                ),

                // Split A
                React.createElement('div', { className: 'border-2 border-blue-300 rounded-lg p-4 bg-blue-50' },
                    React.createElement('h3', { className: 'font-semibold text-blue-700 mb-3 text-center' }, 
                        `Split A (${splitA.length})`
                    ),
                    React.createElement('div', { className: 'space-y-2' },
                        items.filter(i => splitA.includes(i.pKey)).map(item =>
                            React.createElement('div', {
                                key: item.pKey,
                                className: 'p-3 bg-white rounded border border-blue-200 text-sm'
                            },
                                React.createElement('p', { className: 'font-medium text-gray-900' }, item.materialDescription),
                                React.createElement('p', { className: 'text-xs text-gray-500 mt-1' }, `Qty: ${item.qtyRequested}`),
                                React.createElement('button', {
                                    onClick: () => handleToggleItem(item.pKey, 'A'),
                                    className: 'mt-2 w-full px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300'
                                }, '← Remove')
                            )
                        ),
                        splitA.length === 0 && React.createElement('p', { className: 'text-center text-blue-400 text-sm py-8' }, 
                            'Drag items here'
                        )
                    )
                ),

                // Split B
                React.createElement('div', { className: 'border-2 border-green-300 rounded-lg p-4 bg-green-50' },
                    React.createElement('h3', { className: 'font-semibold text-green-700 mb-3 text-center' }, 
                        `Split B (${splitB.length})`
                    ),
                    React.createElement('div', { className: 'space-y-2' },
                        items.filter(i => splitB.includes(i.pKey)).map(item =>
                            React.createElement('div', {
                                key: item.pKey,
                                className: 'p-3 bg-white rounded border border-green-200 text-sm'
                            },
                                React.createElement('p', { className: 'font-medium text-gray-900' }, item.materialDescription),
                                React.createElement('p', { className: 'text-xs text-gray-500 mt-1' }, `Qty: ${item.qtyRequested}`),
                                React.createElement('button', {
                                    onClick: () => handleToggleItem(item.pKey, 'B'),
                                    className: 'mt-2 w-full px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300'
                                }, '← Remove')
                            )
                        ),
                        splitB.length === 0 && React.createElement('p', { className: 'text-center text-green-400 text-sm py-8' }, 
                            'Drag items here'
                        )
                    )
                )
            ),

            // Warning
            React.createElement('div', { className: 'bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800 mb-4' },
                React.createElement('p', { className: 'font-semibold' }, '⚠️ Important:'),
                React.createElement('ul', { className: 'list-disc ml-5 mt-1 space-y-1' },
                    React.createElement('li', null, `Original ${request.id} will be cancelled`),
                    React.createElement('li', null, 'Two new MRFs will be created'),
                    React.createElement('li', null, 'This action cannot be undone'),
                    React.createElement('li', null, 'Materials will be re-locked to new MRFs')
                )
            ),

            // Actions
            React.createElement('div', { className: 'flex justify-between items-center' },
                React.createElement('div', { className: 'text-sm text-gray-500' },
                    `${splitA.length + splitB.length} of ${items.length} items assigned`
                ),
                React.createElement('div', { className: 'flex gap-3' },
                    React.createElement('button', {
                        onClick: handleCancel,
                        className: 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
                    }, 'Cancel'),
                    React.createElement('button', {
                        onClick: handleSubmit,
                        disabled: splitA.length === 0 || splitB.length === 0 || unassigned.length > 0 || !reason,
                        className: 'px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                    }, 'Split Request')
                )
            )
        )
    );
};

