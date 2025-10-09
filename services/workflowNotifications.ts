/**
 * Workflow Notifications
 * Centralized notification triggers for all core workflow events
 */

import { MaterialRequest } from '../types';
import { sendNotification } from './notificationService';

/**
 * Notify on new material request submission
 */
export const notifyRequestSubmitted = async (request: MaterialRequest) => {
    await sendNotification({
        type: 'submitted',
        recipients: [request.RequestedBy, 'mc@company.com', 'qube@company.com'],
        title: `📝 New Material Request - ${request.id}`,
        message: `Material request submitted with ${request.items} items (${request.priority}). Required by: ${new Date(request.RequiredByTimestamp).toLocaleString()}`,
        data: {
            requestId: request.id,
            priority: request.priority,
            items: request.items,
            requiredBy: request.RequiredByTimestamp,
            deliveryLocation: request.DeliveryLocation
        },
        priority: request.priority === 'P1' ? 'high' : 'normal'
    });
    
    console.log(`✉️ Notification sent: Request ${request.id} submitted`);
};

/**
 * Notify on status change
 */
export const notifyStatusChange = async (
    request: MaterialRequest,
    oldStatus: string,
    newStatus: string,
    changedBy: string,
    reason?: string
) => {
    const recipients = [request.RequestedBy, 'mc@company.com'];
    
    // Add warehouse to recipients for certain status changes
    if (['Picking', 'Staged'].includes(newStatus)) {
        recipients.push('qube@company.com');
    }
    
    await sendNotification({
        type: 'status_change',
        recipients,
        title: `🔄 Status Update - ${request.id}`,
        message: `Status changed from "${oldStatus}" to "${newStatus}"${reason ? `: ${reason}` : ''}`,
        data: {
            requestId: request.id,
            oldStatus,
            newStatus,
            changedBy,
            reason,
            timestamp: new Date().toISOString()
        },
        priority: request.priority === 'P1' ? 'high' : 'normal'
    });
    
    console.log(`✉️ Notification sent: Request ${request.id} status changed ${oldStatus} → ${newStatus}`);
};

/**
 * Notify on P1 approval needed
 */
export const notifyP1Approval = async (request: MaterialRequest) => {
    await sendNotification({
        type: 'p1_created',
        recipients: ['mc@company.com'],
        title: `🚨 P1 Approval Required - ${request.id}`,
        message: `Critical P1 request needs immediate approval. ${request.items} items required by ${new Date(request.RequiredByTimestamp).toLocaleString()}`,
        data: {
            requestId: request.id,
            priority: 'P1',
            items: request.items,
            requiredBy: request.RequiredByTimestamp,
            deliveryLocation: request.DeliveryLocation,
            requestedBy: request.RequestedBy
        },
        priority: 'high'
    });
    
    console.log(`✉️ Notification sent: P1 approval needed for ${request.id}`);
};

/**
 * Notify on request on hold
 */
export const notifyRequestOnHold = async (
    request: MaterialRequest,
    reason: string,
    putOnHoldBy: string
) => {
    await sendNotification({
        type: 'hold',
        recipients: [request.RequestedBy, 'mc@company.com'],
        title: `⏸️ Request On Hold - ${request.id}`,
        message: `Your material request has been put on hold. Reason: ${reason}`,
        data: {
            requestId: request.id,
            reason,
            putOnHoldBy,
            timestamp: new Date().toISOString()
        },
        priority: request.priority === 'P1' ? 'high' : 'normal'
    });
    
    console.log(`✉️ Notification sent: Request ${request.id} on hold`);
};

/**
 * Notify on request resumed from hold
 */
export const notifyRequestResumed = async (
    request: MaterialRequest,
    resumedBy: string
) => {
    await sendNotification({
        type: 'resumed',
        recipients: [request.RequestedBy, 'mc@company.com', 'qube@company.com'],
        title: `▶️ Request Resumed - ${request.id}`,
        message: `Your material request has been resumed and is back in the queue.`,
        data: {
            requestId: request.id,
            resumedBy,
            timestamp: new Date().toISOString()
        },
        priority: request.priority === 'P1' ? 'high' : 'normal'
    });
    
    console.log(`✉️ Notification sent: Request ${request.id} resumed`);
};

/**
 * Notify on request cancelled
 */
