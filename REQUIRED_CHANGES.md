# SCM Hub - Required Changes Based on Stakeholder Requirements

**Generated:** 2025-10-08  
**Based On:** Business Logic Questionnaire Responses  
**Version:** 1.0

---

## 🎯 CHANGE PRIORITIZATION

- 🔴 **CRITICAL:** Must fix before demo/production
- 🟡 **IMPORTANT:** Need soon, impacts usability
- 🟢 **NICE-TO-HAVE:** Future enhancement

**Total Changes:** 67 items (🔴 32 | 🟡 24 | 🟢 11)

---

## 📊 SECTION 1: STATUS & WORKFLOW CHANGES

### 🔴 1.1 Add New Request Statuses (CRITICAL)

**Current:**
```typescript
status: 'Submitted' | 'Picking' | 'In Transit' | 'Exception' | 'Delivered' | 'Ready for Collection'
```

**Required:**
```typescript
status: 
  'Submitted' |
  'Picking' |
  'Partial Pick - Open' |      // NEW: Short pick, still trying to find items
  'Partial Pick - Closed' |    // NEW: Short pick, items unavailable
  'Staged' |                   // RENAMED from "Ready for Collection"
  'In Transit' |
  'Delivered' |
  'On Hold' |                  // NEW: Temporarily paused
  'Cancelled'                  // NEW: Request cancelled
```

**Files to Update:**
- `types/index.ts` - Update MaterialRequest interface
- `components/ui/StatusPill.tsx` - Add new status colors/icons
- `features/qube-fulfillment/QubePickListView.tsx` - Add status transitions
- `features/qube-fulfillment/PickingView.tsx` - Handle partial picks
- All views that display status

**New Badge Colors:**
```typescript
'Partial Pick - Open': 'bg-orange-100 text-orange-800' // 🟠 Orange
'Partial Pick - Closed': 'bg-red-200 text-red-900'     // 🔴 Dark Red
'On Hold': 'bg-gray-300 text-gray-900'                 // ⏸️ Gray
'Cancelled': 'bg-gray-400 text-gray-700'               // ❌ Crossed out
```

---

### 🔴 1.2 Rename "Exception" to "Partial Pick" System (CRITICAL)

**Terminology Change:**
- Old: "Exception" (confusing, sounds like error)
- New: "Partial Pick - Open" or "Partial Pick - Closed"

**Impact:**
- UI labels across entire app
- Status names
- Dashboard names ("Exception Dashboard" → "Partial Picks Dashboard")
- Variable names in code
- Comments and documentation

**Files to Update:**
- All component files
- `services/api.ts` - exceptionReasons → partialPickReasons
- Navigation labels
- User-facing text

**Note:** Keep "Exception" in code internally, just change user-facing labels for now. Full refactor in Phase 2.

---

### 🔴 1.3 Enable Backwards Status Transitions (CRITICAL)

**Requirement:** 
- Allow status to move backwards (e.g., Delivered → In Transit)
- **Must capture:** Reason, timestamp, who changed it
- **Must flag:** Show visual indicator that status went backwards

**New Data Structure:**
```typescript
interface MaterialRequest {
  // ... existing fields ...
  statusHistory: {
    status: string;
    timestamp: string;
    changedBy: string;
    reason?: string;
    isBackwards?: boolean;  // Flag if went backwards
  }[];
  
  hasBackwardsTransition: boolean;  // Quick check
  backwardsFlag?: {
    icon: '⚠️',
    tooltip: 'Status moved from Delivered to In Transit on 10/8 by MC'
  };
}
```

**UI Changes:**
- Add modal when moving backwards: "Why are you changing status back?"
- Show ⚠️ flag next to status if ever went backwards
- Tooltip shows what happened
- Status history visible in request details

**Files to Update:**
- `types/index.ts` - Add statusHistory
- All status change locations - Add backwards detection
- Request detail view - Show history timeline
- `components/ui/StatusPill.tsx` - Add backwards flag

---

### 🔴 1.4 Prevent Duplicate Requests (CRITICAL)

**Current Issue:** 
- User can create multiple requests for same material
- **MAJOR PROBLEM:** Materials being requested twice

**Solution:** Auto-lock materials when request created

**Logic:**
```typescript
// When user submits material request:
1. Check if material already has active request (any status except Delivered/Cancelled)
2. If YES → Show error: "Material already requested in MRF-XXXX"
3. If NO → Create request AND auto-lock material
4. Lock automatically released when:
   - Request delivered → Lock removed
   - Request cancelled → Lock removed
   - MC manually unlocks (override)
```

**Data Structure:**
```typescript
interface MaterialLock {
  lockedBy: string;           // User name or "System (Auto)"
  lockedAt: string;          // Timestamp
  lockType: 'Manual' | 'Auto'; // NEW: Track if manual AC lock or auto-request lock
  requestId?: string;        // NEW: Link to request that caused auto-lock
  comment: string;
  canUnlock: string[];       // Who can unlock
}
```

**UI Changes:**
- Show lock icon with tooltip: "🔒 Auto-locked by MRF-1234"
- Distinguish auto-locks from manual AC locks (different color?)
- Auto-locks can't be manually unlocked (system manages them)

**Files to Update:**
- `features/wo-materials/WOMaterialView.tsx` - Add duplicate check before submit
- `services/api.ts` - Update mockMaterialLocks structure
- Lock/unlock logic - Handle auto vs manual locks

---

### 🔴 1.5 Pack Selection Logic (CRITICAL)

**Requirement:**
- If user selects ANY item from a pack → Auto-select ALL items in pack
- If user deselects ANY item from pack → Warn, then deselect ALL items in pack

**Current Data:**
```typescript
PackNumber: "A1234" | "B5678" | null
```

**New Logic:**
```typescript
function handleMaterialSelection(material: Material, isSelected: boolean) {
  if (!material.PackNumber) {
    // Regular material, just toggle
    toggleSelection(material);
    return;
  }
  
  if (isSelected) {
    // Selecting a pack item → select all in pack
    const packMaterials = getAllMaterialsInPack(material.PackNumber);
    selectMultiple(packMaterials);
    showToast(`Selected ${packMaterials.length} items from Pack ${material.PackNumber}`);
  } else {
    // Deselecting a pack item → warn then deselect all
    const packMaterials = getAllMaterialsInPack(material.PackNumber);
    showConfirmDialog({
      title: 'Deselect Entire Pack?',
      message: `This will deselect all ${packMaterials.length} items from Pack ${material.PackNumber}`,
      onConfirm: () => deselectMultiple(packMaterials)
    });
  }
}
```

**UI Indicators:**
- Show pack badge on materials: `📦 Pack A1234`
- Highlight all pack items when hovering one
- Show pack item count in selection summary

**Files to Update:**
- `features/wo-materials/WOMaterialView.tsx` - Add pack selection logic
- `services/api.ts` - Add getAllMaterialsInPack helper
- Material selection UI - Add pack indicators

---

### 🟡 1.6 Split MRF Capability (IMPORTANT)

**Requirement:**
- Qube can split a single MRF into multiple sub-requests
- Example: MRF-123 → MRF-123.1, MRF-123.2, MRF-123.3

**Use Cases:**
- Some items ready now, others delayed
- Multiple delivery locations
- Different priority items

