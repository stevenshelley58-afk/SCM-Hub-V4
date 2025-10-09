/**
 * Performance Monitoring Service
 * Track page load times, API calls, and user interactions
 */

export interface PerformanceMetric {
    id: string;
    timestamp: string;
    type: 'page_load' | 'api_call' | 'user_action' | 'component_render';
    name: string;
    duration: number; // milliseconds
    status: 'success' | 'error';
    url?: string;
    userId?: string;
    additionalData?: any;
}

// In-memory storage
let performanceMetrics: PerformanceMetric[] = [];
const MAX_METRICS = 1000;

/**
 * Record a performance metric
 */
export const recordMetric = (
    type: PerformanceMetric['type'],
    name: string,
    duration: number,
    status: 'success' | 'error' = 'success',
    additionalData?: any
): void => {
    const metric: PerformanceMetric = {
        id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type,
        name,
        duration,
        status,
        url: window.location.href,
        userId: 'mc', // Mock - would come from auth context
        additionalData
    };
    
    performanceMetrics.unshift(metric);
    
    // Keep only last MAX_METRICS entries
    if (performanceMetrics.length > MAX_METRICS) {
        performanceMetrics = performanceMetrics.slice(0, MAX_METRICS);
    }
    
    // Log slow operations
    if (duration > 3000) {
        console.warn('[PERFORMANCE] Slow operation detected:', metric);
    }
};

/**
 * Measure page load performance
 */
export const measurePageLoad = (pageName: string): void => {
    if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        
        if (loadTime > 0) {
            recordMetric('page_load', pageName, loadTime, 'success', {
                domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                resources: timing.loadEventEnd - timing.domContentLoadedEventEnd
            });
        }
    }
};

/**
 * Measure API call performance
 */
export const measureApiCall = async <T>(
    name: string,
    apiCall: () => Promise<T>
): Promise<T> => {
    const startTime = Date.now();
    let status: 'success' | 'error' = 'success';
    
    try {
        const result = await apiCall();
        return result;
    } catch (error) {
        status = 'error';
        throw error;
    } finally {
        const duration = Date.now() - startTime;
        recordMetric('api_call', name, duration, status);
    }
};

/**
 * Measure user action performance
 */
export const measureUserAction = (
    actionName: string,
    action: () => void
): void => {
    const startTime = Date.now();
    
    try {
        action();
        const duration = Date.now() - startTime;
        recordMetric('user_action', actionName, duration, 'success');
    } catch (error) {
        const duration = Date.now() - startTime;
        recordMetric('user_action', actionName, duration, 'error');
        throw error;
    }
};

/**
 * Get performance metrics
 */
export const getPerformanceMetrics = (filters?: {
    type?: PerformanceMetric['type'];
    startDate?: string;
    endDate?: string;
    limit?: number;
}): PerformanceMetric[] => {
    let filtered = [...performanceMetrics];
    
    if (filters?.type) {
        filtered = filtered.filter(metric => metric.type === filters.type);
    }
    
    if (filters?.startDate) {
        filtered = filtered.filter(metric => metric.timestamp >= filters.startDate!);
    }
    
    if (filters?.endDate) {
        filtered = filtered.filter(metric => metric.timestamp <= filters.endDate!);
    }
    
    const limit = filters?.limit || 100;
    return filtered.slice(0, limit);
};

/**
 * Get performance statistics
 */
export const getPerformanceStats = (): {
    totalMetrics: number;
    avgPageLoad: number;
    avgApiCall: number;
    avgUserAction: number;
    slowOperations: number;
    errorRate: number;
    byType: { [key: string]: number };
} => {
    const pageLoads = performanceMetrics.filter(m => m.type === 'page_load');
    const apiCalls = performanceMetrics.filter(m => m.type === 'api_call');
    const userActions = performanceMetrics.filter(m => m.type === 'user_action');
    const slowOps = performanceMetrics.filter(m => m.duration > 3000);
    const errors = performanceMetrics.filter(m => m.status === 'error');
    
    const byType: { [key: string]: number } = {};
    performanceMetrics.forEach(metric => {
        byType[metric.type] = (byType[metric.type] || 0) + 1;
    });
    
    return {
        totalMetrics: performanceMetrics.length,
        avgPageLoad: pageLoads.length > 0 
            ? pageLoads.reduce((sum, m) => sum + m.duration, 0) / pageLoads.length 
            : 0,
        avgApiCall: apiCalls.length > 0 
            ? apiCalls.reduce((sum, m) => sum + m.duration, 0) / apiCalls.length 
            : 0,
        avgUserAction: userActions.length > 0 
            ? userActions.reduce((sum, m) => sum + m.duration, 0) / userActions.length 
            : 0,
        slowOperations: slowOps.length,
        errorRate: performanceMetrics.length > 0 
            ? (errors.length / performanceMetrics.length) * 100 
            : 0,
        byType
    };
};

/**
 * Clear old metrics
 */
export const clearOldMetrics = (hoursToKeep: number = 24): number => {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursToKeep);
    
    const initialLength = performanceMetrics.length;
    performanceMetrics = performanceMetrics.filter(
        metric => new Date(metric.timestamp) >= cutoffDate
    );
    
    return initialLength - performanceMetrics.length;
};

// Seed some demo metrics
const seedDemoMetrics = () => {
    const demoMetrics = [
        { type: 'page_load' as const, name: 'MaterialRequestView', duration: 1234 },
        { type: 'api_call' as const, name: 'GET /api/requests', duration: 456 },
        { type: 'user_action' as const, name: 'Submit Request', duration: 89 },
        { type: 'page_load' as const, name: 'AdminControlPanel', duration: 987 },
        { type: 'api_call' as const, name: 'GET /api/audit-log', duration: 2345 },
        { type: 'user_action' as const, name: 'Filter Reports', duration: 123 },
        { type: 'api_call' as const, name: 'POST /api/approve-p1', duration: 678 },
        { type: 'component_render' as const, name: 'P1Dashboard', duration: 234 },
    ];
    
    demoMetrics.forEach(demo => {
        recordMetric(demo.type, demo.name, demo.duration);
    });
};

seedDemoMetrics();

// Auto-track page loads for supported browsers
if (window.performance && window.performance.timing) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            measurePageLoad(document.title || 'Unknown Page');
        }, 0);
    });
}