export const notifyRequestCancelled = async (
    request: MaterialRequest,
    reason: string,
    cancelledBy: string
) => {
    await sendNotification({
        type: 'cancelled',
        recipients: [request.RequestedBy, 'mc@company.com', 'qube@company.com'],
        title: `❌ Request Cancelled - ${request.id}`,
        message: `Material request has been cancelled. Reason: ${reason}`,
        data: {
            requestId: request.id,
            reason,
            cancelledBy,
            timestamp: new Date().toISOString()
        },
        priority: 'normal'
    });
    
    console.log(`✉️ Notification sent: Request ${request.id} cancelled`);
};

/**
 * Notify on short pick
 */
export const notifyShortPick = async (
    request: MaterialRequest,
    itemDescription: string,
    shortReason: string,
    reportedBy: string
) => {
    await sendNotification({
        type: 'short_pick',
        recipients: [request.RequestedBy, 'mc@company.com'],
        title: `⚠️ Short Pick Reported - ${request.id}`,
        message: `Item "${itemDescription}" could not be picked. Reason: ${shortReason}`,
        data: {
            requestId: request.id,
            itemDescription,
            shortReason,
            reportedBy,
            timestamp: new Date().toISOString()
        },
        priority: request.priority === 'P1' ? 'high' : 'normal'
    });
    
    console.log(`✉️ Notification sent: Short pick reported for ${request.id}`);
};

/**
 * Notify on picking complete / staged
 */
export const notifyPickingComplete = async (request: MaterialRequest) => {
    await sendNotification({
        type: 'staged',
        recipients: [request.RequestedBy, 'mc@company.com'],
        title: `✅ Picking Complete - ${request.id}`,
        message: `All items have been picked and staged. Ready for delivery to ${request.DeliveryLocation}.`,
        data: {
            requestId: request.id,
            deliveryLocation: request.DeliveryLocation,
            timestamp: new Date().toISOString()
        },
        priority: request.priority === 'P1' ? 'high' : 'normal'
    });
    
    console.log(`✉️ Notification sent: Picking complete for ${request.id}`);
};

/**
 * Notify on delivery (already handled in POD capture but included for completeness)
 */
export const notifyDelivered = async (
    request: MaterialRequest,
    podData: {
        recipientName: string;
        timestamp: string;
        photoCount: number;
    }
) => {
    await sendNotification({
        type: 'delivered',
        recipients: [request.RequestedBy, 'mc@company.com'],
        title: `📦 Materials Delivered - ${request.id}`,
        message: `Your material request has been delivered and POD captured. Received by: ${podData.recipientName}`,
        data: {
            requestId: request.id,
            podData,
            deliveryLocation: request.DeliveryLocation
        },
        priority: request.priority === 'P1' ? 'high' : 'normal'
    });
    
    console.log(`✉️ Notification sent: Request ${request.id} delivered`);
};

/**
 * Notify on ETA delay
 */
export const notifyETADelay = async (
    request: MaterialRequest,
    originalETA: string,
    newETA: string,
    delayReason: string
) => {
    await sendNotification({
        type: 'delay',
        recipients: [request.RequestedBy, 'mc@company.com'],
        title: `⏰ Delivery Delay - ${request.id}`,
        message: `Estimated delivery has been delayed. New ETA: ${new Date(newETA).toLocaleString()}. Reason: ${delayReason}`,
        data: {
            requestId: request.id,
            originalETA,
            newETA,
            delayReason,
            timestamp: new Date().toISOString()
        },
        priority: request.priority === 'P1' ? 'high' : 'normal'
    });
    
    console.log(`✉️ Notification sent: ETA delay for ${request.id}`);
};

/**
 * Batch notify for multiple requests
 */
export const notifyBatch = async (
    requests: MaterialRequest[],
    action: string,
    performedBy: string
) => {
    const requestIds = requests.map(r => r.id).join(', ');
    
    // Get unique recipients
    const recipients = new Set<string>();
    requests.forEach(r => {
        recipients.add(r.RequestedBy);
    });
    recipients.add('mc@company.com');
    
    await sendNotification({
        type: 'batch_action',
        recipients: Array.from(recipients),
        title: `🔄 Bulk Action - ${requests.length} Requests`,
        message: `Bulk action "${action}" performed on ${requests.length} requests by ${performedBy}`,
        data: {
            requestIds,
            action,
            performedBy,
            count: requests.length,
            timestamp: new Date().toISOString()
        },
        priority: 'normal'
    });
    
    console.log(`✉️ Notification sent: Bulk action "${action}" on ${requests.length} requests`);
};

