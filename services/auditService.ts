import { AuditLogEntry } from '../types';

// Mock audit log storage (in production, this would be persisted to database)
let auditLog: AuditLogEntry[] = [];

/**
 * Log an audit entry
 */
export const logAuditEntry = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void => {
    const newEntry: AuditLogEntry = {
        id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        ...entry
    };
    
    auditLog.unshift(newEntry); // Add to beginning for newest first
    
    // Keep only last 10000 entries in memory
    if (auditLog.length > 10000) {
        auditLog = auditLog.slice(0, 10000);
    }
    
    console.log('[AUDIT]', newEntry);
};

/**
 * Get audit log with optional filters
 */
export const getAuditLog = (filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
}): AuditLogEntry[] => {
    let filtered = [...auditLog];
    
    if (filters?.userId) {
        filtered = filtered.filter(entry => entry.userId === filters.userId);
    }
    
    if (filters?.action) {
        filtered = filtered.filter(entry => entry.action === filters.action);
    }
    
    if (filters?.entityType) {
        filtered = filtered.filter(entry => entry.entityType === filters.entityType);
    }
    
    if (filters?.entityId) {
        filtered = filtered.filter(entry => entry.entityId === filters.entityId);
    }
    
    if (filters?.startDate) {
        filtered = filtered.filter(entry => entry.timestamp >= filters.startDate!);
    }
    
    if (filters?.endDate) {
        filtered = filtered.filter(entry => entry.timestamp <= filters.endDate!);
    }
    
    const limit = filters?.limit || 100;
    return filtered.slice(0, limit);
};

/**
 * Get audit log for a specific entity
 */
export const getEntityAuditLog = (entityType: string, entityId: string): AuditLogEntry[] => {
    return auditLog.filter(
        entry => entry.entityType === entityType && entry.entityId === entityId
    );
};

/**
 * Clear audit log (admin only)
 */
export const clearAuditLog = (): void => {
    auditLog = [];
    console.log('[AUDIT] Log cleared');
};

/**
 * Export audit log as CSV
 */
export const exportAuditLogCSV = (entries: AuditLogEntry[]): string => {
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details'];
    const rows = entries.map(entry => [
        entry.id,
        entry.timestamp,
        entry.userName,
        entry.action,
        entry.entityType,
        entry.entityId,
        JSON.stringify(entry.details)
    ]);
    
    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csv;
};

// Seed some initial audit data for demonstration
const seedAuditData = () => {
    const actions: AuditLogEntry['action'][] = ['status_change', 'priority_change', 'create_request', 'approval', 'manual_override'];
    const users = [
        { id: 'mc', name: 'Corey' },
        { id: 'ac', name: 'Steve' },
        { id: 'qube', name: 'JJ' },
        { id: 'requestor', name: 'Jane Doe' }
    ];
    
    for (let i = 0; i < 50; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const entityId = `MRF-${1200 + Math.floor(Math.random() * 50)}`;
        
        const entry: Omit<AuditLogEntry, 'id' | 'timestamp'> = {
            userId: user.id,
            userName: user.name,
            action,
            entityType: 'material_request',
            entityId,
            details: {
                before: action === 'status_change' ? 'Submitted' : 'P3',
                after: action === 'status_change' ? 'Picking' : 'P2',
                reason: 'Updated per coordinator request'
            }
        };
        
        // Set timestamp to various times in the past
        const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
        auditLog.push({
            id: `AUDIT-SEED-${i}`,
            timestamp,
            ...entry
        });
    }
    
    // Sort by timestamp desc
    auditLog.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

seedAuditData();
