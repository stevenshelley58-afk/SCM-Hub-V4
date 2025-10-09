export interface User {
    id: 'requestor' | 'ac' | 'qube' | 'mc' | 'mlc' | 'driver';
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
    tollTaskId?: string; // Linked Toll LTR task ID
    tollStatus?: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled' | 'failed'; // Toll task status
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

// ============================================================================
// LOGISTICS APP (Toll Task Request) TYPES
// ============================================================================

export type LogisticsTaskType = 'delivery' | 'collection' | 'container_move' | 'yard_work' | 'project_move' | 'backload' | 'adhoc';
export type LogisticsTaskStatus = 'new' | 'scheduled' | 'in_progress' | 'completed' | 'verified' | 'closed' | 'exception' | 'cancelled' | 'on_hold';
export type LogisticsTaskPriority = 'critical' | 'high' | 'normal' | 'low';
export type DriverStatus = 'active' | 'inactive' | 'on_leave' | 'suspended';
export type VehicleType = 'truck' | 'van' | 'forklift' | 'crane' | 'ute' | 'other';
export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'out_of_service';
export type TaskEventType = 'created' | 'assigned' | 'status_changed' | 'driver_started' | 'arrived' | 'completed' | 'exception' | 'note_added' | 'cancelled' | 'on_hold' | 'resumed';

export interface LogisticsRequester {
    name: string;
    department: string;
    phone?: string;
    email?: string;
    cost_centre?: string;
    user_id?: string;
}

export interface LogisticsLocation {
    location: string;
    site_gate?: string;
    contact?: string;
    phone?: string;
    gps?: {
        lat: number;
        lng: number;
    };
    access_notes?: string;
}

export interface LogisticsLoadInfo {
    qty?: number;
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
    };
    container_no?: string;
    hazard_flag?: boolean;
    equipment_required?: string;
}

export interface LogisticsApprover {
    name: string;
    role: string;
    email: string;
    approved?: boolean;
    approved_at?: string;
}

export interface LogisticsGPSLog {
    timestamp: string;
    lat: number;
    lng: number;
    accuracy: number;
    event?: string;
}

export interface LogisticsAttachment {
    id: string;
    filename: string;
    url: string;
    type: string;
    uploaded_by: string;
    uploaded_at: string;
}

export interface LogisticsTask {
    // Identity
    task_id: string;
    task_number: string;
    
    // Type & Category
    type: LogisticsTaskType;
    category?: string;
    priority: LogisticsTaskPriority;
    
    // Requester Info
    requester: LogisticsRequester;
    
    // Task Details
    description: string;
    special_instructions?: string;
    linked_mrf_id?: string;
    linked_wo_id?: string;
    linked_entity_type?: string;
    linked_entity_id?: string;
    
    // Locations
    pickup: LogisticsLocation;
    dropoff: LogisticsLocation;
    
    // Load Info
    load_info?: LogisticsLoadInfo;
    
    // Schedule
    requested_date: string;
    requested_time?: string;
    hard_window_flag?: boolean;
    sla_target_at?: string;
    
    // Status & Lifecycle
    status: LogisticsTaskStatus;
    status_reason?: string;
    
    // Assignment
    driver_id?: string;
    driver?: Driver;
    vehicle_id?: string;
    vehicle?: Vehicle;
    assigned_at?: string;
    assigned_by?: string;
    
    // Execution
    started_at?: string;
    pickup_arrived_at?: string;
    pickup_completed_at?: string;
    dropoff_arrived_at?: string;
    completed_at?: string;
    verified_at?: string;
    verified_by?: string;
    closed_at?: string;
    closed_by?: string;
    
    // POD Reference
    pod_id?: string;
    pod?: PODRecord;
    
    // Attachments
    attachments?: LogisticsAttachment[];
    
    // Approval Chain
    approval_required?: boolean;
    approvers?: LogisticsApprover[];
    
    // GPS Tracking
    gps_logs?: LogisticsGPSLog[];
    
    // Metadata
    created_at: string;
    created_by?: string;
    updated_at: string;
    updated_by?: string;
    deleted_at?: string;
    deleted_by?: string;
}

export interface TaskEvent {
    event_id: string;
    task_id: string;
    
    // Event Details
    event_type: TaskEventType;
    status_from?: string;
    status_to?: string;
    
