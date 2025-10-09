/**
 * Search Optimization Utilities
 * Fuzzy search, highlighting, history, and advanced filtering
 */

/**
 * Fuzzy search - matches even with typos or partial matches
 */
export const fuzzyMatch = (searchTerm: string, target: string): boolean => {
    if (!searchTerm || !target) return false;
    
    searchTerm = searchTerm.toLowerCase();
    target = target.toLowerCase();
    
    let searchIndex = 0;
    let targetIndex = 0;
    
    while (searchIndex < searchTerm.length && targetIndex < target.length) {
        if (searchTerm[searchIndex] === target[targetIndex]) {
            searchIndex++;
        }
        targetIndex++;
    }
    
    return searchIndex === searchTerm.length;
};

/**
 * Calculate fuzzy search score (0-1, higher is better)
 */
export const fuzzyScore = (searchTerm: string, target: string): number => {
    if (!searchTerm || !target) return 0;
    
    searchTerm = searchTerm.toLowerCase();
    target = target.toLowerCase();
    
    // Exact match gets highest score
    if (target.includes(searchTerm)) {
        return 1.0;
    }
    
    // Start of string bonus
    if (target.startsWith(searchTerm)) {
        return 0.9;
    }
    
    // Fuzzy match score
    let score = 0;
    let searchIndex = 0;
    let consecutiveMatches = 0;
    
    for (let i = 0; i < target.length && searchIndex < searchTerm.length; i++) {
        if (target[i] === searchTerm[searchIndex]) {
            score += 0.1;
            consecutiveMatches++;
            
            // Bonus for consecutive matches
            if (consecutiveMatches > 1) {
                score += 0.05 * consecutiveMatches;
            }
            
            searchIndex++;
        } else {
            consecutiveMatches = 0;
        }
    }
    
    // Penalty for incomplete matches
    if (searchIndex < searchTerm.length) {
        score *= (searchIndex / searchTerm.length);
    }
    
    return Math.min(score, 0.85); // Cap fuzzy matches below exact matches
};

/**
 * Highlight matching characters in text
 */
export const highlightMatches = (
    text: string,
    searchTerm: string,
    highlightClass: string = 'bg-yellow-200 dark:bg-yellow-900 font-semibold'
): string => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    return text.replace(regex, `<span class="${highlightClass}">$1</span>`);
};

/**
 * Get highlighted matches as JSX elements
 */
export const getHighlightedText = (text: string, searchTerm: string): (string | { type: 'mark'; text: string })[] => {
    if (!searchTerm || !text) return [text];
    
    const parts: (string | { type: 'mark'; text: string })[] = [];
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }
        
        // Add highlighted match
        parts.push({ type: 'mark', text: match[0] });
        
        lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }
    
    return parts;
};

/**
 * Escape special regex characters
 */
const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Search History Manager
 */
class SearchHistoryManager {
    private storageKey = 'search-history';
    private maxHistory = 10;
    
    getHistory(): string[] {
        try {
            const history = localStorage.getItem(this.storageKey);
            return history ? JSON.parse(history) : [];
        } catch {
            return [];
        }
    }
    
    addToHistory(term: string): void {
        if (!term || term.trim().length < 2) return;
        
        term = term.trim();
        let history = this.getHistory();
        
        // Remove duplicate if exists
        history = history.filter(h => h.toLowerCase() !== term.toLowerCase());
        
        // Add to beginning
        history.unshift(term);
        
        // Limit size
        history = history.slice(0, this.maxHistory);
        
        localStorage.setItem(this.storageKey, JSON.stringify(history));
    }
    
    clearHistory(): void {
        localStorage.removeItem(this.storageKey);
    }
}

export const searchHistory = new SearchHistoryManager();

/**
 * Advanced filtering
 */
export interface FilterCriteria {
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
    value: any;
}

export const applyFilter = (item: any, filter: FilterCriteria): boolean => {
    const fieldValue = item[filter.field];
    
    if (fieldValue === undefined || fieldValue === null) return false;
    
    switch (filter.operator) {
        case 'equals':
            return fieldValue === filter.value;
        
        case 'contains':
            return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
        
        case 'startsWith':
            return String(fieldValue).toLowerCase().startsWith(String(filter.value).toLowerCase());
        
        case 'endsWith':
            return String(fieldValue).toLowerCase().endsWith(String(filter.value).toLowerCase());
        
        case 'gt':
            return fieldValue > filter.value;
        
        case 'lt':
            return fieldValue < filter.value;
        
        case 'gte':
            return fieldValue >= filter.value;
        
        case 'lte':
            return fieldValue <= filter.value;
        
        default:
            return false;
    }
};

/**
 * Multi-field search
 */
export const multiFieldSearch = <T extends Record<string, any>>(
    items: T[],
    searchTerm: string,
    fields: (keyof T)[]
): T[] => {
    if (!searchTerm) return items;
    
    return items
        .map(item => {
            // Calculate best match score across all fields
            let bestScore = 0;
            
            for (const field of fields) {
                const value = String(item[field] || '');
                const score = fuzzyScore(searchTerm, value);
                bestScore = Math.max(bestScore, score);
            }
            
            return { item, score: bestScore };
        })
        .filter(result => result.score > 0.1) // Minimum threshold
        .sort((a, b) => b.score - a.score) // Sort by relevance
        .map(result => result.item);
};

/**
 * Debounce search input
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;
    
    return function(...args: Parameters<T>) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Parse search query for advanced operators
 * Example: "priority:P1 status:Picking John"
 */
export const parseSearchQuery = (query: string): {
    filters: FilterCriteria[];
    freeText: string;
} => {
    const filters: FilterCriteria[] = [];
    const parts: string[] = [];
    
    // Match field:value patterns
    const regex = /(\w+):([^\s]+)/g;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(query)) !== null) {
        // Add text before match as free text
        if (match.index > lastIndex) {
            parts.push(query.substring(lastIndex, match.index));
        }
        
        // Add as filter
        filters.push({
            field: match[1],
            operator: 'contains',
            value: match[2]
        });
        
        lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < query.length) {
        parts.push(query.substring(lastIndex));
    }
    
    const freeText = parts.join(' ').trim();
    
    return { filters, freeText };
};

/**
 * Search with filters and free text
 */
export const advancedSearch = <T extends Record<string, any>>(
    items: T[],
    query: string,
    searchFields: (keyof T)[]
): T[] => {
    const { filters, freeText } = parseSearchQuery(query);
    
    // Apply filters first
    let results = items;
    for (const filter of filters) {
        results = results.filter(item => applyFilter(item, filter));
    }
    
    // Then apply free text search
    if (freeText) {
        results = multiFieldSearch(results, freeText, searchFields);
    }
    
    return results;
};

