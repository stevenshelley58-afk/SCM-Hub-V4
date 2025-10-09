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
| [ ] | impl-41 | Bulk operations for material requests |<ul><li>User can multi-select requests in the MC queue.</li><li>Bulk actions include status change, priority update, and assignment.</li><li>Permission checks reuse `utils/permissions.ts` helpers.</li><li>UI reflects action results with toasts and refreshed data.</li></ul>|Coordinate with queue drag-and-drop logic added in priority queue feature.|
| [ ] | impl-43 | Proof of Delivery capture |<ul><li>Warehouse users can attach photos and signatures at delivery.</li><li>Attachments display in the request timeline for MC/requestor.</li><li>Data saved to mock API layer pending backend integration.</li><li>Offline-safe draft handling for later sync (if offline work proceeds).</li></ul>|Reuse patterns from photo documentation task (impl-23) when available.|
| [ ] | impl-44 | ETA tracking |<ul><li>Requests display estimated delivery time sourced from MC input.</li><li>ETA updates broadcast to requestor and AC dashboards.</li><li>Overdue ETAs surface alerts in MC queue.</li><li>History of ETA changes logged for audit.</li></ul>|Requires notification hooks from Agent 3 (impl-16/36).|
| [ ] | impl-45 | Delivery confirmation |<ul><li>Requestor UI includes “Confirm Delivery” and “Report Issue” actions.</li><li>Confirmation updates status to Delivered and triggers feedback form.</li><li>Issues reopen request or spawn follow-up workflow as defined.</li><li>Audit trail entry recorded for each confirmation/issue.</li></ul>|Depends on ETA tracking and notification system for alerts.|
| [ ] | impl-18 | Delivery location management |<ul><li>CRUD UI for managing saved delivery locations.</li><li>Validation on location codes and default flags.</li><li>Request form integrates saved locations dropdown.</li><li>Permissions restrict edits to MC + scoped roles.</li></ul>|Coordinate with request creation form components.|
| [ ] | impl-39 | Conflict resolution UI |<ul><li>UI surfaces data mismatches between master and transactional data.</li><li>MC can accept either side or enter manual override.</li><li>Resolution decision logs to audit trail with user + timestamp.</li><li>Resolved data propagates to downstream views immediately.</li></ul>|Leverage audit logging infrastructure from Agent 2 deliverables.|

---

## 🟠 Agent 3 — Integrations & System Services

| Status | Task ID | Title | Acceptance Criteria | Dependencies / Notes |
| ------ | ------- | ----- | ------------------- | -------------------- |
| [ ] | impl-16 | Stakeholder notification system |<ul><li>Central notification service routes events to Requestor, MC, and AC personas.</li><li>Events emitted for submission, approvals, holds, shorts, staging, and delivery.</li><li>Supports pluggable channels (console/log mock for now).</li><li>Queueing or batching strategy documented for production.</li></ul>|Foundation for email/SMS/Teams integrations.|
| [ ] | impl-36 | Notification templates |<ul><li>Templates exist for each notification event with placeholders for dynamic data.</li><li>Supports localization-ready formatting and markdown/HTML rendering.</li><li>Versioning strategy defined for template updates.</li><li>Unit tests validate variable substitution.</li></ul>|Build atop notification system from impl-16.|
| [ ] | impl-23 | Photo documentation service |<ul><li>Service/API handles storing and retrieving photo attachments.</li><li>Integrates with POD capture and short pick workflows.</li><li>Metadata (uploader, timestamp, request ID) persisted.</li><li>Fallback strategy defined for offline or failed uploads.</li></ul>|Coordinate with Agent 1 for POD feature (impl-43).|
| [ ] | impl-27 | Data export/import tooling |<ul><li>Export CSV for requests, items, and audit log with filters.</li><li>Import pipeline validates structure before applying changes.</li><li>Audit log records import/export events.</li><li>Permissions restrict bulk data operations to MC/Admin.</li></ul>|Leverage reporting schema built by Agent 2.|
| [ ] | impl-37 | Email/SMS integration |<ul><li>Adapters exist for email and SMS providers (mocked services acceptable).</li><li>Notification system can send via selected channel.</li><li>Retry logic and error handling documented.</li><li>Environment configuration documented in `config/`.</li></ul>|Requires notification system (impl-16) and templates (impl-36).|
| [ ] | impl-38 | Microsoft Teams integration |<ul><li>Webhook-based integration posts updates to Teams channels.</li><li>Channel mapping configurable per site or priority level.</li><li>Throttling prevents spam; failures logged with retries.</li><li>Security considerations documented (secrets storage, rotation).</li></ul>|Depends on notification infrastructure.|

