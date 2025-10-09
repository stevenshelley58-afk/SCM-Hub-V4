import React, { useState, useEffect, useMemo } from 'react';
import { Table } from '../../components/ui/Table';
import { StatusPill } from '../../components/ui/StatusPill';
import { P1ApprovalModal } from '../../components/ui/P1ApprovalModal';
import { mockRequestsData } from '../../services/api';
import { addStatusHistoryEntry } from '../../utils/statusHelpers';
import { autoUnlockMaterials } from '../../utils/materialLockHelpers';
import { isFeatureEnabled } from '../../config/features';
import { MaterialRequest } from '../../types/index';

interface P1ApprovalViewProps {
    navigate: (view: string, params?: any) => void;
}

export const P1ApprovalView = ({ navigate }: P1ApprovalViewProps) => {
    const [pendingRequests, setPendingRequests] = useState<MaterialRequest[]>([]);
    const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; request: MaterialRequest | null }>({ isOpen: false, request: null });
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const pending = mockRequestsData.filter(r => r.status === 'Pending Approval') as MaterialRequest[];
        pending.sort((a, b) => {
            // Sort by required time (most urgent first)
            return new Date(a.RequiredByTimestamp).getTime() - new Date(b.RequiredByTimestamp).getTime();
        });
        setPendingRequests(pending);
    }, [refreshKey]);

    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshKey(prev => prev + 1);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleApprove = (notes?: string) => {
        if (!approvalModal.request) return;
        
        const requestIndex = mockRequestsData.findIndex(r => r.id === approvalModal.request!.id);
        if (requestIndex !== -1) {
            // Update status to Approved (will automatically move to Submitted for picking)
            mockRequestsData[requestIndex].status = 'Approved';
            
            // Add approval info
            mockRequestsData[requestIndex].approvalInfo = {
                approvedBy: 'Material Coordinator',
                approvedAt: new Date().toISOString(),
                notes
            };
            
            // Add to status history
            mockRequestsData[requestIndex].statusHistory = addStatusHistoryEntry(
                mockRequestsData[requestIndex].statusHistory,
                'Approved',
                'Material Coordinator',
                notes ? `Approved: ${notes}` : 'P1 request approved'
            );
            
            // Immediately move to Submitted status for warehouse
            setTimeout(() => {
                const idx = mockRequestsData.findIndex(r => r.id === approvalModal.request!.id);
                if (idx !== -1 && mockRequestsData[idx].status === 'Approved') {
                    mockRequestsData[idx].status = 'Submitted';
                    mockRequestsData[idx].statusHistory = addStatusHistoryEntry(
                        mockRequestsData[idx].statusHistory,
                        'Submitted',
                        'System',
                        'Auto-submitted after P1 approval'
                    );
                }
            }, 100);
            
            console.log(`✅ P1 Request ${approvalModal.request.id} approved by MC`);
        }
        
        setApprovalModal({ isOpen: false, request: null });
    };

    const handleReject = (reason: string) => {
        if (!approvalModal.request) return;
        
        const requestIndex = mockRequestsData.findIndex(r => r.id === approvalModal.request!.id);
        if (requestIndex !== -1) {
            // Update status to Cancelled
            mockRequestsData[requestIndex].status = 'Cancelled';
            
            // Add rejection info
            mockRequestsData[requestIndex].approvalInfo = {
                rejectedBy: 'Material Coordinator',
                rejectedAt: new Date().toISOString(),
                notes: reason
            };
            
            // Add to status history
            mockRequestsData[requestIndex].statusHistory = addStatusHistoryEntry(
                mockRequestsData[requestIndex].statusHistory,
                'Cancelled',
                'Material Coordinator',
                `P1 rejected: ${reason}`
            );
            
            // Auto-unlock materials
            autoUnlockMaterials(approvalModal.request.id, 'Cancelled');
            
            console.log(`❌ P1 Request ${approvalModal.request.id} rejected by MC: ${reason}`);
        }
        
        setApprovalModal({ isOpen: false, request: null });
    };

    const handleRowClick = (request: MaterialRequest) => {
        setApprovalModal({ isOpen: true, request });
    };

    const tableColumns = useMemo(() => [
        {
            accessorKey: 'id',
            header: 'Request ID',
            cell: ({ value }: { value: string }) => React.createElement('span', { className: 'font-mono font-semibold text-red-600' }, value)
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ value }: { value: string }) => React.createElement(StatusPill, { status: value })
        },
        {
            accessorKey: 'requestorName',
            header: 'Requestor',
            cell: ({ value }: { value: string }) => React.createElement('span', { className: 'font-medium' }, value)
        },
        { accessorKey: 'items', header: '# Items' },
        { accessorKey: 'workOrders', header: 'Work Order(s)' },
        {
            accessorKey: 'RequiredByTimestamp',
            header: 'Required By',
            cell: ({ value }: { value: string }) => {
                const date = new Date(value);
                const now = new Date();
                const hoursUntil = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
                const isUrgent = hoursUntil < 4;
                return React.createElement('span', {
                    className: isUrgent ? 'font-semibold text-red-700' : ''
                }, date.toLocaleString());
            }
        },
        {
            accessorKey: 'createdDate',
            header: 'Submitted',
            cell: ({ value }: { value: string }) => React.createElement('span', { className: 'text-sm' }, value)
        },
        { accessorKey: 'DeliveryLocation', header: 'Delivery Location' },
    ], []);

    const dataWithClick = useMemo(() => {
        return pendingRequests.map(req => ({ ...req, onClick: () => handleRowClick(req) }));
    }, [pendingRequests]);

    // Check if feature is disabled
    if (!isFeatureEnabled('requireP1Approval')) {
        return React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', { className: 'bg-gray-50 border-l-4 border-gray-400 p-4' },
                React.createElement('div', { className: 'flex items-start' },
                    React.createElement('div', { className: 'flex-shrink-0' },
                        React.createElement('span', { className: 'text-3xl' }, 'ℹ️')
                    ),
                    React.createElement('div', { className: 'ml-3' },
                        React.createElement('h3', { className: 'text-sm font-medium text-gray-800' }, 'P1 Approval Feature Disabled'),
                        React.createElement('div', { className: 'mt-2 text-sm text-gray-700' },
                            React.createElement('p', null, 'The P1 approval workflow is currently turned off. All P1 requests go directly to the warehouse pick queue without MC approval.'),
                            React.createElement('p', { className: 'mt-2 font-medium' }, 'To enable: Set requireP1Approval = true in config/features.ts')
                        )
                    )
                )
            )
        );
    }

    return React.createElement('div', { className: 'space-y-4' },
        // Alert banner
        React.createElement('div', { className: 'bg-red-50 border-l-4 border-red-600 p-4' },
            React.createElement('div', { className: 'flex items-start' },
                React.createElement('div', { className: 'flex-shrink-0' },
                    React.createElement('span', { className: 'text-3xl' }, '🔥')
                ),
                React.createElement('div', { className: 'ml-3 flex-1' },
                    React.createElement('h3', { className: 'text-sm font-medium text-red-800' }, 'P1 Approval Queue'),
                    React.createElement('div', { className: 'mt-2 text-sm text-red-700' },
                        React.createElement('p', null, 
                            `${pendingRequests.length} Priority 1 request(s) awaiting your approval before warehouse can begin picking.`
                        ),
                        pendingRequests.length > 0 && React.createElement('p', { className: 'mt-1 font-semibold' },
                            'Click any row to review and approve/reject.'
                        )
                    )
                )
            )
        ),
        
        // Table
        pendingRequests.length > 0 ? React.createElement(Table, {
            data: dataWithClick,
            columns: tableColumns,
            uniqueId: "id"
        }) : React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 p-12 text-center' },
            React.createElement('span', { className: 'text-6xl block mb-4' }, '✅'),
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-700' }, 'No Pending P1 Approvals'),
            React.createElement('p', { className: 'text-gray-500 mt-2' }, 'All P1 requests have been reviewed.')
        ),
        
        // Approval Modal
        approvalModal.request && React.createElement(P1ApprovalModal, {
            isOpen: approvalModal.isOpen,
            request: approvalModal.request,
            onClose: () => setApprovalModal({ isOpen: false, request: null }),
            onApprove: handleApprove,
            onReject: handleReject,
            currentUserName: 'Material Coordinator'
        })
    );
};

