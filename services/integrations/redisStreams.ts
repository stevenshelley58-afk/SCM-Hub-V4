/**
 * Redis Streams Client
 * Event-driven integration infrastructure
 */

// Mock implementation for frontend development
// In production, this would connect to Redis server via backend API

export interface StreamMessage {
    id: string;
    data: Record<string, any>;
    timestamp: number;
}

export interface Stream {
    name: string;
    messages: StreamMessage[];
}

class RedisStreamsClient {
    private streams: Map<string, StreamMessage[]> = new Map();
    private consumers: Map<string, ((message: StreamMessage) => void)[]> = new Map();
    private lastIds: Map<string, string> = new Map();
    private pollingIntervals: Map<string, number> = new Map();

    /**
     * Publish event to stream
     */
    async publish(streamName: string, data: Record<string, any>): Promise<string> {
        console.log(`📤 Publishing to ${streamName}:`, data);

        const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const message: StreamMessage = {
            id: messageId,
            data,
            timestamp: Date.now(),
        };

        // Get or create stream
        if (!this.streams.has(streamName)) {
            this.streams.set(streamName, []);
        }

        const stream = this.streams.get(streamName)!;
        stream.push(message);

        // Notify consumers
        this.notifyConsumers(streamName, message);

        // Log to localStorage for persistence
        this.persistMessage(streamName, message);

        return messageId;
    }

    /**
     * Subscribe to stream
     */
    async subscribe(
        streamName: string,
        consumerGroup: string,
        consumer: string,
        handler: (message: StreamMessage) => void | Promise<void>
    ): Promise<() => void> {
        console.log(`📥 Subscribing to ${streamName} as ${consumerGroup}:${consumer}`);

        // Register consumer
        const key = `${streamName}:${consumerGroup}:${consumer}`;
        if (!this.consumers.has(key)) {
            this.consumers.set(key, []);
        }
        this.consumers.get(key)!.push(handler);

        // Start polling for messages
        const intervalId = window.setInterval(() => {
            this.pollStream(streamName, key, handler);
        }, 1000); // Poll every second

        this.pollingIntervals.set(key, intervalId);

        // Return unsubscribe function
        return () => {
            const consumers = this.consumers.get(key) || [];
            const index = consumers.indexOf(handler);
            if (index > -1) {
                consumers.splice(index, 1);
            }

            const interval = this.pollingIntervals.get(key);
            if (interval) {
                clearInterval(interval);
                this.pollingIntervals.delete(key);
            }
        };
    }

    /**
     * Read messages from stream
     */
    async readMessages(
        streamName: string,
        count: number = 10,
        startId: string = '0'
    ): Promise<StreamMessage[]> {
        const stream = this.streams.get(streamName) || [];
        
        // Filter messages after startId
        const messages = stream.filter(msg => msg.id > startId);
        
        // Return limited count
        return messages.slice(0, count);
    }

    /**
     * Get stream info
     */
    async getStreamInfo(streamName: string): Promise<{
        name: string;
        length: number;
        lastId: string | null;
        firstEntry: StreamMessage | null;
        lastEntry: StreamMessage | null;
    }> {
        const stream = this.streams.get(streamName) || [];
        
        return {
            name: streamName,
            length: stream.length,
            lastId: stream.length > 0 ? stream[stream.length - 1].id : null,
            firstEntry: stream.length > 0 ? stream[0] : null,
            lastEntry: stream.length > 0 ? stream[stream.length - 1] : null,
        };
    }

    /**
     * Create consumer group
     */
    async createConsumerGroup(
        streamName: string,
        groupName: string,
        startId: string = '0'
    ): Promise<void> {
        console.log(`📋 Creating consumer group ${groupName} for ${streamName}`);
        // In real Redis, this would create the consumer group
        // For mock, we just log it
    }

    /**
     * Poll stream for new messages
     */
    private async pollStream(
        streamName: string,
        consumerKey: string,
        handler: (message: StreamMessage) => void | Promise<void>
    ): Promise<void> {
        const lastId = this.lastIds.get(consumerKey) || '0';
        const newMessages = await this.readMessages(streamName, 10, lastId);

        for (const message of newMessages) {
            try {
                await handler(message);
                this.lastIds.set(consumerKey, message.id);
            } catch (error) {
                console.error(`Error handling message ${message.id}:`, error);
            }
        }
    }

    /**
     * Notify all consumers of new message
     */
    private notifyConsumers(streamName: string, message: StreamMessage): void {
        // Notify all consumers subscribed to this stream
        for (const [key, handlers] of this.consumers.entries()) {
            if (key.startsWith(streamName)) {
                for (const handler of handlers) {
                    try {
                        handler(message);
                    } catch (error) {
                        console.error(`Error notifying consumer ${key}:`, error);
                    }
                }
            }
        }
    }

    /**
     * Persist message to localStorage
     */
    private persistMessage(streamName: string, message: StreamMessage): void {
        try {
            const key = `redis_stream:${streamName}`;
            const existing = localStorage.getItem(key);
            const messages: StreamMessage[] = existing ? JSON.parse(existing) : [];
            messages.push(message);

            // Keep only last 100 messages per stream
            if (messages.length > 100) {
                messages.splice(0, messages.length - 100);
            }

            localStorage.setItem(key, JSON.stringify(messages));
        } catch (error) {
            console.error('Error persisting message:', error);
        }
    }

    /**
     * Load persisted messages
     */
    loadPersistedMessages(streamName: string): void {
        try {
            const key = `redis_stream:${streamName}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                const messages: StreamMessage[] = JSON.parse(stored);
                this.streams.set(streamName, messages);
                console.log(`📥 Loaded ${messages.length} messages from ${streamName}`);
            }
        } catch (error) {
            console.error('Error loading persisted messages:', error);
        }
    }

    /**
     * Clear stream
     */
    clearStream(streamName: string): void {
        this.streams.delete(streamName);
        localStorage.removeItem(`redis_stream:${streamName}`);
        console.log(`🗑️ Cleared stream ${streamName}`);
    }

    /**
     * Get all streams
     */
    getAllStreams(): string[] {
        return Array.from(this.streams.keys());
    }
}

// Export singleton instance
export const redisStreams = new RedisStreamsClient();

// Stream names (constants)
export const STREAMS = {
    // Materials -> Logistics
    MRF_READY_FOR_COLLECTION: 'materials:mrf:ready_for_collection',
    MRF_UPDATED: 'materials:mrf:updated',
    MRF_CANCELLED: 'materials:mrf:cancelled',
    MRF_ON_HOLD: 'materials:mrf:on_hold',
    
    // Logistics -> Materials
    TASK_ACCEPTED: 'logistics:task:accepted',
    TASK_IN_TRANSIT: 'logistics:task:in_transit',
    TASK_DELIVERED: 'logistics:task:delivered',
    TASK_EXCEPTION: 'logistics:task:exception',
};

// Load persisted messages on initialization
Object.values(STREAMS).forEach(stream => {
    redisStreams.loadPersistedMessages(stream);
});

