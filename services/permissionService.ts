/**
 * Permission Rules Engine
 * Role-based access control system
 */

export type Permission =
    | 'create_request'
    | 'view_requests'
    | 'edit_own_requests'
    | 'edit_any_request'
    | 'delete_request'
    | 'cancel_request'
    | 'approve_p1'
    | 'override_status'
    | 'override_priority'
    | 'unlock_materials'
    | 'lock_materials'
    | 'pick_materials'
    | 'report_short_picks'
    | 'deliver_requests'
    | 'view_audit_log'
    | 'manage_users'
    | 'manage_permissions'
    | 'system_config'
    | 'view_reports'
    | 'export_data';

export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
    isSystem: boolean; // Cannot be deleted
}

export interface UserPermissions {
    userId: string;
    roleId: string;
    additionalPermissions: Permission[];
    deniedPermissions: Permission[];
}

// Default system roles
const systemRoles: Role[] = [
    {
        id: 'requestor',
        name: 'Requestor',
        description: 'Can create and view their own material requests',
        permissions: [
            'create_request',
            'view_requests',
            'edit_own_requests',
            'cancel_request'
        ],
        isSystem: true
    },
    {
        id: 'area_coordinator',
        name: 'Area Coordinator',
        description: 'Can manage priorities and lock materials',
        permissions: [
            'view_requests',
            'override_priority',
            'lock_materials',
            'view_reports'
        ],
        isSystem: true
    },
    {
        id: 'warehouse',
        name: 'Warehouse User',
        description: 'Can pick materials and report short picks',
        permissions: [
            'view_requests',
            'pick_materials',
            'report_short_picks',
            'deliver_requests'
        ],
        isSystem: true
    },
    {
        id: 'material_coordinator',
        name: 'Material Coordinator',
        description: 'Full system access with override capabilities',
        permissions: [
            'create_request',
            'view_requests',
            'edit_own_requests',
            'edit_any_request',
            'delete_request',
            'cancel_request',
            'approve_p1',
            'override_status',
            'override_priority',
            'unlock_materials',
            'lock_materials',
            'pick_materials',
            'report_short_picks',
            'deliver_requests',
            'view_audit_log',
            'manage_users',
            'manage_permissions',
            'system_config',
            'view_reports',
            'export_data'
        ],
        isSystem: true
    }
];

let roles: Role[] = [...systemRoles];
let userPermissions: UserPermissions[] = [];

/**
 * Get all roles
 */
export const getAllRoles = (): Role[] => {
    return [...roles];
};

/**
 * Get role by ID
 */
export const getRole = (roleId: string): Role | undefined => {
    return roles.find(r => r.id === roleId);
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (userId: string, permission: Permission): boolean => {
    const userPerms = userPermissions.find(up => up.userId === userId);
    if (!userPerms) return false;
    
    // Check if permission is explicitly denied
    if (userPerms.deniedPermissions.includes(permission)) {
        return false;
    }
    
    // Check if permission is in additional permissions
    if (userPerms.additionalPermissions.includes(permission)) {
        return true;
    }
    
    // Check role permissions
    const role = getRole(userPerms.roleId);
    return role ? role.permissions.includes(permission) : false;
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (userId: string, permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(userId, p));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (userId: string, permissions: Permission[]): boolean => {
    return permissions.every(p => hasPermission(userId, p));
};

/**
 * Get all permissions for a user
 */
export const getUserPermissions = (userId: string): Permission[] => {
    const userPerms = userPermissions.find(up => up.userId === userId);
    if (!userPerms) return [];
    
    const role = getRole(userPerms.roleId);
    const rolePerms = role ? role.permissions : [];
    
    // Combine role permissions with additional, excluding denied
    const allPerms = [...new Set([...rolePerms, ...userPerms.additionalPermissions])];
    return allPerms.filter(p => !userPerms.deniedPermissions.includes(p));
};

/**
 * Assign role to user
 */
export const assignRole = (userId: string, roleId: string): boolean => {
    const role = getRole(roleId);
    if (!role) return false;
    
    const existingIndex = userPermissions.findIndex(up => up.userId === userId);
    if (existingIndex >= 0) {
        userPermissions[existingIndex].roleId = roleId;
    } else {
        userPermissions.push({
            userId,
            roleId,
            additionalPermissions: [],
            deniedPermissions: []
        });
    }
    
    return true;
};

/**
 * Grant additional permission to user
 */
export const grantPermission = (userId: string, permission: Permission): boolean => {
    const userPerms = userPermissions.find(up => up.userId === userId);
    if (!userPerms) return false;
    
    if (!userPerms.additionalPermissions.includes(permission)) {
        userPerms.additionalPermissions.push(permission);
    }
    
    // Remove from denied if present
    const deniedIndex = userPerms.deniedPermissions.indexOf(permission);
    if (deniedIndex >= 0) {
        userPerms.deniedPermissions.splice(deniedIndex, 1);
    }
    
    return true;
};

/**
 * Revoke permission from user
 */
export const revokePermission = (userId: string, permission: Permission): boolean => {
    const userPerms = userPermissions.find(up => up.userId === userId);
    if (!userPerms) return false;
    
    // Add to denied permissions
    if (!userPerms.deniedPermissions.includes(permission)) {
        userPerms.deniedPermissions.push(permission);
    }
    
    // Remove from additional if present
    const additionalIndex = userPerms.additionalPermissions.indexOf(permission);
    if (additionalIndex >= 0) {
        userPerms.additionalPermissions.splice(additionalIndex, 1);
    }
    
    return true;
};

/**
 * Create a custom role
 */
export const createRole = (
    name: string,
    description: string,
    permissions: Permission[]
): string => {
    const id = `custom_${Date.now()}`;
    roles.push({
        id,
        name,
        description,
        permissions,
        isSystem: false
    });
    return id;
};

/**
 * Update a role
 */
export const updateRole = (
    roleId: string,
    updates: Partial<Pick<Role, 'name' | 'description' | 'permissions'>>
): boolean => {
    const role = roles.find(r => r.id === roleId);
    if (!role || role.isSystem) return false;
    
    Object.assign(role, updates);
    return true;
};

/**
 * Delete a role
 */
export const deleteRole = (roleId: string): boolean => {
    const role = roles.find(r => r.id === roleId);
    if (!role || role.isSystem) return false;
    
    // Check if any users have this role
    const hasUsers = userPermissions.some(up => up.roleId === roleId);
    if (hasUsers) return false;
    
    const index = roles.findIndex(r => r.id === roleId);
    if (index >= 0) {
        roles.splice(index, 1);
        return true;
    }
    
    return false;
};

// Initialize default user permissions for demo
assignRole('requestor', 'requestor');
assignRole('ac', 'area_coordinator');
assignRole('qube', 'warehouse');
assignRole('mc', 'material_coordinator');
