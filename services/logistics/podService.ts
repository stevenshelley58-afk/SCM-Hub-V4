/**
 * Logistics POD (Proof of Delivery) Service
 * Handles POD capture, verification, and storage
 */

import { supabase } from '../supabaseClient';
import { logisticsEventPublisher } from '../integrations/logisticsEventPublisher';
import { taskService } from './taskService';
import type { PODRecord, PODPhoto } from '../../types';

export interface CreatePODInput {
    task_id: string;
    photos: File[] | PODPhoto[];
    signature_img?: string;
    signature_name?: string;
    delivered_to?: string;
    delivered_to_phone?: string;
    delivery_notes?: string;
    delivery_gps_lat?: number;
    delivery_gps_lng?: number;
    delivery_gps_accuracy?: number;
}

export interface VerifyPODInput {
    pod_id: string;
    verified_by: string;
    verification_notes?: string;
}

class PODService {
    /**
     * Upload POD photo to storage
     */
    async uploadPhoto(file: File, taskId: string): Promise<string> {
        try {
            const timestamp = Date.now();
            const filename = `pod-photos/${taskId}/${timestamp}-${file.name}`;

            const { data, error } = await supabase.storage
                .from('logistics-pod')
                .upload(filename, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (error) throw error;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('logistics-pod')
                .getPublicUrl(filename);

            return urlData.publicUrl;
        } catch (error) {
            console.error('Error uploading photo:', error);
            throw error;
        }
    }

    /**
     * Upload signature image to storage
     */
    async uploadSignature(base64Signature: string, taskId: string): Promise<string> {
        try {
            const timestamp = Date.now();
            const filename = `pod-signatures/${taskId}/${timestamp}.png`;

            // Convert base64 to blob
            const blob = this.base64ToBlob(base64Signature);

            const { data, error } = await supabase.storage
                .from('logistics-pod')
                .upload(filename, blob, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: 'image/png',
                });

            if (error) throw error;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('logistics-pod')
                .getPublicUrl(filename);

            return urlData.publicUrl;
        } catch (error) {
            console.error('Error uploading signature:', error);
            throw error;
        }
    }

