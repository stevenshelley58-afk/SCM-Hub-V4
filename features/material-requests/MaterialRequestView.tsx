
import React, { useMemo, useState, useEffect } from 'react';
import { Table } from '../../components/ui/Table';
import { DonutChart } from '../../components/ui/DonutChart';
import { StatusPill } from '../../components/ui/StatusPill';
import { InfoTooltip } from '../../components/ui/Tooltip';
import { ETABadge } from '../../components/ui/ETABadge';
import { DeliveryConfirmationModal } from '../../components/ui/DeliveryConfirmationModal';
import { mockRequestsData } from '../../services/api';
import { addStatusHistoryEntry } from '../../utils/statusHelpers';
// Fix: Corrected import path for types.
import { MaterialRequest } from '../../types/index';

interface MaterialRequestsViewProps {
    openDetailPanel: (request: MaterialRequest) => void;
    navigate: (view: string, params?: any) => void;
}

export const MaterialRequestView = ({ openDetailPanel }: MaterialRequestsViewProps) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [confirmationModal, setConfirmationModal] = useState<{ isOpen: boolean; request: MaterialRequest | null }>({
        isOpen: false,
        request: null
    });
    
    // Auto-refresh every 2 seconds to pick up new requests
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshKey(prev => prev + 1);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleConfirmDelivery = (request: MaterialRequest, data: {
        rating?: number;
        feedback?: string;
        hasIssue: boolean;
        issueDescription?: string;
        issuePhotos?: string[];
    }) => {
        const currentUser = { id: 'requestor', name: 'Requestor', role: 'Requestor' };

        if (data.hasIssue) {
            // Report issue - reopen the request or create a follow-up
            request.status = 'On Hold';
            request.onHoldInfo = {
                putOnHoldBy: currentUser.name,
                putOnHoldAt: new Date().toISOString(),
                reason: `Issue reported: ${data.issueDescription}`,
                expectedResumeDate: undefined
            };
            addStatusHistoryEntry(request, 'On Hold', currentUser.name, `Issue reported: ${data.issueDescription}`);

            // In real app, would create a follow-up request or alert MC
            alert(`Issue reported for request ${request.id}. Material Coordinator has been notified.`);
        } else {
            // Confirm delivery - close the request
            request.status = 'Delivered'; // Keep as Delivered, add confirmation data
            request.deliveryConfirmation = {
                confirmedAt: new Date().toISOString(),
                confirmedBy: currentUser.name,
                rating: data.rating,
                feedback: data.feedback
            };
            addStatusHistoryEntry(request, 'Delivered', currentUser.name, 'Delivery confirmed by requestor');

            // In real app, would trigger thank-you notification
            const thankYouMessage = data.rating 
                ? `Thank you for confirming delivery and rating ${data.rating}⭐!` 
                : 'Thank you for confirming delivery!';
            alert(thankYouMessage);
        }

        setConfirmationModal({ isOpen: false, request: null });
        setRefreshKey(prev => prev + 1); // Refresh to show updated status
    };
    const statusData = [
        { label: 'Submitted', value: 6, color: '#0891b2' },
        { label: 'Picking', value: 3, color: '#f59e0b' },
        { label: 'Ready for Collection', value: 2, color: '#8b5cf6' },
        { label: 'In Transit', value: 7, color: '#3b82f6' },
    ];
    const totalActive = statusData.reduce((acc, item) => acc + item.value, 0);
    const chartData = statusData.map(d => ({ ...d, total: totalActive }));
    
    const tableColumns = useMemo(() => [
        { accessorKey: 'id', header: 'Request ID', cell: ({value}: {value: string}) => React.createElement('span', { className: 'font-mono font-semibold text-blue-600'}, value) },
        { accessorKey: 'status', header: 'Status', cell: ({value}: {value: string}) => React.createElement(StatusPill, { status: value }) },
        { accessorKey: 'priority', header: 'Priority', cell: ({value}: {value: string}) => React.createElement('span', { className: `px-2 py-0.5 text-xs font-bold ${value === 'P1' ? 'text-red-700 bg-red-100' : 'text-gray-600 bg-gray-100'} rounded-full`}, value) },
        { accessorKey: 'items', header: '# of Items' },
        { accessorKey: 'workOrders', header: 'Work Order(s)', cell: ({value}: {value: string}) => React.createElement('span', {className: 'font-mono'}, value) },
        { accessorKey: 'createdDate', header: 'Created Date' },
        { 
            accessorKey: 'eta', header: 'ETA', enableFiltering: false,
            cell: ({ row }: { row: MaterialRequest }) => {
                // Don't show ETA for completed requests
                if (row.status === 'Delivered' || row.status === 'Closed' || row.status === 'Cancelled') {
                    return React.createElement('span', { className: 'text-gray-400 text-sm' }, '—');
                }
                return React.createElement(ETABadge, { 
                    request: {
                        priority: row.priority,
                        status: row.status,
                        queuePosition: row.MC_Queue_Position || 1,
                        requestedBy: row.RequestedBy
                    }
                });
            }
        },
        {
            accessorKey: 'actions', header: 'Actions', enableFiltering: false,
            cell: ({ row }: { row: MaterialRequest }) => {
                if (row.status === 'Delivered') {
                    // Check if already confirmed
                    if (row.deliveryConfirmation) {
                        return React.createElement('div', { className: 'flex gap-2' }, [
                            React.createElement('span', { 
                                key: 'confirmed',
                                className: 'px-3 py-1.5 text-sm font-semibold text-green-700 bg-green-50 rounded-md flex items-center gap-1' 
                            }, [
                                React.createElement('span', { key: 'icon' }, '✅'),
                                React.createElement('span', { key: 'text' }, 'Confirmed')
                            ]),
                            React.createElement('button', { 
                                key: 'pod',
                                onClick: (e: React.MouseEvent) => { e.stopPropagation(); openDetailPanel(row); }, 
                                className: 'px-3 py-1.5 text-sm font-semibold text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100' 
                            }, '📄 POD')
                        ]);
                    }
                    // Not yet confirmed
                    return React.createElement('div', { className: 'flex gap-2' }, [
                        React.createElement('button', { 
                            key: 'confirm',
                            onClick: (e: React.MouseEvent) => { 
                                e.stopPropagation(); 
                                setConfirmationModal({ isOpen: true, request: row }); 
                            }, 
                            className: 'px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 animate-pulse' 
                        }, '✅ Confirm'),
                        React.createElement('button', { 
                            key: 'pod',
                            onClick: (e: React.MouseEvent) => { e.stopPropagation(); openDetailPanel(row); }, 
                            className: 'px-3 py-1.5 text-sm font-semibold text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100' 
                        }, '📄 POD')
                    ]);
                }
                return React.createElement('button', { 
                    onClick: (e: React.MouseEvent) => { e.stopPropagation(); openDetailPanel(row); }, 
                    className: 'px-3 py-1.5 text-sm font-semibold text-gray-600 bg-white border rounded-md hover:bg-gray-100' 
                }, 'View');
            }
        }
    ], [openDetailPanel]);
    
    const dataWithClick = useMemo(() => mockRequestsData.map(req => ({ ...req, onClick: openDetailPanel })), [openDetailPanel, refreshKey]);

    return React.createElement('div', { className: 'space-y-6' },
        // Helpful header
        React.createElement('div', { className: 'bg-green-50 border-l-4 border-green-400 p-4 rounded' },
            React.createElement('div', { className: 'flex items-start' },
                React.createElement('div', { className: 'flex-shrink-0' },
                    React.createElement('span', { className: 'text-2xl' }, '📦')
                ),
                React.createElement('div', { className: 'ml-3 flex-1' },
                    React.createElement('div', { className: 'flex items-center gap-2' },
                        React.createElement('h3', { className: 'text-sm font-medium text-green-800' }, 'My Material Requests'),
                        React.createElement(InfoTooltip, { content: 'Track all your material requests from submission to delivery. Click any row for details.' })
                    ),
                    React.createElement('p', { className: 'mt-1 text-sm text-green-700' },
                        'Monitor the status of your requested materials. Warehouse is working to fulfill your requests in priority order.'
                    )
                )
            )
        ),
        React.createElement('div', { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
             React.createElement('div', { className: "bg-white p-5 rounded-xl border border-gray-200" },
                React.createElement('h3', { className: "text-base font-semibold text-gray-800 mb-4" }, "My Request Status"),
                React.createElement('div', { className: 'flex items-center space-x-6' },
                     React.createElement('div', { className: 'relative' },
                        React.createElement(DonutChart, { data: chartData, size: 120, strokeWidth: 12 }),
                        React.createElement('div', { className: 'absolute inset-0 flex flex-col items-center justify-center' },
                            React.createElement('span', { className: 'text-3xl font-bold text-gray-800' }, totalActive),
                            React.createElement('span', { className: 'text-xs text-gray-500' }, 'Active')
                        )
                     ),
                     React.createElement('div', { className: 'flex-1 space-y-2' },
                        chartData.map(item => React.createElement('div', { key: item.label, className: 'flex items-center justify-between cursor-pointer group' },
                            React.createElement('div', { className: 'flex items-center' },
                                React.createElement('span', { className: 'h-3 w-3 rounded-full mr-2', style: { backgroundColor: item.color } }),
                                React.createElement('span', { className: 'text-sm text-gray-600 group-hover:text-blue-600' }, item.label)
                            ),
                            React.createElement('span', { className: 'text-sm font-semibold text-gray-800' }, item.value)
                        )),
                        React.createElement('a', { href: '#', className: 'block text-sm text-amber-600 hover:underline pt-2 font-semibold' }, '⚠️ You have 1 request with an exception')
                     )
                )
            ),
            React.createElement('div', { className: "bg-white p-5 rounded-xl border border-gray-200" },
                React.createElement('h3', { className: "text-base font-semibold text-gray-800 mb-4" }, "Live Pick Queue"),
                React.createElement('div', { className: 'space-y-3' },
                    React.createElement('p', { className: 'text-sm text-gray-600' }, React.createElement('strong', null, '3 of Your Requests'), ' are in the Qube Queue'),
                    React.createElement('div', { className: 'p-3 bg-gray-50 rounded-lg border' },
                        React.createElement('p', { className: 'text-xs text-gray-500' }, 'Now Picking:'),
                        React.createElement('p', { className: 'font-semibold text-gray-800' }, 
                            React.createElement('a', { href: '#', onClick: (e: React.MouseEvent) => { e.preventDefault(); openDetailPanel(mockRequestsData.find(r => r.id === 'MRF-1232')!); }, className: 'text-blue-600 hover:underline' }, 'MRF-1232'),
                            React.createElement('span', { className: 'ml-2 px-2 py-0.5 text-xs font-bold text-red-700 bg-red-100 rounded-full' }, 'P1')
                        )
                    ),
                    React.createElement('div', { className: 'p-3 bg-gray-50 rounded-lg border' },
                        React.createElement('p', { className: 'text-xs text-gray-500' }, 'Next Up:'),
                        React.createElement('p', { className: 'font-semibold text-gray-800' }, 
                            React.createElement('a', { href: '#', onClick: (e: React.MouseEvent) => { e.preventDefault(); openDetailPanel(mockRequestsData.find(r => r.id === 'MRF-1234')!); }, className: 'text-blue-600 hover:underline' }, 'MRF-1234'),
                            React.createElement('span', { className: 'ml-2 px-2 py-0.5 text-xs font-semibold text-gray-600 bg-gray-200 rounded-full' }, 'P2')
                        )
                    )
                )
            )
        ),
        React.createElement(Table, {
            data: dataWithClick,
            columns: tableColumns,
            uniqueId: "id"
        }),
        // Delivery Confirmation Modal
        confirmationModal.request && React.createElement(DeliveryConfirmationModal, {
            isOpen: confirmationModal.isOpen,
            onClose: () => setConfirmationModal({ isOpen: false, request: null }),
            onConfirm: (data) => handleConfirmDelivery(confirmationModal.request!, data),
            requestId: confirmationModal.request.id
        })
    );
};
