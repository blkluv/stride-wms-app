# LDP-2026-02-16-dock-intake-ui-cleanup-discrepancy-filtering-bc-c8136eae-835a-405e-bb84-cb901bf5ab45

## Decision Index Rows

| decision_id | date | topic_slug | summary | source_artifact |
|---|---|---|---|---|
| DEC-2026-02-16-REC-005 | 2026-02-16 | dock-intake-ui-cleanup-discrepancy-filtering | Dock Intake Stage 1 must remove the UNIDENTIFIED helper button + vendor field, rename the summary section, remove mis-ship/return-to-sender controls, and hide matching/discrepancy mismatch exception codes from the Exceptions UX. | docs/ledger/sources/LOCKED_DECISION_SOURCE_DOCK_INTAKE_UI_CLEANUP_AND_DISCREPANCY_EXCEPTION_FILTERING_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md |

## Detailed Decision Entries

### DEC-2026-02-16-REC-005
- Date: 2026-02-16
- Status: locked
- Context: Dock Intake Stage 1 included non-legacy UI elements and mixed condition exceptions with matching/discrepancy codes.
- Decision: simplify Dock Intake UI and enforce a separation between user-selected condition exceptions and system-driven matching/discrepancy flags.
- Rationale: reduces operator confusion and matches the intended workflow (operators record physical/paperwork exceptions; matching system applies discrepancy flags automatically).
- Source: docs/ledger/sources/LOCKED_DECISION_SOURCE_DOCK_INTAKE_UI_CLEANUP_AND_DISCREPANCY_EXCEPTION_FILTERING_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md

## Implementation Log Rows

| event_id | date | decision_id | type | summary |
|---|---|---|---|---|
| EVT-2026-02-16-REC-010 | 2026-02-16 | DEC-2026-02-16-REC-005 | ui | Stage1DockIntake: removed UNIDENTIFIED helper button, removed Vendor Name input, renamed section to Shipment Summary, and removed mismatch codes from exception chip selection. |
| EVT-2026-02-16-REC-011 | 2026-02-16 | DEC-2026-02-16-REC-005 | ui | ReceivingStageRouter: removed top mis-ship/return-to-sender exception action controls from the Receiving view. |
| EVT-2026-02-16-REC-012 | 2026-02-16 | DEC-2026-02-16-REC-005 | code | useShipmentExceptions: default filters out matching/discrepancy mismatch exception codes from exceptions lists and counts. |

