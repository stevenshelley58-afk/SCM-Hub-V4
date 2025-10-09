/**
 * Redis Event Publisher
 * 
 * Publishes events to Redis Streams for cross-app communication.
 * 
 * Usage:
 *   const publisher = new EventPublisher(redisClient);
 *   await publisher.publish({
 *     type: 'mrf.ready',
 *     source: 'materials',
 *     payload: { ... }
 *   });
 */

import Redis from 'ioredis';
import { BaseEvent, validateEvent } from '../types/event';
import { logger } from './logger';
import { metrics } from './metrics';

export class EventPublisher {
  constructor(private redis: Redis) {}

  /**
   * Publish an event to the appropriate stream
   * 
   * @param event - Event to publish
   * @returns Redis Stream message ID
   * @throws Error if validation fails or Redis operation fails
   */
  async publish(event: BaseEvent): Promise<string> {
    const startTime = Date.now();

    try {
      // Validate event structure
      validateEvent(event);

      // Determine target stream based on source
      const stream = `events:${event.source}`;

      // Serialize payload
      const serialized = JSON.stringify(event);

      // Publish to Redis Stream
      const messageId = await this.redis.xadd(
        stream,
        '*', // Auto-generate ID
        'event',
        serialized,
        'timestamp',
        Date.now().toString()
      );

      // Trim stream to prevent unbounded growth (keep last 10k events)
      await this.redis.xtrim(stream, 'MAXLEN', '~', 10000);

      // Log success
      logger.info({
        event_id: event.id,
        event_type: event.type,
        source: event.source,
        stream,
        message_id: messageId,
        correlation_id: event.correlation_id
      }, `Event published: ${event.type}`);

      // Record metrics
      metrics.eventsPublished.inc({
        type: event.type,
        source: event.source
      });

      const duration = (Date.now() - startTime) / 1000;
      metrics.publishLatency.observe({ type: event.type }, duration);

      return messageId;

    } catch (error) {
      logger.error({
        event_type: event.type,
        source: event.source,
        error: error.message
      }, `Failed to publish event: ${event.type}`);

      metrics.eventsFailed.inc({
        type: event.type,
        reason: 'publish_failed'
      });

      throw error;
    }
  }

  /**
   * Publish multiple events in a pipeline (atomic)
   * 
   * @param events - Array of events to publish
   * @returns Array of message IDs
   */
  async publishBatch(events: BaseEvent[]): Promise<string[]> {
    const pipeline = this.redis.pipeline();

    for (const event of events) {
      validateEvent(event);
      const stream = `events:${event.source}`;
      const serialized = JSON.stringify(event);
      
      pipeline.xadd(
        stream,
        '*',
        'event',
        serialized,
        'timestamp',
        Date.now().toString()
      );
    }

    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error('Pipeline execution failed');
    }

    const messageIds: string[] = [];
    for (const [error, result] of results) {
      if (error) throw error;
      messageIds.push(result as string);
    }

    logger.info({
      count: events.length,
      types: events.map(e => e.type)
    }, `Published ${events.length} events in batch`);

    return messageIds;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

