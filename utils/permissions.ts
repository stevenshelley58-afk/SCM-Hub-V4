/**
 * Permissions System
 * Defines what each role can and cannot do
 * Material Coordinator (MC) has "god mode" - can do anything
 */

import { User } from '../types';

// Permission categories
export type Permission = 
    // Material Request Permissions
    | 'create_request'
    | 'view_own_requests'
    | 'view_all_requests'
    | 'edit_own_request'
    | 'edit_any_request'
    | 'cancel_own_request'
    | 'cancel_any_request'
    | 'delete_request'
    
    // Pick/Fulfillment Permissions
    | 'view_pick_list'
    | 'start_picking'
    | 'mark_picked'
    | 'mark_short'
    | 'stage_items'
    | 'deliver_items'
    
    // Status Management Permissions
    | 'put_on_hold'
    | 'resume_from_hold'
    | 'approve_p1'
    | 'reject_p1'
    | 'force_status_change'
    | 'reverse_status'
    
    // Material Lock Permissions
    | 'lock_material'
    | 'unlock_own_lock'
    | 'unlock_any_lock'
    | 'override_lock'
    
    // Split/Modify Permissions
    | 'split_request'
    | 'merge_requests'
    | 'modify_priority'
    | 'modify_delivery_location'
    | 'modify_required_date'
    
    // Dashboard/View Permissions
    | 'view_ac_dashboard'
    | 'view_exception_dashboard'
    | 'view_p1_dashboard'
    | 'view_analytics'
    | 'view_all_scope'
    
    // Admin/MC Permissions
    | 'manage_users'
    | 'manage_permissions'
    | 'configure_system'
    | 'view_audit_log'
    | 'export_data'
    | 'bulk_operations'
    | 'bypass_validations'
    | 'god_mode';

// Role-based permission matrix
const rolePermissions: Record<string, Permission[]> = {
    'Requestor': [
        'create_request',
        'view_own_requests',
        'edit_own_request',
        'cancel_own_request',
        'lock_material',
        'unlock_own_lock',
    ],
    
    'Area Coordinator': [
        'create_request',
        'view_own_requests',
        'view_all_requests',
        'edit_own_request',
        'cancel_own_request',
        'lock_material',
        'unlock_own_lock',
        'view_ac_dashboard',
        'view_exception_dashboard',
        'view_analytics',
        'view_all_scope',
    ],
    
    'Qube User': [
        'view_all_requests',
        'view_pick_list',
        'start_picking',
        'mark_picked',
        'mark_short',
        'stage_items',
        'deliver_items',
        'put_on_hold',
        'resume_from_hold',
        'split_request',
        'unlock_any_lock', // Can unlock to resolve blocked picks
        'view_exception_dashboard',
    ],
    
    'Material Coordinator': [
        // MC has god mode - ALL permissions
        'create_request',
        'view_own_requests',
        'view_all_requests',
        'edit_own_request',
        'edit_any_request',
        'cancel_own_request',
        'cancel_any_request',
        'delete_request',
        'view_pick_list',
        'start_picking',
        'mark_picked',
        'mark_short',
        'stage_items',
        'deliver_items',
        'put_on_hold',
        'resume_from_hold',
        'approve_p1',
        'reject_p1',
        'force_status_change',
        'reverse_status',
        'lock_material',
        'unlock_own_lock',
        'unlock_any_lock',
        'override_lock',
        'split_request',
        'merge_requests',
        'modify_priority',
        'modify_delivery_location',
        'modify_required_date',
        'view_ac_dashboard',
        'view_exception_dashboard',
        'view_p1_dashboard',
        'view_analytics',
        'view_all_scope',
        'manage_users',
        'manage_permissions',
        'configure_system',
        'view_audit_log',
        'export_data',
        'bulk_operations',
        'bypass_validations',
        'god_mode',
    ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User | null | undefined, permission: Permission): boolean {
    if (!user || !user.role) return false;
    
    // MC always has god mode
    if (user.role === 'Material Coordinator') return true;
    
    const permissions = rolePermissions[user.role] || [];
    return permissions.includes(permission);
}

/**
 * Check if a user has ANY of the specified permissions
 */
export function hasAnyPermission(user: User | null | undefined, permissions: Permission[]): boolean {
    return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if a user has ALL of the specified permissions
 */
export function hasAllPermissions(user: User | null | undefined, permissions: Permission[]): boolean {
    return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: User | null | undefined): Permission[] {
    if (!user || !user.role) return [];
    return rolePermissions[user.role] || [];
}

/**
 * Check if user is MC (god mode)
 */
export function isMC(user: User | null | undefined): boolean {
    return user?.role === 'Material Coordinator';
}

/**
 * Check if user can edit a specific request
 */
export function canEditRequest(user: User | null | undefined, request: any): boolean {
    if (!user) return false;
    
    // MC can edit anything
    if (isMC(user)) return true;
    
    // Can edit own requests if they have the permission
    if (request.RequestedBy === user.name && hasPermission(user, 'edit_own_request')) {
        return true;
    }
    
    // Can edit any request if they have the permission
    if (hasPermission(user, 'edit_any_request')) {
        return true;
    }
    
    return false;
}

/**
 * Check if user can cancel a specific request
 */
export function canCancelRequest(user: User | null | undefined, request: any): boolean {
    if (!user) return false;
    
    // MC can cancel anything
    if (isMC(user)) return true;
    
    // Can cancel own requests if they have the permission
    if (request.RequestedBy === user.name && hasPermission(user, 'cancel_own_request')) {
        return true;
    }
    
    // Can cancel any request if they have the permission
    if (hasPermission(user, 'cancel_any_request')) {
        return true;
    }
    
    return false;
}

/**
 * Check if user can unlock a specific material
 */
export function canUnlockMaterial(user: User | null | undefined, lock: any): boolean {
    if (!user) return false;
    
    // MC can unlock anything
    if (isMC(user)) return true;
    
    // Can unlock own locks
    if (lock.lockedBy === user.name && hasPermission(user, 'unlock_own_lock')) {
        return true;
    }
    
    // Can unlock any lock
    if (hasPermission(user, 'unlock_any_lock')) {
        return true;
    }
    
    return false;
}

/**
 * Get a human-readable description of what god mode allows
 */
export function getGodModeDescription(): string {
    return `Material Coordinator (MC) God Mode:
• View and edit ALL requests, regardless of who created them
• Cancel or delete any request at any time
• Approve/reject P1 requests
• Force status changes and reverse statuses
• Unlock ANY material, regardless of who locked it
• Split, merge, and modify requests
• Change priorities, delivery locations, and dates
• Access all dashboards and analytics
• Manage users and system configuration
• Perform bulk operations
• Bypass all validation rules`;
}

