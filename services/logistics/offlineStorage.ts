/**
 * Offline Storage Service
 * IndexedDB-based offline storage for tasks and POD data
 */

import type { LogisticsTask, PODRecord } from '../../types';

const DB_NAME = 'LogisticsOfflineDB';
const DB_VERSION = 1;
const STORES = {
    TASKS: 'tasks',
    POD_QUEUE: 'pod_queue',
    PHOTOS: 'photos',
    SYNC_LOG: 'sync_log',
};

export interface OfflinePOD {
    id: string;
    task_id: string;
    photos: string[]; // Base64 data URLs
    signature: string | null;
    delivered_to: string;
    delivered_to_phone?: string;
    delivery_notes?: string;
    gps_lat?: number;
    gps_lng?: number;
    captured_at: string;
    synced: boolean;
}

export interface SyncLogEntry {
    id: string;
    type: 'pod_upload' | 'task_update' | 'status_change';
    data: any;
    timestamp: string;
    synced: boolean;
    error?: string;
    retry_count: number;
}

class OfflineStorageService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    /**
     * Initialize IndexedDB
     */
    async init(): Promise<void> {
        if (this.db) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                reject(new Error('Failed to open IndexedDB'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Tasks store
                if (!db.objectStoreNames.contains(STORES.TASKS)) {
                    const tasksStore = db.createObjectStore(STORES.TASKS, { keyPath: 'task_id' });
                    tasksStore.createIndex('driver_id', 'driver_id', { unique: false });
                    tasksStore.createIndex('status', 'status', { unique: false });
                }

                // POD queue store
                if (!db.objectStoreNames.contains(STORES.POD_QUEUE)) {
                    const podStore = db.createObjectStore(STORES.POD_QUEUE, { keyPath: 'id' });
                    podStore.createIndex('task_id', 'task_id', { unique: false });
                    podStore.createIndex('synced', 'synced', { unique: false });
                }

                // Photos store (for large binary data)
                if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
                    db.createObjectStore(STORES.PHOTOS, { keyPath: 'id' });
                }

                // Sync log store
                if (!db.objectStoreNames.contains(STORES.SYNC_LOG)) {
                    const syncStore = db.createObjectStore(STORES.SYNC_LOG, { keyPath: 'id', autoIncrement: true });
                    syncStore.createIndex('synced', 'synced', { unique: false });
                    syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });

        return this.initPromise;
    }

    /**
     * Cache tasks for offline access
     */
    async cacheTasks(tasks: LogisticsTask[]): Promise<void> {
        await this.init();
        if (!this.db) throw new Error('DB not initialized');

        const transaction = this.db.transaction([STORES.TASKS], 'readwrite');
        const store = transaction.objectStore(STORES.TASKS);

        for (const task of tasks) {
            store.put(task);
        }

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * Get cached tasks
     */
    async getCachedTasks(driverId?: string): Promise<LogisticsTask[]> {
        await this.init();
        if (!this.db) throw new Error('DB not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.TASKS], 'readonly');
            const store = transaction.objectStore(STORES.TASKS);

            let request: IDBRequest;
            if (driverId) {
                const index = store.index('driver_id');
                request = index.getAll(driverId);
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Queue POD for upload
     */
    async queuePODUpload(pod: Omit<OfflinePOD, 'id' | 'captured_at' | 'synced'>): Promise<string> {
        await this.init();
        if (!this.db) throw new Error('DB not initialized');

        const offlinePOD: OfflinePOD = {
            ...pod,
            id: `offline-pod-${Date.now()}`,
            captured_at: new Date().toISOString(),
            synced: false,
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.POD_QUEUE], 'readwrite');
            const store = transaction.objectStore(STORES.POD_QUEUE);
            const request = store.add(offlinePOD);

            request.onsuccess = () => {
                resolve(offlinePOD.id);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Get unsynced PODs
     */
    async getUnsyncedPODs(): Promise<OfflinePOD[]> {
        await this.init();
        if (!this.db) throw new Error('DB not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.POD_QUEUE], 'readonly');
            const store = transaction.objectStore(STORES.POD_QUEUE);
            const index = store.index('synced');
            const request = index.getAll(false);

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Mark POD as synced
     */
    async markPODSynced(podId: string): Promise<void> {
        await this.init();
        if (!this.db) throw new Error('DB not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.POD_QUEUE], 'readwrite');
            const store = transaction.objectStore(STORES.POD_QUEUE);
            const request = store.get(podId);

            request.onsuccess = () => {
                const pod = request.result;
                if (pod) {
                    pod.synced = true;
                    store.put(pod);
                }
            };

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * Delete synced POD
     */
    async deletePOD(podId: string): Promise<void> {
        await this.init();
        if (!this.db) throw new Error('DB not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.POD_QUEUE], 'readwrite');
            const store = transaction.objectStore(STORES.POD_QUEUE);
            const request = store.delete(podId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Add to sync log
     */
    async addToSyncLog(entry: Omit<SyncLogEntry, 'id' | 'timestamp' | 'retry_count'>): Promise<void> {
        await this.init();
        if (!this.db) throw new Error('DB not initialized');

        const logEntry: Omit<SyncLogEntry, 'id'> = {
            ...entry,
            timestamp: new Date().toISOString(),
            retry_count: 0,
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.SYNC_LOG], 'readwrite');
            const store = transaction.objectStore(STORES.SYNC_LOG);
            const request = store.add(logEntry);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get unsynced log entries
     */
    async getUnsyncedLogEntries(): Promise<SyncLogEntry[]> {
        await this.init();
        if (!this.db) throw new Error('DB not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.SYNC_LOG], 'readonly');
            const store = transaction.objectStore(STORES.SYNC_LOG);
            const index = store.index('synced');
            const request = index.getAll(false);

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Clear all cached data
     */
    async clearAllData(): Promise<void> {
        await this.init();
        if (!this.db) throw new Error('DB not initialized');

        const stores = [STORES.TASKS, STORES.POD_QUEUE, STORES.PHOTOS, STORES.SYNC_LOG];
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(stores, 'readwrite');

            for (const storeName of stores) {
                transaction.objectStore(storeName).clear();
            }

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * Check if online
     */
    isOnline(): boolean {
        return navigator.onLine;
    }

    /**
     * Get storage stats
     */
    async getStorageStats(): Promise<{
        cachedTasks: number;
        unsyncedPODs: number;
        unsyncedLogs: number;
    }> {
        await this.init();
        if (!this.db) throw new Error('DB not initialized');

        const [tasks, pods, logs] = await Promise.all([
            this.getCachedTasks(),
            this.getUnsyncedPODs(),
            this.getUnsyncedLogEntries(),
        ]);

        return {
            cachedTasks: tasks.length,
            unsyncedPODs: pods.length,
            unsyncedLogs: logs.length,
        };
    }
}

export const offlineStorage = new OfflineStorageService();

