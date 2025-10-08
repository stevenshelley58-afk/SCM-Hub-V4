import React, { useState } from 'react';
import { MaterialRequest } from '../../types/index';

interface OnHoldModalProps {
    isOpen: boolean;
    request: MaterialRequest;
    onClose: () => void;
    onConfirm: (reason: string, expectedResumeDate?: string, notes?: string) => void;
    currentUserName: string;
}

export const OnHoldModal: React.FC<OnHoldModalProps> = ({ isOpen, request, onClose, onConfirm, currentUserName }) => {
    const [reason, setReason] = useState('');
    const [expectedResumeDate, setExpectedResumeDate] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
        if (!reason.trim()) {
            alert('Please provide a reason for putting this request on hold.');
            return;
        }
        onConfirm(reason, expectedResumeDate || undefined, notes || undefined);
        // Reset form
        setReason('');
        setExpectedResumeDate('');
        setNotes('');
    };

    const handleCancel = () => {
        setReason('');
        setExpectedResumeDate('');
        setNotes('');
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
                React.createElement('h2', { className: 'text-xl font-bold text-gray-900' }, `Put ${request.id} On Hold`),
                React.createElement('p', { className: 'text-sm text-gray-500 mt-1' }, 'This request will be paused until resumed.')
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
                    )
                ),

                // Reason (required)
                React.createElement('div', null,
                    React.createElement('label', {
                        htmlFor: 'holdReason',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Reason *'),
                    React.createElement('select', {
                        id: 'holdReason',
                        value: reason,
                        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setReason(e.target.value),
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    },
                        React.createElement('option', { value: '' }, '-- Select Reason --'),
                        React.createElement('option', { value: 'Awaiting Material' }, 'Awaiting Material'),
                        React.createElement('option', { value: 'Requestor Not Available' }, 'Requestor Not Available'),
                        React.createElement('option', { value: 'Delivery Location Blocked' }, 'Delivery Location Blocked'),
                        React.createElement('option', { value: 'Work Order On Hold' }, 'Work Order On Hold'),
                        React.createElement('option', { value: 'Resource Unavailable' }, 'Resource Unavailable'),
                        React.createElement('option', { value: 'Other' }, 'Other')
                    )
                ),

                // Expected Resume Date (optional)
                React.createElement('div', null,
                    React.createElement('label', {
                        htmlFor: 'resumeDate',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Expected Resume Date (Optional)'),
                    React.createElement('input', {
                        type: 'date',
                        id: 'resumeDate',
                        value: expectedResumeDate,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setExpectedResumeDate(e.target.value),
                        min: new Date().toISOString().split('T')[0],
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    })
                ),

                // Notes (optional)
                React.createElement('div', null,
                    React.createElement('label', {
                        htmlFor: 'holdNotes',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Additional Notes (Optional)'),
                    React.createElement('textarea', {
                        id: 'holdNotes',
                        value: notes,
                        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value),
                        rows: 3,
                        placeholder: 'Any additional information...',
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    })
                ),

                // Warning message
                React.createElement('div', { className: 'bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800' },
                    React.createElement('p', null, '⚠️ This will pause all work on this request. Materials will remain locked.')
                )
            ),

            // Actions
            React.createElement('div', { className: 'flex justify-end gap-3 mt-6' },
                React.createElement('button', {
                    onClick: handleCancel,
                    className: 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
                }, 'Cancel'),
                React.createElement('button', {
                    onClick: handleSubmit,
                    className: 'px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700'
                }, 'Put On Hold')
            )
        )
    );
};

