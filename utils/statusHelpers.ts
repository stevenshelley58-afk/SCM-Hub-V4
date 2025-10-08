import { StatusHistoryEntry } from '../types/index';

const STATUS_FLOW_ORDER: { [key: string]: number } = {
    'Submitted': 1,
    'Picking': 2,
    'Staged': 3,
    'In Transit': 4,
    'Delivered': 5,
    'Partial Pick - Open': 2.5,
    'Partial Pick - Closed': 2.7,
    'On Hold': 0,
    'Cancelled': 0,
    'Short': 0
};

export function addStatusHistoryEntry(
    currentHistory: StatusHistoryEntry[] | undefined,
    newStatus: string,
    changedBy: string,
    reason?: string
): StatusHistoryEntry[] {
    const history = currentHistory || [];
    const lastStatus = history.length > 0 ? history[history.length - 1].status : 'Submitted';
    
    const isBackwards = STATUS_FLOW_ORDER[newStatus] < STATUS_FLOW_ORDER[lastStatus];
    
    const newEntry: StatusHistoryEntry = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        changedBy,
        reason,
        isBackwards
    };
    
    return [...history, newEntry];
}

export function isBackwardsTransition(fromStatus: string, toStatus: string): boolean {
    return STATUS_FLOW_ORDER[toStatus] < STATUS_FLOW_ORDER[fromStatus];
}

