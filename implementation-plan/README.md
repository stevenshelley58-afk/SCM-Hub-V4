# SCM-Hub Implementation Plan

**Version:** 1.0  
**Date:** 2025-10-09  
**Timeline:** 12 weeks to production-ready v1.0

---

## Overview

This document provides the step-by-step implementation roadmap for the SCM-Hub monorepo, following the architectural decisions in ADR-001, ADR-002, and ADR-003.

---

## Phase 1: Foundation (Weeks 1-2)

### Week 1: Monorepo Setup

**Owner:** DevOps + Tech Lead

#### Tasks

- [ ] **1.1 Initialize Monorepo**
  ```bash
  mkdir SCM-Hub && cd SCM-Hub
  git init
  npm init -y
  ```

- [ ] **1.2 Install Turborepo**
  ```bash
  npm install turbo --save-dev
  # Create turbo.json (see /implementation-plan/configs/turbo.json)
  # Create root package.json with workspaces
  # Test: turbo run build --dry-run
  ```

- [ ] **1.3 Create Directory Structure**
  ```bash
  mkdir -p apps/web/{app,api,lib}
  mkdir -p packages/{ui,auth,events,api-contracts,db}
  mkdir -p services/workers
  mkdir -p tests/{contracts,isolation,e2e}
  mkdir -p docs/{adr,runbooks,specs,integration,diagrams}
  mkdir -p infra/{docker,terraform,k8s}
  ```

- [ ] **1.4 Configure TypeScript**
  - Root `tsconfig.json` (base config)
  - Per-package `tsconfig.json` (extends base)
  - Configure path aliases:
    ```json
    "@scm/ui": ["./packages/ui/src"],
    "@scm/auth": ["./packages/auth/src"],
    "@scm/events": ["./packages/events/src"]
    ```

- [ ] **1.5 Setup ESLint**
  - Install: `eslint`, `@typescript-eslint/*`
  - Configure import boundary rules (see `/implementation-plan/configs/.eslintrc.json`)
  - Test: `turbo run lint`

**Deliverable:** Monorepo skeleton with Turborepo working

---

### Week 2: Core Infrastructure

**Owner:** Backend Team

#### Tasks

- [ ] **2.1 Setup Docker Compose**
  - PostgreSQL 15 with PostGIS
  - Redis 7
  - Supabase local (optional)
  - See `/implementation-plan/configs/docker-compose.yml`

- [ ] **2.2 Initialize Shared Packages**

  **Auth Package** (`packages/auth/`)
  - [ ] Setup Supabase client
  - [ ] Create `roles.json` (MC, MLC, Admin, Driver)
  - [ ] Implement `hasPermission(user, permission)`
  - [ ] Implement JWT validation middleware

  **Events Package** (`packages/events/`)
  - [ ] Install `ioredis`
  - [ ] Implement `EventPublisher` class (see ADR-002)
  - [ ] Implement `EventSubscriber` class
  - [ ] Create base `Event` interface

  **DB Package** (`packages/db/`)
  - [ ] Setup Prisma or Drizzle ORM
  - [ ] Create initial schema:
    - `users`, `roles`, `sites`, `attachments`
    - `mrf_*` tables (Materials)
    - `logistics_*` tables (Logistics)
  - [ ] Create migrations folder structure

- [ ] **2.3 Setup Testing Framework**
  - Install: `jest`, `@testing-library/react`, `playwright`
  - Configure test scripts in `turbo.json`
  - Create sample test for each package

**Deliverable:** Core shared packages functional

---

## Phase 2: Materials App (Weeks 3-5)

### Week 3: Materials Core

**Owner:** Materials Team (MC)

#### Tasks

- [ ] **3.1 Materials UI Structure**
  ```
  apps/web/app/materials/
  ├─ layout.tsx          # Materials-specific layout
  ├─ dashboard/
  ├─ mrf/
  │  ├─ new/
  │  ├─ [id]/
  │  └─ list/
  └─ inventory/
  ```

