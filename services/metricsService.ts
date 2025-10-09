import { SystemHealthMetrics } from '../types';
import { mockRequestsData } from './api';

/**
 * Calculate system health metrics
 */
export const calculateSystemHealthMetrics = (): SystemHealthMetrics => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Count requests by status
    const activeStatuses = ['Submitted', 'Picking', 'Partial Pick - Open', 'Staged', 'In Transit'];
    const activeRequests = mockRequestsData.filter(req => activeStatuses.includes(req.status)).length;
    const requestBacklog = mockRequestsData.filter(req => req.status === 'Submitted').length;
    
    // Calculate completed today (mock - in production this would query database)
    const completedToday = mockRequestsData.filter(req => 
        req.status === 'Delivered' && req.createdDate === new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    ).length;
    
    // Calculate average fulfillment time (mock calculation)
    // In production: Calculate time from Submitted to Delivered
    const avgFulfillmentTime = 4.2; // hours
    
    // Calculate short pick rate
    const totalPicks = mockRequestsData.filter(req => 
        ['Partial Pick - Open', 'Partial Pick - Closed', 'Delivered'].includes(req.status)
    ).length;
    const shortPicks = mockRequestsData.filter(req => 
        req.status.includes('Partial Pick')
    ).length;
    const shortPickRate = totalPicks > 0 ? (shortPicks / totalPicks) * 100 : 0;
    
    // P1 metrics
    const p1Requests = mockRequestsData.filter(req => req.priority === 'P1');
    const p1RequestCount = p1Requests.length;
    const p1AvgApprovalTime = 12.5; // minutes (mock)
    
    // Calculate overdue requests
    const overdueRequests = mockRequestsData.filter(req => {
        if (req.status === 'Delivered' || req.status === 'Cancelled') return false;
        const requiredBy = new Date(req.RequiredByTimestamp);
        return requiredBy < now;
    }).length;
    
    return {
        timestamp: now.toISOString(),
        requestBacklog,
        avgFulfillmentTime,
        shortPickRate,
        p1RequestCount,
        p1AvgApprovalTime,
        activeRequests,
        completedToday,
        overdueRequests
    };
};

/**
 * Get historical metrics (mock - in production this would query database)
 */
export const getHistoricalMetrics = (days: number = 7): SystemHealthMetrics[] => {
    const metrics: SystemHealthMetrics[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Generate mock historical data with some variation
        metrics.push({
            timestamp: date.toISOString(),
            requestBacklog: 3 + Math.floor(Math.random() * 5),
            avgFulfillmentTime: 3.5 + Math.random() * 2,
            shortPickRate: 8 + Math.random() * 7,
            p1RequestCount: Math.floor(Math.random() * 3),
            p1AvgApprovalTime: 10 + Math.random() * 10,
            activeRequests: 5 + Math.floor(Math.random() * 10),
            completedToday: Math.floor(Math.random() * 8),
            overdueRequests: Math.floor(Math.random() * 3)
        });
    }
    
    return metrics;
};

/**
 * Get alert thresholds
 */
export const ALERT_THRESHOLDS = {
    requestBacklog: { warning: 10, critical: 20 },
    avgFulfillmentTime: { warning: 6, critical: 12 }, // hours
    shortPickRate: { warning: 15, critical: 25 }, // percentage
    p1AvgApprovalTime: { warning: 30, critical: 60 }, // minutes
    overdueRequests: { warning: 5, critical: 10 }
};

/**
 * Check if metric exceeds threshold
 */
export const checkMetricAlert = (metric: keyof typeof ALERT_THRESHOLDS, value: number): 'ok' | 'warning' | 'critical' => {
    const thresholds = ALERT_THRESHOLDS[metric];
    if (!thresholds) return 'ok';
    
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'ok';
};
