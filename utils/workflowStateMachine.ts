/**
 * Workflow State Machine
 * Defines valid status transitions, prevents invalid moves, and provides auto-transition logic
 */

import { MaterialRequest, User } from '../types';
import { hasPermission, isMC } from './permissions';

// Define all possible statuses
export type WorkflowStatus = 
    | 'Submitted'
    | 'Pending Approval'
    | 'Approved'
    | 'Picking'
    | 'Partial Pick - Open'
    | 'Partial Pick - Closed'
    | 'Staged'
    | 'In Transit'
    | 'Delivered'
    | 'On Hold'
    | 'Cancelled';

// Define valid transitions for each status
export const statusTransitions: Record<WorkflowStatus, WorkflowStatus[]> = {
    'Submitted': [
        'Pending Approval',  // P1 requests (if feature enabled)
        'Picking',           // Normal flow (Qube starts picking)
        'On Hold',           // Warehouse puts on hold
        'Cancelled'          // Requestor/MC cancels
    ],
    'Pending Approval': [
        'Approved',          // MC approves
        'Submitted',         // MC rejects (back to queue)
        'Cancelled'          // MC/Requestor cancels
    ],
    'Approved': [
        'Picking',           // Qube starts picking
        'On Hold',           // Warehouse puts on hold
        'Cancelled'          // MC/Requestor cancels
    ],
    'Picking': [
        'Partial Pick - Open',  // Some items short
        'Staged',               // All items picked successfully
        'On Hold',              // Issue during picking
        'Cancelled'             // MC cancels mid-pick
    ],
    'Partial Pick - Open': [
        'Partial Pick - Closed', // Issue resolved, ready to proceed
        'Staged',                // Proceed with partial (AC decision)
        'Picking',               // Resume picking (issue resolved)
        'On Hold',               // Need more time to resolve
        'Cancelled'              // Cannot fulfill
    ],
    'Partial Pick - Closed': [
        'Staged',           // Proceed to staging
        'Picking',          // Resume picking (if more items found)
        'On Hold',          // New issue
        'Cancelled'         // Cannot fulfill
    ],
    'Staged': [
        'In Transit',       // Delivery started
        'Delivered',        // Direct handoff (no transit)
        'Picking',          // Error, need to re-pick (MC only)
        'Cancelled'         // MC cancels before delivery
    ],
    'In Transit': [
        'Delivered',        // Delivery completed
        'On Hold',          // Delivery issue
        'Cancelled'         // MC cancels (rare)
    ],
    'Delivered': [
        // Terminal state - no forward transitions
        // MC can force backwards if needed (god mode)
    ],
    'On Hold': [
        'Submitted',        // Resume to queue
        'Picking',          // Resume picking (if was picking)
        'Staged',           // Resume from staging
        'Cancelled'         // Cancel while on hold
    ],
    'Cancelled': [
        // Terminal state - no forward transitions
        // MC can force un-cancel if needed (god mode)
    ]
};

// Define who can make each transition
export type TransitionPermission = {
    roles: string[];
    requiresGodMode?: boolean;
    requiresReason?: boolean;
};

