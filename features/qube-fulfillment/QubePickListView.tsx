
import React, { useState, useEffect, useMemo } from 'react';
import { Table } from '../../components/ui/Table';
import { Popover } from '../../components/ui/Popover';
import { StatusPill } from '../../components/ui/StatusPill';
import { ICONS } from '../../components/ui/Icons';
import { OnHoldModal } from '../../components/ui/OnHoldModal';
import { CancelRequestModal } from '../../components/ui/CancelRequestModal';
import { SplitMRFModal } from '../../components/ui/SplitMRFModal';
import { mockRequestsData } from '../../services/api';
import { addStatusHistoryEntry } from '../../utils/statusHelpers';
import { autoUnlockMaterials } from '../../utils/materialLockHelpers';
// Fix: Corrected import path for types.
import { MaterialRequest } from '../../types/index';

interface QubePickListViewProps {
    navigate: (view: string, params?: any) => void;
    openDetailPanel: (request: MaterialRequest) => void;
}

export const QubePickListView = ({ navigate }: QubePickListViewProps) => {
    const [pickListData, setPickListData] = useState<MaterialRequest[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [onHoldModal, setOnHoldModal] = useState<{ isOpen: boolean; request: MaterialRequest | null }>({ isOpen: false, request: null });
    const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; request: MaterialRequest | null }>({ isOpen: false, request: null });
    const [splitModal, setSplitModal] = useState<{ isOpen: boolean; request: MaterialRequest | null }>({ isOpen: false, request: null });

    useEffect(() => {
        const submittedRequests = mockRequestsData.filter(r => r.status === 'Submitted' || r.status === 'Picking') as MaterialRequest[];
        submittedRequests.sort((a, b) => {
            if (a.MC_Priority_Flag && !b.MC_Priority_Flag) return -1;
            if (!a.MC_Priority_Flag && b.MC_Priority_Flag) return 1;
            if (a.acPriority && !b.acPriority) return -1;
            if (!a.acPriority && b.acPriority) return 1;
            if (a.acPriority && b.acPriority) return a.acPriority - b.acPriority;
            return new Date(a.RequiredByTimestamp).getTime() - new Date(b.RequiredByTimestamp).getTime();
        });
        setPickListData(submittedRequests);
    }, [refreshKey]);
    
    // Auto-refresh every 2 seconds to pick up new requests
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshKey(prev => prev + 1);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleRowClick = (request: MaterialRequest) => {
        if (request.status === 'Submitted') {
            const requestIndex = mockRequestsData.findIndex(r => r.id === request.id);
            if (requestIndex !== -1) {
                mockRequestsData[requestIndex].status = 'Picking';
            }
        }
        navigate('picking', { request });
    };

    const handlePutOnHold = (reason: string, expectedResumeDate?: string, notes?: string) => {
        if (!onHoldModal.request) return;
        
        const requestIndex = mockRequestsData.findIndex(r => r.id === onHoldModal.request!.id);
        if (requestIndex !== -1) {
            // Update status
            mockRequestsData[requestIndex].status = 'On Hold';
            
            // Add On Hold info
            mockRequestsData[requestIndex].onHoldInfo = {
                putOnHoldBy: 'Qube User', // In real app, use actual user
                putOnHoldAt: new Date().toISOString(),
                reason,
                expectedResumeDate
            };
            
            // Add to status history
            mockRequestsData[requestIndex].statusHistory = addStatusHistoryEntry(
                mockRequestsData[requestIndex].statusHistory,
                'On Hold',
                'Qube User',
                `${reason}${notes ? ` - ${notes}` : ''}`
            );
            
            console.log(`✋ Request ${onHoldModal.request.id} put On Hold: ${reason}`);
            
            // TODO: Send notifications to stakeholders
        }
        
        setOnHoldModal({ isOpen: false, request: null });
    };

    const handleCancelRequest = (reason: string, notes?: string) => {
        if (!cancelModal.request) return;
        
        const requestIndex = mockRequestsData.findIndex(r => r.id === cancelModal.request!.id);
        if (requestIndex !== -1) {
            // Update status
            mockRequestsData[requestIndex].status = 'Cancelled';
            
            // Add to status history
            mockRequestsData[requestIndex].statusHistory = addStatusHistoryEntry(
                mockRequestsData[requestIndex].statusHistory,
                'Cancelled',
                'Qube User',
                `${reason}${notes ? ` - ${notes}` : ''}`
            );
            
            // Auto-unlock materials
            autoUnlockMaterials(cancelModal.request.id, 'Cancelled');
            
            console.log(`❌ Request ${cancelModal.request.id} cancelled: ${reason}`);
            
            // TODO: Send notifications to stakeholders
        }
        
        setCancelModal({ isOpen: false, request: null });
    };

    const handleSplitConfirm = (splits: { splitA: string[]; splitB: string[] }, reason: string) => {
        if (!splitModal.request) return;
        
        const originalRequest = splitModal.request;
        const originalIndex = mockRequestsData.findIndex(r => r.id === originalRequest.id);
        
        if (originalIndex !== -1) {
            // Generate new MRF IDs
            const mrfIdA = `${originalRequest.id}-A`;
            const mrfIdB = `${originalRequest.id}-B`;
            
            // Cancel original request
            mockRequestsData[originalIndex].status = 'Cancelled';
            mockRequestsData[originalIndex].statusHistory = addStatusHistoryEntry(
                mockRequestsData[originalIndex].statusHistory,
                'Cancelled',
                'Qube User',
                `Split into ${mrfIdA} and ${mrfIdB}: ${reason}`
            );
            
            // Auto-unlock original materials
            autoUnlockMaterials(originalRequest.id, 'Cancelled');
            
            // Create Split A
            const requestA = {
                ...originalRequest,
                id: mrfIdA,
                status: 'Submitted' as const,
                items: splits.splitA.length,
                createdDate: new Date().toLocaleDateString('en-US'),
                statusHistory: [{
                    status: 'Submitted',
                    timestamp: new Date().toISOString(),
                    changedBy: 'Qube User',
                    reason: `Split from ${originalRequest.id} (Split A)`
                }]
            };
            
            // Create Split B
            const requestB = {
                ...originalRequest,
                id: mrfIdB,
                status: 'Submitted' as const,
                items: splits.splitB.length,
                createdDate: new Date().toLocaleDateString('en-US'),
                statusHistory: [{
                    status: 'Submitted',
                    timestamp: new Date().toISOString(),
                    changedBy: 'Qube User',
                    reason: `Split from ${originalRequest.id} (Split B)`
                }]
            };
            
            // Add both new requests
            mockRequestsData.unshift(requestA, requestB);
            
            console.log(`✂️ Split ${originalRequest.id} into ${mrfIdA} (${splits.splitA.length} items) and ${mrfIdB} (${splits.splitB.length} items)`);
            console.log(`Reason: ${reason}`);
        }
        
        setSplitModal({ isOpen: false, request: null });
    };
    
    const handlePrintPickSlip = (request: MaterialRequest) => {
        const printWindow = window.open('', '_blank');
        printWindow?.document.write(`
            <html>
                <head><title>Pick Slip - ${request.id}</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; } h1 { border-bottom: 2px solid black; padding-bottom: 10px; }
                    .details { margin: 20px 0; } .details p { margin: 5px 0; }
                    .details strong { display: inline-block; width: 150px; }
                </style>
                </head><body>
                    <h1>Pick Slip: ${request.id}</h1>
                    <div class="details">
                        <p><strong>Priority:</strong> ${request.MC_Priority_Flag ? 'P1 - CRITICAL' : request.priority}</p>
                        <p><strong>Status:</strong> ${request.status}</p>
                        <p><strong># of Items:</strong> ${request.items}</p>
                        <p><strong>Required Time:</strong> ${new Date(request.RequiredByTimestamp).toLocaleString()}</p>
                        <p><strong>Delivery Location:</strong> ${request.DeliveryLocation}</p>
                        <p><strong>Work Order(s):</strong> ${request.workOrders}</p>
                    </div>
                    <h2>Line Items</h2>
                    <p><em>Line item details would be listed here based on the items in the request...</em></p>
                </body></html>
        `);
        printWindow?.document.close();
        printWindow?.focus();
        printWindow?.print();
    };
    
    const RowActions = ({ row }: { row: MaterialRequest }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

        const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); setAnchorEl(e.currentTarget); setIsOpen(true); };
        const handleClose = () => { setAnchorEl(null); setIsOpen(false); };

        const handlePrint = (e: React.MouseEvent) => { e.stopPropagation(); handlePrintPickSlip(row); handleClose(); };
        const handleSplit = (e: React.MouseEvent) => { e.stopPropagation(); setSplitModal({ isOpen: true, request: row }); handleClose(); };
        const handleOnHold = (e: React.MouseEvent) => { e.stopPropagation(); setOnHoldModal({ isOpen: true, request: row }); handleClose(); };
        const handleCancel = (e: React.MouseEvent) => { e.stopPropagation(); setCancelModal({ isOpen: true, request: row }); handleClose(); };

        return React.createElement(React.Fragment, null,
            React.createElement('button', { onClick: handleOpen, className: "p-1 rounded-full hover:bg-gray-200 text-gray-500" },
                React.createElement(ICONS.EllipsisHorizontalIcon, {})
            ),
            // Fix: Added children to Popover call to satisfy required prop
            React.createElement(Popover, { isOpen, anchorEl, onClose: handleClose, className: "p-1" },
                React.createElement('button', { onClick: handleSplit, className: 'w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded' }, 'Split Request'),
                React.createElement('button', { onClick: handlePrint, className: 'w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded' }, 'Print Pick Slip'),
                React.createElement('button', { onClick: handleOnHold, className: 'w-full text-left px-3 py-1.5 text-sm text-yellow-700 hover:bg-yellow-50 rounded' }, '⏸️ Put On Hold'),
                React.createElement('button', { onClick: handleCancel, className: 'w-full text-left px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 rounded' }, '❌ Cancel Request')
            )
        );
    };

    const tableColumns = useMemo(() => [
        {
            accessorKey: 'priority', header: 'Priority',
            cell: ({ row }: { row: MaterialRequest }) => row.MC_Priority_Flag
                ? React.createElement('span', { className: "text-base px-2 py-1 font-bold bg-red-100 text-red-700 rounded-md" }, '🚩 P1')
                : React.createElement('span', { className: `px-2 py-0.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-full` }, row.priority)
        },
        { accessorKey: 'id', header: 'Request ID', cell: ({value}: {value: string}) => React.createElement('span', { className: 'font-mono font-semibold text-blue-600'}, value) },
        { accessorKey: 'status', header: 'Status', cell: ({value}: {value: string}) => React.createElement(StatusPill, { status: value }) },
        { accessorKey: 'items', header: '# of Items' },
        { accessorKey: 'RequiredByTimestamp', header: 'Required Time', cell: ({value}: {value: string}) => React.createElement('span', null, new Date(value).toLocaleString()) },
        { accessorKey: 'DeliveryLocation', header: 'Delivery Location' },
        { accessorKey: 'workOrders', header: 'Work Order(s)' },
        {
            accessorKey: 'actions', header: '', enableFiltering: false,
            cell: ({ row }: { row: MaterialRequest }) => React.createElement(RowActions, { row })
        }
    ], []);

    const dataWithClick = useMemo(() => {
        return pickListData.map(req => ({...req, onClick: () => handleRowClick(req) }));
    }, [pickListData]);

    return React.createElement('div', null,
        React.createElement(Table, {
            data: dataWithClick,
            columns: tableColumns,
            uniqueId: "id"
        }),
        onHoldModal.request && React.createElement(OnHoldModal, {
            isOpen: onHoldModal.isOpen,
            request: onHoldModal.request,
            onClose: () => setOnHoldModal({ isOpen: false, request: null }),
            onConfirm: handlePutOnHold,
            currentUserName: 'Qube User'
        }),
        cancelModal.request && React.createElement(CancelRequestModal, {
            isOpen: cancelModal.isOpen,
            request: cancelModal.request,
            onClose: () => setCancelModal({ isOpen: false, request: null }),
            onConfirm: handleCancelRequest,
            currentUserName: 'Qube User'
        }),
        splitModal.request && React.createElement(SplitMRFModal, {
            isOpen: splitModal.isOpen,
            request: splitModal.request,
            onClose: () => setSplitModal({ isOpen: false, request: null }),
            onConfirm: handleSplitConfirm,
            currentUserName: 'Qube User'
        })
    );
};
