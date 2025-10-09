/**
 * Mock Data for Logistics App
 * Sample data for testing without database connection
 */

import type { LogisticsTask, Driver, Vehicle } from '../../types';

// Mock Drivers
export const mockDrivers: Driver[] = [
    {
        driver_id: 'driver-1',
        user_id: 'user-driver-1',
        name: 'John Smith',
        email: 'john.smith@company.com',
        phone: '555-0101',
        employee_id: 'EMP-001',
        license_number: 'DL-123456',
        license_class: 'C',
        license_expiry: '2026-12-31',
        status: 'active',
        availability: true,
        current_task_id: null,
        current_location: {
            lat: -26.6563,
            lng: 153.0896,
            accuracy: 10,
            timestamp: new Date().toISOString(),
        },
        tasks_completed: 47,
        tasks_in_progress: 0,
        avg_completion_time: '02:30:00',
        rating: 4.8,
        created_at: '2024-01-15T08:00:00Z',
        updated_at: new Date().toISOString(),
    },
    {
        driver_id: 'driver-2',
        user_id: 'user-driver-2',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        phone: '555-0102',
        employee_id: 'EMP-002',
        license_number: 'DL-234567',
        license_class: 'C',
        license_expiry: '2027-03-15',
        status: 'active',
        availability: true,
        current_task_id: null,
        current_location: {
            lat: -26.6570,
            lng: 153.0900,
            accuracy: 15,
            timestamp: new Date().toISOString(),
        },
        tasks_completed: 62,
        tasks_in_progress: 0,
        avg_completion_time: '02:15:00',
        rating: 4.9,
        created_at: '2024-02-01T08:00:00Z',
        updated_at: new Date().toISOString(),
    },
    {
        driver_id: 'driver-3',
        user_id: 'user-driver-3',
        name: 'Mike Davis',
        email: 'mike.davis@company.com',
        phone: '555-0103',
        employee_id: 'EMP-003',
        license_number: 'DL-345678',
        license_class: 'HC',
        license_expiry: '2025-08-20',
        status: 'active',
        availability: false,
        current_task_id: 'task-3',
        current_location: {
            lat: -26.6580,
            lng: 153.0910,
            accuracy: 12,
            timestamp: new Date().toISOString(),
        },
        tasks_completed: 38,
        tasks_in_progress: 1,
        avg_completion_time: '03:00:00',
        rating: 4.7,
        created_at: '2024-03-10T08:00:00Z',
        updated_at: new Date().toISOString(),
    },
];

