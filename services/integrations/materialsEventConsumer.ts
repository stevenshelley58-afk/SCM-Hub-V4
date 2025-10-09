/**
 * Materials Event Consumer
 * Consumes events from Materials app and takes appropriate action
 */

import { redisStreams, STREAMS } from './redisStreams';
import { taskService } from '../logistics/taskService';
import type {
    MaterialsEvent,
    MRFReadyForCollectionEvent,
    MRFUpdatedEvent,
    MRFCancelledEvent,
    MRFOnHoldEvent,
} from '../../types/events';
import type { LogisticsTask } from '../../types';

class MaterialsEventConsumer {
    private isRunning = false;
    private unsubscribers: Array<() => void> = [];

    /**
     * Start consuming Materials events
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            console.warn('Materials event consumer already running');
            return;
        }

        console.log('🚀 Starting Materials event consumer...');
        this.isRunning = true;

        // Subscribe to all Materials streams
        await this.subscribeToReadyForCollection();
        await this.subscribeToUpdated();
        await this.subscribeToCancelled();
        await this.subscribeToOnHold();

        console.log('✅ Materials event consumer started');
    }

    /**
     * Stop consuming events
     */
    stop(): void {
        console.log('⏹️ Stopping Materials event consumer...');
        
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers = [];
        this.isRunning = false;

        console.log('✅ Materials event consumer stopped');
    }

    /**
     * Subscribe to MRF Ready for Collection events
     */
    private async subscribeToReadyForCollection(): Promise<void> {
        const unsubscribe = await redisStreams.subscribe(
            STREAMS.MRF_READY_FOR_COLLECTION,
            'logistics',
            'auto-task-creator',
            async (message) => {
                try {
                    const event = message.data as MRFReadyForCollectionEvent;
                    await this.handleReadyForCollection(event);
                } catch (error) {
                    console.error('Error handling ready_for_collection event:', error);
                }
            }
        );

        this.unsubscribers.push(unsubscribe);
    }

    /**
     * Subscribe to MRF Updated events
     */
    private async subscribeToUpdated(): Promise<void> {
        const unsubscribe = await redisStreams.subscribe(
            STREAMS.MRF_UPDATED,
            'logistics',
            'task-updater',
            async (message) => {
                try {
                    const event = message.data as MRFUpdatedEvent;
                    await this.handleUpdated(event);
                } catch (error) {
                    console.error('Error handling updated event:', error);
                }
            }
        );

        this.unsubscribers.push(unsubscribe);
    }

    /**
     * Subscribe to MRF Cancelled events
     */
    private async subscribeToCancelled(): Promise<void> {
        const unsubscribe = await redisStreams.subscribe(
            STREAMS.MRF_CANCELLED,
            'logistics',
            'task-canceller',
            async (message) => {
                try {
                    const event = message.data as MRFCancelledEvent;
                    await this.handleCancelled(event);
                } catch (error) {
                    console.error('Error handling cancelled event:', error);
                }
            }
        );

        this.unsubscribers.push(unsubscribe);
    }

    /**
     * Subscribe to MRF On Hold events
     */
    private async subscribeToOnHold(): Promise<void> {
        const unsubscribe = await redisStreams.subscribe(
            STREAMS.MRF_ON_HOLD,
            'logistics',
            'task-holder',
            async (message) => {
                try {
                    const event = message.data as MRFOnHoldEvent;
                    await this.handleOnHold(event);
                } catch (error) {
                    console.error('Error handling on_hold event:', error);
                }
            }
        );

        this.unsubscribers.push(unsubscribe);
    }

    /**
     * Handle MRF Ready for Collection event
     * Creates a new logistics task
     */
    private async handleReadyForCollection(event: MRFReadyForCollectionEvent): Promise<void> {
        console.log(`📦 MRF ${event.data.mrf_number} ready for collection - creating task...`);

        try {
            // Create logistics task from MRF
            const task = await taskService.createTask({
                type: 'delivery',
                priority: event.data.priority,
                description: `Collect and deliver materials for MRF ${event.data.mrf_number}`,
                requester: {
                    name: event.data.requester.name,
                    department: event.data.requester.department,
                    phone: event.data.requester.phone,
                    email: event.data.requester.email,
                },
                pickup: {
                    location: event.data.pickup.location,
                    contact: event.data.pickup.contact,
                    phone: event.data.pickup.phone,
                    access_notes: event.data.pickup.access_notes,
                },
                dropoff: {
                    location: event.data.delivery.location,
                    contact: event.data.delivery.contact,
                    phone: event.data.delivery.phone,
                    access_notes: event.data.delivery.access_notes,
                },
                load_info: {
                    description: event.data.materials.map(m => `${m.qty} ${m.unit} ${m.description}`).join(', '),
                    qty: event.data.materials.reduce((sum, m) => sum + m.qty, 0),
                },
                requested_date: event.data.requested_date,
                special_instructions: event.data.special_instructions,
                linked_mrf_id: event.data.mrf_id,
            });

            console.log(`✅ Created logistics task ${task.task_number} for MRF ${event.data.mrf_number}`);

            // Store MRF-Task mapping
            this.storeMRFTaskMapping(event.data.mrf_id, task.task_id);
        } catch (error: any) {
            console.error(`❌ Failed to create task for MRF ${event.data.mrf_number}:`, error);
            throw error;
        }
    }

