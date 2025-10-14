
import React, { useState, useMemo, useCallback } from 'react';
import { Table } from '../../components/ui/Table';
import { Toast } from '../../components/ui/Toast';
import { RequestTray } from '../../components/ui/RequestTray';
import { DeliveryDetailsModal, LockMaterialModal } from '../../components/ui/Modal';
import { Popover } from '../../components/ui/Popover';
import { StatusPill } from '../../components/ui/StatusPill';
import { InfoTooltip } from '../../components/ui/Tooltip';
import { ICONS } from '../../components/ui/Icons';
import { masterGridData, mockTransactionalData, mockMaterialLocks, mockRequestsData, mockRequestItems } from '../../services/api';
import { isFeatureEnabled } from '../../config/features';
// Fix: Corrected import path for types.
import { User, WOMaterial } from '../../types/index';
import { checkMaterialAtToll, orderFromToll } from '../../services/tollLTRIntegration';
import { shouldUseToll } from '../../services/tollLTRIntegration';
import { notifyRequestSubmitted, notifyP1Approval } from '../../services/workflowNotifications';

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
        // Pack selection logic: if user selects/deselects item from pack, select/deselect all items in pack
        const updatedSelection = { ...currentSelection };
        
        // Check each changed item for pack logic
        Object.entries(currentSelection).forEach(([pKey, isSelected]) => {
            const material = masterGridData.find(m => m.pKey === pKey);
            if (material && material.packNumber && material.packNumber !== 'N/A') {
                // Find all materials in the same pack
                const packMaterials = masterGridData.filter(m => 
                    m.packNumber === material.packNumber && m.packNumber !== 'N/A'
                );
                
                if (isSelected) {
                    // Selecting pack item → select all in pack
                    packMaterials.forEach(packMaterial => {
                        updatedSelection[packMaterial.pKey] = true;
                    });
                    if (packMaterials.length > 1) {
                        setToast({ 
                            show: true, 
                            message: `📦 Selected ${packMaterials.length} items from Pack ${material.packNumber}` 
                        });
                    }
                } else {
                    // Deselecting pack item → show warning and deselect all
                    const packSelectedCount = packMaterials.filter(m => updatedSelection[m.pKey]).length;
                    if (packSelectedCount === packMaterials.length) {
                        // All pack items are selected, user is deselecting one
                        if (confirm(`This will deselect all ${packMaterials.length} items from Pack ${material.packNumber}. Continue?`)) {
                            packMaterials.forEach(packMaterial => {
                                updatedSelection[packMaterial.pKey] = false;
                            });
                        } else {
                            // User cancelled, keep original selection
                            updatedSelection[pKey] = true;
                        }
                    }
                }
            }
        });
        
        setSelected(updatedSelection);
    }, [masterGridData]);

    const handleSubmit = (formData: any) => {
        const selectedItems = Object.keys(selected);
        
        // CRITICAL: Check for duplicate requests (prevent requesting already-requested materials)
        const duplicates: string[] = [];
        const activeStatuses = ['Submitted', 'Picking', 'Staged', 'In Transit', 'Partial Pick - Open', 'Partial Pick - Closed', 'On Hold'];
        
        selectedItems.forEach(pKey => {
            const existing = mockTransactionalData[pKey];
            if (existing) {
                // Check if material has active request
                const existingRequest = mockRequestsData.find(r => r.id === existing.mrfId);
                if (existingRequest && activeStatuses.includes(existingRequest.status)) {
                    const material = masterGridData.find(m => m.pKey === pKey);
                    duplicates.push(`${material?.materialDescription || pKey} (already in ${existing.mrfId})`);
                }
            }
        });
        
        if (duplicates.length > 0) {
            setToast({ 
                show: true, 
                message: `❌ Cannot create request - the following materials are already requested:\n\n${duplicates.join('\n')}` 
            });
            return; // Block request creation
        }
        
        const newMrfId = `MRF-${Math.floor(1200 + Math.random() * 100)}`;
        
        // Update transactional data (for WO Materials status column)
        // Also creates auto-lock on materials
        selectedItems.forEach(pKey => {
            mockTransactionalData[pKey] = { mrfId: newMrfId, status: 'Submitted' };
            // Auto-lock materials when requested (prevent duplicates)
            mockMaterialLocks[pKey] = { 
                lockedBy: `System (${newMrfId})`, 
                comment: `Auto-locked by request ${newMrfId}` 
            };
        });
        
        // Add new request to mockRequestsData (for Qube Pick List)
        const selectedMaterials = masterGridData.filter(m => selected[m.pKey]);
        const workOrders = [...new Set(selectedMaterials.map(m => m.workOrder))].join(', ');
        
        // Check feature flag: if P1 approval is enabled AND this is P1, send to Pending Approval
        // Otherwise, go straight to Submitted
        const needsApproval = isFeatureEnabled('requireP1Approval') && formData.Priority === 'P1';
        
        const newRequest = {
            id: newMrfId,
            status: (needsApproval ? 'Pending Approval' : 'Submitted') as const,
            priority: formData.Priority || 'P4',
            items: selectedItems.length,
            workOrders: workOrders,
            createdDate: new Date().toLocaleDateString('en-US'),
            RequiredByTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            RequiredByTime: formData.RequiredTime || undefined, // Optional time
            RequestedBy: currentUser.name,
            MC_Priority_Flag: formData.Priority === 'P1',
            DeliveryLocation: formData.DeliverTo || 'Unknown',
            requestorName: currentUser.name,
            acPriority: null,
            statusHistory: [{
                status: 'Submitted',
                timestamp: new Date().toISOString(),
                changedBy: currentUser.name,
                reason: 'Request created'
            }]
        };
        
        mockRequestsData.unshift(newRequest); // Add to beginning of array
        
        // Send notifications
        if (needsApproval) {
            notifyP1Approval(newRequest as any).catch(err => console.error('Notification failed:', err));
        } else {
            notifyRequestSubmitted(newRequest as any).catch(err => console.error('Notification failed:', err));
        }
        
        // Add line items for the request (for picking view)
        mockRequestItems[newMrfId as keyof typeof mockRequestItems] = selectedMaterials.map((m, idx) => ({
            pKey: `LI-${newMrfId}-${idx}`,
            status: 'Open' as const,
            qtyRequested: m.workOrderQty,
            materialDescription: m.materialDescription,
            itemNumber: m.jdeItemNo,
            storageLocation: m.storageLocation,
            packNumber: m.packNumber
        }));
        
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

    const handleOrderFromToll = async (material: WOMaterial) => {
        setToast({ show: true, message: `Checking Toll availability for ${material.jdeItemNo}...` });
        
        // Check availability first
        const availability = await checkMaterialAtToll(material.jdeItemNo);
        
        if (!availability) {
            setToast({ show: true, message: `❌ Material ${material.jdeItemNo} not found in Toll catalog` });
            return;
        }
        
        if (!availability.available) {
            setToast({ show: true, message: `⚠️ Material ${material.jdeItemNo} not currently available at Toll (lead time: ${availability.estimatedLeadTimeDays} days)` });
            return;
        }
        
        if (availability.quantityOnHand < material.workOrderQty) {
            setToast({ show: true, message: `⚠️ Insufficient quantity at Toll. Required: ${material.workOrderQty}, Available: ${availability.quantityOnHand}` });
            return;
        }
        
        // Create a temporary MRF ID for tracking (in real app, would create proper MRF)
        const tempMrfId = `MRF-TOLL-${Date.now()}`;
        const deliveryLocation = 'Site 1'; // In real app, would get from user input
        
        // Order from Toll
        const task = await orderFromToll(tempMrfId, material, deliveryLocation, 'standard');
        
        if (task) {
            setToast({ show: true, message: `✅ Toll order created: ${task.taskId}. ETA: ${new Date(task.estimatedDelivery!).toLocaleDateString()}` });
        } else {
            setToast({ show: true, message: `❌ Failed to create Toll order` });
        }
    };

    const RowActions = ({ row }: { row: WOMaterial }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

        const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); setAnchorEl(e.currentTarget); setIsOpen(true); };
        const handleClose = () => { setAnchorEl(null); setIsOpen(false); };
        
        const isLocked = !!mockMaterialLocks[row.pKey];
        const isLockedByMe = isLocked && mockMaterialLocks[row.pKey].lockedBy === currentUser.name;
        const isRequested = !!mockTransactionalData[row.pKey];
        const canOrderFromToll = shouldUseToll(row) && !isRequested;

        if (currentUser.role !== 'Area Coordinator' || isRequested) return null;

        return React.createElement(React.Fragment, null,
            React.createElement('button', { onClick: handleOpen, className: "p-1 rounded-full hover:bg-gray-200 text-gray-500" },
                React.createElement(ICONS.EllipsisHorizontalIcon, {})
            ),
            // Fix: Added children to Popover call to satisfy required prop
            React.createElement(Popover, { isOpen, anchorEl, onClose: handleClose, className: "p-1" },
                React.createElement('div', { className: 'flex flex-col' }, [
                    isLockedByMe ?
                        React.createElement('button', { 
                            key: 'unlock',
                            onClick: () => { handleUnlock(row.pKey); handleClose(); }, 
                            className: 'flex items-center space-x-2 w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded' 
                        }, React.createElement(ICONS.LockOpenIcon, {}), React.createElement('span', null, 'Unlock Material')) :
                    !isLocked ?
                        React.createElement('button', { 
                            key: 'lock',
                            onClick: () => { setItemToLock(row); setLockModalOpen(true); handleClose(); }, 
                            className: 'flex items-center space-x-2 w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded' 
                        }, React.createElement(ICONS.LockClosedIcon, {className: 'h-5 w-5'}), React.createElement('span', null, 'Lock Material')) :
                        null,
                    canOrderFromToll && React.createElement('button', {
                        key: 'toll',
                        onClick: () => { handleOrderFromToll(row); handleClose(); },
                        className: 'flex items-center space-x-2 w-full text-left px-3 py-1.5 text-sm text-purple-700 hover:bg-purple-50 rounded'
                    }, 
                        React.createElement('span', { className: 'text-lg' }, '🚚'),
                        React.createElement('span', null, 'Order via LTR')
                    )
                ])
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
        { 
            accessorKey: 'materialDescription', 
            header: 'Description',
            cell: ({ row }: { row: WOMaterial }) => {
                const hasPack = row.packNumber && row.packNumber !== 'N/A';
                return React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', null, row.materialDescription),
                    hasPack && React.createElement('span', { 
                        className: 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800',
                        title: `Pack ${row.packNumber}`
                    }, '📦', row.packNumber)
                );
            }
        },
        { accessorKey: 'workOrderQty', header: 'WO Qty' },
        { accessorKey: 'actions', header: '', cell: ({ row }: { row: WOMaterial }) => React.createElement(RowActions, { row }) }
    ], [openDetailPanel, currentUser.role]);
    
    const tableDataWithStatus = useMemo(() => tableData.map(d => ({...d, isDisabled: !!mockTransactionalData[d.pKey] || !!mockMaterialLocks[d.pKey] })), [tableData]);

    return React.createElement('div', { className: 'space-y-6' },
        // Helpful header with context
        React.createElement('div', { className: 'bg-blue-50 border-l-4 border-blue-400 p-4 rounded' },
            React.createElement('div', { className: 'flex items-start' },
                React.createElement('div', { className: 'flex-shrink-0' },
                    React.createElement('span', { className: 'text-2xl' }, '📋')
                ),
                React.createElement('div', { className: 'ml-3 flex-1' },
                    React.createElement('div', { className: 'flex items-center gap-2' },
                        React.createElement('h3', { className: 'text-sm font-medium text-blue-800' }, 'Work Order Materials'),
                        React.createElement(InfoTooltip, { content: 'MRF = Material Request Form. Select materials from your work orders to request them from the warehouse.' })
                    ),
                    React.createElement('div', { className: 'mt-2 text-sm text-blue-700' },
                        React.createElement('p', null, 
                            'Select materials needed for your work orders. Each work order line represents a specific task requiring materials.'
                        ),
                        React.createElement('p', { className: 'mt-1 text-xs text-blue-600' },
                            '💡 Tip: Materials in packs will auto-select all items when you select one.'
                        )
                    )
                )
            )
        ),
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