export const transitionPermissions: Record<string, TransitionPermission> = {
    // Submitted transitions
    'Submitted->Pending Approval': { roles: ['System'], requiresReason: false },
    'Submitted->Picking': { roles: ['Qube User', 'Material Coordinator'], requiresReason: false },
    'Submitted->On Hold': { roles: ['Qube User', 'Material Coordinator'], requiresReason: true },
    'Submitted->Cancelled': { roles: ['Requestor', 'Area Coordinator', 'Material Coordinator'], requiresReason: true },
    
    // Pending Approval transitions
    'Pending Approval->Approved': { roles: ['Material Coordinator'], requiresReason: false },
    'Pending Approval->Submitted': { roles: ['Material Coordinator'], requiresReason: true },
    'Pending Approval->Cancelled': { roles: ['Material Coordinator', 'Requestor'], requiresReason: true },
    
    // Approved transitions
    'Approved->Picking': { roles: ['Qube User', 'Material Coordinator'], requiresReason: false },
    'Approved->On Hold': { roles: ['Qube User', 'Material Coordinator'], requiresReason: true },
    'Approved->Cancelled': { roles: ['Material Coordinator'], requiresReason: true },
    
    // Picking transitions
    'Picking->Partial Pick - Open': { roles: ['Qube User', 'Material Coordinator'], requiresReason: true },
    'Picking->Staged': { roles: ['Qube User', 'Material Coordinator'], requiresReason: false },
    'Picking->On Hold': { roles: ['Qube User', 'Material Coordinator'], requiresReason: true },
    'Picking->Cancelled': { roles: ['Material Coordinator'], requiresReason: true },
    
    // Partial Pick transitions
    'Partial Pick - Open->Partial Pick - Closed': { roles: ['Area Coordinator', 'Material Coordinator'], requiresReason: true },
    'Partial Pick - Open->Staged': { roles: ['Area Coordinator', 'Material Coordinator'], requiresReason: true },
    'Partial Pick - Open->Picking': { roles: ['Qube User', 'Material Coordinator'], requiresReason: true },
    'Partial Pick - Open->On Hold': { roles: ['Qube User', 'Material Coordinator'], requiresReason: true },
    'Partial Pick - Open->Cancelled': { roles: ['Material Coordinator'], requiresReason: true },
    
    'Partial Pick - Closed->Staged': { roles: ['Qube User', 'Material Coordinator'], requiresReason: false },
    'Partial Pick - Closed->Picking': { roles: ['Qube User', 'Material Coordinator'], requiresReason: true },
    'Partial Pick - Closed->On Hold': { roles: ['Qube User', 'Material Coordinator'], requiresReason: true },
    'Partial Pick - Closed->Cancelled': { roles: ['Material Coordinator'], requiresReason: true },
    
    // Staged transitions
    'Staged->In Transit': { roles: ['Qube User', 'Material Coordinator'], requiresReason: false },
    'Staged->Delivered': { roles: ['Qube User', 'Material Coordinator'], requiresReason: false },
    'Staged->Picking': { roles: ['Material Coordinator'], requiresGodMode: true, requiresReason: true },
    'Staged->Cancelled': { roles: ['Material Coordinator'], requiresReason: true },
    
    // In Transit transitions
    'In Transit->Delivered': { roles: ['Qube User', 'Material Coordinator'], requiresReason: false },
    'In Transit->On Hold': { roles: ['Qube User', 'Material Coordinator'], requiresReason: true },
    'In Transit->Cancelled': { roles: ['Material Coordinator'], requiresGodMode: true, requiresReason: true },
    
    // On Hold transitions
    'On Hold->Submitted': { roles: ['Qube User', 'Material Coordinator'], requiresReason: false },
    'On Hold->Picking': { roles: ['Qube User', 'Material Coordinator'], requiresReason: false },
    'On Hold->Staged': { roles: ['Qube User', 'Material Coordinator'], requiresReason: false },
    'On Hold->Cancelled': { roles: ['Material Coordinator', 'Requestor'], requiresReason: true },
};

/**
 * Check if a status transition is valid
 */
export function isValidTransition(
    fromStatus: WorkflowStatus,
    toStatus: WorkflowStatus
): boolean {
    const validNextStatuses = statusTransitions[fromStatus] || [];
    return validNextStatuses.includes(toStatus);
}

/**
 * Check if a user can make a specific transition
 */
export function canMakeTransition(
    user: User | null | undefined,
    fromStatus: WorkflowStatus,
    toStatus: WorkflowStatus,
    request?: MaterialRequest
): { allowed: boolean; reason?: string } {
    if (!user) {
        return { allowed: false, reason: 'No user provided' };
    }

    // Check if transition is valid in the state machine
    if (!isValidTransition(fromStatus, toStatus)) {
        // MC god mode can override (for backwards transitions)
        if (isMC(user)) {
            return { allowed: true, reason: 'MC God Mode Override' };
        }
        return { allowed: false, reason: `Invalid transition from ${fromStatus} to ${toStatus}` };
    }

    // Check role permissions
    const transitionKey = `${fromStatus}->${toStatus}`;
    const permission = transitionPermissions[transitionKey];
    
    if (!permission) {
        // If no explicit permission defined, MC can do it
        if (isMC(user)) {
            return { allowed: true };
        }
        return { allowed: false, reason: 'Transition not permitted' };
    }

    // Check if user's role is allowed
    if (!permission.roles.includes(user.role) && user.role !== 'Material Coordinator') {
        return { allowed: false, reason: `Role ${user.role} cannot make this transition` };
    }

    // Check god mode requirement
    if (permission.requiresGodMode && !isMC(user)) {
        return { allowed: false, reason: 'This transition requires MC god mode' };
    }

    return { allowed: true };
}

