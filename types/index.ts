export interface User {
    id: 'requestor' | 'ac' | 'qube' | 'mc';
    name: string;
    role: string;
    phone?: string;
}

export interface DeliveryLocation {
    id: string;
    building: string;
    floor?: string;
    room?: string;
    fullAddress: string; // Computed from building + floor + room
    contactPerson?: string;
    contactPhone?: string;
    deliveryInstructions?: string;
    isActive: boolean;
}

export interface PODData {
    photos: string[]; // Base64 encoded images
    signature: string; // Base64 encoded signature
    recipientName: string;
    recipientTitle?: string;
    gpsCoordinates?: {
        latitude: number;
        longitude: number;
    };
    notes?: string;
    timestamp: string;
    capturedBy: string; // Who captured the POD (usually warehouse/delivery person)
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
    approvalInfo?: {
        approvedBy?: string;
        approvedAt?: string;
        rejectedBy?: string;
        rejectedAt?: string;
        notes?: string;
    };
    MC_Queue_Position?: number; // MC-controlled queue position (1 = first in queue)
    pod?: PODData; // Proof of Delivery data
    estimatedDelivery?: string; // ISO timestamp of estimated delivery
    deliveryConfirmation?: {
        confirmedAt: string;
        confirmedBy: string;
        rating?: number; // 1-5
        feedback?: string;
        issuesReported?: string;
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

// Notification types for Agent 3 - Integrations
export interface NotificationTemplate {
    id: string;
    name: string;
    type: 'email' | 'sms' | 'teams' | 'push';
    subject?: string;
    body: string;
    variables: string[];
}

export interface Notification {
    id: string;
    type: 'email' | 'sms' | 'teams' | 'push';
    recipient: string;
    subject?: string;
    message: string;
    status: 'pending' | 'sent' | 'failed';
    sentAt?: string;
    error?: string;
    mrfId?: string;
}

export interface NotificationRule {
    id: string;
    event: 'submitted' | 'status_change' | 'delay' | 'delivered' | 'short_pick' | 'p1_created';
    enabled: boolean;
    channels: ('email' | 'sms' | 'teams')[];
    recipients: string[];
    templateId: string;
}

export interface DeliveryPhoto {
    id: string;
    mrfId: string;
    type: 'condition' | 'storage' | 'delivery';
    url: string;
    uploadedBy: string;
    uploadedAt: string;
    notes?: string;
}
