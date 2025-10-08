# SCM Hub - Terminology Update Guide

**Generated:** 2025-10-08  
**Purpose:** Map old/confusing terms to new business-aligned terms  
**Version:** 1.0

---

## 🎯 OVERVIEW

Based on stakeholder feedback, several terms in the system are **confusing** or **incorrect**. This document maps old → new terminology.

**Priority:**
- 🔴 **USER-FACING:** Change immediately (confuses users)
- 🟡 **CODE:** Update in Phase 2 (internal only)
- 🟢 **OPTIONAL:** Consider changing

---

## 📋 TERMINOLOGY CHANGES

### 🔴 1. "Exception" → "Partial Pick" / "Short"

**Problem:** "Exception" sounds like an ERROR or system failure. In reality, it's a normal warehouse situation where an item couldn't be picked.

**Old Terms:**
- Exception
- Exception Dashboard
- Exception Reasons
- Mark as Exception
- Exception Status

**New Terms:**
- **Partial Pick** (when some items short)
- **Short** (for individual items)
- **Partial Picks Dashboard** (instead of Exception Dashboard)
- **Short Reasons** (instead of Exception Reasons)
- **Mark as Short** (button text)
- **Short Status** (for line items)

**Context-Specific Usage:**
```
Request Level:
- "Partial Pick - Open" (still trying to find items)
- "Partial Pick - Closed" (items unavailable, proceeding without them)

Line Item Level:
- "Short" (this specific item couldn't be picked)

Dashboard:
- "Partial Picks" (view all incomplete picks)

Picker Action:
- "Mark as Short" (button)
- "Report Short" (action)
```

**UI Label Changes:**
```diff
- Exception Dashboard
+ Partial Picks Dashboard

- Report Exception
+ Report Short Item

- Exception Reason:
+ Short Reason:

- Request Status: Exception
+ Request Status: Partial Pick - Open

- Line Item Status: Exception
+ Line Item Status: Short
```

**Files to Update (USER-FACING ONLY):**
- All component labels/buttons
- Dashboard titles
- Modal headings
- Status pills
- Navigation labels
- Help text

**Files to Update Later (CODE):**
```typescript
// Phase 2 refactor:
// OLD:
interface LineItem {
  status: 'Open' | 'Picked' | 'Exception';
  exceptionReason?: string;
}

// NEW:
interface LineItem {
  status: 'Open' | 'Picked' | 'Short';
  shortReason?: string;
}
```

---

### 🔴 2. "Ready for Collection" → "Staged"

**Problem:** "Ready for Collection" is verbose and doesn't match warehouse terminology.

**Old Term:**
- Ready for Collection
- Ready to Collect
- Ready for Pickup

**New Term:**
- **Staged** (short, clear, standard warehouse term)

**UI Label Changes:**
```diff
- Status: Ready for Collection
+ Status: Staged

- Move to Ready for Collection
+ Move to Staged

- Ready for Collection Queue
+ Staging Queue
```

**Files to Update:**
- `types/index.ts` - Rename status value
- All status displays
- Status pills
- Workflow diagrams

---

### 🟡 3. "MC_Priority_Flag" → Remove (Confusing)

**Problem:** Unclear what this flag does. User thought it meant "MC sets this flag" but code auto-sets it for P1 requests.

**Solution:** **REMOVE** this field entirely. Use clearer logic:
- P1 requests are P1 (priority speaks for itself)
- MC can reorder queue directly (mcQueuePosition)
- Don't need a separate "priority flag"

**Files to Update:**
- `types/index.ts` - Remove field
- Mock data - Remove field
- Any logic using this field - Replace with `priority === 'P1'`

---

### 🔴 4. "WO Materials" → Keep, but clarify

**Problem:** Some confusion about what "WO Materials" view shows.

**Solution:** Keep the term, but add clarifying subheading:

**UI Update:**
```diff
- WO Materials
+ WO Materials
  View and request materials for your work orders
```

