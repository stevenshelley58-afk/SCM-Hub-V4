/**
 * Logistics Driver Service
 * Handles driver management operations
 */

import { supabase } from '../supabaseClient';
import type { Driver, DriverStatus } from '../../types';

export interface CreateDriverInput {
    name: string;
    email?: string;
    phone: string;
    employee_id?: string;
    license_number?: string;
    license_class?: string;
    license_expiry?: string;
    status?: DriverStatus;
}

export interface UpdateDriverInput {
    driver_id: string;
    name?: string;
    email?: string;
    phone?: string;
    license_number?: string;
    license_class?: string;
    license_expiry?: string;
    status?: DriverStatus;
    availability?: boolean;
}

export interface UpdateDriverLocationInput {
    driver_id: string;
    lat: number;
    lng: number;
    accuracy: number;
}

class DriverService {
    /**
     * Create a new driver
     */
    async createDriver(input: CreateDriverInput): Promise<Driver> {
        try {
            const { data, error } = await supabase
                .from('drivers')
                .insert({
                    name: input.name,
                    email: input.email,
                    phone: input.phone,
                    employee_id: input.employee_id,
                    license_number: input.license_number,
                    license_class: input.license_class,
                    license_expiry: input.license_expiry,
                    status: input.status || 'active',
                    availability: true,
                    tasks_completed: 0,
                    tasks_in_progress: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating driver:', error);
            throw error;
        }
    }

    /**
     * Get driver by ID
     */
    async getDriverById(driverId: string): Promise<Driver | null> {
        try {
            const { data, error } = await supabase
                .from('drivers')
                .select('*')
                .eq('driver_id', driverId)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching driver:', error);
            return null;
        }
    }

    /**
     * List all drivers
     */
    async listDrivers(activeOnly: boolean = false): Promise<Driver[]> {
        try {
            let query = supabase
                .from('drivers')
                .select('*')
                .is('deleted_at', null)
                .order('name', { ascending: true });

            if (activeOnly) {
                query = query.eq('status', 'active');
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error listing drivers:', error);
            return [];
        }
    }

    /**
     * Get available drivers (active, available, not assigned)
     */
    async getAvailableDrivers(): Promise<Driver[]> {
        try {
            const { data, error } = await supabase
                .from('drivers')
                .select('*')
                .eq('status', 'active')
                .eq('availability', true)
                .is('current_task_id', null)
                .is('deleted_at', null)
                .order('name', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching available drivers:', error);
            return [];
        }
    }

    /**
     * Update driver
     */
    async updateDriver(input: UpdateDriverInput): Promise<Driver | null> {
        try {
            const { driver_id, ...updates } = input;

            const { data, error } = await supabase
                .from('drivers')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('driver_id', driver_id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating driver:', error);
            return null;
        }
    }

    /**
     * Update driver location
     */
    async updateDriverLocation(input: UpdateDriverLocationInput): Promise<boolean> {
        try {
            const { driver_id, lat, lng, accuracy } = input;

            const { error } = await supabase
                .from('drivers')
                .update({
                    current_location: {
                        lat,
                        lng,
                        accuracy,
                        timestamp: new Date().toISOString(),
                    },
                    updated_at: new Date().toISOString(),
                })
                .eq('driver_id', driver_id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating driver location:', error);
            return false;
        }
    }

    /**
     * Set driver availability
     */
    async setDriverAvailability(
        driverId: string,
        available: boolean
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('drivers')
                .update({
                    availability: available,
                    updated_at: new Date().toISOString(),
                })
                .eq('driver_id', driverId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error setting driver availability:', error);
            return false;
        }
    }

    /**
     * Get driver's current task
     */
    async getDriverCurrentTask(driverId: string): Promise<any | null> {
        try {
            const { data, error } = await supabase
                .from('drivers')
                .select(`
                    current_task:logistics_tasks(*)
                `)
                .eq('driver_id', driverId)
                .single();

            if (error) throw error;
            return data?.current_task || null;
        } catch (error) {
            console.error('Error fetching driver current task:', error);
            return null;
        }
    }

    /**
     * Get driver statistics
     */
    async getDriverStats(driverId: string): Promise<{
        tasks_completed: number;
        tasks_in_progress: number;
        rating: number;
        avg_completion_time: string;
    } | null> {
        try {
            const { data, error } = await supabase
                .from('drivers')
                .select('tasks_completed, tasks_in_progress, rating, avg_completion_time')
                .eq('driver_id', driverId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching driver stats:', error);
            return null;
        }
    }

    /**
     * Soft delete driver
     */
    async deleteDriver(driverId: string): Promise<boolean> {
        try {
            // Check if driver has active tasks
            const { data: activeTasks } = await supabase
                .from('logistics_tasks')
                .select('task_id')
                .eq('driver_id', driverId)
                .in('status', ['new', 'scheduled', 'in_progress']);

            if (activeTasks && activeTasks.length > 0) {
                throw new Error('Cannot delete driver with active tasks');
            }

            const { error } = await supabase
                .from('drivers')
                .update({
                    deleted_at: new Date().toISOString(),
                    status: 'inactive',
                })
                .eq('driver_id', driverId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting driver:', error);
            throw error;
        }
    }
}

export const driverService = new DriverService();

