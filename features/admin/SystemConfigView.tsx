import React, { useState } from 'react';

interface SystemConfig {
    maxItemsPerRequest: number;
    maxConcurrentRequestsPerUser: number;
    p1RequiresApproval: boolean;
    autoAssignPriority: boolean;
    enableNotifications: boolean;
    enableAuditLog: boolean;
    sessionTimeoutMinutes: number;
    backlogWarningThreshold: number;
    backlogCriticalThreshold: number;
}

const defaultConfig: SystemConfig = {
    maxItemsPerRequest: 50,
    maxConcurrentRequestsPerUser: 10,
    p1RequiresApproval: true,
    autoAssignPriority: true,
    enableNotifications: true,
    enableAuditLog: true,
    sessionTimeoutMinutes: 60,
    backlogWarningThreshold: 10,
    backlogCriticalThreshold: 20
};

export const SystemConfigView: React.FC = () => {
    const [config, setConfig] = useState<SystemConfig>(defaultConfig);
    const [hasChanges, setHasChanges] = useState(false);
    
    const handleConfigChange = (key: keyof SystemConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };
    
    const handleSave = () => {
        console.log('Saving configuration:', config);
        // In production: Save to database
        alert('✅ Configuration saved successfully!');
        setHasChanges(false);
    };
    
    const handleReset = () => {
        if (confirm('Reset all settings to defaults?')) {
            setConfig(defaultConfig);
            setHasChanges(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">System Configuration</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Configure system limits, features, and behavior
                    </p>
                </div>
                {hasChanges && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save Changes
                        </button>
                    </div>
                )}
            </div>
            
            {/* Request Limits */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">📦 Request Limits</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Items Per Request
                        </label>
                        <input
                            type="number"
                            value={config.maxItemsPerRequest}
                            onChange={(e) => handleConfigChange('maxItemsPerRequest', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            min={1}
                            max={100}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Maximum number of items allowed in a single material request
                        </p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Concurrent Requests Per User
                        </label>
                        <input
                            type="number"
                            value={config.maxConcurrentRequestsPerUser}
                            onChange={(e) => handleConfigChange('maxConcurrentRequestsPerUser', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            min={1}
                            max={50}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Maximum number of active requests a single user can have
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Workflow Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">⚙️ Workflow Settings</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <div className="font-medium text-gray-900">P1 Requires MC Approval</div>
                            <div className="text-sm text-gray-500">P1 requests must be approved before picking</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.p1RequiresApproval}
                                onChange={(e) => handleConfigChange('p1RequiresApproval', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <div className="font-medium text-gray-900">Auto-Assign Priority</div>
                            <div className="text-sm text-gray-500">Automatically assign priority based on required date</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.autoAssignPriority}
                                onChange={(e) => handleConfigChange('autoAssignPriority', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>
            
            {/* System Features */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">🔧 System Features</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <div className="font-medium text-gray-900">Enable Notifications</div>
                            <div className="text-sm text-gray-500">Send email/SMS notifications for status changes</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.enableNotifications}
                                onChange={(e) => handleConfigChange('enableNotifications', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <div className="font-medium text-gray-900">Enable Audit Logging</div>
                            <div className="text-sm text-gray-500">Log all system actions to audit trail</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={config.enableAuditLog}
                                onChange={(e) => handleConfigChange('enableAuditLog', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>
            
            {/* Security Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">🔒 Security Settings</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Session Timeout (minutes)
                        </label>
                        <input
                            type="number"
                            value={config.sessionTimeoutMinutes}
                            onChange={(e) => handleConfigChange('sessionTimeoutMinutes', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            min={5}
                            max={480}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Automatically log out inactive users after this time
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Alert Thresholds */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">⚠️ Alert Thresholds</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Backlog Warning Threshold
                        </label>
                        <input
                            type="number"
                            value={config.backlogWarningThreshold}
                            onChange={(e) => handleConfigChange('backlogWarningThreshold', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            min={1}
                            max={50}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Show warning when backlog exceeds this many requests
                        </p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Backlog Critical Threshold
                        </label>
                        <input
                            type="number"
                            value={config.backlogCriticalThreshold}
                            onChange={(e) => handleConfigChange('backlogCriticalThreshold', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            min={1}
                            max={100}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Show critical alert when backlog exceeds this many requests
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Current Configuration Summary */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-4">📋 Current Configuration</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="text-blue-600 font-medium">Max Items Per Request</div>
                        <div className="text-blue-900 font-semibold">{config.maxItemsPerRequest}</div>
                    </div>
                    <div>
                        <div className="text-blue-600 font-medium">Max Concurrent Requests</div>
                        <div className="text-blue-900 font-semibold">{config.maxConcurrentRequestsPerUser}</div>
                    </div>
                    <div>
                        <div className="text-blue-600 font-medium">P1 Approval</div>
                        <div className="text-blue-900 font-semibold">{config.p1RequiresApproval ? 'Required' : 'Not Required'}</div>
                    </div>
                    <div>
                        <div className="text-blue-600 font-medium">Session Timeout</div>
                        <div className="text-blue-900 font-semibold">{config.sessionTimeoutMinutes} min</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