**Files to Update:**
- View header - Add subtitle
- Help text

---

### 🟡 5. "Lock" vs "Reserved" vs "Requested"

**Current Confusion:**
- "Lock" = AC manually locks material (don't use)
- "Reserved" = Not used
- "Requested" = Material has active request
- Material can be BOTH locked AND requested (confusing)

**Clarification Needed:**

**Three States:**
1. **Available** - Can be requested
2. **Locked** - AC manually reserved (cannot request)
3. **Requested** - Active request exists (auto-locked)

**Visual Distinction:**
```
Available:
┌────────────────────┐
│ Material X         │
│ [Request]          │
└────────────────────┘

Locked (Manual):
┌────────────────────┐
│ Material X  🔒     │
│ Locked by Steve    │
│ "For critical job" │
└────────────────────┘

Requested (Auto-locked):
┌────────────────────┐
│ Material X  📋     │
│ MRF-1234           │
│ Requested by Jane  │
└────────────────────┘
```

**UI Labels:**
```
When AC locks:
"Lock Material" (button)
"Locked by [name]" (status)
"🔒 Manual Lock" (icon + label)

When request auto-locks:
(No user action needed)
"Requested in MRF-XXXX" (status)
"📋 Active Request" (icon + label)
```

**Files to Update:**
- Lock/request UI - Clarify labels
- Status indicators - Different icons
- Tooltips - Explain difference

---

### 🟡 6. "Ops Sequence" → "Operation Sequence" (Optional)

**Problem:** "Ops Sequence" might be unclear to new users.

**Solution:** Spell it out in UI, keep short in code.

**UI Label Changes:**
```diff
Column Header:
- Ops Seq
+ Op Seq
(Tooltip: "Operation Sequence")

Full view:
- Ops Sequence: 10
+ Operation Sequence: 10
```

**Files to Update:**
- Table headers
- Tooltips

---

### 🔴 7. "Pack" → Clarify with indicator

**Problem:** Users might not realize selecting one item selects entire pack.

**Solution:** Add clear visual indicator + warning.

**UI Updates:**
```
Material in Pack:
┌────────────────────────┐
│ ☐ Material X           │
│ 📦 Pack A1234 (5 items)│  ← Clear indicator
└────────────────────────┘

On selection:
┌────────────────────────────────────────┐
│ Pack Selection                         │
│                                        │
│ You selected an item from Pack A1234.  │
│ This will select ALL 5 items in the    │
│ pack:                                  │
│                                        │
│ • Material X (2" Pipe)                 │
│ • Material Y (Gasket)                  │
│ • Material Z (Bolts)                   │
│ • Material W (Valve)                   │
│ • Material Q (Flange)                  │
│                                        │
│ [Cancel] [Select All 5 Items]          │
└────────────────────────────────────────┘
```

**Files to Update:**
- Material selection UI
- Pack indicator badges
- Selection modal

---

### 🔴 8. "Requestor" → Keep, but add role clarity

**Problem:** Some users don't realize "Requestor" is a role, think it means "person who created this request".

**Solution:** Clarify in UI when showing role vs. action.

**UI Labels:**
```
Role:
"Jane Doe (Requestor)" ← Role in parentheses

Action:
"Requested by: Jane Doe" ← Action, shows name

Profile selector:
┌────────────────────────┐
│ Select User            │
│                        │
│ ○ Jane Doe             │
│   Role: Requestor      │ ← Explicit
│   Can create requests  │
└────────────────────────┘
```

**Files to Update:**
- User selection UI
- Role labels

---

### 🟡 9. "Material Coordinator" → "Materials Coordinator" (Optional)

**Current:** Material Coordinator
**Alternative:** Materials Coordinator (plural, more common)

**Decision:** Keep "Material Coordinator" (singular) for consistency with "Material Request".

**No changes needed** - just documenting the decision.

---

### 🔴 10. "MRF" → Keep, but define

**Problem:** Acronym not defined anywhere.

**Solution:** Add tooltip/help text.

**Assumption:** MRF = **Material Request Form**

**UI Updates:**
```
First mention in UI:
"Material Request (MRF)"

Subsequent mentions:
"MRF-1234"

Help text:
"MRF = Material Request Form"

Tooltips:
Hover over "MRF" → "Material Request Form"
```

**Files to Update:**
- First mention in each view - Expand acronym
- Help documentation

---

### 🔴 11. "Submitted" Status → Clarify what it means

**Problem:** "Submitted" could mean "waiting for approval" or "ready to pick"?

**Current:** Submitted = Ready for Qube to pick

**Solution:** Keep "Submitted" but clarify with icon/tooltip.

**UI Updates:**
```
Status: Submitted 📋
Tooltip: "Request submitted and ready for warehouse picking"

In pick list:
"New Requests" section (instead of "Submitted Requests")
```

**Files to Update:**
- Status tooltips
- Pick list section headers

---

### 🟡 12. "Line Number" → Keep, but clarify

**Problem:** Users might confuse "Line Number" with "Line Item #" in request.

**Context:**
- **Line Number** = Work order line (from JDE)
- **Line Item** = Item in material request

**Solution:** Keep both terms, but clarify context.

**UI Labels:**
```
In WO Materials view:
"WO Line: 10" ← Explicitly "WO Line"

In Material Request view:
"Item 1 of 4" ← Don't say "Line Item 1", just "Item 1"
or
"Request Item 1" ← If need to be explicit
```

**Files to Update:**
- Column headers - "WO Line" instead of "Line Number"
- Request item displays - "Item #" instead of "Line Item #"

---

## 📊 TERM MAPPING REFERENCE

| Old Term | New Term | Priority | Context |
|----------|----------|----------|---------|
| Exception | Partial Pick / Short | 🔴 Critical | Request/Item status |
| Exception Dashboard | Partial Picks Dashboard | 🔴 Critical | Navigation |
| Exception Reasons | Short Reasons | 🔴 Critical | Dropdown label |
| Mark as Exception | Mark as Short | 🔴 Critical | Button |
| Ready for Collection | Staged | 🔴 Critical | Status |
| MC_Priority_Flag | (Remove) | 🟡 Important | Data field |
| Ops Seq | Op Seq | 🟢 Optional | Table header |
| Line Number | WO Line | 🟡 Important | Column header |
| Line Item | Item | 🟡 Important | Request context |

---

## 🔧 IMPLEMENTATION PLAN

### Phase 1: User-Facing Labels (🔴 Critical)
**Goal:** Change what users see, minimal code changes

**Tasks:**
1. Update all button labels
2. Update status pill labels
3. Update navigation menu
4. Update modal headings
5. Update table headers
6. Update tooltips
7. Add acronym expansions

**Estimated Effort:** 4-6 hours

**Files (User-Facing Text):**
- All `.tsx` component files (button labels, headings)
- Navigation configs
- Status pill components
- Modal components
- Table components

---

### Phase 2: Code Refactoring (🟡 Important)
**Goal:** Align code with new terminology

**Tasks:**
1. Rename TypeScript interfaces
2. Rename variables
3. Rename functions
4. Update mock data
5. Update API calls
6. Update tests

**Estimated Effort:** 12-16 hours

**Files (Code):**
- `types/index.ts`
- `services/api.ts`
- All feature components (logic)

---

### Phase 3: Documentation (🟢 Optional)
**Goal:** Update all docs to use new terms

**Tasks:**
1. Update README
2. Update code comments
3. Update help text
4. Update training materials (if any)

**Estimated Effort:** 2-4 hours

---

## ✅ CHANGE CHECKLIST

Use this checklist when implementing terminology changes:

### For Each Term Change:

- [ ] Update TypeScript types (if applicable)
- [ ] Update UI labels (buttons, headings, etc.)
- [ ] Update table column headers
- [ ] Update status pill text
- [ ] Update navigation menu
- [ ] Update modal headings/text
- [ ] Update tooltips
- [ ] Update help text
- [ ] Update error messages
- [ ] Update success messages
- [ ] Update placeholder text
- [ ] Update aria-labels (accessibility)
- [ ] Update mock data
- [ ] Update variable names (Phase 2)
- [ ] Update function names (Phase 2)
- [ ] Update comments (Phase 2)
- [ ] Update documentation (Phase 3)
- [ ] Test user flows with new terminology

---

## 📝 SPECIFIC FILE CHANGES

### High-Priority User-Facing Changes:

#### 1. Exception → Partial Pick / Short

**Files:**
```
features/qube-fulfillment/QubePickListView.tsx
- Navigation: "Exception Dashboard" → "Partial Picks Dashboard"

features/qube-fulfillment/PickingView.tsx
- Button: "Report Exception" → "Mark as Short"
- Modal heading: "Report Exception" → "Short Item Report"

components/ui/StatusPill.tsx
- Status text: "Exception" → "Partial Pick" (request level)
- Status text: "Exception" → "Short" (item level)

features/dashboards/ExceptionDashboard.tsx
- Heading: "Exception Dashboard" → "Partial Picks Dashboard"
- Description: "View all exceptions" → "View all partial picks and short items"

services/api.ts
- Label: exceptionReasons → "Short Reasons:" (UI label only)
```

#### 2. Ready for Collection → Staged

**Files:**
```
types/index.ts
- status: 'Ready for Collection' → 'Staged'

components/ui/StatusPill.tsx
- Badge text: "Ready for Collection" → "Staged"

features/qube-fulfillment/PickingView.tsx
- Button: "Mark as Ready for Collection" → "Mark as Staged"
- Success message: "Moved to Ready for Collection" → "Moved to Staged"
```

#### 3. Add MRF Definition

**Files:**
```
features/wo-materials/WOMaterialView.tsx
- Heading: "Material Requests (MRF)"

components/ui/Tooltip.tsx
- Add: MRF = Material Request Form
```

---

## 🎯 TESTING TERMINOLOGY CHANGES

### Manual Testing Checklist:

**Test Each Changed Term:**
1. [ ] Verify new term appears in UI
2. [ ] Verify no old term visible to users
3. [ ] Verify tooltips updated
4. [ ] Verify error/success messages updated
5. [ ] Verify navigation labels updated
6. [ ] Verify modal headings updated
7. [ ] Take screenshot for documentation
8. [ ] Verify with stakeholder (if possible)

**Regression Testing:**
1. [ ] Verify functionality still works
2. [ ] Verify status flows still work
3. [ ] Verify no broken code references
4. [ ] Verify no TypeScript errors

---

## 📞 STAKEHOLDER COMMUNICATION

When rolling out terminology changes:

**Communication Plan:**
```
1. Email to all users:
   Subject: UI Updates - Clearer Terminology
   
   "We've updated some terms in the SCM Hub to match
   warehouse terminology:
   
   - 'Exception' is now 'Partial Pick' or 'Short'
   - 'Ready for Collection' is now 'Staged'
   - [other changes]
   
   Everything works the same, just clearer labels."

2. In-app banner (first login after update):
   "We've updated some labels to be clearer. Learn more >"

3. Quick reference card (PDF):
   Old Term → New Term cheat sheet
```

---

## 🔄 ROLLBACK PLAN

If terminology changes cause confusion:

**Quick Rollback:**
1. Keep old variable names in code (don't refactor Phase 2)
2. Only change UI labels back
3. Can be done in minutes (just text changes)

**Phased Rollback:**
1. Keep new terms for internal users (MC, Qube)
2. Revert to old terms for external users (Requestors)
3. Evaluate which terms work better

---

**End of Document**  
*For questions or changes, update this document and version number*


