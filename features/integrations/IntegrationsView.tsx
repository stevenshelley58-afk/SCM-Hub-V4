import React, { useState, useEffect } from 'react';
import { 
    getNotifications, 
    notificationTemplates, 
    notificationRules,
    sendNotification,
    triggerNotification 
} from '../../services/notificationService';
import {
    getSyncHistory,
    getSyncConflicts,
    performSharePointSync,
    resolveConflict,
    getLastSyncTime,
    isSyncActive
} from '../../services/sharepointSyncService';
import {
    getDeliveryTasks,
    getDrivers,
    sendToLTR,
    retryDelivery,
    getLTRConnectionStatus
} from '../../services/ltrIntegrationService';
import { exportMaterialRequests, exportToCSV, exportToJSON } from '../../services/exportService';
import { mockRequestsData } from '../../services/api';
import type { Notification } from '../../types/index';
import { StatusPill } from '../../components/ui/StatusPill';
import { Toast } from '../../components/ui/Toast';

// Notification Dashboard Component
const NotificationDashboard = () => {
    const [notifications, setNotifications] = useState(getNotifications());
    const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');
    const [testRecipient, setTestRecipient] = useState('user@toll.com');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const filteredNotifications = filter === 'all' 
        ? notifications 
        : notifications.filter(n => n.status === filter);

    const handleTestNotification = async () => {
        try {
            await sendNotification(
                'email',
                testRecipient,
                'Test Notification',
                'This is a test notification from SCM Hub.',
                undefined
            );
            setToastMessage('Test notification sent successfully!');
            setShowToast(true);
            setNotifications(getNotifications());
        } catch (error) {
            setToastMessage('Failed to send notification');
            setShowToast(true);
        }
    };

    const stats = {
        total: notifications.length,
        pending: notifications.filter(n => n.status === 'pending').length,
        sent: notifications.filter(n => n.status === 'sent').length,
        failed: notifications.filter(n => n.status === 'failed').length
    };

    return React.createElement('div', { className: 'space-y-6' },
        showToast && React.createElement(Toast, {
            message: toastMessage,
            type: toastMessage.includes('success') ? 'success' : 'error',
            onClose: () => setShowToast(false)
        }),

        // Stats
        React.createElement('div', { className: 'grid grid-cols-4 gap-4' },
            React.createElement('div', { className: 'bg-blue-50 p-4 rounded-lg' },
                React.createElement('div', { className: 'text-2xl font-bold text-blue-700' }, stats.total),
                React.createElement('div', { className: 'text-sm text-blue-600' }, 'Total Notifications')
            ),
            React.createElement('div', { className: 'bg-yellow-50 p-4 rounded-lg' },
                React.createElement('div', { className: 'text-2xl font-bold text-yellow-700' }, stats.pending),
                React.createElement('div', { className: 'text-sm text-yellow-600' }, 'Pending')
            ),
            React.createElement('div', { className: 'bg-green-50 p-4 rounded-lg' },
                React.createElement('div', { className: 'text-2xl font-bold text-green-700' }, stats.sent),
                React.createElement('div', { className: 'text-sm text-green-600' }, 'Sent')
            ),
            React.createElement('div', { className: 'bg-red-50 p-4 rounded-lg' },
                React.createElement('div', { className: 'text-2xl font-bold text-red-700' }, stats.failed),
                React.createElement('div', { className: 'text-sm text-red-600' }, 'Failed')
            )
        ),

        // Test Notification
        React.createElement('div', { className: 'bg-white p-4 rounded-lg border border-gray-200' },
            React.createElement('h3', { className: 'text-lg font-semibold mb-3' }, 'Test Notification'),
            React.createElement('div', { className: 'flex gap-3' },
                React.createElement('input', {
                    type: 'email',
                    value: testRecipient,
                    onChange: (e) => setTestRecipient(e.target.value),
                    placeholder: 'Recipient email',
                    className: 'flex-1 px-3 py-2 border border-gray-300 rounded-md'
                }),
                React.createElement('button', {
                    onClick: handleTestNotification,
                    className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
                }, 'Send Test')
            )
        ),

        // Filters
        React.createElement('div', { className: 'flex gap-2' },
            ['all', 'pending', 'sent', 'failed'].map(f => 
                React.createElement('button', {
                    key: f,
                    onClick: () => setFilter(f as any),
                    className: `px-4 py-2 rounded-md ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`
                }, f.charAt(0).toUpperCase() + f.slice(1))
            )
        ),

        // Notifications List
        React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 overflow-hidden' },
            React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
                    React.createElement('thead', { className: 'bg-gray-50' },
                        React.createElement('tr', null,
                            ['Type', 'Recipient', 'Subject', 'Status', 'MRF ID', 'Sent At'].map(header =>
                                React.createElement('th', {
                                    key: header,
                                    className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                                }, header)
                            )
                        )
                    ),
                    React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
                        filteredNotifications.slice(0, 20).map(notif =>
                            React.createElement('tr', { key: notif.id },
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm' },
                                    React.createElement('span', {
                                        className: `px-2 py-1 rounded text-xs font-medium ${
                                            notif.type === 'email' ? 'bg-blue-100 text-blue-800' :
                                            notif.type === 'sms' ? 'bg-green-100 text-green-800' :
                                            notif.type === 'teams' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`
                                    }, notif.type.toUpperCase())
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, notif.recipient),
                                React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900' }, notif.subject || '-'),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                    React.createElement(StatusPill, { status: notif.status })
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, notif.mrfId || '-'),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500' }, 
                                    notif.sentAt ? new Date(notif.sentAt).toLocaleString() : 'Pending'
                                )
                            )
                        )
                    )
                )
            )
        )
    );
};

