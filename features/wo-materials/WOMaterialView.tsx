
import React, { useState, useMemo, useCallback } from 'react';
import { Table } from '../../components/ui/Table';
import { Toast } from '../../components/ui/Toast';
import { RequestTray } from '../../components/ui/RequestTray';
import { DeliveryDetailsModal, LockMaterialModal } from '../../components/ui/Modal';
import { Popover } from '../../components/ui/Popover';
import { StatusPill } from '../../components/ui/StatusPill';
import { ICONS } from '../../components/ui/Icons';
import { masterGridData, mockTransactionalData, mockMaterialLocks, mockRequestsData } from '../../services/api';
// Fix: Corrected import path for types.
import { User, WOMaterial } from '../../types/index';

interface WOMaterialsViewProps {
    openDetailPanel: (request: any) => void;
    currentUser: User;
    navigate: (view: string, params?: any) => void;
}

export const WOMaterialView = ({ openDetailPanel, currentUser }: WOMaterialsViewProps) => {
    const [selected, setSelected] = useState<{ [key: string]: boolean }>({});
    const [isModalOpen, setModalOpen] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });
    const [mainSearchTerm, setMainSearchTerm] = useState('');
    const [tableData, setTableData] = useState<WOMaterial[]>(masterGridData);
    const [isLockModalOpen, setLockModalOpen] = useState(false);
    const [itemToLock, setItemToLock] = useState<WOMaterial | null>(null);
    
    const handleMainSearch = useCallback(() => {
        const term = mainSearchTerm.toLowerCase();
        const filtered = masterGridData.filter(m =>
            m.workOrder.toLowerCase().includes(term) ||
            m.jdeItemNo.toLowerCase().includes(term) ||
            m.materialDescription.toLowerCase().includes(term)
        );
        setTableData(filtered);
        setSelected({});
    }, [mainSearchTerm]);
    
    const handleSelectionChange = useCallback((currentSelection: { [key: string]: boolean }) => {
        setSelected(currentSelection);
    }, []);

    const handleSubmit = (formData: any) => {
        const newMrfId = `MRF-${Math.floor(1200 + Math.random() * 100)}`;
        Object.keys(selected).forEach(pKey => {
            mockTransactionalData[pKey] = { mrfId: newMrfId, status: 'In Transit' };
        });
        setSelected({});
        setModalOpen(false);
        setToast({ show: true, message: `Success! Your request ${newMrfId} has been submitted.` });
    };
    
    const handleLockSubmit = (comment: string) => {
        if (itemToLock) {
            mockMaterialLocks[itemToLock.pKey] = { lockedBy: currentUser.name, comment };
            setLockModalOpen(false);
            setItemToLock(null);
            setToast({show: true, message: "Material locked successfully."});
        }
    };
    
    const handleUnlock = (pKey: string) => {
        delete mockMaterialLocks[pKey];
        setToast({show: true, message: "Material unlocked."});
        setTableData(prevData => [...prevData]);
    };

    const RowActions = ({ row }: { row: WOMaterial }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

        const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); setAnchorEl(e.currentTarget); setIsOpen(true); };
        const handleClose = () => { setAnchorEl(null); setIsOpen(false); };
        
        const isLocked = !!mockMaterialLocks[row.pKey];
        const isLockedByMe = isLocked && mockMaterialLocks[row.pKey].lockedBy === currentUser.name;
        const isRequested = !!mockTransactionalData[row.pKey];

        if (currentUser.role !== 'Area Coordinator' || isRequested) return null;

        return React.createElement(React.Fragment, null,
            React.createElement('button', { onClick: handleOpen, className: "p-1 rounded-full hover:bg-gray-200 text-gray-500" },
                React.createElement(ICONS.EllipsisHorizontalIcon, {})
            ),
            // Fix: Added children to Popover call to satisfy required prop
            React.createElement(Popover, { isOpen, anchorEl, onClose: handleClose, className: "p-1" },
                isLockedByMe ?
                    React.createElement('button', { onClick: () => { handleUnlock(row.pKey); handleClose(); }, className: 'flex items-center space-x-2 w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded' }, React.createElement(ICONS.LockOpenIcon, {}), React.createElement('span', null, 'Unlock Material')) :
                !isLocked ?
                    React.createElement('button', { onClick: () => { setItemToLock(row); setLockModalOpen(true); handleClose(); }, className: 'flex items-center space-x-2 w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded' }, React.createElement(ICONS.LockClosedIcon, {className: 'h-5 w-5'}), React.createElement('span', null, 'Lock Material')) :
                    null
            )
        );
    };

    const selectedItems = useMemo(() => masterGridData.filter(item => selected[item.pKey]), [selected]);
    
    const tableColumns = useMemo(() => [
        {
            accessorKey: 'mrfStatus', header: 'MRF Status', enableFiltering: false,
            cell: ({ row }: { row: WOMaterial }) => {
                const mrfInfo = mockTransactionalData[row.pKey];
                const lockInfo = mockMaterialLocks[row.pKey];
                const status = mrfInfo ? mrfInfo.status : 'Not Requested';
                return React.createElement('div', { className: 'flex flex-col' },
                    React.createElement(StatusPill, { status: status, lockInfo: lockInfo }),
                    mrfInfo && React.createElement('a', {
                        href: "#", onClick: (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); openDetailPanel(mockRequestsData.find(r => r.id === mrfInfo.mrfId)); },
                        className: "text-blue-600 font-semibold hover:underline mt-1 text-xs"
                    }, `(${mrfInfo.mrfId})`)
                );
            }
        },
        { accessorKey: 'workOrder', header: 'Work Order' },
        { accessorKey: 'lineNumber', header: 'Line #' },
        { accessorKey: 'opsSeq', header: 'Ops Seq' },
        { accessorKey: 'team', header: 'Team' },
        { accessorKey: 'packNumber', header: 'Pack #' },
        { accessorKey: 'storageLocation', header: 'Location' },
        { accessorKey: 'jdeItemNo', header: 'JDE Item No' },
        { accessorKey: 'materialDescription', header: 'Description' },
        { accessorKey: 'workOrderQty', header: 'WO Qty' },
        { accessorKey: 'actions', header: '', cell: ({ row }: { row: WOMaterial }) => React.createElement(RowActions, { row }) }
    ], [openDetailPanel, currentUser.role]);
    
    const tableDataWithStatus = useMemo(() => tableData.map(d => ({...d, isDisabled: !!mockTransactionalData[d.pKey] || !!mockMaterialLocks[d.pKey] })), [tableData]);

    return React.createElement('div', { className: 'space-y-6' },
        toast.show && React.createElement(Toast, { message: toast.message, onClose: () => setToast({ show: false, message: '' }) }),
        React.createElement(DeliveryDetailsModal, {
            isOpen: isModalOpen,
            onClose: () => setModalOpen(false),
            onSubmit: handleSubmit,
            selectedItems: selectedItems,
            currentUser: currentUser
        }),
        itemToLock && React.createElement(LockMaterialModal, {
            isOpen: isLockModalOpen,
            onClose: () => { setLockModalOpen(false); setItemToLock(null); },
            item: itemToLock,
            onSubmit: handleLockSubmit
        }),
        React.createElement('div', { className: "bg-white p-4 rounded-xl border border-gray-200" },
            React.createElement('div', { className: "flex items-center justify-between" },
                React.createElement('div', { className: "flex items-center space-x-2 w-full max-w-lg relative" },
                     React.createElement('div', {className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"}, React.createElement(ICONS.MagnifyingGlassIcon, {})),
                     React.createElement('input', {
                        type: "text", placeholder: "Search by Work Order, JDE No, or Description...",
                        className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        value: mainSearchTerm, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setMainSearchTerm(e.target.value),
                        onKeyPress: (e: React.KeyboardEvent) => e.key === 'Enter' && handleMainSearch()
                     }),
                    React.createElement('button', { onClick: handleMainSearch, className: "px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold" }, 'Search')
                ),
                selectedItems.length > 0 && React.createElement('div', { className: "px-6 py-2 text-green-700 bg-green-100 rounded-lg font-semibold flex-shrink-0" }, `${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} ready`)
            )
        ),
        React.createElement(Table, {
            data: tableDataWithStatus,
            columns: tableColumns,
            uniqueId: "pKey",
            enableSelection: true,
            onSelectionChange: handleSelectionChange,
            onLoadMore: () => {},
            totalDataCount: tableData.length,
            initialRowSelection: selected
        }),
        React.createElement(RequestTray, { selectedCount: selectedItems.length, onReview: () => setModalOpen(true), selectedItems: selectedItems })
    );
};
