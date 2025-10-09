


import React, { useState, useEffect } from 'react';
import { isFeatureEnabled } from '../../config/features';
// Fix: Corrected import path for types.
import { WOMaterial, User } from '../../types/index';

interface ConfirmationModalProps {
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    title: string;
    // Fix: Made children optional to resolve type errors.
    children?: React.ReactNode;
    confirmText?: string;
}

export const ConfirmationModal = ({ isOpen, onCancel, onConfirm, title, children, confirmText = 'Confirm' }: ConfirmationModalProps) => {
    if (!isOpen) return null;
    const isWarning = confirmText.toLowerCase().includes('delete') || confirmText.toLowerCase().includes('unselect');
    return React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center" },
        React.createElement('div', { className: "bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4" },
            React.createElement('h3', { className: "text-lg font-bold text-gray-900" }, title),
            React.createElement('div', { className: "mt-2 text-sm text-gray-600" }, children),
            React.createElement('div', { className: "mt-6 flex justify-end space-x-3" },
                React.createElement('button', { onClick: onCancel, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" }, 'Cancel'),
                React.createElement('button', { onClick: onConfirm, className: `px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md ${isWarning ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}` }, confirmText)
            )
        )
    );
};

interface DeliveryDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => void;
    selectedItems: WOMaterial[];
    currentUser: User;
}

export const DeliveryDetailsModal = ({ isOpen, onClose, onSubmit, selectedItems, currentUser }: DeliveryDetailsModalProps) => {
    const formConfig = [
        { "name": "DeliverTo", "label": "Deliver To", "type": "select", "required": true, "options_key": "DeliveryLocations" },
        { "name": "RecipientName", "label": "Recipient Name", "type": "text", "required": true, "default": "currentUser.name" },
        { "name": "ContactNumber", "label": "Contact Number", "type": "text", "required": true, "default": "currentUser.phone" },
        { "name": "Priority", "label": "Priority", "type": "select", "required": true, "options_key": "RequestPriorities" },
        { "name": "Comments", "label": "Comments / Special Instructions", "type": "textarea", "required": false }
    ];
    const optionsData = {
        DeliveryLocations: ['Ops Center Trailer 1', 'Laydown Yard 7', 'Unit 12 Work Area', 'Weld Shop'],
        RequestPriorities: ['P4 - Routine', 'P3 - Urgent', 'P2 - High', 'P1 - Shutdown Critical']
    };
    const [formData, setFormData] = useState<any>({});
    const [errors, setErrors] = useState<any>({});

    useEffect(() => {
        if (isOpen) {
            const initialData: { [key: string]: any } = {};
            formConfig.forEach(field => {
                if (field.default === 'currentUser.name') initialData[field.name] = currentUser.name;
                else if (field.default === 'currentUser.phone') initialData[field.name] = currentUser.phone;
                else initialData[field.name] = '';
            });
            setFormData(initialData);
            setErrors({});
        }
    }, [isOpen, currentUser]);

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            const newErrors = { ...errors };
            delete newErrors[name];
            setErrors(newErrors);
        }
    };
    
    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        formConfig.forEach(field => {
            if (field.required && !formData[field.name]) {
                newErrors[field.name] = `${field.label} is required.`;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit(formData);
        }
    };

    if (!isOpen) return null;

    // Fix: Extracted props to an `any` typed object to bypass incorrect type inference for DOM attributes.
    const modalContainerProps: any = {
        className: "fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4",
        onClick: onClose,
    };
    return React.createElement('div', modalContainerProps,
        React.createElement('div', { className: "bg-white rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]", onClick: e => e.stopPropagation() },
            React.createElement('div', { className: "p-5 border-b" }, React.createElement('h2', { className: "text-xl font-bold text-gray-800" }, 'New Material Request')),
            React.createElement('div', { className: "flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6" },
                React.createElement('div', { className: "md:col-span-1" },
                     React.createElement('h3', { className: "text-lg font-semibold text-gray-700 mb-3" }, '1. Review Your Materials'),
                     React.createElement('div', { className: "border rounded-lg p-3 bg-gray-50 max-h-80 overflow-y-auto" },
                        selectedItems.map(item => React.createElement('div', { key: item.pKey, className: "text-sm border-b last:border-b-0 py-2" },
                            React.createElement('p', { className: "font-semibold text-gray-800" }, item.materialDescription),
                            React.createElement('p', { className: "text-gray-500" }, `${item.jdeItemNo}  |  WO Qty: ${item.workOrderQty}`)
                        ))
                     )
                ),
                React.createElement('div', { className: "md:col-span-1" },
                     React.createElement('h3', { className: "text-lg font-semibold text-gray-700 mb-3" }, '2. Provide Delivery Details'),
                     React.createElement('div', { className: 'space-y-4' }, 
                        formConfig.map(field => {
                            const error = errors[field.name];
                            const commonProps: any = {
                                id: field.name, name: field.name,
                                className: `w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:border-blue-500 ${error ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'}`,
                                value: formData[field.name] || '',
                                onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.name, e.target.value)
                            };
                            return React.createElement('div', { key: field.name },
                                React.createElement('label', { htmlFor: field.name, className: "block text-sm font-medium text-gray-700 mb-1" }, field.label, field.required && React.createElement('span', { className: 'text-red-500' }, ' *')),
                                field.type === 'select' ? React.createElement('select', commonProps,
                                    React.createElement('option', { value: '' }, `Select ${field.label}...`),
                                    (optionsData[field.options_key as keyof typeof optionsData] || []).map(opt => React.createElement('option', { key: opt, value: opt }, opt))
                                ) :
                                field.type === 'textarea' ? React.createElement('textarea', { ...commonProps, rows: 3 }) :
                                React.createElement('input', { ...commonProps, type: 'text' }),
                                error && React.createElement('p', { className: 'text-xs text-red-600 mt-1' }, error),
                                // Show P1 approval notice if P1 is selected and feature is enabled
                                field.name === 'Priority' && formData.Priority?.includes('P1') && isFeatureEnabled('requireP1Approval') &&
                                    React.createElement('div', { className: 'mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800' },
                                        React.createElement('p', { className: 'font-semibold' }, '🔥 P1 requests require Material Coordinator approval'),
                                        React.createElement('p', { className: 'mt-1' }, 'Your request will go to the MC approval queue before the warehouse can begin picking.')
                                    )
                            );
                        })
                     )
                )
            ),
            React.createElement('div', { className: "p-5 border-t bg-gray-50 flex justify-end space-x-3 rounded-b-lg" },
                React.createElement('button', { onClick: onClose, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" }, 'Cancel'),
                React.createElement('button', { onClick: handleSubmit, className: "px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700" }, 'Submit Request')
            )
        )
    );
};

interface LockMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: WOMaterial;
    onSubmit: (comment: string) => void;
}

