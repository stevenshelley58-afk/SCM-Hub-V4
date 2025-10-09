/**
 * Monitoring & Observability Service
 * Health checks, metrics collection, error tracking, performance monitoring
 */

import { envConfig } from '../config/environment';

export interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    checks: {
        api: 'up' | 'down';
        auth: 'up' | 'down';
        storage: 'up' | 'down';
        database: 'up' | 'down';
    };
    metrics: {
        responseTime: number;
        errorRate: number;
        activeUsers: number;
    };
}

export interface PerformanceMetric {
    name: string;
    value: number;
    unit: 'ms' | 'bytes' | 'count';
    timestamp: string;
    tags?: Record<string, string>;
}

export interface ErrorLog {
    message: string;
    stack?: string;
    level: 'error' | 'warn' | 'info';
    timestamp: string;
    context?: Record<string, any>;
    userId?: string;
}

/**
 * Error tracking store
 */
const errorLogs: ErrorLog[] = [];
const MAX_ERROR_LOGS = 100;

/**
 * Performance metrics store
 */
const performanceMetrics: PerformanceMetric[] = [];
const MAX_METRICS = 1000;

/**
 * Log error
 */
export const logError = (
    message: string,
    error?: Error,
    context?: Record<string, any>
): void => {
    const errorLog: ErrorLog = {
        message,
        stack: error?.stack,
        level: 'error',
        timestamp: new Date().toISOString(),
        context,
        userId: getCurrentUserId()
    };
    
    errorLogs.push(errorLog);
    
    // Keep only last N errors
    if (errorLogs.length > MAX_ERROR_LOGS) {
        errorLogs.shift();
    }
    
    // Log to console
    console.error(`❌ [${errorLog.timestamp}] ${message}`, { error, context });
    
    // Send to external error tracking (e.g., Sentry)
    if (envConfig.monitoring.enableErrorTracking && envConfig.monitoring.sentryDsn) {
        sendToSentry(errorLog);
    }
};

/**
 * Log warning
 */
export const logWarning = (message: string, context?: Record<string, any>): void => {
    const errorLog: ErrorLog = {
        message,
        level: 'warn',
        timestamp: new Date().toISOString(),
        context,
        userId: getCurrentUserId()
    };
    
    errorLogs.push(errorLog);
    
    if (errorLogs.length > MAX_ERROR_LOGS) {
        errorLogs.shift();
    }
    
    console.warn(`⚠️ [${errorLog.timestamp}] ${message}`, context);
};

/**
 * Log info
 */
export const logInfo = (message: string, context?: Record<string, any>): void => {
    if (envConfig.monitoring.logLevel === 'info' || envConfig.monitoring.logLevel === 'debug') {
        const errorLog: ErrorLog = {
            message,
            level: 'info',
            timestamp: new Date().toISOString(),
            context,
            userId: getCurrentUserId()
        };
        
        console.log(`ℹ️ [${errorLog.timestamp}] ${message}`, context);
    }
};

/**
 * Track performance metric
 */
export const trackMetric = (
    name: string,
    value: number,
    unit: PerformanceMetric['unit'] = 'ms',
    tags?: Record<string, string>
): void => {
    const metric: PerformanceMetric = {
        name,
        value,
        unit,
        timestamp: new Date().toISOString(),
        tags
    };
    
    performanceMetrics.push(metric);
    
    if (performanceMetrics.length > MAX_METRICS) {
        performanceMetrics.shift();
    }
    
    if (envConfig.monitoring.logLevel === 'debug') {
        console.log(`📊 Metric: ${name} = ${value}${unit}`, tags);
    }
};

/**
 * Track page load performance
 */
export const trackPageLoad = (): void => {
    if (!window.performance) return;
    
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
    const responseTime = perfData.responseEnd - perfData.requestStart;
    
    trackMetric('page_load_time', pageLoadTime, 'ms');
    trackMetric('dom_ready_time', domReadyTime, 'ms');
    trackMetric('response_time', responseTime, 'ms');
    
    console.log(`⚡ Page loaded in ${pageLoadTime}ms`);
};

/**
 * Track API call performance
 */
export const trackApiCall = async <T>(
    endpoint: string,
    apiCall: () => Promise<T>
): Promise<T> => {
    const startTime = performance.now();
    
    try {
        const result = await apiCall();
        const duration = performance.now() - startTime;
        
        trackMetric('api_call_duration', duration, 'ms', {
            endpoint,
            status: 'success'
        });
        
        return result;
    } catch (error) {
        const duration = performance.now() - startTime;
        
        trackMetric('api_call_duration', duration, 'ms', {
            endpoint,
            status: 'error'
        });
        
        logError(`API call failed: ${endpoint}`, error as Error, { endpoint });
        
        throw error;
    }
};

/**
 * Health check
 */
