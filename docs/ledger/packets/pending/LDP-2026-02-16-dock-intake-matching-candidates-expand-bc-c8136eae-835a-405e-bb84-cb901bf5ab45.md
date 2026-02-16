# LDP-2026-02-16-dock-intake-matching-candidates-expand-bc-c8136eae-835a-405e-bb84-cb901bf5ab45

## Decision Index Rows

| decision_id | date | topic_slug | summary | source_artifact |
|---|---|---|---|---|
| DEC-2026-02-16-REC-002 | 2026-02-16 | dock-intake-matching-candidates-expand | Dock Intake matching candidates must expand to show item details (qty/vendor/description/sidemark/room) and support multi-select “Link Selected” linking. | docs/ledger/sources/LOCKED_DECISION_SOURCE_DOCK_INTAKE_MATCHING_CANDIDATES_EXPAND_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md |

## Detailed Decision Entries

### DEC-2026-02-16-REC-002
- Date: 2026-02-16
- Status: locked
- Context: users need to verify candidate matches by comparing line items inline during Dock Intake creation.
- Decision: make candidate rows expandable with an item preview (qty, vendor, description, sidemark, room) and add a “Link Selected” bulk action (while keeping per-candidate Link).
- Rationale: prevents mis-linking and avoids context-switching away from Dock Intake to inspect items.
- Source: docs/ledger/sources/LOCKED_DECISION_SOURCE_DOCK_INTAKE_MATCHING_CANDIDATES_EXPAND_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md

## Implementation Log Rows

| event_id | date | decision_id | type | summary |
|---|---|---|---|---|
| EVT-2026-02-16-REC-004 | 2026-02-16 | DEC-2026-02-16-REC-002 | ui | DockIntakeMatchingPanel: candidate rows are now collapsible and show a line-item preview (qty/vendor/description/sidemark/room) to confirm match before linking. |
| EVT-2026-02-16-REC-005 | 2026-02-16 | DEC-2026-02-16-REC-002 | ui | DockIntakeMatchingPanel: added checkboxes + “Link Selected” bulk linking to link multiple candidate shipments to one dock intake. |

