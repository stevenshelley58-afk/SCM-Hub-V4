
import React, { useState, useEffect, useMemo } from 'react';
import { Table } from '../../components/ui/Table';
import { ConfirmationModal } from '../../components/ui/Modal';
import { PODCaptureModal } from '../../components/ui/PODCaptureModal';
import { Popover } from '../../components/ui/Popover';
import { StatusPill } from '../../components/ui/StatusPill';
import { ICONS } from '../../components/ui/Icons';
import { mockRequestItems, mockRequestsData, exceptionReasons, shortReasons, users } from '../../services/api';
// Fix: Corrected import path for types.
import { RequestItem, MaterialRequest, PODData } from '../../types/index';

interface PickingViewProps {
    params: { request: MaterialRequest } | null;
    navigate: (view: string, params?: any) => void;
}

export const PickingView = ({ params, navigate }: PickingViewProps) => {
    const [items, setItems] = useState<RequestItem[]>([]);
    const [selection, setSelection] = useState({});
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [modalData, setModalData] = useState<RequestItem | null>(null);
    const [isPODModalOpen, setIsPODModalOpen] = useState(false);

    // Safety check: if no params or request, redirect back to pick list
    useEffect(() => {
        if (!params || !params.request) {
            navigate('picklist');
        }
    }, [params, navigate]);

    // Return early if no request
    if (!params || !params.request) {
        return React.createElement('div', { className: 'p-8 text-center' },
            React.createElement('p', null, 'Redirecting to pick list...')
        );
    }

    const { request } = params;

    useEffect(() => {
        setItems(JSON.parse(JSON.stringify(mockRequestItems[request.id as keyof typeof mockRequestItems] || [])));
    }, [request.id]);

    const updateItemStatus = (itemPKeys: string | string[], newStatus: 'Open' | 'Picked' | 'Short', extraData = {}) => {
        const keys = Array.isArray(itemPKeys) ? itemPKeys : [itemPKeys];
        const newItems = items.map(item => {
            if (keys.includes(item.pKey)) {
                return { ...item, status: newStatus, ...extraData };
            }
            return item;
        });
        
        const masterItems = mockRequestItems[request.id as keyof typeof mockRequestItems];
        if (masterItems) {
            keys.forEach(pKey => {
                const masterItem = masterItems.find(i => i.pKey === pKey);
                if (masterItem) {
                    masterItem.status = newStatus;
                }
            });
        }
        
        setItems(newItems);
    };

    const handleMarkAllPicked = () => {
        updateItemStatus(items.map(i => i.pKey), 'Picked');
        setActiveModal(null);
    };

    const handleStageComplete = () => {
        const requestIndex = mockRequestsData.findIndex(r => r.id === request.id);
        if (requestIndex > -1) {
            mockRequestsData[requestIndex].status = 'Ready for Collection';
        }
        setActiveModal(null);
        navigate('picklist');
    };
    
    const LineItemActions = ({ row }: { row: RequestItem }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
        
        const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); setAnchorEl(e.currentTarget); setIsOpen(true); };
        const handleClose = () => setIsOpen(false);

        return React.createElement(React.Fragment, null,
            React.createElement('button', { onClick: handleOpen }, React.createElement(ICONS.EllipsisHorizontalIcon, {})),
            // Fix: Added children to Popover call to satisfy required prop
            React.createElement(Popover, { isOpen, anchorEl, onClose: handleClose, className: 'p-1' },
                React.createElement('button', { onClick: () => { updateItemStatus(row.pKey, 'Picked'); handleClose(); }, className: 'w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded' }, 'Mark as Picked'),
                React.createElement('button', { onClick: () => { setActiveModal('partialPick'); setModalData(row); handleClose(); }, className: 'w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded' }, 'Log Partial Pick'),
                React.createElement('button', { onClick: () => { setActiveModal('flagShort'); setModalData(row); handleClose(); }, className: 'w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded' }, 'Mark as Short')
            )
        );
    };
    
    const tableColumns = useMemo(() => [
        { accessorKey: 'status', header: 'Status', cell: ({value}: {value: string}) => React.createElement(StatusPill, { status: value }) },
        { accessorKey: 'qtyRequested', header: 'Qty' },
        { accessorKey: 'materialDescription', header: 'Material Description' },
        { accessorKey: 'itemNumber', header: 'Item Number' },
        { accessorKey: 'storageLocation', header: 'Storage Location' },
        { accessorKey: 'packNumber', header: 'Pack #' },
        { accessorKey: 'actions', header: 'Actions', cell: ({ row }: { row: RequestItem }) => React.createElement(LineItemActions, { row }) }
    ], [items]);
    
    const allLinesHandled = items.every(item => item.status !== 'Open');

    const renderModals = () => {
        if (activeModal === 'markAllConfirm') {
            // Fix: Added children to ConfirmationModal call to satisfy required prop
            return React.createElement(ConfirmationModal, {
                isOpen: true, title: 'Mark All as Picked', confirmText: 'Yes, Mark All',
                onCancel: () => setActiveModal(null), onConfirm: handleMarkAllPicked
            }, `Are you sure you want to mark all ${items.length} items as picked?`);
        }
        if (activeModal === 'stageCompleteConfirm') {
            const pickedCount = items.filter(i => i.status === 'Picked').length;
            const shortCount = items.filter(i => i.status === 'Short').length;
            // Fix: Added children to ConfirmationModal call to satisfy required prop
            return React.createElement(ConfirmationModal, {
                isOpen: true, title: `Complete Request ${request.id}?`, confirmText: 'Confirm Stage Complete',
                onCancel: () => setActiveModal(null), onConfirm: handleStageComplete
            }, React.createElement('div', { className: 'space-y-2' },
                React.createElement('p', null, `Items Picked: ${pickedCount}`),
                React.createElement('p', null, `Items Short: ${shortCount}`),
                React.createElement('p', { className: 'mt-4 text-sm text-gray-500' }, 'This action cannot be undone and will send a delivery task to the LTR system.')
            ));
        }
        if (activeModal === 'flagShort' && modalData) {
            // Fix: Added children to ConfirmationModal call to satisfy required prop
             return React.createElement(ConfirmationModal, {
                 isOpen: true, title: 'Mark Item as Short', onCancel: () => setActiveModal(null),
                 onConfirm: () => { updateItemStatus(modalData.pKey, 'Short'); setActiveModal(null); }, confirmText: 'Mark as Short'
             }, React.createElement('div', { className: 'space-y-4' },
                 React.createElement('p', null, `Item: ${modalData.materialDescription}`),
                 React.createElement('div', null,
                     React.createElement('label', { htmlFor: 'shortReason', className: 'block text-sm font-medium text-gray-700' }, 'Short Reason'),
                     React.createElement('select', { id: 'shortReason', className: 'mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md' },
                         shortReasons.map(r => React.createElement('option', { key: r }, r))
                     )
                 ),
                 React.createElement('div', null,
                    React.createElement('label', { htmlFor: 'exceptionComment', className: 'block text-sm font-medium text-gray-700' }, 'Comment (Optional)'),
                    React.createElement('textarea', { id: 'exceptionComment', rows: 3, className: 'mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md' })
                 ),
                 React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700' }, 'Photo (Optional)'),
                    React.createElement('button', { className: 'mt-1 w-full flex justify-center py-2 px-4 border border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'}, 'Upload Photo')
                 )
             ));
        }
         if (activeModal === 'partialPick' && modalData) {
            // Fix: Added children to ConfirmationModal call to satisfy required prop
             return React.createElement(ConfirmationModal, {
                 isOpen: true, title: 'Log Partial Pick', onCancel: () => setActiveModal(null),
                 onConfirm: () => { updateItemStatus(modalData.pKey, 'Short', { comment: 'Partial Pick' }); setActiveModal(null); }, confirmText: 'Log Partial Pick'
             }, React.createElement('div', { className: 'space-y-4' },
                 React.createElement('p', null, `Item: ${modalData.materialDescription}`),
                 React.createElement('p', null, `Requested Quantity: ${modalData.qtyRequested}`),
                  React.createElement('div', null,
                     React.createElement('label', { htmlFor: 'qtyPicked', className: 'block text-sm font-medium text-gray-700' }, 'Quantity Picked'),
                     React.createElement('input', { type: 'number', id: 'qtyPicked', className: 'mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md' })
                 ),
                 React.createElement('p', {className: 'text-xs text-gray-500'}, 'The remaining quantity will be put on a new back-ordered request line.')
             ));
         }
        return null;
    };

    if (!request || items.length === 0) return React.createElement('div', null, 'Loading request...');

    return React.createElement('div', { className: 'space-y-4' },
        renderModals(),
        React.createElement('div', { className: "bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between" },
            React.createElement('div', null,
                React.createElement('h2', { className: "text-lg font-bold text-gray-800" }, `Picking Request: ${request.id}`),
                React.createElement('p', { className: "text-sm text-gray-500" }, `Deliver To: ${request.DeliveryLocation}`)
            ),
            React.createElement('button', { onClick: () => navigate('picklist'), className: "flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" },
                React.createElement(ICONS.ChevronLeftIcon, null), React.createElement('span', null, 'Back to Pick List')
            )
        ),
        React.createElement('div', { className: "bg-white p-4 rounded-xl border border-gray-200 flex items-center space-x-2" },
            React.createElement('button', { onClick: () => setActiveModal('markAllConfirm'), className: 'px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'}, '✅ Mark All as Picked'),
            React.createElement('button', { className: 'px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'}, '⬇️ Bulk Update Status')
        ),
        React.createElement(Table, {
            data: items,
            columns: tableColumns,
            uniqueId: 'pKey',
            enableSelection: true,
            onSelectionChange: setSelection
        }),
        allLinesHandled && React.createElement('div', { className: 'space-y-2' },
            React.createElement('button', {
                onClick: () => setActiveModal('stageCompleteConfirm'),
                className: 'w-full py-4 text-lg font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg'
            }, '📦 Stage Complete'),
            React.createElement('button', {
                onClick: () => setIsPODModalOpen(true),
                className: 'w-full py-4 text-lg font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-lg'
            }, '✅ Capture POD & Mark Delivered')
        ),
        React.createElement(PODCaptureModal, {
            isOpen: isPODModalOpen,
            onClose: () => setIsPODModalOpen(false),
            requestId: request.id,
            onSubmit: (podData: PODData) => {
                // Find the request and update it with POD
                const requestIndex = mockRequestsData.findIndex(r => r.id === request.id);
                if (requestIndex !== -1) {
                    mockRequestsData[requestIndex].pod = {
                        ...podData,
                        capturedBy: users.qube.name
                    };
                    mockRequestsData[requestIndex].status = 'Delivered';
                    console.log('✅ POD captured and request marked as Delivered:', request.id);
                }
                setIsPODModalOpen(false);
                navigate('picklist');
            }
        })
    );
};
