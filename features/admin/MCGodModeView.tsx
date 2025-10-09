import React, { useState } from 'react';
import { mockRequestsData, mockMaterialLocks } from '../../services/api';
import { logAuditEntry } from '../../services/auditService';

export const MCGodModeView: React.FC = () => {
    const [selectedRequest, setSelectedRequest] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [newPriority, setNewPriority] = useState('');
    const [overrideReason, setOverrideReason] = useState('');
    const [unlockPKey, setUnlockPKey] = useState('');
    
    const handleStatusOverride = () => {
        if (!selectedRequest || !newStatus || !overrideReason) {
            alert('Please fill in all fields');
            return;
        }
        
        const request = mockRequestsData.find(r => r.id === selectedRequest);
        if (!request) return;
        
        logAuditEntry({
            userId: 'mc',
            userName: 'Corey (MC)',
            action: 'manual_override',
            entityType: 'material_request',
            entityId: selectedRequest,
            details: {
                type: 'status_override',
                before: request.status,
                after: newStatus,
                reason: overrideReason
            }
        });
        
        alert(`✅ Status manually overridden!\n${selectedRequest}: ${request.status} → ${newStatus}\n\nThis action has been logged in the audit trail.`);
        
        // Reset form
        setSelectedRequest('');
        setNewStatus('');
        setOverrideReason('');
    };
    
    const handlePriorityOverride = () => {
        if (!selectedRequest || !newPriority || !overrideReason) {
            alert('Please fill in all fields');
            return;
        }
        
        const request = mockRequestsData.find(r => r.id === selectedRequest);
        if (!request) return;
        
        logAuditEntry({
            userId: 'mc',
            userName: 'Corey (MC)',
            action: 'manual_override',
            entityType: 'material_request',
            entityId: selectedRequest,
            details: {
                type: 'priority_override',
                before: request.priority,
                after: newPriority,
                reason: overrideReason
            }
        });
        
        alert(`✅ Priority manually overridden!\n${selectedRequest}: ${request.priority} → ${newPriority}\n\nThis action has been logged in the audit trail.`);
        
        // Reset form
        setSelectedRequest('');
        setNewPriority('');
        setOverrideReason('');
    };
    
    const handleMaterialUnlock = () => {
        if (!unlockPKey) {
            alert('Please enter a pKey');
            return;
        }
        
        const lockInfo = mockMaterialLocks[unlockPKey];
        
        logAuditEntry({
            userId: 'mc',
            userName: 'Corey (MC)',
            action: 'material_unlock',
            entityType: 'material',
            entityId: unlockPKey,
            details: {
                previousLock: lockInfo || 'Not locked',
                unlockedBy: 'MC',
                reason: 'Manual unlock via God Mode'
            }
        });
        
        if (lockInfo) {
            delete mockMaterialLocks[unlockPKey];
            alert(`✅ Material ${unlockPKey} has been unlocked!\n\nPreviously locked by: ${lockInfo.lockedBy}\nReason: ${lockInfo.comment}\n\nThis action has been logged in the audit trail.`);
        } else {
            alert(`⚠️ Material ${unlockPKey} was not locked.\n\nUnlock action has been logged in the audit trail anyway.`);
        }
        
        setUnlockPKey('');
    };
    
    const lockedMaterials = Object.entries(mockMaterialLocks);
    
    return (
        <div className="space-y-6">
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">⚡</span>
                    <div>
                        <h1 className="text-2xl font-bold text-red-900">MC God Mode</h1>
                        <p className="text-sm text-red-700">
                            Full control override capabilities - All actions are logged in audit trail
                        </p>
                    </div>
                </div>
                <div className="bg-white border border-red-200 rounded-lg p-4 mt-4">
                    <h3 className="font-semibold text-red-900 mb-2">⚠️ Warning</h3>
                    <p className="text-sm text-red-700">
                        These are powerful administrative functions that bypass normal workflow rules. 
                        Use with extreme caution. Every action is permanently logged and auditable.
                    </p>
                </div>
            </div>
            
            {/* Manual Status Override */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    🔄 Manual Status Override
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                    Force a request to any status, bypassing workflow validation
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Request
                        </label>
                        <select
                            value={selectedRequest}
                            onChange={(e) => setSelectedRequest(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">-- Select a request --</option>
                            {mockRequestsData.map(req => (
                                <option key={req.id} value={req.id}>
                                    {req.id} - {req.status} ({req.priority})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Status
                        </label>
                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">-- Select new status --</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Picking">Picking</option>
                            <option value="Staged">Staged</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Delivered">Delivered</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Override Reason *
                        </label>
                        <textarea
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            placeholder="Explain why this manual override is necessary..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={3}
                        />
                    </div>
                    
                    <button
                        onClick={handleStatusOverride}
                        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                    >
                        ⚡ Override Status
                    </button>
                </div>
            </div>
            
            {/* Manual Priority Override */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    🎯 Manual Priority Override
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                    Change request priority regardless of AC settings
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Request
                        </label>
                        <select
                            value={selectedRequest}
                            onChange={(e) => setSelectedRequest(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">-- Select a request --</option>
                            {mockRequestsData.map(req => (
                                <option key={req.id} value={req.id}>
                                    {req.id} - {req.priority} - {req.requestorName}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Priority
                        </label>
                        <select
                            value={newPriority}
                            onChange={(e) => setNewPriority(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">-- Select new priority --</option>
                            <option value="P1">P1 - Urgent (requires MC approval)</option>
                            <option value="P2">P2 - High</option>
                            <option value="P3">P3 - Normal</option>
                            <option value="P4">P4 - Low</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Override Reason *
                        </label>
                        <textarea
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            placeholder="Explain why this priority change is necessary..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={3}
                        />
                    </div>
                    
                    <button
                        onClick={handlePriorityOverride}
                        className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                    >
                        ⚡ Override Priority
                    </button>
                </div>
            </div>
            
            {/* Material Unlock */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    🔓 Manual Material Unlock
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                    Force unlock materials that are locked by Area Coordinators
                </p>
                
                {lockedMaterials.length > 0 && (
                    <div className="mb-4 bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                        <h3 className="font-semibold text-yellow-900 mb-2">Currently Locked Materials</h3>
                        <div className="space-y-2">
                            {lockedMaterials.map(([pKey, lock]) => (
                                <div key={pKey} className="flex items-center justify-between p-2 bg-white rounded border border-yellow-300">
                                    <div className="text-sm">
                                        <span className="font-mono font-semibold">{pKey}</span>
                                        <span className="ml-2 text-gray-600">Locked by: {lock.lockedBy}</span>
                                        <div className="text-xs text-gray-500 mt-1">{lock.comment}</div>
                                    </div>
                                    <button
                                        onClick={() => setUnlockPKey(pKey)}
                                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                        Select
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Material pKey
                        </label>
                        <input
                            type="text"
                            value={unlockPKey}
                            onChange={(e) => setUnlockPKey(e.target.value)}
                            placeholder="e.g., 8226710005"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
                        />
                    </div>
                    
                    <button
                        onClick={handleMaterialUnlock}
                        className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                    >
                        🔓 Force Unlock Material
                    </button>
                </div>
            </div>
            
            {/* Audit Trail Access */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">
                    📋 All Actions Are Logged
                </h2>
                <p className="text-sm text-blue-700 mb-4">
                    Every God Mode action is permanently recorded in the audit trail with:
                </p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                    <li>Timestamp of the action</li>
                    <li>User who performed the action</li>
                    <li>Before and after values</li>
                    <li>Reason for the override</li>
                    <li>Full context and details</li>
                </ul>
                <button
                    onClick={() => window.alert('Navigate to Audit Trail tab to view all logged actions')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                    View Audit Trail →
                </button>
            </div>
        </div>
    );
};
