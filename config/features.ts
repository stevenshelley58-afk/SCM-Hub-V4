/**
 * Feature Flags Configuration
 * Toggle features on/off without code changes
 */

export const featureFlags = {
    // P1 Approval Workflow
    // When true: P1 requests require MC approval before warehouse can pick
    // When false: P1 requests go straight to warehouse like any other priority
    requireP1Approval: true,
    
    // Future feature flags can be added here
    // Example:
    // enablePhotos: false,
    // enableOfflineMode: false,
    // enableBulkOperations: false,
};

// Helper function to check if a feature is enabled
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
    return featureFlags[feature] === true;
}

// Helper to get all feature statuses (useful for admin panel)
export function getAllFeatureStatuses() {
    return Object.entries(featureFlags).map(([key, value]) => ({
        feature: key,
        enabled: value,
        description: getFeatureDescription(key as keyof typeof featureFlags)
    }));
}

function getFeatureDescription(feature: keyof typeof featureFlags): string {
    const descriptions: Record<keyof typeof featureFlags, string> = {
        requireP1Approval: 'Require Material Coordinator approval for all P1 priority requests before warehouse can begin picking',
    };
    return descriptions[feature] || 'No description available';
}

