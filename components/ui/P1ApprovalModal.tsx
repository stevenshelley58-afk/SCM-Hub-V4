import React, { useState } from 'react';
import { MaterialRequest } from '../../types/index';

interface P1ApprovalModalProps {
    isOpen: boolean;
    request: MaterialRequest;
    onClose: () => void;
    onApprove: (notes?: string) => void;
    onReject: (reason: string) => void;
    currentUserName: string;
}

export const P1ApprovalModal: React.FC<P1ApprovalModalProps> = ({ isOpen, request, onClose, onApprove, onReject, currentUserName }) => {
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);
    const [notes, setNotes] = useState('');
    const [reason, setReason] = useState('');

    const handleSubmit = () => {
        if (action === 'approve') {
            onApprove(notes || undefined);
        } else if (action === 'reject') {
            if (!reason.trim()) {
                alert('Please provide a reason for rejecting this P1 request.');
                return;
            }
            onReject(reason);
        }
        handleReset();
    };

    const handleReset = () => {
        setAction(null);
        setNotes('');
        setReason('');
    };

    const handleCancel = () => {
        handleReset();
        onClose();
    };

    if (!isOpen) return null;

    return React.createElement('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50',
        onClick: (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) handleCancel();
        }
    },
        React.createElement('div', {
            className: 'bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6'
        },
            // Header
            React.createElement('div', { className: 'mb-4 border-b pb-4' },
                React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', { className: 'text-3xl' }, '🔥'),
                    React.createElement('div', null,
                        React.createElement('h2', { className: 'text-xl font-bold text-red-900' }, `P1 Approval Required`),
                        React.createElement('p', { className: 'text-sm text-gray-500 mt-1' }, `Review ${request.id} before warehouse can begin picking`)
                    )
                )
            ),
            
            // Request Details
            React.createElement('div', { className: 'bg-red-50 border-l-4 border-red-600 p-4 mb-6' },
                React.createElement('h3', { className: 'font-semibold text-red-900 mb-2' }, 'Priority 1 Request Details'),
                React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
                    React.createElement('div', null,
                        React.createElement('p', { className: 'text-gray-600' }, 'Request ID:'),
                        React.createElement('p', { className: 'font-mono font-semibold text-gray-900' }, request.id)
                    ),
                    React.createElement('div', null,
                        React.createElement('p', { className: 'text-gray-600' }, 'Requestor:'),
                        React.createElement('p', { className: 'font-semibold text-gray-900' }, request.requestorName)
                    ),
                    React.createElement('div', null,
                        React.createElement('p', { className: 'text-gray-600' }, '# of Items:'),
                        React.createElement('p', { className: 'font-semibold text-gray-900' }, request.items)
                    ),
                    React.createElement('div', null,
                        React.createElement('p', { className: 'text-gray-600' }, 'Work Orders:'),
                        React.createElement('p', { className: 'font-semibold text-gray-900' }, request.workOrders)
                    ),
                    React.createElement('div', null,
                        React.createElement('p', { className: 'text-gray-600' }, 'Delivery Location:'),
                        React.createElement('p', { className: 'font-semibold text-gray-900' }, request.DeliveryLocation)
                    ),
                    React.createElement('div', null,
                        React.createElement('p', { className: 'text-gray-600' }, 'Required By:'),
                        React.createElement('p', { className: 'font-semibold text-red-700' }, new Date(request.RequiredByTimestamp).toLocaleString())
                    )
                )
            ),

            // Action Selection
            !action && React.createElement('div', { className: 'mb-6' },
                React.createElement('p', { className: 'text-sm font-medium text-gray-700 mb-3' }, 'Review this P1 request and take action:'),
                React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
                    React.createElement('button', {
                        onClick: () => setAction('approve'),
                        className: 'p-4 border-2 border-green-300 rounded-lg hover:bg-green-50 transition-colors'
                    },
                        React.createElement('div', { className: 'text-center' },
                            React.createElement('span', { className: 'text-3xl block mb-2' }, '✅'),
                            React.createElement('span', { className: 'font-semibold text-green-700' }, 'Approve Request'),
                            React.createElement('p', { className: 'text-xs text-gray-600 mt-1' }, 'Warehouse can start picking immediately')
                        )
                    ),
                    React.createElement('button', {
                        onClick: () => setAction('reject'),
                        className: 'p-4 border-2 border-red-300 rounded-lg hover:bg-red-50 transition-colors'
                    },
                        React.createElement('div', { className: 'text-center' },
                            React.createElement('span', { className: 'text-3xl block mb-2' }, '❌'),
                            React.createElement('span', { className: 'font-semibold text-red-700' }, 'Reject Request'),
                            React.createElement('p', { className: 'text-xs text-gray-600 mt-1' }, 'Request will be cancelled with reason')
                        )
                    )
                )
            ),

            // Approve Form
            action === 'approve' && React.createElement('div', { className: 'mb-6 space-y-4' },
                React.createElement('div', { className: 'bg-green-50 border border-green-200 rounded p-3' },
                    React.createElement('p', { className: 'text-sm font-semibold text-green-900' }, '✅ Approving P1 Request'),
                    React.createElement('p', { className: 'text-xs text-green-700 mt-1' }, 'This request will be released to the warehouse pick queue immediately.')
                ),
                React.createElement('div', null,
                    React.createElement('label', {
                        htmlFor: 'approvalNotes',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Approval Notes (Optional)'),
                    React.createElement('textarea', {
                        id: 'approvalNotes',
                        value: notes,
                        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value),
                        rows: 3,
                        placeholder: 'Any special instructions or notes for the warehouse...',
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                    })
                ),
                React.createElement('button', {
                    onClick: () => setAction(null),
                    className: 'text-sm text-gray-600 hover:text-gray-800'
                }, '← Back to selection')
            ),

            // Reject Form
            action === 'reject' && React.createElement('div', { className: 'mb-6 space-y-4' },
                React.createElement('div', { className: 'bg-red-50 border border-red-200 rounded p-3' },
                    React.createElement('p', { className: 'text-sm font-semibold text-red-900' }, '❌ Rejecting P1 Request'),
                    React.createElement('p', { className: 'text-xs text-red-700 mt-1' }, 'This request will be cancelled. The requestor will be notified.')
                ),
                React.createElement('div', null,
                    React.createElement('label', {
                        htmlFor: 'rejectReason',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Rejection Reason *'),
                    React.createElement('select', {
                        id: 'rejectReason',
                        value: reason,
                        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setReason(e.target.value),
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                    },
                        React.createElement('option', { value: '' }, '-- Select Reason --'),
                        React.createElement('option', { value: 'Not critical path' }, 'Not critical path'),
                        React.createElement('option', { value: 'Can wait until P2' }, 'Can wait until P2'),
                        React.createElement('option', { value: 'Insufficient justification' }, 'Insufficient justification'),
                        React.createElement('option', { value: 'Materials not available' }, 'Materials not available'),
                        React.createElement('option', { value: 'Incorrect priority assignment' }, 'Incorrect priority assignment'),
                        React.createElement('option', { value: 'Other' }, 'Other')
                    )
                ),
                React.createElement('button', {
                    onClick: () => setAction(null),
                    className: 'text-sm text-gray-600 hover:text-gray-800'
                }, '← Back to selection')
            ),

            // Actions
            React.createElement('div', { className: 'flex justify-end gap-3 border-t pt-4' },
                React.createElement('button', {
                    onClick: handleCancel,
                    className: 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
                }, 'Close'),
                action && React.createElement('button', {
                    onClick: handleSubmit,
                    disabled: action === 'reject' && !reason,
                    className: `px-6 py-2 text-sm font-medium text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed ${
                        action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    }`
                }, action === 'approve' ? '✅ Approve' : '❌ Reject')
            )
        )
    );
};

