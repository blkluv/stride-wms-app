# LDP-2026-02-16-will-call-outbound-shipment-bc-c8136eae-835a-405e-bb84-cb901bf5ab45

## Decision Index Rows

| decision_id | date | topic_slug | summary | source_artifact |
|---|---|---|---|---|
| DEC-2026-02-16-OUT-001 | 2026-02-16 | will-call-outbound-shipment | Will Call requests must be created/managed as Outbound Shipments; remove Will Call from Task creation UI entry points. | docs/ledger/sources/LOCKED_DECISION_SOURCE_WILL_CALL_OUTBOUND_SHIPMENT_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md |
| DEC-2026-02-16-OUT-002 | 2026-02-16 | will-call-outbound-shipment | Prevent re-introducing "Will Call" as a Task Type through Task UI tooling (preselect/custom task type guards). | docs/ledger/sources/LOCKED_DECISION_SOURCE_WILL_CALL_OUTBOUND_SHIPMENT_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md |

## Detailed Decision Entries

### DEC-2026-02-16-OUT-001
- Date: 2026-02-16
- Status: locked
- Context: user requested moving Will Call from Tasks into Outbound Shipments.
- Decision: treat Will Call as an outbound shipment workflow in the UI (not a task workflow); remove Will Call from task creation selectors and provide an outbound creation path in those same contexts.
- Rationale: matches the DB migration intent ("Converts will call from task type to proper outbound shipment") and avoids duplicate/conflicting operational flows.
- Source: docs/ledger/sources/LOCKED_DECISION_SOURCE_WILL_CALL_OUTBOUND_SHIPMENT_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md

### DEC-2026-02-16-OUT-002
- Date: 2026-02-16
- Status: locked
- Context: TaskDialog allows selecting task types and creating new task types.
- Decision: explicitly block "Will Call" as a selectable/new task type for creating new tasks (while allowing historical task editing to remain functional if present).
- Rationale: prevents regression where will-call operations drift back into Tasks.
- Source: docs/ledger/sources/LOCKED_DECISION_SOURCE_WILL_CALL_OUTBOUND_SHIPMENT_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md

## Implementation Log Rows

| event_id | date | decision_id | type | summary |
|---|---|---|---|---|
| EVT-2026-02-16-OUT-001 | 2026-02-16 | DEC-2026-02-16-OUT-001 | ui | Shipment Detail: removed "Will Call" from Task type dropdown, added "Outbound" CTA, and switched task creation to use TaskDialog instead of navigating to a non-existent `/tasks/new` route. |
| EVT-2026-02-16-OUT-002 | 2026-02-16 | DEC-2026-02-16-OUT-001 | ui | Client portal: removed "Will Call" from task request types and added an Outbound Shipment CTA (with redirect guard if Will Call is attempted). |
| EVT-2026-02-16-OUT-003 | 2026-02-16 | DEC-2026-02-16-OUT-002 | ui | TaskDialog: filtered "Will Call" from selectable task types for new tasks and blocked creating a new custom task type named "Will Call". |
| EVT-2026-02-16-OUT-004 | 2026-02-16 | DEC-2026-02-16-OUT-002 | code | Removed "Will Call" from default task type seeding (`useTaskTypes`) to avoid re-introducing it on new tenants. |

