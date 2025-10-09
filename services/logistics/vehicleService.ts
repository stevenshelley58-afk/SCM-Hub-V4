/**
 * Logistics Vehicle Service
 * Handles vehicle fleet management operations
 */

import { supabase } from '../supabaseClient';
import type { Vehicle, VehicleType, VehicleStatus } from '../../types';

export interface CreateVehicleInput {
    registration: string;
    make?: string;
    model?: string;
    year?: number;
    vehicle_type: VehicleType;
    max_weight_kg?: number;
    max_volume_m3?: number;
    equipment?: Array<{
        name: string;
        type: string;
        capacity?: number;
    }>;
}

export interface UpdateVehicleInput {
    vehicle_id: string;
    registration?: string;
    make?: string;
    model?: string;
    year?: number;
    vehicle_type?: VehicleType;
    status?: VehicleStatus;
    max_weight_kg?: number;
    max_volume_m3?: number;
    equipment?: Array<{
        name: string;
        type: string;
        capacity?: number;
    }>;
    last_service_date?: string;
    next_service_date?: string;
    service_notes?: string;
}

class VehicleService {
    /**
     * Create a new vehicle
     */
    async createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .insert({
                    registration: input.registration,
                    make: input.make,
                    model: input.model,
                    year: input.year,
                    vehicle_type: input.vehicle_type,
                    max_weight_kg: input.max_weight_kg,
                    max_volume_m3: input.max_volume_m3,
                    equipment: input.equipment,
                    status: 'available',
                    total_tasks: 0,
                    total_distance_km: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating vehicle:', error);
            throw error;
        }
    }

    /**
     * Get vehicle by ID
     */
    async getVehicleById(vehicleId: string): Promise<Vehicle | null> {
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('vehicle_id', vehicleId)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching vehicle:', error);
            return null;
        }
    }

    /**
     * List all vehicles
     */
    async listVehicles(availableOnly: boolean = false): Promise<Vehicle[]> {
        try {
            let query = supabase
                .from('vehicles')
                .select('*')
                .is('deleted_at', null)
                .order('registration', { ascending: true });

            if (availableOnly) {
                query = query.eq('status', 'available');
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error listing vehicles:', error);
            return [];
        }
    }

    /**
     * Get available vehicles
     */
    async getAvailableVehicles(vehicleType?: VehicleType): Promise<Vehicle[]> {
        try {
            let query = supabase
                .from('vehicles')
                .select('*')
                .eq('status', 'available')
                .is('deleted_at', null)
                .order('registration', { ascending: true });

            if (vehicleType) {
                query = query.eq('vehicle_type', vehicleType);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching available vehicles:', error);
            return [];
        }
    }

    /**
     * Update vehicle
     */
    async updateVehicle(input: UpdateVehicleInput): Promise<Vehicle | null> {
        try {
            const { vehicle_id, ...updates } = input;

            const { data, error } = await supabase
                .from('vehicles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('vehicle_id', vehicle_id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating vehicle:', error);
            return null;
        }
    }

    /**
     * Update vehicle status
     */
    async updateVehicleStatus(
        vehicleId: string,
        status: VehicleStatus
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('vehicles')
                .update({
                    status,
                    updated_at: new Date().toISOString(),
                })
                .eq('vehicle_id', vehicleId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating vehicle status:', error);
            return false;
        }
    }

    /**
     * Schedule vehicle maintenance
     */
    async scheduleMainten(
        vehicleId: string,
        nextServiceDate: string,
        notes?: string
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('vehicles')
                .update({
                    next_service_date: nextServiceDate,
                    service_notes: notes,
                    updated_at: new Date().toISOString(),
                })
                .eq('vehicle_id', vehicleId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error scheduling maintenance:', error);
            return false;
        }
    }

    /**
     * Record vehicle service completion
     */
    async recordServiceCompletion(
        vehicleId: string,
        serviceDate: string,
        notes?: string
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('vehicles')
                .update({
                    last_service_date: serviceDate,
                    service_notes: notes,
                    status: 'available',
                    updated_at: new Date().toISOString(),
                })
                .eq('vehicle_id', vehicleId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error recording service completion:', error);
            return false;
        }
    }

    /**
     * Get vehicle statistics
     */
    async getVehicleStats(vehicleId: string): Promise<{
        total_tasks: number;
        total_distance_km: number;
    } | null> {
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('total_tasks, total_distance_km')
                .eq('vehicle_id', vehicleId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching vehicle stats:', error);
            return null;
        }
    }

    /**
     * Get vehicles due for maintenance
     */
    async getVehiclesDueForMaintenance(): Promise<Vehicle[]> {
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .lte('next_service_date', today)
                .is('deleted_at', null)
                .order('next_service_date', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching vehicles due for maintenance:', error);
            return [];
        }
    }

    /**
     * Soft delete vehicle
     */
    async deleteVehicle(vehicleId: string): Promise<boolean> {
        try {
            // Check if vehicle has active tasks
            const { data: activeTasks } = await supabase
                .from('logistics_tasks')
                .select('task_id')
                .eq('vehicle_id', vehicleId)
                .in('status', ['new', 'scheduled', 'in_progress']);

            if (activeTasks && activeTasks.length > 0) {
                throw new Error('Cannot delete vehicle with active tasks');
            }

            const { error } = await supabase
                .from('vehicles')
                .update({
                    deleted_at: new Date().toISOString(),
                    status: 'out_of_service',
                })
                .eq('vehicle_id', vehicleId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            throw error;
        }
    }
}

export const vehicleService = new VehicleService();

