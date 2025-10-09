/**
 * Toll LTR (Logistics Third Rail) Service
 * Mock implementation for off-site material ordering and delivery tracking
 */

export interface TollTask {
    taskId: string;
    status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled' | 'failed';
    mrfId: string;
    itemNumber: string;
    materialDescription: string;
    quantity: number;
    pickupLocation: string;
    deliveryLocation: string;
    estimatedPickup?: string;
    estimatedDelivery?: string;
    actualPickup?: string;
    actualDelivery?: string;
    driverName?: string;
    vehicleRego?: string;
    trackingNotes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TollAvailability {
    itemNumber: string;
    available: boolean;
    quantityOnHand: number;
    location: string;
    estimatedLeadTimeDays: number;
}

export interface CreateTollTaskRequest {
    mrfId: string;
    itemNumber: string;
    materialDescription: string;
    quantity: number;
    pickupLocation: string;
    deliveryLocation: string;
    priority: 'standard' | 'urgent';
    requiredByDate?: string;
}

// Mock in-memory storage
let mockTollTasks: TollTask[] = [
    {
        taskId: 'TOLL-2025-001',
        status: 'delivered',
        mrfId: 'MRF-2025-007',
        itemNumber: 'MAT-789',
        materialDescription: 'Steel Beam 10m',
        quantity: 2,
        pickupLocation: 'Toll Warehouse - Brisbane',
        deliveryLocation: 'Site 1 - Unit 15',
        estimatedPickup: '2025-01-08T09:00:00Z',
        estimatedDelivery: '2025-01-08T14:00:00Z',
        actualPickup: '2025-01-08T09:15:00Z',
        actualDelivery: '2025-01-08T13:45:00Z',
        driverName: 'John Smith',
        vehicleRego: 'ABC-123',
        trackingNotes: 'Delivered successfully',
        createdAt: '2025-01-08T08:00:00Z',
        updatedAt: '2025-01-08T13:45:00Z'
    }
];

// Mock material catalog
const mockTollCatalog: Record<string, TollAvailability> = {
    'MAT-789': {
        itemNumber: 'MAT-789',
        available: true,
        quantityOnHand: 10,
        location: 'Toll Warehouse - Brisbane',
        estimatedLeadTimeDays: 1
    },
    'MAT-790': {
        itemNumber: 'MAT-790',
        available: true,
        quantityOnHand: 5,
        location: 'Toll Warehouse - Gold Coast',
        estimatedLeadTimeDays: 2
    },
    'MAT-791': {
        itemNumber: 'MAT-791',
        available: false,
        quantityOnHand: 0,
        location: 'Toll Warehouse - Brisbane',
        estimatedLeadTimeDays: 7
    }
};

/**
 * Check material availability at Toll
 */
export const checkTollAvailability = async (itemNumber: string): Promise<TollAvailability | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const availability = mockTollCatalog[itemNumber];
    
    if (availability) {
        console.log(`✅ Toll Availability: ${itemNumber} - ${availability.available ? 'Available' : 'Not Available'} (${availability.quantityOnHand} on hand)`);
        return availability;
    }
    
    console.log(`❌ Toll Availability: ${itemNumber} - Not found in Toll catalog`);
    return null;
};

/**
 * Create a new Toll delivery task
 */
export const createTollTask = async (request: CreateTollTaskRequest): Promise<TollTask> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const taskId = `TOLL-${new Date().getFullYear()}-${String(mockTollTasks.length + 1).padStart(3, '0')}`;
    const now = new Date();
    
    // Calculate estimated times
    const availability = mockTollCatalog[request.itemNumber];
    const leadTimeDays = availability?.estimatedLeadTimeDays || 3;
    const estimatedPickup = new Date(now.getTime() + (leadTimeDays * 24 * 60 * 60 * 1000));
    const estimatedDelivery = new Date(estimatedPickup.getTime() + (4 * 60 * 60 * 1000)); // +4 hours for delivery
    
    const task: TollTask = {
        taskId,
        status: 'pending',
        mrfId: request.mrfId,
        itemNumber: request.itemNumber,
        materialDescription: request.materialDescription,
        quantity: request.quantity,
        pickupLocation: request.pickupLocation,
        deliveryLocation: request.deliveryLocation,
        estimatedPickup: estimatedPickup.toISOString(),
        estimatedDelivery: estimatedDelivery.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
    };
    
    mockTollTasks.push(task);
    
    console.log(`✅ Created Toll task ${taskId} for MRF ${request.mrfId}`);
    console.log(`   Estimated pickup: ${estimatedPickup.toLocaleString()}`);
    console.log(`   Estimated delivery: ${estimatedDelivery.toLocaleString()}`);
    
    // Simulate task progression
    simulateTaskProgression(taskId);
    
    return task;
};

