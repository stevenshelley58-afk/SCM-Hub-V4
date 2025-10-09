/**
 * Logistics Event Publisher
 * Publishes logistics events to Materials app
 */

import { redisStreams, STREAMS } from './redisStreams';
import {
    createEventId,
    createTimestamp,
    type TaskAcceptedEvent,
    type TaskInTransitEvent,
    type TaskDeliveredEvent,
    type TaskExceptionEvent,
} from '../../types/events';
import type { LogisticsTask, Driver, Vehicle, PODRecord } from '../../types';

class LogisticsEventPublisher {
    /**
     * Publish Task Accepted event
     * Called when MLC accepts and assigns task to driver/vehicle
     */
    async publishTaskAccepted(
        task: LogisticsTask,
        driver: Driver,
        vehicle: Vehicle,
        acceptedBy: { id: string; name: string }
    ): Promise<void> {
        if (!task.linked_mrf_id) {
            console.log('Task not linked to MRF, skipping event');
            return;
        }

        const event: TaskAcceptedEvent = {
            event_type: 'task.accepted',
            event_id: createEventId(),
            timestamp: createTimestamp(),
            source: 'logistics',
            version: '1.0',
            data: {
                task_id: task.task_id,
                task_number: task.task_number,
                linked_mrf_id: task.linked_mrf_id,
                driver: {
                    id: driver.driver_id,
                    name: driver.name,
                    phone: driver.phone,
                },
                vehicle: {
                    id: vehicle.vehicle_id,
                    registration: vehicle.registration,
                    type: vehicle.type,
                },
                scheduled_date: task.requested_date,
                estimated_pickup_time: task.requested_date, // Could calculate based on current location
                accepted_by: acceptedBy,
            },
        };

        await redisStreams.publish(STREAMS.TASK_ACCEPTED, event);
        console.log(`✅ Published task.accepted for ${task.task_number}`);
    }

    /**
     * Publish Task In Transit event
     * Called when driver picks up materials
     */
    async publishTaskInTransit(task: LogisticsTask): Promise<void> {
        if (!task.linked_mrf_id) {
            console.log('Task not linked to MRF, skipping event');
            return;
        }

        if (!task.driver || !task.pickup_arrived_at) {
            console.warn('Task missing driver or pickup time');
            return;
        }

        const event: TaskInTransitEvent = {
            event_type: 'task.in_transit',
            event_id: createEventId(),
            timestamp: createTimestamp(),
            source: 'logistics',
            version: '1.0',
            data: {
                task_id: task.task_id,
                task_number: task.task_number,
                linked_mrf_id: task.linked_mrf_id,
                driver: {
                    id: task.driver.driver_id,
                    name: task.driver.name,
                },
                pickup_time: task.pickup_arrived_at,
                pickup_location: task.pickup.location,
                pickup_gps: task.pickup_gps_lat && task.pickup_gps_lng ? {
                    lat: task.pickup_gps_lat,
                    lng: task.pickup_gps_lng,
                } : undefined,
                estimated_delivery_time: this.estimateDeliveryTime(task),
            },
        };

        await redisStreams.publish(STREAMS.TASK_IN_TRANSIT, event);
        console.log(`✅ Published task.in_transit for ${task.task_number}`);
    }

    /**
     * Publish Task Delivered event
     * Called when driver completes delivery with POD
     */
    async publishTaskDelivered(task: LogisticsTask, pod: PODRecord): Promise<void> {
        if (!task.linked_mrf_id) {
            console.log('Task not linked to MRF, skipping event');
            return;
        }

        if (!task.driver || !task.completed_at) {
            console.warn('Task missing driver or completion time');
            return;
        }

        const event: TaskDeliveredEvent = {
            event_type: 'task.delivered',
            event_id: createEventId(),
            timestamp: createTimestamp(),
            source: 'logistics',
            version: '1.0',
            data: {
                task_id: task.task_id,
                task_number: task.task_number,
                linked_mrf_id: task.linked_mrf_id,
                driver: {
                    id: task.driver.driver_id,
                    name: task.driver.name,
                },
                delivery_time: task.completed_at,
                delivery_location: task.dropoff.location,
                delivery_gps: task.dropoff_gps_lat && task.dropoff_gps_lng ? {
                    lat: task.dropoff_gps_lat,
                    lng: task.dropoff_gps_lng,
                } : undefined,
                pod: {
                    pod_id: pod.pod_id,
                    delivered_to: pod.delivered_to,
                    delivered_to_phone: pod.delivered_to_phone,
                    photo_count: pod.photo_count,
                    photo_urls: pod.photos?.map(p => p.url) || [],
                    signature_url: pod.signature_img,
                    notes: pod.delivery_notes,
                },
            },
        };

        await redisStreams.publish(STREAMS.TASK_DELIVERED, event);
        console.log(`✅ Published task.delivered for ${task.task_number}`);
    }

    /**
     * Publish Task Exception event
     * Called when there's an issue with the task
     */
    async publishTaskException(
        task: LogisticsTask,
        exceptionType: 'access_denied' | 'materials_damaged' | 'wrong_location' | 'recipient_unavailable' | 'vehicle_breakdown' | 'other',
        severity: 'critical' | 'high' | 'medium' | 'low',
        description: string,
        details?: {
            location?: string;
            gps?: { lat: number; lng: number };
            photo_urls?: string[];
            suggested_resolution?: string;
        }
    ): Promise<void> {
        if (!task.linked_mrf_id) {
            console.log('Task not linked to MRF, skipping event');
            return;
        }

        if (!task.driver) {
            console.warn('Task missing driver');
            return;
        }

        const event: TaskExceptionEvent = {
            event_type: 'task.exception',
            event_id: createEventId(),
            timestamp: createTimestamp(),
            source: 'logistics',
            version: '1.0',
            data: {
                task_id: task.task_id,
                task_number: task.task_number,
                linked_mrf_id: task.linked_mrf_id,
                exception_type: exceptionType,
                severity,
                description,
                driver: {
                    id: task.driver.driver_id,
                    name: task.driver.name,
                },
                location: details?.location,
                gps: details?.gps,
                photo_urls: details?.photo_urls,
                requires_action: severity === 'critical' || severity === 'high',
                suggested_resolution: details?.suggested_resolution,
            },
        };

        await redisStreams.publish(STREAMS.TASK_EXCEPTION, event);
        console.log(`✅ Published task.exception for ${task.task_number}`);
    }

    /**
     * Estimate delivery time based on current time and typical duration
     */
    private estimateDeliveryTime(task: LogisticsTask): string | undefined {
        // Simple estimation: add 1 hour to current time
        // In production, this would use routing APIs and real-time traffic
        const now = new Date();
        const estimated = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
        return estimated.toISOString();
    }
}

export const logisticsEventPublisher = new LogisticsEventPublisher();