**New Data Structure:**
```typescript
interface MaterialRequest {
  // ... existing fields ...
  parentRequestId?: string;     // If this is a split: "MRF-123"
  splitNumber?: number;         // 1, 2, 3, etc.
  displayId: string;            // "MRF-123.1" or "MRF-123"
  childRequestIds?: string[];   // If this was split: ["MRF-123.1", "MRF-123.2"]
  isSplit: boolean;
}
```

**Workflow:**
```
1. Qube viewing request MRF-123 with 10 items
2. Clicks "Split Request" button
3. UI shows item list with checkboxes
4. Qube selects 4 items to split off
5. System creates:
   - MRF-123.1 (6 items - remaining in original)
   - MRF-123.2 (4 items - split off)
6. Original MRF-123 becomes "parent" record (archived/reference only)
7. Both splits can progress independently
```

**UI/UX:**
- Split button in request detail (Qube only)
- Visual indicator showing split history
- Link between parent/child requests
- Requestor sees both splits in their dashboard

**Files to Create/Update:**
- New: `components/SplitRequestModal.tsx`
- `features/qube-fulfillment/PickingView.tsx` - Add split button
- `services/api.ts` - Add split logic
- Request list views - Show split indicator

---

### 🟡 1.7 "On Hold" Status with Notifications (IMPORTANT)

**Requirement:**
- Any user can put request "On Hold"
- **Must capture:** Reason/comment
- **Must notify:** Stakeholder list (to be defined)

**Data Structure:**
```typescript
interface MaterialRequest {
  // ... existing fields ...
  onHoldInfo?: {
    putOnHoldBy: string;
    putOnHoldAt: string;
    reason: string;
    notifiedUsers: string[];
    expectedResumeDate?: string;
  };
}
```

**Workflow:**
```
1. User clicks "Put On Hold"
2. Modal appears:
   - Reason (required text field)
   - Expected resume date (optional)
   - Notify stakeholders? (checkbox list)
3. On submit:
   - Status → "On Hold"
   - Stakeholders notified (email + in-app)
   - Request grayed out in lists
4. To resume:
   - Click "Resume Request"
   - Status returns to previous status
   - Stakeholders notified again
```

**Files to Update:**
- All status change locations - Add "On Hold" option
- New: `components/OnHoldModal.tsx`
- Notification system (TBD)
- Request lists - Gray out on-hold requests

---

### 🟡 1.8 Cancellation Workflow (IMPORTANT)

**Requirement:**
- Requestor can cancel **before picking starts**
- MC can cancel **at any stage**
- **Must capture:** Reason, who cancelled

**Permissions:**
```typescript
function canCancelRequest(request: MaterialRequest, user: User): boolean {
  if (user.role === 'mc') return true; // MC can always cancel
  
  if (user.role === 'requestor' && request.RequestedBy === user.name) {
    // Requestor can only cancel if not picked yet
    return request.status === 'Submitted';
  }
  
  return false; // Others can't cancel
}
```

**Workflow:**
```
1. User clicks "Cancel Request"
2. Confirm dialog: "Are you sure? This cannot be undone."
3. Modal: "Why are you cancelling?" (required)
4. On confirm:
   - Status → "Cancelled"
   - Release any auto-locks
   - Notify requestor + stakeholders
   - Request stays in history (not deleted)
5. Cancelled requests shown grayed with strikethrough
```

**Files to Update:**
- Request detail views - Add cancel button
- Permission checks
- Lock release logic
- Request lists - Style cancelled requests

---

## 📊 SECTION 2: PERMISSIONS & ROLES

### 🔴 2.1 MC God Mode (CRITICAL)

**Requirement:** MC can do EVERYTHING, override ANYTHING

**Current:**
- MC can't pick
- MC can't create requests
- MC can't adjust individual items

**Required:**
- ✅ MC can pick (in emergency)
- ✅ MC can create requests (for anyone)
- ✅ MC can change ANY status
- ✅ MC can override locks
- ✅ MC can cancel ANY request
- ✅ MC can edit ANY field
- ✅ MC can reassign requests
- ✅ MC can split/merge requests
- ✅ MC can bypass all validations (with warning)

**Implementation:**
```typescript
// Add to ALL permission checks:
if (user.role === 'mc') return true; // MC bypass

// Examples:
canEditRequest(request, user) {
  if (user.role === 'mc') return true;
  // ... normal checks
}

canChangeStatus(request, fromStatus, toStatus, user) {
  if (user.role === 'mc') return true;
  // ... normal checks
}
```

**Files to Update:**
- ALL permission checks across entire app
- Add MC warning UI: "⚠️ MC Override Active"

---

### 🔴 2.2 Configurable Permissions System (CRITICAL)

**Requirement:**
- ALL permissions configurable in MC backend
- Can configure by role OR individual name
- **Do NOT hard-code permissions**

**New Data Structure:**
```typescript
interface PermissionRule {
  id: string;
  action: 'create_request' | 'cancel_request' | 'lock_material' | 'change_status' | ...; // 50+ actions
  allowedRoles: string[];        // ['ac', 'mc', 'requestor']
  allowedUsers: string[];        // ['Steve', 'Jane'] - whitelist
  deniedUsers: string[];         // ['Mike'] - blacklist
  conditions?: {                 // Optional advanced rules
    onlyOwnRequests?: boolean;
    onlyBeforeStatus?: string;
    requiresApproval?: boolean;
  };
}

interface PermissionConfig {
  rules: PermissionRule[];
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}
```

**MC Backend Features:**
```
Permission Management Page:
┌────────────────────────────────────────┐
│ Action: Create Material Request        │
│ Allowed Roles: ☑ Requestor ☑ AC ☑ MC  │
│ Whitelist: [+ Add User]                │
│ Blacklist: [+ Add User]                │
│ Conditions: ...                         │
└────────────────────────────────────────┘

[Save] [Reset to Defaults]
```

**Default Permissions File:**
- Create `config/default-permissions.json`
- Loaded on first run
- MC can modify anytime
- Export/import capability

**Files to Create:**
- `services/permissions.ts` - Permission engine
- `types/permissions.ts` - Permission types
- `features/mc-control/PermissionManager.tsx` - UI
- `config/default-permissions.json` - Defaults

**Files to Update:**
- ALL permission checks - Use permission engine

---

### 🟡 2.3 Read-Only Role (IMPORTANT)

**Requirement:**
- New role for users not on main list
- Can view everything
- Cannot create/edit/change anything

**Implementation:**
```typescript
interface User {
  id: string;
  name: string;
  role: 'requestor' | 'ac' | 'qube' | 'mc' | 'toll' | 'readonly'; // NEW
  // ...
}

// In permission checks:
if (user.role === 'readonly') {
  // All actions return false except:
  return action === 'view_*'; // Only view actions allowed
}
```

**UI Changes:**
- No action buttons visible
- Grayed out forms
- Toast: "Read-only access - contact MC to request changes"

**Files to Update:**
- `types/index.ts` - Add 'readonly' role
- `services/api.ts` - Add readonly users
- All forms/buttons - Hide for readonly

---

### 🟡 2.4 Whitelist Management (IMPORTANT)

**Requirement:**
- MC maintains whitelist for special permissions
- Example: Allow specific user to cancel after picking started

**MC Backend Feature:**
```
Whitelist Manager
┌──────────────────────────────────────────┐
│ Exception: Cancel After Picking Started  │
│                                          │
│ Whitelisted Users:                       │
│ • Steve (AC) [Remove]                    │
│ • Sarah (Requestor) [Remove]             │
│                                          │
│ [+ Add User]                             │
└──────────────────────────────────────────┘
```

