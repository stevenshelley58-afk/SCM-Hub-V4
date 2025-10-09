/**
 * Logistics Task Service
 * Handles all CRUD operations for logistics tasks
 */

import { supabase } from '../supabaseClient';
import { logisticsEventPublisher } from '../integrations/logisticsEventPublisher';
import { slaEngine } from '../sla/slaEngine';
import { notificationService } from '../notifications/notificationService';
import type {
    LogisticsTask,
    LogisticsTaskType,
    LogisticsTaskStatus,
    LogisticsTaskPriority,
    LogisticsRequester,
    LogisticsLocation,
    LogisticsLoadInfo,
    TaskEvent
} from '../../types';

export interface CreateTaskInput {
    type: LogisticsTaskType;
    category?: string;
    priority: LogisticsTaskPriority;
    requester: LogisticsRequester;
    description: string;
    special_instructions?: string;
    linked_mrf_id?: string;
    linked_wo_id?: string;
    linked_entity_type?: string;
    linked_entity_id?: string;
    pickup: LogisticsLocation;
    dropoff: LogisticsLocation;
    load_info?: LogisticsLoadInfo;
    requested_date: string;
    requested_time?: string;
    hard_window_flag?: boolean;
}

export interface UpdateTaskInput {
    task_id: string;
    status?: LogisticsTaskStatus;
    status_reason?: string;
    driver_id?: string;
    vehicle_id?: string;
    started_at?: string;
    pickup_arrived_at?: string;
    pickup_completed_at?: string;
    dropoff_arrived_at?: string;
    completed_at?: string;
}

export interface TaskFilters {
    status?: LogisticsTaskStatus;
    type?: LogisticsTaskType;
    priority?: LogisticsTaskPriority;
    driver_id?: string;
    linked_mrf_id?: string;
    from_date?: string;
    to_date?: string;
}

