

// Fix: Corrected import path for types.
import { User, MaterialRequest, DeliveryLocation } from '../types/index';

// --- DATA STORE ---
export const users: { [key: string]: User} = {
    requestor: { id: 'requestor', name: 'Jane Doe', role: 'Requestor', phone: '555-123-4567' },
    ac: { id: 'ac', name: 'Steve', role: 'Area Coordinator' },
    qube: { id: 'qube', name: 'JJ', role: 'Qube User' },
    mc: { id: 'mc', name: 'Corey', role: 'Material Coordinator' }
};

// Helper function to generate full address
const generateFullAddress = (building: string, floor?: string, room?: string): string => {
    let address = building;
    if (floor) address += `, ${floor}`;
    if (room) address += `, Room ${room}`;
    return address;
};

// Delivery Locations
export const mockLocations: DeliveryLocation[] = [
    {
        id: 'LOC001',
        building: 'Admin Building',
        floor: 'Ground Floor',
        room: '101',
        fullAddress: 'Admin Building, Ground Floor, Room 101',
        contactPerson: 'John Smith',
        contactPhone: '555-0101',
        deliveryInstructions: 'Reception desk, sign in required',
        isActive: true
    },
    {
        id: 'LOC002',
        building: 'Workshop A',
        floor: 'Level 1',
        room: 'Bay 3',
        fullAddress: 'Workshop A, Level 1, Room Bay 3',
        contactPerson: 'Sarah Johnson',
        contactPhone: '555-0102',
        deliveryInstructions: 'Enter through loading dock, ask for supervisor',
        isActive: true
    },
    {
        id: 'LOC003',
        building: 'Warehouse 1',
        floor: undefined,
        room: 'Section A-3',
        fullAddress: 'Warehouse 1, Room Section A-3',
        contactPerson: 'Mike Davis',
        contactPhone: '555-0103',
        isActive: true
    },
    {
        id: 'LOC004',
        building: 'Engineering Office',
        floor: 'Level 2',
        room: '205',
        fullAddress: 'Engineering Office, Level 2, Room 205',
        contactPerson: 'Emily Chen',
        contactPhone: '555-0104',
        deliveryInstructions: 'Use service elevator, card access required',
        isActive: true
    },
    {
        id: 'LOC005',
        building: 'Maintenance Yard',
        floor: undefined,
        room: 'Tool Crib',
        fullAddress: 'Maintenance Yard, Room Tool Crib',
        contactPerson: 'Tom Wilson',
        contactPhone: '555-0105',
        isActive: true
    },
    {
        id: 'LOC006',
        building: 'Production Hall B',
        floor: 'Ground Floor',
        room: 'Station 12',
        fullAddress: 'Production Hall B, Ground Floor, Room Station 12',
        contactPerson: 'Lisa Martinez',
        contactPhone: '555-0106',
        deliveryInstructions: 'Deliver during shift change (7am-8am or 3pm-4pm)',
        isActive: true
    },
    {
        id: 'LOC007',
        building: 'Old Workshop',
        floor: undefined,
        room: undefined,
        fullAddress: 'Old Workshop',
        contactPerson: undefined,
        contactPhone: undefined,
        deliveryInstructions: 'No longer in use',
        isActive: false
    }
];

// Location CRUD functions
export const addLocation = (locationData: Partial<DeliveryLocation>): DeliveryLocation => {
    const newLocation: DeliveryLocation = {
        id: `LOC${String(mockLocations.length + 1).padStart(3, '0')}`,
        building: locationData.building || '',
        floor: locationData.floor,
        room: locationData.room,
        fullAddress: generateFullAddress(
            locationData.building || '',
            locationData.floor,
            locationData.room
        ),
        contactPerson: locationData.contactPerson,
        contactPhone: locationData.contactPhone,
        deliveryInstructions: locationData.deliveryInstructions,
        isActive: locationData.isActive !== false
    };
    mockLocations.push(newLocation);
    return newLocation;
};

