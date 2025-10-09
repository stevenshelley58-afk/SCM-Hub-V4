/**
 * Redis Event Subscriber
 * 
 * Subscribes to Redis Streams and processes events with retry logic.
 * 
 * Usage:
 *   const subscriber = new EventSubscriber(
 *     redisClient,
 *     'materials-consumers',
 *     'worker-1'
 *   );
 *   
 *   await subscriber.subscribe('events:logistics', async (event) => {
 *     if (event.type === 'pod.captured') {
 *       await handlePOD(event.payload);
 *     }
 *   });
 */

import Redis from 'ioredis';
import { BaseEvent, validateEvent } from '../types/event';
import { logger } from './logger';
import { metrics } from './metrics';

interface SubscriberOptions {
  /**
   * Maximum number of retries before moving to DLQ
   * @default 3
   */
  maxRetries?: number;

  /**
   * Number of messages to fetch per batch
   * @default 10
   */
  batchSize?: number;

  /**
   * Block time in milliseconds when no messages available
   * @default 5000
   */
  blockTime?: number;

  /**
   * Enable automatic DLQ monitoring
   * @default true
   */
  monitorDLQ?: boolean;
}

export class EventSubscriber {
  private readonly maxRetries: number;
  private readonly batchSize: number;
  private readonly blockTime: number;
  private readonly monitorDLQ: boolean;
  private isRunning = false;

  constructor(
    private redis: Redis,
    private groupName: string,
    private consumerName: string,
    options: SubscriberOptions = {}
  ) {
    this.maxRetries = options.maxRetries ?? 3;
    this.batchSize = options.batchSize ?? 10;
    this.blockTime = options.blockTime ?? 5000;
    this.monitorDLQ = options.monitorDLQ ?? true;
  }

  /**
   * Subscribe to a stream and process events
   * 
   * @param stream - Redis stream name (e.g., 'events:materials')
   * @param handler - Async function to process each event
   */
  async subscribe(
    stream: string,
    handler: (event: BaseEvent) => Promise<void>
  ): Promise<void> {
    // Create consumer group if it doesn't exist
    await this.ensureConsumerGroup(stream);

    this.isRunning = true;

    logger.info({
      stream,
      group: this.groupName,
      consumer: this.consumerName
    }, 'Started event subscription');

    // Start DLQ monitoring if enabled
    if (this.monitorDLQ) {
      this.startDLQMonitoring();
    }

    while (this.isRunning) {
      try {
        await this.processMessages(stream, handler);
      } catch (error) {
        logger.error({
          stream,
          error: error.message,
          stack: error.stack
        }, 'Error in subscription loop');
        
        // Wait before retrying to avoid tight loop
        await this.sleep(1000);
      }
    }
  }

  /**
   * Stop the subscription
   */
  stop(): void {
    this.isRunning = false;
    logger.info({ consumer: this.consumerName }, 'Stopping event subscription');
  }

  /**
   * Create consumer group if it doesn't exist
   */
  private async ensureConsumerGroup(stream: string): Promise<void> {
    try {
      await this.redis.xgroup(
        'CREATE',
        stream,
        this.groupName,
        '0', // Start from beginning
        'MKSTREAM' // Create stream if not exists
      );
      logger.info({ stream, group: this.groupName }, 'Consumer group created');
    } catch (error) {
      if (error.message.includes('BUSYGROUP')) {
        // Group already exists, ignore
        logger.debug({ stream, group: this.groupName }, 'Consumer group already exists');
      } else {
        throw error;
      }
    }
  }

  /**
   * Process messages from stream
   */
  private async processMessages(
    stream: string,
    handler: (event: BaseEvent) => Promise<void>
  ): Promise<void> {
    // Read new messages
    const results = await this.redis.xreadgroup(
      'GROUP',
      this.groupName,
      this.consumerName,
      'BLOCK',
      this.blockTime,
      'COUNT',
      this.batchSize,
      'STREAMS',
      stream,
      '>' // Only new messages
    );

    if (!results || results.length === 0) {
      return; // No messages, continue loop
    }

    for (const [_stream, messages] of results) {
      for (const [messageId, fields] of messages) {
        await this.processMessage(stream, messageId, fields, handler);
      }
    }

    // Also process pending messages (redelivery)
    await this.processPendingMessages(stream, handler);
  }