- [ ] **3.2 Materials API Routes**
  ```
  apps/web/api/materials/
  ├─ mrf/
  │  ├─ route.ts         # POST /api/materials/mrf (create)
  │  └─ [id]/route.ts    # GET/PATCH (read/update)
  └─ inventory/
  ```

- [ ] **3.3 MRF Business Logic**
  - Create MRF state machine (Draft → Submitted → Approved → Ready)
  - Implement approval workflow
  - Integrate with event publisher:
    ```typescript
    await eventPublisher.publish({
      type: 'mrf.ready',
      payload: { mrf_id, pickup, dropoff }
    });
    ```

**Deliverable:** Materials app functional (no integration yet)

---

### Week 4-5: Materials Polish

- [ ] **4.1 UI Components** (using `@scm/ui`)
  - MRF form (multi-step)
  - Inventory table with filters
  - Status badges
  - Approval modal

- [ ] **4.2 Auth Integration**
  - Protect `/materials/*` routes (MC role required)
  - Implement RLS policies on `mrf_*` tables

- [ ] **4.3 Testing**
  - Unit tests for MRF service
  - Integration tests for API routes
  - E2E test: Create MRF → Approve → Publish event

**Deliverable:** Materials app production-ready (standalone)

---

## Phase 3: Logistics App (Weeks 6-8)

### Week 6: Logistics Core

**Owner:** Logistics Team (MLC)

#### Tasks

- [ ] **6.1 Logistics UI Structure**
  ```
  apps/web/app/logistics/
  ├─ layout.tsx
  ├─ dashboard/
  ├─ tasks/
  │  ├─ new/
  │  ├─ [id]/
  │  └─ board/          # Kanban view
  ├─ drivers/
  └─ exceptions/
  ```

- [ ] **6.2 Logistics API Routes**
  ```
  apps/web/api/logistics/
  ├─ tasks/
  │  ├─ route.ts         # POST (create), GET (list)
  │  └─ [id]/
  │     ├─ route.ts      # GET, PATCH
  │     ├─ pod/route.ts  # POST (capture POD)
  │     └─ exception/route.ts
  └─ drivers/
  ```

- [ ] **6.3 Task Business Logic**
  - Task state machine (New → Scheduled → In Progress → Completed → Verified → Closed)
  - Assign driver/vehicle
  - Capture POD (photos, signature, GPS)
  - Publish events:
    ```typescript
    await eventPublisher.publish({
      type: 'pod.captured',
      payload: { mrf_id, photos, signature, gps }
    });
    ```

**Deliverable:** Logistics app functional (standalone)

---

### Week 7-8: Logistics Polish

- [ ] **7.1 UI Components**
  - Task board (drag-and-drop)
  - POD capture form (camera, signature pad)
  - Exception form
  - Driver assignment UI

- [ ] **7.2 Mobile-Friendly Driver View**
  - Responsive task list
  - Camera integration (React Camera Pro)
  - Signature canvas
  - Offline support (service worker + IndexedDB)

- [ ] **7.3 Testing**
  - Unit tests for task service
  - Integration tests for POD capture
  - E2E test: Create task → Assign driver → Capture POD → Complete

**Deliverable:** Logistics app production-ready (standalone)

---

## Phase 4: Integration (Weeks 9-10)

### Week 9: Cross-App Events

**Owner:** Integration Team

#### Tasks

