/**
 * Error Logging Service
 * Captures client-side errors and provides dashboard for monitoring
 */

export interface ErrorLog {
    id: string;
    timestamp: string;
    level: 'error' | 'warning' | 'info';
    message: string;
    stack?: string;
    url?: string;
    userId?: string;
    userAgent?: string;
    component?: string;
    additionalData?: any;
}

// In-memory error storage (in production, this would go to a logging service)
let errorLogs: ErrorLog[] = [];
const MAX_LOGS = 1000;

/**
 * Log an error
 */
export const logError = (
    level: ErrorLog['level'],
    message: string,
    error?: Error,
    additionalData?: any
): void => {
    const errorLog: ErrorLog = {
        id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        level,
        message,
        stack: error?.stack,
        url: window.location.href,
        userId: getCurrentUserId(),
        userAgent: navigator.userAgent,
        additionalData
    };
    
    errorLogs.unshift(errorLog);
    
    // Keep only last MAX_LOGS entries
    if (errorLogs.length > MAX_LOGS) {
        errorLogs = errorLogs.slice(0, MAX_LOGS);
    }
    
    // Console log for development
    if (level === 'error') {
        console.error('[ERROR LOG]', errorLog);
    } else if (level === 'warning') {
        console.warn('[WARNING LOG]', errorLog);
    } else {
        console.info('[INFO LOG]', errorLog);
    }
    
    // In production, send to backend logging service
    // sendToBackend(errorLog);
};

/**
 * Get current user ID (mock - in production this would come from auth context)
 */
const getCurrentUserId = (): string => {
    // Mock implementation
    return 'mc'; // Default to MC for demo
};

/**
 * Get all error logs
 */
export const getErrorLogs = (filters?: {
    level?: ErrorLog['level'];
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
}): ErrorLog[] => {
    let filtered = [...errorLogs];
    
    if (filters?.level) {
        filtered = filtered.filter(log => log.level === filters.level);
    }
    
    if (filters?.userId) {
        filtered = filtered.filter(log => log.userId === filters.userId);
    }
    
    if (filters?.startDate) {
        filtered = filtered.filter(log => log.timestamp >= filters.startDate!);
    }
    
    if (filters?.endDate) {
        filtered = filtered.filter(log => log.timestamp <= filters.endDate!);
    }
    
    const limit = filters?.limit || 100;
    return filtered.slice(0, limit);
};

/**
 * Get error statistics
 */
export const getErrorStats = (): {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    last24h: number;
    byComponent: { [key: string]: number };
} => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const stats = {
        total: errorLogs.length,
        errors: errorLogs.filter(log => log.level === 'error').length,
        warnings: errorLogs.filter(log => log.level === 'warning').length,
        info: errorLogs.filter(log => log.level === 'info').length,
        last24h: errorLogs.filter(log => new Date(log.timestamp) >= last24h).length,
        byComponent: {} as { [key: string]: number }
    };
    
    // Count by component
    errorLogs.forEach(log => {
        if (log.component) {
            stats.byComponent[log.component] = (stats.byComponent[log.component] || 0) + 1;
        }
    });
    
    return stats;
};

/**
 * Clear old error logs
 */
export const clearOldLogs = (daysToKeep: number = 7): number => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const initialLength = errorLogs.length;
    errorLogs = errorLogs.filter(log => new Date(log.timestamp) >= cutoffDate);
    
    return initialLength - errorLogs.length;
};

/**
 * Clear all logs
 */
export const clearAllLogs = (): void => {
    errorLogs = [];
};

/**
 * Global error handler setup
 */
export const setupGlobalErrorHandling = (): void => {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
        logError('error', event.message, event.error, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });
    
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        logError('error', `Unhandled Promise Rejection: ${event.reason}`, undefined, {
            reason: event.reason
        });
    });
    
    // Catch React errors (if using error boundary)
    console.log('[Error Logging] Global error handling setup complete');
};

// Seed some demo errors
const seedDemoErrors = () => {
    const demoErrors = [
        { level: 'error' as const, message: 'Failed to fetch material data from API', component: 'MaterialRequestView' },
        { level: 'warning' as const, message: 'Slow API response detected (>5s)', component: 'SystemHealthView' },
        { level: 'error' as const, message: 'TypeError: Cannot read property \'id\' of undefined', component: 'AuditLogView' },
        { level: 'info' as const, message: 'User logged in successfully', component: 'AuthService' },
        { level: 'warning' as const, message: 'localStorage quota exceeded, clearing old data', component: 'StorageService' },
        { level: 'error' as const, message: 'Network request failed: timeout after 30s', component: 'ReportsView' },
    ];
    
    demoErrors.forEach((demo, idx) => {
        setTimeout(() => {
            logError(demo.level, demo.message, undefined, { component: demo.component });
        }, idx * 100);
    });
};

// Initialize
setupGlobalErrorHandling();
seedDemoErrors();
