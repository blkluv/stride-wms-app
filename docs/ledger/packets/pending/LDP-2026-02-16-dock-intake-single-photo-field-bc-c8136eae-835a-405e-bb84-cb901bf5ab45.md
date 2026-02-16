# LDP-2026-02-16-dock-intake-single-photo-field-bc-c8136eae-835a-405e-bb84-cb901bf5ab45

## Decision Index Rows

| decision_id | date | topic_slug | summary | source_artifact |
|---|---|---|---|---|
| DEC-2026-02-16-REC-001 | 2026-02-16 | dock-intake-single-photo-field | Dock Intake Stage 1 must use a single legacy-style Photos capture/upload field (no separate Paperwork/Condition photo sections) and require >= 1 photo total. | docs/ledger/sources/LOCKED_DECISION_SOURCE_DOCK_INTAKE_SINGLE_PHOTO_FIELD_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md |

## Detailed Decision Entries

### DEC-2026-02-16-REC-001
- Date: 2026-02-16
- Status: locked
- Context: user reported Dock Intake shows two photo capture fields (Paperwork + Condition), but legacy incoming shipments uses a single consolidated photo capture/upload field.
- Decision: replace Dock Intake Stage 1 dual photo panels with the legacy single consolidated Photos section; persist photos on `shipments.receiving_photos`; require only one photos requirement (>= 1 total photo) for completion.
- Rationale: restores legacy UX parity and reduces friction/duplication during dock intake.
- Source: docs/ledger/sources/LOCKED_DECISION_SOURCE_DOCK_INTAKE_SINGLE_PHOTO_FIELD_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md

## Implementation Log Rows

| event_id | date | decision_id | type | summary |
|---|---|---|---|---|
| EVT-2026-02-16-REC-001 | 2026-02-16 | DEC-2026-02-16-REC-001 | ui | Stage1DockIntake: replaced Paperwork/Condition photo panels with a single legacy Photos section (PhotoScannerButton + PhotoUploadButton + TaggablePhotoGrid) and updated Stage 1 validation to require >= 1 photo total. |
| EVT-2026-02-16-REC-002 | 2026-02-16 | DEC-2026-02-16-REC-001 | ui | ConfirmationGuard: switched photo count summary to `shipments.receiving_photos` (single Photos count). |
| EVT-2026-02-16-REC-003 | 2026-02-16 | DEC-2026-02-16-REC-001 | code | Stage1DockIntake: added one-time bootstrap from legacy `shipment_photos` (prior Dock Intake uploads) into `shipments.receiving_photos` to avoid losing already-captured images after the UI swap. |

