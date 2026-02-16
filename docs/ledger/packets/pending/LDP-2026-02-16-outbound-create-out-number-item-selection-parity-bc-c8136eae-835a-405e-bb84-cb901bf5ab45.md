# LDP-2026-02-16-outbound-create-out-number-item-selection-parity-bc-c8136eae-835a-405e-bb84-cb901bf5ab45

## Decision Index Rows

| decision_id | date | topic_slug | summary | source_artifact |
|---|---|---|---|---|
| DEC-2026-02-16-OUT-001 | 2026-02-16 | outbound-create-out-number-item-selection-parity | Outbound create must assign OUT-##### on entry (draft shipment) and restore account-driven available item selection with inventory-like columns + multi-select. | docs/ledger/sources/LOCKED_DECISION_SOURCE_OUTBOUND_CREATE_OUT_NUMBER_AND_ITEM_SELECTION_PARITY_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md |

## Detailed Decision Entries

### DEC-2026-02-16-OUT-001
- Date: 2026-02-16
- Status: locked
- Context: Outbound create workflow was reported broken (no item selection) and did not assign an OUT# until submit.
- Decision: create a draft outbound shipment at page entry to obtain an OUT-##### number, fix shippable-item filtering to include `stored`, and display inventory-like item selection columns with multi-select.
- Rationale: outbound creation must mirror inbound creation ergonomics and ensure operators can reliably select items to ship.
- Source: docs/ledger/sources/LOCKED_DECISION_SOURCE_OUTBOUND_CREATE_OUT_NUMBER_AND_ITEM_SELECTION_PARITY_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md

## Implementation Log Rows

| event_id | date | decision_id | type | summary |
|---|---|---|---|---|
| EVT-2026-02-16-OUT-001 | 2026-02-16 | DEC-2026-02-16-OUT-001 | ui | OutboundCreate now creates a draft shipment on entry and shows the OUT# in the header. |
| EVT-2026-02-16-OUT-002 | 2026-02-16 | DEC-2026-02-16-OUT-001 | code | useAccountItems now includes `stored` items and selects location/room/class for inventory-style display. |
| EVT-2026-02-16-OUT-003 | 2026-02-16 | DEC-2026-02-16-OUT-001 | ui | Outbound item picker columns expanded (location/room/class/type/sidemark) with multi-select preserved. |