    // Actor
    actor_id?: string;
    actor_name?: string;
    actor_role?: string;
    
    // Context
    event_data?: any;
    notes?: string;
    
    // GPS
    gps_lat?: number;
    gps_lng?: number;
    gps_accuracy?: number;
    
    // Photos/Attachments
    photo_refs?: Array<{
        id: string;
        url: string;
        thumbnail_url?: string;
        type: string;
    }>;
    
    // Timestamp
    timestamp: string;
}

export interface PODPhoto {
    id: string;
    url: string;
    thumbnail_url?: string;
    type: string;
    caption?: string;
    timestamp: string;
}

export interface PODRecord {
    pod_id: string;
    task_id: string;
    
    // Signature
    signature_img?: string;
    signature_name?: string;
    signature_timestamp?: string;
    
    // Photos
    photos: PODPhoto[];
    photo_count: number;
    
    // GPS Verification
    delivery_gps_lat?: number;
    delivery_gps_lng?: number;
    delivery_gps_accuracy?: number;
    gps_verified?: boolean;
    gps_verification_notes?: string;
    
    // Delivery Details
    delivered_to?: string;
    delivered_to_phone?: string;
    delivery_notes?: string;
    
    // Verification
    verified: boolean;
    verified_by?: string;
    verified_at?: string;
    verification_notes?: string;
    
    // Exceptions
    exception_flag?: boolean;
    exception_reason?: string;
    
    // Timestamps
    created_at: string;
    created_by?: string;
}

export interface Driver {
    driver_id: string;
    user_id?: string;
    
    // Personal Info
    name: string;
    email?: string;
    phone: string;
    employee_id?: string;
    
    // License
    license_number?: string;
    license_class?: string;
    license_expiry?: string;
    
    // Status
    status: DriverStatus;
    availability: boolean;
    
    // Current Assignment
    current_task_id?: string;
    current_location?: {
        lat: number;
        lng: number;
        accuracy: number;
        timestamp: string;
    };
    
    // Stats
    tasks_completed: number;
    tasks_in_progress: number;
    avg_completion_time?: string;
    rating?: number;
    
    // Metadata
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export interface Vehicle {
    vehicle_id: string;
    
    // Vehicle Info
    registration: string;
    make?: string;
    model?: string;
    year?: number;
    vehicle_type: VehicleType;
    
    // Capacity
    max_weight_kg?: number;
    max_volume_m3?: number;
    equipment?: Array<{
        name: string;
        type: string;
        capacity?: number;
    }>;
    
    // Status
    status: VehicleStatus;
    current_driver_id?: string;
    current_location?: {
        lat: number;
        lng: number;
        accuracy: number;
        timestamp: string;
    };
    
    // Maintenance
    last_service_date?: string;
    next_service_date?: string;
    service_notes?: string;
    
    // Stats
    total_tasks: number;
    total_distance_km: number;
    
    // Metadata
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export interface LogisticsConfig {
    config_id: string;
    config_key: string;
    config_value: any;
    config_type: 'request_type' | 'sla' | 'site_zone' | 'notification_rule' | 'vehicle_type' | 'integration' | 'feature_toggle' | 'other';
    description?: string;
    display_order: number;
    enabled: boolean;
    created_at: string;
    created_by?: string;
    updated_at: string;
    updated_by?: string;
}

export interface ExceptionType {
    exception_id: string;
    code: string;
    name: string;
    description?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    auto_escalate: boolean;
    escalation_delay_minutes?: number;
    resolution_required: boolean;
    enabled: boolean;
    display_order: number;
    created_at: string;
}

export interface SiteZone {
    zone_id: string;
    zone_name: string;
    zone_type: 'delivery_location' | 'pickup_zone' | 'geofence' | 'other';
    gps_center?: {
        lat: number;
        lng: number;
    };
    gps_radius?: number;
    gps_polygon?: Array<{
        lat: number;
        lng: number;
    }>;
    access_requirements?: string;
    contact_person?: string;
    contact_phone?: string;
    enabled: boolean;
    created_at: string;
}

// Logistics User Roles
export type LogisticsUserRole = 'mlc' | 'driver' | 'requester' | 'mc' | 'admin';

export interface LogisticsUser {
    id: string;
    name: string;
    email: string;
    role: LogisticsUserRole;
    phone?: string;
    active: boolean;
}