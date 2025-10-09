# ADR-001: Monorepo Tooling Selection

**Status:** Accepted  
**Date:** 2025-10-09  
**Deciders:** Architecture Team  
**Technical Story:** SCM-Hub requires efficient monorepo management

---

## Context

The SCM-Hub will contain multiple applications (Materials, Logistics, future modules) with shared libraries. We need a monorepo orchestration tool that:

- Detects which apps are affected by changes
- Builds only what's necessary (not everything on every commit)
- Caches build artifacts locally and remotely
- Manages task dependencies (build shared packages before apps)
- Integrates with CI/CD pipelines

### Options Considered

1. **Turborepo** (by Vercel)
2. **Nx** (by Nrwl)
3. **Lerna** (legacy, maintenance mode)
4. **Rush** (by Microsoft)
5. **Manual scripts** (npm workspaces only)

---

## Decision

**We will use Turborepo.**

---

## Rationale

### Why Turborepo

| Criteria | Turborepo | Nx | Lerna | Rush |
|----------|-----------|-----|-------|------|
| **Learning curve** | Low (simple config) | Medium (more complex) | Low | High |
| **Build speed** | Excellent (parallel + cache) | Excellent | Poor | Good |
| **Remote caching** | Built-in (Vercel) | Built-in (Nx Cloud) | None | Yes |
| **TypeScript support** | Native | Native | Basic | Native |
| **CI integration** | Simple | Complex | Manual | Complex |
| **Affected detection** | Yes | Yes | No | Yes |
| **Community** | Growing fast | Large | Declining | Small |
| **Maintenance** | Active (Vercel) | Active | Minimal | Active |

### Key Advantages

1. **Simplicity:** Single `turbo.json` config file
   ```json
   {
     "pipeline": {
       "build": { "dependsOn": ["^build"] },
       "test": { "dependsOn": ["build"] }
     }
   }
   ```

2. **Speed:** Parallel execution + remote caching = 10x faster CI
   - First build: 5 minutes
   - Cached build: 30 seconds

3. **Incremental adoption:** Works with existing npm/pnpm/yarn workspaces

4. **Zero config for common cases:** Understands package.json scripts

5. **Remote caching out-of-box:** Vercel hosting or self-hosted

6. **Prune command:** Create minimal Docker images per app
   ```bash
   turbo prune --scope=logistics --docker
   ```

### Why Not Nx
- More powerful but overkill for our use case
- Steeper learning curve (generators, plugins, custom executors)
- More opinionated about project structure
- Requires more maintenance (nx.json + workspace.json)

### Why Not Lerna
- In maintenance mode (minimal updates)
- No built-in caching or parallelization
- Would need custom scripts for affected detection

### Why Not Rush
- Microsoft-focused (optimized for .NET workflows)
- Complex configuration (rush.json + command configs)
- Smaller community, fewer resources

---

## Implementation Plan

### Phase 1: Setup (Week 1)
```bash
# Install Turborepo
npm install turbo --save-dev

# Create turbo.json at root
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Phase 2: Configure Workspaces (Week 1)
```json
// package.json (root)
{
  "name": "scm-hub",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/shared/*",
    "services/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  }
}
```

### Phase 3: Per-App Filters (Week 1)
```bash
# Run only materials app
turbo run dev --filter=materials

# Run all apps in scope
turbo run build --filter=...logistics

# Run affected by changes
turbo run test --filter=[HEAD^1]
```

### Phase 4: Remote Cache (Week 2)
**Option A: Vercel Remote Cache (easiest)**
```bash
npx turbo login
npx turbo link
```

**Option B: Self-hosted (more control)**
```yaml
# docker-compose.yml
services:
  turbo-cache:
    image: ducktors/turborepo-remote-cache
    ports:
      - "3000:3000"
    environment:
      TURBO_TOKEN: ${TURBO_TOKEN}
```

---

## Consequences

### Positive
✅ 10x faster CI builds (only build affected apps)  
✅ Developer experience: Instant feedback on local changes  
✅ Cost savings: Less CI minutes consumed  
✅ Simple mental model: Easy to onboard new devs  
✅ Scales to 100+ packages if needed  

### Negative
⚠️ New dependency: Team must learn Turborepo basics  
⚠️ Cache invalidation: Need to understand cache keys  
⚠️ Remote cache cost: Vercel charges for large teams (can self-host)  

### Neutral
🔹 Not reversible easily: Switching to Nx later requires refactor  
🔹 Opinionated caching: Must follow Turborepo's model  

---

## Validation

### Success Metrics (90 days)
- [ ] CI build time reduced by >70%
- [ ] Developers can run `turbo dev --filter=X` without docs
- [ ] Remote cache hit rate >50%
- [ ] Zero cache-related bugs in production

### Exit Criteria (if we decide to switch)
- CI build time increases >50%
- Turborepo abandoned by Vercel
- Need features only available in Nx (generators, custom executors)

---

## References
- [Turborepo Docs](https://turbo.build/repo/docs)
- [Monorepo Comparison](https://monorepo.tools)
- [Vercel Remote Cache](https://vercel.com/docs/concepts/monorepos/remote-caching)

---

## Approvals

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tech Lead | [TBD] | 2025-10-09 | ✓ |
| DevOps Lead | [TBD] | 2025-10-09 | ✓ |
| Engineering Manager | [TBD] | 2025-10-09 | ✓ |

---

**Next ADR:** ADR-002: Event System Selection