/**
 * Get all valid next statuses for a given status
 */
export function getValidNextStatuses(
    currentStatus: WorkflowStatus,
    user?: User
): WorkflowStatus[] {
    const validStatuses = statusTransitions[currentStatus] || [];
    
    if (!user) {
        return validStatuses;
    }

    // Filter by what user can actually do
    return validStatuses.filter(nextStatus => {
        const check = canMakeTransition(user, currentStatus, nextStatus);
        return check.allowed;
    });
}

/**
 * Check if a transition requires a reason
 */
export function requiresReason(
    fromStatus: WorkflowStatus,
    toStatus: WorkflowStatus
): boolean {
    const transitionKey = `${fromStatus}->${toStatus}`;
    const permission = transitionPermissions[transitionKey];
    return permission?.requiresReason || false;
}

/**
 * Get a human-readable description of a transition
 */
export function getTransitionDescription(
    fromStatus: WorkflowStatus,
    toStatus: WorkflowStatus
): string {
    const descriptions: Record<string, string> = {
        'Submitted->Pending Approval': 'P1 request requires MC approval',
        'Submitted->Picking': 'Warehouse starts picking items',
        'Submitted->On Hold': 'Request put on hold before picking',
        'Submitted->Cancelled': 'Request cancelled before picking started',
        
        'Pending Approval->Approved': 'MC approved P1 request',
        'Pending Approval->Submitted': 'MC rejected, returned to queue',
        'Pending Approval->Cancelled': 'Request cancelled during approval',
        
        'Approved->Picking': 'Warehouse starts picking approved request',
        'Picking->Partial Pick - Open': 'Some items could not be picked (short)',
        'Picking->Staged': 'All items picked successfully',
        'Picking->On Hold': 'Picking paused due to issue',
        
        'Partial Pick - Open->Partial Pick - Closed': 'Partial pick issue resolved',
        'Partial Pick - Open->Staged': 'Proceeding with partial fulfillment',
        'Partial Pick - Closed->Staged': 'Partial pick ready for staging',
        
        'Staged->In Transit': 'Delivery in progress',
        'Staged->Delivered': 'Direct handoff to requestor',
        
        'In Transit->Delivered': 'Delivery completed successfully',
        
        'On Hold->Submitted': 'Resumed to pick queue',
        'On Hold->Picking': 'Resumed picking',
        'On Hold->Cancelled': 'Cancelled while on hold',
        
        'Cancelled->': 'Terminal state',
        'Delivered->': 'Terminal state'
    };
    
    const key = `${fromStatus}->${toStatus}`;
    return descriptions[key] || `Transition from ${fromStatus} to ${toStatus}`;
}

/**
 * Determine auto-transition logic (when system should auto-advance)
 */
export function shouldAutoTransition(
    currentStatus: WorkflowStatus,
    context: {
        allItemsPicked?: boolean;
        someItemsShort?: boolean;
        p1RequiresApproval?: boolean;
    }
): WorkflowStatus | null {
    // When a P1 request is submitted and approval is required
    if (currentStatus === 'Submitted' && context.p1RequiresApproval) {
        return 'Pending Approval';
    }
    
    // When all items are picked during Picking
    if (currentStatus === 'Picking' && context.allItemsPicked) {
        return 'Staged';
    }
    
    // When some items are short during Picking
    if (currentStatus === 'Picking' && context.someItemsShort) {
        return 'Partial Pick - Open';
    }
    
    return null; // No auto-transition
}

/**
 * Validate a transition and return error message if invalid
 */
export function validateTransition(
    user: User | null | undefined,
    fromStatus: WorkflowStatus,
    toStatus: WorkflowStatus,
    reason?: string
): { valid: boolean; error?: string } {
    // Check if user can make this transition
    const canTransition = canMakeTransition(user, fromStatus, toStatus);
    if (!canTransition.allowed) {
        return { valid: false, error: canTransition.reason };
    }
    
    // Check if reason is required but not provided
    if (requiresReason(fromStatus, toStatus) && !reason) {
        return { valid: false, error: 'This transition requires a reason' };
    }
    
    return { valid: true };
}

