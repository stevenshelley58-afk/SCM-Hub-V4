// Service Worker Registration for Offline Capability
// This enables the app to work offline with cached data

export interface CacheConfig {
    cacheName: string;
    version: string;
    assets: string[];
    apiEndpoints: string[];
}

export const defaultCacheConfig: CacheConfig = {
    cacheName: 'scmhub-cache',
    version: 'v1',
    assets: [
        '/',
        '/index.html',
        '/assets/index.css',
        '/assets/index.js'
    ],
    apiEndpoints: [
        '/api/requests',
        '/api/materials',
        '/api/users'
    ]
};

// Register service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });
        
        console.log('Service Worker registered successfully:', registration.scope);
        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
    }
};

// Unregister service worker
export const unregisterServiceWorker = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const success = await registration.unregister();
        console.log('Service Worker unregistered:', success);
        return success;
    } catch (error) {
        console.error('Service Worker unregister failed:', error);
        return false;
    }
};

// Check if app is online
export const isOnline = (): boolean => {
    return navigator.onLine;
};

// Check if service worker is active
export const isServiceWorkerActive = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration?.active !== undefined;
    } catch (error) {
        return false;
    }
};

// Cache API response
export const cacheAPIResponse = async (url: string, data: any): Promise<void> => {
    if (!('caches' in window)) {
        console.warn('Cache API not supported');
        return;
    }

    try {
        const cache = await caches.open(defaultCacheConfig.cacheName);
        const response = new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
        });
        await cache.put(url, response);
    } catch (error) {
        console.error('Failed to cache response:', error);
    }
};

// Get cached API response
export const getCachedAPIResponse = async (url: string): Promise<any | null> => {
    if (!('caches' in window)) {
        return null;
    }

    try {
        const cache = await caches.open(defaultCacheConfig.cacheName);
        const response = await cache.match(url);
        
        if (response) {
            return await response.json();
        }
    } catch (error) {
        console.error('Failed to get cached response:', error);
    }

    return null;
};

// Clear cache
export const clearCache = async (): Promise<void> => {
    if (!('caches' in window)) {
        return;
    }

    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Cache cleared');
    } catch (error) {
        console.error('Failed to clear cache:', error);
    }
};

// Offline queue for pending operations
interface QueuedOperation {
    id: string;
    type: 'create' | 'update' | 'delete';
    endpoint: string;
    data: any;
    timestamp: string;
}

let offlineQueue: QueuedOperation[] = [];

// Add operation to offline queue
export const queueOfflineOperation = (
    type: QueuedOperation['type'],
    endpoint: string,
    data: any
): string => {
    const operation: QueuedOperation = {
        id: `OFFLINE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        endpoint,
        data,
        timestamp: new Date().toISOString()
    };

    offlineQueue.push(operation);

    // Store in localStorage
    try {
        localStorage.setItem('scmhub_offline_queue', JSON.stringify(offlineQueue));
    } catch (error) {
        console.error('Failed to save offline queue:', error);
    }

    return operation.id;
};

// Get offline queue
export const getOfflineQueue = (): QueuedOperation[] => {
    return [...offlineQueue];
};

// Process offline queue when back online
export const processOfflineQueue = async (): Promise<void> => {
    if (offlineQueue.length === 0) {
        return;
    }

    console.log(`Processing ${offlineQueue.length} queued operations...`);

    const operations = [...offlineQueue];
    offlineQueue = [];

    for (const operation of operations) {
        try {
            // In production, this would make actual API calls
            console.log(`Processing operation: ${operation.type} ${operation.endpoint}`);
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
        } catch (error) {
            console.error(`Failed to process operation ${operation.id}:`, error);
            // Re-queue failed operations
            offlineQueue.push(operation);
        }
    }

    // Update localStorage
    try {
        localStorage.setItem('scmhub_offline_queue', JSON.stringify(offlineQueue));
    } catch (error) {
        console.error('Failed to update offline queue:', error);
    }

    console.log('Offline queue processed');
};

// Load offline queue from storage
export const loadOfflineQueue = (): void => {
    try {
        const queueData = localStorage.getItem('scmhub_offline_queue');
        if (queueData) {
            offlineQueue = JSON.parse(queueData);
        }
    } catch (error) {
        console.error('Failed to load offline queue:', error);
    }
};

// Clear offline queue
export const clearOfflineQueue = (): void => {
    offlineQueue = [];
    try {
        localStorage.removeItem('scmhub_offline_queue');
    } catch (error) {
        console.error('Failed to clear offline queue:', error);
    }
};

// Listen for online/offline events
export const initializeOfflineSupport = (): void => {
    // Load queue from storage
    loadOfflineQueue();

    // Listen for online event
    window.addEventListener('online', async () => {
        console.log('App is back online');
        await processOfflineQueue();
        window.dispatchEvent(new CustomEvent('app-online'));
    });

    // Listen for offline event
    window.addEventListener('offline', () => {
        console.log('App is offline');
        window.dispatchEvent(new CustomEvent('app-offline'));
    });

    // Process queue if already online
    if (isOnline() && offlineQueue.length > 0) {
        processOfflineQueue();
    }
};

// Get offline capability status
export const getOfflineStatus = (): {
    isOnline: boolean;
    serviceWorkerActive: boolean;
    queuedOperations: number;
    cacheAvailable: boolean;
} => {
    return {
        isOnline: isOnline(),
        serviceWorkerActive: false, // Will be updated asynchronously
        queuedOperations: offlineQueue.length,
        cacheAvailable: 'caches' in window
    };
};

// Update service worker status asynchronously
isServiceWorkerActive().then(active => {
    const status = getOfflineStatus();
    status.serviceWorkerActive = active;
});
