# SCM Hub Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the SCM Hub application to production, staging, and development environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Deployment Methods](#deployment-methods)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Environment Configuration](#environment-configuration)
7. [Monitoring & Health Checks](#monitoring--health-checks)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git >= 2.30.0

### Required Accounts
- GitHub account (for version control)
- GitHub Pages (for hosting) OR
- Vercel/Netlify account (alternative hosting)
- Supabase account (for database)

### Access Requirements
- Repository write access
- GitHub Actions enabled
- GitHub Pages enabled

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/stevenshelley58-afk/SCM-Hub-V4.git
cd SCM-Hub-V4
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env` files for each environment:

#### `.env.development`
```env
VITE_APP_ENV=development
VITE_APP_NAME=SCM Hub (Dev)
VITE_API_BASE_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# SharePoint
VITE_SHAREPOINT_SITE_URL=https://toll.sharepoint.com/sites/scm-dev
VITE_SHAREPOINT_CLIENT_ID=dev-client-id

# LTR Integration
VITE_LTR_API_URL=https://ltr-dev.toll.com/api
VITE_LTR_API_KEY=dev-api-key

# Email (SendGrid)
VITE_SENDGRID_API_KEY=dev-sendgrid-key
VITE_SENDGRID_FROM_EMAIL=dev-noreply@toll.com

# SMS (Twilio)
VITE_TWILIO_ACCOUNT_SID=dev-account-sid
VITE_TWILIO_AUTH_TOKEN=dev-auth-token
VITE_TWILIO_FROM_NUMBER=+61400000000

# Teams
VITE_TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/dev
```

#### `.env.staging`
```env
VITE_APP_ENV=staging
VITE_APP_NAME=SCM Hub (Staging)
VITE_API_BASE_URL=https://staging-api.toll.com
# ... (same structure as development with staging values)
```

#### `.env.production`
```env
VITE_APP_ENV=production
VITE_APP_NAME=SCM Hub
VITE_API_BASE_URL=https://api.toll.com
# ... (same structure with production values)
```

---

## Build Process

### Development Build

```bash
npm run dev
```

This starts the development server on `http://localhost:3001/SCM-Hub-V4/`

### Production Build

```bash
npm run build
```

This creates optimized production files in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## Deployment Methods

### Method 1: GitHub Pages (Current Method)

#### Automatic Deployment

1. Push to main branch:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

2. The GitHub Actions workflow automatically builds and deploys to GitHub Pages.

#### Manual Deployment

```bash
npm run deploy
```

This runs the build and pushes to the `gh-pages` branch.

### Method 2: Vercel

#### Setup

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

#### Configuration

Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_API_BASE_URL": "@api_base_url",
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

### Method 3: Netlify

#### Setup

1. Install Netlify CLI:
```bash
npm i -g netlify-cli
```

2. Login:
```bash
netlify login
```

3. Deploy:
```bash
netlify deploy --prod
```

#### Configuration

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### Method 4: AWS S3 + CloudFront

#### Setup

1. Install AWS CLI:
```bash
npm i -g aws-cli
```

2. Configure AWS credentials:
```bash
aws configure
```

3. Create S3 bucket:
```bash
aws s3 mb s3://scmhub-production
```

4. Build and upload:
```bash
npm run build
aws s3 sync dist/ s3://scmhub-production --delete
```

5. Invalidate CloudFront cache:
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy SCM Hub

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linter
        run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist/
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Blue-Green Deployment

For zero-downtime deployments:

```bash
# Deploy to green environment
npm run deploy:green

# Run smoke tests
npm run test:smoke:green

# Switch traffic to green
npm run switch:green

# Keep blue as fallback for 24 hours
# After 24 hours, update blue with new version
```

---

## Environment Configuration

### Staging Environment

**URL:** https://staging.scmhub.toll.com

**Purpose:**
- Testing new features
- UAT (User Acceptance Testing)
- Integration testing

**Deployment:**
```bash
npm run build:staging
npm run deploy:staging
```

### Production Environment

**URL:** https://scmhub.toll.com

**Purpose:**
- Live production application
- Serving real users

**Deployment:**
```bash
npm run build:production
npm run deploy:production
```

### Development Environment

**URL:** http://localhost:3001/SCM-Hub-V4/

**Purpose:**
- Local development
- Feature development
- Debugging

**Run:**
```bash
npm run dev
```

---

## Monitoring & Health Checks

### Health Check Endpoint

Create `public/health.json`:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-10-09T00:00:00Z"
}
```

### Monitoring Tools

1. **Uptime Monitoring**
   - Use UptimeRobot or Pingdom
   - Check every 5 minutes
   - Alert on 2+ failures

2. **Error Tracking**
   - Integrate Sentry for error tracking
   - Track JavaScript errors
   - Monitor API failures

3. **Performance Monitoring**
   - Use Google Analytics
   - Monitor page load times
   - Track user interactions

### Example Sentry Setup

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your-dsn@sentry.io/project-id",
  environment: import.meta.env.VITE_APP_ENV,
  tracesSampleRate: 1.0,
});
```