---

## 🟡 Cross-Cutting / Lower Priority

| Status | Task ID | Title | Acceptance Criteria | Dependencies / Notes |
| ------ | ------- | ----- | ------------------- | -------------------- |
| [ ] | impl-19 | Toll LTR integration |<ul><li>Mock connector created with clear interface to call LTR APIs.</li><li>Error handling and retries defined for rate limiting.</li><li>Integration toggled via feature flag.</li><li>Documentation for auth/credentials included.</li></ul>|Needs deployment automation for secret management.|
| [ ] | impl-20 | SharePoint data sync |<ul><li>Scheduled sync job pulls latest SharePoint inventory data.</li><li>Conflict handling strategy documented.</li><li>Audit log records sync activity and errors.</li><li>Manual re-sync option exposed to MC.</li></ul>|Coordinate with conflict resolution UI (impl-39).|
| [ ] | impl-50 | User preference saving |<ul><li>Per-user settings persisted for filters, columns, and default views.</li><li>Preferences load automatically on login.</li><li>Fallback to sensible defaults when no preferences exist.</li><li>Settings export/import documented for migrations.</li></ul>|Ensure compatibility with feature toggles.|
| [ ] | impl-51 | Offline capability |<ul><li>Core workflows available offline with queued sync when connection restores.</li><li>Local storage strategy documented (IndexedDB/service worker).</li><li>User feedback indicates offline/online status.</li><li>Conflict resolution defined for offline updates.</li></ul>|Impacts POD capture (impl-43) and photo service (impl-23).|
| [ ] | impl-52 | Rate limiting |<ul><li>Client-side guard rails prevent excessive requests.</li><li>Strategy documented for backend enforcement.</li><li>User messaging explains when limits hit.</li><li>Metrics feed into system health dashboards.</li></ul>|Coordinate with monitoring alerts from Agent 2.|
| [ ] | impl-53 | Session management hardening |<ul><li>Automatic session timeout with warning modal.</li><li>Reauthentication flow respects role permissions.</li><li>Session events logged for audit.</li><li>Security audit recommendations addressed.</li></ul>|Leverage guidance in `SECURITY_AUDIT.md`.|
| [ ] | impl-56 | Backup & restore processes |<ul><li>Documented backup cadence for Supabase and assets.</li><li>Tested restore playbook with success criteria.</li><li>Automated health check for backup completion.</li><li>Alerts configured for backup failures.</li></ul>|Works with deployment automation (impl-65).|
| [ ] | impl-57 | Comprehensive security audit follow-ups |<ul><li>Track remediation tasks identified in `SECURITY_AUDIT.md`.</li><li>Update audit doc with status and owners.</li><li>Implement highest severity fixes first.</li><li>Verification checklist completed post-remediation.</li></ul>|Partner with security lead; ties into session management work.|
| [ ] | impl-63 | API documentation |<ul><li>Generate up-to-date API reference from integration services.</li><li>Examples include request/response payloads.</li><li>Docs published to `/docs` with navigation.</li><li>Versioning and change-log strategy documented.</li></ul>|Extend `INTEGRATION_API_DOCS.md`.|
| [ ] | impl-65 | Deployment automation |<ul><li>Scripted deployment path (CI/CD) replacing manual GitHub Pages deploy.</li><li>Environment configuration stored securely.</li><li>Rollback procedure automated and tested.</li><li>Deployment status surfaced in monitoring dashboard.</li></ul>|Coordinate with backup system and rate limiting tasks.|
| [ ] | impl-67 | Final integration testing |<ul><li>Full end-to-end regression covering MC, AC, Warehouse, and Requestor flows.</li><li>Cross-browser coverage documented (Chrome, Edge, Safari).</li><li>Performance benchmarks captured vs targets.</li><li>Issues filed for any regressions found.</li></ul>|Requires completion of critical features above.|

---

_Last reviewed: {{DATE:2025-10-09}}_
