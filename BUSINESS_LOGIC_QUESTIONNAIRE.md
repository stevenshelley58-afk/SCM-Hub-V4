# SCM Hub Business Logic & Flow Questionnaire

## 📋 Instructions
- Answer each question with specific requirements
- Mark priority: 🔴 Critical | 🟡 Important | 🟢 Nice-to-have
- Note: "Current" = what I coded, "Expected" = what you actually need

---

## SECTION 1: REQUEST LIFECYCLE & STATUS FLOW

### 1.1 Request Status Transitions
**Current Flow:**
```
Submitted → Picking → Ready for Collection → In Transit → Delivered
           ↓
        Exception (can happen at any stage)
```

**Questions:**
1. Is this the correct order of statuses? 
2. Who can change each status? (Current: Anyone can change)
   - Submitted → Picking: Who? ________
   - Picking → Ready: Who? ________
   - Ready → In Transit: Who? ________
   - In Transit → Delivered: Who? ________
   - Any → Exception: Who? ________

3. Can a request go backwards? (e.g., Delivered → In Transit?)
4. Are there missing statuses? Examples:
   - "Approved/Rejected" (before Submitted?)
   - "Partially Picked" (some items picked, some not?)
   - "On Hold" (temporary pause?)
   - "Cancelled" (requestor cancels?)
   
5. **🟡 What happens if:**
   - Requestor changes their mind after submission?
   - Items are damaged during picking?
   - Delivery location changes mid-transit?

---

### 1.2 Line Item Status Flow
**Current:** Open → Picked or Exception

**Questions:**
1. Can individual items have status separate from the request?
2. If 5 of 10 items are picked, what's the request status?
3. Can picker mark items as:
   - "Not Found" (location empty)?
   - "Wrong Item" (different material in location)?
   - "Damaged" (item is broken)?
   - "Quarantine" (hold for inspection)?
4. What if some items are picked but can't complete request?

---

## SECTION 2: USER ROLES & PERMISSIONS

### 2.1 Current Role Access
**Requestor (Jane Doe):**
- ✅ View WO Materials
- ✅ Create Material Requests
- ✅ View My Requests
- ❌ Cannot see Qube Pick List
- ❌ Cannot lock materials

**Area Coordinator (Steve):**
- ✅ View WO Materials
- ✅ Create Material Requests
- ✅ See Scope Dashboard
- ✅ Lock/Unlock Materials
- ✅ Set Priority Queue
- ❌ Cannot pick

**Qube User (JJ):**
- ✅ View Pick List
- ✅ Pick Items
- ✅ Mark Exceptions
- ❌ Cannot create requests
- ❌ Cannot see WO Materials

**Material Coordinator (Corey):**
- ✅ Access Control Panel
- ✅ Ingest Master Data
- ✅ View Exception Dashboard
- ❌ Cannot pick
- ❌ Cannot create requests

**Questions:**
1. **🔴 Who is missing?**
   - Warehouse Supervisor?
   - Delivery Driver (Toll)?
   - Approver/Manager?
   - Emergency Services (24/7 access)?

2. **🔴 Permission Gaps:**
   - Should Requestor see pick status? (currently NO)
   - Should AC be able to pick in emergency? (currently NO)
   - Should MC be able to prioritize requests? (currently YES for AC only)
   - Should Qube see who requested? (currently YES)

3. **🟡 Can users have multiple roles?** 
   Example: Steve is AC but also sometimes picks?

4. **🟡 Team/Group permissions?**
   - "Team A Requestors" vs "Team B Requestors"?
   - "Day Shift Pickers" vs "Night Shift Pickers"?

---

