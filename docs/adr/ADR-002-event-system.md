# ADR-002: Cross-App Event System

**Status:** Accepted  
**Date:** 2025-10-09  
**Deciders:** Architecture Team  
**Technical Story:** Materials and Logistics apps must communicate asynchronously

---

## Context

The SCM-Hub monorepo contains independent apps (Materials, Logistics) that must exchange data without direct coupling. Requirements:

- **Loose coupling:** Apps deploy independently
- **Reliability:** Messages cannot be lost
- **Retry logic:** Handle transient failures
- **Ordering:** Some events must be processed in order
- **Scalability:** Handle 1000+ events/hour initially, 10k+ future
- **Observability:** Track event flow and failures

### Use Cases

1. **MRF Ready for Collection**  
   Materials App → Logistics App  
   `{ mrf_id, pickup, dropoff, priority }`

2. **POD Captured**  
   Logistics App → Materials App  
   `{ mrf_id, photos, signature, gps }`

3. **Exception Raised**  
   Either App → Other App  
   `{ task_id, exception_code, severity }`

---

## Options Considered

### Option 1: In-Process EventEmitter

```typescript
// shared/events/emitter.ts
import { EventEmitter } from 'events';
const bus = new EventEmitter();
```

**Pros:**
- Zero infrastructure
- Instant delivery
- Simple debugging

**Cons:**
- ❌ Lost on restart (not persistent)
- ❌ Doesn't work for separate deployments
- ❌ No retry logic
- ❌ Blocks if handler is slow

**Verdict:** Only viable for monolith deployment in v1, breaks in v2 micro-frontends.

---

### Option 2: Webhooks (HTTP)

```typescript
// App A sends POST to App B
POST /webhooks/mrf-ready
{ mrf_id, ... }
```

**Pros:**
- Standard HTTP (easy to understand)
- Works across separate services
- Simple auth (API keys)

**Cons:**
- ❌ Requires custom retry logic
- ❌ Both apps must be running (tight timing)
- ❌ No built-in message queue
- ❌ Hard to debug failed deliveries

**Verdict:** Simple but fragile. Acceptable only if we add a queue layer (see Option 5).

---

### Option 3: RabbitMQ

```javascript
channel.publish('exchange', 'mrf.ready', Buffer.from(JSON.stringify(msg)));
```

**Pros:**
- Mature, battle-tested
- Rich routing (topics, direct, fanout)
- Persistent queues
- Dead letter queues

**Cons:**
- ⚠️ Operationally complex (clustering, HA)
- ⚠️ Another service to maintain
- ⚠️ Overkill for 10k events/hour

**Verdict:** Over-engineered for our scale. Better for 100k+ events/hour.

---

### Option 4: Redis Streams ✅

```javascript
await redis.xadd('events:logistics', '*', 'type', 'mrf_ready', 'payload', JSON.stringify(data));
```

**Pros:**
- ✅ Simple to operate (single Redis instance)
- ✅ Persistent (append-only log)
- ✅ Consumer groups (multiple workers)
- ✅ Automatic retry via XPENDING
- ✅ Low latency (<10ms)
- ✅ Scales to 100k+ events/sec
- ✅ Already using Redis for caching/sessions

**Cons:**
- ⚠️ Less mature than RabbitMQ
- ⚠️ Limited routing (no topic filters)

**Verdict:** Best fit. Simple, reliable, scales, leverages existing Redis.

---

### Option 5: Supabase Realtime (Postgres LISTEN/NOTIFY)

```sql
NOTIFY mrf_ready, '{"mrf_id": "123"}';
```

**Pros:**
- Built into Postgres (no extra service)
- Realtime subscription
- Already using Supabase

**Cons:**
- ❌ Not persistent (lost on disconnect)
- ❌ No retry logic
- ❌ Payload size limit (8KB)
- ❌ Not designed for queues

**Verdict:** Good for UI real-time updates, not for reliable event processing.

---

## Decision

**We will use Redis Streams as the event backbone.**