---

## Rollback Procedures

### GitHub Pages Rollback

1. Find previous successful deployment:
```bash
git log --oneline gh-pages
```

2. Revert to previous version:
```bash
git checkout gh-pages
git reset --hard <commit-hash>
git push origin gh-pages --force
```

### Vercel Rollback

1. List deployments:
```bash
vercel ls
```

2. Rollback to previous:
```bash
vercel rollback <deployment-url>
```

### Manual Rollback

1. Checkout previous version:
```bash
git checkout <previous-commit>
```

2. Deploy:
```bash
npm run build
npm run deploy
```

---

## Troubleshooting

### Common Issues

#### Build Failures

**Problem:** Build fails with TypeScript errors

**Solution:**
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

#### Environment Variables Not Loaded

**Problem:** Environment variables are undefined

**Solution:**
- Ensure `.env` file exists
- Prefix variables with `VITE_`
- Restart dev server after changes

#### 404 Errors on Routes

**Problem:** Direct URLs return 404

**Solution:**
Add to `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/SCM-Hub-V4/',
  // ...
});
```

#### GitHub Pages Not Updating

**Problem:** Changes don't appear after deployment

**Solution:**
1. Clear browser cache
2. Wait 5-10 minutes for CDN propagation
3. Check GitHub Actions logs for errors

---

## Performance Optimization

### 1. Code Splitting

Vite automatically code-splits. Verify in build output:
```bash
npm run build
# Look for multiple JS chunks in dist/assets/
```

### 2. Asset Optimization

**Images:**
```bash
# Install image optimizer
npm install -D vite-plugin-imagemin

# Add to vite.config.ts
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
    }),
  ],
});
```

### 3. Caching Strategy

Add cache headers (if using custom server):
```
Cache-Control: public, max-age=31536000, immutable  # For assets
Cache-Control: no-cache  # For index.html
```

---

## Security Checklist

Before deploying to production:

- [x] All environment variables configured
- [x] HTTPS enforced
- [x] Security headers configured
- [x] CSRF protection enabled
- [x] Rate limiting configured
- [x] Error messages don't expose sensitive info
- [x] Dependencies scanned for vulnerabilities
- [x] Backup system configured
- [x] Monitoring and alerting set up
- [x] Incident response plan documented

---

## Post-Deployment Checklist

- [x] Verify deployment URL is accessible
- [x] Test authentication flow
- [x] Test critical user flows
- [x] Check browser console for errors
- [x] Verify API integrations working
- [x] Test on multiple browsers
- [x] Test on mobile devices
- [x] Monitor error rates
- [x] Check performance metrics
- [x] Notify stakeholders of deployment

---

## Support & Resources

**Documentation:**
- Main README: `/README.md`
- API Docs: `/INTEGRATION_API_DOCS.md`
- Security Audit: `/SECURITY_AUDIT.md`

**Contacts:**
- Development Team: dev@toll.com
- DevOps Team: devops@toll.com
- Security Team: security@toll.com

**Emergency Contacts:**
- On-call Developer: 1800-DEV-ONCALL
- System Admin: 1800-SYS-ADMIN

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-09  
**Maintained by:** Agent 3 - Integrations & Infrastructure
