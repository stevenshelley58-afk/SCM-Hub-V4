import { mockRequestsData, mockRequestItems } from './api';
import { MaterialRequest, ReportFilter } from '../types';

export interface RequestsByStatusReport {
    status: string;
    count: number;
    percentage: number;
}

export interface TimeToFulfillReport {
    requestId: string;
    priority: string;
    submittedDate: string;
    deliveredDate: string;
    hoursToFulfill: number;
    requestor: string;
}

export interface ShortPickReport {
    requestId: string;
    itemsRequested: number;
    itemsShorted: number;
    shortPercentage: number;
    status: string;
    requestor: string;
    createdDate: string;
}

export interface RequestorActivityReport {
    requestorName: string;
    totalRequests: number;
    p1Requests: number;
    p2Requests: number;
    p3Requests: number;
    p4Requests: number;
    avgItemsPerRequest: number;
    totalItems: number;
}

/**
 * Generate requests by status report
 */
export const generateRequestsByStatusReport = (filters?: ReportFilter): RequestsByStatusReport[] => {
    let filtered = [...mockRequestsData];
    
    // Apply filters
    if (filters?.status && filters.status.length > 0) {
        filtered = filtered.filter(req => filters.status!.includes(req.status));
    }
    if (filters?.priority && filters.priority.length > 0) {
        filtered = filtered.filter(req => filters.priority!.includes(req.priority));
    }
    if (filters?.requestor && filters.requestor.length > 0) {
        filtered = filtered.filter(req => filters.requestor!.includes(req.requestorName));
    }
    
    // Group by status
    const statusCounts: { [key: string]: number } = {};
    filtered.forEach(req => {
        statusCounts[req.status] = (statusCounts[req.status] || 0) + 1;
    });
    
    const total = filtered.length;
    
    return Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
    })).sort((a, b) => b.count - a.count);
};

/**
 * Generate time to fulfill report
 */
export const generateTimeToFulfillReport = (filters?: ReportFilter): TimeToFulfillReport[] => {
    // Filter only delivered requests
    let filtered = mockRequestsData.filter(req => req.status === 'Delivered');
    
    // Apply additional filters
    if (filters?.startDate) {
        filtered = filtered.filter(req => req.createdDate >= filters.startDate!);
    }
    if (filters?.endDate) {
        filtered = filtered.filter(req => req.createdDate <= filters.endDate!);
    }
    if (filters?.priority && filters.priority.length > 0) {
        filtered = filtered.filter(req => filters.priority!.includes(req.priority));
    }
    
    // Calculate time to fulfill (mock - in production this would use actual delivery timestamp)
    return filtered.map(req => {
        const submitted = new Date(req.createdDate);
        const delivered = new Date(submitted);
        delivered.setHours(delivered.getHours() + (Math.random() * 8 + 2)); // Mock 2-10 hours
        
        const hoursToFulfill = (delivered.getTime() - submitted.getTime()) / (1000 * 60 * 60);
        
        return {
            requestId: req.id,
            priority: req.priority,
            submittedDate: req.createdDate,
            deliveredDate: delivered.toISOString(),
            hoursToFulfill,
            requestor: req.requestorName
        };
    }).sort((a, b) => b.hoursToFulfill - a.hoursToFulfill);
};

/**
 * Generate short pick analysis report
 */
export const generateShortPickReport = (filters?: ReportFilter): ShortPickReport[] => {
    // Filter requests with short picks
    let filtered = mockRequestsData.filter(req => 
        req.status.includes('Partial Pick') || req.status === 'Delivered'
    );
    
    // Apply filters
    if (filters?.startDate) {
        filtered = filtered.filter(req => req.createdDate >= filters.startDate!);
    }
    if (filters?.endDate) {
        filtered = filtered.filter(req => req.createdDate <= filters.endDate!);
    }
    if (filters?.priority && filters.priority.length > 0) {
        filtered = filtered.filter(req => filters.priority!.includes(req.priority));
    }
    
    return filtered.map(req => {
        const items = mockRequestItems[req.id] || [];
        const itemsRequested = items.length;
        const itemsShorted = items.filter(item => item.status === 'Short').length;
        const shortPercentage = itemsRequested > 0 ? (itemsShorted / itemsRequested) * 100 : 0;
        
        return {
            requestId: req.id,
            itemsRequested,
            itemsShorted,
            shortPercentage,
            status: req.status,
            requestor: req.requestorName,
            createdDate: req.createdDate
        };
    }).filter(report => report.itemsShorted > 0)
      .sort((a, b) => b.shortPercentage - a.shortPercentage);
};

/**
 * Generate requestor activity report
 */
export const generateRequestorActivityReport = (filters?: ReportFilter): RequestorActivityReport[] => {
    let filtered = [...mockRequestsData];
    
    // Apply filters
    if (filters?.startDate) {
        filtered = filtered.filter(req => req.createdDate >= filters.startDate!);
    }
    if (filters?.endDate) {
        filtered = filtered.filter(req => req.createdDate <= filters.endDate!);
    }
    
    // Group by requestor
    const requestorData: { [key: string]: MaterialRequest[] } = {};
    filtered.forEach(req => {
        if (!requestorData[req.requestorName]) {
            requestorData[req.requestorName] = [];
        }
        requestorData[req.requestorName].push(req);
    });
    
    return Object.entries(requestorData).map(([requestorName, requests]) => {
        const totalRequests = requests.length;
        const p1Requests = requests.filter(r => r.priority === 'P1').length;
        const p2Requests = requests.filter(r => r.priority === 'P2').length;
        const p3Requests = requests.filter(r => r.priority === 'P3').length;
        const p4Requests = requests.filter(r => r.priority === 'P4').length;
        const totalItems = requests.reduce((sum, r) => sum + r.items, 0);
        const avgItemsPerRequest = totalRequests > 0 ? totalItems / totalRequests : 0;
        
        return {
            requestorName,
            totalRequests,
            p1Requests,
            p2Requests,
            p3Requests,
            p4Requests,
            avgItemsPerRequest,
            totalItems
        };
    }).sort((a, b) => b.totalRequests - a.totalRequests);
};

/**
 * Export report data to CSV
 */
export const exportToCSV = (data: any[], filename: string): void => {
    if (data.length === 0) {
        console.warn('No data to export');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
        headers.map(header => {
            const value = row[header];
            // Handle values that might contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        })
    );
    
    const csv = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

/**
 * Export report data to Excel-compatible format
 */
export const exportToExcel = (data: any[], filename: string): void => {
    // For now, export as CSV which Excel can open
    // In production, you might want to use a library like xlsx
    exportToCSV(data, filename);
};
