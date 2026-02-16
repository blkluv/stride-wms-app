# LDP-2026-02-16-dock-intake-default-shipment-notes-prefill-bc-c8136eae-835a-405e-bb84-cb901bf5ab45

## Decision Index Rows

| decision_id | date | topic_slug | summary | source_artifact |
|---|---|---|---|---|
| DEC-2026-02-16-REC-006 | 2026-02-16 | dock-intake-default-shipment-notes-prefill | Dock Intake Stage 1 must prefill shipment notes from the selected account’s default_shipment_notes (legacy parity), without overwriting user-edited notes. | docs/ledger/sources/LOCKED_DECISION_SOURCE_DOCK_INTAKE_DEFAULT_SHIPMENT_NOTES_PREFILL_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md |

## Detailed Decision Entries

### DEC-2026-02-16-REC-006
- Date: 2026-02-16
- Status: locked
- Context: operators rely on account-level default shipment notes; Dock Intake Stage 1 did not apply them.
- Decision: fetch + prefill from `accounts.default_shipment_notes` on account selection, and show highlight callout when configured.
- Rationale: restores legacy behavior and reduces missed SOP notes during intake.
- Source: docs/ledger/sources/LOCKED_DECISION_SOURCE_DOCK_INTAKE_DEFAULT_SHIPMENT_NOTES_PREFILL_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md

## Implementation Log Rows

| event_id | date | decision_id | type | summary |
|---|---|---|---|---|
| EVT-2026-02-16-REC-013 | 2026-02-16 | DEC-2026-02-16-REC-006 | ui | Stage1DockIntake: fetch account default_shipment_notes + highlight flag and prefill shipment notes if blank/unmodified. |

