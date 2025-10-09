import type { MaterialRequest } from '../types/index';

// Export data to CSV format
export const exportToCSV = (data: any[], filename: string): void => {
    if (data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => 
            headers.map(header => {
                let value = row[header];
                
                // Handle objects and arrays
                if (typeof value === 'object' && value !== null) {
                    value = JSON.stringify(value);
                }
                
                // Handle null/undefined
                if (value === null || value === undefined) {
                    value = '';
                }
                
                // Escape quotes and wrap in quotes if contains comma
                value = String(value).replace(/"/g, '""');
                if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                    value = `"${value}"`;
                }
                
                return value;
            }).join(',')
        )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
};

// Export data to Excel-compatible format (TSV)
export const exportToExcel = (data: any[], filename: string): void => {
    if (data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create TSV content (Tab Separated Values - Excel-friendly)
    const tsvContent = [
        headers.join('\t'), // Header row
        ...data.map(row => 
            headers.map(header => {
                let value = row[header];
                
                // Handle objects and arrays
                if (typeof value === 'object' && value !== null) {
                    value = JSON.stringify(value);
                }
                
                // Handle null/undefined
                if (value === null || value === undefined) {
                    value = '';
                }
                
                return String(value);
            }).join('\t')
        )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.xls`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
};

// Export material requests with formatting
export const exportMaterialRequests = (requests: MaterialRequest[], format: 'csv' | 'excel' = 'excel'): void => {
    const exportData = requests.map(req => ({
        'Request ID': req.id,
        'Status': req.status,
        'Priority': req.priority,
        'Items': req.items,
        'Work Orders': req.workOrders,
        'Created Date': req.createdDate,
        'Required By': new Date(req.RequiredByTimestamp).toLocaleString(),
        'Requested By': req.requestorName,
        'Delivery Location': req.DeliveryLocation,
        'MC Priority Flag': req.MC_Priority_Flag ? 'Yes' : 'No',
        'AC Priority': req.acPriority || 'N/A'
    }));

    const filename = `material-requests-${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
        exportToCSV(exportData, filename);
    } else {
        exportToExcel(exportData, filename);
    }
};

// Parse CSV file
export const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        
        data.push(row);
    }

    return data;
};

// Import CSV file
export const importFromCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data = parseCSV(text);
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
};

// Export to JSON
export const exportToJSON = (data: any[], filename: string): void => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
};

// Import from JSON
export const importFromJSON = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const data = JSON.parse(text);
                resolve(Array.isArray(data) ? data : [data]);
            } catch (error) {
                reject(new Error('Invalid JSON format'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
};
