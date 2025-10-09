/**
 * Test Utilities
 * Helper functions for testing
 */

import { MaterialRequest, User, RequestItem, WOMaterial } from '../types';

/**
 * Create mock user
 */
export const createMockUser = (overrides?: Partial<User>): User => {
    return {
        name: 'Test User',
        role: 'Requestor',
        permissions: ['view_requests', 'create_requests'],
        ...overrides
    };
};

/**
 * Create mock material request
 */
export const createMockRequest = (overrides?: Partial<MaterialRequest>): MaterialRequest => {
    return {
        id: `MRF-TEST-${Date.now()}`,
        status: 'Submitted',
        priority: 'P3',
        items: 1,
        workOrders: 'WO-TEST',
        createdDate: new Date().toLocaleDateString(),
        RequiredByTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        RequestedBy: 'Test User',
        DeliveryLocation: 'Test Site',
        requestorName: 'Test User',
        MC_Priority_Flag: false,
        acPriority: null,
        statusHistory: [],
        ...overrides
    } as MaterialRequest;
};

/**
 * Create mock request item
 */
export const createMockRequestItem = (overrides?: Partial<RequestItem>): RequestItem => {
    return {
        pKey: `LI-TEST-${Date.now()}`,
        status: 'Open',
        qtyRequested: 1,
        materialDescription: 'Test Material',
        itemNumber: 'ITEM-TEST',
        storageLocation: 'Warehouse A',
        packNumber: 'PACK-1',
        ...overrides
    };
};

/**
 * Create mock WO material
 */
export const createMockMaterial = (overrides?: Partial<WOMaterial>): WOMaterial => {
    return {
        pKey: `MAT-TEST-${Date.now()}`,
        workOrder: 'WO-TEST',
        materialDescription: 'Test Material',
        jdeItemNo: 'ITEM-TEST',
        storageLocation: 'Warehouse A',
        workOrderQty: 1,
        jdePackNumber: 'PACK-1',
        onHandQty: 10,
        packNumber: 'PACK-1',
        ...overrides
    };
};

/**
 * Wait for async operations
 */
export const waitFor = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Simulate API call delay
 */
export const mockApiDelay = async <T>(data: T, delayMs: number = 100): Promise<T> => {
    await waitFor(delayMs);
    return data;
};

/**
 * Assert request transitions through expected statuses
 */
export const assertStatusTransition = (
    request: MaterialRequest,
    expectedStatuses: MaterialRequest['status'][]
): void => {
    if (!request.statusHistory) {
        throw new Error('Request has no status history');
    }
    
    const actualStatuses = request.statusHistory.map(h => h.status);
    
    expectedStatuses.forEach((expectedStatus, index) => {
        if (actualStatuses[index] !== expectedStatus) {
            throw new Error(
                `Expected status at index ${index} to be ${expectedStatus}, but got ${actualStatuses[index]}`
            );
        }
    });
};

/**
 * Assert all items are picked
 */
export const assertAllItemsPicked = (items: RequestItem[]): void => {
    const unpicked = items.filter(item => item.status !== 'Picked');
    
    if (unpicked.length > 0) {
        throw new Error(
            `Expected all items to be picked, but ${unpicked.length} items are not picked`
        );
    }
};

/**
 * Mock localStorage
 */
export const mockLocalStorage = (() => {
    let store: Record<string, string> = {};
    
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (index: number) => Object.keys(store)[index] || null
    };
})();

/**
 * Mock console methods for testing
 */
export const mockConsole = () => {
    const original = {
        log: console.log,
        error: console.error,
        warn: console.warn
    };
    
    const logs: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    
    console.log = (...args: any[]) => logs.push(args.join(' '));
    console.error = (...args: any[]) => errors.push(args.join(' '));
    console.warn = (...args: any[]) => warnings.push(args.join(' '));
    
    return {
        restore: () => {
            console.log = original.log;
            console.error = original.error;
            console.warn = original.warn;
        },
        getLogs: () => logs,
        getErrors: () => errors,
        getWarnings: () => warnings
    };
};

/**
 * Test data builders
 */
export const builders = {
    /**
     * Build complete request with line items
     */
    requestWithItems: (itemCount: number = 3): {
        request: MaterialRequest;
        items: RequestItem[];
    } => {
        const request = createMockRequest();
        const items = Array.from({ length: itemCount }, (_, i) =>
            createMockRequestItem({
                pKey: `LI-${request.id}-${i}`,
                qtyRequested: (i + 1) * 2
            })
        );
        
        request.items = items.length;
        
        return { request, items };
    },
    
    /**
     * Build request in specific status
     */
    requestInStatus: (status: MaterialRequest['status']): MaterialRequest => {
        const request = createMockRequest({ status });
        
        // Add status history
        request.statusHistory = [{
            status,
            timestamp: new Date().toISOString(),
            changedBy: 'Test User',
            reason: `Set to ${status}`
        }];
        
        return request;
    },
    
    /**
     * Build P1 request
     */
    p1Request: (): MaterialRequest => {
        return createMockRequest({
            priority: 'P1',
            MC_Priority_Flag: true,
            status: 'Pending Approval'
        });
    }
};

/**
 * Assertion helpers
 */
export const assertions = {
    /**
     * Assert request is in expected status
     */
    isInStatus: (request: MaterialRequest, status: MaterialRequest['status']): void => {
        if (request.status !== status) {
            throw new Error(`Expected request to be in status ${status}, but got ${request.status}`);
        }
    },
    
    /**
     * Assert request has POD
     */
    hasPOD: (request: MaterialRequest): void => {
        if (!request.pod) {
            throw new Error('Expected request to have POD, but it does not');
        }
    },
    
    /**
     * Assert item is picked
     */
    isPicked: (item: RequestItem): void => {
        if (item.status !== 'Picked') {
            throw new Error(`Expected item to be picked, but status is ${item.status}`);
        }
        
        if (item.qtyPicked === undefined || item.qtyPicked === 0) {
            throw new Error('Expected item to have picked quantity');
        }
    }
};

export default {
    createMockUser,
    createMockRequest,
    createMockRequestItem,
    createMockMaterial,
    waitFor,
    mockApiDelay,
    assertStatusTransition,
    assertAllItemsPicked,
    mockLocalStorage,
    mockConsole,
    builders,
    assertions
};