**Data Structure:**
```typescript
interface Whitelist {
  id: string;
  name: string;
  description: string;
  users: string[];
  createdBy: string;
  createdAt: string;
}
```

**Files to Create:**
- `features/mc-control/WhitelistManager.tsx`
- `services/whitelist.ts` - Whitelist logic

---

### 🟡 2.5 Data Visibility Options (IMPORTANT)

**Requirement:**
- Make visibility rules configurable
- Examples:
  - "Can requestors see all requests or just their own?"
  - "Can requestors see other people's WO materials?"
  - "Show deleted/cancelled requests?"

**MC Backend Feature:**
```
Data Visibility Settings
┌──────────────────────────────────────────┐
│ ☑ Requestors see all material requests   │
│   (Uncheck to show only their own)       │
│                                          │
│ ☑ Requestors see all WO materials        │
│   (Uncheck to show only their WOs)       │
│                                          │
│ ☑ Show cancelled requests in lists       │
│                                          │
│ ☑ Show complete audit trail to all      │
│                                          │
│ ☐ Enable private requests                │
│                                          │
└──────────────────────────────────────────┘
```

**Implementation:**
```typescript
interface VisibilityConfig {
  requestorsSeAllRequests: boolean;
  requestorsSeeAllWOs: boolean;
  showCancelledRequests: boolean;
  showAuditTrail: boolean;
  enablePrivateRequests: boolean;
}

// In data filtering:
function getVisibleRequests(user: User, config: VisibilityConfig) {
  let requests = allRequests;
  
  if (!config.requestorsSeAllRequests && user.role === 'requestor') {
    requests = requests.filter(r => r.RequestedBy === user.name);
  }
  
  if (!config.showCancelledRequests) {
    requests = requests.filter(r => r.status !== 'Cancelled');
  }
  
  return requests;
}
```

**Files to Create:**
- `features/mc-control/VisibilitySettings.tsx`
- `services/visibility.ts` - Visibility logic

**Files to Update:**
- All data fetching - Apply visibility filters

---

## 📊 SECTION 3: PRIORITY & QUEUE MANAGEMENT

### 🔴 3.1 Fix Priority System (CRITICAL)

**Current Confusion:**
- P1-P4 levels
- AC can set "numeric priority"
- "MC_Priority_Flag" exists but unclear

**Required (per user):**
```
Priority System:
1. Requestor chooses: P1 (Critical) | P2 (High) | P3 (Urgent) | P4 (Routine)
2. P1 requests can optionally require MC approval (configurable)
3. AC can reorder ONLY their materials (drag-and-drop UI)
4. MC can reorder ANYTHING
5. Overdue requests automatically stay at top
6. MC can update "required by" date to reorder
```

**Remove:**
- "MC_Priority_Flag" (confusing, not needed)
- Numeric priority field

**Add:**
```typescript
interface MaterialRequest {
  priority: 'P1' | 'P2' | 'P3' | 'P4';      // User selected
  acQueuePosition?: number;                 // AC set order (only their WOs)
  mcQueuePosition?: number;                 // MC global override
  isOverdue: boolean;                       // Auto-calculated
  requiresMCApproval: boolean;              // If P1 and config enabled
  mcApproved?: boolean;                     // If approved
}

// Sorting logic:
function sortPickList(requests) {
  return requests.sort((a, b) => {
    // 1. MC override position (if set)
    if (a.mcQueuePosition && b.mcQueuePosition) {
      return a.mcQueuePosition - b.mcQueuePosition;
    }
    
    // 2. Overdue first
    if (a.isOverdue !== b.isOverdue) {
      return a.isOverdue ? -1 : 1;
    }
    
    // 3. Priority level
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    
    // 4. AC queue position (if same AC)
    if (sameAreaCoordinator(a, b) && a.acQueuePosition) {
      return a.acQueuePosition - b.acQueuePosition;
    }
    
    // 5. Required by date
    return compareDate(a.RequiredByTimestamp, b.RequiredByTimestamp);
  });
}
```

**Files to Update:**
- `types/index.ts` - Fix priority fields
- `features/qube-fulfillment/QubePickListView.tsx` - Update sort logic
- All priority displays

---

### 🟡 3.2 P1 Approval Workflow (IMPORTANT)

**Requirement:**
- **Optional:** MC can enable approval requirement for P1 requests
- When enabled, P1 requests need MC approval before Qube can pick

**MC Config:**
```
P1 Approval Settings
┌──────────────────────────────────────────┐
│ ☐ Require MC approval for P1 requests   │
│   when system is busy                    │
│                                          │
│ Busy threshold:                          │
│ [10] pending requests                    │
│                                          │
│ Auto-approve for:                        │
│ ☑ Shutdown scenarios                     │
│ ☑ Safety issues                          │
│                                          │
└──────────────────────────────────────────┘
```

**Workflow:**
```
1. User creates P1 request
2. Check if approval required (config + pending count)
3. If YES:
   - Status → "Awaiting Approval"
   - Notify MC
   - Request appears in MC approval queue
   - MC approves/rejects
4. If NO:
   - Status → "Submitted" (normal flow)
```

**Files to Create:**
- `features/mc-control/P1ApprovalQueue.tsx`
- `features/mc-control/P1ApprovalSettings.tsx`

---

### 🟡 3.3 P1 Dashboard (IMPORTANT)

**Requirement:**
- Dedicated dashboard for all P1 requests
- Shows status, time in queue, who's picking, ETA

**Features:**
- Real-time updates
- Red highlights if stalled
- Escalation alerts
- Quick actions (reassign, expedite)

**Files to Create:**
- `features/dashboards/P1Dashboard.tsx`

---

### 🟡 3.4 Required By Time (Optional) (IMPORTANT)

**Current:** RequiredByTimestamp is required

**Required:**
- Date: Required
- Time: Optional

**UI:**
```
Required By:
┌────────────┬──────────┐
│ 10/15/2025 │ 14:30    │ ← Time optional
└────────────┴──────────┘
☐ End of day (if no time specified)
```

**Files to Update:**
- `features/wo-materials/WOMaterialView.tsx` - Make time optional
- Request forms
- Display logic - Show "EOD" if no time

---

## 📊 SECTION 4: PICKING WORKFLOW

### 🔴 4.1 Line Item Status Expansion (CRITICAL)

**Current:**
```typescript
status: 'Open' | 'Picked' | 'Exception'
```

**Required Reasons (not statuses):**
```typescript
interface LineItem {
  status: 'Open' | 'Picked' | 'Short';  // Status
  shortReason?: 'Item Damaged' | 'Quantity Mismatch' | 'Location Empty' | 
                'Wrong Item in Location' | 'Quarantine' | 'Other';
  shortNotes?: string;
  shortReportedBy?: string;
  shortReportedAt?: string;
}
```

**Workflow:**
```
1. Picker marks item as "Short"
2. Dropdown: Select reason
   - Item Damaged
   - Quantity Mismatch (requested 10, found 7)
   - Location Empty
   - Wrong Item in Location
   - Quarantine (hold for inspection)
   - Other (requires notes)
3. Add notes (required for "Other", optional otherwise)
4. Submit
5. Item shows short badge
6. If ANY items short → Request becomes "Partial Pick"
```

