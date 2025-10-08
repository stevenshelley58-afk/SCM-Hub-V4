
import React, { useState, useEffect, useMemo } from 'react';
import { Table } from '../../components/ui/Table';
import { Popover } from '../../components/ui/Popover';
import { StatusPill } from '../../components/ui/StatusPill';
import { ICONS } from '../../components/ui/Icons';
import { mockRequestsData } from '../../services/api';
// Fix: Corrected import path for types.
import { MaterialRequest } from '../../types/index';

interface QubePickListViewProps {
    navigate: (view: string, params?: any) => void;
    openDetailPanel: (request: MaterialRequest) => void;
}

export const QubePickListView = ({ navigate }: QubePickListViewProps) => {
    const [pickListData, setPickListData] = useState<MaterialRequest[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

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
        const handleSplit = (e: React.MouseEvent) => { e.stopPropagation(); alert('Navigate to Split Request screen (not implemented)'); handleClose(); };

        return React.createElement(React.Fragment, null,
            React.createElement('button', { onClick: handleOpen, className: "p-1 rounded-full hover:bg-gray-200 text-gray-500" },
                React.createElement(ICONS.EllipsisHorizontalIcon, {})
            ),
            // Fix: Added children to Popover call to satisfy required prop
            React.createElement(Popover, { isOpen, anchorEl, onClose: handleClose, className: "p-1" },
                React.createElement('button', { onClick: handleSplit, className: 'w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded' }, 'Split Request'),
                React.createElement('button', { onClick: handlePrint, className: 'w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded' }, 'Print Pick Slip')
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
        })
    );
};