// SharePoint Sync Dashboard Component
const SharePointSyncDashboard = () => {
    const [syncHistory, setSyncHistory] = useState(getSyncHistory());
    const [conflicts, setConflicts] = useState(getSyncConflicts(false));
    const [isSyncing, setIsSyncing] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const handleManualSync = async () => {
        setIsSyncing(true);
        try {
            const result = await performSharePointSync();
            setToastMessage(`Sync completed! Processed ${result.recordsProcessed} records.`);
            setShowToast(true);
            setSyncHistory(getSyncHistory());
            setConflicts(getSyncConflicts(false));
        } catch (error) {
            setToastMessage('Sync failed: ' + (error as Error).message);
            setShowToast(true);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleResolveConflict = (pKey: string, field: string, resolution: 'use_sharepoint' | 'use_system') => {
        resolveConflict(pKey, field, resolution);
        setConflicts(getSyncConflicts(false));
        setToastMessage('Conflict resolved successfully');
        setShowToast(true);
    };

    return React.createElement('div', { className: 'space-y-6' },
        showToast && React.createElement(Toast, {
            message: toastMessage,
            type: toastMessage.includes('success') || toastMessage.includes('completed') ? 'success' : 'error',
            onClose: () => setShowToast(false)
        }),

        // Sync Controls
        React.createElement('div', { className: 'bg-white p-6 rounded-lg border border-gray-200' },
            React.createElement('div', { className: 'flex justify-between items-center mb-4' },
                React.createElement('div', null,
                    React.createElement('h3', { className: 'text-lg font-semibold' }, 'SharePoint Data Sync'),
                    React.createElement('p', { className: 'text-sm text-gray-500' }, 
                        'Last sync: ' + (getLastSyncTime() ? new Date(getLastSyncTime()!).toLocaleString() : 'Never')
                    )
                ),
                React.createElement('button', {
                    onClick: handleManualSync,
                    disabled: isSyncing || isSyncActive(),
                    className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                }, isSyncing ? 'Syncing...' : 'Manual Sync')
            ),
            
            // Conflicts Alert
            conflicts.length > 0 && React.createElement('div', { className: 'bg-yellow-50 border border-yellow-200 rounded-md p-4' },
                React.createElement('div', { className: 'flex items-center' },
                    React.createElement('span', { className: 'text-yellow-800 font-medium' }, 
                        `⚠️ ${conflicts.length} unresolved conflict(s) detected`
                    )
                )
            )
        ),

        // Sync History
        React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 overflow-hidden' },
            React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200' },
                React.createElement('h3', { className: 'text-lg font-semibold' }, 'Sync History')
            ),
            React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
                    React.createElement('thead', { className: 'bg-gray-50' },
                        React.createElement('tr', null,
                            ['Time', 'Status', 'Records', 'Added', 'Updated', 'Conflicts', 'Duration'].map(header =>
                                React.createElement('th', {
                                    key: header,
                                    className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                                }, header)
                            )
                        )
                    ),
                    React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
                        syncHistory.map(sync =>
                            React.createElement('tr', { key: sync.id },
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, 
                                    new Date(sync.timestamp).toLocaleString()
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                    React.createElement(StatusPill, { status: sync.status })
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, sync.recordsProcessed),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, sync.recordsAdded),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, sync.recordsUpdated),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, 
                                    sync.recordsConflict > 0 
                                        ? React.createElement('span', { className: 'text-yellow-600 font-medium' }, sync.recordsConflict)
                                        : sync.recordsConflict
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500' }, 
                                    `${(sync.duration / 1000).toFixed(1)}s`
                                )
                            )
                        )
                    )
                )
            )
        ),

        // Conflicts Table
        conflicts.length > 0 && React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 overflow-hidden' },
            React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200' },
                React.createElement('h3', { className: 'text-lg font-semibold' }, 'Data Conflicts')
            ),
            React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
                    React.createElement('thead', { className: 'bg-gray-50' },
                        React.createElement('tr', null,
                            ['pKey', 'Field', 'SharePoint Value', 'System Value', 'Actions'].map(header =>
                                React.createElement('th', {
                                    key: header,
                                    className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                                }, header)
                            )
                        )
                    ),
                    React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
                        conflicts.map(conflict =>
                            React.createElement('tr', { key: `${conflict.pKey}-${conflict.field}` },
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900' }, conflict.pKey),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, conflict.field),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, 
                                    String(conflict.sharePointValue)
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, 
                                    String(conflict.systemValue)
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm space-x-2' },
                                    React.createElement('button', {
                                        onClick: () => handleResolveConflict(conflict.pKey, conflict.field, 'use_sharepoint'),
                                        className: 'px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700'
                                    }, 'Use SharePoint'),
                                    React.createElement('button', {
                                        onClick: () => handleResolveConflict(conflict.pKey, conflict.field, 'use_system'),
                                        className: 'px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700'
                                    }, 'Use System')
                                )
                            )
                        )
                    )
                )
            )
        )
    );
};