**Files to Update:**
- `types/index.ts` - Update LineItem interface
- `features/qube-fulfillment/PickingView.tsx` - Add short reasons UI
- `services/api.ts` - Update exceptionReasons to shortReasons

---

### 🔴 4.2 Partial Pick Workflow (CRITICAL)

**Requirement:**
- If ANY items marked "Short" → Request becomes "Partial Pick"
- Two types:
  - **Partial Pick - Open:** Still trying to find items
  - **Partial Pick - Closed:** Items unavailable, proceed with what we have

**Workflow:**
```
1. Picker marking items:
   - Item 1: Picked ✓
   - Item 2: Picked ✓
   - Item 3: Short (Location Empty)
   - Item 4: Picked ✓

2. Picker clicks "Complete Pick"

3. System detects short items → Shows dialog:
   ┌────────────────────────────────────┐
   │ Some items are short. What next?   │
   │                                    │
   │ • Item 3: Short (Location Empty)   │
   │                                    │
   │ [Keep Open] [Close Short]          │
   └────────────────────────────────────┘

4. If "Keep Open":
   - Status → "Partial Pick - Open"
   - MC notified to find items
   - Request stays in pick list
   - Notifications sent

5. If "Close Short":
   - Status → "Partial Pick - Closed"
   - Proceed to staging with available items
   - Requestor notified of short items
   - Stakeholders notified
```

**Notifications:**
```
To Requestor:
"Your request MRF-1234 is partially complete. 3 of 4 items picked. 
Item 3 (Pipe 2" x 10ft) is short due to: Location Empty. 
Status: Partial Pick - Open (still searching)"

To MC:
"Partial pick on MRF-1234 requires attention. 
Short item: Pipe 2" x 10ft | Reason: Location Empty"
```

**Files to Update:**
- `features/qube-fulfillment/PickingView.tsx` - Add partial pick logic
- New: `components/PartialPickModal.tsx`
- Notification system

---

### 🟡 4.3 Qube Pick Flexibility (IMPORTANT)

**Requirement:**
- Qube can pick in ANY order (current behavior OK)
- Confirmed: Don't force top-to-bottom picking

**No Changes Needed** - Document this as intentional design.

---

### 🟡 4.4 Mark All Buttons (IMPORTANT)

**Current:** "Mark All as Picked"

**Add:**
- "Mark WO as Picked" - All items from one work order
- "Mark Request as Picked" - All items in request

**UI:**
```
Bulk Actions:
┌────────────────────────────┐
│ Mark All Items as Picked   │ ← All items
│ Mark WO-12345 as Picked    │ ← Just this WO's items
│ Mark All as Short          │ ← Mass short
└────────────────────────────┘
```

**Files to Update:**
- `features/qube-fulfillment/PickingView.tsx` - Add bulk action buttons

---

## 📊 SECTION 5: TOLL INTEGRATION

### 🔴 5.1 Toll Task Request (LTR) Integration (CRITICAL)

**Requirement:**
- Push to LTR when material request submitted
- Update as info becomes available
- Separate "Pending" queue before staged
- Qube can schedule collection before staging

**Workflow:**
```
┌─────────────────────────────────────────────┐
│ TOLL TASK LIFECYCLE                         │
└─────────────────────────────────────────────┘

1. Request Created (Submitted)
   → Push to LTR "Pending Pickup" queue
   → Info: Delivery location, rough items, requestor
   → Status in LTR: "Not Ready"

2. Picking Started
   → Update LTR with:
     - Picker name
     - Estimated completion time
     - Item details

3. Staged (Ready for Collection)
   → Update LTR status: "Ready for Pickup"
   → Moves to main Toll queue
   → Toll can now accept job

4. Qube Early Schedule (Optional)
   → Qube can move to "Ready" before actually staged
   → For time-critical requests
   → Requires MC approval?

5. Toll Accepts
   → Status → "In Transit"
   → Toll provides ETA

6. Toll Delivers
   → POD: Photo + Signature
   → If can't get either → Override (email stakeholders)
   → Status → "Delivered"
```

**Data to Push to LTR:**
```typescript
interface TollTaskRequest {
  mrfId: string;
  status: 'Pending' | 'Ready' | 'Accepted' | 'In Transit' | 'Delivered';
  
  // Delivery info
  deliveryLocation: string;
  requestedBy: string;
  requiredByDate: string;
  priority: string;
  
  // Pickup info
  pickupLocation: string;  // Always Qube warehouse
  itemSummary: string;     // "4 items, 2 boxes, 150 lbs"
  specialInstructions?: string;
  photos?: string[];       // Photos of staged items
  
  // Toll info
  assignedDriver?: string;
  acceptedAt?: string;
  estimatedPickupTime?: string;
  estimatedDeliveryTime?: string;
  actualPickupTime?: string;
  actualDeliveryTime?: string;
  
  // POD
  deliveryPhoto?: string;
  deliverySignature?: string;
  deliveredTo?: string;
  overrideReason?: string; // If no photo/sig
}
```

**MC Config:**
```
Toll Integration Settings
┌──────────────────────────────────────────┐
│ ☑ Auto-push to LTR on request creation  │
│                                          │
│ ☑ Allow Qube to schedule early pickup   │
│   (before staging complete)              │
│                                          │
│ ☐ Require MC approval for early pickup  │
│                                          │
│ LTR API Endpoint:                        │
│ [https://ltr.example.com/api/tasks]      │
│                                          │
│ LTR API Key: [••••••••••]                │
│                                          │
└──────────────────────────────────────────┘
```

**Files to Create:**
- `services/toll-integration.ts` - LTR API calls
- `features/toll/TollPendingQueue.tsx` - Pending pickups view
- `features/toll/TollScheduler.tsx` - Qube early scheduling

**Files to Update:**
- Request creation - Push to LTR
- Status changes - Update LTR
- Toll views - Show LTR data

---

### 🟡 5.2 Toll ETA Display (IMPORTANT)

**Requirement:**
- Toll provides ETA
- Show at line item AND request level

**UI:**
```
Request MRF-1234 - In Transit
┌────────────────────────────────────┐
│ Status: In Transit 🚚               │
│ Driver: John Smith                 │
│ ETA: 2:30 PM (in 45 minutes)       │
│ [Track] [Update ETA]               │
└────────────────────────────────────┘

Line Items:
┌─────────────────────────────────────────┐
│ ✓ Item 1: Pipe 2" - ETA: 2:30 PM       │
│ ✓ Item 2: Valve - ETA: 2:30 PM         │
└─────────────────────────────────────────┘
```

**Files to Update:**
- Request detail views - Show ETA
- Line item displays - Show ETA
- `types/index.ts` - Add ETA fields

---

### 🟡 5.3 POD (Proof of Delivery) (IMPORTANT)

**Requirement:**
- Photo + Signature required
- If can't get either → Override (email stakeholders)

**Workflow:**
```
Toll marks "Delivered":
┌────────────────────────────────────┐
│ Proof of Delivery Required         │
│                                    │
│ Photo:                             │
│ [📷 Take Photo] or [📁 Upload]     │
│ Preview: [______]                  │
│                                    │
│ Signature:                         │
│ [✍️ Capture Signature]             │
│ Preview: [______]                  │
│                                    │
│ Received By: [_______________]     │
│                                    │
│ ☐ Cannot provide POD (override)   │
│   Reason: ____________________     │
│                                    │
│ [Submit]                           │
└────────────────────────────────────┘

If override checked:
→ Email sent to stakeholders
→ Flagged for MC review
→ Still marks as delivered
```

