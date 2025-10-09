# ADR-003: Deployment Model

**Status:** Accepted  
**Date:** 2025-10-09  
**Deciders:** Architecture Team  
**Technical Story:** Define how SCM-Hub apps will be deployed and scaled

---

## Context

The SCM-Hub monorepo contains multiple applications (Materials, Logistics, future modules). We must decide:

- Do we deploy as a single monolith or separate services?
- How do apps share authentication and UI?
- What's the migration path as the system grows?

### Requirements

1. **Fast time-to-market:** Launch v1 in 3 months
2. **Independent deployment:** MC and MLC teams deploy on their schedule (future)
3. **Shared auth:** Single sign-on across all apps
4. **Shared UI:** Consistent look and feel
5. **Cost-effective:** Minimize infrastructure initially
6. **Scalable:** Support 500 concurrent users initially, 5000+ future

---

## Options Considered

### Option 1: Pure Monolith (Single Next.js App)

```
┌────────────────────────────────────┐
│      Next.js App (Port 3000)       │
│  ├─ /app/materials/*  (MC UI)      │
│  ├─ /app/logistics/*  (MLC UI)     │
│  ├─ /api/materials/*  (MC API)     │
│  └─ /api/logistics/*  (MLC API)    │
└────────────────────────────────────┘
                 │
                 ▼
      PostgreSQL + Redis
```

**Pros:**
- ✅ Simplest to build and deploy
- ✅ Single build artifact
- ✅ Shared session/auth automatically
- ✅ No network latency between modules
- ✅ Easiest local development

**Cons:**
- ❌ Cannot deploy apps independently
- ❌ One crash affects everything
- ❌ Hard to scale individual apps
- ❌ Tight coupling temptation

---

### Option 2: Micro-Frontends from Day 1

```
            ┌─────────────────┐
            │   API Gateway   │
            └────────┬────────┘
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│Materials │  │Logistics │  │  Portal  │
│ Service  │  │ Service  │  │ Service  │
└──────────┘  └──────────┘  └──────────┘
```

**Pros:**
- ✅ True independence (deploy separately)
- ✅ Scale apps individually
- ✅ Different tech stacks possible

**Cons:**
- ❌ 3-6 months longer to build
- ❌ Complex auth (shared tokens across domains)
- ❌ Network overhead between services
- ❌ Harder local development (run 3+ services)
- ❌ Higher infrastructure cost (3+ servers)

---

### Option 3: Monolith First, Micro-Frontends Later ✅

**Phase 1 (v1.0 - Months 1-3): Monolith**
```
┌────────────────────────────────────┐
│         Next.js App                │
│  ├─ /app/materials/*               │
│  ├─ /app/logistics/*               │
│  Features:                         │
│   - Shared session                 │
│   - Feature flags per app          │
│   - Modular code structure         │
└────────────────────────────────────┘
```

**Phase 2 (v2.0 - Months 6-9): Extract Services**
```
            ┌─────────────────┐
            │  Next.js Shell  │  ← Routing + Auth
            └────────┬────────┘
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│Materials │  │Logistics │  │  Future  │
│ (iframe) │  │ (iframe) │  │   App    │
└──────────┘  └──────────┘  └──────────┘
```

**Pros:**
- ✅ Launch fast (monolith simplicity)
- ✅ Refactor later with real usage data
- ✅ Gradual migration (no big-bang rewrite)
- ✅ Keep what works, split what needs scale
- ✅ Lower risk (prove value first)

**Cons:**
- ⚠️ Need to enforce boundaries in monolith (see Governance Spec)
- ⚠️ Migration effort later (planned, not avoided)

---

## Decision

**We will use the Monolith-First approach** with strict modular boundaries.

---

## Implementation: Phase 1 (v1.0 - Monolith)

### Application Structure