    /**
     * Handle MRF Updated event
     * Updates existing logistics task
     */
    private async handleUpdated(event: MRFUpdatedEvent): Promise<void> {
        console.log(`🔄 MRF ${event.data.mrf_number} updated - updating task...`);

        try {
            // Find existing task
            const taskId = event.data.logistics_task_id || this.getMRFTaskMapping(event.data.mrf_id);
            
            if (!taskId) {
                console.warn(`No task found for MRF ${event.data.mrf_id}`);
                return;
            }

            // Update task
            await taskService.updateTask(taskId, {
                priority: event.data.updates.priority,
                requested_date: event.data.updates.requested_date,
                special_instructions: event.data.updates.special_instructions,
            });

            console.log(`✅ Updated task ${taskId} for MRF ${event.data.mrf_number}`);
        } catch (error: any) {
            console.error(`❌ Failed to update task for MRF ${event.data.mrf_number}:`, error);
        }
    }

    /**
     * Handle MRF Cancelled event
     * Cancels logistics task
     */
    private async handleCancelled(event: MRFCancelledEvent): Promise<void> {
        console.log(`❌ MRF ${event.data.mrf_number} cancelled - cancelling task...`);

        try {
            const taskId = event.data.logistics_task_id || this.getMRFTaskMapping(event.data.mrf_id);
            
            if (!taskId) {
                console.warn(`No task found for MRF ${event.data.mrf_id}`);
                return;
            }

            // Cancel task (set status to cancelled)
            await taskService.updateTask(taskId, {
                status: 'cancelled',
            });

            console.log(`✅ Cancelled task ${taskId} for MRF ${event.data.mrf_number}`);
        } catch (error: any) {
            console.error(`❌ Failed to cancel task for MRF ${event.data.mrf_number}:`, error);
        }
    }

    /**
     * Handle MRF On Hold event
     * Puts logistics task on hold
     */
    private async handleOnHold(event: MRFOnHoldEvent): Promise<void> {
        console.log(`⏸️ MRF ${event.data.mrf_number} on hold - holding task...`);

        try {
            const taskId = event.data.logistics_task_id || this.getMRFTaskMapping(event.data.mrf_id);
            
            if (!taskId) {
                console.warn(`No task found for MRF ${event.data.mrf_id}`);
                return;
            }

            // Put task on hold
            await taskService.updateTask(taskId, {
                status: 'on_hold',
            });

            console.log(`✅ Put task ${taskId} on hold for MRF ${event.data.mrf_number}`);
        } catch (error: any) {
            console.error(`❌ Failed to put task on hold for MRF ${event.data.mrf_number}:`, error);
        }
    }

    /**
     * Store MRF-Task mapping in localStorage
     */
    private storeMRFTaskMapping(mrfId: string, taskId: string): void {
        try {
            const mappings = this.loadMRFTaskMappings();
            mappings[mrfId] = taskId;
            localStorage.setItem('mrf_task_mappings', JSON.stringify(mappings));
        } catch (error) {
            console.error('Error storing MRF-Task mapping:', error);
        }
    }

    /**
     * Get Task ID for MRF
     */
    private getMRFTaskMapping(mrfId: string): string | null {
        const mappings = this.loadMRFTaskMappings();
        return mappings[mrfId] || null;
    }

    /**
     * Load all MRF-Task mappings
     */
    private loadMRFTaskMappings(): Record<string, string> {
        try {
            const stored = localStorage.getItem('mrf_task_mappings');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading MRF-Task mappings:', error);
            return {};
        }
    }

    /**
     * Get consumer stats
     */
    getStats(): {
        running: boolean;
        subscribedStreams: number;
    } {
        return {
            running: this.isRunning,
            subscribedStreams: this.unsubscribers.length,
        };
    }
}

export const materialsEventConsumer = new MaterialsEventConsumer();

