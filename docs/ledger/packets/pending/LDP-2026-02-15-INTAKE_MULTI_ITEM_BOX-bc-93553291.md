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

- Q&A items extracted: `6` (`QA-2026-02-15-017..022`)
- Existing decisions mapped: `0`
- New decisions added: `DL-2026-02-15-024..DL-2026-02-15-033`
- Unresolved/open (draft): `-`
- Supersedes: `-`

## Decision Index Rows

| DL-2026-02-15-024 | Intake supports user choice between grouped single-line qty and expanded per-unit lines | Intake UX/Data Entry | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-017` | - | - |
| DL-2026-02-15-025 | Grouped single-line intake uses one item code with quantity N semantics | Intake Inventory Model | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-018` | - | - |
| DL-2026-02-15-026 | Container labeling for this intake flow is manual and not auto-generated | Intake Containers | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-017` | - | - |
| DL-2026-02-15-027 | System must provide split-and-relabel workflow for grouped intake records | Intake Operations | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-018` | - | - |
| DL-2026-02-15-028 | Split/relabel uses partial split model retaining grouped parent for remaining quantity | Intake Operations | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-019` | - | - |
| DL-2026-02-15-029 | Split/relabel allows repeatable partial splits from 1..remaining quantity | Intake Operations | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-020` | - | - |
| DL-2026-02-15-030 | Split child labels use parent-derived code format for traceability | Intake Labeling | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-021` | - | - |
| DL-2026-02-15-031 | Parent grouped record lifecycle uses archive/inactive, never hard delete | Intake Lifecycle | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-022` | - | - |
| DL-2026-02-15-032 | Split operation must preserve at least one unit on original parent code | Intake Operations | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-022` | - | - |
| DL-2026-02-15-033 | Every split/relabel action must be recorded in activity/history audit trail | Audit/Traceability | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-022` | - | - |

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

### DL-2026-02-15-028: Split/relabel uses partial split model retaining grouped parent for remaining quantity
- Domain: Intake Operations
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-019`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Split/relabel must follow partial split behavior (Option B): preserve the original grouped code for any remaining quantity and mint new individual codes only for the split-out quantity.

#### Why
This preserves continuity on the original record while enabling incremental conversion to individual tracking as needed.

#### Implementation impact
- Split UI must allow selecting split quantity less than or equal to remaining grouped quantity.
- Parent grouped record quantity decreases by split quantity and remains active when remainder exists.
- Child split records receive new labels/codes and maintain parent linkage for audit traceability.

### DL-2026-02-15-029: Split/relabel allows repeatable partial splits from 1..remaining quantity
- Domain: Intake Operations
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-020`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Users may split any quantity between 1 and current remaining grouped quantity, and may repeat this process multiple times.

#### Why
Operational workflows often require staged breakdown of grouped cartons instead of one-time full decomposition.

#### Implementation impact
- Split modal must validate `1 <= split_qty <= remaining_qty`.
- Keep split action available while grouped remainder is greater than zero.
- Maintain cumulative split history for audit and reconciliation.

### DL-2026-02-15-030: Split child labels use parent-derived code format for traceability
- Domain: Intake Labeling
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-021`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
When grouped records are split, generated child item codes should follow a parent-derived format (for example parent-code suffixing) to preserve immediate visual linkage.

#### Why
Parent-derived labels improve floor usability and audit readability during staged decomposition workflows.

#### Implementation impact
- Define deterministic child-code pattern and collision-safe suffixing rules.
- Preserve both parent reference field and visible code linkage.
- Update label-printing templates to render parent-derived child codes.

### DL-2026-02-15-031: Parent grouped record lifecycle uses archive/inactive, never hard delete
- Domain: Intake Lifecycle
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-022`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
If parent grouped records reach zero-state lifecycle, they must be archived/inactivated for history retention and never hard deleted.

#### Why
Audit continuity requires parent record preservation even when no longer operationally active.

#### Implementation impact
- Use soft-status transitions (`inactive`/archived) instead of destructive deletes.
- Keep parent-child lineage visible in historical views.

### DL-2026-02-15-032: Split operation must preserve at least one unit on original parent code
- Domain: Intake Operations
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-022`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Split/relabel action must not allow splitting the final remaining parent unit; at least one unit always remains attached to the original parent code.

#### Why
The original parent code must persist as anchor identity for grouped lineage.

#### Implementation impact
- Enforce validation: `split_qty <= remaining_qty - 1`.
- Disable/guard split action when remaining quantity is 1.

### DL-2026-02-15-033: Every split/relabel action must be recorded in activity/history audit trail
- Domain: Audit/Traceability
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-022`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
All split/relabel operations must produce immutable activity/history audit records.

#### Why
Split history is operationally sensitive and must remain reconstructable for investigations and reconciliation.

#### Implementation impact
- Log actor, timestamp, parent code, split quantity, child codes, before/after quantities.
- Surface split events in item/container/location history timelines.

## Implementation Log Rows

| DLE-2026-02-15-029 | 2026-02-15 | DL-2026-02-15-024 | planned | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md` | builder | Captured explicit dual-path intake mode choice for multi-item single-box receiving. |
| DLE-2026-02-15-030 | 2026-02-15 | DL-2026-02-15-025 | planned | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md` | builder | Captured grouped single-line intake semantics as one code with quantity N. |
| DLE-2026-02-15-031 | 2026-02-15 | DL-2026-02-15-026 | planned | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md` | builder | Captured manual-only container labeling rule for this intake scenario. |
| DLE-2026-02-15-032 | 2026-02-15 | DL-2026-02-15-027 | planned | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md` | builder | Captured required split-and-relabel workflow requirement for grouped records. |
| DLE-2026-02-15-033 | 2026-02-15 | DL-2026-02-15-028 | planned | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md` | builder | Captured partial split model decision retaining parent grouped code for remaining quantity. |
| DLE-2026-02-15-034 | 2026-02-15 | DL-2026-02-15-029 | planned | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md` | builder | Captured repeatable partial split allowance (1..remaining qty). |
| DLE-2026-02-15-035 | 2026-02-15 | DL-2026-02-15-030 | planned | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md` | builder | Captured parent-derived split child-code format requirement for label traceability. |
| DLE-2026-02-15-036 | 2026-02-15 | DL-2026-02-15-031 | planned | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md` | builder | Captured archive-not-delete lifecycle policy for parent grouped records. |
| DLE-2026-02-15-037 | 2026-02-15 | DL-2026-02-15-032 | planned | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md` | builder | Captured rule that split cannot consume final remaining parent unit. |
| DLE-2026-02-15-038 | 2026-02-15 | DL-2026-02-15-033 | planned | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md` | builder | Captured mandatory split activity/history audit logging requirement. |