export const performHealthCheck = async (): Promise<HealthCheckResult> => {
    const startTime = performance.now();
    
    const checks = {
        api: await checkApiHealth(),
        auth: await checkAuthHealth(),
        storage: await checkStorageHealth(),
        database: await checkDatabaseHealth()
    };
    
    const responseTime = performance.now() - startTime;
    
    // Calculate status
    const allUp = Object.values(checks).every(status => status === 'up');
    const someDown = Object.values(checks).some(status => status === 'down');
    
    const status: HealthCheckResult['status'] = allUp ? 'healthy' : someDown ? 'unhealthy' : 'degraded';
    
    // Calculate error rate (last 100 requests)
    const recentErrors = errorLogs.filter(log => 
        log.level === 'error' && 
        Date.now() - new Date(log.timestamp).getTime() < 300000 // Last 5 minutes
    ).length;
    
    const errorRate = recentErrors / 100;
    
    const result: HealthCheckResult = {
        status,
        timestamp: new Date().toISOString(),
        checks,
        metrics: {
            responseTime: Math.round(responseTime),
            errorRate: Math.round(errorRate * 100),
            activeUsers: getActiveUserCount()
        }
    };
    
    logInfo('Health check completed', result);
    
    return result;
};

/**
 * Check API health
 */
const checkApiHealth = async (): Promise<'up' | 'down'> => {
    try {
        // In production, would ping actual API health endpoint
        // For now, check if API base URL is configured
        return envConfig.api.baseUrl ? 'up' : 'down';
    } catch {
        return 'down';
    }
};

/**
 * Check auth health
 */
const checkAuthHealth = async (): Promise<'up' | 'down'> => {
    try {
        // Check if auth tokens can be retrieved
        const token = localStorage.getItem('auth_token');
        return token !== null ? 'up' : 'down';
    } catch {
        return 'down';
    }
};

/**
 * Check storage health
 */
const checkStorageHealth = async (): Promise<'up' | 'down'> => {
    try {
        // Check if localStorage is accessible
        localStorage.setItem('health_check', 'test');
        localStorage.removeItem('health_check');
        return 'up';
    } catch {
        return 'down';
    }
};

/**
 * Check database health
 */
const checkDatabaseHealth = async (): Promise<'up' | 'down'> => {
    try {
        // In production, would check actual database connection
        // For now, assume up if in browser environment
        return 'up';
    } catch {
        return 'down';
    }
};

/**
 * Get current user ID
 */
const getCurrentUserId = (): string | undefined => {
    try {
        const userStr = localStorage.getItem('current_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            return user.name;
        }
    } catch {}
    return undefined;
};

/**
 * Get active user count
 */
const getActiveUserCount = (): number => {
    // In production, would get from analytics service
    return 1;
};

/**
 * Send to Sentry (mock)
 */
const sendToSentry = (errorLog: ErrorLog): void => {
    if (!envConfig.monitoring.sentryDsn) return;
    
    // In production, would actually send to Sentry
    console.log('📤 Sending error to Sentry:', errorLog.message);
};

/**
 * Get error logs
 */
export const getErrorLogs = (
    limit: number = 50,
    level?: ErrorLog['level']
): ErrorLog[] => {
    let logs = [...errorLogs];
    
    if (level) {
        logs = logs.filter(log => log.level === level);
    }
    
    return logs.slice(-limit).reverse();
};

/**
 * Get performance metrics
 */
export const getPerformanceMetrics = (
    name?: string,
    limit: number = 100
): PerformanceMetric[] => {
    let metrics = [...performanceMetrics];
    
    if (name) {
        metrics = metrics.filter(metric => metric.name === name);
    }
    
    return metrics.slice(-limit).reverse();
};

/**
 * Clear error logs
 */
export const clearErrorLogs = (): void => {
    errorLogs.length = 0;
    console.log('🗑️ Error logs cleared');
};

/**
 * Clear performance metrics
 */
export const clearPerformanceMetrics = (): void => {
    performanceMetrics.length = 0;
    console.log('🗑️ Performance metrics cleared');
};

/**
 * Setup global error handlers
 */
export const setupGlobalErrorHandlers = (): void => {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        logError(
            'Unhandled promise rejection',
            new Error(event.reason),
            { reason: event.reason }
        );
    });
    
    // Catch global errors
    window.addEventListener('error', (event) => {
        logError(
            event.message,
            event.error,
            {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            }
        );
    });
    
    console.log('🔧 Global error handlers initialized');
};

/**
 * Initialize monitoring service
 */
export const initMonitoring = (): void => {
    setupGlobalErrorHandlers();
    
    // Track page load performance
    if (document.readyState === 'complete') {
        trackPageLoad();
    } else {
        window.addEventListener('load', trackPageLoad);
    }
    
    // Periodic health checks (every 5 minutes)
    setInterval(async () => {
        const health = await performHealthCheck();
        if (health.status === 'unhealthy') {
            logWarning('System health is unhealthy', { health });
        }
    }, 5 * 60 * 1000);
    
    console.log('📊 Monitoring service initialized');
};

