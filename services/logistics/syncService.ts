/**
 * Sync Service
 * Handles syncing offline data when connection is restored
 */

import { offlineStorage } from './offlineStorage';
import { podService } from './podService';
import { taskService } from './taskService';

class SyncService {
    private syncInterval: number | null = null;
    private isSyncing = false;
    private listeners: Array<(status: SyncStatus) => void> = [];

    /**
     * Start auto-sync when online
     */
    startAutoSync(intervalMs: number = 30000): void {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('📡 Connection restored, starting sync...');
            this.syncAll();
        });

        window.addEventListener('offline', () => {
            console.log('📡 Connection lost, data will be queued for sync');
        });

        // Set up periodic sync
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = window.setInterval(() => {
            if (navigator.onLine && !this.isSyncing) {
                this.syncAll();
            }
        }, intervalMs);

        // Initial sync if online
        if (navigator.onLine) {
            this.syncAll();
        }
    }

    /**
     * Stop auto-sync
     */
    stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * Sync all pending data
     */
    async syncAll(): Promise<SyncResult> {
        if (this.isSyncing) {
            console.log('Sync already in progress, skipping...');
            return { success: false, error: 'Sync already in progress' };
        }

        if (!navigator.onLine) {
            console.log('Device offline, skipping sync');
            return { success: false, error: 'Device offline' };
        }

        this.isSyncing = true;
        this.notifyListeners({ syncing: true, progress: 0 });

        const result: SyncResult = {
            success: true,
            podssynced: 0,
            podsFailed: 0,
            errors: [],
        };

        try {
            // Sync PODs
            const unsyncedPODs = await offlineStorage.getUnsyncedPODs();
            console.log(`📤 Syncing ${unsyncedPODs.length} PODs...`);

            for (let i = 0; i < unsyncedPODs.length; i++) {
                const pod = unsyncedPODs[i];
                
                try {
                    // Convert base64 photos to Files
                    const photoFiles = await Promise.all(
                        pod.photos.map(async (dataUrl, index) => {
                            const response = await fetch(dataUrl);
                            const blob = await response.blob();
                            return new File([blob], `photo-${index + 1}.jpg`, { type: 'image/jpeg' });
                        })
                    );

                    // Upload POD
                    await podService.createPOD({
                        task_id: pod.task_id,
                        photos: photoFiles,
                        signature_img: pod.signature || undefined,
                        signature_name: pod.delivered_to,
                        delivered_to: pod.delivered_to,
                        delivered_to_phone: pod.delivered_to_phone,
                        delivery_notes: pod.delivery_notes,
                        delivery_gps_lat: pod.gps_lat,
                        delivery_gps_lng: pod.gps_lng,
                    });

                    // Mark as synced and complete task
                    await offlineStorage.markPODSynced(pod.id);
                    await taskService.completeTask(pod.task_id);

                    // Clean up
                    await offlineStorage.deletePOD(pod.id);

                    result.podsSynced++;
                    console.log(`✅ Synced POD for task ${pod.task_id}`);
                } catch (error: any) {
                    result.podsFailed++;
                    result.errors.push({
                        type: 'pod',
                        id: pod.id,
                        error: error.message,
                    });
                    console.error(`❌ Failed to sync POD ${pod.id}:`, error);
                }

                // Update progress
                const progress = ((i + 1) / unsyncedPODs.length) * 100;
                this.notifyListeners({ syncing: true, progress });
            }

            console.log(`✅ Sync complete: ${result.podsSynced} succeeded, ${result.podsFailed} failed`);
        } catch (error: any) {
            result.success = false;
            result.error = error.message;
            console.error('❌ Sync error:', error);
        } finally {
            this.isSyncing = false;
            this.notifyListeners({ syncing: false, progress: 100 });
        }

        return result;
    }

    /**
     * Manually trigger sync
     */
    async manualSync(): Promise<SyncResult> {
        return this.syncAll();
    }

    /**
     * Get sync status
     */
    async getSyncStatus(): Promise<{
        online: boolean;
        syncing: boolean;
        pendingPODs: number;
        lastSyncAttempt: string | null;
    }> {
        const stats = await offlineStorage.getStorageStats();
        
        return {
            online: navigator.onLine,
            syncing: this.isSyncing,
            pendingPODs: stats.unsyncedPODs,
            lastSyncAttempt: localStorage.getItem('last_sync_attempt'),
        };
    }

    /**
     * Subscribe to sync status updates
     */
    onSyncStatus(callback: (status: SyncStatus) => void): () => void {
        this.listeners.push(callback);
        
        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Notify listeners of status change
     */
    private notifyListeners(status: SyncStatus): void {
        this.listeners.forEach(listener => listener(status));
    }
}

export interface SyncResult {
    success: boolean;
    podsSynced?: number;
    podsFailed?: number;
    errors?: Array<{
        type: string;
        id: string;
        error: string;
    }>;
    error?: string;
}

export interface SyncStatus {
    syncing: boolean;
    progress: number; // 0-100
}

export const syncService = new SyncService();

