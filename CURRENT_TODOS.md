# Current TODOs

This board translates the outstanding work captured in the project planning docs into actionable tasks.
Each entry includes a short scope statement and concrete acceptance criteria so that anyone picking
up the task knows when it is complete.

## How to use this file
- Pick a task that matches your agent focus area and priority level.
- Move the checkbox from `[ ]` to `[x]` when you finish the work and update the related planning docs.
- Keep acceptance criteria up to date if the scope changes during implementation.

---

## 🔵 Agent 1 — Core Workflows & UX

| Status | Task ID | Title | Acceptance Criteria | Dependencies / Notes |
| ------ | ------- | ----- | ------------------- | -------------------- |
| [ ] | impl-41 | Bulk queue actions for MC |<ul><li>`features/admin/PriorityQueueView.tsx` supports selecting multiple requests and applying actions in one step.</li><li>Bulk actions cover status updates, MC priority flag toggles, and ownership hand-off, emitting entries through `services/auditService.ts`.</li><li>Each action optionally triggers stakeholder alerts via `services/notificationService.ts` (mock adapters acceptable) and refreshes queue ordering.</li><li>UI shows optimistic toasts or inline error states when an action fails.</li></ul>|Build on existing table selection + drag-and-drop logic in the priority queue view.|
| [ ] | impl-43 | Proof of Delivery capture integration |<ul><li>`PODCaptureModal` uploads photos/signatures through `services/photoService.ts` (or queues via `offlineService.ts` when offline) instead of mutating local state directly.</li><li>Captured POD records surface in `RequestDetailPanel` with thumbnails, metadata, and download links.</li><li>Submitting POD fires a delivered-status update, audit log entry, and notification to requestor/MC via `notificationService` templates.</li><li>Automated smoke test (or documented manual script) covers online/offline submission paths.</li></ul>|Coordinate with Agent 3 services (`photoService`, `notificationService`, `offlineService`).|
| [ ] | impl-44 | ETA tracking |<ul><li>Create shared helpers (e.g., `utils/etaHelpers.ts`) to calculate ETAs using MC input and updates from `ltrIntegrationService.ts`.</li><li>ETA appears on Request detail, MC queue, and AC dashboards with status-based color coding.</li><li>Late or missing ETAs surface alerts and route through notification templates.</li><li>Each ETA change records to the audit trail with before/after context.</li></ul>|Requires data wiring between MC tooling and LTR integration feed.|
| [ ] | impl-45 | Delivery confirmation |<ul><li>Requestor-facing UI surfaces “Confirm Delivery” and “Report Issue” flows tied to `RequestDetailPanel`.</li><li>Confirmation closes the request, logs audit history, and triggers thank-you/feedback notifications.</li><li>Issue flow reopens or spawns a follow-up request with captured reason codes and optional photos.</li><li>Offline usage queues the action for sync and prevents duplicate submissions.</li></ul>|Depends on completed POD + ETA tracking to provide accurate context.|

---

## 🟠 Agent 3 — Integrations & System Services

The integration platform (notifications, photo storage, LTR sync, offline queue, exports) is delivered and verified. No open Agent 3 tasks at this time; see Agent 1 and cross-cutting lanes for work to wire those services into the core workflows.

---

## 🟡 Cross-Cutting / Lower Priority

| Status | Task ID | Title | Acceptance Criteria | Dependencies / Notes |
| ------ | ------- | ----- | ------------------- | -------------------- |
| [ ] | cross-01 | Wire notifications into core workflows |<ul><li>Material request submit/approve/hold/deliver paths call `notificationService` helpers so stakeholders receive channel-appropriate updates.</li><li>Notification templates selected dynamically based on event + persona and include deep links into the UI.</li><li>Failures are retried (mock) and surfaced in the MC alert panel or console log for now.</li><li>Smoke script documents how to trigger each notification event in dev.</li></ul>|Coordinate with Agent 3 services (`notificationService`, `emailSMSService`, `teamsIntegrationService`).|

---

## 🧭 Planning Hygiene & Coordination

| Status | Task ID | Title | Acceptance Criteria | Dependencies / Notes |
| ------ | ------- | ----- | ------------------- | -------------------- |
| [x] | plan-01 | Reconcile CURRENT_TODOS with live status sources |<ul><li>Board updated on 2025-10-11 to match `AGENT_STATUS.md`, `COMPREHENSIVE_REVIEW.md`, and `PARALLEL_DEVELOPMENT_PLAN.md`.</li><li>Agent 3 lane collapsed now that integrations are complete; follow-up wiring lives with Agent 1 / cross-cutting tasks.</li><li>Dependencies now point to delivered services (notification, photo, LTR) as available building blocks.</li></ul>|Validated during documentation sweep on 2025-10-11.|
| [x] | plan-02 | Establish planning hygiene workflow |<ul><li>Published `docs/PLANNING_HYGIENE_WORKFLOW.md` with cadence, owners, and checklist.</li><li>Last reviewed timestamp updated via this process.</li><li>Checklist requires dependency notes/acceptance criteria updates after launches.</li></ul>|Adopt during weekly planning sync (Wednesdays).|

---

_Last reviewed: 2025-10-11_
