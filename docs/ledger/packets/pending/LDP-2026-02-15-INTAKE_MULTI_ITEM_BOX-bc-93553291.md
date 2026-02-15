# Locked Decision Import Packet

- Packet ID: `LDP-2026-02-15-INTAKE_MULTI_ITEM_BOX-bc-93553291`
- Topic: Intake handling for multiple items in one box
- Topic Slug: `INTAKE_MULTI_ITEM_BOX`
- Source Artifact: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md`
- Source Mode: `current_chat`
- Source Path (if file): `-`
- Created Date: `2026-02-15`
- Actor: `builder`
- Status: `pending`

## Scope Summary

- Q&A items extracted: `2` (`QA-2026-02-15-017..018`)
- Existing decisions mapped: `0`
- New decisions added: `DL-2026-02-15-024..DL-2026-02-15-027`
- Unresolved/open (draft): `-`
- Supersedes: `-`

## Decision Index Rows

| DL-2026-02-15-024 | Intake supports user choice between grouped single-line qty and expanded per-unit lines | Intake UX/Data Entry | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-017` | - | - |
| DL-2026-02-15-025 | Grouped single-line intake uses one item code with quantity N semantics | Intake Inventory Model | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-018` | - | - |
| DL-2026-02-15-026 | Container labeling for this intake flow is manual and not auto-generated | Intake Containers | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-017` | - | - |
| DL-2026-02-15-027 | System must provide split-and-relabel workflow for grouped intake records | Intake Operations | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-018` | - | - |

## Detailed Decision Entries

### DL-2026-02-15-024: Intake supports user choice between grouped single-line qty and expanded per-unit lines
- Domain: Intake UX/Data Entry
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-017`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
For one physical box containing multiple units, users can choose either grouped intake on one line (qty N, one item code) or expanded intake with one line/label per unit.

#### Why
Operators need a simple default path with flexibility for teams that prefer immediate per-unit labeling.

#### Implementation impact
- Intake UI needs explicit mode choice and clear label guidance.
- Receiving save logic must support both grouped and expanded persistence paths.

### DL-2026-02-15-025: Grouped single-line intake uses one item code with quantity N semantics
- Domain: Intake Inventory Model
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-018`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
When grouped intake is selected, the system stores one item code representing a grouped inventory unit with quantity N (Option A semantics).

#### Why
This keeps grouped intake behavior unambiguous and avoids pseudo-individual records sharing one barcode.

#### Implementation impact
- Inventory model must support grouped quantity records tied to one barcode.
- Downstream actions (move, count, ship) must interpret grouped quantity correctly.

### DL-2026-02-15-026: Container labeling for this intake flow is manual and not auto-generated
- Domain: Intake Containers
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-017`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Do not auto-generate container labels during this intake path; users may manually create/apply a container label later if needed.

#### Why
Automatic container generation in this context is confusing for users and increases intake complexity.

#### Implementation impact
- Remove/avoid auto-container side effects in grouped intake flows.
- Provide optional manual container assignment action as a separate step.

### DL-2026-02-15-027: System must provide split-and-relabel workflow for grouped intake records
- Domain: Intake Operations
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-018`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Grouped intake records must support a later split-and-relabel operation to convert grouped quantity into individually labeled unit records.

#### Why
Teams need simple intake first, while preserving an on-demand path to individual unit traceability later.

#### Implementation impact
- Add split wizard/action for grouped records.
- Generate and print new labels for resulting individual units.
- Preserve audit linkage between original grouped code and split child records.

## Implementation Log Rows

| DLE-2026-02-15-029 | 2026-02-15 | DL-2026-02-15-024 | planned | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md` | builder | Captured explicit dual-path intake mode choice for multi-item single-box receiving. |
| DLE-2026-02-15-030 | 2026-02-15 | DL-2026-02-15-025 | planned | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md` | builder | Captured grouped single-line intake semantics as one code with quantity N. |
| DLE-2026-02-15-031 | 2026-02-15 | DL-2026-02-15-026 | planned | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md` | builder | Captured manual-only container labeling rule for this intake scenario. |
| DLE-2026-02-15-032 | 2026-02-15 | DL-2026-02-15-027 | planned | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md` | builder | Captured required split-and-relabel workflow requirement for grouped records. |
