import { mockMaterialLocks, mockTransactionalData } from '../services/api';

/**
 * Automatically unlocks materials when MRF status changes to Delivered or Cancelled
 */
export function autoUnlockMaterials(mrfId: string, newStatus: string): void {
    if (newStatus === 'Delivered' || newStatus === 'Cancelled') {
        // Find all materials locked by this MRF
        const pKeysToUnlock: string[] = [];
        
        Object.entries(mockTransactionalData).forEach(([pKey, data]) => {
            if (data.mrfId === mrfId) {
                pKeysToUnlock.push(pKey);
            }
        });
        
        // Unlock all materials associated with this MRF
        pKeysToUnlock.forEach(pKey => {
            if (mockMaterialLocks[pKey]) {
                delete mockMaterialLocks[pKey];
            }
            // Also update transactional data status
            if (mockTransactionalData[pKey]) {
                mockTransactionalData[pKey].status = newStatus;
            }
        });
        
        console.log(`Auto-unlocked ${pKeysToUnlock.length} materials for MRF ${mrfId} (status: ${newStatus})`);
    }
}

/**
 * Manually unlock a material (MC god mode)
 */
export function manualUnlockMaterial(pKey: string, unlockedBy: string, reason: string): void {
    if (mockMaterialLocks[pKey]) {
        delete mockMaterialLocks[pKey];
        console.log(`Material ${pKey} manually unlocked by ${unlockedBy}: ${reason}`);
    }
}

