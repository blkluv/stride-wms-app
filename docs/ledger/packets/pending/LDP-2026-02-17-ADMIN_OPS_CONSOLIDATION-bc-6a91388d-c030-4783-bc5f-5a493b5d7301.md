# Locked Decision Import Packet

- Packet ID: `LDP-2026-02-17-ADMIN_OPS_CONSOLIDATION-bc-6a91388d-c030-4783-bc5f-5a493b5d7301`
- Topic: Consolidate Admin Ops pages (Stripe + Pricing)
- Topic Slug: `ADMIN_OPS_CONSOLIDATION`
- Source Artifact: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md`
- Source Mode: `current_chat`
- Source Path (if file): `-`
- Created Date: `2026-02-17`
- Actor: `builder`
- Status: `pending`

## Scope Summary

- Q&A items extracted: `1`
- Existing decisions mapped: `-`
- New decisions added: `DL-2026-02-17-001, DL-2026-02-17-002`
- Unresolved/open (draft): `DL-2026-02-17-002`
- Supersedes: `-`

## Decision Index Rows

| DL-2026-02-17-001 | Admin ops UI changes require Q&A-first decision logging (no implementation until Q&A complete) | Ledger Workflow | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-001` | - | - |
| DL-2026-02-17-002 | Consolidate Stripe Ops + Pricing Ops into one admin dashboard with overview and clear navigation | SaaS Admin UI | draft | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-001` | - | - |

## Detailed Decision Entries

### DL-2026-02-17-001: Admin ops UI changes require Q&A-first decision logging (no implementation until Q&A complete)
- Domain: Ledger Workflow
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-001`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
For the admin ops UI consolidation work in this chat, we will proceed via Q&A one question at a time, logging decisions into the packet-based ledger workflow, and only then implement the consolidated UI according to the accepted decisions.

#### Why
This reduces missed requirements and prevents rework, while keeping an auditable record of intent and scope.

#### Implementation impact
- Use packet-based ledger artifacts for each decision.
- Avoid any code/UI changes until Q&A decisions are captured.

### DL-2026-02-17-002: Consolidate Stripe Ops + Pricing Ops into one admin dashboard with overview and clear navigation
- Domain: SaaS Admin UI
- State: draft
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-001`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
Replace separate `/admin/stripe-ops` and `/admin/pricing-ops` pages with a single consolidated admin dashboard that includes an overview and clear navigation to Stripe and pricing management sections, avoiding nested tab structures and presenting non-technical-friendly labels and explanations.

#### Why
The current ops pages are developer-oriented and harder to navigate for non-technical operators; consolidation improves discoverability, reduces context switching, and lowers the risk of operational mistakes.

#### Implementation impact
- Likely introduce a new route (or consolidate under one existing route) and reorganize UI layout.
- Update navigation links and possibly keep old routes as redirects.
- Fix the Stripe dashboard link/button behavior that is currently producing an error for users.

## Implementation Log Rows

| DLE-2026-02-17-001 | 2026-02-17 | DL-2026-02-17-002 | planned | - | builder | Pending Q&A: finalize scope, information architecture, wording, and link behavior before UI changes. |
