# SCM Hub - Material Coordinator Backend Specification

**Generated:** 2025-10-08  
**Purpose:** Define ALL configurable options for MC Control Panel  
**Version:** 1.0

---

## 🎯 OVERVIEW

**Key Principle from Stakeholder:** 
> "Make everything an option I can configure in the MC backend. Do NOT hard-code anything."

The MC Backend is the **control center** for the entire SCM Hub. Material Coordinators need the ability to:
- Configure all permissions and rules
- Manage master data
- Monitor system health
- Resolve conflicts
- Override any action
- Generate reports

---

## 📊 MC BACKEND NAVIGATION

```
┌─────────────────────────────────────────────────────────┐
│ SCM Hub - Material Coordinator Control Panel            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Dashboard                                               │
│ ├─ Overview                                             │
│ ├─ P1 Dashboard                                         │
│ ├─ Partial Picks Dashboard                              │
│ └─ Wall Display                                         │
│                                                         │
│ Permissions & Users                                     │
│ ├─ User Management                                      │
│ ├─ Role Configuration                                   │
│ ├─ Permission Rules                                     │
│ ├─ Whitelist Manager                                    │
│ └─ Data Visibility Settings                             │
│                                                         │
│ Workflows & Status                                      │
│ ├─ Status Configuration                                 │
│ ├─ Workflow Rules                                       │
│ ├─ Approval Settings                                    │
│ └─ Queue Management                                     │
│                                                         │
│ Notifications                                           │
│ ├─ Stakeholder Management                               │
│ ├─ Stakeholder Lists                                    │
│ ├─ Notification Rules                                   │
│ ├─ Templates                                            │
│ ├─ Channel Settings (Email/SMS/Teams)                   │
│ └─ Notification Log                                     │
│                                                         │
│ Master Data                                             │
│ ├─ Data Sync Dashboard                                  │
│ ├─ Conflict Resolution                                  │
│ ├─ Manual Data Ingest                                   │
│ ├─ SharePoint Integration                               │
│ └─ Data Validation Rules                                │
│                                                         │
│ Configuration                                           │
│ ├─ Delivery Locations                                   │
│ ├─ Short Reasons                                        │
│ ├─ Priority Settings                                    │
│ ├─ System Limits                                        │
│ └─ Feature Toggles                                      │
│                                                         │
│ Integrations                                            │
│ ├─ Toll (LTR) Integration                               │
│ ├─ JDE Integration                                      │
│ └─ API Keys & Endpoints                                 │
│                                                         │
│ Reports & Analytics                                     │
│ ├─ Request Metrics                                      │
│ ├─ Picker Performance                                   │
│ ├─ Work Order Analysis                                  │
│ ├─ Delivery Performance                                 │
│ ├─ Partial Pick Analysis                                │
│ ├─ Priority Analysis                                    │
│ ├─ User Activity                                        │
│ └─ Custom Reports                                       │
│                                                         │
│ System                                                  │
│ ├─ Audit Log                                            │
│ ├─ System Health                                        │
│ ├─ Error Log                                            │
│ └─ Backup & Export                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 CONFIGURATION MODULES

### 1️⃣ USER MANAGEMENT

**Path:** Permissions & Users → User Management

**Features:**
```
User List
┌──────────────────────────────────────────────────────┐
│ Users                                       [+ New]  │
├──────────────────────────────────────────────────────┤
│ Search: [______] Role: [All ▼] Status: [All ▼]      │
│                                                      │
│ Name           Email            Role       Status    │
│ Jane Doe       jane@ex.com      Requestor  Active [⚙️]│
│ Steve Smith    steve@ex.com     AC         Active [⚙️]│
│ JJ Jones       jj@ex.com        Qube       Active [⚙️]│
│ Corey Lee      corey@ex.com     MC         Active [⚙️]│
│ John Driver    john@ex.com      Toll       Active [⚙️]│
│ Mike Read      mike@ex.com      ReadOnly   Active [⚙️]│
│                                                      │
│ Total: 6 active users                                │
└──────────────────────────────────────────────────────┘
```

**Add/Edit User:**
```
┌────────────────────────────────────────────┐
│ Edit User: Jane Doe             [✕ Close] │
├────────────────────────────────────────────┤
│ Name: [Jane Doe__________________]         │
│ Email: [jane@example.com_________]         │
│ Role: [Requestor ▼]                        │
│                                            │
│ Status: (•) Active  ( ) Inactive           │
│                                            │
│ Work Order Access:                         │
│ ☑ All Work Orders                          │
│ ☐ Specific Teams: [Select Teams ▼]        │
│   ☐ Team A  ☐ Team B  ☐ Team C  ...       │
│                                            │
│ Custom Permissions: (overrides role)       │
│ ☐ Can create requests                      │
│ ☐ Can cancel requests                      │
│ ☐ Can lock materials                       │
│ ☐ Can see all requests                     │
│ [+ Add Permission]                         │
│                                            │
│ Notification Preferences:                  │
│ ☑ Email  ☑ In-App  ☐ SMS                   │
│                                            │
│ [Delete User] [Save Changes]               │
└────────────────────────────────────────────┘
```

**Configurable Options:**
- ✅ Add/edit/delete users
- ✅ Assign roles
- ✅ Set custom permissions per user
- ✅ Restrict work order access (all vs specific teams)
- ✅ Activate/deactivate users
- ✅ Bulk import users (CSV)
- ✅ Export user list

---

### 2️⃣ ROLE CONFIGURATION

**Path:** Permissions & Users → Role Configuration

**Features:**
```
Role Configuration
┌──────────────────────────────────────────────────────┐
│ Roles                                       [+ New]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Requestor (12 users)                            [⚙️] │
│ • Create material requests                          │
│ • View own requests                                 │
│ • Cancel own requests (before picking)              │
│                                                      │
│ Area Coordinator (8 users)                      [⚙️] │
│ • All Requestor permissions                         │
│ • Lock/unlock materials (own team)                  │
│ • Set priority queue (own team)                     │
│ • View scope dashboard                              │
│                                                      │
│ Qube User (5 users)                             [⚙️] │
│ • View pick list                                    │
│ • Pick items                                        │
│ • Mark as short                                     │
│ • Split requests                                    │
│                                                      │
│ Material Coordinator (3 users)                  [⚙️] │
│ • GOD MODE - Can do everything                      │
│ • Override all permissions                          │
│ • Access control panel                              │
│                                                      │
│ Toll Driver (4 users)                           [⚙️] │
│ • View toll queue                                   │
│ • Accept/deliver requests                           │
│ • Update ETA                                        │
│ • Capture POD                                       │
│                                                      │
│ Read Only (8 users)                             [⚙️] │
│ • View all data                                     │
│ • No create/edit permissions                        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Edit Role:**
```
┌────────────────────────────────────────────┐
│ Edit Role: Requestor            [✕ Close] │
├────────────────────────────────────────────┤
│ Role Name: [Requestor____________]         │
│ Description: [Can create and track_____]   │
│              [material requests________]   │
│                                            │
│ Permissions:                               │
│ ┌────────────────────────────────────────┐│
│ │ Material Requests                      ││
│ │ ☑ View all requests                    ││
│ │ ☑ View own requests                    ││
│ │ ☑ Create requests                      ││
│ │ ☑ Edit own requests (before submitted)││
│ │ ☑ Cancel own requests (before picking)││
│ │ ☐ Cancel any request                   ││
│ │ ☐ Split requests                       ││
│ │                                        ││
│ │ Work Orders & Materials                ││
│ │ ☑ View WO materials (all teams)        ││
│ │ ☐ View WO materials (own team only)    ││
│ │ ☐ Lock materials                       ││
│ │ ☐ Unlock materials                     ││
│ │                                        ││
│ │ Pick List                              ││
│ │ ☐ View pick list                       ││
│ │ ☐ Start picking                        ││
│ │ ☐ Mark items picked                    ││
│ │ ☐ Mark items short                     ││
│ │                                        ││
│ │ Delivery                               ││
│ │ ☐ View toll queue                      ││
│ │ ☐ Accept deliveries                    ││
│ │ ☐ Mark delivered                       ││
│ │                                        ││
│ │ Priority & Queue                       ││
│ │ ☐ Set priority queue                   ││
│ │ ☐ Change request priority              ││
│ │ ☐ Approve P1 requests                  ││
│ │                                        ││
│ │ Status Changes                         ││
│ │ ☐ Change status (any)                  ││
│ │ ☑ Put on hold                          ││
│ │ ☐ Move status backwards                ││
│ │                                        ││
│ │ Reports & Analytics                    ││
│ │ ☑ View basic reports                   ││
│ │ ☐ View all reports                     ││
│ │ ☐ Export reports                       ││
│ │                                        ││
│ │ Administration                         ││
│ │ ☐ Access control panel                 ││
│ │ ☐ Manage users                         ││
│ │ ☐ Configure system                     ││
│ └────────────────────────────────────────┘│
│                                            │
│ [Delete Role] [Save Changes]               │
└────────────────────────────────────────────┘
```