// Mock Vehicles
export const mockVehicles: Vehicle[] = [
    {
        vehicle_id: 'vehicle-1',
        registration: 'ABC123',
        make: 'Isuzu',
        model: 'NPR 400',
        year: 2022,
        vehicle_type: 'truck',
        max_weight_kg: 4000,
        max_volume_m3: 25,
        equipment: [
            { name: 'Tail Lift', type: 'loading', capacity: 1000 },
            { name: 'Tie-down straps', type: 'securing' },
        ],
        status: 'available',
        current_driver_id: null,
        current_location: {
            lat: -26.6563,
            lng: 153.0896,
            accuracy: 5,
            timestamp: new Date().toISOString(),
        },
        last_service_date: '2025-09-15',
        next_service_date: '2025-12-15',
        service_notes: 'Regular service completed, all systems OK',
        total_tasks: 215,
        total_distance_km: 4580.5,
        created_at: '2024-01-05T08:00:00Z',
        updated_at: new Date().toISOString(),
    },
    {
        vehicle_id: 'vehicle-2',
        registration: 'XYZ789',
        make: 'Toyota',
        model: 'HiAce',
        year: 2023,
        vehicle_type: 'van',
        max_weight_kg: 1500,
        max_volume_m3: 10,
        equipment: [
            { name: 'Roof racks', type: 'storage' },
        ],
        status: 'available',
        current_driver_id: null,
        current_location: {
            lat: -26.6565,
            lng: 153.0898,
            accuracy: 5,
            timestamp: new Date().toISOString(),
        },
        last_service_date: '2025-08-20',
        next_service_date: '2025-11-20',
        service_notes: 'Minor brake adjustment completed',
        total_tasks: 178,
        total_distance_km: 3210.8,
        created_at: '2024-02-20T08:00:00Z',
        updated_at: new Date().toISOString(),
    },
    {
        vehicle_id: 'vehicle-3',
        registration: 'DEF456',
        make: 'Caterpillar',
        model: 'TH255C',
        year: 2021,
        vehicle_type: 'forklift',
        max_weight_kg: 2500,
        equipment: [
            { name: 'Telescopic Boom', type: 'lifting', capacity: 2500 },
        ],
        status: 'in_use',
        current_driver_id: 'driver-3',
        current_location: {
            lat: -26.6580,
            lng: 153.0910,
            accuracy: 8,
            timestamp: new Date().toISOString(),
        },
        last_service_date: '2025-07-10',
        next_service_date: '2025-10-10',
        service_notes: 'Hydraulics checked, all OK',
        total_tasks: 142,
        total_distance_km: 850.3,
        created_at: '2024-01-20T08:00:00Z',
        updated_at: new Date().toISOString(),
    },
    {
        vehicle_id: 'vehicle-4',
        registration: 'GHI789',
        make: 'Ford',
        model: 'Ranger',
        year: 2024,
        vehicle_type: 'ute',
        max_weight_kg: 1200,
        equipment: [
            { name: 'Tool box', type: 'storage' },
            { name: 'Tow bar', type: 'towing', capacity: 3500 },
        ],
        status: 'available',
        current_driver_id: null,
        last_service_date: '2025-09-01',
        next_service_date: '2025-12-01',
        total_tasks: 85,
        total_distance_km: 2150.0,
        created_at: '2024-05-01T08:00:00Z',
        updated_at: new Date().toISOString(),
    },
];

