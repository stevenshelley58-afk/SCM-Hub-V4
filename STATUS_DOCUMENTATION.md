# SCM Hub - Complete Status Reference

**Generated:** 2025-10-08  
**Version:** 1.0

---

## 📊 OVERVIEW

The SCM Hub uses 3 different status systems across the application:

1. **Material Request Status** - Overall request lifecycle
2. **Line Item Status** - Individual item picking status  
3. **Material Display Status** - Computed status for WO Materials grid
4. **Exception Reasons** - Detailed problem classification

---

## 1️⃣ MATERIAL REQUEST STATUS

**Type Definition:** `types/index.ts` line 10
```typescript
status: 'Submitted' | 'Picking' | 'In Transit' | 'Exception' | 'Delivered' | 'Ready for Collection'
```

### Status List:

| Status | Icon | Color | Who Sets | When Used | Next Status |
|--------|------|-------|----------|-----------|-------------|
| **Submitted** | 📋 | Cyan | Requestor | Request created, awaiting pick | Picking |
| **Picking** | 📦 | Yellow | Qube User | Warehouse started picking items | Ready for Collection |
| **Ready for Collection** | ✅ | Purple | Qube User | All items picked, ready for Toll | In Transit |
| **In Transit** | 🚚 | Blue | Toll Driver | Materials being delivered | Delivered |
| **Delivered** | ✔️ | Green | Toll Driver | Delivered to requestor | (Terminal) |
| **Exception** | ⚠️ | Red | Anyone | Problem occurred at any stage | (Requires resolution) |

### Current Flow:
```
┌─────────────┐
│   CREATE    │
└──────┬──────┘
       ↓
  ┌─────────┐
  │SUBMITTED│ ←────────────┐
  └────┬────┘              │
       ↓                   │
  ┌─────────┐              │
  │ PICKING │              │
  └────┬────┘              │
       ↓                   │
┌─────────────────┐        │
│READY FOR        │        │
│COLLECTION       │        │
└────────┬────────┘        │
         ↓                 │
  ┌──────────┐             │
  │IN TRANSIT│             │
  └─────┬────┘             │
        ↓                  │
  ┌──────────┐             │
  │DELIVERED │             │
  └──────────┘             │
                           │
     ┌──────────┐          │
     │EXCEPTION │──────────┘
     └──────────┘
     (Any stage)
```

### Status Details:

#### **SUBMITTED**
- **Set By:** Requestor (on form submit)
- **Visible To:** All users
- **Actions Available:**
  - Qube: Click to start picking
  - AC: Set priority in queue
  - MC: Flag as critical
- **Auto-Transitions:** None
- **Badge Color:** `bg-cyan-100 text-cyan-800`

#### **PICKING**
- **Set By:** Qube User (clicks request in Pick List)
- **Visible To:** All users  
- **Actions Available:**
  - Qube: Mark items as picked/exception
  - Qube: Complete stage
- **Auto-Transitions:** When all items marked
- **Badge Color:** `bg-yellow-100 text-yellow-800`

#### **READY FOR COLLECTION**
- **Set By:** Qube User (clicks "Stage Complete")
- **Visible To:** All users
- **Actions Available:**
  - Toll: Accept pickup
  - Toll: Update ETA
- **Auto-Transitions:** None (manual Toll action)
- **Badge Color:** `bg-purple-100 text-purple-800`

#### **IN TRANSIT**
- **Set By:** Toll Driver (manually)
- **Visible To:** All users
- **Actions Available:**
  - Toll: Update location
  - Toll: Mark delivered
- **Auto-Transitions:** None
- **Badge Color:** `bg-blue-100 text-blue-800`

#### **DELIVERED**
- **Set By:** Toll Driver OR Requestor
- **Visible To:** All users
- **Actions Available:**
  - View POD (Proof of Delivery)
  - View delivery details
- **Auto-Transitions:** None (terminal state)
- **Badge Color:** `bg-green-100 text-green-800`