export const LockMaterialModal = ({ isOpen, onClose, item, onSubmit }: LockMaterialModalProps) => {
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (isOpen) setComment('');
    }, [isOpen]);

    if (!isOpen) return null;
    
    // Fix: Extracted props to an `any` typed object to bypass incorrect type inference. Also added onClick handler for closing the modal.
    const modalContainerProps: any = {
        className: "fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4",
        onClick: onClose,
    };
    return React.createElement('div', modalContainerProps,
        React.createElement('div', { className: "bg-white rounded-lg shadow-2xl w-full max-w-md", onClick: e => e.stopPropagation() },
            React.createElement('div', { className: "p-5 border-b" },
                React.createElement('h2', { className: "text-xl font-bold text-gray-800" }, 'Lock Material')
            ),
            React.createElement('div', { className: "p-6 space-y-4" },
                React.createElement('div', { className: "p-3 bg-gray-50 border rounded-md" },
                    React.createElement('p', { className: "text-sm font-semibold text-gray-800" }, item.materialDescription),
                    React.createElement('p', { className: "text-xs text-gray-500" }, item.jdeItemNo)
                ),
                React.createElement('div', null,
                    React.createElement('label', { htmlFor: 'lock-comment', className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Reason / Comment *'),
                    React.createElement('textarea', {
                        id: 'lock-comment',
                        rows: 3,
                        placeholder: 'e.g., Reserved for critical path job on Friday',
                        className: 'w-full px-3 py-2 border rounded-md text-sm border-gray-300 focus:ring-2 focus:ring-blue-300',
                        value: comment,
                        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)
                    })
                )
            ),
            React.createElement('div', { className: "p-5 border-t bg-gray-50 flex justify-end space-x-3 rounded-b-lg" },
                React.createElement('button', { onClick: onClose, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" }, 'Cancel'),
                React.createElement('button', { onClick: () => onSubmit(comment), className: "px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50", disabled: !comment }, 'Lock Material')
            )
        )
    );
};

interface LockedMaterialsModalProps {
    isOpen: boolean;
    onClose: () => void;
    mockMaterialLocks: { [key: string]: { lockedBy: string; comment: string } };
    masterGridData: WOMaterial[];
}

export const LockedMaterialsModal = ({ isOpen, onClose, mockMaterialLocks, masterGridData }: LockedMaterialsModalProps) => {
    if (!isOpen) return null;

    const lockedItems = Object.entries(mockMaterialLocks).map(([pKey, lockInfo]) => {
        const materialInfo = masterGridData.find(item => item.pKey === pKey);
        return { ...materialInfo, ...lockInfo };
    });

    // Fix: Extracted props to an `any` typed object to bypass incorrect type inference. Also added onClick handler for closing the modal.
    const modalContainerProps: any = {
        className: "fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center p-4",
        onClick: onClose,
    };
    return React.createElement('div', modalContainerProps,
        React.createElement('div', { className: "bg-white rounded-lg shadow-2xl w-full max-w-2xl", onClick: e => e.stopPropagation() },
            React.createElement('div', { className: "p-5 border-b" },
                React.createElement('h2', { className: "text-xl font-bold text-gray-800" }, 'Currently Locked Materials')
            ),
            React.createElement('div', { className: "p-6 max-h-[60vh] overflow-y-auto" },
                React.createElement('ul', { className: "divide-y divide-gray-200" },
                    lockedItems.map(item => React.createElement('li', { key: item.pKey, className: "py-3" },
                        React.createElement('p', { className: "text-sm font-semibold text-gray-800" }, item.materialDescription),
                        React.createElement('p', { className: "text-xs text-gray-500 font-mono" }, `${item.jdeItemNo} | WO: ${item.workOrder}`),
                        React.createElement('p', { className: "text-sm text-gray-600 mt-1 italic" }, `"${item.comment}"`),
                        React.createElement('p', { className: "text-xs text-gray-500 mt-1" }, `Locked by: ${item.lockedBy}`)
                    ))
                )
            ),
             React.createElement('div', { className: "p-5 border-t bg-gray-50 flex justify-end rounded-b-lg" },
                React.createElement('button', { onClick: onClose, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" }, 'Close')
            )
        )
    );
};