export const updateLocation = (id: string, updates: Partial<DeliveryLocation>): DeliveryLocation => {
    const index = mockLocations.findIndex(loc => loc.id === id);
    if (index !== -1) {
        mockLocations[index] = {
            ...mockLocations[index],
            ...updates,
            fullAddress: generateFullAddress(
                updates.building || mockLocations[index].building,
                updates.floor !== undefined ? updates.floor : mockLocations[index].floor,
                updates.room !== undefined ? updates.room : mockLocations[index].room
            )
        };
        return mockLocations[index];
    }
    throw new Error('Location not found');
};

export const deleteLocation = (id: string): void => {
    const index = mockLocations.findIndex(loc => loc.id === id);
    if (index !== -1) {
        mockLocations.splice(index, 1);
    }
};

// --- DATA GENERATION (Simulating large DB table) ---
const generateLargeData = (count: number) => {
    const teams = ['A', 'B', 'C', 'D', 'X', 'Y', 'Z'];
    const locations = ['Yard A', 'Yard B', 'Whse 1, A3', 'Whse 1, B7', 'Whse 2, D4', 'Stores'];
    const baseItems = [
        { jde: 'PIPE-STL-10', desc: '10-inch Steel Pipe' }, { jde: 'VLV-GTE-10', desc: '10-inch Gate Valve' },
        { jde: 'GSK-SPR-10', desc: '10-inch Gasket' }, { jde: 'WLD-ROD-7018', desc: 'Welding Rod E7018' },
        { jde: 'FLG-WN-10', desc: '10-inch Weld Neck Flange' }, { jde: 'BLT-STD-1', desc: '1-inch Stud Bolt Kit' },
        { jde: 'RAG-WIP-BX', desc: 'Box of Wiping Rags' }, { jde: 'PUMP-CNTR-5', desc: '5HP Centrifugal Pump' },
        { jde: 'MTR-5HP-3PH', desc: '5HP 3-Phase Motor' }, { jde: 'CTRL-PNL-5HP', desc: '5HP Motor Control Panel' }
    ];
    const data = [];
    for (let i = 0; i < count; i++) {
        const item = baseItems[i % baseItems.length];
        const woNum = 12345 + Math.floor(i / 20);
        const packNum = (i % 5 === 0 && i % 10 !== 0) ? `PACK${String(Math.floor(i/5)).padStart(3, '0')}` : 'N/A';
        
        data.push({
            pKey: `82267${String(10000 + i).padStart(5, '0')}`,
            workOrder: `WO${woNum}`,
            lineNumber: String(i % 20 + 1).padStart(3, '0'),
            opsSeq: String(10 * ((i % 4) + 1)),
            team: teams[i % teams.length],
            packNumber: packNum,
            storageLocation: locations[i % locations.length],
            jdeItemNo: item.jde,
            materialDescription: item.desc,
            workOrderQty: Math.floor(Math.random() * 200) + 1,
        });
    }
    return data;
};

export const masterGridData = generateLargeData(1000);

// In-App Transactional Data (Mock "Live Reality")
export let mockTransactionalData: { [key: string]: { mrfId: string; status: string } } = {
    "8226710000": { "mrfId": "MRF-1135", "status": "Delivered" }, // pKey for i=0
    "8226710002": { "mrfId": "MRF-1136", "status": "In Transit" }, // pKey for i=2
    "8226710003": { "mrfId": "MRF-1137", "status": "Partial Pick - Open" } // pKey for i=3
};

export let mockMaterialLocks: { [key: string]: { lockedBy: string; comment: string } } = {
    "8226710005": { "lockedBy": "Steve", "comment": "Reserved for critical path job on Friday" },
    "8226710006": { "lockedBy": "Steve", "comment": "Hold for hydrotest package" }
};