**Files to Create:**
- `components/PODCapture.tsx` - Photo/signature UI
- `features/toll/DeliveryConfirmation.tsx`

---

### 🟡 5.4 Delivery Location Management (IMPORTANT)

**Current:** Hard-coded list
- Ops Center Trailer 1
- Laydown Yard 7
- Unit 12 Work Area
- Weld Shop

**Required:** Configurable list in MC backend

**MC Feature:**
```
Delivery Locations
┌──────────────────────────────────────────┐
│ Active Locations:                        │
│                                          │
│ • Ops Center Trailer 1 [Edit] [Delete]  │
│   GPS: 12.345, -67.890                   │
│   Building: Ops Center, Room: N/A        │
│                                          │
│ • Laydown Yard 7 [Edit] [Delete]        │
│   GPS: 12.346, -67.891                   │
│   Building: N/A, Room: N/A               │
│                                          │
│ [+ Add Location]                         │
└──────────────────────────────────────────┘

Add/Edit Location:
┌──────────────────────────────────────────┐
│ Location Name: [___________________]     │
│                                          │
│ ☐ Include GPS Coordinates                │
│   Lat: [_______] Long: [_______]         │
│                                          │
│ ☐ Include Building/Room                  │
│   Building: [_______] Room: [_______]    │
│                                          │
│ Special Instructions:                    │
│ [_________________________________]      │
│                                          │
│ [Save] [Cancel]                          │
└──────────────────────────────────────────┘
```

**Files to Create:**
- `features/mc-control/LocationManager.tsx`
- `services/api.ts` - deliveryLocations config

---

### 🟡 5.5 Wrong Delivery Location (IMPORTANT)

**Requirement:**
- Driver can update location mid-transit
- Or return to warehouse

**UI:**
```
In Transit - Location Issue
┌────────────────────────────────────┐
│ Delivery location incorrect?       │
│                                    │
│ Original: Laydown Yard 7           │
│                                    │
│ [Update Location]                  │
│ [Return to Warehouse]              │
│                                    │
│ Reason: [_____________________]    │
│                                    │
│ [Confirm]                          │
└────────────────────────────────────┘

If "Update Location":
→ New location dropdown
→ Notify requestor + stakeholders
→ Continue to new location

If "Return to Warehouse":
→ Status back to "Staged"
→ Toll task cancelled
→ Notify everyone
```

**Files to Create:**
- `components/DeliveryLocationUpdate.tsx`

---

## 📊 SECTION 6: WORK ORDER & DATA MANAGEMENT

### 🔴 6.1 SharePoint / Dataverse Integration (CRITICAL)

**Requirement:**
- Master data from SharePoint export
- Refresh every 1 hour
- Handle async data
- Conflict resolution: SharePoint = off-site, App = on-site

**Architecture:**
```
SharePoint/Dataverse (JDE source)
       ↓ (export every hour)
  Staging Table
       ↓ (sync process)
   App Database
       ↓
   Frontend
```

**Sync Logic:**
```typescript
interface MasterDataSync {
  lastSyncAt: string;
  syncStatus: 'idle' | 'syncing' | 'error';
  recordsUpdated: number;
  recordsAdded: number;
  conflicts: DataConflict[];
}

interface DataConflict {
  workOrderNumber: string;
  lineNumber: number;
  field: string;
  sharePointValue: any;
  appValue: any;
  reason: string;  // "Material on-site" | "Material off-site"
  resolution: 'use_sharepoint' | 'use_app' | 'manual';
}

async function syncMasterData() {
  // 1. Fetch from SharePoint
  const sharePointData = await fetchSharePointExport();
  
  // 2. Compare with app data
  const conflicts = detectConflicts(sharePointData, appData);
  
  // 3. Auto-resolve based on rules
  for (const conflict of conflicts) {
    if (isMaterialOnSite(conflict.workOrderNumber)) {
      // App wins - material on site
      conflict.resolution = 'use_app';
    } else {
      // SharePoint wins - material off site
      conflict.resolution = 'use_sharepoint';
    }
  }
  
  // 4. Flag manual conflicts for MC
  const manualConflicts = conflicts.filter(c => !c.resolution);
  if (manualConflicts.length > 0) {
    notifyMC(manualConflicts);
  }
  
  // 5. Apply updates
  await applyDataUpdates(sharePointData, conflicts);
  
  // 6. Log sync
  logSync({
    lastSyncAt: new Date(),
    recordsUpdated: updated.length,
    recordsAdded: added.length,
    conflicts: manualConflicts
  });
}

// Run every hour
setInterval(syncMasterData, 60 * 60 * 1000);
```

**MC Dashboard:**
```
Master Data Sync
┌──────────────────────────────────────────┐
│ Last Sync: 10/8/2025 2:00 PM ✓           │
│ Next Sync: 10/8/2025 3:00 PM (in 45 min) │
│                                          │
│ Today's Stats:                           │
│ • Records Updated: 127                   │
│ • Records Added: 8                       │
│ • Conflicts: 2 (requires attention)      │
│                                          │
│ [Sync Now] [View Conflicts] [Settings]  │
└──────────────────────────────────────────┘

Conflict Resolution:
┌──────────────────────────────────────────┐
│ WO-12345 Line 10:                        │
│ Field: Quantity                          │
│ SharePoint: 100                          │
│ App: 95 (5 already issued in JDE)        │
│                                          │
│ Reason: Material on-site                 │
│                                          │
│ [Use SharePoint] [Use App] [Merge]       │
└──────────────────────────────────────────┘
```

**Files to Create:**
- `services/sharepoint-sync.ts` - Sync engine
- `services/conflict-resolution.ts` - Conflict logic
- `features/mc-control/DataSyncDashboard.tsx`
- `features/mc-control/ConflictResolver.tsx`

**MC Config:**
```
SharePoint Integration
┌──────────────────────────────────────────┐
│ SharePoint URL:                          │
│ [https://sharepoint.example.com/export]  │
│                                          │
│ Sync Frequency:                          │
│ [1] hours                                │
│                                          │
│ Conflict Resolution:                     │
│ ☑ Auto-resolve based on on-site status  │
│ ☑ Notify MC of conflicts                │
│ ☐ Pause sync on errors                  │
│                                          │
│ [Test Connection] [Save]                 │
└──────────────────────────────────────────┘
```

---

### 🟡 6.2 Pack Auto-Selection (IMPORTANT)

**Already covered in Section 1.5** - No additional changes.

---

### 🟡 6.3 Data Retention (IMPORTANT)

**Requirement:** TBD after shutdown

**Placeholder Config:**
```
Data Retention
┌──────────────────────────────────────────┐
│ Keep completed requests:                 │
│ ( ) 30 days                              │
│ ( ) 6 months                             │
│ ( ) 1 year                               │
│ (•) Forever (archive after project)      │
│                                          │
│ Keep audit logs:                         │
│ ( ) 90 days                              │
│ (•) Forever                              │
│                                          │
│ [Save]                                   │
└──────────────────────────────────────────┘
```

**Files to Create:**
- `features/mc-control/DataRetentionSettings.tsx`

---

## 📊 SECTION 7: NOTIFICATIONS & STAKEHOLDERS