class TaskService {
    /**
     * Create a new logistics task
     */
    async createTask(input: CreateTaskInput): Promise<LogisticsTask> {
        try {
            // Calculate SLA target using SLA engine
            const slaResult = slaEngine.calculateSLATarget({
                type: input.type,
                priority: input.priority,
                created_at: new Date().toISOString(),
                requested_date: input.requested_date,
            });
            const sla_target_at = slaResult.sla_target_at;

            const { data, error } = await supabase
                .from('logistics_tasks')
                .insert({
                    type: input.type,
                    category: input.category,
                    priority: input.priority,
                    requester: input.requester,
                    description: input.description,
                    special_instructions: input.special_instructions,
                    linked_mrf_id: input.linked_mrf_id,
                    linked_wo_id: input.linked_wo_id,
                    linked_entity_type: input.linked_entity_type,
                    linked_entity_id: input.linked_entity_id,
                    pickup: input.pickup,
                    dropoff: input.dropoff,
                    load_info: input.load_info,
                    requested_date: input.requested_date,
                    requested_time: input.requested_time,
                    hard_window_flag: input.hard_window_flag,
                    sla_target_at,
                    status: 'new',
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            // Create audit event
            await this.createEvent({
                task_id: data.task_id,
                event_type: 'created',
                notes: `Task created: ${input.description}`,
            });

            return data;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }

    /**
     * Get task by ID
     */
    async getTaskById(taskId: string): Promise<LogisticsTask | null> {
        try {
            const { data, error } = await supabase
                .from('logistics_tasks')
                .select(`
                    *,
                    driver:drivers(*),
                    vehicle:vehicles(*),
                    pod:pod_records(*)
                `)
                .eq('task_id', taskId)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching task:', error);
            return null;
        }
    }

    /**
     * Get task by task number
     */
    async getTaskByNumber(taskNumber: string): Promise<LogisticsTask | null> {
        try {
            const { data, error } = await supabase
                .from('logistics_tasks')
                .select(`
                    *,
                    driver:drivers(*),
                    vehicle:vehicles(*),
                    pod:pod_records(*)
                `)
                .eq('task_number', taskNumber)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching task by number:', error);
            return null;
        }
    }

    /**
     * List tasks with filters
     */
    async listTasks(filters: TaskFilters = {}): Promise<LogisticsTask[]> {
        try {
            let query = supabase
                .from('logistics_tasks')
                .select(`
                    *,
                    driver:drivers(*),
                    vehicle:vehicles(*)
                `)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.type) {
                query = query.eq('type', filters.type);
            }
            if (filters.priority) {
                query = query.eq('priority', filters.priority);
            }
            if (filters.driver_id) {
                query = query.eq('driver_id', filters.driver_id);
            }
            if (filters.linked_mrf_id) {
                query = query.eq('linked_mrf_id', filters.linked_mrf_id);
            }
            if (filters.from_date) {
                query = query.gte('requested_date', filters.from_date);
            }
            if (filters.to_date) {
                query = query.lte('requested_date', filters.to_date);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error listing tasks:', error);
            return [];
        }
    }

    /**
     * Update task
     */
    async updateTask(input: UpdateTaskInput): Promise<LogisticsTask | null> {
        try {
            const { task_id, ...updates } = input;

            const { data, error } = await supabase
                .from('logistics_tasks')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('task_id', task_id)
                .select()
                .single();

            if (error) throw error;

            // Create audit event for status change
            if (updates.status) {
                await this.createEvent({
                    task_id,
                    event_type: 'status_changed',
                    status_to: updates.status,
                    notes: updates.status_reason,
                });
            }

            return data;
        } catch (error) {
            console.error('Error updating task:', error);
            return null;
        }
    }

    /**
     * Assign driver and vehicle to task
     */
    async assignTask(
        taskId: string,
        driverId: string,
        vehicleId: string
    ): Promise<LogisticsTask | null> {
        try {
            // Check if driver is already assigned to another active task
            const { data: existingTasks } = await supabase
                .from('logistics_tasks')
                .select('task_id')
                .eq('driver_id', driverId)
                .in('status', ['new', 'scheduled', 'in_progress'])
                .is('deleted_at', null);

            if (existingTasks && existingTasks.length > 0) {
                throw new Error('Driver is already assigned to another active task');
            }

            const { data, error } = await supabase
                .from('logistics_tasks')
                .update({
                    driver_id: driverId,
                    vehicle_id: vehicleId,
                    assigned_at: new Date().toISOString(),
                    status: 'scheduled',
                    updated_at: new Date().toISOString(),
                })
                .eq('task_id', taskId)
                .select()
                .single();

            if (error) throw error;

            // Update driver's current task
            await supabase
                .from('drivers')
                .update({
                    current_task_id: taskId,
                    updated_at: new Date().toISOString(),
                })
                .eq('driver_id', driverId);

            // Update vehicle status
            await supabase
                .from('vehicles')
                .update({
                    status: 'in_use',
                    current_driver_id: driverId,
                    updated_at: new Date().toISOString(),
                })
                .eq('vehicle_id', vehicleId);

            // Create audit event
            await this.createEvent({
                task_id: taskId,
                event_type: 'assigned',
                notes: `Task assigned to driver ${driverId} with vehicle ${vehicleId}`,
            });

            // Publish event to Materials app if linked to MRF
            const task = await this.getTask(taskId);
            if (task && task.linked_mrf_id && task.driver && task.vehicle) {
                await logisticsEventPublisher.publishTaskAccepted(
                    task,
                    task.driver,
                    task.vehicle,
                    { id: 'system', name: 'MLC System' }
                );
            }

            // Send notifications
            if (task && task.driver) {
                await notificationService.notifyTaskAssigned(task, task.driver);
            }

            return data;
        } catch (error) {
            console.error('Error assigning task:', error);
            throw error;
        }
    }

    /**
     * Start task (driver begins execution)
     */
    async startTask(taskId: string): Promise<LogisticsTask | null> {
        try {
            const { data, error } = await supabase
                .from('logistics_tasks')
                .update({
                    status: 'in_progress',
                    started_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('task_id', taskId)
                .select()
                .single();

            if (error) throw error;

            await this.createEvent({
                task_id: taskId,
                event_type: 'driver_started',
                status_to: 'in_progress',
            });

            return data;
        } catch (error) {
            console.error('Error starting task:', error);
            return null;
        }
    }

    /**
     * Complete task
     */
    async completeTask(taskId: string): Promise<LogisticsTask | null> {
        try {
            const { data, error } = await supabase
                .from('logistics_tasks')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('task_id', taskId)
                .select()
                .single();

            if (error) throw error;

            // Free up driver and vehicle
            if (data.driver_id) {
                await supabase
                    .from('drivers')
                    .update({
                        current_task_id: null,
                        tasks_completed: data.driver?.tasks_completed + 1 || 1,
                    })
                    .eq('driver_id', data.driver_id);
            }

            if (data.vehicle_id) {
                await supabase
                    .from('vehicles')
                    .update({
                        status: 'available',
                        current_driver_id: null,
                        total_tasks: data.vehicle?.total_tasks + 1 || 1,
                    })
                    .eq('vehicle_id', data.vehicle_id);
            }

            await this.createEvent({
                task_id: taskId,
                event_type: 'completed',
                status_to: 'completed',
            });

            return data;
        } catch (error) {
            console.error('Error completing task:', error);
            return null;
        }
    }

    /**
     * Cancel task
     */
    async cancelTask(taskId: string, reason: string): Promise<LogisticsTask | null> {
        try {
            const { data, error } = await supabase
                .from('logistics_tasks')
                .update({
                    status: 'cancelled',
                    status_reason: reason,
                    updated_at: new Date().toISOString(),
                })
                .eq('task_id', taskId)
                .select()
                .single();

            if (error) throw error;

            // Free up driver and vehicle
            if (data.driver_id) {
                await supabase
                    .from('drivers')
                    .update({ current_task_id: null })
                    .eq('driver_id', data.driver_id);
            }

            if (data.vehicle_id) {
                await supabase
                    .from('vehicles')
                    .update({
                        status: 'available',
                        current_driver_id: null,
                    })
                    .eq('vehicle_id', data.vehicle_id);
            }

            await this.createEvent({
                task_id: taskId,
                event_type: 'cancelled',
                status_to: 'cancelled',
                notes: reason,
            });

            return data;
        } catch (error) {
            console.error('Error cancelling task:', error);
            return null;
        }
    }

    /**
     * Get task events (audit log)
     */
    async getTaskEvents(taskId: string): Promise<TaskEvent[]> {
        try {
            const { data, error } = await supabase
                .from('task_events')
                .select('*')
                .eq('task_id', taskId)
                .order('timestamp', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching task events:', error);
            return [];
        }
    }

    /**
     * Create task event
     */
    private async createEvent(event: Partial<TaskEvent>): Promise<void> {
        try {
            await supabase.from('task_events').insert({
                ...event,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Error creating task event:', error);
        }
    }

    /**
     * Calculate SLA target based on priority
     */
    private calculateSLATarget(requestedDate: string, priority: LogisticsTaskPriority): string {
        const date = new Date(requestedDate);
        
        // SLA hours based on priority
        const slaHours: Record<LogisticsTaskPriority, number> = {
            critical: 2,
            high: 4,
            normal: 24,
            low: 48,
        };

        const hours = slaHours[priority];
        date.setHours(date.getHours() - hours);

        return date.toISOString();
    }

    /**
     * Soft delete task
     */
    async deleteTask(taskId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('logistics_tasks')
                .update({
                    deleted_at: new Date().toISOString(),
                })
                .eq('task_id', taskId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting task:', error);
            return false;
        }
    }
}

export const taskService = new TaskService();