---

## Architecture

### High-Level Flow

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  Materials App  │────────▶│  Redis Streams  │◀────────│  Logistics App  │
│                 │ publish │                 │ consume │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │  Dead Letter  │
                            │     Queue     │
                            └───────────────┘
```

### Stream Naming Convention

```
events:materials     # Events published by Materials app
events:logistics     # Events published by Logistics app
events:dlq           # Dead letter queue (failed events)
```

### Consumer Groups

```
materials-consumers  # Group reading events:materials
logistics-consumers  # Group reading events:logistics
```

---

## Implementation Details

### 1. Event Schema

```typescript
// shared/api/contracts/event.ts
export interface BaseEvent {
  id: string;              // UUID
  version: string;         // "1.0"
  type: string;            // "mrf.ready", "pod.captured"
  timestamp: string;       // ISO 8601
  source: 'materials' | 'logistics';
  correlation_id: string;  // For tracing
  payload: unknown;        // Event-specific data
}
```

### 2. Publisher Interface

```typescript
// shared/events/publisher.ts
import Redis from 'ioredis';

export class EventPublisher {
  constructor(private redis: Redis) {}

  async publish(event: BaseEvent): Promise<string> {
    const stream = `events:${event.source}`;
    const id = await this.redis.xadd(
      stream,
      '*', // Auto-generate ID
      'event', JSON.stringify(event)
    );
    
    // Trim stream to last 10k events (prevent unbounded growth)
    await this.redis.xtrim(stream, 'MAXLEN', '~', 10000);
    
    return id;
  }
}
```

### 3. Subscriber Interface

```typescript
// shared/events/subscriber.ts
export class EventSubscriber {
  constructor(
    private redis: Redis,
    private groupName: string,
    private consumerName: string
  ) {}

  async subscribe(
    stream: string,
    handler: (event: BaseEvent) => Promise<void>
  ): Promise<void> {
    // Create consumer group if not exists
    await this.redis.xgroup(
      'CREATE', stream, this.groupName, '0', 'MKSTREAM'
    ).catch(() => {}); // Ignore if exists

    while (true) {
      const results = await this.redis.xreadgroup(
        'GROUP', this.groupName, this.consumerName,
        'BLOCK', 5000,
        'COUNT', 10,
        'STREAMS', stream, '>'
      );

      if (!results) continue;

      for (const [_stream, messages] of results) {
        for (const [id, fields] of messages) {
          try {
            const event = JSON.parse(fields[1]); // fields = ['event', '{}']
            await handler(event);
            await this.redis.xack(stream, this.groupName, id);
          } catch (error) {
            await this.handleFailure(stream, id, error);
          }
        }
      }
    }
  }

  private async handleFailure(stream: string, id: string, error: Error) {
    // Move to DLQ after 3 retries
    const pending = await this.redis.xpending(stream, this.groupName, '-', '+', 10, this.consumerName);
    const msg = pending.find(p => p[0] === id);
    
    if (msg && msg[3] >= 3) { // 3rd delivery attempt
      const data = await this.redis.xrange(stream, id, id);
      await this.redis.xadd('events:dlq', '*', 'original_stream', stream, 'event', data[0][1][1]);
      await this.redis.xack(stream, this.groupName, id);
    }
  }
}
```

### 4. Usage Example

```typescript
// apps/materials/services/mrf-service.ts
import { EventPublisher } from '@shared/events/publisher';

async function approveForCollection(mrf: MRF) {
  // ... business logic ...

  await publisher.publish({
    id: uuid(),
    version: '1.0',
    type: 'mrf.ready',
    timestamp: new Date().toISOString(),
    source: 'materials',
    correlation_id: mrf.id,
    payload: {
      mrf_id: mrf.id,
      pickup: mrf.staging_location,
      dropoff: mrf.delivery_location,
      priority: mrf.priority
    }
  });
}
```

```typescript
// apps/logistics/services/task-listener.ts
import { EventSubscriber } from '@shared/events/subscriber';

