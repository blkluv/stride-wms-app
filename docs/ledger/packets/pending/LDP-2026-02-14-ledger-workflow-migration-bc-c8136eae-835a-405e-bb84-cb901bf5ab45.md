# LDP-2026-02-14-ledger-workflow-migration-bc-c8136eae-835a-405e-bb84-cb901bf5ab45

## Decision Index Rows

| Decision ID | Action | Title | State | Notes |
|---|---|---|---|---|
| DL-2026-02-14-901 | add | Use packet workflow artifacts for decision updates | locked | Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LEDGER_WORKFLOW_MIGRATION_2026-02-14_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md` |
| DL-2026-02-14-902 | add | Legacy locked master ledger/log files are read-only (no direct edits) | locked | Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LEDGER_WORKFLOW_MIGRATION_2026-02-14_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md` |
| DL-2026-02-14-903 | add | Run `ledger:apply-packets:dry-run` before applying packets | locked | Validation gate for packet structure. |

## Detailed Decision Entries

### DL-2026-02-14-901
- Domain: Ledger Workflow
- State: locked
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LEDGER_WORKFLOW_MIGRATION_2026-02-14_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md`
- Supersedes: -
- Superseded by: -

#### Decision
This chat must capture decision deltas using packet workflow artifacts:
- `docs/ledger/sources/*`
- `docs/ledger/packets/pending/*`

#### Why
Avoid conflicts on shared master decision/log files.

#### Implementation impact
Only add/update source artifacts and pending packets; do not directly edit locked master files.

### DL-2026-02-14-902
- Domain: Ledger Workflow
- State: locked
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LEDGER_WORKFLOW_MIGRATION_2026-02-14_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md`
- Supersedes: -
- Superseded by: -

#### Decision
Do not directly edit:
- `docs/LOCKED_DECISION_LEDGER.md`
- `docs/LOCKED_DECISION_IMPLEMENTATION_LOG.md`

#### Why
Keep legacy locked master files immutable during migration to conflict-safe packet workflow.

#### Implementation impact
Any changes must be represented as packets and applied via tooling.

### DL-2026-02-14-903
- Domain: Ledger Workflow
- State: locked
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LEDGER_WORKFLOW_MIGRATION_2026-02-14_chat-bc-c8136eae-835a-405e-bb84-cb901bf5ab45.md`
- Supersedes: -
- Superseded by: -

#### Decision
Run `npm run ledger:apply-packets:dry-run` before applying packets.

#### Why
Parse/shape validation gate for packet content.

#### Implementation impact
Dry-run must pass before any packet-apply workflow.

## Implementation Log Rows

| Event ID | Date | Decision ID | Event Type | Evidence | Actor | Notes |
|---|---|---|---|---|---|---|
| DLE-2026-02-14-901 | 2026-02-14 | DL-2026-02-14-901 | completed | `docs/ledger/README.md` | builder | Established packet workflow usage for this chat. |
| DLE-2026-02-14-902 | 2026-02-14 | DL-2026-02-14-902 | completed | `docs/ledger/MASTER_LEDGER.md` | builder | Preserved legacy master files as read-only; moved updates to packet artifacts. |
| DLE-2026-02-14-903 | 2026-02-14 | DL-2026-02-14-903 | completed | `scripts/ledger/apply-packets.mjs` | builder | Validated pending packet structure via dry-run gate. |
