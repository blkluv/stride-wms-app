# LDP-2026-02-16-document-scanner-bw-pdf-preview-download-bc-c8136eae-835a-405e-bb84-cb901bf5ab45

## Decision Index Rows

| decision_id | date | topic_slug | summary | source_artifact |
|---|---|---|---|---|
| DEC-2026-02-16-REC-004 | 2026-02-16 | document-scanner-bw-pdf-preview-download | Document scanning/upload must: (1) save scanner output as black & white PDFs, (2) allow preview + download, and (3) keep document counts in sync after add/remove. | docs/ledger/sources/LOCKED_DECISION_SOURCE_DOCUMENT_SCANNER_BW_PDF_AND_DOCUMENT_PREVIEW_DOWNLOAD_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md |

## Detailed Decision Entries

### DEC-2026-02-16-REC-004
- Date: 2026-02-16
- Status: locked
- Context: document capture UX was incomplete/incorrect (no preview/download, stale counts) and scanner output did not match expected B/W PDF behavior.
- Decision: implement B/W PDF generation for web scanner output, interactive document preview/download from thumbnails, and ensure Dock Intake count updates after add/remove.
- Rationale: restores legacy usability and ensures operational compliance (paperwork capture must be verifiable).
- Source: docs/ledger/sources/LOCKED_DECISION_SOURCE_DOCUMENT_SCANNER_BW_PDF_AND_DOCUMENT_PREVIEW_DOWNLOAD_2026-02-16_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md

## Implementation Log Rows

| event_id | date | decision_id | type | summary |
|---|---|---|---|---|
| EVT-2026-02-16-REC-007 | 2026-02-16 | DEC-2026-02-16-REC-004 | ui | Document thumbnails are now clickable to open and provide a download action. |
| EVT-2026-02-16-REC-008 | 2026-02-16 | DEC-2026-02-16-REC-004 | ui | Dock Intake Stage 1 documents badge refreshes after document add/remove. |
| EVT-2026-02-16-REC-009 | 2026-02-16 | DEC-2026-02-16-REC-004 | code | Web scanner now generates black & white PDFs via a scan filter pipeline. |