```
SCM-Hub/
├─ apps/
│  ├─ web/                    # Next.js app (single deployment)
│  │  ├─ app/
│  │  │  ├─ (auth)/
│  │  │  │  ├─ login/
│  │  │  │  └─ layout.tsx
│  │  │  ├─ materials/        # MC routes
│  │  │  │  ├─ mrf/
│  │  │  │  ├─ inventory/
│  │  │  │  └─ layout.tsx
│  │  │  ├─ logistics/        # MLC routes
│  │  │  │  ├─ tasks/
│  │  │  │  ├─ drivers/
│  │  │  │  └─ layout.tsx
│  │  │  └─ layout.tsx        # Root layout (nav, auth)
│  │  ├─ api/
│  │  │  ├─ materials/        # MC API routes
│  │  │  └─ logistics/        # MLC API routes
│  │  └─ lib/
│  │     ├─ materials/        # MC business logic
│  │     └─ logistics/        # MLC business logic
├─ packages/
│  ├─ ui/                     # Shared components
│  ├─ auth/                   # Auth logic
│  └─ events/                 # Redis event system
└─ services/
   └─ workers/                # Background event consumers
```

### Routing Convention

```
https://scm.example.com/
├─ /              → Dashboard (role-based redirect)
├─ /materials/*   → MC UI (requires MC role)
├─ /logistics/*   → MLC UI (requires MLC role)
├─ /api/materials/* → MC API
└─ /api/logistics/* → MLC API
```

### Feature Flags

```typescript
// lib/config/features.ts
export const features = {
  materials: {
    enabled: process.env.FEATURE_MATERIALS !== 'false',
    mrf: true,
    inventory: true,
    analytics: false, // Coming soon
  },
  logistics: {
    enabled: process.env.FEATURE_LOGISTICS !== 'false',
    tasks: true,
    pod: true,
    routeOptimization: false, // v2
  },
};
```

### Auth Strategy

```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  const session = await getSession(req);
  const path = req.nextUrl.pathname;

  if (path.startsWith('/materials') && !session.roles.includes('MC')) {
    return NextResponse.redirect('/unauthorized');
  }

  if (path.startsWith('/logistics') && !session.roles.includes('MLC')) {
    return NextResponse.redirect('/unauthorized');
  }

  return NextResponse.next();
}
```

### Deployment (v1)

```yaml
# docker-compose.yml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://...
      REDIS_URL: redis://redis:6379
      FEATURE_MATERIALS: true
      FEATURE_LOGISTICS: true
    depends_on:
      - postgres
      - redis

  worker:
    build: .
    command: npm run worker
    environment:
      REDIS_URL: redis://redis:6379

  postgres:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redisdata:/data
```

- Single server deployment (AWS EC2, Hetzner, DigitalOcean)
- Estimated cost: $50-100/month initially

---

## Implementation: Phase 2 (v2.0 - Micro-Frontends)

### Trigger Conditions

Migrate when:

- [ ] >1000 concurrent users
- [ ] MC and MLC need independent deploy schedules
- [ ] Performance bottlenecks in one app affect the other
- [ ] Team size >15 developers

### Architecture (v2)

```
┌───────────────────────────────────────────────────────────┐
│               Nginx / Kong API Gateway                    │
│  ├─ /materials/*  → http://materials-app:3001            │
│  ├─ /logistics/*  → http://logistics-app:3002            │
│  └─ /api/auth/*   → http://auth-service:3003             │
└───────────────────────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │Materials │   │Logistics │   │  Auth    │
   │  App     │   │  App     │   │ Service  │
   │ :3001    │   │ :3002    │   │ :3003    │
   └──────────┘   └──────────┘   └──────────┘
        │              │              │
        └──────────────┴──────────────┘
                       ▼
            ┌──────────────────┐
            │ Shared Postgres  │
            │ + Redis          │
            └──────────────────┘
```

### Migration Steps

1. **Extract Auth Service**
   - Move `/lib/auth` → separate `auth-service`
   - Shared JWT validation
   - All apps validate tokens via auth service

2. **Split Frontend Apps**
   - Materials: `/apps/web` → `/apps/materials-app`
   - Logistics: `/apps/web` → `/apps/logistics-app`
   - Each builds independently

