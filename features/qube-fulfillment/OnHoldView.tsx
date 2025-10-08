import React, { useState, useEffect, useMemo } from 'react';
import { Table } from '../../components/ui/Table';
import { StatusPill } from '../../components/ui/StatusPill';
import { ResumeFromHoldModal } from '../../components/ui/ResumeFromHoldModal';
import { mockRequestsData } from '../../services/api';
import { addStatusHistoryEntry } from '../../utils/statusHelpers';
import { MaterialRequest } from '../../types/index';

interface OnHoldViewProps {
    navigate: (view: string, params?: any) => void;
}

export const OnHoldView = ({ navigate }: OnHoldViewProps) => {
    const [onHoldRequests, setOnHoldRequests] = useState<MaterialRequest[]>([]);
    const [resumeModal, setResumeModal] = useState<{ isOpen: boolean; request: MaterialRequest | null }>({ isOpen: false, request: null });
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const onHold = mockRequestsData.filter(r => r.status === 'On Hold') as MaterialRequest[];
        onHold.sort((a, b) => {
            // Sort by expected resume date if available
            if (a.onHoldInfo?.expectedResumeDate && b.onHoldInfo?.expectedResumeDate) {
                return new Date(a.onHoldInfo.expectedResumeDate).getTime() - new Date(b.onHoldInfo.expectedResumeDate).getTime();
            }
            if (a.onHoldInfo?.expectedResumeDate) return -1;
            if (b.onHoldInfo?.expectedResumeDate) return 1;
            // Then by priority
            if (a.MC_Priority_Flag && !b.MC_Priority_Flag) return -1;
            if (!a.MC_Priority_Flag && b.MC_Priority_Flag) return 1;
            return 0;
        });
        setOnHoldRequests(onHold);
    }, [refreshKey]);

    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshKey(prev => prev + 1);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleResume = (notes?: string) => {
        if (!resumeModal.request) return;
        
        const requestIndex = mockRequestsData.findIndex(r => r.id === resumeModal.request!.id);
        if (requestIndex !== -1) {
            // Return to Submitted status
            mockRequestsData[requestIndex].status = 'Submitted';
            
            // Add to status history
            mockRequestsData[requestIndex].statusHistory = addStatusHistoryEntry(
                mockRequestsData[requestIndex].statusHistory,
                'Submitted',
                'Qube User',
                `Resumed from On Hold${notes ? `: ${notes}` : ''}`
            );
            
            // Clear on hold info
            delete mockRequestsData[requestIndex].onHoldInfo;
            
            console.log(`▶️ Request ${resumeModal.request.id} resumed from On Hold`);
        }
        
        setResumeModal({ isOpen: false, request: null });
    };

    const handleRowClick = (request: MaterialRequest) => {
        setResumeModal({ isOpen: true, request });
    };

    const tableColumns = useMemo(() => [
        {
            accessorKey: 'priority', header: 'Priority',
            cell: ({ row }: { row: MaterialRequest }) => row.MC_Priority_Flag
                ? React.createElement('span', { className: 'px-2 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full' }, 'P1 🔥')
                : React.createElement('span', { className: `px-2 py-0.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-full` }, row.priority)
        },
        { accessorKey: 'id', header: 'Request ID', cell: ({value}: {value: string}) => React.createElement('span', { className: 'font-mono font-semibold text-blue-600'}, value) },
        { accessorKey: 'status', header: 'Status', cell: ({value}: {value: string}) => React.createElement(StatusPill, { status: value }) },
        { 
            accessorKey: 'onHoldInfo', 
            header: 'Hold Reason', 
            cell: ({row}: {row: MaterialRequest}) => React.createElement('span', { className: 'text-sm' }, row.onHoldInfo?.reason || 'N/A')
        },
        { 
            accessorKey: 'onHoldInfo.putOnHoldAt', 
            header: 'On Hold Since', 
            cell: ({row}: {row: MaterialRequest}) => React.createElement('span', { className: 'text-sm' }, 
                row.onHoldInfo ? new Date(row.onHoldInfo.putOnHoldAt).toLocaleDateString() : 'N/A'
            )
        },
        { 
            accessorKey: 'onHoldInfo.expectedResumeDate', 
            header: 'Expected Resume', 
            cell: ({row}: {row: MaterialRequest}) => row.onHoldInfo?.expectedResumeDate 
                ? React.createElement('span', { className: 'text-sm font-medium text-green-700' }, new Date(row.onHoldInfo.expectedResumeDate).toLocaleDateString())
                : React.createElement('span', { className: 'text-sm text-gray-400' }, 'Not specified')
        },
        { accessorKey: 'items', header: '# Items' },
        { accessorKey: 'DeliveryLocation', header: 'Delivery Location' },
        { accessorKey: 'workOrders', header: 'Work Order(s)' },
    ], []);

    const dataWithClick = useMemo(() => {
        return onHoldRequests.map(req => ({...req, onClick: () => handleRowClick(req) }));
    }, [onHoldRequests]);

    return React.createElement('div', { className: 'space-y-4' },
        React.createElement('div', { className: 'bg-yellow-50 border-l-4 border-yellow-400 p-4' },
            React.createElement('div', { className: 'flex' },
                React.createElement('div', { className: 'flex-shrink-0' },
                    React.createElement('span', { className: 'text-2xl' }, '⏸️')
                ),
                React.createElement('div', { className: 'ml-3' },
                    React.createElement('h3', { className: 'text-sm font-medium text-yellow-800' }, 'On Hold Requests'),
                    React.createElement('div', { className: 'mt-2 text-sm text-yellow-700' },
                        React.createElement('p', null, `${onHoldRequests.length} request(s) currently on hold. Click a row to resume.`)
                    )
                )
            )
        ),
        React.createElement(Table, {
            data: dataWithClick,
            columns: tableColumns,
            uniqueId: "id"
        }),
        resumeModal.request && React.createElement(ResumeFromHoldModal, {
            isOpen: resumeModal.isOpen,
            request: resumeModal.request,
            onClose: () => setResumeModal({ isOpen: false, request: null }),
            onConfirm: handleResume,
            currentUserName: 'Qube User'
        })
    );
};