// Fix: Explicitly typed `mockRequestsData` as `MaterialRequest[]` to ensure type compatibility for properties like `status` and `priority`, resolving type errors in consuming components.
export let mockRequestsData: MaterialRequest[] = [
    { id: 'MRF-1240', status: 'Submitted', priority: 'P2', items: 6, workOrders: '822671', createdDate: '07/13/2025', RequiredByTimestamp: '2025-07-14T08:00:00Z', MC_Priority_Flag: false, DeliveryLocation: 'Ops Center Trailer 1', requestorName: 'Jane Doe', acPriority: 3 },
    { id: 'MRF-1239', status: 'Picking', priority: 'P3', items: 3, workOrders: '822671', createdDate: '07/13/2025', RequiredByTimestamp: '2025-07-14T10:00:00Z', MC_Priority_Flag: false, DeliveryLocation: 'Laydown Yard 7', requestorName: 'Jane Doe', acPriority: null },
    { id: 'MRF-1238', status: 'In Transit', priority: 'P2', items: 8, workOrders: '822670', createdDate: '07/12/2025', RequiredByTimestamp: '2025-07-13T11:00:00Z', MC_Priority_Flag: false, DeliveryLocation: 'Weld Shop', requestorName: 'John Smith', acPriority: null },
    { id: 'MRF-1237', status: 'Partial Pick - Closed', priority: 'P4', items: 1, workOrders: '844123', createdDate: '07/12/2025', RequiredByTimestamp: '2025-07-15T16:00:00Z', MC_Priority_Flag: false, DeliveryLocation: 'Unit 12 Work Area', requestorName: 'Jane Doe', acPriority: null },
    { id: 'MRF-1236', status: 'Picking', priority: 'P2', items: 12, workOrders: '855798', createdDate: '07/12/2025', RequiredByTimestamp: '2025-07-13T09:00:00Z', MC_Priority_Flag: false, DeliveryLocation: 'Laydown Yard 7', requestorName: 'Mike Jones', acPriority: null },
    { id: 'MRF-1235', status: 'In Transit', priority: 'P3', items: 4, workOrders: '855798', createdDate: '07/12/2025', RequiredByTimestamp: '2025-07-13T14:00:00Z', MC_Priority_Flag: false, DeliveryLocation: 'Ops Center Trailer 1', requestorName: 'Jane Doe', acPriority: null },
    { id: 'MRF-1234', status: 'Submitted', priority: 'P2', items: 5, workOrders: '822670', createdDate: '07/10/2025', RequiredByTimestamp: '2025-07-13T16:00:00Z', MC_Priority_Flag: false, DeliveryLocation: 'Weld Shop', requestorName: 'John Smith', acPriority: 2 },
    { id: 'MRF-1232', status: 'Submitted', priority: 'P1', items: 2, workOrders: '855798', createdDate: '07/12/2025', RequiredByTimestamp: '2025-07-13T08:00:00Z', MC_Priority_Flag: true, DeliveryLocation: 'Unit 12 Work Area', requestorName: 'Jane Doe', acPriority: 1 },
    { id: 'MRF-1198', status: 'Delivered', priority: 'P4', items: 1, workOrders: '857330', createdDate: '07/13/2025', RequiredByTimestamp: '2025-06-13T16:00:00Z', MC_Priority_Flag: false, DeliveryLocation: 'Ops Center Trailer 1', requestorName: 'Mike Jones', acPriority: null },
];