### 🔴 7.1 Stakeholder System (CRITICAL)

**Requirement:**
- Define stakeholder lists
- Notify stakeholders on key events
- Configurable notification rules

**Data Structure:**
```typescript
interface Stakeholder {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    teams: boolean;
  };
}

interface StakeholderList {
  id: string;
  name: string;  // "Project Managers", "Safety Team", etc.
  stakeholders: Stakeholder[];
  notifyOn: string[];  // Event types
}

interface NotificationRule {
  id: string;
  event: 'request_created' | 'request_p1' | 'partial_pick' | 'on_hold' | ...;
  stakeholderLists: string[];  // Which lists to notify
  conditions?: {
    priority?: string;
    status?: string;
    overdue?: boolean;
  };
  template: string;  // Email/SMS template
}
```

**MC Dashboard:**
```
Stakeholder Management
┌──────────────────────────────────────────┐
│ Stakeholder Lists:                       │
│                                          │
│ • Project Managers (5 people) [Edit]    │
│ • Safety Team (3 people) [Edit]         │
│ • Emergency Contacts (2 people) [Edit]  │
│                                          │
│ [+ New List]                             │
└──────────────────────────────────────────┘

Edit List: "Project Managers"
┌──────────────────────────────────────────┐
│ Name: Project Managers                   │
│                                          │
│ Members:                                 │
│ • John Smith [john@email.com]            │
│   ☑ Email ☐ SMS ☑ In-App                │
│   [Remove]                               │
│                                          │
│ • Sarah Johnson [sarah@email.com]        │
│   ☑ Email ☑ SMS ☑ In-App                │
│   [Remove]                               │
│                                          │
│ [+ Add Member]                           │
│                                          │
│ Notify this list when:                   │
│ ☑ P1 request created                     │
│ ☑ Request becomes overdue                │
│ ☑ Partial pick occurs                    │
│ ☐ All requests                           │
│                                          │
│ [Save] [Cancel]                          │
└──────────────────────────────────────────┘
```

**Notification Events:**
```
Key Events to Notify:
1. Request created (P1 only?)
2. Request becomes P1
3. Partial pick occurs
4. Request on hold
5. Request cancelled
6. Delivery complete
7. Request overdue
8. Exception/issue
9. Status changed backwards
10. POD override (no photo/sig)
11. Toll delivery location changed
12. Split request created
13. MC approval needed
```

**Files to Create:**
- `types/stakeholder.ts` - Stakeholder types
- `services/stakeholder.ts` - Stakeholder logic
- `services/notification.ts` - Notification engine
- `features/mc-control/StakeholderManager.tsx`
- `features/mc-control/NotificationRules.tsx`

---

### 🔴 7.2 Notification Endpoints (CRITICAL)

**Requirement:**
- Build endpoints for future integration
- Support: Email, SMS, Teams, In-App, Push

**Architecture:**
```typescript
interface NotificationPayload {
  recipients: string[];  // User IDs or email addresses
  channel: 'email' | 'sms' | 'inapp' | 'teams' | 'push';
  subject: string;
  message: string;
  data?: any;  // Additional context
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

class NotificationService {
  async send(payload: NotificationPayload) {
    switch (payload.channel) {
      case 'email':
        return await this.sendEmail(payload);
      case 'sms':
        return await this.sendSMS(payload);
      case 'inapp':
        return await this.sendInApp(payload);
      case 'teams':
        return await this.sendTeams(payload);
      case 'push':
        return await this.sendPush(payload);
    }
  }
  
  // Stub implementations for future
  async sendEmail(payload) {
    console.log('[Email] Would send:', payload);
    // TODO: Integrate with email service
  }
  
  async sendSMS(payload) {
    console.log('[SMS] Would send:', payload);
    // TODO: Integrate with Twilio/etc
  }
  
  async sendInApp(payload) {
    // Store in database, show in UI
    await saveNotification(payload);
  }
  
  async sendTeams(payload) {
    console.log('[Teams] Would send:', payload);
    // TODO: Integrate with Teams webhooks
  }
  
  async sendPush(payload) {
    console.log('[Push] Would send:', payload);
    // TODO: Integrate with FCM/APNS
  }
}
```

**In-App Notifications:**
```
Header Bell Icon (🔔 3)
┌────────────────────────────────────────┐
│ Notifications                          │
│                                        │
│ 🔴 P1 Request MRF-1234 created         │
│    2 minutes ago                       │
│    [View] [Dismiss]                    │
│                                        │
│ 🟡 Partial Pick on MRF-1230            │
│    15 minutes ago                      │
│    [View] [Dismiss]                    │
│                                        │
│ ✅ Delivery Complete MRF-1228          │
│    1 hour ago                          │
│    [View] [Dismiss]                    │
│                                        │
│ [Mark All Read]                        │
└────────────────────────────────────────┘
```

**Files to Create:**
- `services/notification.ts` - Notification service
- `components/NotificationBell.tsx` - Header bell
- `components/NotificationCenter.tsx` - Full notification view
- `types/notification.ts` - Notification types

---

### 🟡 7.3 Configurable Notification Rules (IMPORTANT)

**MC Feature:**
```
Notification Rules
┌──────────────────────────────────────────┐
│ Event: Request Created                   │
│                                          │
│ Conditions:                              │
│ ☐ All requests                           │
│ ☑ P1 requests only                       │
│ ☐ Overdue requests                       │
│                                          │
│ Notify:                                  │
│ ☑ Project Managers (stakeholder list)   │
│ ☑ Material Coordinator                   │
│ ☐ Safety Team                            │
│                                          │
│ Channels:                                │
│ ☑ Email ☑ In-App ☐ SMS ☐ Teams          │
│                                          │
│ Template:                                │
│ Subject: New P1 Request {{mrfId}}        │
│ Message: {{requestor}} created...        │
│                                          │
│ [Save] [Test] [Cancel]                   │
└──────────────────────────────────────────┘
```

**Files to Create:**
- `features/mc-control/NotificationRules.tsx`

---

## 📊 SECTION 8: REPORTING & ANALYTICS

### 🟡 8.1 Comprehensive Reporting (IMPORTANT)

**Requirement:**
- "Create the most comprehensive report possible"
- Available in MC backend

**Reports to Build:**

#### **1. Request Metrics**
```
┌─────────────────────────────────────────────┐
│ Material Requests - 30 Days                 │
├─────────────────────────────────────────────┤
│ Total Requests: 245                         │
│ • Delivered: 198 (80.8%)                    │
│ • In Progress: 32 (13.1%)                   │
│ • Partial Picks: 12 (4.9%)                  │
│ • Cancelled: 3 (1.2%)                       │
│                                             │
│ By Priority:                                │
│ • P1: 45 (18.4%)                            │
│ • P2: 89 (36.3%)                            │
│ • P3: 67 (27.3%)                            │
│ • P4: 44 (18.0%)                            │
│                                             │
│ Avg Time to Deliver: 4.2 hours              │
│ Avg Items per Request: 3.8                  │
│                                             │
│ [Export CSV] [Export PDF]                   │
└─────────────────────────────────────────────┘
```

