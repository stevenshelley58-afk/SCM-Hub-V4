import React, { useState, useMemo } from 'react';
import { getAuditLog, exportAuditLogCSV } from '../../services/auditService';
import { AuditLogEntry } from '../../types';

const ACTION_LABELS: Record<string, string> = {
    'status_change': 'Status Change',
    'priority_change': 'Priority Change',
    'manual_override': 'Manual Override',
    'material_unlock': 'Material Unlock',
    'approval': 'Approval',
    'rejection': 'Rejection',
    'cancel': 'Cancel',
    'on_hold': 'Put On Hold',
    'resume': 'Resume',
    'short_pick': 'Short Pick',
    'material_lock': 'Material Lock',
    'create_request': 'Create Request',
    'edit_request': 'Edit Request',
    'delete_request': 'Delete Request',
    'permission_change': 'Permission Change',
    'system_config': 'System Config'
};

const ACTION_COLORS: Record<string, string> = {
    'status_change': 'bg-blue-100 text-blue-800',
    'priority_change': 'bg-orange-100 text-orange-800',
    'manual_override': 'bg-red-100 text-red-800',
    'material_unlock': 'bg-purple-100 text-purple-800',
    'approval': 'bg-green-100 text-green-800',
    'rejection': 'bg-red-100 text-red-800',
    'cancel': 'bg-gray-100 text-gray-800',
    'on_hold': 'bg-yellow-100 text-yellow-800',
    'resume': 'bg-green-100 text-green-800',
    'short_pick': 'bg-orange-100 text-orange-800',
    'material_lock': 'bg-purple-100 text-purple-800',
    'create_request': 'bg-blue-100 text-blue-800',
    'edit_request': 'bg-blue-100 text-blue-800',
    'delete_request': 'bg-red-100 text-red-800',
    'permission_change': 'bg-purple-100 text-purple-800',
    'system_config': 'bg-gray-100 text-gray-800'
};

export const AuditLogView: React.FC = () => {
    const [filters, setFilters] = useState({
        userId: '',
        action: '',
        entityId: '',
        startDate: '',
        endDate: '',
        limit: 100
    });
    
    const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
    
    const auditEntries = useMemo(() => {
        const filterObj: any = { limit: filters.limit };
        if (filters.userId) filterObj.userId = filters.userId;
        if (filters.action) filterObj.action = filters.action;
        if (filters.entityId) filterObj.entityId = filters.entityId;
        if (filters.startDate) filterObj.startDate = filters.startDate;
        if (filters.endDate) filterObj.endDate = filters.endDate;
        
        return getAuditLog(filterObj);
    }, [filters]);
    
    const handleExport = () => {
        const csv = exportAuditLogCSV(auditEntries);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };
    
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };
    
    const formatDetails = (details: any) => {
        if (details.before && details.after) {
            return `${details.before} → ${details.after}`;
        }
        if (details.reason) {
            return details.reason;
        }
        return JSON.stringify(details);
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Audit Trail</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Complete log of all system actions and changes
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                </button>
            </div>
            
            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">User</label>
                        <input
                            type="text"
                            placeholder="User ID"
                            value={filters.userId}
                            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Action</label>
                        <select
                            value={filters.action}
                            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                            <option value="">All Actions</option>
                            {Object.entries(ACTION_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Entity ID</label>
                        <input
                            type="text"
                            placeholder="e.g., MRF-1234"
                            value={filters.entityId}
                            onChange={(e) => setFilters({ ...filters, entityId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Limit</label>
                        <select
                            value={filters.limit}
                            onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={250}>250</option>
                            <option value={500}>500</option>
                        </select>
                    </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing {auditEntries.length} entries
                    </p>
                    <button
                        onClick={() => setFilters({ userId: '', action: '', entityId: '', startDate: '', endDate: '', limit: 100 })}
                        className="text-sm text-blue-600 hover:text-blue-700"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>
            
            {/* Audit Log Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Timestamp
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Entity
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Details
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {auditEntries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {formatTimestamp(entry.timestamp)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{entry.userName}</div>
                                        <div className="text-xs text-gray-500">{entry.userId}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ACTION_COLORS[entry.action] || 'bg-gray-100 text-gray-800'}`}>
                                            {ACTION_LABELS[entry.action] || entry.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{entry.entityId}</div>
                                        <div className="text-xs text-gray-500">{entry.entityType}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700 max-w-md truncate">
                                        {formatDetails(entry.details)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => setSelectedEntry(entry)}
                                            className="text-blue-600 hover:text-blue-700"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {auditEntries.length === 0 && (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-500">No audit entries found</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Detail Modal */}
            {selectedEntry && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Audit Entry Details</h3>
                                <button
                                    onClick={() => setSelectedEntry(null)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">ID</label>
                                    <p className="text-sm text-gray-900">{selectedEntry.id}</p>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Timestamp</label>
                                    <p className="text-sm text-gray-900">{formatTimestamp(selectedEntry.timestamp)}</p>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-medium text-gray-500">User</label>
                                    <p className="text-sm text-gray-900">{selectedEntry.userName} ({selectedEntry.userId})</p>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Action</label>
                                    <p className="text-sm">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ACTION_COLORS[selectedEntry.action]}`}>
                                            {ACTION_LABELS[selectedEntry.action] || selectedEntry.action}
                                        </span>
                                    </p>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Entity</label>
                                    <p className="text-sm text-gray-900">{selectedEntry.entityType} - {selectedEntry.entityId}</p>
                                </div>
                                
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Details</label>
                                    <pre className="mt-1 text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                                        {JSON.stringify(selectedEntry.details, null, 2)}
                                    </pre>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setSelectedEntry(null)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
