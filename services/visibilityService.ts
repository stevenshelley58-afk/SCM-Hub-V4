/**
 * Data Visibility Service
 * Control what users can see based on roles and departments
 */

export interface VisibilityRule {
    id: string;
    name: string;
    roleId: string;
    dataType: 'requests' | 'materials' | 'users' | 'reports' | 'audit';
    condition: 'own_only' | 'department_only' | 'all' | 'none';
    hiddenFields: string[];
    customFilter?: (item: any, userId: string) => boolean;
}

const visibilityRules: VisibilityRule[] = [
    {
        id: 'rule-1',
        name: 'Requestor - Own Requests Only',
        roleId: 'requestor',
        dataType: 'requests',
        condition: 'own_only',
        hiddenFields: ['requestorPhone', 'internalCost']
    },
    {
        id: 'rule-2',
        name: 'AC - Department Materials',
        roleId: 'area_coordinator',
        dataType: 'materials',
        condition: 'department_only',
        hiddenFields: ['supplierCost', 'vendorInfo']
    },
    {
        id: 'rule-3',
        name: 'Warehouse - All Active Requests',
        roleId: 'warehouse',
        dataType: 'requests',
        condition: 'all',
        hiddenFields: ['requestorPhone', 'internalCost', 'budgetCode']
    },
    {
        id: 'rule-4',
        name: 'MC - Full Access',
        roleId: 'material_coordinator',
        dataType: 'requests',
        condition: 'all',
        hiddenFields: []
    }
];

/**
 * Get visibility rules for a role
 */
export const getVisibilityRules = (roleId: string): VisibilityRule[] => {
    return visibilityRules.filter(rule => rule.roleId === roleId);
};

/**
 * Filter data based on visibility rules
 */
export const filterByVisibility = <T extends { id?: string; requestorName?: string; department?: string }>(
    data: T[],
    userId: string,
    roleId: string,
    dataType: VisibilityRule['dataType']
): T[] => {
    const rules = visibilityRules.filter(r => r.roleId === roleId && r.dataType === dataType);
    
    if (rules.length === 0) {
        // No rules = show all (default behavior)
        return data;
    }
    
    return data.filter(item => {
        return rules.some(rule => {
            switch (rule.condition) {
                case 'own_only':
                    // Only show items created by the user
                    return item.requestorName === getUserName(userId);
                    
                case 'department_only':
                    // Only show items from user's department
                    return item.department === getUserDepartment(userId);
                    
                case 'all':
                    return true;
                    
                case 'none':
                    return false;
                    
                default:
                    return true;
            }
        });
    });
};

/**
 * Remove hidden fields from an object
 */
export const removeHiddenFields = <T extends Record<string, any>>(
    obj: T,
    roleId: string,
    dataType: VisibilityRule['dataType']
): Partial<T> => {
    const rules = visibilityRules.filter(r => r.roleId === roleId && r.dataType === dataType);
    
    if (rules.length === 0) {
        return obj;
    }
    
    const allHiddenFields = new Set<string>();
    rules.forEach(rule => {
        rule.hiddenFields.forEach(field => allHiddenFields.add(field));
    });
    
    const filtered = { ...obj };
    allHiddenFields.forEach(field => {
        delete filtered[field];
    });
    
    return filtered;
};

/**
 * Check if user can view a specific field
 */
export const canViewField = (
    roleId: string,
    dataType: VisibilityRule['dataType'],
    fieldName: string
): boolean => {
    const rules = visibilityRules.filter(r => r.roleId === roleId && r.dataType === dataType);
    
    if (rules.length === 0) {
        return true; // No rules = can view all
    }
    
    return !rules.some(rule => rule.hiddenFields.includes(fieldName));
};

/**
 * Mock helper functions (in production these would come from user service)
 */
const getUserName = (userId: string): string => {
    const users: Record<string, string> = {
        'requestor': 'Jane Doe',
        'ac': 'Steve',
        'qube': 'JJ',
        'mc': 'Corey'
    };
    return users[userId] || 'Unknown';
};

const getUserDepartment = (userId: string): string => {
    const departments: Record<string, string> = {
        'requestor': 'Construction',
        'ac': 'Area A',
        'qube': 'Warehouse',
        'mc': 'Materials Management'
    };
    return departments[userId] || 'Unknown';
};

/**
 * Add a new visibility rule
 */
export const addVisibilityRule = (rule: Omit<VisibilityRule, 'id'>): string => {
    const id = `rule-${Date.now()}`;
    visibilityRules.push({ ...rule, id });
    return id;
};

/**
 * Update a visibility rule
 */
export const updateVisibilityRule = (
    id: string,
    updates: Partial<Omit<VisibilityRule, 'id'>>
): boolean => {
    const index = visibilityRules.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    visibilityRules[index] = { ...visibilityRules[index], ...updates };
    return true;
};

/**
 * Delete a visibility rule
 */
export const deleteVisibilityRule = (id: string): boolean => {
    const index = visibilityRules.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    visibilityRules.splice(index, 1);
    return true;
};