#### **2. Picker Performance**
```
┌─────────────────────────────────────────────┐
│ Picker Performance - This Week              │
├─────────────────────────────────────────────┤
│ Top Pickers:                                │
│ 1. JJ - 42 requests (95% complete rate)     │
│ 2. Mike - 38 requests (89% complete rate)   │
│ 3. Sarah - 31 requests (92% complete rate)  │
│                                             │
│ Avg Pick Time: 1.2 hours                    │
│ Fastest Pick: 15 minutes (MRF-1234)         │
│ Slowest Pick: 6.5 hours (MRF-1220)          │
│                                             │
│ Short Items: 23 (5.1% of all items)         │
│ Top Reasons:                                │
│ • Location Empty: 12 (52%)                  │
│ • Quantity Mismatch: 6 (26%)                │
│ • Item Damaged: 5 (22%)                     │
│                                             │
│ [Export] [Drill Down]                       │
└─────────────────────────────────────────────┘
```

#### **3. Work Order Analysis**
```
┌─────────────────────────────────────────────┐
│ Work Order Materials - By Team              │
├─────────────────────────────────────────────┤
│ Team A:                                     │
│ • Total Materials: 1,234                    │
│ • Requested: 456 (37%)                      │
│ • Delivered: 398 (32%)                      │
│ • Pending: 58 (5%)                          │
│ • Not Requested: 778 (63%)                  │
│                                             │
│ Team B:                                     │
│ • Total Materials: 892                      │
│ • ... (similar breakdown)                   │
│                                             │
│ Most Requested Materials:                   │
│ 1. 2" Pipe - 87 requests                    │
│ 2. Ball Valve 1" - 64 requests              │
│ 3. Gasket Set - 52 requests                 │
│                                             │
│ [Export] [View Details]                     │
└─────────────────────────────────────────────┘
```

#### **4. Delivery Performance**
```
┌─────────────────────────────────────────────┐
│ Toll Delivery Metrics                       │
├─────────────────────────────────────────────┤
│ Total Deliveries: 198                       │
│ On-Time: 176 (88.9%)                        │
│ Late: 22 (11.1%)                            │
│                                             │
│ Avg Delivery Time: 2.3 hours                │
│ Fastest: 45 minutes                         │
│ Slowest: 8.5 hours                          │
│                                             │
│ POD Compliance:                             │
│ • Photo + Signature: 185 (93.4%)            │
│ • Photo only: 8 (4.0%)                      │
│ • Override (no POD): 5 (2.5%)               │
│                                             │
│ Top Destinations:                           │
│ 1. Laydown Yard 7 - 67 deliveries          │
│ 2. Unit 12 Work Area - 54 deliveries        │
│ 3. Ops Center Trailer 1 - 48 deliveries     │
│                                             │
│ [Export] [Driver Details]                   │
└─────────────────────────────────────────────┘
```

#### **5. Exception Analysis**
```
┌─────────────────────────────────────────────┐
│ Partial Picks & Issues - 30 Days            │
├─────────────────────────────────────────────┤
│ Total Partial Picks: 34                     │
│ • Open (still searching): 8                 │
│ • Closed (unavailable): 26                  │
│                                             │
│ Reasons:                                    │
│ • Location Empty: 18 (52.9%)                │
│ • Quantity Mismatch: 9 (26.5%)              │
│ • Item Damaged: 4 (11.8%)                   │
│ • Wrong Item: 2 (5.9%)                      │
│ • Other: 1 (2.9%)                           │
│                                             │
│ Avg Resolution Time: 6.7 hours              │
│                                             │
│ Most Problematic Items:                     │
│ 1. 2" Gasket - 5 shorts                     │
│ 2. Valve Actuator - 4 shorts                │
│                                             │
│ [Export] [View Details]                     │
└─────────────────────────────────────────────┘
```

#### **6. Priority Analysis**
```
┌─────────────────────────────────────────────┐
│ P1 Request Analysis                         │
├─────────────────────────────────────────────┤
│ Total P1s: 45                               │
│ Avg Response Time: 12 minutes               │
│ Avg Complete Time: 2.1 hours                │
│                                             │
│ P1 Success Rate: 95.6%                      │
│ • Delivered: 43                             │
│ • Partial: 2                                │
│ • Cancelled: 0                              │
│                                             │
│ Overdue P1s: 0 🎉                           │
│                                             │
│ [Export] [View Timeline]                    │
└─────────────────────────────────────────────┘
```

#### **7. User Activity**
```
┌─────────────────────────────────────────────┐
│ User Activity - This Month                  │
├─────────────────────────────────────────────┤
│ Top Requestors:                             │
│ 1. Jane - 34 requests                       │
│ 2. Steve - 28 requests                      │
│ 3. Mike - 22 requests                       │
│                                             │
│ Most Active ACs:                            │
│ 1. Steve - 127 materials locked             │
│ 2. Sarah - 98 materials locked              │
│                                             │
│ MC Actions:                                 │
│ • Overrides: 8                              │
│ • Manual Adjustments: 23                    │
│ • Conflict Resolutions: 12                  │
│                                             │
│ [Export] [View Details]                     │
└─────────────────────────────────────────────┘
```

#### **8. Timeline Report**
```
┌─────────────────────────────────────────────┐
│ Request Timeline - MRF-1234                 │
├─────────────────────────────────────────────┤
│ 10/8 10:00 AM - Created by Jane             │
│ 10/8 10:05 AM - Submitted (P2)              │
│ 10/8 10:30 AM - Picking started by JJ       │
│ 10/8 11:15 AM - 3 of 4 items picked         │
│ 10/8 11:16 AM - Partial Pick - Open         │
│               (Item 3: Location Empty)      │
│ 10/8 11:45 AM - MC found replacement        │
│ 10/8 12:00 PM - All items picked            │
│ 10/8 12:10 PM - Staged for pickup           │
│ 10/8 01:00 PM - In Transit (Driver: John)   │
│ 10/8 02:30 PM - Delivered (POD captured)    │
│                                             │
│ Total Time: 4 hours 30 minutes              │
│ Time in Picking: 1 hour 45 minutes          │
│ Time Waiting: 50 minutes                    │
│ Time in Transit: 1 hour 30 minutes          │
│                                             │
│ [Export] [Print]                            │
└─────────────────────────────────────────────┘
```

**Files to Create:**
- `features/mc-control/reports/` (directory)
  - `RequestMetrics.tsx`
  - `PickerPerformance.tsx`
  - `WorkOrderAnalysis.tsx`
  - `DeliveryPerformance.tsx`
  - `ExceptionAnalysis.tsx`
  - `PriorityAnalysis.tsx`
  - `UserActivity.tsx`
  - `TimelineReport.tsx`
- `services/analytics.ts` - Data aggregation
- `utils/export.ts` - CSV/PDF export

---

### 🟢 8.2 Real-Time Wall Display (NICE-TO-HAVE)

**Requirement:**
- Large screen dashboard for warehouse floor
- Real-time updates