#### **EXCEPTION**
- **Set By:** Any user with access
- **Visible To:** All users (appears in Exception Dashboard)
- **Actions Available:**
  - MC: Investigate & resolve
  - MC: Reassign or cancel
- **Auto-Transitions:** Manual resolution required
- **Badge Color:** `bg-red-100 text-red-800`

---

## 2️⃣ LINE ITEM STATUS

**Type Definition:** `types/index.ts` line 24
```typescript
status: 'Open' | 'Picked' | 'Exception'
```

### Status List:

| Status | Icon | Color | Description | Set By |
|--------|------|-------|-------------|--------|
| **Open** | ⚪ | Gray | Not yet picked | System default |
| **Picked** | ✔️ | Green | Successfully picked | Qube User |
| **Exception** | ⚠️ | Red | Problem with this item | Qube User |

### Line Item Flow:
```
┌──────┐
│ OPEN │ (Default)
└───┬──┘
    │
    ├────→ ┌────────┐
    │      │ PICKED │ (Success)
    │      └────────┘
    │
    └────→ ┌───────────┐
           │ EXCEPTION │ (Problem)
           └───────────┘
```

### Status Details:

#### **OPEN**
- **Initial State:** All items start as Open
- **Picker Actions:**
  - Mark as Picked
  - Report Exception
- **UI Display:** Gray badge

#### **PICKED**
- **Set By:** Qube clicks checkmark icon
- **Requirements:** Item physically obtained
- **Bulk Action:** "Mark All as Picked" button
- **UI Display:** Green badge with ✔️ icon

#### **EXCEPTION**
- **Set By:** Qube clicks exception button
- **Requirements:** Must select exception reason
- **Data Captured:**
  - Exception type (see section 4)
  - Notes/comments
  - Timestamp
  - User who reported
- **UI Display:** Red badge with ⚠️ icon

---

## 3️⃣ WO MATERIAL DISPLAY STATUS

**Location:** WO Materials View (computed from multiple sources)

These are **display-only** statuses shown in the MRF column of the WO Materials table.

| Status | Source | Badge Color | Shows |
|--------|--------|-------------|-------|
| **Not Requested** | No request exists | `bg-gray-100 text-gray-500` | Material available |
| **Locked** | `mockMaterialLocks[pKey]` exists | `bg-gray-200 text-gray-800` | 🔒 + Locker name |
| **Submitted** | `mockTransactionalData[pKey].status` | `bg-cyan-100 text-cyan-800` | MRF-XXXX link |
| **Picking** | Same as above | `bg-yellow-100 text-yellow-800` | MRF-XXXX link |
| **In Transit** | Same as above | `bg-blue-100 text-blue-800` | MRF-XXXX link |
| **Delivered** | Same as above | `bg-green-100 text-green-800` | MRF-XXXX link |
| **Exception** | Same as above | `bg-red-100 text-red-800` | MRF-XXXX link |

### Lock Status Details:

#### **LOCKED**
- **Set By:** Area Coordinator only
- **Requires:** Comment/reason
- **Effect:** 
  - Material cannot be selected for new requests
  - Row appears grayed out/disabled
  - Shows lock icon + who locked it
- **Unlock:** Only by locker OR supervisor
- **Data Structure:**
  ```typescript
  {
    lockedBy: "Steve",
    comment: "Reserved for critical path job on Friday"
  }
  ```

---

## 4️⃣ EXCEPTION REASONS

**Location:** `services/api.ts` line 96
```typescript
exceptionReasons = [
  'Item Damaged',
  'Quantity Mismatch', 
  'Location Empty',
  'Wrong Item in Location',
  'Other'
]
```

### Exception Type Details:

| Reason | When Used | Examples | Next Steps |
|--------|-----------|----------|------------|
| **Item Damaged** | Physical damage found | Cracked, bent, corroded | MC inspects, replaces |
| **Quantity Mismatch** | Count doesn't match system | Request 10, only 5 in location | MC investigates stock |
| **Location Empty** | Nothing at storage location | Empty bin/shelf | MC checks if relocated |
| **Wrong Item in Location** | Different material found | Expected pipe, found valve | MC updates master data |
| **Other** | Doesn't fit above categories | Requires special equipment | Free text in notes |