3. **API Gateway**
   - Deploy Kong/Nginx
   - Route `/materials/*` → `materials-app`
   - Route `/logistics/*` → `logistics-app`
   - Handle CORS and auth forwarding

4. **Database Segregation (Optional)**
   - Split `mrf_*` tables → materials DB
   - Split `logistics_*` tables → logistics DB
   - Keep shared tables in shared DB

5. **Independent CI/CD**
   - GitHub Actions per app
   - Turborepo still builds only affected

---

## Deployment Comparison

| Aspect | v1 (Monolith) | v2 (Micro-Frontends) |
|--------|---------------|----------------------|
| Infrastructure | 1 server | 3+ servers |
| Deploy time | 5 min | 15 min (3 apps) |
| Cost | $50-100/month | $200-400/month |
| Complexity | Low | Medium |
| Independence | No | Yes |
| Scale | Vertical (bigger server) | Horizontal (more servers) |
| Local dev | `npm run dev` | `docker-compose up` |

---

## Rollback Strategy

### v1 → v2 Migration Rollback

If micro-frontends fail, we can revert:

1. Redeploy monolith artifact (kept for 30 days)
2. Redirect API Gateway to monolith
3. Disable feature flags for split services
4. Investigate failure, fix, retry

- **Rollback time:** <15 minutes
- **Data loss:** None (database unchanged)

---

## Security Considerations

### v1 (Monolith)
- Single session cookie (httpOnly, secure)
- CSRF tokens for mutations
- Rate limiting per IP

### v2 (Micro-Frontends)
- JWT tokens (signed, 1-hour expiry)
- Refresh tokens (httpOnly cookie)
- API Gateway enforces rate limits
- Each app validates JWT independently

---

## Testing Strategy

### v1 (Monolith)
```bash
# Run all tests
npm run test

# Test specific app
npm run test --filter=materials
```

### v2 (Micro-Frontends)
```bash
# Contract tests (ensure APIs compatible)
npm run test:contracts

# End-to-end (across services)
npm run test:e2e

# Per-service tests
cd apps/materials-app && npm test
```

---

## Consequences

### Positive
✅ Fast launch: v1 in 3 months vs 6 months for micro-frontends  
✅ Lower cost: $50/month vs $400/month initially  
✅ Simpler ops: Single deployment vs orchestrating 3+ services  
✅ Easier debugging: All logs in one place  
✅ Gradual migration: Based on real needs, not speculation  

### Negative
⚠️ Refactor work: Must extract services later (planned effort)  
⚠️ Discipline required: Enforce boundaries in monolith (lint rules)  
⚠️ Temporary coupling: Apps can't scale independently in v1  

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Team violates module boundaries | ESLint rules + PR reviews |
| Monolith becomes unmaintainable | Strict adherence to Governance Spec |
| Never migrate to v2 | Set trigger metrics (1000 users, team size) |
| Migration breaks production | Gradual rollout + feature flags + rollback plan |

---

## Success Metrics

### v1 (Months 1-6)
- [ ] Deploy to production <1 week after v1 complete
- [ ] Page load time <2 seconds
- [ ] Support 500 concurrent users
- [ ] Zero cross-app import violations

### v2 (Months 6-12)
- [ ] Independent deployments (no coordination)
- [ ] Materials app downtime doesn't affect Logistics
- [ ] Scale to 5000 concurrent users
- [ ] Deploy time <15 minutes per app

---

## References
- [Monolith First (Martin Fowler)](https://martinfowler.com/bliki/MonolithFirst.html)
- [Micro Frontends](https://micro-frontends.org/)
- [Next.js Multi-Zones](https://nextjs.org/docs/advanced-features/multi-zones)

---

## Approvals

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tech Lead | [TBD] | 2025-10-09 | ✓ |
| Product Manager | [TBD] | 2025-10-09 | ✓ |
| Engineering Manager | [TBD] | 2025-10-09 | ✓ |

