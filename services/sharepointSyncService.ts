// SharePoint Data Sync Service
// In production, this would connect to actual SharePoint REST API

export interface SyncStatus {
    id: string;
    timestamp: string;
    status: 'success' | 'failed' | 'in_progress';
    recordsProcessed: number;
    recordsAdded: number;
    recordsUpdated: number;
    recordsConflict: number;
    errors: string[];
    duration: number; // milliseconds
}

export interface SyncConflict {
    pKey: string;
    field: string;
    sharePointValue: any;
    systemValue: any;
    detectedAt: string;
    resolved: boolean;
    resolution?: 'use_sharepoint' | 'use_system' | 'manual';
}

let syncHistory: SyncStatus[] = [];
let syncConflicts: SyncConflict[] = [];
let lastSyncTime: string | null = null;
let isSyncRunning = false;

// Perform SharePoint sync
export const performSharePointSync = async (): Promise<SyncStatus> => {
    if (isSyncRunning) {
        throw new Error('Sync already in progress');
    }

    const syncId = `SYNC-${Date.now()}`;
    const startTime = Date.now();
    
    isSyncRunning = true;

    try {
        // Simulate sync process
        const syncStatus: SyncStatus = {
            id: syncId,
            timestamp: new Date().toISOString(),
            status: 'in_progress',
            recordsProcessed: 0,
            recordsAdded: 0,
            recordsUpdated: 0,
            recordsConflict: 0,
            errors: [],
            duration: 0
        };

        syncHistory.unshift(syncStatus);

        // Simulate API call and processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate results
        syncStatus.status = 'success';
        syncStatus.recordsProcessed = Math.floor(Math.random() * 100) + 50;
        syncStatus.recordsAdded = Math.floor(Math.random() * 10);
        syncStatus.recordsUpdated = Math.floor(Math.random() * 20);
        syncStatus.recordsConflict = Math.floor(Math.random() * 3);
        syncStatus.duration = Date.now() - startTime;

        lastSyncTime = syncStatus.timestamp;

        // Simulate detecting conflicts
        if (syncStatus.recordsConflict > 0) {
            for (let i = 0; i < syncStatus.recordsConflict; i++) {
                syncConflicts.push({
                    pKey: `822671${String(10000 + i).padStart(5, '0')}`,
                    field: 'storageLocation',
                    sharePointValue: 'Whse 1, C5',
                    systemValue: 'Whse 1, A3',
                    detectedAt: new Date().toISOString(),
                    resolved: false
                });
            }
        }

        return syncStatus;
    } catch (error) {
        const errorStatus: SyncStatus = {
            id: syncId,
            timestamp: new Date().toISOString(),
            status: 'failed',
            recordsProcessed: 0,
            recordsAdded: 0,
            recordsUpdated: 0,
            recordsConflict: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            duration: Date.now() - startTime
        };

        syncHistory.unshift(errorStatus);
        return errorStatus;
    } finally {
        isSyncRunning = false;
    }
};

// Get sync history
export const getSyncHistory = (limit: number = 20): SyncStatus[] => {
    return syncHistory.slice(0, limit);
};

// Get unresolved conflicts
export const getSyncConflicts = (resolvedFilter?: boolean): SyncConflict[] => {
    if (resolvedFilter !== undefined) {
        return syncConflicts.filter(c => c.resolved === resolvedFilter);
    }
    return syncConflicts;
};

// Resolve conflict
export const resolveConflict = (
    pKey: string,
    field: string,
    resolution: 'use_sharepoint' | 'use_system' | 'manual'
): void => {
    const conflict = syncConflicts.find(c => c.pKey === pKey && c.field === field && !c.resolved);
    if (conflict) {
        conflict.resolved = true;
        conflict.resolution = resolution;
    }
};

// Get last sync time
export const getLastSyncTime = (): string | null => {
    return lastSyncTime;
};

// Check if sync is running
export const isSyncActive = (): boolean => {
    return isSyncRunning;
};

// Schedule automatic sync (hourly)
export const scheduleAutomaticSync = (callback?: (status: SyncStatus) => void): NodeJS.Timeout => {
    // Perform initial sync
    performSharePointSync().then(status => callback?.(status));

    // Schedule hourly sync
    return setInterval(() => {
        performSharePointSync().then(status => callback?.(status));
    }, 60 * 60 * 1000); // 1 hour
};

// Initialize with sample sync history
export const initializeSampleSyncHistory = () => {
    const now = Date.now();
    
    for (let i = 0; i < 5; i++) {
        syncHistory.push({
            id: `SYNC-INIT-${i}`,
            timestamp: new Date(now - (i * 3600000)).toISOString(), // 1 hour apart
            status: i === 0 ? 'success' : (i === 2 ? 'failed' : 'success'),
            recordsProcessed: Math.floor(Math.random() * 100) + 50,
            recordsAdded: Math.floor(Math.random() * 10),
            recordsUpdated: Math.floor(Math.random() * 20),
            recordsConflict: i === 1 ? 2 : 0,
            errors: i === 2 ? ['SharePoint connection timeout'] : [],
            duration: Math.floor(Math.random() * 5000) + 1000
        });
    }

    lastSyncTime = syncHistory[0].timestamp;
};

// Initialize sample data
initializeSampleSyncHistory();
