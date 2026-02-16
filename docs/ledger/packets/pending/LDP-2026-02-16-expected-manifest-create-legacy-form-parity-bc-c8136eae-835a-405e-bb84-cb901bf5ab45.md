# LDP-2026-02-16-expected-manifest-create-legacy-form-parity-bc-c8136eae-835a-405e-bb84-cb901bf5ab45

## Decision Index Rows

| decision_id | date | topic_slug | summary | source_artifact |
|---|---|---|---|---|
| DEC-2026-02-16-REC-007 | 2026-02-16 | expected-manifest-create-legacy-form-parity | Incoming Expected/Manifest creation must use the legacy-style full create form (item entry + duplicate controls) and apply account default shipment notes; redirect back into Incoming detail views after creation. | docs/ledger/sources/LOCKED_DECISION_SOURCE_EXPECTED_MANIFEST_CREATE_LEGACY_FORM_PARITY_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md |

## Detailed Decision Entries

### DEC-2026-02-16-REC-007
- Date: 2026-02-16
- Status: locked
- Context: Incoming create flows did not match the legacy expected-shipment create UX; critical features (default notes, duplicate item entry) were not present in the Incoming create path.
- Decision: route Incoming create actions to the full legacy create form and ensure inbound kind + redirect behavior aligns with the receiving system.
- Rationale: restores the planned operator workflow and avoids regressions from replacing the legacy create experience with a quick-create dialog.
- Source: docs/ledger/sources/LOCKED_DECISION_SOURCE_EXPECTED_MANIFEST_CREATE_LEGACY_FORM_PARITY_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md

## Implementation Log Rows

| event_id | date | decision_id | type | summary |
|---|---|---|---|---|
| EVT-2026-02-16-REC-014 | 2026-02-16 | DEC-2026-02-16-REC-007 | ui | IncomingContent: “New Expected Shipment”/“New Manifest” now navigate to dedicated create routes using the legacy form. |
| EVT-2026-02-16-REC-015 | 2026-02-16 | DEC-2026-02-16-REC-007 | code | ShipmentCreate: supports expected vs manifest inbound_kind, prefills notes from account defaults, and redirects to Incoming detail pages when created from /incoming/*. |
| EVT-2026-02-16-REC-016 | 2026-02-16 | DEC-2026-02-16-REC-007 | routing | App: added /incoming/expected/new + /incoming/manifest/new routes. |