  /**
   * Process a single message
   */
  private async processMessage(
    stream: string,
    messageId: string,
    fields: string[],
    handler: (event: BaseEvent) => Promise<void>
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Parse event from fields
      const eventJson = fields[1]; // fields = ['event', '{ ... }']
      const event: BaseEvent = JSON.parse(eventJson);

      // Validate event structure
      validateEvent(event);

      logger.debug({
        event_id: event.id,
        event_type: event.type,
        message_id: messageId,
        correlation_id: event.correlation_id
      }, `Processing event: ${event.type}`);

      // Call handler
      await handler(event);

      // Acknowledge successful processing
      await this.redis.xack(stream, this.groupName, messageId);

      // Record metrics
      metrics.eventsConsumed.inc({
        type: event.type,
        consumer: this.consumerName
      });

      const duration = (Date.now() - startTime) / 1000;
      metrics.processingLatency.observe({ type: event.type }, duration);

      logger.info({
        event_id: event.id,
        event_type: event.type,
        duration_ms: Date.now() - startTime
      }, `Event processed successfully: ${event.type}`);

    } catch (error) {
      logger.error({
        message_id: messageId,
        error: error.message,
        stack: error.stack
      }, 'Failed to process event');

      await this.handleFailure(stream, messageId, error);
    }
  }

  /**
   * Process pending messages (retry logic)
   */
  private async processPendingMessages(
    stream: string,
    handler: (event: BaseEvent) => Promise<void>
  ): Promise<void> {
    const pending = await this.redis.xpending(
      stream,
      this.groupName,
      '-', '+',
      10, // Claim up to 10 pending messages
      this.consumerName
    );

    if (!pending || pending.length === 0) {
      return;
    }

    for (const [messageId] of pending) {
      // Claim message for reprocessing
      const claimed = await this.redis.xclaim(
        stream,
        this.groupName,
        this.consumerName,
        60000, // Idle time: 60 seconds
        messageId
      );

      if (claimed && claimed.length > 0) {
        const [_id, fields] = claimed[0];
        await this.processMessage(stream, messageId, fields, handler);
      }
    }
  }

  /**
   * Handle failed event processing
   */
  private async handleFailure(
    stream: string,
    messageId: string,
    error: Error
  ): Promise<void> {
    // Check delivery count
    const pending = await this.redis.xpending(
      stream,
      this.groupName,
      '-', '+',
      10,
      this.consumerName
    );

    const msg = pending.find((p: any) => p[0] === messageId);
    const deliveryCount = msg ? msg[3] : 0;

    if (deliveryCount >= this.maxRetries) {
      // Move to DLQ
      await this.moveToDLQ(stream, messageId, error);
      await this.redis.xack(stream, this.groupName, messageId);

      logger.warn({
        message_id: messageId,
        delivery_count: deliveryCount,
        error: error.message
      }, 'Message moved to DLQ after max retries');

    } else {
      // Will be retried automatically via pending messages
      logger.warn({
        message_id: messageId,
        delivery_count: deliveryCount,
        max_retries: this.maxRetries
      }, 'Message will be retried');
    }

    metrics.eventsFailed.inc({
      type: 'unknown',
      reason: error.message.substring(0, 50)
    });
  }

  /**
   * Move failed message to Dead Letter Queue
   */
  private async moveToDLQ(
    originalStream: string,
    messageId: string,
    error: Error
  ): Promise<void> {
    // Read original message
    const messages = await this.redis.xrange(originalStream, messageId, messageId);
    
    if (messages && messages.length > 0) {
      const [_id, fields] = messages[0];
      
      // Add to DLQ with metadata
      await this.redis.xadd(
        'events:dlq',
        '*',
        'original_stream', originalStream,
        'original_id', messageId,
        'error', error.message,
        'timestamp', Date.now().toString(),
        'event', fields[1]
      );

      logger.error({
        original_stream: originalStream,
        message_id: messageId,
        error: error.message
      }, 'Message moved to DLQ');
    }
  }

  /**
   * Monitor DLQ depth and alert if threshold exceeded
   */
  private startDLQMonitoring(): void {
    setInterval(async () => {
      try {
        const depth = await this.redis.xlen('events:dlq');
        metrics.dlqDepth.set(depth);

        if (depth > 50) {
          logger.error({
            dlq_depth: depth,
            threshold: 50
          }, 'DLQ depth exceeds threshold - manual intervention required');
        }
      } catch (error) {
        logger.error({ error: error.message }, 'Failed to monitor DLQ');
      }
    }, 60000); // Every minute
  }

  /**
   * Utility: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    this.stop();
    await this.redis.quit();
  }
}

