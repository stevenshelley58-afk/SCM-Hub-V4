/**
 * Feature Toggle Service
 * Allows enabling/disabling features per environment or gradual rollout
 */

export interface FeatureFlag {
    key: string;
    name: string;
    description: string;
    enabled: boolean;
    environment: 'all' | 'development' | 'staging' | 'production';
    rolloutPercentage: number; // 0-100
    createdAt: string;
    updatedAt: string;
}

// Default feature flags
const defaultFeatures: FeatureFlag[] = [
    {
        key: 'p1_approval_workflow',
        name: 'P1 Approval Workflow',
        description: 'Require MC approval for P1 requests before warehouse can pick',
        enabled: true,
        environment: 'all',
        rolloutPercentage: 100,
        createdAt: '2025-10-09',
        updatedAt: '2025-10-09'
    },
    {
        key: 'split_mrf',
        name: 'Split MRF',
        description: 'Allow splitting a single request into multiple MRFs',
        enabled: false,
        environment: 'staging',
        rolloutPercentage: 50,
        createdAt: '2025-10-09',
        updatedAt: '2025-10-09'
    },
    {
        key: 'bulk_operations',
        name: 'Bulk Operations',
        description: 'Select multiple requests and perform batch actions',
        enabled: true,
        environment: 'all',
        rolloutPercentage: 100,
        createdAt: '2025-10-09',
        updatedAt: '2025-10-09'
    },
    {
        key: 'pod_capture',
        name: 'Proof of Delivery',
        description: 'Capture photos and signatures on delivery',
        enabled: false,
        environment: 'development',
        rolloutPercentage: 10,
        createdAt: '2025-10-09',
        updatedAt: '2025-10-09'
    },
    {
        key: 'eta_tracking',
        name: 'ETA Tracking',
        description: 'Show estimated delivery times with real-time updates',
        enabled: true,
        environment: 'all',
        rolloutPercentage: 100,
        createdAt: '2025-10-09',
        updatedAt: '2025-10-09'
    },
    {
        key: 'wall_display',
        name: 'Wall Display Dashboard',
        description: 'Large screen dashboard for warehouse display',
        enabled: true,
        environment: 'all',
        rolloutPercentage: 100,
        createdAt: '2025-10-09',
        updatedAt: '2025-10-09'
    },
    {
        key: 'notifications',
        name: 'Email/SMS Notifications',
        description: 'Send notifications on status changes',
        enabled: true,
        environment: 'production',
        rolloutPercentage: 100,
        createdAt: '2025-10-09',
        updatedAt: '2025-10-09'
    },
    {
        key: 'offline_mode',
        name: 'Offline Mode',
        description: 'Work without internet and sync when back online',
        enabled: false,
        environment: 'development',
        rolloutPercentage: 0,
        createdAt: '2025-10-09',
        updatedAt: '2025-10-09'
    },
];

// In-memory storage (in production this would be database)
let featureFlags: FeatureFlag[] = [...defaultFeatures];

/**
 * Get all feature flags
 */
export const getAllFeatureFlags = (): FeatureFlag[] => {
    return [...featureFlags];
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (key: string): boolean => {
    const feature = featureFlags.find(f => f.key === key);
    if (!feature) return false;
    
    // Check environment
    const currentEnv = process.env.NODE_ENV || 'development';
    if (feature.environment !== 'all' && feature.environment !== currentEnv) {
        return false;
    }
    
    // Check enabled flag
    if (!feature.enabled) return false;
    
    // Check rollout percentage (simplified - in production would use user hash)
    if (feature.rolloutPercentage < 100) {
        // For demo, return true if random number is within percentage
        return Math.random() * 100 < feature.rolloutPercentage;
    }
    
    return true;
};

/**
 * Toggle a feature on/off
 */
export const toggleFeature = (key: string): boolean => {
    const feature = featureFlags.find(f => f.key === key);
    if (!feature) return false;
    
    feature.enabled = !feature.enabled;
    feature.updatedAt = new Date().toISOString();
    return feature.enabled;
};

/**
 * Update feature rollout percentage
 */
export const updateRolloutPercentage = (key: string, percentage: number): boolean => {
    const feature = featureFlags.find(f => f.key === key);
    if (!feature) return false;
    
    feature.rolloutPercentage = Math.max(0, Math.min(100, percentage));
    feature.updatedAt = new Date().toISOString();
    return true;
};

/**
 * Update feature environment
 */
export const updateFeatureEnvironment = (
    key: string,
    environment: FeatureFlag['environment']
): boolean => {
    const feature = featureFlags.find(f => f.key === key);
    if (!feature) return false;
    
    feature.environment = environment;
    feature.updatedAt = new Date().toISOString();
    return true;
};

/**
 * Add a new feature flag
 */
export const addFeatureFlag = (flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): boolean => {
    if (featureFlags.find(f => f.key === flag.key)) {
        return false; // Already exists
    }
    
    const now = new Date().toISOString();
    featureFlags.push({
        ...flag,
        createdAt: now,
        updatedAt: now
    });
    
    return true;
};

/**
 * Delete a feature flag
 */
export const deleteFeatureFlag = (key: string): boolean => {
    const index = featureFlags.findIndex(f => f.key === key);
    if (index === -1) return false;
    
    featureFlags.splice(index, 1);
    return true;
};
