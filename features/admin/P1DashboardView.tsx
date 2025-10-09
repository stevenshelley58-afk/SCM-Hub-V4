import React, { useState, useEffect } from 'react';
import { mockRequestsData } from '../../services/api';
import { MaterialRequest } from '../../types';

const CountdownTimer: React.FC<{ targetTime: string }> = ({ targetTime }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isOverdue, setIsOverdue] = useState(false);
    
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime();
            const target = new Date(targetTime).getTime();
            const diff = target - now;
            
            if (diff < 0) {
                setIsOverdue(true);
                const overdue = Math.abs(diff);
                const hours = Math.floor(overdue / (1000 * 60 * 60));
                const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}h ${minutes}m OVERDUE`);
            } else {
                setIsOverdue(false);
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}h ${minutes}m`);
            }
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 60000); // Update every minute
        
        return () => clearInterval(interval);
    }, [targetTime]);
    
    return (
        <span className={`font-mono font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
            {timeLeft}
        </span>
    );
};

const P1RequestCard: React.FC<{ request: MaterialRequest; onApprove: (id: string) => void; onReject: (id: string) => void }> = ({ request, onApprove, onReject }) => {
    const needsApproval = request.status === 'Submitted';
    const timeSubmitted = new Date(request.createdDate);
    const minutesSinceSubmission = Math.floor((new Date().getTime() - timeSubmitted.getTime()) / (1000 * 60));
    
    const urgencyLevel = minutesSinceSubmission > 30 ? 'critical' : minutesSinceSubmission > 15 ? 'warning' : 'ok';
    
    return (
        <div className={`bg-white rounded-lg border-2 p-4 ${
            urgencyLevel === 'critical' ? 'border-red-500 bg-red-50' :
            urgencyLevel === 'warning' ? 'border-yellow-500 bg-yellow-50' :
            'border-orange-300'
        }`}>
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{request.id}</h3>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            P1 - URGENT
                        </span>
                        {urgencyLevel === 'critical' && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-600 text-white animate-pulse">
                                🔴 CRITICAL
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{request.requestorName}</p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500">Required By</div>
                    <CountdownTimer targetTime={request.RequiredByTimestamp} />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                <div>
                    <span className="text-gray-500">Items:</span>
                    <span className="ml-2 font-semibold">{request.items}</span>
                </div>
                <div>
                    <span className="text-gray-500">Work Orders:</span>
                    <span className="ml-2 font-semibold">{request.workOrders}</span>
                </div>
                <div>
                    <span className="text-gray-500">Location:</span>
                    <span className="ml-2 font-semibold">{request.DeliveryLocation}</span>
                </div>
                <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-semibold">{request.status}</span>
                </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submitted {minutesSinceSubmission} minutes ago
            </div>
            
            {needsApproval && (
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button
                        onClick={() => onApprove(request.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                    >
                        ✓ Approve
                    </button>
                    <button
                        onClick={() => onReject(request.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
                    >
                        ✕ Reject
                    </button>
                </div>
            )}
        </div>
    );
};

export const P1DashboardView: React.FC = () => {
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    
    const p1Requests = mockRequestsData.filter(req => req.priority === 'P1');
    const pendingApproval = p1Requests.filter(req => req.status === 'Submitted');
    const inProgress = p1Requests.filter(req => ['Picking', 'Staged', 'In Transit'].includes(req.status));
    const completed = p1Requests.filter(req => req.status === 'Delivered');
    
    useEffect(() => {
        if (!autoRefresh) return;
        
        const interval = setInterval(() => {
            setLastUpdate(new Date());
        }, 30000); // Refresh every 30 seconds
        
        return () => clearInterval(interval);
    }, [autoRefresh]);
    
    const handleApprove = (requestId: string) => {
        console.log(`Approving P1 request: ${requestId}`);
        // In production: Call API to approve request
        alert(`P1 Request ${requestId} approved! Warehouse can now begin picking.`);
    };
    
    const handleReject = (requestId: string) => {
        const reason = prompt('Enter rejection reason:');
        if (reason) {
            console.log(`Rejecting P1 request: ${requestId}, Reason: ${reason}`);
            // In production: Call API to reject request
            alert(`P1 Request ${requestId} rejected.`);
        }
    };
    
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">P1 Priority Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Real-time tracking of urgent P1 requests requiring MC approval
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
                    <div className="text-xs text-gray-500">
                        Last updated: {lastUpdate.toLocaleTimeString()}
                    </div>
                </div>
            </div>
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-orange-50 rounded-lg border-2 border-orange-200 p-4">
                    <div className="text-sm font-medium text-orange-700 mb-1">Total P1 Requests</div>
                    <div className="text-3xl font-bold text-orange-900">{p1Requests.length}</div>
                </div>
                <div className={`rounded-lg border-2 p-4 ${pendingApproval.length > 0 ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-200'}`}>
                    <div className={`text-sm font-medium mb-1 ${pendingApproval.length > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        Pending Approval
                    </div>
                    <div className={`text-3xl font-bold ${pendingApproval.length > 0 ? 'text-red-900' : 'text-green-900'}`}>
                        {pendingApproval.length}
                    </div>
                    {pendingApproval.length > 0 && (
                        <div className="text-xs text-red-600 mt-1 font-semibold">⚠️ Action Required</div>
                    )}
                </div>
                <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-4">
                    <div className="text-sm font-medium text-blue-700 mb-1">In Progress</div>
                    <div className="text-3xl font-bold text-blue-900">{inProgress.length}</div>
                </div>
                <div className="bg-green-50 rounded-lg border-2 border-green-200 p-4">
                    <div className="text-sm font-medium text-green-700 mb-1">Completed Today</div>
                    <div className="text-3xl font-bold text-green-900">{completed.length}</div>
                </div>
            </div>
            
            {/* Approval Queue */}
            {pendingApproval.length > 0 && (
                <div className="bg-red-50 rounded-lg border-2 border-red-300 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                        <h2 className="text-lg font-semibold text-red-900">
                            MC Approval Required ({pendingApproval.length})
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {pendingApproval.map(request => (
                            <P1RequestCard
                                key={request.id}
                                request={request}
                                onApprove={handleApprove}
                                onReject={handleReject}
                            />
                        ))}
                    </div>
                </div>
            )}
            
            {pendingApproval.length === 0 && (
                <div className="bg-green-50 rounded-lg border-2 border-green-300 p-6 text-center">
                    <svg className="mx-auto h-12 w-12 text-green-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-green-900 mb-1">All Clear!</h3>
                    <p className="text-sm text-green-700">No P1 requests pending approval</p>
                </div>
            )}
            
            {/* In Progress Requests */}
            {inProgress.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        P1 Requests In Progress ({inProgress.length})
                    </h2>
                    <div className="space-y-3">
                        {inProgress.map(request => (
                            <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900">{request.id}</span>
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {request.status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {request.requestorName} • {request.items} items • {request.DeliveryLocation}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-500 mb-1">Required By</div>
                                    <CountdownTimer targetTime={request.RequiredByTimestamp} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Escalation Alerts */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Escalation Guidelines</h2>
                <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">OK</span>
                        </div>
                        <div>
                            <div className="font-semibold text-green-900">0-15 minutes</div>
                            <div className="text-sm text-green-700">Normal response time - No action needed</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">⚠️</span>
                        </div>
                        <div>
                            <div className="font-semibold text-yellow-900">15-30 minutes</div>
                            <div className="text-sm text-yellow-700">Warning - Prioritize approval review</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                            <span className="text-white text-xs font-bold">🔴</span>
                        </div>
                        <div>
                            <div className="font-semibold text-red-900">30+ minutes</div>
                            <div className="text-sm text-red-700">Critical - Immediate MC attention required, escalate to supervisor</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