### Exception Workflow:
```
1. Picker encounters problem
2. Clicks "Report Exception" on line item
3. Selects exception reason from dropdown
4. Adds detailed notes (required for "Other")
5. Exception appears in:
   - Request detail (red badge on item)
   - Exception Dashboard (MC view)
   - Request status → "Exception"
```

---

## 🔧 CURRENT IMPLEMENTATION DETAILS

### File Locations:

**Type Definitions:**
- `types/index.ts` - All TypeScript interfaces

**Status Logic:**
- `features/qube-fulfillment/QubePickListView.tsx` - Request status transitions
- `features/qube-fulfillment/PickingView.tsx` - Line item status changes
- `features/wo-materials/WOMaterialView.tsx` - Lock/request creation

**Status Display:**
- `components/ui/StatusPill.tsx` - Visual rendering
- All status colors & icons defined here

**Data Storage:**
- `services/api.ts` - Mock data stores
  - `mockRequestsData` - Request statuses
  - `mockRequestItems` - Line item statuses
  - `mockMaterialLocks` - Lock information
  - `mockTransactionalData` - WO material request links

---

## ⚠️ KNOWN ISSUES & LIMITATIONS

### 🔴 Critical Issues:

1. **No Permission Checks**
   - Any user can change any status
   - No validation of allowed transitions

2. **No Status Validation**
   - Can skip steps (Submitted → Delivered)
   - Can go backwards (Delivered → Submitted)
   - No state machine enforcement

3. **No Audit Trail**
   - Can't see who changed status when
   - Can't see status history

4. **Exception Resolution**
   - No workflow to resolve exceptions
   - Exception just sits in dashboard forever
   - No way to mark as resolved

### 🟡 Missing Statuses:

1. **Draft** - Request being created but not submitted
2. **Approved/Rejected** - Approval workflow
3. **Cancelled** - User cancels request
4. **On Hold** - Temporarily paused
5. **Partially Picked** - Some items picked, some not
6. **Failed Delivery** - Couldn't deliver
7. **Returned** - Materials came back

### 🟡 Missing Features:

1. **Status Reasons**
   - Why cancelled?
   - Why on hold?
   - Why exception?

2. **Status Timestamps**
   - When did each transition happen?
   - How long in each status?

3. **Status Notifications**
   - Alert when status changes
   - Email/SMS on critical changes

4. **Bulk Status Changes**
   - Mark multiple requests as X
   - Batch operations

---

## 📈 RECOMMENDED IMPROVEMENTS

### Phase 1: Add Missing Statuses (Priority 🔴)

```typescript
// Update types/index.ts
status: 
  'Draft' |           // NEW: Being created
  'Submitted' | 
  'Approved' |        // NEW: Manager approved
  'Rejected' |        // NEW: Manager rejected
  'Picking' | 
  'Ready for Collection' | 
  'In Transit' | 
  'Delivered' | 
  'Cancelled' |       // NEW: User cancelled
  'On Hold' |         // NEW: Temporarily paused
  'Exception'
```

### Phase 2: Add Status Metadata (Priority 🟡)

```typescript
interface MaterialRequest {
  // ... existing fields ...
  statusHistory: {
    status: string;
    timestamp: string;
    changedBy: string;
    reason?: string;
  }[];
  
  currentStatusSince: string;
  expectedCompletionDate?: string;
}
```

### Phase 3: Implement State Machine (Priority 🟡)

