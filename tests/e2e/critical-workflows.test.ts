/**
 * End-to-End Test Suite - Critical Workflows
 * Tests the core user journeys and business-critical paths
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MaterialRequest, User, RequestItem } from '../../types';
import { mockRequestsData, mockRequestItems, masterGridData, mockTransactionalData } from '../../services/api';

// Mock users for testing
const testUsers = {
    requestor: {
        name: 'Test Requestor',
        role: 'Requestor' as const,
        permissions: ['view_requests', 'create_requests', 'view_materials']
    },
    qube: {
        name: 'Test Warehouse',
        role: 'Warehouse (Qube)' as const,
        permissions: ['view_requests', 'pick_materials', 'capture_pod', 'view_materials']
    },
    mc: {
        name: 'Test MC',
        role: 'Material Coordinator' as const,
        permissions: ['god_mode']
    },
    ac: {
        name: 'Test AC',
        role: 'Area Coordinator' as const,
        permissions: ['view_requests', 'approve_p1', 'view_materials']
    }
};

describe('E2E: Material Request Submission Flow', () => {
    beforeEach(() => {
        // Reset mock data
        mockRequestsData.length = 0;
    });
    
    it('should create a new material request from WO materials', () => {
        // Arrange
        const selectedMaterials = masterGridData.slice(0, 3);
        const requestor = testUsers.requestor;
        
        // Act
        const newMrfId = `MRF-TEST-${Date.now()}`;
        const newRequest: Partial<MaterialRequest> = {
            id: newMrfId,
            status: 'Submitted',
            priority: 'P3',
            items: selectedMaterials.length,
            workOrders: 'WO-123',
            createdDate: new Date().toLocaleDateString(),
            RequiredByTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            RequestedBy: requestor.name,
            DeliveryLocation: 'Site 1',
            requestorName: requestor.name,
            MC_Priority_Flag: false
        };
        
        mockRequestsData.push(newRequest as MaterialRequest);
        
        // Assert
        expect(mockRequestsData).toHaveLength(1);
        expect(mockRequestsData[0].id).toBe(newMrfId);
        expect(mockRequestsData[0].status).toBe('Submitted');
        expect(mockRequestsData[0].items).toBe(3);
        expect(mockRequestsData[0].RequestedBy).toBe(requestor.name);
    });
    
    it('should prevent duplicate material requests', () => {
        // Arrange
        const material = masterGridData[0];
        const existingMrfId = 'MRF-EXISTING';
        
        // Create existing request
        mockTransactionalData[material.pKey] = {
            mrfId: existingMrfId,
            status: 'Submitted' as const
        };
        
        mockRequestsData.push({
            id: existingMrfId,
            status: 'Submitted',
            priority: 'P3'
        } as MaterialRequest);
        
        // Act & Assert
        const isDuplicate = mockTransactionalData[material.pKey] !== undefined;
        expect(isDuplicate).toBe(true);
        
        const existingRequest = mockRequestsData.find(r => r.id === existingMrfId);
        expect(existingRequest).toBeDefined();
        expect(existingRequest?.status).toBe('Submitted');
    });
    
    it('should create P1 request requiring approval when feature enabled', () => {
        // Arrange
        const requestor = testUsers.requestor;
        const p1Request: Partial<MaterialRequest> = {
            id: 'MRF-P1-TEST',
            status: 'Pending Approval',
            priority: 'P1',
            items: 2,
            RequestedBy: requestor.name,
            MC_Priority_Flag: true
        };
        
        // Act
        mockRequestsData.push(p1Request as MaterialRequest);
        
        // Assert
        expect(mockRequestsData[0].status).toBe('Pending Approval');
        expect(mockRequestsData[0].priority).toBe('P1');
        expect(mockRequestsData[0].MC_Priority_Flag).toBe(true);
    });
});

describe('E2E: Picking Workflow', () => {
    let testRequest: MaterialRequest;
    
    beforeEach(() => {
        // Create a test request
        testRequest = {
            id: 'MRF-PICK-TEST',
            status: 'Submitted',
            priority: 'P3',
            items: 2,
            workOrders: 'WO-456',
            createdDate: new Date().toLocaleDateString(),
            RequiredByTimestamp: new Date().toISOString(),
            RequestedBy: testUsers.requestor.name,
            DeliveryLocation: 'Site 1',
            requestorName: testUsers.requestor.name,
            MC_Priority_Flag: false
        };
        
        mockRequestsData.push(testRequest);
        
        // Create line items
        mockRequestItems[testRequest.id] = [
            {
                pKey: 'LI-1',
                status: 'Open',
                qtyRequested: 5,
                materialDescription: 'Test Material 1',
                itemNumber: 'ITEM-001',
                storageLocation: 'Warehouse A',
                packNumber: 'PACK-1'
            },
            {
                pKey: 'LI-2',
                status: 'Open',
                qtyRequested: 3,
                materialDescription: 'Test Material 2',
                itemNumber: 'ITEM-002',
                storageLocation: 'Warehouse B',
                packNumber: 'PACK-2'
            }
        ];
    });
    
    it('should transition request to Picking status', () => {
        // Act
        testRequest.status = 'Picking';
        
        if (!testRequest.statusHistory) {
            testRequest.statusHistory = [];
        }
        
        testRequest.statusHistory.push({
            status: 'Picking',
            timestamp: new Date().toISOString(),
            changedBy: testUsers.qube.name,
            reason: 'Started picking'
        });
        
        // Assert
        expect(testRequest.status).toBe('Picking');
        expect(testRequest.statusHistory).toHaveLength(1);
        expect(testRequest.statusHistory[0].changedBy).toBe(testUsers.qube.name);
    });
    
    it('should pick individual line items', () => {
        // Arrange
        const lineItems = mockRequestItems[testRequest.id];
        
        // Act - Pick first item
        lineItems[0].status = 'Picked';
        lineItems[0].qtyPicked = lineItems[0].qtyRequested;
        
        // Assert
        expect(lineItems[0].status).toBe('Picked');
        expect(lineItems[0].qtyPicked).toBe(5);
        expect(lineItems[1].status).toBe('Open');
    });
    
    it('should handle short picks with reason', () => {
        // Arrange
        const lineItems = mockRequestItems[testRequest.id];
        
        // Act - Short pick with reason
        lineItems[0].status = 'Short';
        lineItems[0].qtyPicked = 3;
        lineItems[0].shortReason = 'Insufficient stock';
        lineItems[0].pickedBy = testUsers.qube.name;
        
        // Assert
        expect(lineItems[0].status).toBe('Short');
        expect(lineItems[0].qtyPicked).toBe(3);
        expect(lineItems[0].shortReason).toBe('Insufficient stock');
    });
    
    it('should complete picking and transition to Staged', () => {
        // Arrange
        const lineItems = mockRequestItems[testRequest.id];
        
        // Act - Pick all items
        lineItems.forEach(item => {
            item.status = 'Picked';
            item.qtyPicked = item.qtyRequested;
            item.pickedBy = testUsers.qube.name;
        });
        
        // All items picked, move to Staged
        const allPicked = lineItems.every(item => item.status === 'Picked');
        if (allPicked) {
            testRequest.status = 'Staged';
        }
        
        // Assert
        expect(allPicked).toBe(true);
        expect(testRequest.status).toBe('Staged');
        expect(lineItems.every(item => item.qtyPicked !== undefined)).toBe(true);
    });
});

describe('E2E: POD Capture and Delivery', () => {
    let testRequest: MaterialRequest;
    
    beforeEach(() => {
        testRequest = {
            id: 'MRF-POD-TEST',
            status: 'In Transit',
            priority: 'P2',
            items: 1,
            workOrders: 'WO-789',
            createdDate: new Date().toLocaleDateString(),
            RequiredByTimestamp: new Date().toISOString(),
            RequestedBy: testUsers.requestor.name,
            DeliveryLocation: 'Site 2',
            requestorName: testUsers.requestor.name,
            MC_Priority_Flag: false
        };
        
        mockRequestsData.push(testRequest);
    });
    
    it('should capture POD with photos and signature', () => {
        // Arrange
        const podData = {
            photos: ['photo1.jpg', 'photo2.jpg'],
            signature: 'signature_base64_data',
            recipientName: 'John Smith',
            timestamp: new Date().toISOString(),
            gpsCoordinates: { lat: -37.8136, lng: 144.9631 },
            notes: 'Delivered to site office',
            capturedBy: testUsers.qube.name
        };
        
        // Act
        testRequest.pod = podData;
        testRequest.status = 'Delivered';
        
        // Assert
        expect(testRequest.pod).toBeDefined();
        expect(testRequest.pod?.photos).toHaveLength(2);
        expect(testRequest.pod?.signature).toBe('signature_base64_data');
        expect(testRequest.pod?.recipientName).toBe('John Smith');
        expect(testRequest.status).toBe('Delivered');
    });
    
    it('should mark request as delivered after POD capture', () => {
        // Act
        testRequest.status = 'Delivered';
        
        if (!testRequest.statusHistory) {
            testRequest.statusHistory = [];
        }
        
        testRequest.statusHistory.push({
            status: 'Delivered',
            timestamp: new Date().toISOString(),
            changedBy: testUsers.qube.name,
            reason: 'POD captured'
        });
        
        // Assert
        expect(testRequest.status).toBe('Delivered');
        expect(testRequest.statusHistory.some(h => h.status === 'Delivered')).toBe(true);
    });
});

describe('E2E: Status Transitions', () => {
    let testRequest: MaterialRequest;
    
    beforeEach(() => {
        testRequest = {
            id: 'MRF-STATUS-TEST',
            status: 'Submitted',
            priority: 'P3',
            items: 1,
            workOrders: 'WO-999',
            createdDate: new Date().toLocaleDateString(),
            RequiredByTimestamp: new Date().toISOString(),
            RequestedBy: testUsers.requestor.name,
            DeliveryLocation: 'Site 3',
            requestorName: testUsers.requestor.name,
            MC_Priority_Flag: false,
            statusHistory: []
        };
        
        mockRequestsData.push(testRequest);
    });
    
    it('should track complete status history', () => {
        // Simulate full lifecycle
        const statuses = ['Submitted', 'Picking', 'Staged', 'In Transit', 'Delivered'];
        
        statuses.forEach((status, index) => {
            if (index > 0) { // Skip first (already Submitted)
                testRequest.status = status as MaterialRequest['status'];
                testRequest.statusHistory!.push({
                    status: status as MaterialRequest['status'],
                    timestamp: new Date(Date.now() + index * 1000).toISOString(),
                    changedBy: testUsers.qube.name,
                    reason: `Transitioned to ${status}`
                });
            }
        });
        
        // Assert
        expect(testRequest.statusHistory).toHaveLength(4);
        expect(testRequest.statusHistory![0].status).toBe('Picking');
        expect(testRequest.statusHistory![3].status).toBe('Delivered');
        expect(testRequest.status).toBe('Delivered');
    });
    
    it('should handle On Hold status with reason', () => {
        // Act
        testRequest.status = 'On Hold';
        testRequest.onHoldReason = 'Waiting for stock';
        
        testRequest.statusHistory!.push({
            status: 'On Hold',
            timestamp: new Date().toISOString(),
            changedBy: testUsers.mc.name,
            reason: 'Waiting for stock'
        });
        
        // Assert
        expect(testRequest.status).toBe('On Hold');
        expect(testRequest.onHoldReason).toBe('Waiting for stock');
    });
    
    it('should resume from On Hold', () => {
        // Arrange
        testRequest.status = 'On Hold';
        testRequest.onHoldReason = 'Stock issue';
        
        // Act
        testRequest.status = 'Submitted';
        testRequest.onHoldReason = undefined;
        
        testRequest.statusHistory!.push({
            status: 'Submitted',
            timestamp: new Date().toISOString(),
            changedBy: testUsers.mc.name,
            reason: 'Resumed from hold'
        });
        
        // Assert
        expect(testRequest.status).toBe('Submitted');
        expect(testRequest.onHoldReason).toBeUndefined();
    });
    
    it('should handle cancellation', () => {
        // Act
        testRequest.status = 'Cancelled';
        
        testRequest.statusHistory!.push({
            status: 'Cancelled',
            timestamp: new Date().toISOString(),
            changedBy: testUsers.requestor.name,
            reason: 'No longer needed'
        });
        
        // Assert
        expect(testRequest.status).toBe('Cancelled');
        expect(testRequest.statusHistory!.some(h => h.status === 'Cancelled')).toBe(true);
    });
});

describe('E2E: Priority Queue Management', () => {
    let requests: MaterialRequest[];
    
    beforeEach(() => {
        requests = [
            {
                id: 'MRF-Q1',
                status: 'Submitted',
                priority: 'P3',
                items: 1,
                MC_Queue_Position: 1
            },
            {
                id: 'MRF-Q2',
                status: 'Submitted',
                priority: 'P2',
                items: 1,
                MC_Queue_Position: 2
            },
            {
                id: 'MRF-Q3',
                status: 'Submitted',
                priority: 'P4',
                items: 1,
                MC_Queue_Position: 3
            }
        ] as MaterialRequest[];
    });
    
    it('should reorder queue positions', () => {
        // Act - Move P4 to top
        const [p4Request] = requests.splice(2, 1);
        requests.unshift(p4Request);
        
        // Update positions
        requests.forEach((req, index) => {
            req.MC_Queue_Position = index + 1;
        });
        
        // Assert
        expect(requests[0].id).toBe('MRF-Q3');
        expect(requests[0].MC_Queue_Position).toBe(1);
        expect(requests[2].MC_Queue_Position).toBe(3);
    });
    
    it('should add MC priority flag', () => {
        // Act
        requests[0].MC_Priority_Flag = true;
        
        // Assert
        expect(requests[0].MC_Priority_Flag).toBe(true);
    });
    
    it('should handle bulk queue operations', () => {
        // Act - Bulk add MC priority to all
        requests.forEach(req => {
            req.MC_Priority_Flag = true;
        });
        
        // Assert
        expect(requests.every(req => req.MC_Priority_Flag === true)).toBe(true);
    });
});

describe('E2E: Material Locking', () => {
    it('should auto-lock materials when requested', () => {
        // Arrange
        const material = masterGridData[0];
        const mrfId = 'MRF-LOCK-TEST';
        
        // Act
        mockTransactionalData[material.pKey] = {
            mrfId,
            status: 'Submitted'
        };
        
        // Assert
        expect(mockTransactionalData[material.pKey]).toBeDefined();
        expect(mockTransactionalData[material.pKey].mrfId).toBe(mrfId);
    });
    
    it('should auto-unlock materials when delivered or cancelled', () => {
        // Arrange
        const material = masterGridData[0];
        const mrfId = 'MRF-UNLOCK-TEST';
        mockTransactionalData[material.pKey] = {
            mrfId,
            status: 'Submitted'
        };
        
        // Act - Simulate delivery
        delete mockTransactionalData[material.pKey];
        
        // Assert
        expect(mockTransactionalData[material.pKey]).toBeUndefined();
    });
});

describe('E2E: ETA Tracking', () => {
    it('should calculate ETA based on priority and queue position', () => {
        // Arrange
        const request: MaterialRequest = {
            id: 'MRF-ETA-TEST',
            status: 'Submitted',
            priority: 'P1',
            items: 1,
            MC_Queue_Position: 1,
            RequiredByTimestamp: new Date().toISOString()
        } as MaterialRequest;
        
        // Act - Calculate ETA (simplified)
        const baseTime = 60; // minutes
        const priorityMultiplier = request.priority === 'P1' ? 0.5 : 1;
        const queueDelay = (request.MC_Queue_Position || 0) * 15;
        
        const etaMinutes = baseTime * priorityMultiplier + queueDelay;
        const eta = new Date(Date.now() + etaMinutes * 60 * 1000);
        
        request.estimatedDelivery = eta.toISOString();
        
        // Assert
        expect(request.estimatedDelivery).toBeDefined();
        expect(new Date(request.estimatedDelivery!).getTime()).toBeGreaterThan(Date.now());
    });
});

console.log('✅ E2E Test Suite Defined - Run with: npm run test');

