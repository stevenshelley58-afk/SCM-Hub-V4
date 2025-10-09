// Rate Limiting Service
// Prevents API abuse and manages request throttling

export interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
    message?: string;
}

export interface RateLimitInfo {
    remaining: number;
    resetAt: Date;
    limit: number;
}

interface RateLimitRecord {
    count: number;
    resetAt: number;
}

const rateLimitStore: Map<string, RateLimitRecord> = new Map();

// Default rate limits for different operations
export const defaultRateLimits: { [key: string]: RateLimitConfig } = {
    api: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100,
        message: 'Too many API requests. Please try again later.'
    },
    create_request: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
        message: 'Too many requests created. Please slow down.'
    },
    search: {
        windowMs: 10 * 1000, // 10 seconds
        maxRequests: 20,
        message: 'Search rate limit exceeded. Please wait.'
    },
    export: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 5,
        message: 'Export rate limit exceeded. Please wait before exporting again.'
    },
    notification: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 50,
        message: 'Notification rate limit exceeded.'
    }
};

// Check if request is within rate limit
export const checkRateLimit = (
    identifier: string, // e.g., userId, IP address
    operation: string = 'api'
): { allowed: boolean; info: RateLimitInfo } => {
    const config = defaultRateLimits[operation] || defaultRateLimits.api;
    const key = `${identifier}:${operation}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);

    // Clean up expired record
    if (record && record.resetAt <= now) {
        rateLimitStore.delete(key);
        record = undefined;
    }

    // Create new record if doesn't exist
    if (!record) {
        record = {
            count: 0,
            resetAt: now + config.windowMs
        };
        rateLimitStore.set(key, record);
    }

    // Increment counter
    record.count++;

    const remaining = Math.max(0, config.maxRequests - record.count);
    const allowed = record.count <= config.maxRequests;

    return {
        allowed,
        info: {
            remaining,
            resetAt: new Date(record.resetAt),
            limit: config.maxRequests
        }
    };
};

// Reset rate limit for user
export const resetRateLimit = (identifier: string, operation?: string): void => {
    if (operation) {
        const key = `${identifier}:${operation}`;
        rateLimitStore.delete(key);
    } else {
        // Reset all operations for this identifier
        const keysToDelete: string[] = [];
        rateLimitStore.forEach((_, key) => {
            if (key.startsWith(`${identifier}:`)) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => rateLimitStore.delete(key));
    }
};

// Get current rate limit status
export const getRateLimitStatus = (identifier: string, operation: string = 'api'): RateLimitInfo => {
    const config = defaultRateLimits[operation] || defaultRateLimits.api;
    const key = `${identifier}:${operation}`;
    const record = rateLimitStore.get(key);
    const now = Date.now();

    if (!record || record.resetAt <= now) {
        return {
            remaining: config.maxRequests,
            resetAt: new Date(now + config.windowMs),
            limit: config.maxRequests
        };
    }

    return {
        remaining: Math.max(0, config.maxRequests - record.count),
        resetAt: new Date(record.resetAt),
        limit: config.maxRequests
    };
};

// Throttle function execution
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;
    let lastArgs: Parameters<T> | null = null;

    return function throttled(...args: Parameters<T>) {
        lastArgs = args;

        if (!timeout) {
            timeout = setTimeout(() => {
                if (lastArgs) {
                    func(...lastArgs);
                }
                timeout = null;
                lastArgs = null;
            }, wait);
        }
    };
};

// Debounce function execution
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;

    return function debounced(...args: Parameters<T>) {
        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            func(...args);
            timeout = null;
        }, wait);
    };
};

// Queue manager for overflow protection
export class RequestQueue {
    private queue: Array<{ fn: () => Promise<any>; resolve: (value: any) => void; reject: (reason: any) => void }> = [];
    private processing = false;
    private maxQueueSize: number;
    private concurrency: number;
    private activeCount = 0;

    constructor(maxQueueSize: number = 100, concurrency: number = 5) {
        this.maxQueueSize = maxQueueSize;
        this.concurrency = concurrency;
    }

    async add<T>(fn: () => Promise<T>): Promise<T> {
        if (this.queue.length >= this.maxQueueSize) {
            throw new Error('Queue is full. Please try again later.');
        }

        return new Promise((resolve, reject) => {
            this.queue.push({ fn, resolve, reject });
            this.process();
        });
    }

    private async process(): Promise<void> {
        if (this.processing || this.activeCount >= this.concurrency) {
            return;
        }

        const item = this.queue.shift();
        if (!item) {
            return;
        }

        this.processing = true;
        this.activeCount++;

        try {
            const result = await item.fn();
            item.resolve(result);
        } catch (error) {
            item.reject(error);
        } finally {
            this.activeCount--;
            this.processing = false;
            
            // Process next item
            if (this.queue.length > 0) {
                this.process();
            }
        }
    }

    size(): number {
        return this.queue.length;
    }

    clear(): void {
        this.queue = [];
    }
}

// Global request queue instance
export const globalRequestQueue = new RequestQueue(100, 5);

// Clean up expired rate limit records periodically
setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    rateLimitStore.forEach((record, key) => {
        if (record.resetAt <= now) {
            keysToDelete.push(key);
        }
    });
    
    keysToDelete.forEach(key => rateLimitStore.delete(key));
}, 60 * 1000); // Clean up every minute
