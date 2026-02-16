# LDP-2026-02-16-dock-intake-carrier-tracking-reference-fields-bc-c8136eae-835a-405e-bb84-cb901bf5ab45

## Decision Index Rows

| decision_id | date | topic_slug | summary | source_artifact |
|---|---|---|---|---|
| DEC-2026-02-16-REC-003 | 2026-02-16 | dock-intake-carrier-tracking-reference-fields | Dock Intake Stage 1 must provide carrier, tracking, and reference/PO fields (autosaved on the shipment). | docs/ledger/sources/LOCKED_DECISION_SOURCE_DOCK_INTAKE_CARRIER_TRACKING_REFERENCE_FIELDS_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md |

## Detailed Decision Entries

### DEC-2026-02-16-REC-003
- Date: 2026-02-16
- Status: locked
- Context: Dock Intake Stage 1 lacked key shipping-identification fields needed during receiving.
- Decision: add Carrier Name, Tracking #, and Reference/PO # inputs to Dock Intake Stage 1 and autosave to the shipment record.
- Rationale: restores operational parity with legacy receiving flows and supports downstream search/matching.
- Source: docs/ledger/sources/LOCKED_DECISION_SOURCE_DOCK_INTAKE_CARRIER_TRACKING_REFERENCE_FIELDS_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md

## Implementation Log Rows

| event_id | date | decision_id | type | summary |
|---|---|---|---|---|
| EVT-2026-02-16-REC-006 | 2026-02-16 | DEC-2026-02-16-REC-003 | ui | Stage1DockIntake: added Carrier Name, Tracking #, and Reference/PO # inputs (autosave). |

