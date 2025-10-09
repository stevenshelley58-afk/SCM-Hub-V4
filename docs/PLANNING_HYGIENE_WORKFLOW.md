# Planning Hygiene Workflow

The goal of this workflow is to keep the in-repo planning artifacts trustworthy so that any agent can confidently pick up the next task. Follow the checklist below at least once per week (recommended cadence: Wednesday planning sync) or whenever a major feature ships.

## Cadence & Roles
- **When:** Every Wednesday or within 24 hours after a major release.
- **Primary Owner:** Current coordination agent (Agent 1 by default). Rotate ownership if Agent 1 is offline.
- **Supporting Roles:** Each active agent reviews their lane to confirm status notes and dependencies.

## Checklist
1. **Sync task boards**
   - Compare `CURRENT_TODOS.md`, `AGENT_STATUS.md`, `COMPREHENSIVE_REVIEW.md`, and `PARALLEL_DEVELOPMENT_PLAN.md`.
   - Remove completed items or move them to historical records.
   - Confirm new follow-ups are represented in the appropriate lane.
2. **Update status snapshots**
   - Refresh progress counts (tasks complete/remaining) per agent.
   - Ensure blockers and active work items are accurate in `AGENT_STATUS.md`.
3. **Validate dependencies & acceptance criteria**
   - Cross-check that dependencies reference delivered services (e.g., notification, photo, LTR integrations).
   - Update acceptance criteria to reflect the latest architectural patterns or shared utilities.
4. **Refresh timestamps and reviewers**
   - Update the `_Last reviewed_` field in `CURRENT_TODOS.md`.
   - Log the review date and reviewer initials in this file if helpful.
5. **Communicate changes**
   - Share a short summary in the coordination channel (or PR description) highlighting major updates.
   - If new risks or blockers surface, record them in the relevant planning document immediately.

## Tools & References
- `codex/review-current_todos.md` – context for the last audit and rationale for task adjustments.
- `AGENT_STATUS.md` – live status board; ensure it stays aligned after each hygiene pass.
- `COMPREHENSIVE_REVIEW.md` – authoritative snapshot for stakeholders; keep numbers synchronized.
- `PARALLEL_DEVELOPMENT_PLAN.md` – detailed roadmap; adjust assignments and priorities when scope shifts.

Keeping these artifacts synchronized prevents duplicate work, clarifies dependencies, and speeds up onboarding for new agents.
