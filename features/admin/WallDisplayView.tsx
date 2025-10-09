import React, { useState, useEffect } from 'react';
import { mockRequestsData } from '../../services/api';

export const WallDisplayView: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        
        return () => clearInterval(interval);
    }, []);
    
    // Calculate stats
    const activeRequests = mockRequestsData.filter(req => 
        !['Delivered', 'Cancelled'].includes(req.status)
    );
    
    const p1Requests = activeRequests.filter(req => req.priority === 'P1');
    const submittedQueue = activeRequests.filter(req => req.status === 'Submitted');
    const pickingNow = activeRequests.filter(req => req.status === 'Picking');
    const inTransit = activeRequests.filter(req => req.status === 'In Transit');
    
    const statusCounts = {
        'Submitted': activeRequests.filter(r => r.status === 'Submitted').length,
        'Picking': activeRequests.filter(r => r.status === 'Picking').length,
        'Staged': activeRequests.filter(r => r.status === 'Staged').length,
        'In Transit': activeRequests.filter(r => r.status === 'In Transit').length,
        'On Hold': activeRequests.filter(r => r.status === 'On Hold').length,
    };
    
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Submitted': return 'bg-yellow-500';
            case 'Picking': return 'bg-blue-500';
            case 'Staged': return 'bg-purple-500';
            case 'In Transit': return 'bg-green-500';
            case 'On Hold': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-5xl font-bold text-white">
                        Material Request Queue
                    </h1>
                    <div className="text-right">
                        <div className="text-4xl font-bold text-white">
                            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-lg text-gray-300">
                            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>
                <div className="h-2 bg-blue-500 rounded-full"></div>
            </div>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-5 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-2xl">
                    <div className="text-blue-200 text-lg mb-2">Active Requests</div>
                    <div className="text-6xl font-bold text-white">{activeRequests.length}</div>
                </div>
                
                <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 shadow-2xl">
                    <div className="text-red-200 text-lg mb-2">🔴 P1 Urgent</div>
                    <div className="text-6xl font-bold text-white">{p1Requests.length}</div>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl p-6 shadow-2xl">
                    <div className="text-yellow-200 text-lg mb-2">Queue</div>
                    <div className="text-6xl font-bold text-white">{submittedQueue.length}</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 shadow-2xl">
                    <div className="text-purple-200 text-lg mb-2">Picking</div>
                    <div className="text-6xl font-bold text-white">{pickingNow.length}</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 shadow-2xl">
                    <div className="text-green-200 text-lg mb-2">In Transit</div>
                    <div className="text-6xl font-bold text-white">{inTransit.length}</div>
                </div>
            </div>
            
            {/* P1 Alerts */}
            {p1Requests.length > 0 && (
                <div className="bg-red-600 rounded-2xl p-6 mb-8 shadow-2xl animate-pulse">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">🔴 PRIORITY 1 ALERTS</h2>
                            <p className="text-red-100 text-xl">Urgent requests requiring immediate attention</p>
                        </div>
                        <div className="text-7xl font-bold text-white">{p1Requests.length}</div>
                    </div>
                    <div className="mt-4 space-y-2">
                        {p1Requests.slice(0, 3).map(req => (
                            <div key={req.id} className="bg-red-700 rounded-lg p-4 flex items-center justify-between">
                                <div className="text-white">
                                    <span className="font-bold text-2xl">{req.id}</span>
                                    <span className="ml-4 text-xl">{req.requestorName}</span>
                                </div>
                                <div className="text-right text-white">
                                    <div className="text-sm text-red-200">Required By</div>
                                    <div className="text-xl font-semibold">
                                        {new Date(req.RequiredByTimestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Status Breakdown */}
            <div className="grid grid-cols-2 gap-8">
                {/* Current Queue */}
                <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
                    <h2 className="text-3xl font-bold text-white mb-6">Current Queue</h2>
                    <div className="space-y-4">
                        {submittedQueue.slice(0, 5).map((req, idx) => (
                            <div key={req.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl font-bold text-gray-500">#{idx + 1}</div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">{req.id}</div>
                                        <div className="text-gray-300 text-lg">{req.requestorName}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`px-4 py-2 rounded-full text-lg font-semibold ${
                                        req.priority === 'P1' ? 'bg-red-500 text-white' :
                                        req.priority === 'P2' ? 'bg-orange-500 text-white' :
                                        req.priority === 'P3' ? 'bg-yellow-500 text-white' :
                                        'bg-green-500 text-white'
                                    }`}>
                                        {req.priority}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {submittedQueue.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">✓</div>
                                <div className="text-2xl text-gray-400">Queue is clear!</div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Status Distribution */}
                <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
                    <h2 className="text-3xl font-bold text-white mb-6">Status Distribution</h2>
                    <div className="space-y-4">
                        {Object.entries(statusCounts).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full ${getStatusColor(status)}`}></div>
                                    <div className="text-2xl font-semibold text-white">{status}</div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-4xl font-bold text-white">{count}</div>
                                    <div className="w-64 bg-gray-700 rounded-full h-4">
                                        <div
                                            className={`h-4 rounded-full ${getStatusColor(status)}`}
                                            style={{ width: `${activeRequests.length > 0 ? (count / activeRequests.length) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Auto-refresh indicator */}
            <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 bg-gray-800 rounded-full px-6 py-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-300 text-lg">Live - Auto-refreshing every 30 seconds</span>
                </div>
            </div>
        </div>
    );
};
