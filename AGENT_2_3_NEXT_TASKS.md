# 🚀 Agent 2 & 3 - Next Available Tasks

**Status:** Agent 1 completed MC god mode (impl-15). All agents ready for new assignments.  
**Progress:** 29/70 tasks complete (41%)  
**Deployment:** Live on https://stevenshelley58-afk.github.io/SCM-Hub-V4/

---

## ✅ What's Been Completed

### Agent 1 (Core Workflows)
- ✅ impl-9: Split MRF capability
- ✅ impl-17: P1 approval workflow  
- ✅ impl-32: Feature toggles (P1 approval can be turned on/off)
- ✅ impl-15: MC god mode permissions (was Agent 2's task, completed by Agent 1)

### New Features Available:
1. **Feature Toggle System** (`config/features.ts`)
   - Toggle P1 approval on/off without code changes
   - Framework ready for more feature flags

2. **Permissions System** (`utils/permissions.ts`)
   - Comprehensive role-based permissions
   - MC has "god mode" - can do anything
   - Permission checking: `hasPermission(user, 'permission_name')`
   - Context-aware: `canEditRequest(user, request)`, `canCancelRequest(user, request)`

3. **Permission Badge** (`components/ui/PermissionBadge.tsx`)
   - Shows purple "GOD MODE" badge for MC users in header
   - Hover tooltip explains all MC permissions

---

## 🟢 Agent 2 - Priority Tasks (Admin & Monitoring)

Since **impl-15 is complete**, here are your next high-priority tasks:

### 🔥 CRITICAL (Do These First)

#### 1. **impl-21: Add comprehensive reporting**
**Why:** Users need visibility into operations  
**What to build:**
- `features/reports/ReportsView.tsx` - Main reports dashboard
- Reports to include:
  - Requests by status (pie chart + table)
  - Time to fulfill (average, by priority)
  - Short pick analysis (top reasons, trends)
  - Requestor activity report
  - AC performance by scope
- Export to CSV/Excel functionality
- Date range filters
- Print-friendly layouts

**Files to create:**
```
features/reports/
  ├── ReportsView.tsx
  ├── components/
  │   ├── RequestsByStatusReport.tsx
  │   ├── TimeToFulfillReport.tsx
  │   ├── ShortPickAnalysisReport.tsx
  │   ├── RequestorActivityReport.tsx
  │   └── ExportButton.tsx
  └── utils/
      ├── reportCalculations.ts
      └── csvExport.ts
```

**Permissions:** Only MC and AC should see reports  
**Use existing:** `mockRequestsData`, `mockRequestItems`, status history

---

#### 2. **impl-22: Add audit trail system**
**Why:** Compliance and debugging  
**What to build:**
- `features/admin/AuditLogView.tsx` - Searchable audit log
- Capture all actions:
  - Status changes (already tracking via `statusHistory`)
  - Priority changes
  - Manual overrides (MC god mode actions)
  - Material locks/unlocks
  - Request splits
  - Approvals/rejections
- Filters: user, date range, action type, request ID
- Export audit log to CSV

**Files to create:**
```
features/admin/
  └── AuditLogView.tsx
utils/
  └── auditLogger.ts
types/
  └── audit.ts (AuditLogEntry interface)
```

**Storage:** Add `mockAuditLog` to `services/api.ts`  
**Permissions:** Only MC can view full audit log

---

#### 3. **impl-25: Add MC backend control panel**
**Why:** Central control for system management  
**What to build:**
- `features/admin/MCControlPanel.tsx`
- Tabs:
  1. **Dashboard** - System health overview
  2. **Users** - View/edit user list
  3. **Permissions** - Assign roles
  4. **Configuration** - Feature flags, system limits
  5. **Audit Log** - Link to impl-22

**Files to create:**
```
features/admin/
  ├── MCControlPanel.tsx
  └── components/
      ├── SystemHealthTab.tsx
      ├── UserManagementTab.tsx
      ├── PermissionsTab.tsx
      └── ConfigurationTab.tsx
```

**Navigation:** Add to `navLinks` for MC only  
**Use:** `config/features.ts` for feature flags, `utils/permissions.ts` for role management

---

#### 4. **impl-26: Add system health monitoring**
**Why:** Proactive issue detection  
**What to build:**
- `features/admin/SystemHealthView.tsx`
- Metrics cards:
  - **Request Backlog:** Count of Submitted/Picking requests, trend vs last hour
  - **Average Fulfillment Time:** Hours from Submitted → Delivered
  - **Short Pick Rate:** % of items marked as Short
  - **P1 Pending Approval:** Count (if feature enabled)
  - **On Hold Requests:** Count with average hold duration
- Alert indicators (red if threshold exceeded)
- Real-time auto-refresh

**Files to create:**
```
features/admin/
  └── SystemHealthView.tsx
utils/
  └── healthMetrics.ts
```

**Thresholds:** Define in `config/features.ts` or create `config/alerts.ts`

---

### 📊 MEDIUM PRIORITY

#### 5. **impl-28: Add wall display dashboard**
- Large screen optimized (TV display for warehouse)
- Auto-refresh every 10 seconds
- Show:
  - Current pick queue (top 10)
  - P1 alerts (flashing red)
  - Partial picks needing attention
  - Today's completed deliveries count
- Full-screen mode
- Route: `/wall-display`

#### 6. **impl-29: Add P1 dashboard**
- Dedicated P1 request tracking
- Show: Pending Approval, Approved (Picking), Delivered P1s
- Countdown timers (time until required by)
- Escalation alerts (< 1 hour warning)
- Quick approve/reject buttons

---

## 🟠 Agent 3 - Priority Tasks (Integrations)

### 🔥 CRITICAL (Do These First)

#### 1. **impl-16: Add stakeholder notification system**
**Why:** Users need to know what's happening  
**What to build:**
- `utils/notifications.ts` - Core notification engine
- Mock notification delivery (console.log for now, real later)
- Notifications:
  - **To Requestor:**
    - Request submitted (confirmation)
    - Request approved (P1)
    - Picking started
    - On hold (with reason)
    - Short pick (what's short, what's coming)
    - Staged (ready for pickup)
    - Delivered (confirmation)
  - **To MC:**
    - P1 submitted (needs approval)
    - Request on hold > 24 hours
  - **To AC:**
    - Requests from their scope with issues

**Files to create:**
```
utils/
  ├── notifications.ts
  └── notificationRules.ts
types/
  └── notification.ts
features/notifications/
  ├── NotificationCenter.tsx (in-app notification panel)
  └── NotificationPreferences.tsx (user settings)
```

**Integration points:** Call `sendNotification()` from:
- `WOMaterialView.tsx` (request submitted)
- `P1ApprovalView.tsx` (approved/rejected)
- `QubePickListView.tsx` (on hold, cancelled)
- `PickingView.tsx` (short pick, staged, delivered)

---

#### 2. **impl-36: Add notification templates**
**Why:** Consistent, professional messaging  
**What to build:**
- `config/notificationTemplates.ts`
- Templates for each notification type
- Variable substitution: `{requestId}`, `{userName}`, `{deliveryLocation}`, etc.
- Support for:
  - Plain text (for SMS)
  - HTML (for email)
  - Rich text (for in-app)

**Example template:**
```typescript
export const templates = {
  REQUEST_SUBMITTED: {
    title: 'Request Submitted Successfully',
    body: 'Your material request {requestId} has been submitted and is in the warehouse queue. Required by: {requiredBy}',
    sms: 'MRF {requestId} submitted. Required by {requiredBy}. Track at {url}',
    email: '<html>...</html>'
  },
  // ... more templates
};
```

---

#### 3. **impl-23: Add photo documentation**
**Why:** Visual proof and issue documentation  
**What to build:**
- `components/ui/PhotoUpload.tsx` - Reusable photo upload component
- Image compression (< 500KB per image)
- Multiple photos per request
- Photo types:
  - Material condition (on submit)
  - Storage location
  - Delivery proof (POD)
  - Issue documentation (shorts)
- Image preview and deletion
- Storage: Base64 encode and store in request object for now

**Files to create:**
```
components/ui/
  └── PhotoUpload.tsx
utils/
  └── imageCompression.ts
types/index.ts:
  - Add photos?: Photo[] to MaterialRequest
  - Add Photo interface { id, type, base64, uploadedBy, timestamp }
```

**Add photo upload to:**
- Delivery confirmation modal (POD)
- Short pick modal (issue documentation)
- On hold modal (optional)

---

#### 4. **impl-27: Add data export/import**
**Why:** Excel integration for reporting and bulk data  
**What to build:**
- Export functionality:
  - Requests table → Excel
  - Audit log → Excel
  - Reports → Excel/PDF
- Import functionality:
  - Master data CSV import (bulk material upload)
  - Delivery locations CSV import
- Use library: `xlsx` or `sheetjs`

**Files to create:**
```
utils/
  ├── excelExport.ts
  └── csvImport.ts
features/admin/
  └── DataImportView.tsx
```

**Add export buttons to:**
- All report views
- Audit log view
- Material request table
- Pick list view

---

### 📡 MEDIUM PRIORITY

#### 5. **impl-37: Add email/SMS integration (mock)**
- Create `services/emailService.ts` (mock for now)
- Create `services/smsService.ts` (mock)
- Log to console + create a mock "outbox" view
- Store sent messages in `mockSentNotifications`
- Show delivery status (Sent, Delivered, Failed)

#### 6. **impl-38: Add Teams integration (mock)**
- Create `services/teamsService.ts`
- Post to mock Teams channel
- Show Teams messages in a mock "Teams Activity" view
- Adaptive card format for rich messages

---

## 🤝 Coordination Notes

### For Both Agents:

**DO:**
- ✅ Create new files (avoid editing shared files simultaneously)
- ✅ Use existing components (`Table`, `StatusPill`, `Modal`, etc.)
- ✅ Use existing utilities (`permissions.ts`, `statusHelpers.ts`, `materialLockHelpers.ts`)
- ✅ Add new mock data to `services/api.ts` (e.g., `mockAuditLog`, `mockNotifications`)
- ✅ Test locally: `npm run dev` → http://localhost:3001/SCM-Hub-V4/
- ✅ Commit with prefix: `[Agent 2]` or `[Agent 3]`
- ✅ Push regularly and deploy: `npm run deploy`

**AVOID:**
- ❌ Editing same files as Agent 1 (coordinate via AGENT_STATUS.md)
- ❌ Modifying types in `types/index.ts` without checking AGENT_STATUS.md first
- ❌ Breaking existing functionality (test thoroughly)

---

## 📝 Update AGENT_STATUS.md When You Start

Mark your current task as "in_progress" in `AGENT_STATUS.md`:

```markdown
## Agent 2
**Status:** 🟢 Active  
**Current Task:** impl-21 (Comprehensive Reporting)  
**Started:** 2025-10-09 14:30  
**Blockers:** None  
**Files Touching:**
- features/reports/ReportsView.tsx (NEW)
- services/api.ts (adding mockReportData)
```

---

## 🎯 Success Metrics

### Agent 2:
- MC can generate and export 5+ types of reports
- Audit log captures all critical actions
- MC control panel is functional and organized
- System health dashboard shows real-time metrics

### Agent 3:
- All status changes trigger appropriate notifications
- Notification templates are clear and professional
- Photo upload works smoothly (< 2 seconds per photo)
- Data export produces valid Excel files

---

## 🚨 Questions or Blockers?

**Check:** `AGENT_STATUS.md` for what other agents are doing  
**Ask:** Update AGENT_STATUS.md with your blocker/question  
**Coordinate:** Agent 1 can help resolve conflicts

---

**Ready to build! Let's complete this system! 💪**

