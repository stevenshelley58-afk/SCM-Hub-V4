export interface User {
    id: 'requestor' | 'ac' | 'qube' | 'mc';
    name: string;
    role: string;
    phone?: string;
}

export interface MaterialRequest {
    id: string;
    status: 'Submitted' | 'Picking' | 'Partial Pick - Open' | 'Partial Pick - Closed' | 'Staged' | 'In Transit' | 'Delivered' | 'On Hold' | 'Cancelled';
    priority: 'P1' | 'P2' | 'P3' | 'P4';
    items: number;
    workOrders: string;
    createdDate: string;
    RequiredByTimestamp: string;
    RequiredByTime?: string; // Optional time
    RequestedBy: string; // Added for tracking who created it
    MC_Priority_Flag: boolean;
    DeliveryLocation: string;
    requestorName: string;
    acPriority: number | null;
    statusHistory?: StatusHistoryEntry[];
    hasBackwardsTransition?: boolean;
    onHoldInfo?: {
        putOnHoldBy: string;
        putOnHoldAt: string;
        reason: string;
        expectedResumeDate?: string;
    };
}

export interface RequestItem {
    pKey: string;
    status: 'Open' | 'Picked' | 'Short';
    qtyRequested: number;
    materialDescription: string;
    itemNumber: string;
    storageLocation: string;
    packNumber: string;
    shortReason?: 'Item Damaged' | 'Quantity Mismatch' | 'Location Empty' | 'Wrong Item in Location' | 'Quarantine' | 'Other';
    shortNotes?: string;
    shortReportedBy?: string;
    shortReportedAt?: string;
}

export interface StatusHistoryEntry {
    status: string;
    timestamp: string;
    changedBy: string;
    reason?: string;
    isBackwards?: boolean;
}

export interface WOMaterial {
    pKey: string;
    workOrder: string;
    lineNumber: string;
    opsSeq: string;
    team: string;
    packNumber: string;
    storageLocation: string;
    jdeItemNo: string;
    materialDescription: string;
    workOrderQty: number;
    isDisabled?: boolean;
    onClick?: (row: any) => void;
}

export interface LockInfo {
    lockedBy: string;
    comment: string;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: 'status_change' | 'priority_change' | 'manual_unlock' | 'manual_override' | 'mc_priority_flag' | 'split_mrf' | 'bulk_update' | 'hold' | 'cancel' | 'resume';
    entityType: 'material_request' | 'material' | 'system';
    entityId: string;
    details: string;
    oldValue?: any;
    newValue?: any;
    reason?: string;
}

export interface SystemConfig {
    maxItemsPerRequest: number;
    maxConcurrentRequestsPerUser: number;
    p1QuotaPerDay: number;
    rateLimit: number;
    enabledFeatures: string[];
}

export interface Permission {
    userId: string;
    role: string;
    canManualUnlock: boolean;
    canOverrideStatus: boolean;
    canAdjustPriority: boolean;
    canViewAuditTrail: boolean;
    canAccessReports: boolean;
    canManageSystem: boolean;
}