// LTR Integration Dashboard Component
const LTRDashboard = () => {
    const [tasks, setTasks] = useState(getDeliveryTasks());
    const [drivers, setDrivers] = useState(getDrivers());
    const [connectionStatus] = useState(getLTRConnectionStatus());

    const handleRetry = async (taskId: string) => {
        try {
            await retryDelivery(taskId);
            setTasks(getDeliveryTasks());
        } catch (error) {
            alert((error as Error).message);
        }
    };

    return React.createElement('div', { className: 'space-y-6' },
        // Connection Status
        React.createElement('div', { className: 'bg-white p-4 rounded-lg border border-gray-200' },
            React.createElement('div', { className: 'flex items-center justify-between' },
                React.createElement('h3', { className: 'text-lg font-semibold' }, 'LTR System Status'),
                React.createElement('span', {
                    className: `px-3 py-1 rounded-full text-sm font-medium ${
                        connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                        connectionStatus === 'disconnected' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                    }`
                }, connectionStatus.toUpperCase())
            )
        ),

        // Delivery Tasks
        React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 overflow-hidden' },
            React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200' },
                React.createElement('h3', { className: 'text-lg font-semibold' }, 'Delivery Tasks')
            ),
            React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
                    React.createElement('thead', { className: 'bg-gray-50' },
                        React.createElement('tr', null,
                            ['Task ID', 'MRF', 'Status', 'Driver', 'From', 'To', 'Priority', 'ETA', 'Actions'].map(header =>
                                React.createElement('th', {
                                    key: header,
                                    className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                                }, header)
                            )
                        )
                    ),
                    React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
                        tasks.map(task =>
                            React.createElement('tr', { key: task.id },
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900' }, task.id.slice(0, 15) + '...'),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, task.mrfId),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                    React.createElement(StatusPill, { status: task.status.replace('_', ' ') })
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, task.driver || '-'),
                                React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900' }, task.pickupLocation),
                                React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900' }, task.deliveryLocation),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                    React.createElement(StatusPill, { status: task.priority })
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500' }, 
                                    task.estimatedDeliveryTime ? new Date(task.estimatedDeliveryTime).toLocaleTimeString() : '-'
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm' },
                                    task.status === 'failed' && task.retryCount < task.maxRetries &&
                                    React.createElement('button', {
                                        onClick: () => handleRetry(task.id),
                                        className: 'px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700'
                                    }, 'Retry')
                                )
                            )
                        )
                    )
                )
            )
        ),

        // Drivers
        React.createElement('div', { className: 'bg-white rounded-lg border border-gray-200 overflow-hidden' },
            React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200' },
                React.createElement('h3', { className: 'text-lg font-semibold' }, 'Drivers')
            ),
            React.createElement('div', { className: 'grid grid-cols-3 gap-4 p-6' },
                drivers.map(driver =>
                    React.createElement('div', { 
                        key: driver.id,
                        className: 'border border-gray-200 rounded-lg p-4'
                    },
                        React.createElement('div', { className: 'flex justify-between items-start mb-2' },
                            React.createElement('div', { className: 'font-semibold' }, driver.name),
                            React.createElement('span', {
                                className: `px-2 py-1 rounded text-xs font-medium ${
                                    driver.status === 'available' ? 'bg-green-100 text-green-800' :
                                    driver.status === 'busy' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }`
                            }, driver.status)
                        ),
                        React.createElement('div', { className: 'text-sm text-gray-600' }, 
                            `Vehicle: ${driver.vehicle}`
                        ),
                        React.createElement('div', { className: 'text-sm text-gray-600' }, 
                            `Location: ${driver.currentLocation || 'Unknown'}`
                        )
                    )
                )
            )
        )
    );
};