- [ ] **9.1 Materials → Logistics Integration**

  **Publisher (Materials side):**
  ```typescript
  // apps/web/lib/materials/mrf-service.ts
  async function approveForCollection(mrfId: string) {
    const mrf = await db.mrf.update({ status: 'Ready' });
    
    await eventPublisher.publish({
      type: 'mrf.ready',
      source: 'materials',
      payload: {
        mrf_id: mrf.id,
        wo_line_ids: mrf.wo_lines,
        pickup: mrf.staging_location,
        dropoff: mrf.delivery_location,
        priority: mrf.priority
      }
    });
  }
  ```

  **Subscriber (Logistics side):**
  ```typescript
  // services/workers/logistics-listener.ts
  await subscriber.subscribe('events:materials', async (event) => {
    if (event.type === 'mrf.ready') {
      await createLogisticsTask({
        origin_app: 'Materials',
        linked_mrf_id: event.payload.mrf_id,
        type: 'delivery',
        pickup_details: event.payload.pickup,
        dropoff_details: event.payload.dropoff,
        priority: event.payload.priority,
        status: 'New'
      });
    }
  });
  ```

- [ ] **9.2 Logistics → Materials Integration**

  **Publisher (Logistics side):**
  ```typescript
  async function capturePOD(taskId: string, pod: PODData) {
    const task = await db.logisticsTask.update({ status: 'Completed' });
    
    if (task.linked_mrf_id) {
      await eventPublisher.publish({
        type: 'pod.captured',
        source: 'logistics',
        payload: {
          mrf_id: task.linked_mrf_id,
          task_id: task.id,
          photos: pod.photos,
          signature: pod.signature,
          gps: pod.gps,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
  ```

  **Subscriber (Materials side):**
  ```typescript
  // services/workers/materials-listener.ts
  await subscriber.subscribe('events:logistics', async (event) => {
    if (event.type === 'pod.captured') {
      await db.mrf.update({
        where: { id: event.payload.mrf_id },
        data: {
          pod_photos: event.payload.photos,
          pod_signature: event.payload.signature,
          pod_received_at: event.payload.timestamp,
          status: 'Delivered'
        }
      });
    }
  });
  ```

- [ ] **9.3 Deploy Workers**
  - Create Dockerfile for worker process
  - Configure worker to run both subscribers
  - Add health check endpoint
  - Add graceful shutdown handling

**Deliverable:** Full bidirectional integration working

---

### Week 10: Contract Testing

**Owner:** QA + Backend Team

#### Tasks

- [ ] **10.1 Define Contract Schemas**
  ```typescript
  // packages/api-contracts/src/v1/materials-to-logistics.ts
  import { z } from 'zod';

  export const MRFReadyEventSchema = z.object({
    mrf_id: z.string().uuid(),
    wo_line_ids: z.array(z.string().uuid()),
    pickup: LocationSchema,
    dropoff: LocationSchema,
    priority: z.enum(['Low', 'Normal', 'High', 'Critical'])
  });

  export type MRFReadyEvent = z.infer<typeof MRFReadyEventSchema>;
  ```

- [ ] **10.2 Implement Contract Validator**
  ```typescript
  // tests/contracts/validate.ts
  import { allEventSchemas } from '@scm/api-contracts';

  export async function validateContract(event: BaseEvent) {
    const schema = allEventSchemas[event.type];
    if (!schema) throw new Error(`No schema for ${event.type}`);
    
    const result = schema.safeParse(event.payload);
    if (!result.success) {
      throw new Error(`Contract violation: ${result.error}`);
    }
    return result.data;
  }
  ```

- [ ] **10.3 Add Validation to Event System**
  ```typescript
  // packages/events/src/publisher.ts
  async publish(event: BaseEvent) {
    await validateContract(event); // Throws if invalid
    // ... publish to Redis
  }
  ```

- [ ] **10.4 Contract Test Suite**
  ```typescript
  // tests/contracts/materials-logistics.test.ts
  test('MRF ready event contract', async () => {
    const event = await publishMRFReady(mockMRF);
    expect(() => validateContract(event)).not.toThrow();
  });

  test('POD captured event contract', async () => {
    const event = await publishPODCaptured(mockPOD);
    expect(() => validateContract(event)).not.toThrow();
  });
  ```

**Deliverable:** Contract testing framework operational

---

## Phase 5: Observability & Polish (Weeks 11-12)