**Design:**
```
┌─────────────────────────────────────────────────────────┐
│  SCM HUB - LIVE DASHBOARD                    2:45 PM   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔴 P1 REQUESTS: 2        🟡 IN PICKING: 5              │
│  🔵 READY TO PICK: 8      🟢 DELIVERED TODAY: 34        │
│                                                         │
│  ACTIVE PICKS:                                          │
│  ┌───────────────────────────────────────────────┐     │
│  │ MRF-1234 (P1) - JJ - 15 min - 3/4 items       │     │
│  │ MRF-1235 (P2) - Mike - 45 min - 2/5 items     │     │
│  │ MRF-1236 (P3) - Sarah - 8 min - 1/2 items     │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  STAGED FOR PICKUP: 7 requests                          │
│  IN TRANSIT: 3 requests                                 │
│                                                         │
│  ⚠️ NEEDS ATTENTION:                                    │
│  • MRF-1230 - Partial Pick (Location Empty)            │
│  • MRF-1228 - Overdue by 2 hours                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Files to Create:**
- `features/dashboards/WallDisplay.tsx`
- Auto-refresh every 5 seconds

---

## 📊 SECTION 9: MOBILE & OFFLINE

### 🟡 9.1 Mobile/Tablet Support (IMPORTANT)

**Current:** Desktop web only

**Required:**
- Responsive design for mobile/tablet
- Touch-friendly UI
- Optimized for warehouse use

**Priority Views:**
1. Qube: Pick list + picking
2. Toll: Task list + delivery
3. Requestor: Request status

**Files to Update:**
- All components - Add responsive breakpoints
- CSS - Mobile-first approach
- Touch targets - Minimum 44px

---

### 🟢 9.2 Offline Capability (NICE-TO-HAVE)

**Requirement:**
- Work without internet
- Sync when reconnected
- Conflict resolution

**Implementation:**
```typescript
// Service Worker for offline
// IndexedDB for local storage
// Sync API for background sync

// When offline:
1. Queue actions locally
2. Show offline indicator
3. Allow critical operations (picking, status changes)

// When back online:
1. Sync queued actions
2. Detect conflicts
3. Resolve or flag for MC
```

**Files to Create:**
- `service-worker.ts` - Offline support
- `services/offline-sync.ts` - Sync logic
- `components/OfflineIndicator.tsx` - UI indicator

---

## 📊 SECTION 10: MISCELLANEOUS

### 🔴 10.1 Audit Trail (CRITICAL)

**Requirement:**
- Track ANY changes or requests
- Track at item level and master level
- Include comments and photos

**Data Structure:**
```typescript
interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;  // 'create_request', 'change_status', 'lock_material', etc.
  entityType: string;  // 'request', 'lineitem', 'material', 'user', etc.
  entityId: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  comment?: string;
  photos?: string[];
  metadata?: any;
}
```

**Views:**
```
Audit Log - Request MRF-1234
┌─────────────────────────────────────────────┐
│ 10/8 10:00 AM - Jane created request        │
│   Status: → Submitted                       │
│   Priority: → P2                            │
│   Items: 4                                  │
│                                             │
│ 10/8 10:30 AM - JJ started picking          │
│   Status: Submitted → Picking               │
│                                             │
│ 10/8 11:00 AM - JJ marked item 3 as short   │
│   Item 3 status: Open → Short               │
│   Reason: Location Empty                    │
│   Comment: "Bin 47-B is completely empty"   │
│   Photo: [view]                             │
│                                             │
│ 10/8 11:15 AM - MC (Corey) found item       │
│   Comment: "Found in overflow area"         │
│   Photo: [view]                             │
│                                             │
│ 10/8 11:20 AM - JJ updated item 3           │
│   Item 3 status: Short → Picked             │
│                                             │
│ ... (continues)                             │
└─────────────────────────────────────────────┘
```

**Files to Create:**
- `services/audit.ts` - Audit logging
- `features/audit/AuditLog.tsx` - View audit logs
- `types/audit.ts` - Audit types

**Files to Update:**
- ALL actions - Add audit logging

---

### 🟡 10.2 Photo Documentation (IMPORTANT)

**Requirement:**
- Anyone can attach photos anywhere
- Use cases:
  - Damaged items
  - Staged materials
  - Proof of delivery
  - Issue documentation

**UI:**
```
Any context (request, line item, etc):
┌────────────────────────────────┐
│ Photos (3):                    │
│ [📷] [📷] [📷] [+ Add Photo]   │
│                                │
│ Click to view, add comment     │
└────────────────────────────────┘

Photo Modal:
┌────────────────────────────────┐
│ [← Back] Photo 1 of 3 [Next →] │
│                                │
│  [Large Image Display]         │
│                                │
│ Taken by: JJ                   │
│ Date: 10/8/2025 11:00 AM       │
│                                │
│ Comment:                       │
│ Bin 47-B completely empty      │
│                                │
│ [Download] [Delete]            │
└────────────────────────────────┘
```

**Files to Create:**
- `components/PhotoUpload.tsx` - Camera/upload UI
- `components/PhotoGallery.tsx` - View photos
- `services/photo-storage.ts` - Photo handling

---

### 🟡 10.3 Save Filter Selections (IMPORTANT)

**Requirement:**
- Save user's filter preferences
- Persist across sessions

**Implementation:**
```typescript
interface UserPreferences {
  userId: string;
  savedFilters: {
    [viewName: string]: {
      filterValues: any;
      sortBy: string;
      sortDirection: 'asc' | 'desc';
    };
  };
}

// On filter change:
saveUserPreference('pickList', {
  filterValues: { priority: 'P1', status: 'Submitted' },
  sortBy: 'RequiredByTimestamp',
  sortDirection: 'asc'
});

// On view load:
const prefs = getUserPreference('pickList');
if (prefs) {
  setFilters(prefs.filterValues);
  setSortBy(prefs.sortBy);
}
```

**Files to Update:**
- All table/list views - Add preference saving

---

### 🟡 10.4 Configurable Limits (IMPORTANT)

**Requirement:**
- Set limits (editable in MC backend)
- Example: "Prevent creating 100 requests at once"

**MC Config:**
```
System Limits
┌──────────────────────────────────────────┐
│ Rate Limiting:                           │
│ Max requests per user per hour: [20]     │
│                                          │
│ Bulk Operations:                         │
│ Max items per request: [50]              │
│ Max concurrent requests: [10]            │
│                                          │
│ Data Limits:                             │
│ Max photo size: [10] MB                  │
│ Max photos per item: [5]                 │
│                                          │
│ [Save] [Reset to Defaults]               │
└──────────────────────────────────────────┘
```

**Files to Create:**
- `features/mc-control/SystemLimits.tsx`
- `services/rate-limit.ts` - Limit enforcement

---

## 📊 SUMMARY

### Total Changes:
- 🔴 **CRITICAL:** 32 items
- 🟡 **IMPORTANT:** 24 items
- 🟢 **NICE-TO-HAVE:** 11 items

### Biggest Impacts:
1. **New Statuses** (Partial Pick, On Hold, Cancelled)
2. **Prevent Duplicates** (Auto-lock on request)
3. **Pack Selection Logic**
4. **MC God Mode + Configurable Permissions**
5. **Stakeholder & Notification System**
6. **SharePoint/Dataverse Sync**
7. **Toll Integration (LTR)**
8. **Split MRF Capability**
9. **Audit Trail Everywhere**
10. **Comprehensive Reporting**

### Development Phases:

**Phase 1 (MVP - Before Demo):**
- Critical status changes
- Prevent duplicates
- Pack logic
- MC permissions
- Basic stakeholder notifications

**Phase 2 (Production Ready):**
- SharePoint sync
- Toll integration
- Split MRFs
- Full audit trail
- Photo documentation

**Phase 3 (Polish):**
- Comprehensive reporting
- Offline support
- Mobile optimization
- Wall display

---

**Next Steps:**
1. Review this document
2. Prioritize which changes to implement first
3. Identify any blockers or dependencies
4. Begin Phase 1 implementation

---

**End of Document**