// Data Export Component
const DataExportView = () => {
    const [showToast, setShowToast] = useState(false);

    const handleExport = (format: 'csv' | 'excel' | 'json') => {
        if (format === 'json') {
            exportToJSON(mockRequestsData, 'material-requests');
        } else {
            exportMaterialRequests(mockRequestsData, format);
        }
        setShowToast(true);
    };

    return React.createElement('div', { className: 'space-y-6' },
        showToast && React.createElement(Toast, {
            message: 'Export started! Check your downloads.',
            type: 'success',
            onClose: () => setShowToast(false)
        }),

        React.createElement('div', { className: 'bg-white p-6 rounded-lg border border-gray-200' },
            React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Export Material Requests'),
            React.createElement('p', { className: 'text-sm text-gray-600 mb-4' }, 
                'Export all material request data in your preferred format.'
            ),
            React.createElement('div', { className: 'flex gap-3' },
                React.createElement('button', {
                    onClick: () => handleExport('excel'),
                    className: 'px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2'
                }, 
                    React.createElement('span', null, '📊'),
                    'Export to Excel'
                ),
                React.createElement('button', {
                    onClick: () => handleExport('csv'),
                    className: 'px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2'
                }, 
                    React.createElement('span', null, '📄'),
                    'Export to CSV'
                ),
                React.createElement('button', {
                    onClick: () => handleExport('json'),
                    className: 'px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2'
                }, 
                    React.createElement('span', null, '{}'),
                    'Export to JSON'
                )
            )
        )
    );
};

// Main Integrations View
export const IntegrationsView = () => {
    const [activeTab, setActiveTab] = useState('notifications');

    const tabs = [
        { id: 'notifications', label: 'Notifications', component: NotificationDashboard },
        { id: 'sharepoint', label: 'SharePoint Sync', component: SharePointSyncDashboard },
        { id: 'ltr', label: 'LTR Delivery', component: LTRDashboard },
        { id: 'export', label: 'Data Export', component: DataExportView }
    ];

    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || NotificationDashboard;

    return React.createElement('div', { className: 'h-full flex flex-col' },
        // Tabs
        React.createElement('div', { className: 'border-b border-gray-200 mb-6' },
            React.createElement('nav', { className: 'flex space-x-8' },
                tabs.map(tab =>
                    React.createElement('button', {
                        key: tab.id,
                        onClick: () => setActiveTab(tab.id),
                        className: `py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`
                    }, tab.label)
                )
            )
        ),

        // Content
        React.createElement('div', { className: 'flex-1 overflow-auto' },
            React.createElement(ActiveComponent, null)
        )
    );
};
