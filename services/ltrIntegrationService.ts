// Toll LTR (Logistics Task Router) Integration Service
// In production, this would connect to the actual LTR system API

export interface LTRDeliveryTask {
    id: string;
    mrfId: string;
    status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed';
    driver?: string;
    vehicle?: string;
    pickupLocation: string;
    deliveryLocation: string;
    priority: 'P1' | 'P2' | 'P3' | 'P4';
    items: number;
    createdAt: string;
    assignedAt?: string;
    deliveredAt?: string;
    estimatedDeliveryTime?: string;
    actualDeliveryTime?: string;
    failureReason?: string;
    retryCount: number;
    maxRetries: number;
}

export interface LTRDriver {
    id: string;
    name: string;
    vehicle: string;
    status: 'available' | 'busy' | 'offline';
    currentLocation?: string;
    currentTask?: string;
}

let deliveryTasks: LTRDeliveryTask[] = [];
let drivers: LTRDriver[] = [];
let ltrConnectionStatus: 'connected' | 'disconnected' | 'error' = 'connected';

// Send delivery task to LTR system
export const sendToLTR = async (
    mrfId: string,
    pickupLocation: string,
    deliveryLocation: string,
    priority: 'P1' | 'P2' | 'P3' | 'P4',
    items: number
): Promise<LTRDeliveryTask> => {
    const task: LTRDeliveryTask = {
        id: `LTR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        mrfId,
        status: 'pending',
        pickupLocation,
        deliveryLocation,
        priority,
        items,
        createdAt: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 3
    };

    deliveryTasks.unshift(task);

    // Simulate LTR API call
    try {
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                // 95% success rate
                if (Math.random() > 0.05) {
                    resolve(true);
                } else {
                    reject(new Error('LTR system timeout'));
                }
            }, 1000);
        });

        // Simulate auto-assignment after a delay
        setTimeout(() => {
            assignDriverToTask(task.id);
        }, 3000);

        return task;
    } catch (error) {
        task.status = 'failed';
        task.failureReason = error instanceof Error ? error.message : 'Unknown error';
        throw error;
    }
};

// Assign driver to task (simulated)
const assignDriverToTask = (taskId: string): void => {
    const task = deliveryTasks.find(t => t.id === taskId);
    if (!task || task.status !== 'pending') return;

    const availableDriver = drivers.find(d => d.status === 'available');
    if (availableDriver) {
        task.status = 'assigned';
        task.driver = availableDriver.name;
        task.vehicle = availableDriver.vehicle;
        task.assignedAt = new Date().toISOString();

        // Estimate delivery time (30-60 minutes from now)
        const estimatedMinutes = Math.floor(Math.random() * 30) + 30;
        task.estimatedDeliveryTime = new Date(Date.now() + estimatedMinutes * 60000).toISOString();

        availableDriver.status = 'busy';
        availableDriver.currentTask = taskId;

        // Simulate delivery completion
        setTimeout(() => {
            completeDelivery(taskId);
        }, estimatedMinutes * 1000); // Simulate faster for demo
    }
};

// Complete delivery
const completeDelivery = (taskId: string): void => {
    const task = deliveryTasks.find(t => t.id === taskId);
    if (!task || task.status !== 'assigned') return;

    // 90% success rate
    if (Math.random() > 0.1) {
        task.status = 'delivered';
        task.deliveredAt = new Date().toISOString();
        task.actualDeliveryTime = new Date().toISOString();
    } else {
        task.status = 'failed';
        task.failureReason = 'Access denied at delivery location';
    }

    // Free up driver
    const driver = drivers.find(d => d.currentTask === taskId);
    if (driver) {
        driver.status = 'available';
        driver.currentTask = undefined;
    }
};

// Retry failed delivery
export const retryDelivery = async (taskId: string): Promise<void> => {
    const task = deliveryTasks.find(t => t.id === taskId);
    if (!task) {
        throw new Error('Task not found');
    }

    if (task.status !== 'failed') {
        throw new Error('Can only retry failed tasks');
    }

    if (task.retryCount >= task.maxRetries) {
        throw new Error('Maximum retry attempts reached');
    }

    task.retryCount++;
    task.status = 'pending';
    task.failureReason = undefined;

    // Try to assign driver again
    setTimeout(() => {
        assignDriverToTask(taskId);
    }, 2000);
};

// Get delivery tasks
export const getDeliveryTasks = (filters?: {
    mrfId?: string;
    status?: LTRDeliveryTask['status'];
}): LTRDeliveryTask[] => {
    let filtered = [...deliveryTasks];

    if (filters) {
        if (filters.mrfId) {
            filtered = filtered.filter(t => t.mrfId === filters.mrfId);
        }
        if (filters.status) {
            filtered = filtered.filter(t => t.status === filters.status);
        }
    }

    return filtered;
};

// Get available drivers
export const getDrivers = (statusFilter?: LTRDriver['status']): LTRDriver[] => {
    if (statusFilter) {
        return drivers.filter(d => d.status === statusFilter);
    }
    return drivers;
};

// Get LTR connection status
export const getLTRConnectionStatus = (): string => {
    return ltrConnectionStatus;
};

// Test LTR connection
export const testLTRConnection = async (): Promise<boolean> => {
    try {
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) {
                    resolve(true);
                } else {
                    reject(new Error('Connection failed'));
                }
            }, 1000);
        });
        ltrConnectionStatus = 'connected';
        return true;
    } catch (error) {
        ltrConnectionStatus = 'error';
        return false;
    }
};

// Initialize sample data
export const initializeLTRSampleData = () => {
    // Sample drivers
    drivers = [
        {
            id: 'DRV-001',
            name: 'Mike Johnson',
            vehicle: 'Truck-A12',
            status: 'available',
            currentLocation: 'Warehouse 1'
        },
        {
            id: 'DRV-002',
            name: 'Sarah Williams',
            vehicle: 'Van-B05',
            status: 'available',
            currentLocation: 'Warehouse 2'
        },
        {
            id: 'DRV-003',
            name: 'Tom Chen',
            vehicle: 'Truck-C21',
            status: 'busy',
            currentTask: 'LTR-SAMPLE-001',
            currentLocation: 'In Transit'
        }
    ];

    // Sample delivery tasks
    const now = Date.now();
    deliveryTasks = [
        {
            id: 'LTR-SAMPLE-001',
            mrfId: 'MRF-1238',
            status: 'in_transit',
            driver: 'Tom Chen',
            vehicle: 'Truck-C21',
            pickupLocation: 'Warehouse 1',
            deliveryLocation: 'Weld Shop',
            priority: 'P2',
            items: 8,
            createdAt: new Date(now - 3600000).toISOString(),
            assignedAt: new Date(now - 3000000).toISOString(),
            estimatedDeliveryTime: new Date(now + 600000).toISOString(),
            retryCount: 0,
            maxRetries: 3
        },
        {
            id: 'LTR-SAMPLE-002',
            mrfId: 'MRF-1235',
            status: 'delivered',
            driver: 'Mike Johnson',
            vehicle: 'Truck-A12',
            pickupLocation: 'Warehouse 2',
            deliveryLocation: 'Ops Center Trailer 1',
            priority: 'P3',
            items: 4,
            createdAt: new Date(now - 7200000).toISOString(),
            assignedAt: new Date(now - 6600000).toISOString(),
            deliveredAt: new Date(now - 3600000).toISOString(),
            estimatedDeliveryTime: new Date(now - 3800000).toISOString(),
            actualDeliveryTime: new Date(now - 3600000).toISOString(),
            retryCount: 0,
            maxRetries: 3
        }
    ];
};

// Initialize on load
initializeLTRSampleData();