// Mock Tasks
export const mockTasks: LogisticsTask[] = [
    {
        task_id: 'task-1',
        task_number: 'TT-2025-000001',
        type: 'delivery',
        category: 'materials_request',
        priority: 'high',
        requester: {
            name: 'Alice Brown',
            department: 'Engineering',
            phone: '555-1001',
            email: 'alice.brown@company.com',
        },
        description: 'Deliver welding materials to Unit 12 for P1 work order',
        special_instructions: 'Contact site supervisor on arrival. Materials needed by 2pm.',
        linked_mrf_id: 'MRF-2025-001234',
        linked_entity_type: 'mrf',
        linked_entity_id: 'MRF-2025-001234',
        pickup: {
            location: 'Warehouse 1, Bay 3',
            contact: 'Mike Wilson',
            phone: '555-2001',
            gps: { lat: -26.6560, lng: 153.0895 },
            access_notes: 'Use loading dock 3',
        },
        dropoff: {
            location: 'Unit 12, Workshop A',
            contact: 'Jane Smith',
            phone: '555-3001',
            gps: { lat: -26.6575, lng: 153.0905 },
            access_notes: 'Gate code: 4567',
        },
        load_info: {
            qty: 12,
            weight: 450,
            equipment_required: 'Forklift for unloading',
        },
        requested_date: new Date(Date.now() + 3600000).toISOString(),
        requested_time: '14:00',
        hard_window_flag: true,
        sla_target_at: new Date(Date.now() + 7200000).toISOString(),
        status: 'new',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
        task_id: 'task-2',
        task_number: 'TT-2025-000002',
        type: 'collection',
        priority: 'normal',
        requester: {
            name: 'Bob Johnson',
            department: 'Maintenance',
            phone: '555-1002',
        },
        description: 'Collect empty containers from Workshop B',
        pickup: {
            location: 'Workshop B, Loading Bay',
            gps: { lat: -26.6585, lng: 153.0915 },
        },
        dropoff: {
            location: 'Warehouse 2, Container Storage',
            gps: { lat: -26.6565, lng: 153.0890 },
        },
        load_info: {
            qty: 8,
            container_no: 'Various',
        },
        requested_date: new Date(Date.now() + 86400000).toISOString(),
        sla_target_at: new Date(Date.now() + 172800000).toISOString(),
        status: 'new',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        task_id: 'task-3',
        task_number: 'TT-2025-000003',
        type: 'yard_work',
        priority: 'normal',
        requester: {
            name: 'Carol Martinez',
            department: 'Operations',
            phone: '555-1003',
        },
        description: 'Move steel beams from temporary storage to fabrication area',
        pickup: {
            location: 'Yard 1, Section A',
            gps: { lat: -26.6590, lng: 153.0920 },
        },
        dropoff: {
            location: 'Fabrication Hall, Bay 2',
            gps: { lat: -26.6570, lng: 153.0900 },
        },
        load_info: {
            qty: 15,
            weight: 2500,
            equipment_required: 'Crane',
        },
        requested_date: new Date().toISOString(),
        sla_target_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'in_progress',
        driver_id: 'driver-3',
        vehicle_id: 'vehicle-3',
        assigned_at: new Date(Date.now() - 7200000).toISOString(),
        started_at: new Date(Date.now() - 3600000).toISOString(),
        pickup_arrived_at: new Date(Date.now() - 1800000).toISOString(),
        created_at: new Date(Date.now() - 10800000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
        task_id: 'task-4',
        task_number: 'TT-2025-000004',
        type: 'delivery',
        category: 'materials_request',
        priority: 'critical',
        requester: {
            name: 'David Lee',
            department: 'Projects',
            phone: '555-1004',
            email: 'david.lee@company.com',
        },
        description: 'URGENT: Safety equipment for scaffolding work - P1 shutdown',
        special_instructions: 'CRITICAL DELIVERY - Work stopped until materials arrive',
        linked_mrf_id: 'MRF-2025-001567',
        pickup: {
            location: 'Safety Equipment Store',
            contact: 'Safety Officer',
            phone: '555-2002',
        },
        dropoff: {
            location: 'Reactor Building, Level 3',
            contact: 'Site Manager',
            phone: '555-3002',
            access_notes: 'Badge required, escort provided',
        },
        load_info: {
            qty: 6,
            weight: 180,
        },
        requested_date: new Date(Date.now() + 1800000).toISOString(),
        hard_window_flag: true,
        sla_target_at: new Date(Date.now() + 5400000).toISOString(),
        status: 'new',
        created_at: new Date(Date.now() - 900000).toISOString(),
        updated_at: new Date(Date.now() - 900000).toISOString(),
    },
    {
        task_id: 'task-5',
        task_number: 'TT-2025-000005',
        type: 'adhoc',
        priority: 'low',
        requester: {
            name: 'Emma Wilson',
            department: 'Administration',
            phone: '555-1005',
        },
        description: 'Move office furniture to new location',
        pickup: {
            location: 'Admin Building, Room 205',
        },
        dropoff: {
            location: 'Admin Building, Room 310',
        },
        requested_date: new Date(Date.now() + 172800000).toISOString(),
        sla_target_at: new Date(Date.now() + 345600000).toISOString(),
        status: 'scheduled',
        driver_id: 'driver-2',
        vehicle_id: 'vehicle-2',
        assigned_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
    },
];

// Helper function to get tasks by status
export function getMockTasksByStatus(status: string): LogisticsTask[] {
    return mockTasks.filter(task => task.status === status);
}

// Helper function to get tasks by driver
export function getMockTasksByDriver(driverId: string): LogisticsTask[] {
    return mockTasks.filter(task => task.driver_id === driverId);
}

// Helper function to get available drivers
export function getAvailableMockDrivers(): Driver[] {
    return mockDrivers.filter(driver => driver.status === 'active' && driver.availability);
}

// Helper function to get available vehicles
export function getAvailableMockVehicles(): Vehicle[] {
    return mockVehicles.filter(vehicle => vehicle.status === 'available');
}