const subscriber = new EventSubscriber(redis, 'logistics-consumers', 'worker-1');

await subscriber.subscribe('events:materials', async (event) => {
  if (event.type === 'mrf.ready') {
    await createLogisticsTask(event.payload);
  }
});
```

---

## Operational Considerations

### Monitoring

```typescript
// shared/monitoring/event-metrics.ts
export const eventMetrics = {
  published: new Counter({ name: 'events_published_total', labelNames: ['type', 'source'] }),
  consumed: new Counter({ name: 'events_consumed_total', labelNames: ['type', 'consumer'] }),
  failed: new Counter({ name: 'events_failed_total', labelNames: ['type', 'reason'] }),
  dlq_depth: new Gauge({ name: 'events_dlq_depth' }),
  latency: new Histogram({ name: 'event_processing_seconds', labelNames: ['type'] })
};
```

### Dead Letter Queue Handling

```bash
# Daily cron job to alert on DLQ depth
redis-cli XLEN events:dlq
# If > 50, alert ops team
```

### Scaling Strategy

- **Phase 1 (v1):** Single Redis instance, 2 consumer workers per app
- **Phase 2 (v2):** Redis Sentinel (HA), 5 workers per app
- **Phase 3 (v3):** Redis Cluster if >100k events/hour

---

## Migration Path

### v1 (Now): Monolith Deployment
Both apps in same process → Redis Streams handles decoupling.

### v2 (6 months): Micro-Frontends
Apps in separate services → Redis Streams already supports this (no change needed).

### v3 (If needed): Switch to RabbitMQ
If Redis Streams becomes bottleneck (>100k events/hour), interface abstraction allows swap:

```typescript
// shared/events/publisher.ts becomes abstract
interface IEventPublisher {
  publish(event: BaseEvent): Promise<string>;
}

// Swap implementations:
RedisEventPublisher implements IEventPublisher
RabbitMQEventPublisher implements IEventPublisher
```

---

## Consequences

### Positive
✅ Reliable: Persistent, survives restarts  
✅ Simple ops: Single Redis instance, no clustering needed initially  
✅ Async by default: Apps don't block each other  
✅ Retry built-in: Consumer groups handle redelivery  
✅ Observable: Stream length, pending messages, DLQ depth  
✅ Future-proof: Supports separate deployments  

### Negative
⚠️ Ordered processing: Requires single consumer per partition  
⚠️ Complex queries: Can't filter events server-side (must consume all)  
⚠️ Learning curve: Team must learn Redis Streams commands  

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Redis crashes, events lost | Enable AOF persistence (`appendonly yes`) |
| Consumer crashes mid-processing | XPENDING + retry logic |
| DLQ grows unbounded | Automated alerting + manual review process |
| Event schema drift | Versioned contracts + Zod validation |

---

## Testing Strategy

### Unit Tests
```typescript
// Mock Redis in tests
jest.mock('ioredis');
await publisher.publish(mockEvent);
expect(redis.xadd).toHaveBeenCalledWith(...)
```

### Integration Tests
```typescript
// Use real Redis (Docker Compose)
const testRedis = new Redis({ host: 'localhost', port: 6380 });
await publisher.publish(event);
const consumed = await subscriber.consumeOne();
expect(consumed).toEqual(event);
```

### Contract Tests
```typescript
// Validate event schemas
import { eventSchema } from '@shared/api/contracts';
const result = eventSchema.safeParse(event);
expect(result.success).toBe(true);
```

---

## References
- [Redis Streams Intro](https://redis.io/docs/data-types/streams/)
- [Redis Streams Tutorial](https://redis.io/docs/data-types/streams-tutorial/)
- [Consumer Groups](https://redis.io/docs/manual/data-types/streams/#consumer-groups)

---

## Approvals

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tech Lead | [TBD] | 2025-10-09 | ✓ |
| DevOps Lead | [TBD] | 2025-10-09 | ✓ |
| Engineering Manager | [TBD] | 2025-10-09 | ✓ |