/**
 * Get Toll task by ID
 */
export const getTollTask = async (taskId: string): Promise<TollTask | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const task = mockTollTasks.find(t => t.taskId === taskId);
    return task || null;
};

/**
 * Get all Toll tasks for an MRF
 */
export const getTollTasksForMRF = async (mrfId: string): Promise<TollTask[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return mockTollTasks.filter(t => t.mrfId === mrfId);
};

/**
 * Cancel a Toll task
 */
export const cancelTollTask = async (taskId: string, reason: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const task = mockTollTasks.find(t => t.taskId === taskId);
    if (!task) return false;
    
    if (task.status === 'delivered' || task.status === 'cancelled') {
        console.log(`❌ Cannot cancel Toll task ${taskId} - already ${task.status}`);
        return false;
    }
    
    task.status = 'cancelled';
    task.trackingNotes = `Cancelled: ${reason}`;
    task.updatedAt = new Date().toISOString();
    
    console.log(`✅ Cancelled Toll task ${taskId}`);
    return true;
};

/**
 * Update Toll task status (simulated by Toll system)
 */
const updateTollTaskStatus = (taskId: string, status: TollTask['status'], updates?: Partial<TollTask>) => {
    const task = mockTollTasks.find(t => t.taskId === taskId);
    if (!task) return;
    
    task.status = status;
    task.updatedAt = new Date().toISOString();
    
    if (updates) {
        Object.assign(task, updates);
    }
    
    console.log(`🔄 Toll task ${taskId} updated to status: ${status}`);
};

/**
 * Simulate task progression over time (for demo purposes)
 */
const simulateTaskProgression = (taskId: string) => {
    // Simulate task progression: pending → accepted → in_transit → delivered
    const task = mockTollTasks.find(t => t.taskId === taskId);
    if (!task) return;
    
    // After 5 seconds: accepted
    setTimeout(() => {
        updateTollTaskStatus(taskId, 'accepted', {
            driverName: 'Driver ' + Math.floor(Math.random() * 100),
            vehicleRego: `VEH-${Math.floor(Math.random() * 1000)}`,
            trackingNotes: 'Driver assigned, preparing for pickup'
        });
    }, 5000);
    
    // After 15 seconds: in_transit
    setTimeout(() => {
        updateTollTaskStatus(taskId, 'in_transit', {
            actualPickup: new Date().toISOString(),
            trackingNotes: 'Materials picked up, en route to delivery location'
        });
    }, 15000);
    
    // After 30 seconds: delivered
    setTimeout(() => {
        updateTollTaskStatus(taskId, 'delivered', {
            actualDelivery: new Date().toISOString(),
            trackingNotes: 'Delivered successfully'
        });
    }, 30000);
};

/**
 * Get Toll task status display info
 */
export const getTollStatusInfo = (status: TollTask['status']): {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
} => {
    switch (status) {
        case 'pending':
            return {
                label: 'Pending',
                color: 'text-gray-700',
                bgColor: 'bg-gray-100',
                icon: '⏳'
            };
        case 'accepted':
            return {
                label: 'Accepted',
                color: 'text-blue-700',
                bgColor: 'bg-blue-100',
                icon: '✅'
            };
        case 'in_transit':
            return {
                label: 'In Transit',
                color: 'text-purple-700',
                bgColor: 'bg-purple-100',
                icon: '🚚'
            };
        case 'delivered':
            return {
                label: 'Delivered',
                color: 'text-green-700',
                bgColor: 'bg-green-100',
                icon: '📦'
            };
        case 'cancelled':
            return {
                label: 'Cancelled',
                color: 'text-red-700',
                bgColor: 'bg-red-100',
                icon: '❌'
            };
        case 'failed':
            return {
                label: 'Failed',
                color: 'text-orange-700',
                bgColor: 'bg-orange-100',
                icon: '⚠️'
            };
        default:
            return {
                label: 'Unknown',
                color: 'text-gray-700',
                bgColor: 'bg-gray-100',
                icon: '❓'
            };
    }
};

/**
 * Format Toll task ETA
 */
export const formatTollETA = (isoDate: string): string => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) {
        return 'Overdue';
    }
    
    if (diffHours < 1) {
        const diffMinutes = Math.round(diffMs / (1000 * 60));
        return `${diffMinutes}m`;
    }
    
    if (diffHours < 24) {
        return `${diffHours}h`;
    }
    
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d`;
};

/**
 * Get all mock Toll tasks (for testing/demo)
 */
export const getAllTollTasks = (): TollTask[] => {
    return [...mockTollTasks];
};

/**
 * Reset mock data (for testing)
 */
export const resetTollMockData = () => {
    mockTollTasks = [];
    console.log('🔄 Toll mock data reset');
};

