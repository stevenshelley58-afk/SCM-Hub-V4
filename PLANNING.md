# SCM-Hub Planning Package

**Version:** 1.0  
**Date:** 2025-10-09  
**Status:** Complete

---

## 📁 Directory Structure

```
SCM-Hub/
├── docs/
│   ├── adr/              # Architecture Decision Records
│   │   ├── ADR-001-monorepo-tooling.md     ✅ Complete
│   │   ├── ADR-002-event-system.md         ✅ Complete
│   │   └── ADR-003-deployment-model.md     ✅ Complete
│   ├── runbooks/         # Operational guides
│   │   ├── deployment.md                   ✅ Complete
│   │   └── incident-response.md            ✅ Complete
│   └── specs/            # Requirements docs
├── implementation-plan/
│   ├── README.md         ✅ 12-week implementation roadmap
│   ├── configs/          # Ready-to-use configuration files
│   │   ├── turbo.json                      ✅ Turborepo config
│   │   ├── package.json                    ✅ Root package.json with workspaces
│   │   ├── docker-compose.yml              ✅ Local development environment
│   │   └── .eslintrc.json                  ✅ Import boundary enforcement
│   └── code-samples/     # Reference implementations
│       ├── event-publisher.ts              ✅ Redis event publisher
│       └── event-subscriber.ts             ✅ Redis event subscriber
└── PLANNING.md           ✅ This file
```

---

## 📋 What's Included

### Architecture Decision Records (ADRs)

1. **ADR-001: Monorepo Tooling**
   - Decision: Use **Turborepo**
   - Rationale: Simplicity, speed, remote caching
   - Implementation: turbo.json config included

2. **ADR-002: Event System**
   - Decision: Use **Redis Streams**
   - Rationale: Simple ops, reliable, scales well
   - Implementation: Full publisher/subscriber code included

3. **ADR-003: Deployment Model**
   - Decision: **Monolith first**, micro-frontends later
   - Rationale: Fast time-to-market, gradual migration
   - Implementation: Phase 1 (v1) and Phase 2 (v2) plans

### Implementation Plan

- **12-week roadmap** from foundation to production
- **5 phases:**
  1. Foundation (Weeks 1-2): Monorepo setup, core infrastructure
  2. Materials App (Weeks 3-5): MC system standalone
  3. Logistics App (Weeks 6-8): MLC system standalone
  4. Integration (Weeks 9-10): Cross-app events, contract testing
  5. Observability & Polish (Weeks 11-12): Monitoring, production readiness

### Ready-to-Use Configs

All configuration files are production-ready:
- `turbo.json` - Turborepo pipeline with caching
- `package.json` - Workspace configuration
- `docker-compose.yml` - Full local dev environment (Postgres, Redis, app, worker)
- `.eslintrc.json` - Import boundary rules enforced

### Code Samples

- **EventPublisher** - Complete Redis Streams publisher with:
  - Event validation
  - Metrics tracking
  - Error handling
  - Batch publishing

- **EventSubscriber** - Complete consumer with:
  - Automatic retry logic
  - Dead letter queue handling
  - Consumer groups
  - DLQ monitoring

### Runbooks

1. **Deployment Runbook**
   - Pre-deployment checklist
   - Staging deployment (automatic + manual)
   - Production deployment (blue-green + rolling)
   - Post-deployment verification
   - Rollback procedures

2. **Incident Response Runbook**
   - Severity levels (P0-P3)
   - 6-step incident workflow
   - Common incidents with quick fixes
   - Escalation procedures
   - Post-mortem template

---

## 🚀 Next Steps

### Immediate (Week 1)

1. **Create SCM-Hub repository structure**
   ```bash
   mkdir -p apps/web/{app,api,lib}
   mkdir -p packages/{ui,auth,events,api-contracts,db}
   mkdir -p services/workers
   mkdir -p tests/{contracts,isolation,e2e}
   ```

2. **Copy configs from implementation-plan**
   ```bash
   cp implementation-plan/configs/turbo.json .
   cp implementation-plan/configs/package.json .
   cp implementation-plan/configs/docker-compose.yml .
   cp implementation-plan/configs/.eslintrc.json .
   ```

3. **Initialize Turborepo**
   ```bash
   npm install turbo --save-dev
   npm install
   ```

4. **Create directory structure**
   - Follow the structure in ADR-003

5. **Start Docker environment**
   ```bash
   docker-compose up -d
   ```

### Short-term (Weeks 2-4)

1. **Implement shared packages**
   - Auth package (Supabase + RBAC)
   - Events package (copy from code-samples/)
   - DB package (Prisma or Drizzle)