### 2.2 Data Visibility Rules
**Questions:**
1. Can requestors see ALL requests or just their own?
   - Current: ALL (Jane sees Mike's requests too)
   - Expected: _______________

2. Can requestors see other people's WO materials?
   - Current: YES (sees all work orders)
   - Expected: _______________

3. Should users see deleted/cancelled requests?
4. Should there be "private" requests? (only visible to specific people)
5. Audit trail - who needs to see "who changed what when"?

---

## SECTION 3: PRIORITY & URGENCY LOGIC

### 3.1 Priority Levels
**Current:**
- P1 (Critical/Shutdown - has 🚩 flag + MC_Priority_Flag)
- P2 (High)
- P3 (Urgent)  
- P4 (Routine)

**AC Priority:** Area Coordinator can set numeric priority (1,2,3...) for queue

**Questions:**
1. **🔴 Who sets priority?**
   - Requestor chooses from P1-P4? (currently YES)
   - Can anyone override? (currently NO)
   - MC flag: Who sets it? (currently auto if P1, but name suggests MC does?)

2. **🔴 Priority conflicts:**
   - If request is P4 but AC sets queue priority=1, what wins?
   - Should priority auto-escalate if overdue?
   - Can priority be downgraded?

3. **🟡 What makes something P1/Critical?**
   - Safety issue?
   - Production stopped?
   - Regulatory deadline?
   - Need specific criteria?

4. **🟡 Should priority affect other things?**
   - Faster notifications?
   - Different approval process?
   - Auto-assign to senior picker?
   - Show on dashboard alert?

---

### 3.2 Required By Timestamp
**Current:** Requests have `RequiredByTimestamp` but nothing uses it

**Questions:**
1. What happens when past due?
   - Auto-escalate priority?
   - Send notifications?
   - Flag in red?
   - Move to top of queue?

2. How far in advance can requests be made?
   - Same day only?
   - Week ahead?
   - Emergency override?

3. Buffer time:
   - If needed by 2pm, should picking start by 1pm?
   - Auto-block if not enough time?

---

## SECTION 4: MATERIAL LOCKING

**Current:**
- AC can lock materials with comment
- Locked by name shown
- Locked materials can't be selected for new requests
- Only locker can unlock

**Questions:**
1. **🔴 Lock duration:**
   - Forever until manual unlock?
   - Auto-expire after X hours?
   - Calendar-based? (locked until Friday)

2. **🔴 Who can unlock?**
   - Only the person who locked? (current)
   - Their supervisor?
   - MC can override any lock?
   - Emergency unlock (with reason)?

3. **🟡 Lock scope:**
   - Lock entire item across all locations?
   - Lock only in specific location?
   - Lock quantity? (e.g., lock 5 out of 10 available)

4. **🟡 Reservation vs Lock:**
   - Should creating a request auto-lock those materials?
   - Should materials unlock when request is delivered?
   - Pre-reserve for critical jobs?

5. **🟢 Lock types:**
   - "Reserved" (soft lock, can override with approval)
   - "Quarantine" (damaged, needs inspection)
   - "Allocated" (assigned to specific WO)

---

## SECTION 5: PICKING WORKFLOW

### 5.1 Pick List Ordering
**Current Priority Logic:**
1. MC_Priority_Flag (P1 requests first)
2. AC Priority Number (lower = higher priority)
3. Required By Timestamp (earliest first)

**Questions:**
1. Is this the right order?
2. Should other factors affect order?
   - Requester location (pick nearby deliveries together?)
   - Item location (pick by warehouse zone?)
   - Picker skill level?
   - Pack number (pick full pack together?)

3. Can picker choose ANY request or must go in order?
   - Current: Can click any
   - Expected: _______________

---

### 5.2 Picking Actions
**Current Actions:**
- Mark individual item as Picked
- Mark item as Exception (with reason)
- Mark All as Picked
- Stage Complete (all done)

**Questions:**
1. **🔴 What if quantity is wrong?**
   - Request 10, find 7 → Partial pick or Exception?
   - Can picker adjust quantity? (currently NO)
   - Does partial pick create back-order?

2. **🟡 Substitutions:**
   - Can picker substitute similar item?
   - Needs approval first?
   - Who approves?

3. **🟡 Split picking:**
   - Can multiple pickers work on same request?
   - How to prevent picking same item twice?

4. **🟢 Pick optimization:**
   - Print pick slip with optimal route?
   - Suggest picking multiple requests at once?
   - Voice picking integration?

---

### 5.3 Exception Handling
**Current Exceptions:**
- Item Damaged
- Quantity Mismatch
- Location Empty
- Wrong Item in Location
- Other (free text)

**Questions:**
1. What happens AFTER marking exception?
   - Goes to Exception Dashboard? (currently YES)
   - Notification to MC? (currently NO)
   - Automatic workflow? (currently NO)

2. **🔴 Who fixes exceptions?**
   - MC investigates?
   - AC contacted?
   - Original requestor notified?

3. **🟡 Exception types - are these sufficient?**
   Missing:
   - "Access Restricted" (area locked out)?
   - "Requires Special Equipment" (forklift needed)?
   - "Hazmat Procedure Required"?

4. Can exceptions be resolved and re-picked?

---

## SECTION 6: DELIVERY & LOGISTICS

### 6.1 Delivery Locations
**Current Options:**
- Ops Center Trailer 1
- Laydown Yard 7
- Unit 12 Work Area
- Weld Shop

**Questions:**
1. Are these locations:
   - Fixed/permanent?
   - Need to add more frequently?
   - Need GPS coordinates?
   - Need building/room number?

2. **🔴 Delivery confirmation:**
   - Who marks delivered? (Toll driver? Picker? Requestor?)
   - POD (Proof of Delivery) required?
   - Photo evidence?
   - Signature required?

3. **🟡 What if wrong location?**
   - Can driver update in transit?
   - Redeliver or reject?

4. **🟡 Special delivery requirements:**
   - Escort required?
   - After-hours access?
   - Hazmat protocols?
   - Fragile handling?

---

### 6.2 Toll Task Request Integration
**Current:** Button exists but is placeholder

**Questions:**
1. How does Toll get notified?
   - Auto-notification when "Ready for Collection"?
   - Manual "Call Toll" button?
   - Integration with their system?

2. **🔴 Toll workflow:**
   - Accept/Reject job?
   - Update ETA?
   - Confirm pickup?
   - Confirm delivery?

3. Multiple deliveries:
   - Can Toll combine multiple requests?
   - Route optimization?

---

## SECTION 7: WORK ORDER INTEGRATION

### 7.1 Work Order Data
**Current Data:**
- Work Order Number
- Line Number
- Ops Sequence
- Team (A,B,C,D,X,Y,Z)
- Pack Number
- Material Description
- Quantity

**Questions:**
1. **🔴 Where does this data come from?**
   - JDE integration?
   - SAP?
   - Manual entry?
   - Excel import?

2. **🔴 Is it read-only or editable?**
   - Can users change WO qty?
   - Can they add materials not in WO?
   - Can they split WO lines?

3. **🟡 WO status integration:**
   - Does WO system know materials were delivered?
   - Two-way sync?
   - Just one-time pull?

4. **🟡 Pack logic:**
   - What is a pack? (materials that must ship together?)
   - Auto-select all pack items?
   - Warn if pack incomplete?

---

## SECTION 8: NOTIFICATIONS & ALERTS

**Current:** None implemented

**Questions:**
1. **🔴 Who should get notified when:**
   - New request created? → ______
   - Request becomes P1? → ______
   - Exception occurs? → ______
   - Delivery complete? → ______
   - Request overdue? → ______

2. **🟡 Notification methods:**
   - Email?
   - SMS?
   - In-app only?
   - Teams/Slack?
   - Mobile push?

3. **🟢 Escalation:**
   - If request not picked in X hours → notify supervisor?
   - If exception not resolved → escalate?

---

## SECTION 9: REPORTING & ANALYTICS

**Current:** None implemented (just live views)

**Questions:**
1. **🟡 What reports are needed?**
   - Daily pick counts?
   - Average time from request → delivery?
   - Exception rate by material?
   - Requests by team/shift?
   - Inventory usage trends?

2. **🟡 Who needs reports?**
   - Supervisors: Daily summary?
   - Management: Weekly KPIs?
   - Planning: Monthly trends?

3. **🟢 Dashboards:**
   - Real-time wall display?
   - Mobile summary view?
   - Executive summary?

---

## SECTION 10: DATA MANAGEMENT

### 10.1 Master Data
**Current:**
- 1000 mock WO materials
- Manual ingest via Control Panel

**Questions:**
1. **🔴 Master data source:**
   - Daily batch from JDE?
   - Real-time API?
   - How often update?
   - What if data conflicts?

2. **🔴 Data retention:**
   - Keep completed requests how long?
   - Archive old requests?
   - Delete or just hide?

3. **🟡 Data validation:**
   - Check item codes against master?
   - Validate quantities?
   - Location verification?

---

### 10.2 Audit Trail
**Current:** None

**Questions:**
1. **🟡 What to track:**
   - Who created/modified each request?
   - Status change history?
   - Priority changes?
   - Who locked/unlocked materials?

2. **🟡 How long keep audit:**
   - Forever?
   - 7 years (compliance)?
   - Just active requests?

---

## SECTION 11: MOBILE & OFFLINE

**Current:** Desktop web only

**Questions:**
1. **🟡 Mobile needs:**
   - Pickers use tablets/phones?
   - Drivers need mobile view?
   - Barcode scanning?

2. **🟢 Offline capability:**
   - Work without internet?
   - Sync when reconnected?
   - Conflict resolution?

---

## SECTION 12: NOVEL FEATURES & IMPROVEMENTS

### 🚀 AI-Powered Suggestions
1. **Predicted shortages:** 
   - "Team A usually needs 20 gaskets/week, only 5 in stock"
2. **Optimal pick routing:** 
   - "Pick these 3 requests together, save 15 minutes"
3. **Smart substitution:** 
   - "10" valve unavailable, suggest 8" + adapter?"

### 🚀 Automation
4. **Auto-prioritization:** 
   - Learns from history what's truly urgent
5. **Auto-approval:** 
   - Routine requests (same person, same items) auto-approve
6. **Auto-lock:** 
   - If WO scheduled tomorrow, auto-lock materials today

### 🚀 Collaboration
7. **Request chat/comments:** 
   - "Need this by 3pm, not 5pm"
   - "Can substitute if needed"
8. **Team coordination:** 
   - "Steve also needs gaskets for WO12346, combine?"
9. **@mentions:** 
   - "This is for @Corey's critical path job"

### 🚀 Visibility
10. **Live tracking:** 
    - "Your request is being picked right now (2 of 5 items)"
11. **ETA predictions:** 
    - "Expected delivery: 2:45pm ± 15min"
12. **Material availability forecast:** 
    - "10 in stock, 3 allocated, 7 available"

### 🚀 Quality & Safety
13. **Photo documentation:** 
    - Picker photos damaged items
    - Delivery photo proof
14. **Hazmat warnings:** 
    - Auto-flag hazardous materials with special instructions
15. **Certification check:** 
    - "Only certified riggers can request lifting equipment"

### 🚀 Efficiency
16. **Favorites/Templates:** 
    - "My usual weekly order"
    - "Critical weld pack template"
17. **Bulk actions:** 
    - "Create 10 requests from Excel"
    - "Mark all Team A requests as P2"
18. **Smart search:** 
    - "steel pipe 10 inch" → finds all variants
19. **Historical insights:** 
    - "You requested this 3 times last month, want to stock more?"

### 🚀 Integration
20. **Calendar integration:** 
    - "Block materials for scheduled shutdown next week"
21. **Procurement handoff:** 
    - If not in stock → auto-create purchase request
22. **QR codes:** 
    - Print QR on delivered materials → scan to confirm receipt

---

## SECTION 13: SECURITY & COMPLIANCE

**Questions:**
1. **🔴 Authentication:**
   - SSO (Active Directory)?
   - 2FA required?
   - Session timeout?

2. **🔴 Sensitive materials:**
   - Any materials require special approval?
   - Controlled substances?
   - High-value items?

3. **🟡 Compliance:**
   - ISO 9001 traceability?
   - Safety regulations?
   - Industry-specific (oil & gas / mining)?

---

## SECTION 14: EDGE CASES & ERROR SCENARIOS

**What should happen if:**
1. User creates request at 11:59pm, needed by 12:01am?
2. Material exists in 3 locations, which to pick first?
3. Picker marks all items picked, then finds one damaged?
4. Request created for materials that were just used by someone else?
5. Delivery truck breaks down mid-delivery?
6. System goes down during picking?
7. Same person creates 100 requests at once?
8. Material location changes while being picked?
9. Requestor deleted but has active requests?
10. Duplicate request submitted (by mistake)?

---

## 📝 YOUR PRIORITIES

Rank these features 1-5 (1=do first, 5=low priority):

- [ ] Fix security/permissions
- [ ] Add notifications
- [ ] Mobile/tablet support  
- [ ] Better exception workflow
- [ ] Reporting/analytics
- [ ] Delivery tracking
- [ ] WO integration
- [ ] Material locking improvements
- [ ] AI suggestions
- [ ] Offline capability

---

## ✅ NEXT STEPS

After you answer:
1. I'll identify gaps between current vs expected
2. Create prioritized backlog
3. Estimate effort for each item
4. Suggest phased rollout plan

**Ready to review?** Let me know which sections are most critical!




