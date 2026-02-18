# LDP-2026-02-16-will-call-outbound-shipment-bc-c8136eae-835a-405e-bb84-cb901bf5ab45

## Decision Index Rows

| Decision ID | Action | Title | State | Notes |
|---|---|---|---|---|
| DL-2026-02-16-004 | add | Will Call requests are managed as Outbound Shipments (not Tasks) | locked | Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_WILL_CALL_OUTBOUND_SHIPMENT_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md` |
| DL-2026-02-16-005 | add | Prevent re-introducing Will Call as a Task Type in task tooling | locked | Block selection + creation of Will Call task type for new tasks. |

## Detailed Decision Entries

### DL-2026-02-16-004: Will Call requests are managed as Outbound Shipments (not Tasks)
- Domain: Outbound / Will Call
- State: locked
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_WILL_CALL_OUTBOUND_SHIPMENT_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md`
- Supersedes: -
- Superseded by: -

#### Decision
Treat "Will Call" as an outbound shipment workflow in the UI (not a task workflow). Remove Will Call from task creation selectors and provide an outbound creation path in those same contexts.

#### Why
Matches the migration intent ("convert Will Call from task type to proper outbound shipment") and prevents duplicate/conflicting operational flows.

#### Implementation impact
- Remove/guard Will Call task entry points.
- Provide Outbound Shipment CTA where Will Call previously appeared.

### DL-2026-02-16-005: Prevent re-introducing Will Call as a Task Type in task tooling
- Domain: Tasks / UI Guardrails
- State: locked
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_WILL_CALL_OUTBOUND_SHIPMENT_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md`
- Supersedes: -
- Superseded by: -

#### Decision
Explicitly block "Will Call" as a selectable/new task type for creating new tasks (while allowing historical task editing to remain functional if present).

#### Why
Prevents regression where will-call operations drift back into Tasks.

#### Implementation impact
- Filter Will Call from selectable task types for new tasks.
- Block creating a custom task type named Will Call.

## Implementation Log Rows

| Event ID | Date | Decision ID | Event Type | Evidence | Actor | Notes |
|---|---|---|---|---|---|---|
| DLE-2026-02-16-004 | 2026-02-16 | DL-2026-02-16-004 | completed | `src/pages/ShipmentDetail.tsx`, `src/components/tasks/TaskDialog.tsx` | builder | Shipment Detail: removed Will Call from Task type dropdown, added Outbound CTA, and switched task creation to TaskDialog instead of navigating to `/tasks/new`. |
| DLE-2026-02-16-005 | 2026-02-16 | DL-2026-02-16-004 | completed | `src/pages/ClientTaskCreate.tsx` | builder | Client portal: removed Will Call from task request types and added Outbound Shipment CTA with redirect guard. |
| DLE-2026-02-16-006 | 2026-02-16 | DL-2026-02-16-005 | completed | `src/components/tasks/TaskDialog.tsx` | builder | TaskDialog: filtered Will Call from selectable task types for new tasks and blocked creating a new custom task type named Will Call. |
| DLE-2026-02-16-007 | 2026-02-16 | DL-2026-02-16-005 | completed | `src/hooks/useTasks.ts` | builder | Removed Will Call from default task type seeding to avoid re-introducing it on new tenants. |

