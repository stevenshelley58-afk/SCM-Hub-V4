/**
 * Create Task Modal
 * Form for MLC to create new logistics tasks
 */

import React, { useState } from 'react';
import type { LogisticsTaskType, LogisticsTaskPriority } from '../../types';
import { taskService } from '../../services/logistics/taskService';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskCreated: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onTaskCreated }) => {
    const [formData, setFormData] = useState({
        type: 'delivery' as LogisticsTaskType,
        priority: 'normal' as LogisticsTaskPriority,
        description: '',
        requester_name: '',
        requester_department: '',
        requester_phone: '',
        requester_email: '',
        pickup_location: '',
        pickup_contact: '',
        pickup_phone: '',
        dropoff_location: '',
        dropoff_contact: '',
        dropoff_phone: '',
        requested_date: new Date().toISOString().split('T')[0],
        requested_time: '',
        special_instructions: '',
        linked_mrf_id: '',
        load_qty: '',
        load_weight: '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Validate required fields
            if (!formData.description || !formData.requester_name || !formData.pickup_location || !formData.dropoff_location) {
                throw new Error('Please fill in all required fields');
            }

            await taskService.createTask({
                type: formData.type,
                priority: formData.priority,
                description: formData.description,
                special_instructions: formData.special_instructions || undefined,
                requester: {
                    name: formData.requester_name,
                    department: formData.requester_department,
                    phone: formData.requester_phone || undefined,
                    email: formData.requester_email || undefined,
                },
                pickup: {
                    location: formData.pickup_location,
                    contact: formData.pickup_contact || undefined,
                    phone: formData.pickup_phone || undefined,
                },
                dropoff: {
                    location: formData.dropoff_location,
                    contact: formData.dropoff_contact || undefined,
                    phone: formData.dropoff_phone || undefined,
                },
                load_info: formData.load_qty || formData.load_weight ? {
                    qty: formData.load_qty ? parseInt(formData.load_qty) : undefined,
                    weight: formData.load_weight ? parseFloat(formData.load_weight) : undefined,
                } : undefined,
                requested_date: `${formData.requested_date}T${formData.requested_time || '00:00'}:00Z`,
                requested_time: formData.requested_time || undefined,
                linked_mrf_id: formData.linked_mrf_id || undefined,
            });

            // Reset form and close
            setFormData({
                type: 'delivery',
                priority: 'normal',
                description: '',
                requester_name: '',
                requester_department: '',
                requester_phone: '',
                requester_email: '',
                pickup_location: '',
                pickup_contact: '',
                pickup_phone: '',
                dropoff_location: '',
                dropoff_contact: '',
                dropoff_phone: '',
                requested_date: new Date().toISOString().split('T')[0],
                requested_time: '',
                special_instructions: '',
                linked_mrf_id: '',
                load_qty: '',
                load_weight: '',
            });
            
            onTaskCreated();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '24px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>Create New Logistics Task</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#666',
                        }}
                    >
                        ×
                    </button>
                </div>

                {error && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '4px',
                        marginBottom: '16px',
                        color: '#c00',
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Task Type & Priority */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                Task Type *
                            </label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            >
                                <option value="delivery">Delivery</option>
                                <option value="collection">Collection</option>
                                <option value="container_move">Container Move</option>
                                <option value="yard_work">Yard Work</option>
                                <option value="project_move">Project Move</option>
                                <option value="backload">Backload</option>
                                <option value="adhoc">Ad-hoc</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                Priority *
                            </label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            >
                                <option value="critical">Critical (2hr SLA)</option>
                                <option value="high">High (4hr SLA)</option>
                                <option value="normal">Normal (24hr SLA)</option>
                                <option value="low">Low (48hr SLA)</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={3}
                            placeholder="Describe what needs to be moved and why..."
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>

                    {/* Requester Information */}
                    <h3 style={{ marginTop: '24px', marginBottom: '12px' }}>Requester Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                Name *
                            </label>
                            <input
                                type="text"
                                name="requester_name"
                                value={formData.requester_name}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                Department
                            </label>
                            <input
                                type="text"
                                name="requester_department"
                                value={formData.requester_department}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                Phone
                            </label>
                            <input
                                type="tel"
                                name="requester_phone"
                                value={formData.requester_phone}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                Email
                            </label>
                            <input
                                type="email"
                                name="requester_email"
                                value={formData.requester_email}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            />
                        </div>
                    </div>

                    {/* Pickup Location */}
                    <h3 style={{ marginTop: '24px', marginBottom: '12px' }}>Pickup Location</h3>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                            Location *
                        </label>
                        <input
                            type="text"
                            name="pickup_location"
                            value={formData.pickup_location}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Warehouse 1, Bay 3"
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                            }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                Contact Person
                            </label>
                            <input
                                type="text"
                                name="pickup_contact"
                                value={formData.pickup_contact}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                Contact Phone
                            </label>
                            <input
                                type="tel"
                                name="pickup_phone"
                                value={formData.pickup_phone}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            />
                        </div>
                    </div>

                    {/* Dropoff Location */}
                    <h3 style={{ marginTop: '24px', marginBottom: '12px' }}>Dropoff Location</h3>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                            Location *
                        </label>
                        <input
                            type="text"
                            name="dropoff_location"
                            value={formData.dropoff_location}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Unit 12, Workshop A"
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                            }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                Contact Person
                            </label>
                            <input
                                type="text"
                                name="dropoff_contact"
                                value={formData.dropoff_contact}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                Contact Phone
                            </label>
                            <input
                                type="tel"
                                name="dropoff_phone"
                                value={formData.dropoff_phone}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            />
                        </div>
                    </div>

                    {/* Schedule */}
                    <h3 style={{ marginTop: '24px', marginBottom: '12px' }}>Schedule</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                Requested Date *
                            </label>
                            <input
                                type="date"
                                name="requested_date"
                                value={formData.requested_date}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                Requested Time
                            </label>
                            <input
                                type="time"
                                name="requested_time"
                                value={formData.requested_time}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            />
                        </div>
                    </div>

                    {/* Load Info (Optional) */}
                    <h3 style={{ marginTop: '24px', marginBottom: '12px' }}>Load Information (Optional)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                Quantity
                            </label>
                            <input
                                type="number"
                                name="load_qty"
                                value={formData.load_qty}
                                onChange={handleChange}
                                placeholder="Number of items"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                Weight (kg)
                            </label>
                            <input
                                type="number"
                                name="load_weight"
                                value={formData.load_weight}
                                onChange={handleChange}
                                placeholder="Total weight"
                                step="0.1"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                }}
                            />
                        </div>
                    </div>

                    {/* Additional Fields */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                            Special Instructions
                        </label>
                        <textarea
                            name="special_instructions"
                            value={formData.special_instructions}
                            onChange={handleChange}
                            rows={2}
                            placeholder="Any special handling requirements, access codes, etc..."
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                            Linked MRF ID (if applicable)
                        </label>
                        <input
                            type="text"
                            name="linked_mrf_id"
                            value={formData.linked_mrf_id}
                            onChange={handleChange}
                            placeholder="e.g., MRF-2025-001234"
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                            }}
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#f0f0f0',
                                color: '#333',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: submitting ? '#ccc' : '#0066cc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                            }}
                        >
                            {submitting ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