**Configurable Options:**
- ✅ Create custom roles
- ✅ Edit role permissions (granular, 50+ permissions)
- ✅ Clone role (duplicate & modify)
- ✅ Delete role (if no users assigned)
- ✅ View users per role

---

### 3️⃣ PERMISSION RULES

**Path:** Permissions & Users → Permission Rules

**Advanced permission system for complex scenarios.**

```
Permission Rules
┌──────────────────────────────────────────────────────┐
│ Rules                                       [+ New]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ✓ AC can only lock own team materials          [⚙️] │
│   If: Role = AC                                     │
│   Then: Lock material (condition: same team)        │
│                                                      │
│ ✓ Requestor can cancel before picking only     [⚙️] │
│   If: Role = Requestor AND Request.status != Picking│
│   Then: Allow cancel                                │
│                                                      │
│ ✗ Emergency: Steve can pick items              [⚙️] │
│   If: User = Steve Smith                            │
│   Then: Grant Qube permissions                      │
│   (Disabled - click to enable)                      │
│                                                      │
│ ✓ MC can override everything                    [⚙️] │
│   If: Role = MC                                     │
│   Then: Allow all actions                           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Add/Edit Rule:**
```
┌────────────────────────────────────────────┐
│ Create Permission Rule          [✕ Close] │
├────────────────────────────────────────────┤
│ Rule Name: [________________________]      │
│                                            │
│ IF (Conditions):                           │
│ ┌────────────────────────────────────────┐│
│ │ [User Role ▼] [is ▼] [AC ▼]           ││
│ │ AND                              [✕]   ││
│ │ [Request Team ▼] [matches ▼] [User...][][
│ │ [+ Add Condition]                      ││
│ └────────────────────────────────────────┘│
│                                            │
│ THEN (Actions):                            │
│ ┌────────────────────────────────────────┐│
│ │ Allow: [Lock Material ▼]               ││
│ │ [+ Add Action]                         ││
│ └────────────────────────────────────────┘│
│                                            │
│ Priority: [Normal ▼]                       │
│ (Higher priority rules evaluated first)    │
│                                            │
│ ☑ Enabled                                  │
│                                            │
│ [Test Rule] [Save]                         │
└────────────────────────────────────────────┘
```

**Configurable Options:**
- ✅ Create complex conditional permissions
- ✅ Rule priority (order of evaluation)
- ✅ Enable/disable rules
- ✅ Test rules (dry run)
- ✅ View rule audit log

---

### 4️⃣ WHITELIST MANAGER

**Path:** Permissions & Users → Whitelist Manager

**For managing exception lists.**

```
Whitelists
┌──────────────────────────────────────────────────────┐
│ Exception Whitelists                        [+ New]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Cancel After Picking Started (3 users)          [⚙️] │
│ • Steve Smith (AC)                                  │
│ • Sarah Johnson (PM)                                │
│ • Corey Lee (MC)                                    │
│                                                      │
│ Approve P1 Requests (2 users)                   [⚙️] │
│ • Corey Lee (MC)                                    │
│ • Sarah Johnson (PM)                                │
│                                                      │
│ Override POD Requirements (1 user)              [⚙️] │
│ • John Driver (Toll)                                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Configurable Options:**
- ✅ Create custom whitelists
- ✅ Add/remove users from lists
- ✅ Link whitelists to permissions
- ✅ View whitelist usage audit

---

### 5️⃣ DATA VISIBILITY SETTINGS

**Path:** Permissions & Users → Data Visibility Settings

**Control what data users can see.**

```
Data Visibility Settings
┌──────────────────────────────────────────────────────┐
│ Requestor View                                       │
│ ☑ Can see all material requests                      │
│   (Uncheck to show only their own)                   │
│                                                      │
│ ☑ Can see all WO materials                           │
│   (Uncheck to show only their team)                  │
│                                                      │
│ ☑ Can see who requested materials                    │
│                                                      │
│ ☑ Can see pick status (real-time updates)            │
│                                                      │
│ ☐ Can see picker name                                │
│                                                      │
│ ☑ Can see delivery details                           │
│                                                      │
│ Area Coordinator View                                │
│ ☑ Can see all requests (not just own team)           │
│                                                      │
│ ☑ Can see locked materials (all teams)               │
│                                                      │
│ ☑ Can see priority queue (all teams)                 │
│                                                      │
│ Qube View                                            │
│ ☑ Can see requestor name                             │
│                                                      │
│ ☑ Can see delivery location                          │
│                                                      │
│ ☑ Can see request comments                           │
│                                                      │
│ General Settings                                     │
│ ☑ Show cancelled requests in lists                   │
│   (Grayed out with strikethrough)                    │
│                                                      │
│ ☑ Show complete audit trail to all users             │
│   (Uncheck to show only to MC)                       │
│                                                      │
│ ☐ Enable private requests                            │
│   (Visible only to specific users)                   │
│                                                      │
│ [Reset to Defaults] [Save Changes]                   │
└──────────────────────────────────────────────────────┘
```

**Configurable Options:**
- ✅ Toggle visibility per role
- ✅ Toggle visibility per data type
- ✅ Reset to defaults
- ✅ Export current configuration

---

### 6️⃣ STATUS CONFIGURATION

**Path:** Workflows & Status → Status Configuration

**Manage all statuses in the system.**

```
Status Configuration
┌──────────────────────────────────────────────────────┐
│ Request Statuses                            [+ New]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Status Name         Color        Icon      Enabled   │
│ Submitted           Cyan         📋        ☑     [⚙️]│
│ Picking             Yellow       📦        ☑     [⚙️]│
│ Partial Pick-Open   Orange       🟠        ☑     [⚙️]│
│ Partial Pick-Closed Red          🔴        ☑     [⚙️]│
│ Staged              Purple       ✅        ☑     [⚙️]│
│ In Transit          Blue         🚚        ☑     [⚙️]│
│ Delivered           Green        ✔️        ☑     [⚙️]│
│ On Hold             Gray         ⏸️        ☑     [⚙️]│
│ Cancelled           Gray         ❌        ☑     [⚙️]│
│                                                      │
│ [Reorder Statuses] [Export] [Import]                 │
└──────────────────────────────────────────────────────┘
```

**Edit Status:**
```
┌────────────────────────────────────────────┐
│ Edit Status: Submitted          [✕ Close] │
├────────────────────────────────────────────┤
│ Display Name: [Submitted_________]         │
│                                            │
│ Internal ID: submitted (read-only)         │
│                                            │
│ Description:                               │
│ [Request has been submitted and is_____]   │
│ [ready for warehouse picking__________]   │
│                                            │
│ Badge Color: [Cyan ▼]                      │
│ Preview: [Submitted]                       │
│                                            │
│ Icon/Emoji: [📋]                           │
│                                            │
│ Who Can Set:                               │
│ ☑ Requestor  ☑ AC  ☑ MC  ☐ Qube  ☐ Toll   │
│                                            │
│ Auto-Transitions:                          │
│ ☐ Auto-set when: [_________________]       │
│                                            │
│ Notifications:                             │
│ ☑ Notify when entering this status         │
│ Rules: [Configure ▼]                       │
│                                            │
│ ☑ Enabled                                  │
│                                            │
│ [Delete Status] [Save Changes]             │
└────────────────────────────────────────────┘
```

**Configurable Options:**
- ✅ Add/edit/delete statuses
- ✅ Change status colors
- ✅ Change status icons
- ✅ Set who can set each status
- ✅ Define auto-transitions
- ✅ Enable/disable statuses
- ✅ Reorder statuses (display order)

---

### 7️⃣ WORKFLOW RULES

**Path:** Workflows & Status → Workflow Rules

**Define allowed status transitions.**

```
Workflow Rules
┌──────────────────────────────────────────────────────┐
│ Status Transitions                                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ☑ Enforce workflow (disallow invalid transitions)   │
│   (Uncheck to allow any status change)               │
│                                                      │
│ ☑ Allow backwards transitions with reason           │
│   (Requires comment when moving backwards)           │
│                                                      │
│ Allowed Transitions:                                 │
│ ┌────────────────────────────────────────────────┐ │
│ │ FROM: Submitted                           [⚙️] │ │
│ │ TO: Picking, On Hold, Cancelled                │ │
│ │                                                │ │
│ │ FROM: Picking                             [⚙️] │ │
│ │ TO: Staged, Partial Pick, On Hold, Cancelled   │ │
│ │                                                │ │
│ │ FROM: Partial Pick - Open                 [⚙️] │ │
│ │ TO: Picking, Partial Pick-Closed, Cancelled    │ │
│ │                                                │ │
│ │ FROM: Partial Pick - Closed               [⚙️] │ │
│ │ TO: Staged, Cancelled                          │ │
│ │                                                │ │
│ │ FROM: Staged                              [⚙️] │ │
│ │ TO: In Transit, Picking (backward), On Hold    │ │
│ │                                                │ │
│ │ FROM: In Transit                          [⚙️] │ │
│ │ TO: Delivered, Staged (return), Partial Pick   │ │
│ │                                                │ │
│ │ FROM: On Hold                             [⚙️] │ │
│ │ TO: (Returns to previous status)               │ │
│ │                                                │ │
│ │ FROM: Delivered                           [⚙️] │ │
│ │ TO: (Terminal - no transitions)                │ │
│ │     Allow backward? ☑ Yes (requires reason)    │ │
│ │                                                │ │
│ │ FROM: Cancelled                           [⚙️] │ │
│ │ TO: (Terminal - no transitions)                │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ [Visual Workflow Editor] [Export] [Save]             │
└──────────────────────────────────────────────────────┘
```

**Visual Workflow Editor:**
```
┌────────────────────────────────────────────────────────┐
│ Workflow Editor                              [✕ Close]│
├────────────────────────────────────────────────────────┤
│                                                        │
│  [Submitted] ──→ [Picking] ──→ [Staged]               │
│       │              │              │                  │
│       │              ↓              ↓                  │
│       │         [Partial Pick] [In Transit]           │
│       │              │              │                  │
│       │              ↓              ↓                  │
│       └──→──→ [Cancelled]     [Delivered]             │
│                                                        │
│  [On Hold] can return to any previous status          │
│                                                        │
│  Click states to edit, drag to connect                │
│  [Add Status] [Save Workflow]                          │
└────────────────────────────────────────────────────────┘
```

**Configurable Options:**
- ✅ Enable/disable workflow enforcement
- ✅ Define allowed transitions per status
- ✅ Allow/disallow backwards transitions
- ✅ Require reasons for specific transitions
- ✅ Visual workflow builder
- ✅ Export/import workflows

---

### 8️⃣ APPROVAL SETTINGS

**Path:** Workflows & Status → Approval Settings

**Configure P1 approval workflow.**

```
P1 Approval Settings
┌──────────────────────────────────────────────────────┐
│ P1 Request Approval                                  │
│                                                      │
│ ☐ Require MC approval for P1 requests               │
│   when system is busy                                │
│                                                      │
│ Busy Threshold:                                      │
│ When pending requests > [10]                         │
│                                                      │
│ Who Can Approve:                                     │
│ ☑ Material Coordinator                               │
│ ☑ Project Managers (stakeholder list)                │
│ ☐ Area Coordinators                                  │
│ [+ Add Whitelist]                                    │
│                                                      │
│ Auto-Approve For:                                    │
│ ☑ Shutdown scenarios (keyword: "shutdown")           │
│ ☑ Safety issues (keyword: "safety")                  │
│ ☑ Specific users: [Select Users ▼]                   │
│   • Corey Lee (MC)                                   │
│   • Sarah Johnson (PM)                               │
│                                                      │
│ Approval Timeout:                                    │
│ Auto-approve if not reviewed within [2] hours        │
│ ☐ Enable auto-approval on timeout                    │
│                                                      │
│ Notifications:                                       │
│ ☑ Notify approvers immediately                       │
│ ☑ Escalate if not approved within [30] minutes       │
│                                                      │
│ [Save Changes]                                       │
└──────────────────────────────────────────────────────┘
```

**Configurable Options:**
- ✅ Enable/disable P1 approval
- ✅ Set busy threshold
- ✅ Define who can approve
- ✅ Auto-approve conditions
- ✅ Approval timeout rules
- ✅ Notification settings

---

### 9️⃣ QUEUE MANAGEMENT

**Path:** Workflows & Status → Queue Management

**Configure how pick queue is ordered.**

```
Queue Management
┌──────────────────────────────────────────────────────┐
│ Pick List Ordering                                   │
│                                                      │
│ Default Sort Order:                                  │
│ Drag to reorder priority:                            │
│ ┌────────────────────────────────────────────────┐ │
│ │ 1. ≡ MC Override Position                      │ │
│ │ 2. ≡ Overdue Requests                          │ │
│ │ 3. ≡ Priority (P1 > P2 > P3 > P4)              │ │
│ │ 4. ≡ AC Queue Position                         │ │
│ │ 5. ≡ Required By Date                          │ │
│ │ 6. ≡ Submission Time (oldest first)            │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Overdue Handling:                                    │
│ (•) Keep at top  ( ) Sort by how overdue             │
│                                                      │
│ Qube Flexibility:                                    │
│ ☑ Allow Qube to pick any request (not just top)     │
│   (Recommended: Yes)                                 │
│                                                      │
│ Visual Indicators:                                   │
│ ☑ Highlight P1 requests                              │
│ ☑ Show overdue badge                                 │
│ ☑ Show time in queue                                 │
│                                                      │
│ [Reset to Defaults] [Save Changes]                   │
└──────────────────────────────────────────────────────┘
```

**Configurable Options:**
- ✅ Reorder sorting criteria
- ✅ Enable/disable sorting rules
- ✅ Overdue handling
- ✅ Qube flexibility settings
- ✅ Visual indicator toggles

---

### 🔟 DELIVERY LOCATIONS

**Path:** Configuration → Delivery Locations

**Manage delivery locations.**

```
Delivery Locations
┌──────────────────────────────────────────────────────┐
│ Active Locations                            [+ New]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Location Name              GPS    Building   [Edit] │
│ Ops Center Trailer 1       ✓      ✓          [⚙️]   │
│ Laydown Yard 7             ✓      ✗          [⚙️]   │
│ Unit 12 Work Area          ✗      ✓          [⚙️]   │
│ Weld Shop                  ✗      ✓          [⚙️]   │
│ Emergency Assembly Point   ✓      ✗          [⚙️]   │
│                                                      │
│ [Reorder] [Import] [Export]                          │
└──────────────────────────────────────────────────────┘
```

**Add/Edit Location:**
```
┌────────────────────────────────────────────┐
│ Edit Location                   [✕ Close] │
├────────────────────────────────────────────┤
│ Location Name: *                           │
│ [Ops Center Trailer 1______________]       │
│                                            │
│ Short Code: (for mobile)                   │
│ [OC-T1____]                                │
│                                            │
│ ☑ Include GPS Coordinates                  │
│   Latitude:  [12.345678__]                 │
│   Longitude: [-67.890123_]                 │
│   [📍 Pick on Map]                         │
│                                            │
│ ☑ Include Building/Room                    │
│   Building: [Ops Center______]             │
│   Room/Area: [Trailer 1_____]              │
│   Floor: [Ground ▼]                        │
│                                            │
│ Special Instructions:                      │
│ [Behind the main office. Look for____]     │
│ [the blue trailer with number 1_____]     │
│                                            │
│ Contact Person: (optional)                 │
│ [John Smith__] [john@example.com__]        │
│                                            │
│ Access Requirements:                       │
│ ☐ Requires badge access                    │
│ ☐ Requires escort                          │
│ ☐ Restricted hours                         │
│                                            │
│ ☑ Active                                   │
│                                            │
│ [Delete] [Save]                            │
└────────────────────────────────────────────┘
```

**Configurable Options:**
- ✅ Add/edit/delete locations
- ✅ Optional GPS coordinates
- ✅ Optional building/room info
- ✅ Special instructions
- ✅ Contact person
- ✅ Access requirements
- ✅ Activate/deactivate locations
- ✅ Reorder locations (dropdown order)
- ✅ Import/export locations

---

### 1️⃣1️⃣ SHORT REASONS

**Path:** Configuration → Short Reasons

**Manage reasons for short items.**

```
Short Reasons (Partial Pick Reasons)
┌──────────────────────────────────────────────────────┐
│ Active Reasons                              [+ New]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Reason                    Usage Count    Order  [⚙️] │
│ Location Empty            87              1     [⚙️] │
│ Quantity Mismatch         45              2     [⚙️] │
│ Item Damaged              23              3     [⚙️] │
│ Wrong Item in Location    12              4     [⚙️] │
│ Quarantine                8               5     [⚙️] │
│ Other                     34              99    [⚙️] │
│                                                      │
│ [Reorder] [Export]                                   │
└──────────────────────────────────────────────────────┘
```

**Add/Edit Reason:**
```
┌────────────────────────────────────────────┐
│ Edit Short Reason               [✕ Close] │
├────────────────────────────────────────────┤
│ Reason: *                                  │
│ [Location Empty____________________]       │
│                                            │
│ Description: (shown to pickers)            │
│ [The storage location is completely___]    │
│ [empty. Item may have been moved or___]   │
│ [consumed.____________________________]   │
│                                            │
│ Require Notes:                             │
│ ( ) Always  (•) Optional  ( ) Never        │
│                                            │
│ Auto-Actions:                              │
│ ☑ Flag for MC investigation                │
│ ☑ Notify requestor                         │
│ ☐ Create inventory check task              │
│                                            │
│ Display Order: [1__] (lower = higher)      │
│                                            │
│ ☑ Active                                   │
│                                            │
│ [Delete] [Save]                            │
└────────────────────────────────────────────┘
```

**Configurable Options:**
- ✅ Add/edit/delete reasons
- ✅ Set descriptions
- ✅ Require notes (always/optional/never)
- ✅ Define auto-actions
- ✅ Reorder reasons (dropdown order)
- ✅ Activate/deactivate reasons
- ✅ View usage statistics

---

### 1️⃣2️⃣ PRIORITY SETTINGS

**Path:** Configuration → Priority Settings

**Configure priority system.**

```
Priority Settings
┌──────────────────────────────────────────────────────┐
│ Priority Levels                             [+ New]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Level   Name       Color    SLA      Enabled   [⚙️] │
│ P1      Critical   Red      2 hrs    ☑         [⚙️] │
│ P2      High       Orange   4 hrs    ☑         [⚙️] │
│ P3      Urgent     Yellow   8 hrs    ☑         [⚙️] │
│ P4      Routine    Blue     24 hrs   ☑         [⚙️] │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Edit Priority:**
```
┌────────────────────────────────────────────┐
│ Edit Priority: P1 Critical      [✕ Close] │
├────────────────────────────────────────────┤
│ Level: [P1___] (short code)                │
│                                            │
│ Display Name: [Critical__________]         │
│                                            │
│ Description:                               │
│ [Shutdown scenarios, safety issues,___]    │
│ [critical path items_________________]    │
│                                            │
│ Color: [Red ▼]                             │
│ Icon: [🔴]                                 │
│                                            │
│ SLA (Service Level Agreement):             │
│ Target Completion: [2] hours               │
│                                            │
│ Escalation:                                │
│ ☑ Escalate if not picked within [30] min  │
│ ☑ Escalate if not delivered by SLA        │
│                                            │
│ Notifications:                             │
│ ☑ Notify stakeholders on creation          │
│ ☑ Notify MC immediately                    │
│                                            │
│ Restrictions:                              │
│ ☐ Require approval before picking          │
│ ☐ Limit to specific users                  │
│   Allowed: [Select Users ▼]                │
│                                            │
│ ☑ Enabled                                  │
│                                            │
│ [Delete] [Save]                            │
└────────────────────────────────────────────┘
```

**Configurable Options:**
- ✅ Add/edit/delete priority levels
- ✅ Set priority colors/icons
- ✅ Define SLA targets
- ✅ Configure escalation rules
- ✅ Set notification rules
- ✅ Restrict who can use priorities
- ✅ Require approval for priorities
- ✅ Enable/disable priorities

---

### 1️⃣3️⃣ SYSTEM LIMITS

**Path:** Configuration → System Limits

**Set rate limits and system constraints.**

```
System Limits
┌──────────────────────────────────────────────────────┐
│ Rate Limiting                                        │
│                                                      │
│ Max requests per user per hour: [20__]               │
│ Max requests per user per day: [100_]                │
│                                                      │
│ Bulk Operations                                      │
│ Max items per request: [50__]                        │
│ Max concurrent picking: [10__]                       │
│ Max requests to split at once: [5___]                │
│                                                      │
│ Data Limits                                          │
│ Max photo size: [10__] MB                            │
│ Max photos per item: [5___]                          │
│ Max photos per request: [20__]                       │
│ Max comment length: [1000] characters                │
│                                                      │
│ Session Limits                                       │
│ Session timeout: [60__] minutes                      │
│ Max concurrent sessions per user: [3___]             │
│                                                      │
│ Search & Filtering                                   │
│ Max search results: [500_]                           │
│ Max export rows: [10000]                             │
│                                                      │
│ Notifications                                        │
│ Max notifications per user per hour: [50__]          │
│ Max email recipients per notification: [20__]        │
│                                                      │
│ ☑ Show warning when approaching limits               │
│ ☑ Block actions when limit exceeded                  │
│ ( ) Allow MC to override limits                      │
│                                                      │
│ [Reset to Defaults] [Save Changes]                   │
└──────────────────────────────────────────────────────┘
```

**Configurable Options:**
- ✅ Set rate limits
- ✅ Set data size limits
- ✅ Set session limits
- ✅ Set search/export limits
- ✅ Set notification limits
- ✅ Warning vs blocking behavior
- ✅ MC override capability

---

### 1️⃣4️⃣ FEATURE TOGGLES

**Path:** Configuration → Feature Toggles

**Enable/disable features without code changes.**

```
Feature Toggles
┌──────────────────────────────────────────────────────┐
│ Core Features                                        │
│ ☑ Material Requests                                  │
│ ☑ Pick List                                          │
│ ☑ Delivery Tracking                                  │
│ ☑ WO Materials View                                  │
│                                                      │
│ Advanced Features                                    │
│ ☑ Material Locking                                   │
│ ☑ Request Splitting                                  │
│ ☑ Priority Queue Management                          │
│ ☑ Partial Picks (formerly Exceptions)                │
│ ☑ On Hold Status                                     │
│ ☑ Backwards Status Transitions                       │
│                                                      │
│ Approval Workflows                                   │
│ ☐ P1 Approval Requirement                            │
│ ☐ AC Approval for Locks                              │
│ ☐ MC Approval for Cancellations                      │
│                                                      │
│ Integrations                                         │
│ ☑ SharePoint Data Sync                               │
│ ☑ Toll (LTR) Integration                             │
│ ☐ JDE Integration                                    │
│ ☐ Teams Notifications                                │
│ ☐ SMS Notifications                                  │
│                                                      │
│ Notifications                                        │
│ ☑ Email Notifications                                │
│ ☑ In-App Notifications                               │
│ ☐ SMS Notifications                                  │
│ ☐ Teams Notifications                                │
│ ☐ Mobile Push Notifications                          │
│                                                      │
│ Reporting & Analytics                                │
│ ☑ Basic Reports                                      │
│ ☑ Advanced Analytics                                 │
│ ☑ Wall Display                                       │
│ ☑ P1 Dashboard                                       │
│ ☑ Export to CSV                                      │
│ ☐ Export to PDF                                      │
│                                                      │
│ Mobile & Offline                                     │
│ ☑ Responsive Design                                  │
│ ☐ Offline Mode                                       │
│ ☐ Mobile App                                         │
│                                                      │
│ Experimental Features (Beta)                         │
│ ☐ AI-Powered Queue Optimization                      │
│ ☐ Predictive Inventory Alerts                        │
│ ☐ Automated Material Routing                         │
│                                                      │
│ [Save Changes]                                       │
└──────────────────────────────────────────────────────┘
```

**Configurable Options:**
- ✅ Toggle any feature on/off
- ✅ No code changes needed
- ✅ Instant effect
- ✅ Rollback capability

---

## 🔄 MASTER DATA & INTEGRATIONS

*(Covered in separate DATA_FLOW.md document)*

Quick links:
- **Data Sync Dashboard** - Monitor SharePoint sync
- **Conflict Resolution** - Handle data conflicts
- **Manual Data Ingest** - Upload test/dev data
- **SharePoint Integration** - Configure connection
- **Toll (LTR) Integration** - Configure Toll API

---

## 📊 REPORTS & ANALYTICS

*(Covered in REQUIRED_CHANGES.md Section 8)*

All reports accessible in MC Backend:
- Request Metrics
- Picker Performance
- Work Order Analysis
- Delivery Performance
- Partial Pick Analysis
- Priority Analysis
- User Activity
- Timeline Reports
- Custom Reports (configurable)

---

## 🛠️ SYSTEM ADMINISTRATION

### Audit Log

**Path:** System → Audit Log

View all system changes:
```
Audit Log
┌──────────────────────────────────────────────────────┐
│ Date: [Last 7 Days ▼]  User: [All ▼]  Action: [All ▼]│
│                                                      │
│ Time        User       Action              Entity    │
│ 2:45 PM     Corey      Changed status      MRF-1234 │
│ 2:30 PM     Jane       Created request     MRF-1235 │
│ 2:15 PM     Steve      Locked material     WO-12345 │
│ 1:00 PM     Corey      Updated permission  Requestor│
│                                                      │
│ [Export] [Clear Old Logs]                            │
└──────────────────────────────────────────────────────┘
```

### System Health

**Path:** System → System Health

Monitor system status:
```
System Health
┌──────────────────────────────────────────────────────┐
│ Status: ✅ All Systems Operational                   │
│                                                      │
│ Database:          ✅ Connected (12ms latency)       │
│ SharePoint Sync:   ✅ Last sync: 5 minutes ago       │
│ Email Service:     ✅ Operational                    │
│ Toll API:          ⚠️ Slow response (2.3s avg)      │
│ Notifications:     ✅ Operational                    │
│                                                      │
│ Performance:                                         │
│ • Active Users: 47                                   │
│ • Requests/sec: 3.2                                  │
│ • CPU Usage: 23%                                     │
│ • Memory Usage: 1.2 GB / 4 GB                        │
│                                                      │
│ [Refresh] [Run Diagnostics]                          │
└──────────────────────────────────────────────────────┘
```

### Error Log

**Path:** System → Error Log

View system errors:
```
Error Log
┌──────────────────────────────────────────────────────┐
│ Severity: [All ▼]  Date: [Last 24 Hours ▼]           │
│                                                      │
│ Time     Severity  Error                User   [📋] │
│ 2:45 PM  ERROR     SharePoint timeout   System [📋] │
│ 1:30 PM  WARNING   Slow query (3.5s)    Jane   [📋] │
│ 12:00 PM ERROR     Email send failed    System [📋] │
│                                                      │
│ [Export] [Clear Old Errors]                          │
└──────────────────────────────────────────────────────┘
```

### Backup & Export

**Path:** System → Backup & Export

Backup/export data:
```
Backup & Export
┌──────────────────────────────────────────────────────┐
│ Database Backup                                      │
│ Last Backup: 10/8/2025 12:00 AM                      │
│ [Create Backup Now]                                  │
│                                                      │
│ Schedule:                                            │
│ (•) Daily at [12:00 AM]                              │
│ ( ) Weekly on [Sunday ▼] at [12:00 AM]               │
│ ( ) Manual only                                      │
│                                                      │
│ Backup Retention: [30] days                          │
│                                                      │
│ Export Data:                                         │
│ [Export All Requests (CSV)]                          │
│ [Export All Users (CSV)]                             │
│ [Export All Audit Logs (CSV)]                        │
│ [Export Configuration (JSON)]                        │
│                                                      │
│ Import Data:                                         │
│ [Import Users (CSV)]                                 │
│ [Import Configuration (JSON)]                        │
│ [Import Delivery Locations (CSV)]                    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 📝 SUMMARY

### Total Configurable Options: **150+**

### Key Principles:
1. ✅ **Everything is configurable** - No hard-coded business logic
2. ✅ **MC has god mode** - Can override anything
3. ✅ **Feature toggles** - Enable/disable without code changes
4. ✅ **Export/Import** - All configs can be backed up
5. ✅ **Audit trail** - All changes tracked
6. ✅ **Granular permissions** - 50+ individual permissions
7. ✅ **Visual editors** - Workflow builder, queue reordering, etc.
8. ✅ **Defaults provided** - Sensible defaults for all settings

### Implementation Priority:

**Phase 1 (MVP):**
- User Management
- Basic Permission System
- Status Configuration
- Delivery Locations
- Short Reasons
- System Health

**Phase 2:**
- Advanced Permissions (Rules, Whitelists)
- Workflow Rules
- Approval Settings
- Queue Management
- Feature Toggles

**Phase 3:**
- Visual Editors
- Advanced Analytics
- Custom Reports
- Import/Export Everything

---

**End of Document**  
*For questions or changes, update this document and version number*


