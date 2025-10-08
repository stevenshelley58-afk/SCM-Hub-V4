export interface User {
    id: 'requestor' | 'ac' | 'qube' | 'mc';
    name: string;
    role: string;
    phone?: string;
}

export interface MaterialRequest {
    id: string;
    status: 'Submitted' | 'Picking' | 'In Transit' | 'Exception' | 'Delivered' | 'Ready for Collection';
    priority: 'P1' | 'P2' | 'P3' | 'P4';
    items: number;
    workOrders: string;
    createdDate: string;
    RequiredByTimestamp: string;
    MC_Priority_Flag: boolean;
    DeliveryLocation: string;
    requestorName: string;
    acPriority: number | null;
}

export interface RequestItem {
    pKey: string;
    status: 'Open' | 'Picked' | 'Exception';
    qtyRequested: number;
    materialDescription: string;
    itemNumber: string;
    storageLocation: string;
    packNumber: string;
}

export interface WOMaterial {
    pKey: string;
    workOrder: string;
    lineNumber: string;
    opsSeq: string;
    team: string;
    packNumber: string;
    storageLocation: string;
    jdeItemNo: string;
    materialDescription: string;
    workOrderQty: number;
    isDisabled?: boolean;
    onClick?: (row: any) => void;
}

export interface LockInfo {
    lockedBy: string;
    comment: string;
}
