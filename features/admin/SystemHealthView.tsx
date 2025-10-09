import React, { useState, useEffect } from 'react';
import { calculateSystemHealthMetrics, getHistoricalMetrics, checkMetricAlert, ALERT_THRESHOLDS } from '../../services/metricsService';
import { SystemHealthMetrics } from '../../types';

const MetricCard: React.FC<{
    title: string;
    value: string | number;
    unit?: string;
    trend?: 'up' | 'down' | 'neutral';
    alert?: 'ok' | 'warning' | 'critical';
    subtitle?: string;
}> = ({ title, value, unit, trend, alert, subtitle }) => {
    const alertColors = {
        ok: 'border-green-200 bg-green-50',
        warning: 'border-yellow-200 bg-yellow-50',
        critical: 'border-red-200 bg-red-50'
    };
    
    const alertTextColors = {
        ok: 'text-green-700',
        warning: 'text-yellow-700',
        critical: 'text-red-700'
    };
    
    return (
        <div className={`bg-white rounded-lg border-2 p-6 ${alert ? alertColors[alert] : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">{title}</h3>
                {alert && alert !== 'ok' && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${alert === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {alert === 'critical' ? '🔴 Critical' : '⚠️ Warning'}
                    </span>
                )}
            </div>
            <div className="flex items-baseline">
                <span className={`text-3xl font-bold ${alert ? alertTextColors[alert] : 'text-gray-900'}`}>
                    {value}
                </span>
                {unit && <span className="ml-2 text-sm text-gray-500">{unit}</span>}
            </div>
            {subtitle && (
                <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
            )}
            {trend && (
                <div className="mt-2 flex items-center">
                    {trend === 'up' && (
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    )}
                    {trend === 'down' && (
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>
            )}
        </div>
    );
};

export const SystemHealthView: React.FC = () => {
    const [metrics, setMetrics] = useState<SystemHealthMetrics>(calculateSystemHealthMetrics());
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [historicalData] = useState(getHistoricalMetrics(7));
    
    useEffect(() => {
        if (!autoRefresh) return;
        
        const interval = setInterval(() => {
            setMetrics(calculateSystemHealthMetrics());
        }, 30000); // Refresh every 30 seconds
        
        return () => clearInterval(interval);
    }, [autoRefresh]);
    
    const handleRefresh = () => {
        setMetrics(calculateSystemHealthMetrics());
    };
    
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">System Health Monitoring</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Real-time metrics and performance indicators
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        Auto-refresh (30s)
                    </label>
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>
            
            {/* Last Updated */}
            <div className="text-sm text-gray-500">
                Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
            </div>
            
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Active Requests"
                    value={metrics.activeRequests}
                    subtitle="Currently in system"
                />
                <MetricCard
                    title="Request Backlog"
                    value={metrics.requestBacklog}
                    subtitle="Awaiting pickup"
                    alert={checkMetricAlert('requestBacklog', metrics.requestBacklog)}
                />
                <MetricCard
                    title="Completed Today"
                    value={metrics.completedToday}
                    subtitle="Delivered requests"
                    trend="up"
                />
                <MetricCard
                    title="Overdue Requests"
                    value={metrics.overdueRequests}
                    subtitle="Past required date"
                    alert={checkMetricAlert('overdueRequests', metrics.overdueRequests)}
                />
            </div>
            
            {/* Performance Metrics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard
                        title="Avg Fulfillment Time"
                        value={metrics.avgFulfillmentTime.toFixed(1)}
                        unit="hours"
                        alert={checkMetricAlert('avgFulfillmentTime', metrics.avgFulfillmentTime)}
                        subtitle={`Target: < ${ALERT_THRESHOLDS.avgFulfillmentTime.warning}hrs`}
                    />
                    <MetricCard
                        title="Short Pick Rate"
                        value={metrics.shortPickRate.toFixed(1)}
                        unit="%"
                        alert={checkMetricAlert('shortPickRate', metrics.shortPickRate)}
                        subtitle={`Target: < ${ALERT_THRESHOLDS.shortPickRate.warning}%`}
                    />
                    <MetricCard
                        title="P1 Avg Approval Time"
                        value={metrics.p1AvgApprovalTime.toFixed(1)}
                        unit="min"
                        alert={checkMetricAlert('p1AvgApprovalTime', metrics.p1AvgApprovalTime)}
                        subtitle={`Target: < ${ALERT_THRESHOLDS.p1AvgApprovalTime.warning}min`}
                    />
                </div>
            </div>
            
            {/* P1 Priority Tracking */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">P1 Priority Tracking</h2>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${metrics.p1RequestCount === 0 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {metrics.p1RequestCount} Active P1 Requests
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="text-sm font-medium text-orange-700 mb-1">P1 Request Count</div>
                        <div className="text-2xl font-bold text-orange-900">{metrics.p1RequestCount}</div>
                        <div className="text-xs text-orange-600 mt-1">Requires MC approval</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-700 mb-1">Avg Approval Time</div>
                        <div className="text-2xl font-bold text-blue-900">{metrics.p1AvgApprovalTime.toFixed(1)} min</div>
                        <div className="text-xs text-blue-600 mt-1">From submission to approval</div>
                    </div>
                </div>
            </div>
            
            {/* Alert Thresholds Reference */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Alert Thresholds</h2>
                <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-700">Request Backlog</span>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-yellow-600">⚠️ Warning: {ALERT_THRESHOLDS.requestBacklog.warning}+</span>
                            <span className="text-red-600">🔴 Critical: {ALERT_THRESHOLDS.requestBacklog.critical}+</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-700">Avg Fulfillment Time</span>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-yellow-600">⚠️ Warning: {ALERT_THRESHOLDS.avgFulfillmentTime.warning}+ hrs</span>
                            <span className="text-red-600">🔴 Critical: {ALERT_THRESHOLDS.avgFulfillmentTime.critical}+ hrs</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-700">Short Pick Rate</span>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-yellow-600">⚠️ Warning: {ALERT_THRESHOLDS.shortPickRate.warning}%+</span>
                            <span className="text-red-600">🔴 Critical: {ALERT_THRESHOLDS.shortPickRate.critical}%+</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-700">P1 Approval Time</span>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-yellow-600">⚠️ Warning: {ALERT_THRESHOLDS.p1AvgApprovalTime.warning}+ min</span>
                            <span className="text-red-600">🔴 Critical: {ALERT_THRESHOLDS.p1AvgApprovalTime.critical}+ min</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-700">Overdue Requests</span>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-yellow-600">⚠️ Warning: {ALERT_THRESHOLDS.overdueRequests.warning}+</span>
                            <span className="text-red-600">🔴 Critical: {ALERT_THRESHOLDS.overdueRequests.critical}+</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* 7-Day Trend */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">7-Day Trend</h2>
                <div className="space-y-4">
                    <div className="text-sm text-gray-500">
                        Historical data (last 7 days)
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Backlog</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fulfillment</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Short Pick %</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {historicalData.map((day, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                            {new Date(day.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">{day.requestBacklog}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">{day.avgFulfillmentTime.toFixed(1)}h</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">{day.shortPickRate.toFixed(1)}%</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">{day.completedToday}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