2. **Setup CI/CD**
   - Create `.github/workflows/ci.yml`
   - Configure secrets (TURBO_TOKEN, registry credentials)

3. **Start Materials App**
   - Follow implementation plan week 3-5

### Medium-term (Weeks 5-12)

Follow the 12-week implementation plan in `/implementation-plan/README.md`

---

## 📚 Key Decisions Summary

| Decision | Choice | Why |
|----------|--------|-----|
| Monorepo Tool | Turborepo | Simple, fast, great caching |
| Event System | Redis Streams | Reliable, simple ops, scales well |
| Deployment (v1) | Monolith | Fast to market, prove value first |
| Deployment (v2) | Micro-frontends | Independent scaling, after 6 months |
| Database | PostgreSQL | Proven, good for transactional + analytics |
| Cache/Events | Redis | Multi-purpose (cache, events, sessions) |
| Frontend | Next.js (implied) | SSR, API routes, great DX |
| Testing | Jest + Playwright | Unit + E2E coverage |
| CI/CD | GitHub Actions | Native integration, good free tier |

---

## 📊 Success Criteria (v1.0)

### Functional
- [ ] Materials App: Create MRF → Approve → Publish to Logistics
- [ ] Logistics App: Create task, assign driver, capture POD
- [ ] Integration: Events flow between apps bidirectionally
- [ ] Auth: Role-based access (MC, MLC, Driver, Admin)

### Performance
- [ ] Page load <2 seconds (p95)
- [ ] API response <500ms (p95)
- [ ] Event delivery <10 seconds (p99)
- [ ] Support 500 concurrent users

### Quality
- [ ] >80% code coverage
- [ ] All contract tests passing
- [ ] Zero critical security vulnerabilities
- [ ] All isolation tests passing (no cross-app imports)

### Operational
- [ ] Deployed to production
- [ ] Monitoring dashboards live (Grafana)
- [ ] Runbooks documented
- [ ] Team trained

---

## 🎯 Governance Rules (Critical)

### Import Boundaries (Enforced by ESLint)

✅ **Allowed:**
```typescript
import { Button } from '@scm/ui';
import { EventPublisher } from '@scm/events';
import { hasPermission } from '@scm/auth';
```

❌ **Forbidden:**
```typescript
import { getMRF } from '@/apps/materials/services'; // ❌ Direct app import
import { createTask } from '../../logistics/utils';  // ❌ Cross-app relative import
```

### Database Segregation

✅ **Allowed:**
- Materials app queries `mrf_*` tables
- Logistics app queries `logistics_*` tables
- Both query shared tables (`users`, `sites`)

❌ **Forbidden:**
- Materials app queries `logistics_*` tables directly
- Logistics app queries `mrf_*` tables directly

**Use events instead:**
```typescript
// ✅ Correct way
await eventPublisher.publish({
  type: 'mrf.ready',
  payload: { mrf_id, pickup, dropoff }
});

// ❌ Wrong way
await db.logistics_tasks.create({ ... }); // from Materials app
```

### Event Communication Only

All cross-app communication MUST go through Redis Streams:
- Materials App → Redis Stream → Logistics App
- Logistics App → Redis Stream → Materials App

**No direct API calls between apps** (even in monolith v1).

---

## 🔐 Security Checklist

Before production:

- [ ] All secrets in vault (not .env committed)
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (use ORM/parameterized queries)
- [ ] XSS prevention (React escapes by default)
- [ ] CSRF tokens on mutations
- [ ] RLS policies on all tables
- [ ] JWT tokens short-lived (<1 hour)
- [ ] Refresh tokens httpOnly + secure
- [ ] Audit logging enabled

---

## 📞 Support

For questions about this planning package:

- Review ADRs for rationale behind decisions
- Check implementation plan for detailed steps
- See runbooks for operational procedures
- Refer to code samples for reference implementations

---

## 📄 License

This planning package is internal documentation for SCM-Hub development.

**Generated:** 2025-10-09  
**Planning Package Version:** 1.0  
**Ready for:** Development team handoff

---

## ✅ Completeness Checklist

Planning package includes:

- [x] 3 Architecture Decision Records (ADRs)
- [x] 12-week implementation roadmap
- [x] Complete monorepo configuration (turbo.json, package.json)
- [x] Docker Compose for local development
- [x] ESLint rules for import boundaries
- [x] Redis event publisher implementation
- [x] Redis event subscriber implementation
- [x] Deployment runbook
- [x] Incident response runbook
- [x] Governance rules documented
- [x] Security checklist
- [x] Success criteria defined

**Status: COMPLETE ✅**

The planning package is ready for implementation.