```typescript
const ALLOWED_TRANSITIONS = {
  'Draft': ['Submitted', 'Cancelled'],
  'Submitted': ['Approved', 'Rejected', 'Cancelled'],
  'Approved': ['Picking', 'On Hold'],
  'Picking': ['Ready for Collection', 'Exception', 'On Hold'],
  'Ready for Collection': ['In Transit', 'Exception'],
  'In Transit': ['Delivered', 'Exception'],
  'Delivered': [], // Terminal
  'Exception': ['Picking', 'Cancelled'], // After resolution
  'On Hold': ['Previous Status'], // Resume
  'Cancelled': [], // Terminal
  'Rejected': [] // Terminal
};

function canTransition(from: string, to: string): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) || false;
}
```

### Phase 4: Add Permission Checks (Priority 🔴)

```typescript
const STATUS_PERMISSIONS = {
  'Submitted': ['requestor', 'ac', 'mc'],
  'Approved': ['ac', 'mc'],
  'Picking': ['qube', 'mc'],
  'Ready for Collection': ['qube', 'mc'],
  'In Transit': ['toll', 'mc'],
  'Delivered': ['toll', 'requestor', 'mc'],
  'Exception': ['qube', 'ac', 'mc'],
  'Cancelled': ['requestor', 'ac', 'mc'],
  'On Hold': ['ac', 'mc']
};

function canSetStatus(
  userRole: string, 
  status: string
): boolean {
  return STATUS_PERMISSIONS[status]?.includes(userRole) || false;
}
```

---

## 📝 STATUS CHANGE EXAMPLES

### Example 1: Normal Request Flow
```
10:00 AM - Jane (Requestor) creates request
           Status: Draft → Submitted
           
10:05 AM - Steve (AC) approves request
           Status: Submitted → Approved
           
10:30 AM - JJ (Qube) starts picking
           Status: Approved → Picking
           
11:15 AM - JJ completes all items
           Status: Picking → Ready for Collection
           
11:30 AM - Toll accepts pickup
           Status: Ready for Collection → In Transit
           
01:45 PM - Toll delivers to location
           Status: In Transit → Delivered
```

### Example 2: Exception Flow
```
10:00 AM - Request created
           Status: Submitted
           
10:30 AM - JJ starts picking
           Status: Picking
           
10:45 AM - JJ finds item damaged
           Item Status: Open → Exception
           Reason: Item Damaged
           
10:46 AM - Request status auto-updates
           Status: Picking → Exception
           
11:00 AM - Corey (MC) investigates
           Finds replacement
           Updates inventory
           
11:15 AM - JJ resumes picking
           Status: Exception → Picking
           Item Status: Exception → Picked
```

---

## 🎯 QUICK REFERENCE

### Status Count Per Entity:

- **Material Requests:** 6 statuses (should be 10+)
- **Line Items:** 3 statuses (sufficient)
- **WO Materials:** 2 states (Locked, Not Requested) + request status
- **Exception Reasons:** 5 types (should add more)

### Status Colors (Tailwind):

```css
Submitted:   bg-cyan-100 text-cyan-800
Picking:     bg-yellow-100 text-yellow-800
Ready:       bg-purple-100 text-purple-800
In Transit:  bg-blue-100 text-blue-800
Delivered:   bg-green-100 text-green-800
Exception:   bg-red-100 text-red-800
Open:        bg-gray-200 text-gray-700
Picked:      bg-green-200 text-green-900
Locked:      bg-gray-200 text-gray-800
```

---

## 📞 QUESTIONS FOR STAKEHOLDERS

Before implementing changes, confirm:

1. **Approval Workflow:**
   - Do requests need approval before picking?
   - Who approves? AC? MC? Manager?
   - Auto-approve for certain users/items?

2. **Status Transitions:**
   - Can requests be cancelled after picking starts?
   - Can delivered items be marked as returned?
   - What happens to exceptions - resolve or cancel?

3. **Permissions:**
   - Should requestors see picking progress?
   - Can MC override any status?
   - Emergency status changes (who can force)?

4. **Notifications:**
   - Who gets notified on status changes?
   - Real-time or batch (end of day)?
   - Critical statuses get SMS?

---

**End of Document**  
*For questions or changes, update this document and version number*



