import React, { useState, useMemo } from 'react';
import {
    generateRequestsByStatusReport,
    generateTimeToFulfillReport,
    generateShortPickReport,
    generateRequestorActivityReport,
    exportToCSV,
    exportToExcel
} from '../../services/reportService';
import { ReportFilter } from '../../types';

type ReportType = 'status' | 'fulfillment' | 'shortPick' | 'requestorActivity';

export const ReportsView: React.FC = () => {
    const [activeReport, setActiveReport] = useState<ReportType>('status');
    const [filters, setFilters] = useState<ReportFilter>({
        startDate: '',
        endDate: '',
        status: [],
        priority: [],
        requestor: []
    });
    
    const statusReport = useMemo(() => generateRequestsByStatusReport(filters), [filters]);
    const fulfillmentReport = useMemo(() => generateTimeToFulfillReport(filters), [filters]);
    const shortPickReport = useMemo(() => generateShortPickReport(filters), [filters]);
    const requestorReport = useMemo(() => generateRequestorActivityReport(filters), [filters]);
    
    const handleExport = (format: 'csv' | 'excel') => {
        let data: any[] = [];
        let filename = '';
        
        switch (activeReport) {
            case 'status':
                data = statusReport;
                filename = 'requests-by-status';
                break;
            case 'fulfillment':
                data = fulfillmentReport;
                filename = 'time-to-fulfill';
                break;
            case 'shortPick':
                data = shortPickReport;
                filename = 'short-pick-analysis';
                break;
            case 'requestorActivity':
                data = requestorReport;
                filename = 'requestor-activity';
                break;
        }
        
        if (format === 'csv') {
            exportToCSV(data, filename);
        } else {
            exportToExcel(data, filename);
        }
    };
    
    const reportTabs = [
        { id: 'status' as ReportType, label: 'Requests by Status', icon: '📊' },
        { id: 'fulfillment' as ReportType, label: 'Time to Fulfill', icon: '⏱️' },
        { id: 'shortPick' as ReportType, label: 'Short Pick Analysis', icon: '⚠️' },
        { id: 'requestorActivity' as ReportType, label: 'Requestor Activity', icon: '👥' }
    ];
    
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Comprehensive Reports</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Generate insights and export data for analysis
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleExport('csv')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export CSV
                    </button>
                    <button
                        onClick={() => handleExport('excel')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export Excel
                    </button>
                </div>
            </div>
            
            {/* Report Tabs */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        {reportTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveReport(tab.id)}
                                className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                                    activeReport === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                
                {/* Filters */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                            <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                multiple
                                value={filters.priority}
                                onChange={(e) => setFilters({ ...filters, priority: Array.from(e.target.selectedOptions, option => option.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="P1">P1</option>
                                <option value="P2">P2</option>
                                <option value="P3">P3</option>
                                <option value="P4">P4</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ startDate: '', endDate: '', status: [], priority: [], requestor: [] })}
                                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Report Content */}
                <div className="p-6">
                    {activeReport === 'status' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Requests by Status</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visual</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {statusReport.map((row) => (
                                            <tr key={row.status}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.status}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.count}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.percentage.toFixed(1)}%</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${row.percentage}%` }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {activeReport === 'fulfillment' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Time to Fulfill Analysis</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requestor</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours to Fulfill</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {fulfillmentReport.map((row) => (
                                            <tr key={row.requestId}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.requestId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        row.priority === 'P1' ? 'bg-red-100 text-red-800' :
                                                        row.priority === 'P2' ? 'bg-orange-100 text-orange-800' :
                                                        row.priority === 'P3' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {row.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.requestor}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.submittedDate}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.hoursToFulfill.toFixed(1)}h</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {activeReport === 'shortPick' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Short Pick Analysis</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requestor</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items Requested</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items Shorted</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Short %</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {shortPickReport.map((row) => (
                                            <tr key={row.requestId}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.requestId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.requestor}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.itemsRequested}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{row.itemsShorted}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.shortPercentage.toFixed(1)}%</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {activeReport === 'requestorActivity' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Requestor Activity Report</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requestor</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Requests</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">P1</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">P2</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">P3</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">P4</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Items</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Items/Request</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {requestorReport.map((row) => (
                                            <tr key={row.requestorName}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.requestorName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.totalRequests}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.p1Requests}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.p2Requests}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.p3Requests}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.p4Requests}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.totalItems}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.avgItemsPerRequest.toFixed(1)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