### Week 11: Monitoring

**Owner:** DevOps + Backend Team

#### Tasks

- [ ] **11.1 Implement Health Checks**
  ```typescript
  // packages/monitoring/src/health.ts
  export async function checkHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: await checkPostgres(),
        redis: await checkRedis(),
        events_dlq: await checkDLQ()
      }
    };
  }
  ```

  Expose at `/api/health`:
  ```typescript
  // apps/web/api/health/route.ts
  export async function GET() {
    const health = await checkHealth();
    return Response.json(health);
  }
  ```

- [ ] **11.2 Implement Prometheus Metrics**
  ```typescript
  // packages/monitoring/src/metrics.ts
  import { Counter, Histogram, Gauge, register } from 'prom-client';

  export const metrics = {
    eventsPublished: new Counter({
      name: 'scm_events_published_total',
      help: 'Total events published',
      labelNames: ['type', 'source']
    }),
    
    eventsConsumed: new Counter({
      name: 'scm_events_consumed_total',
      help: 'Total events consumed',
      labelNames: ['type', 'consumer']
    }),
    
    eventsFailed: new Counter({
      name: 'scm_events_failed_total',
      help: 'Total event processing failures',
      labelNames: ['type', 'reason']
    }),
    
    dlqDepth: new Gauge({
      name: 'scm_events_dlq_depth',
      help: 'Number of messages in dead letter queue'
    }),
    
    processingLatency: new Histogram({
      name: 'scm_event_processing_seconds',
      help: 'Event processing latency',
      labelNames: ['type'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
    })
  };

  export function getMetrics() {
    return register.metrics();
  }
  ```

  Expose at `/api/metrics`:
  ```typescript
  export async function GET() {
    return new Response(await getMetrics(), {
      headers: { 'Content-Type': register.contentType }
    });
  }
  ```

- [ ] **11.3 DLQ Monitoring**
  ```typescript
  // services/workers/dlq-monitor.ts
  import { metrics } from '@scm/monitoring';

  setInterval(async () => {
    const depth = await redis.xlen('events:dlq');
    metrics.dlqDepth.set(depth);
    
    if (depth > 50) {
      await alertOps(`DLQ depth critical: ${depth} messages`);
    }
  }, 60000); // Every minute
  ```

- [ ] **11.4 Structured Logging**
  ```typescript
  // packages/monitoring/src/logger.ts
  import pino from 'pino';

  export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level(label) {
        return { level: label };
      }
    },
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res
    }
  });

  export function logEvent(event: BaseEvent, phase: 'published' | 'consumed' | 'failed') {
    logger.info({
      event_id: event.id,
      event_type: event.type,
      source: event.source,
      correlation_id: event.correlation_id,
      phase
    }, `Event ${phase}: ${event.type}`);
  }
  ```

**Deliverable:** Full observability stack

---

### Week 12: Production Readiness

**Owner:** All Teams

#### Tasks

- [ ] **12.1 Security Audit**
  - [ ] All API routes require auth
  - [ ] RLS policies enabled on all tables
  - [ ] CSRF protection on mutations
  - [ ] Rate limiting configured
  - [ ] Secrets in vault (not .env committed)
  - [ ] HTTPS enforced

- [ ] **12.2 Performance Testing**
  - [ ] Load test: 500 concurrent users
  - [ ] Stress test: Database connection pool
  - [ ] Event throughput: 1000 events/hour
  - [ ] Page load time: <2 seconds

- [ ] **12.3 Documentation**
  - [ ] API documentation (OpenAPI spec)
  - [ ] User guides (MC and MLC)
  - [ ] Runbooks (deployment, rollback, incidents)
  - [ ] Developer onboarding guide

- [ ] **12.4 CI/CD Pipeline**
  - [ ] Automated tests on PR
  - [ ] Lint + type check
  - [ ] Contract tests
  - [ ] Isolation tests
  - [ ] Build + deploy to staging
  - [ ] Smoke tests on staging
  - [ ] Production deployment (manual approval)

