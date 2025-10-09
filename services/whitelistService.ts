/**
 * Whitelist Management Service
 * Manage approved materials, requestors, and locations
 */

export interface WhitelistEntry {
    id: string;
    type: 'material' | 'requestor' | 'location';
    value: string;
    label: string;
    description?: string;
    active: boolean;
    createdAt: string;
    createdBy: string;
}

// In-memory storage
let whitelist: WhitelistEntry[] = [
    // Materials
    {
        id: 'wl-mat-1',
        type: 'material',
        value: 'PIPE-STL-10',
        label: '10-inch Steel Pipe',
        description: 'Standard steel pipe for construction',
        active: true,
        createdAt: '2025-10-01',
        createdBy: 'mc'
    },
    {
        id: 'wl-mat-2',
        type: 'material',
        value: 'VLV-GTE-10',
        label: '10-inch Gate Valve',
        description: 'Gate valve for piping systems',
        active: true,
        createdAt: '2025-10-01',
        createdBy: 'mc'
    },
    // Requestors
    {
        id: 'wl-req-1',
        type: 'requestor',
        value: 'jane.doe@company.com',
        label: 'Jane Doe',
        description: 'Senior Engineer - Team A',
        active: true,
        createdAt: '2025-10-01',
        createdBy: 'mc'
    },
    {
        id: 'wl-req-2',
        type: 'requestor',
        value: 'john.smith@company.com',
        label: 'John Smith',
        description: 'Lead Technician - Team B',
        active: true,
        createdAt: '2025-10-01',
        createdBy: 'mc'
    },
    // Locations
    {
        id: 'wl-loc-1',
        type: 'location',
        value: 'ops-center-1',
        label: 'Ops Center Trailer 1',
        description: 'Main operations center',
        active: true,
        createdAt: '2025-10-01',
        createdBy: 'mc'
    },
    {
        id: 'wl-loc-2',
        type: 'location',
        value: 'laydown-yard-7',
        label: 'Laydown Yard 7',
        description: 'Outdoor storage area 7',
        active: true,
        createdAt: '2025-10-01',
        createdBy: 'mc'
    },
];

/**
 * Get all whitelist entries
 */
export const getAllWhitelistEntries = (
    type?: 'material' | 'requestor' | 'location'
): WhitelistEntry[] => {
    if (type) {
        return whitelist.filter(entry => entry.type === type);
    }
    return [...whitelist];
};

/**
 * Get active whitelist entries
 */
export const getActiveWhitelistEntries = (
    type?: 'material' | 'requestor' | 'location'
): WhitelistEntry[] => {
    return getAllWhitelistEntries(type).filter(entry => entry.active);
};

/**
 * Check if value is whitelisted
 */
export const isWhitelisted = (
    type: 'material' | 'requestor' | 'location',
    value: string
): boolean => {
    return whitelist.some(
        entry => entry.type === type && entry.value === value && entry.active
    );
};

/**
 * Add entry to whitelist
 */
export const addToWhitelist = (
    entry: Omit<WhitelistEntry, 'id' | 'createdAt'>
): string => {
    const id = `wl-${entry.type.substring(0, 3)}-${Date.now()}`;
    whitelist.push({
        ...entry,
        id,
        createdAt: new Date().toISOString()
    });
    return id;
};

/**
 * Update whitelist entry
 */
export const updateWhitelistEntry = (
    id: string,
    updates: Partial<Pick<WhitelistEntry, 'label' | 'description' | 'active'>>
): boolean => {
    const entry = whitelist.find(e => e.id === id);
    if (!entry) return false;
    
    Object.assign(entry, updates);
    return true;
};

/**
 * Delete whitelist entry
 */
export const deleteWhitelistEntry = (id: string): boolean => {
    const index = whitelist.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    whitelist.splice(index, 1);
    return true;
};

/**
 * Toggle entry active status
 */
export const toggleWhitelistEntry = (id: string): boolean => {
    const entry = whitelist.find(e => e.id === id);
    if (!entry) return false;
    
    entry.active = !entry.active;
    return true;
};

/**
 * Bulk import whitelist entries
 */
export const bulkImportWhitelist = (
    entries: Array<Omit<WhitelistEntry, 'id' | 'createdAt'>>
): number => {
    let imported = 0;
    entries.forEach(entry => {
        try {
            addToWhitelist(entry);
            imported++;
        } catch (error) {
            console.error('Failed to import entry:', entry, error);
        }
    });
    return imported;
};

/**
 * Export whitelist as CSV
 */
export const exportWhitelistCSV = (
    type?: 'material' | 'requestor' | 'location'
): string => {
    const entries = type ? getAllWhitelistEntries(type) : getAllWhitelistEntries();
    
    const headers = ['Type', 'Value', 'Label', 'Description', 'Active', 'Created At', 'Created By'];
    const rows = entries.map(entry => [
        entry.type,
        entry.value,
        entry.label,
        entry.description || '',
        entry.active ? 'Yes' : 'No',
        entry.createdAt,
        entry.createdBy
    ]);
    
    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csv;
};
