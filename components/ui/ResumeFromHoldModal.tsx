import React, { useState } from 'react';
import { MaterialRequest } from '../../types/index';

interface ResumeFromHoldModalProps {
    isOpen: boolean;
    request: MaterialRequest;
    onClose: () => void;
    onConfirm: (notes?: string) => void;
    currentUserName: string;
}

export const ResumeFromHoldModal: React.FC<ResumeFromHoldModalProps> = ({ isOpen, request, onClose, onConfirm, currentUserName }) => {
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
        onConfirm(notes || undefined);
        setNotes('');
    };

    const handleCancel = () => {
        setNotes('');
        onClose();
    };

    if (!isOpen) return null;

    const onHoldInfo = request.onHoldInfo;

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
                React.createElement('h2', { className: 'text-xl font-bold text-green-900' }, `Resume ${request.id}?`),
                React.createElement('p', { className: 'text-sm text-gray-500 mt-1' }, 'Work will continue on this request.')
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

                // On Hold info
                onHoldInfo && React.createElement('div', { className: 'bg-yellow-50 border border-yellow-200 rounded p-3 text-sm' },
                    React.createElement('p', { className: 'font-semibold text-yellow-900 mb-1' }, 'Currently On Hold:'),
                    React.createElement('p', { className: 'text-yellow-800' },
                        React.createElement('strong', null, 'Reason: '),
                        onHoldInfo.reason
                    ),
                    React.createElement('p', { className: 'text-yellow-800' },
                        React.createElement('strong', null, 'Put on hold by: '),
                        onHoldInfo.putOnHoldBy
                    ),
                    React.createElement('p', { className: 'text-yellow-800' },
                        React.createElement('strong', null, 'Date: '),
                        new Date(onHoldInfo.putOnHoldAt).toLocaleString()
                    ),
                    onHoldInfo.expectedResumeDate && React.createElement('p', { className: 'text-yellow-800' },
                        React.createElement('strong', null, 'Expected resume: '),
                        new Date(onHoldInfo.expectedResumeDate).toLocaleDateString()
                    )
                ),

                // Notes (optional)
                React.createElement('div', null,
                    React.createElement('label', {
                        htmlFor: 'resumeNotes',
                        className: 'block text-sm font-medium text-gray-700 mb-1'
                    }, 'Resume Notes (Optional)'),
                    React.createElement('textarea', {
                        id: 'resumeNotes',
                        value: notes,
                        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value),
                        rows: 2,
                        placeholder: 'Why is this being resumed? Any updates?',
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                    })
                ),

                // Info message
                React.createElement('div', { className: 'bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800' },
                    React.createElement('p', null, '✅ Request will return to "Submitted" status and work can continue.')
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
                    className: 'px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700'
                }, '▶️ Resume Request')
            )
        )
    );
};

