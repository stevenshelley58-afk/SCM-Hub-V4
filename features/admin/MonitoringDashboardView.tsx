import React, { useState, useMemo } from 'react';
import { getErrorLogs, getErrorStats } from '../../services/errorLoggingService';
import { getPerformanceMetrics, getPerformanceStats } from '../../services/performanceMonitoringService';

export const MonitoringDashboardView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'errors' | 'performance'>('errors');
    
    const errorStats = useMemo(() => getErrorStats(), []);
    const perfStats = useMemo(() => getPerformanceStats(), []);
    const errorLogs = useMemo(() => getErrorLogs({ limit: 50 }), []);
    const perfMetrics = useMemo(() => getPerformanceMetrics({ limit: 50 }), []);
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Monitoring Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Error logging and performance monitoring
                </p>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                    <button
                        onClick={() => setActiveTab('errors')}
                        className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'errors'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        🔥 Error Logs ({errorStats.total})
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'performance'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        ⚡ Performance ({perfStats.totalMetrics})
                    </button>
                </nav>
            </div>
            
            {/* Error Logs Tab */}
            {activeTab === 'errors' && (
                <div className="space-y-6">
                    {/* Error Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="text-sm text-gray-600 mb-1">Total Errors</div>
                            <div className="text-2xl font-bold text-red-600">{errorStats.errors}</div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="text-sm text-gray-600 mb-1">Warnings</div>
                            <div className="text-2xl font-bold text-yellow-600">{errorStats.warnings}</div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="text-sm text-gray-600 mb-1">Info</div>
                            <div className="text-2xl font-bold text-blue-600">{errorStats.info}</div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="text-sm text-gray-600 mb-1">Last 24h</div>
                            <div className="text-2xl font-bold text-gray-900">{errorStats.last24h}</div>
                        </div>
                    </div>
                    
                    {/* Error Logs Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Component</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {errorLogs.map(log => (
                                        <tr key={log.id}>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    log.level === 'error' ? 'bg-red-100 text-red-800' :
                                                    log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {log.level}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 max-w-md truncate">
                                                {log.message}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {log.component || log.additionalData?.component || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Performance Tab */}
            {activeTab === 'performance' && (
                <div className="space-y-6">
                    {/* Performance Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="text-sm text-gray-600 mb-1">Avg Page Load</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {perfStats.avgPageLoad.toFixed(0)}ms
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="text-sm text-gray-600 mb-1">Avg API Call</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {perfStats.avgApiCall.toFixed(0)}ms
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="text-sm text-gray-600 mb-1">Slow Operations</div>
                            <div className="text-2xl font-bold text-orange-600">
                                {perfStats.slowOperations}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="text-sm text-gray-600 mb-1">Error Rate</div>
                            <div className="text-2xl font-bold text-red-600">
                                {perfStats.errorRate.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                    
                    {/* Performance Metrics Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {perfMetrics.map(metric => (
                                        <tr key={metric.id}>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                                {new Date(metric.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    {metric.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {metric.name}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`text-sm font-semibold ${
                                                    metric.duration > 3000 ? 'text-red-600' :
                                                    metric.duration > 1000 ? 'text-yellow-600' :
                                                    'text-green-600'
                                                }`}>
                                                    {metric.duration}ms
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    metric.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {metric.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
