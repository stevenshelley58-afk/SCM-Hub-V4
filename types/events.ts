/**
 * Event Schema Definitions
 * Type-safe event contracts for Materials <-> Logistics integration
 */

// ====================================
// Materials -> Logistics Events
// ====================================

/**
 * MRF Ready for Collection
 * Sent when P1 approves MRF and it's ready for logistics to collect
 */
export interface MRFReadyForCollectionEvent {
    event_type: 'mrf.ready_for_collection';
    event_id: string;
    timestamp: string;
    source: 'materials';
    version: '1.0';
    data: {
        mrf_id: string;
        mrf_number: string;
        priority: 'critical' | 'high' | 'normal' | 'low';
        requester: {
            id: string;
            name: string;
            department: string;
            phone?: string;
            email?: string;
        };
        pickup: {
            location: string;
            site_id?: string;
            contact?: string;
            phone?: string;
            access_notes?: string;
        };
        delivery: {
            location: string;
            site_id?: string;
            contact?: string;
            phone?: string;
            access_notes?: string;
        };
        materials: Array<{
            material_id: string;
            description: string;
            qty: number;
            unit: string;
        }>;
        requested_date: string;
        special_instructions?: string;
    };
}

/**
 * MRF Updated
 * Sent when MRF details change that affect logistics
 */
export interface MRFUpdatedEvent {
    event_type: 'mrf.updated';
    event_id: string;
    timestamp: string;
    source: 'materials';
    version: '1.0';
    data: {
        mrf_id: string;
        mrf_number: string;
        logistics_task_id?: string; // If task already created
        updates: {
            priority?: 'critical' | 'high' | 'normal' | 'low';
            requested_date?: string;
            pickup_location?: string;
            delivery_location?: string;
            special_instructions?: string;
        };
        reason: string;
    };
}

/**
 * MRF Cancelled
 * Sent when MRF is cancelled
 */
export interface MRFCancelledEvent {
    event_type: 'mrf.cancelled';
    event_id: string;
    timestamp: string;
    source: 'materials';
    version: '1.0';
    data: {
        mrf_id: string;
        mrf_number: string;
        logistics_task_id?: string;
        reason: string;
        cancelled_by: {
            id: string;
            name: string;
        };
    };
}

/**
 * MRF On Hold
 * Sent when MRF is put on hold
 */
export interface MRFOnHoldEvent {
    event_type: 'mrf.on_hold';
    event_id: string;
    timestamp: string;
    source: 'materials';
    version: '1.0';
    data: {
        mrf_id: string;
        mrf_number: string;
        logistics_task_id?: string;
        reason: string;
        hold_by: {
            id: string;
            name: string;
        };
    };
}

// ====================================
// Logistics -> Materials Events
// ====================================

/**
 * Task Accepted
 * Sent when MLC accepts and schedules the logistics task
 */
export interface TaskAcceptedEvent {
    event_type: 'task.accepted';
    event_id: string;
    timestamp: string;
    source: 'logistics';
    version: '1.0';
    data: {
        task_id: string;
        task_number: string;
        linked_mrf_id: string;
        driver: {
            id: string;
            name: string;
            phone?: string;
        };
        vehicle: {
            id: string;
            registration: string;
            type: string;
        };
        scheduled_date: string;
        estimated_pickup_time?: string;
        estimated_delivery_time?: string;
        accepted_by: {
            id: string;
            name: string;
        };
    };
}

/**
 * Task In Transit
 * Sent when driver picks up materials and starts transit
 */
export interface TaskInTransitEvent {
    event_type: 'task.in_transit';
    event_id: string;
    timestamp: string;
    source: 'logistics';
    version: '1.0';
    data: {
        task_id: string;
        task_number: string;
        linked_mrf_id: string;
        driver: {
            id: string;
            name: string;
        };
        pickup_time: string;
        pickup_location: string;
        pickup_gps?: {
            lat: number;
            lng: number;
        };
        estimated_delivery_time?: string;
    };
}

/**
 * Task Delivered
 * Sent when materials are delivered with POD
 */
export interface TaskDeliveredEvent {
    event_type: 'task.delivered';
    event_id: string;
    timestamp: string;
    source: 'logistics';
    version: '1.0';
    data: {
        task_id: string;
        task_number: string;
        linked_mrf_id: string;
        driver: {
            id: string;
            name: string;
        };
        delivery_time: string;
        delivery_location: string;
        delivery_gps?: {
            lat: number;
            lng: number;
        };
        pod: {
            pod_id: string;
            delivered_to: string;
            delivered_to_phone?: string;
            photo_count: number;
            photo_urls: string[];
            signature_url?: string;
            notes?: string;
        };
    };
}

/**
 * Task Exception
 * Sent when there's an issue with the task
 */
export interface TaskExceptionEvent {
    event_type: 'task.exception';
    event_id: string;
    timestamp: string;
    source: 'logistics';
    version: '1.0';
    data: {
        task_id: string;
        task_number: string;
        linked_mrf_id: string;
        exception_type: 'access_denied' | 'materials_damaged' | 'wrong_location' | 'recipient_unavailable' | 'vehicle_breakdown' | 'other';
        severity: 'critical' | 'high' | 'medium' | 'low';
        description: string;
        driver: {
            id: string;
            name: string;
        };
        location?: string;
        gps?: {
            lat: number;
            lng: number;
        };
        photo_urls?: string[];
        requires_action: boolean;
        suggested_resolution?: string;
    };
}

// ====================================
// Union Types
// ====================================

export type MaterialsEvent =
    | MRFReadyForCollectionEvent
    | MRFUpdatedEvent
    | MRFCancelledEvent
    | MRFOnHoldEvent;

export type LogisticsEvent =
    | TaskAcceptedEvent
    | TaskInTransitEvent
    | TaskDeliveredEvent
    | TaskExceptionEvent;

export type IntegrationEvent = MaterialsEvent | LogisticsEvent;

// ====================================
// Event Helpers
// ====================================

export const createEventId = (): string => {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createTimestamp = (): string => {
    return new Date().toISOString();
};

export const isMaterielsEvent = (event: IntegrationEvent): event is MaterialsEvent => {
    return event.source === 'materials';
};

export const isLogisticsEvent = (event: IntegrationEvent): event is LogisticsEvent => {
    return event.source === 'logistics';
};

