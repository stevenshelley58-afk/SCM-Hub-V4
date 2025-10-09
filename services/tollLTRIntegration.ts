/**
 * Toll LTR Integration Service
 * Integrates Toll logistics with the Material Request workflow
 */

import { MaterialRequest, WOMaterial } from '../types';
import {
    checkTollAvailability,
    createTollTask,
    getTollTask,
    getTollTasksForMRF,
    cancelTollTask,
    TollTask,
    TollAvailability,
    CreateTollTaskRequest
} from './tollLTRService';

/**
 * Check if a material is available from Toll
 */
export const checkMaterialAtToll = async (
    itemNumber: string
): Promise<TollAvailability | null> => {
    try {
        const availability = await checkTollAvailability(itemNumber);
        
        if (availability) {
            console.log(`ℹ️ Toll Integration: ${itemNumber} ${availability.available ? 'is available' : 'is not available'} at ${availability.location}`);
        }
        
        return availability;
    } catch (error) {
        console.error('❌ Toll Integration: Failed to check availability', error);
        return null;
    }
};

/**
 * Order material from Toll for a Work Order material line
 */
export const orderFromToll = async (
    mrfId: string,
    material: WOMaterial,
    deliveryLocation: string,
    priority: 'standard' | 'urgent' = 'standard'
): Promise<TollTask | null> => {
    try {
        // First check if material is available
        const availability = await checkTollAvailability(material.jdeItemNo);
        
        if (!availability) {
            console.warn(`⚠️ Toll Integration: Material ${material.jdeItemNo} not found in Toll catalog`);
            return null;
        }
        
        if (!availability.available) {
            console.warn(`⚠️ Toll Integration: Material ${material.jdeItemNo} not currently available at Toll`);
            return null;
        }
        
        if (availability.quantityOnHand < material.workOrderQty) {
            console.warn(`⚠️ Toll Integration: Insufficient quantity at Toll. Required: ${material.workOrderQty}, Available: ${availability.quantityOnHand}`);
            return null;
        }
        
        // Create Toll task
        const request: CreateTollTaskRequest = {
            mrfId,
            itemNumber: material.jdeItemNo,
            materialDescription: material.materialDescription,
            quantity: material.workOrderQty,
            pickupLocation: availability.location,
            deliveryLocation,
            priority
        };
        
        const task = await createTollTask(request);
        
        console.log(`✅ Toll Integration: Order created - Task ${task.taskId} for MRF ${mrfId}`);
        
        return task;
    } catch (error) {
        console.error('❌ Toll Integration: Failed to create order', error);
        return null;
    }
};

/**
 * Link a Toll task to a Material Request
 */
export const linkTollTaskToMRF = (
    request: MaterialRequest,
    task: TollTask
): void => {
    request.tollTaskId = task.taskId;
    request.tollStatus = task.status;
    
    console.log(`🔗 Toll Integration: Linked task ${task.taskId} to MRF ${request.id}`);
};

/**
 * Update MRF with latest Toll task status
 */
export const syncTollStatusToMRF = async (
    request: MaterialRequest
): Promise<boolean> => {
    if (!request.tollTaskId) {
        return false;
    }
    
    try {
        const task = await getTollTask(request.tollTaskId);
        
        if (!task) {
            console.warn(`⚠️ Toll Integration: Task ${request.tollTaskId} not found`);
            return false;
        }
        
        const oldStatus = request.tollStatus;
        request.tollStatus = task.status;
        
        if (oldStatus !== task.status) {
            console.log(`🔄 Toll Integration: MRF ${request.id} Toll status updated: ${oldStatus} → ${task.status}`);
            
            // If Toll delivered, update MRF notes
            if (task.status === 'delivered' && task.actualDelivery) {
                console.log(`✅ Toll Integration: Materials delivered via Toll at ${new Date(task.actualDelivery).toLocaleString()}`);
            }
        }
        
        return true;
    } catch (error) {
        console.error('❌ Toll Integration: Failed to sync status', error);
        return false;
    }
};

/**
 * Get all Toll tasks for an MRF
 */
