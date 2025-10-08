import React, { useState } from 'react';
import { MaterialRequest } from '../../types/index';
import { autoUnlockMaterials } from '../../utils/materialLockHelpers';

interface CancelRequestModalProps {
    isOpen: boolean;
    request: MaterialRequest;
    onClose: () => void;
    onConfirm: (reason: string, notes?: string) => void;
    currentUserName: string;
}

export const CancelRequestModal: React.FC<CancelRequestModalProps> = ({ isOpen, request, onClose, onConfirm, currentUserName }) => {
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [confirmText, setConfirmText] = useState('');

    const handleSubmit = () => {
        if (!reason.trim()) {
            alert('Please provide a reason for cancelling this request.');
            return;
        }
        
        if (confirmText.toUpperCase() !== 'CANCEL') {
            alert('Please type CANCEL to confirm.');
            return;
        }

        onConfirm(reason, notes || undefined);
        
        // Reset form
        setReason('');
        setNotes('');
        setConfirmText('');
    };

    const handleCancel = () => {
        setReason('');
        setNotes('');
        setConfirmText('');
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
            className: 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6'
        },
            // Header
            React.createElement('div', { className: 'mb-4' },
                React.createElement('h2', { className: 'text-xl font-bold text-red-900' }, `Cancel ${request.id}?`),
                React.createElement('p', { className: 'text-sm text-gray-500 mt-1' }, 'This action cannot be undone.')
            ),
            
            // Form
            React.createElement('div', { className: 'space-y-4' },
                // Request details
                React.createElement('div', { className: 'bg-gray-50 p-3 rounded text-sm' },
                    React.createElement('p', null,
                        React.createElement('strong', null, 'Priority: '),
                        request.priority
                    ),
                    React.createElement('p', null,
                        React.createElement('strong', null, 'Delivery: '),
                        request.DeliveryLocation
                    ),
                    React.createElement('p', null,
                        React.createElement('strong', null, 'Items: '),
                        request.items
                    ),
                    React.createElement('p', null,
                        React.createElement('strong', null, 'Status: '),
                        request.status
                    )
                ),

                // Reason (required)
                React.createElement('div', null,
                    React.createElement('label', {
                        htmlFor: 'cancelReason',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Cancellation Reason *'),
                    React.createElement('select', {
                        id: 'cancelReason',
                        value: reason,
                        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setReason(e.target.value),
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                    },
                        React.createElement('option', { value: '' }, '-- Select Reason --'),
                        React.createElement('option', { value: 'Work Order Cancelled' }, 'Work Order Cancelled'),
                        React.createElement('option', { value: 'No Longer Required' }, 'No Longer Required'),
                        React.createElement('option', { value: 'Duplicate Request' }, 'Duplicate Request'),
                        React.createElement('option', { value: 'Wrong Materials Requested' }, 'Wrong Materials Requested'),
                        React.createElement('option', { value: 'Requestor Request' }, 'Requestor Request'),
                        React.createElement('option', { value: 'Project Scope Change' }, 'Project Scope Change'),
                        React.createElement('option', { value: 'Other' }, 'Other')
                    )
                ),

                // Notes (optional)
                React.createElement('div', null,
                    React.createElement('label', {
                        htmlFor: 'cancelNotes',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Additional Notes (Optional)'),
                    React.createElement('textarea', {
                        id: 'cancelNotes',
                        value: notes,
                        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value),
                        rows: 2,
                        placeholder: 'Any additional information...',
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500'
                    })
                ),

                // Confirmation input
                React.createElement('div', null,
                    React.createElement('label', {
                        htmlFor: 'confirmCancel',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Type CANCEL to confirm *'),
                    React.createElement('input', {
                        type: 'text',
                        id: 'confirmCancel',
                        value: confirmText,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setConfirmText(e.target.value),
                        placeholder: 'CANCEL',
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 font-mono'
                    })
                ),

                // Warning messages
                React.createElement('div', { className: 'bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800 space-y-1' },
                    React.createElement('p', { className: 'font-semibold' }, '⚠️ Cancelling this request will:'),
                    React.createElement('ul', { className: 'list-disc ml-5 mt-1 space-y-0.5' },
                        React.createElement('li', null, 'Stop all work immediately'),
                        React.createElement('li', null, 'Auto-unlock all associated materials'),
                        React.createElement('li', null, 'Permanently mark the request as Cancelled'),
                        React.createElement('li', null, 'Cannot be undone')
                    )
                )
            ),

            // Actions
            React.createElement('div', { className: 'flex justify-end gap-3 mt-6' },
                React.createElement('button', {
                    onClick: handleCancel,
                    className: 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
                }, 'Keep Request'),
                React.createElement('button', {
                    onClick: handleSubmit,
                    disabled: confirmText.toUpperCase() !== 'CANCEL' || !reason,
                    className: 'px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                }, 'Cancel Request')
            )
        )
    );
};

