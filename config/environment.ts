/**
 * Environment Configuration
 * Centralized configuration for environment variables
 */

export interface EnvironmentConfig {
    app: {
        name: string;
        version: string;
        url: string;
        environment: 'development' | 'staging' | 'production';
    };
    api: {
        baseUrl: string;
        timeout: number;
        retryAttempts: number;
    };
    auth: {
        tokenExpiry: number;
        refreshTokenExpiry: number;
        sessionTimeout: number;
    };
    security: {
        csrfEnabled: boolean;
        rateLimitMaxRequests: number;
        rateLimitWindowMs: number;
        enforceHttps: boolean;
    };
    features: {
        enableP1Approval: boolean;
        enableOfflineMode: boolean;
        enablePhotoUpload: boolean;
        enableNotifications: boolean;
        enableAnalytics: boolean;
    };
    monitoring: {
        sentryDsn?: string;
        logLevel: 'debug' | 'info' | 'warn' | 'error';
        enablePerformanceMonitoring: boolean;
        enableErrorTracking: boolean;
    };
    storage: {
        maxFileSize: number;
        allowedFileTypes: string[];
    };
}

/**
 * Get environment variable with fallback
 */
const getEnv = (key: string, defaultValue: string = ''): string => {
    return import.meta.env[key] || defaultValue;
};

/**
 * Get boolean environment variable
 */
const getBoolEnv = (key: string, defaultValue: boolean = false): boolean => {
    const value = getEnv(key);
    if (value === '') return defaultValue;
    return value === 'true' || value === '1';
};

/**
 * Get number environment variable
 */
const getNumEnv = (key: string, defaultValue: number = 0): number => {
    const value = getEnv(key);
    if (value === '') return defaultValue;
    return parseInt(value, 10);
};

/**
 * Load and validate environment configuration
 */
export const loadEnvironmentConfig = (): EnvironmentConfig => {
    const config: EnvironmentConfig = {
        app: {
            name: getEnv('VITE_APP_NAME', 'SCM Hub'),
            version: getEnv('VITE_APP_VERSION', '4.0.0'),
            url: getEnv('VITE_APP_URL', 'http://localhost:5173'),
            environment: getEnv('NODE_ENV', 'development') as any
        },
        api: {
            baseUrl: getEnv('VITE_API_BASE_URL', '/api'),
            timeout: getNumEnv('VITE_API_TIMEOUT', 30000),
            retryAttempts: getNumEnv('VITE_API_RETRY_ATTEMPTS', 3)
        },
        auth: {
            tokenExpiry: getNumEnv('VITE_AUTH_TOKEN_EXPIRY', 3600),
            refreshTokenExpiry: getNumEnv('VITE_AUTH_REFRESH_TOKEN_EXPIRY', 604800),
            sessionTimeout: getNumEnv('VITE_SESSION_TIMEOUT', 1800000)
        },
        security: {
            csrfEnabled: getBoolEnv('VITE_CSRF_ENABLED', true),
            rateLimitMaxRequests: getNumEnv('VITE_RATE_LIMIT_MAX_REQUESTS', 100),
            rateLimitWindowMs: getNumEnv('VITE_RATE_LIMIT_WINDOW_MS', 60000),
            enforceHttps: getBoolEnv('VITE_ENFORCE_HTTPS', true)
        },
        features: {
            enableP1Approval: getBoolEnv('VITE_ENABLE_P1_APPROVAL', true),
            enableOfflineMode: getBoolEnv('VITE_ENABLE_OFFLINE_MODE', true),
            enablePhotoUpload: getBoolEnv('VITE_ENABLE_PHOTO_UPLOAD', true),
            enableNotifications: getBoolEnv('VITE_ENABLE_NOTIFICATIONS', true),
            enableAnalytics: getBoolEnv('VITE_ENABLE_ANALYTICS', false)
        },
        monitoring: {
            sentryDsn: getEnv('VITE_SENTRY_DSN'),
            logLevel: getEnv('VITE_LOG_LEVEL', 'info') as any,
            enablePerformanceMonitoring: getBoolEnv('VITE_ENABLE_PERFORMANCE_MONITORING', true),
            enableErrorTracking: getBoolEnv('VITE_ENABLE_ERROR_TRACKING', true)
        },
        storage: {
            maxFileSize: getNumEnv('VITE_MAX_FILE_SIZE', 10485760), // 10MB
            allowedFileTypes: getEnv('VITE_ALLOWED_FILE_TYPES', 'image/jpeg,image/png,image/gif,application/pdf').split(',')
        }
    };
    
    // Validate required configuration
    if (config.app.environment === 'production') {
        if (!config.api.baseUrl) {
            console.error('❌ VITE_API_BASE_URL is required in production');
        }
        
        if (config.security.enforceHttps && !config.app.url.startsWith('https://')) {
            console.warn('⚠️ HTTPS is enforced but app URL is not HTTPS');
        }
    }
    
    return config;
};

/**
 * Singleton instance
 */
export const envConfig = loadEnvironmentConfig();

/**
 * Check if running in production
 */
export const isProduction = (): boolean => {
    return envConfig.app.environment === 'production';
};

/**
 * Check if running in development
 */
export const isDevelopment = (): boolean => {
    return envConfig.app.environment === 'development';
};

/**
 * Check if feature is enabled
 */
export const isFeatureEnabled = (feature: keyof EnvironmentConfig['features']): boolean => {
    return envConfig.features[feature];
};

console.log(`🔧 Environment: ${envConfig.app.environment}`);
console.log(`🔧 API Base URL: ${envConfig.api.baseUrl}`);