    /**
     * Create POD record
     */
    async createPOD(input: CreatePODInput): Promise<PODRecord> {
        try {
            // Upload photos
            const photoUrls: PODPhoto[] = [];
            for (const photo of input.photos) {
                if (photo instanceof File) {
                    const url = await this.uploadPhoto(photo, input.task_id);
                    photoUrls.push({
                        id: `${Date.now()}-${Math.random()}`,
                        url,
                        thumbnail_url: url, // TODO: Generate thumbnail
                        type: 'delivery',
                        caption: photo.name,
                        timestamp: new Date().toISOString(),
                    });
                } else {
                    photoUrls.push(photo);
                }
            }

            // Upload signature if provided
            let signature_url: string | undefined;
            if (input.signature_img) {
                signature_url = await this.uploadSignature(
                    input.signature_img,
                    input.task_id
                );
            }

            // Verify GPS if provided
            let gps_verified = false;
            if (input.delivery_gps_lat && input.delivery_gps_lng) {
                gps_verified = await this.verifyGPSLocation(
                    input.delivery_gps_lat,
                    input.delivery_gps_lng
                );
            }

            // Create POD record
            const { data, error } = await supabase
                .from('pod_records')
                .insert({
                    task_id: input.task_id,
                    signature_img: signature_url || input.signature_img,
                    signature_name: input.signature_name,
                    signature_timestamp: input.signature_img
                        ? new Date().toISOString()
                        : undefined,
                    photos: photoUrls,
                    photo_count: photoUrls.length,
                    delivery_gps_lat: input.delivery_gps_lat,
                    delivery_gps_lng: input.delivery_gps_lng,
                    delivery_gps_accuracy: input.delivery_gps_accuracy,
                    gps_verified,
                    delivered_to: input.delivered_to,
                    delivered_to_phone: input.delivered_to_phone,
                    delivery_notes: input.delivery_notes,
                    verified: false,
                    exception_flag: photoUrls.length === 0,
                    exception_reason:
                        photoUrls.length === 0 ? 'No photos captured' : undefined,
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            // Update task with POD reference
            await supabase
                .from('logistics_tasks')
                .update({
                    pod_id: data.pod_id,
                    updated_at: new Date().toISOString(),
                })
                .eq('task_id', input.task_id);

            // Create task event
            await supabase.from('task_events').insert({
                task_id: input.task_id,
                event_type: 'completed',
                notes: 'POD captured',
                gps_lat: input.delivery_gps_lat,
                gps_lng: input.delivery_gps_lng,
                gps_accuracy: input.delivery_gps_accuracy,
                photo_refs: photoUrls,
                timestamp: new Date().toISOString(),
            });

            // Publish delivered event to Materials app if linked to MRF
            const task = await taskService.getTask(input.task_id);
            if (task && task.linked_mrf_id) {
                await logisticsEventPublisher.publishTaskDelivered(task, data);
            }

            // Check for warnings and notify if needed
            const warnings = this.validatePOD(data);
            if (warnings.length > 0) {
                await this.notifyPODWarnings(input.task_id, warnings);
            }

            return data;
        } catch (error) {
            console.error('Error creating POD:', error);
            throw error;
        }
    }

    /**
     * Get POD by ID
     */
    async getPODById(podId: string): Promise<PODRecord | null> {
        try {
            const { data, error } = await supabase
                .from('pod_records')
                .select('*')
                .eq('pod_id', podId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching POD:', error);
            return null;
        }
    }

    /**
     * Get POD by task ID
     */
    async getPODByTaskId(taskId: string): Promise<PODRecord | null> {
        try {
            const { data, error } = await supabase
                .from('pod_records')
                .select('*')
                .eq('task_id', taskId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching POD by task ID:', error);
            return null;
        }
    }

    /**
     * Verify POD (MLC verification)
     */
    async verifyPOD(input: VerifyPODInput): Promise<PODRecord | null> {
        try {
            const { data, error } = await supabase
                .from('pod_records')
                .update({
                    verified: true,
                    verified_by: input.verified_by,
                    verified_at: new Date().toISOString(),
                    verification_notes: input.verification_notes,
                })
                .eq('pod_id', input.pod_id)
                .select()
                .single();

            if (error) throw error;

            // Update task status to verified
            await supabase
                .from('logistics_tasks')
                .update({
                    status: 'verified',
                    verified_at: new Date().toISOString(),
                    verified_by: input.verified_by,
                })
                .eq('pod_id', input.pod_id);

            return data;
        } catch (error) {
            console.error('Error verifying POD:', error);
            return null;
        }
    }

    /**
     * List unverified PODs
     */
    async listUnverifiedPODs(): Promise<PODRecord[]> {
        try {
            const { data, error } = await supabase
                .from('pod_records')
                .select('*')
                .eq('verified', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error listing unverified PODs:', error);
            return [];
        }
    }

    /**
     * Validate POD and return warnings
     */
    private validatePOD(pod: PODRecord): string[] {
        const warnings: string[] = [];

        // Check photos
        if (pod.photo_count === 0) {
            warnings.push('No photos captured');
        }

        // Check signature (optional, but warn if missing)
        if (!pod.signature_img) {
            warnings.push('No signature captured');
        }

        // Check GPS
        if (!pod.delivery_gps_lat || !pod.delivery_gps_lng) {
            warnings.push('GPS location not available');
        } else if (!pod.gps_verified) {
            warnings.push('GPS location outside expected site radius');
        }

        // Check delivered_to
        if (!pod.delivered_to || pod.delivered_to.trim() === '') {
            warnings.push('Receiver name not provided');
        }

        return warnings;
    }

    /**
     * Verify GPS location is within site radius
     */
    private async verifyGPSLocation(lat: number, lng: number): Promise<boolean> {
        try {
            // Get site zones from config
            const { data: zones } = await supabase
                .from('site_zones')
                .select('*')
                .eq('enabled', true);

            if (!zones || zones.length === 0) {
                // No zones configured, accept any location
                return true;
            }

            // Check if within any zone
            for (const zone of zones) {
                if (zone.gps_center && zone.gps_radius) {
                    const distance = this.calculateDistance(
                        lat,
                        lng,
                        zone.gps_center.lat,
                        zone.gps_center.lng
                    );
                    if (distance <= zone.gps_radius) {
                        return true;
                    }
                }
            }

            return false;
        } catch (error) {
            console.error('Error verifying GPS location:', error);
            return false;
        }
    }

    /**
     * Calculate distance between two GPS points (Haversine formula)
     */
    private calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371e3; // Earth radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Convert base64 to blob
     */
    private base64ToBlob(base64: string): Blob {
        const byteString = atob(base64.split(',')[1]);
        const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    }

    /**
     * Notify MLC/MC of POD warnings
     */
    private async notifyPODWarnings(taskId: string, warnings: string[]): Promise<void> {
        try {
            // TODO: Implement notification service
            console.log(`POD warnings for task ${taskId}:`, warnings);
            // This would integrate with notificationService
        } catch (error) {
            console.error('Error sending POD warnings:', error);
        }
    }
}

export const podService = new PODService();

