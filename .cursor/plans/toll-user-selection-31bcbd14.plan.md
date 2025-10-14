<!-- 31bcbd14-608c-4948-83e6-8e4ecfcd61e3 fd303a20-1333-4873-81d5-0919451c615a -->
# Align Toll Task Request (TTR) With Roles and Flows

## Goal

Make TTR fully independent from MRF, with only two user roles: MLC (Material Logistics Coordinator) and Driver. No warehouse picking in TTR. Ensure correct user selection, routing, labels, and session persistence.

## Key Changes

### 1) TTR-specific user selection in Operations Hub

- Create a TTR-only user list containing `mlc` and `driver` (do not alter the MRF list).
- Use the TTR user list in the Toll modal (leave MRF modal as-is).
- Persist as `toll_session_user`.
- Conditional routing:
  - If `mlc` → navigate to `logistics-dispatcher`
  - If `driver` → navigate to `logistics-driver`

Minimal code (OperationsHub.tsx - Toll handler):

```ts
const handleTollModalContinue = () => {
  if (!selectedTollUser) return;
  const actualUser = users[selectedTollUser.id as keyof typeof users];
  localStorage.setItem('toll_session_user', JSON.stringify(selectedTollUser));
  setShowTollModal(false);
  onUserChange(actualUser);
  onNavigate(selectedTollUser.id === 'driver' ? 'logistics-driver' : 'logistics-dispatcher');
};
```

### 2) Labels and copy to match your terminology

- Rename UI copy: "Logistics Dispatcher" → "MLC Console" (title only; keep filename).
- Toll modal subtitle: “Choose your user context for the Toll Task Request app.” (already done).

### 3) Remove picking references from the Toll path

- Ensure the Toll app card no longer routes (directly or indirectly) to any MRF view (already moved from `picklist` to `logistics-dispatcher`).
- Verify no code paths in Toll flow reference `picklist` or `picking`.

### 4) Optional quality-of-life improvements

- If a `toll_session_user` exists, clicking the Toll card should skip the modal and route directly to the right TTR view.
- Update `navLinks` label for `mlc` from “Task Dispatcher” to “MLC Console” (views remain the same).

## Files to Update

- `components/OperationsHub.tsx`: Introduce TTR user list, use it in Toll modal, conditional routing, optional auto-route on session user.
- `features/logistics/LogisticsDispatcherView.tsx`: Change visible title to "MLC Console".
- `services/api.ts`: Optionally update `navLinks.mlc[0].label` → "MLC Console" (keep routes).

## Validation Checklist

- Toll card opens a modal showing only MLC and Driver.
- Selecting Driver routes to `logistics-driver`; selecting MLC routes to `logistics-dispatcher`.
- Title reads “MLC Console” when on the MLC view.
- No navigation from Toll surfaces to MRF picking/picklist.
- `toll_session_user` is persisted and respected (optional auto-route works if enabled).

### To-dos

- [ ] Update Toll app configuration to use logistics-dispatcher view instead of picklist
- [ ] Add Toll-specific state variables (showTollModal, selectedTollUser) to OperationsHub
- [ ] Modify handleAppClick to detect and handle Toll app clicks
- [ ] Create handleTollModalContinue function with toll_session_user localStorage key
- [ ] Add Toll user selection modal JSX with customized subtitle