export const getMRFTollTasks = async (
    mrfId: string
): Promise<TollTask[]> => {
    try {
        const tasks = await getTollTasksForMRF(mrfId);
        console.log(`ℹ️ Toll Integration: Found ${tasks.length} Toll task(s) for MRF ${mrfId}`);
        return tasks;
    } catch (error) {
        console.error('❌ Toll Integration: Failed to get tasks', error);
        return [];
    }
};

/**
 * Cancel Toll task for an MRF
 */
export const cancelMRFTollTask = async (
    request: MaterialRequest,
    reason: string
): Promise<boolean> => {
    if (!request.tollTaskId) {
        console.warn('⚠️ Toll Integration: No Toll task to cancel');
        return false;
    }
    
    try {
        const success = await cancelTollTask(request.tollTaskId, reason);
        
        if (success) {
            request.tollStatus = 'cancelled';
            console.log(`✅ Toll Integration: Cancelled Toll task ${request.tollTaskId} for MRF ${request.id}`);
        }
        
        return success;
    } catch (error) {
        console.error('❌ Toll Integration: Failed to cancel task', error);
        return false;
    }
};

/**
 * Check if any materials in the request are available from Toll
 */
export const checkTollAvailabilityForMaterials = async (
    materials: WOMaterial[]
): Promise<Record<string, TollAvailability | null>> => {
    const results: Record<string, TollAvailability | null> = {};
    
    for (const material of materials) {
        results[material.jdeItemNo] = await checkMaterialAtToll(material.jdeItemNo);
    }
    
    return results;
};

/**
 * Auto-sync Toll status for active MRFs (called periodically)
 */
export const autoSyncTollStatuses = async (
    requests: MaterialRequest[]
): Promise<void> => {
    const tollRequests = requests.filter(r => r.tollTaskId && r.tollStatus !== 'delivered' && r.tollStatus !== 'cancelled');
    
    if (tollRequests.length === 0) {
        return;
    }
    
    console.log(`🔄 Toll Integration: Auto-syncing ${tollRequests.length} Toll task(s)...`);
    
    for (const request of tollRequests) {
        await syncTollStatusToMRF(request);
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`✅ Toll Integration: Auto-sync complete`);
};

/**
 * Get human-readable status message for Toll integration
 */
export const getTollStatusMessage = (
    tollStatus?: TollTask['status'],
    taskId?: string
): string => {
    if (!tollStatus || !taskId) {
        return 'No Toll task linked';
    }
    
    switch (tollStatus) {
        case 'pending':
            return `Toll task ${taskId} is pending acceptance`;
        case 'accepted':
            return `Toll task ${taskId} accepted, driver assigned`;
        case 'in_transit':
            return `Toll task ${taskId} in transit, materials en route`;
        case 'delivered':
            return `Toll task ${taskId} delivered successfully`;
        case 'cancelled':
            return `Toll task ${taskId} was cancelled`;
        case 'failed':
            return `Toll task ${taskId} failed - contact Toll support`;
        default:
            return `Toll task ${taskId} status: ${tollStatus}`;
    }
};

/**
 * Check if Toll should be used for off-site materials
 */
export const shouldUseToll = (material: WOMaterial): boolean => {
    // Criteria for using Toll:
    // - Material not in local storage locations
    // - Specific storage locations indicate off-site (e.g., "TOLL", "EXTERNAL", "VENDOR")
    const offSiteIndicators = ['TOLL', 'EXTERNAL', 'VENDOR', 'OFFSITE'];
    
    return offSiteIndicators.some(indicator => 
        material.storageLocation.toUpperCase().includes(indicator)
    );
};

/**
 * Estimate Toll delivery time
 */
export const estimateTollDeliveryTime = (
    availability: TollAvailability,
    priority: 'standard' | 'urgent' = 'standard'
): Date => {
    const now = new Date();
    let leadTimeDays = availability.estimatedLeadTimeDays;
    
    // Urgent priority reduces lead time
    if (priority === 'urgent') {
        leadTimeDays = Math.max(1, Math.floor(leadTimeDays / 2));
    }
    
    const deliveryTime = new Date(now.getTime() + (leadTimeDays * 24 * 60 * 60 * 1000));
    return deliveryTime;
};

