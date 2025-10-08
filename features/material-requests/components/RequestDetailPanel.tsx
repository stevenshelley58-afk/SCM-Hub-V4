
import React from 'react';
import { ICONS } from '../../../components/ui/Icons';
import { StatusPill } from '../../../components/ui/StatusPill';
// Fix: Corrected import path for types.
import { MaterialRequest, User } from '../../../types/index';

interface RequestDetailPanelProps {
    request: MaterialRequest | null;
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
}

export const RequestDetailPanel = ({ request, isOpen, onClose, currentUser }: RequestDetailPanelProps) => {
     if (!request) return null;
     const isDelivered = request.status === 'Delivered';
     const canEdit = request.status === 'Submitted';

     return React.createElement('div', { className: `fixed top-0 right-0 h-full bg-white shadow-2xl z-50 w-full max-w-md transition-all ${isOpen ? 'transform-translate-x-0' : 'transform-translate-x-full'}`},
        React.createElement('div', { className: "p-6 border-b flex items-center justify-between" },
            React.createElement('div', null,
                React.createElement('h2', { className: "text-lg font-bold text-gray-900" }, `Details for ${request.id}`),
                React.createElement(StatusPill, { status: request.status })
            ),
            React.createElement('button', { onClick: onClose, className: "text-gray-500 hover:text-gray-800" }, React.createElement(ICONS.XMarkIcon, null))
        ),
        React.createElement('div', { className: "p-4 border-b" },
             canEdit && React.createElement('div', { className: 'flex items-center space-x-2' },
                React.createElement('button', { className: "flex items-center space-x-2 w-full justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" }, React.createElement(ICONS.PencilIcon, null), React.createElement('span', null, 'Edit Request')),
                React.createElement('button', { className: "flex items-center space-x-2 w-full justify-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100" }, React.createElement(ICONS.TrashIcon, null), React.createElement('span', null, 'Delete Request'))
             )
        ),
        React.createElement('div', { className: "p-6 overflow-y-auto h-[calc(100vh-145px)]" },
            React.createElement('div', { className: 'space-y-6' },
                currentUser.role === 'Area Coordinator' && !isDelivered && React.createElement('div', null,
                    React.createElement('h3', { className: 'font-semibold text-gray-700 mb-2' }, 'AC Actions'),
                    React.createElement('div', { className: 'p-4 border rounded-lg bg-amber-50 border-amber-200' },
                        React.createElement('label', { htmlFor: 'ac-comment', className: 'block text-sm font-medium text-gray-800 mb-1' }, 'Add Comment / Escalate'),
                        React.createElement('textarea', { 
                            id: 'ac-comment', 
                            rows: 4, 
                            placeholder: 'Type your comment here. Use @MC to notify Material Coordinator...', 
                            className: 'w-full px-3 py-2 border rounded-md text-sm border-amber-300 focus:ring-2 focus:ring-amber-400 focus:border-amber-400' 
                        }),
                        React.createElement('button', {
                            onClick: () => alert('Comment submitted! Material Coordinator has been notified.'),
                            className: 'mt-2 w-full px-4 py-2 text-sm font-medium text-white bg-amber-500 border border-transparent rounded-md hover:bg-amber-600'
                        }, 'Submit Comment')
                    )
                ),
                React.createElement('div', null,
                    React.createElement('h3', { className: 'font-semibold text-gray-700 mb-2' }, 'Delivery Details'),
                    React.createElement('p', { className: 'text-sm text-gray-600' }, 'Mock delivery details would appear here.')
                ),
                React.createElement('div', null,
                    React.createElement('h3', { className: 'font-semibold text-gray-700 mb-2' }, 'Line Items'),
                    React.createElement('p', { className: 'text-sm text-gray-600' }, 'A list of line items for this request would appear here.')
                ),
                isDelivered && React.createElement('div', null,
                    React.createElement('h3', { className: 'font-semibold text-gray-700 mb-2' }, 'Delivery & POD Information'),
                    React.createElement('div', { className: 'space-y-4' },
                        React.createElement('div', {className: 'p-4 border rounded-lg bg-gray-50'},
                            React.createElement('p', { className: 'text-xs font-medium text-gray-500' }, 'SIGNATURE'),
                            React.createElement('p', { className: 'font-serif text-2xl text-gray-800 italic' }, 'Jane Doe')
                        ),
                        React.createElement('div', {className: 'p-4 border rounded-lg bg-gray-50'},
                            React.createElement('p', { className: 'text-xs font-medium text-gray-500 mb-2' }, 'PHOTO'),
                            React.createElement('div', { className: 'w-full h-32 bg-gray-300 rounded flex items-center justify-center text-gray-500' }, 'POD Photo Placeholder')
                        )
                    )
                ),
                React.createElement('div', null,
                    React.createElement('h3', { className: 'font-semibold text-gray-700 mb-2' }, 'History & Comments'),
                    React.createElement('p', { className: 'text-sm text-gray-600' }, 'A timeline of events and comments would appear here.')
                ),
            )
        )
    );
};