export let mockRequestItems = {
    'MRF-1240': [
        { pKey: 'LI-001', status: 'Open', qtyRequested: 10, materialDescription: '10-inch Steel Pipe', itemNumber: 'PIPE-STL-10', storageLocation: 'Whse 1, A3', packNumber: 'PACK001' },
        { pKey: 'LI-002', status: 'Open', qtyRequested: 10, materialDescription: '10-inch Gate Valve', itemNumber: 'VLV-GTE-10', storageLocation: 'Whse 1, B7', packNumber: 'PACK001' },
        { pKey: 'LI-003', status: 'Open', qtyRequested: 20, materialDescription: '10-inch Gasket', itemNumber: 'GSK-SPR-10', storageLocation: 'Stores', packNumber: 'PACK001' },
        { pKey: 'LI-004', status: 'Open', qtyRequested: 50, materialDescription: 'Welding Rod E7018', itemNumber: 'WLD-ROD-7018', storageLocation: 'Whse 2, D4', packNumber: 'N/A' },
        { pKey: 'LI-005', status: 'Open', qtyRequested: 5, materialDescription: 'Box of Wiping Rags', itemNumber: 'RAG-WIP-BX', storageLocation: 'Stores', packNumber: 'N/A' },
        { pKey: 'LI-006', status: 'Open', qtyRequested: 2, materialDescription: '5HP Centrifugal Pump', itemNumber: 'PUMP-CNTR-5', storageLocation: 'Yard A', packNumber: 'N/A' },
    ],
    'MRF-1234': [
        { pKey: 'LI-007', status: 'Open', qtyRequested: 1, materialDescription: '10-inch Weld Neck Flange', itemNumber: 'FLG-WN-10', storageLocation: 'Yard B', packNumber: 'N/A' },
        { pKey: 'LI-008', status: 'Open', qtyRequested: 8, materialDescription: '1-inch Stud Bolt Kit', itemNumber: 'BLT-STD-1', storageLocation: 'Stores', packNumber: 'N/A' },
        { pKey: 'LI-009', status: 'Open', qtyRequested: 1, materialDescription: '5HP 3-Phase Motor', itemNumber: 'MTR-5HP-3PH', storageLocation: 'Yard A', packNumber: 'N/A' },
        { pKey: 'LI-010', status: 'Open', qtyRequested: 1, materialDescription: '5HP Motor Control Panel', itemNumber: 'CTRL-PNL-5HP', storageLocation: 'Yard A', packNumber: 'N/A' },
        { pKey: 'LI-011', status: 'Open', qtyRequested: 12, materialDescription: 'Welding Rod E7018', itemNumber: 'WLD-ROD-7018', storageLocation: 'Whse 2, D4', packNumber: 'N/A' }
    ],
    'MRF-1232': [
        { pKey: 'LI-012', status: 'Open', qtyRequested: 4, materialDescription: '10-inch Gasket', itemNumber: 'GSK-SPR-10', storageLocation: 'Stores', packNumber: 'N/A' },
        { pKey: 'LI-013', status: 'Open', qtyRequested: 2, materialDescription: 'Box of Wiping Rags', itemNumber: 'RAG-WIP-BX', storageLocation: 'Stores', packNumber: 'N/A' },
    ]
};

// Renamed from exceptionReasons to shortReasons per stakeholder feedback
export const exceptionReasons = ['Item Damaged', 'Quantity Mismatch', 'Location Empty', 'Wrong Item in Location', 'Quarantine', 'Other'];
export const shortReasons = ['Item Damaged', 'Quantity Mismatch', 'Location Empty', 'Wrong Item in Location', 'Quarantine', 'Other'];

export const navLinks: { [key: string]: { view: string; label: string; icon: string }[] } = {
    requestor: [
        { view: 'wo-materials', label: 'WO Materials', icon: 'DocumentTextIcon' },
        { view: 'material-requests', label: 'Material Requests', icon: 'RocketLaunchIcon' }
    ],
    ac: [
        { view: 'ac-scope-command', label: 'My Scope Dashboard', icon: 'ChartPieIcon' },
        { view: 'wo-materials', label: 'WO Materials', icon: 'DocumentTextIcon' },
        { view: 'material-requests', label: 'Material Requests', icon: 'RocketLaunchIcon' }
    ],
    qube: [
        { view: 'picklist', label: 'Qube Pick List', icon: 'QueueListIcon' },
        { view: 'onhold', label: 'On Hold', icon: 'PauseCircleIcon' }
    ],
    mc: [
        { view: 'p1-approval', label: 'P1 Approval Queue', icon: 'FireIcon' },
        { view: 'priority-queue', label: 'Priority Queue', icon: 'QueueListIcon' },
        { view: 'workflow-diagram', label: 'Workflow Diagram', icon: 'DocumentTextIcon' },
        { view: 'location-management', label: 'Delivery Locations', icon: 'MapPinIcon' },
        { view: 'control-panel', label: 'Control Panel', icon: 'Cog8ToothIcon' }
    ]
};