- [ ] **12.5 Rollback Plan**
  - [ ] Keep last 5 deployment artifacts
  - [ ] Rollback script tested
  - [ ] Database migration rollback tested
  - [ ] Feature flag kill switches

**Deliverable:** Production-ready v1.0

---

## CI/CD Stages (Automated)

```yaml
# .github/workflows/ci.yml

stages:
  1. Install & Cache
     - npm install
     - Turborepo remote cache

  2. Lint & Type Check
     - turbo run lint
     - turbo run type-check

  3. Build
     - turbo run build

  4. Test
     - turbo run test:unit
     - turbo run test:integration

  5. Contract Tests
     - Run contract validation suite
     - Fail if schema violations

  6. Isolation Tests
     - Start materials app only → verify works
     - Start logistics app only → verify works
     - Run both → verify no cross-imports

  7. Schema Diff
     - Check for unauthorized schema changes
     - Verify table prefixes (mrf_*, logistics_*)

  8. Deploy Staging
     - Build Docker image
     - Deploy to staging environment
     - Run smoke tests

  9. Deploy Production (manual)
     - Require approval
     - Blue-green deployment
     - Run health checks
     - Rollback if failures
```

---

## Rollback Procedures

### Application Rollback

```bash
# 1. Disable traffic to new version
kubectl set image deployment/scm-hub app=scm-hub:v1.2.0

# 2. Verify health
curl https://scm.example.com/api/health

# 3. If issues, rollback
kubectl rollout undo deployment/scm-hub
```

### Database Migration Rollback

```bash
# All migrations must have DOWN scripts
npm run migrate:rollback -- --steps=1

# Verify data integrity
npm run db:check
```

### Event System Rollback

```bash
# Pause workers
docker-compose stop worker

# Clear problematic events from DLQ
redis-cli XDEL events:dlq <id>

# Restart workers
docker-compose start worker
```

---

## Success Criteria (v1.0 Launch)

### Functional
- [ ] MC can create MRF → approve → publish to Logistics
- [ ] MLC can create logistics task (manual or from MRF)
- [ ] Driver can capture POD (photos + signature)
- [ ] MC can verify POD in Materials app
- [ ] Exceptions can be raised and resolved
- [ ] All events sync between apps

### Performance
- [ ] Page load <2 seconds (p95)
- [ ] API response <500ms (p95)
- [ ] Event delivery <10 seconds (p99)
- [ ] Support 500 concurrent users

### Quality
- [ ] >80% code coverage
- [ ] Zero critical bugs
- [ ] All security checks passed
- [ ] All contract tests passing

### Operational
- [ ] Deployed to production
- [ ] Monitoring dashboards live
- [ ] Runbooks documented
- [ ] Team trained

---

## Post-Launch (Months 4-6)

- [ ] Gather user feedback
- [ ] Optimize performance bottlenecks
- [ ] Add analytics/reporting features
- [ ] Plan v2.0 (micro-frontends migration)

---

## Team Allocation

| Team | Focus | Size |
|------|-------|------|
| Materials Team | Materials App + API | 2-3 devs |
| Logistics Team | Logistics App + API | 2-3 devs |
| Platform Team | Shared packages + Infrastructure | 2 devs |
| QA Team | Testing + Automation | 1-2 QA |
| DevOps | CI/CD + Monitoring | 1 dev |

**Total:** 8-11 people

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Event system fails | High | Low | Robust retry logic + DLQ |
| Schema conflicts | High | Medium | Lint rules + CI checks |
| Cross-app coupling | Medium | High | ESLint + code reviews |
| Performance issues | Medium | Medium | Load testing in week 12 |
| Team velocity lower than planned | High | Medium | Buffer weeks + MVP scope |

---

**Next:** See `/implementation-plan/configs/` for ready-to-use configuration files.

