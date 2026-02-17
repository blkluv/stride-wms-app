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

- Q&A items extracted: `5`
- Existing decisions mapped: `-`
- New decisions added: `DL-2026-02-17-001, DL-2026-02-17-002, DL-2026-02-17-003, DL-2026-02-17-004, DL-2026-02-17-005, DL-2026-02-17-006`
- Unresolved/open (draft): `DL-2026-02-17-002`
- Supersedes: `-`

## Decision Index Rows

| DL-2026-02-17-001 | Admin ops UI changes require Q&A-first decision logging (no implementation until Q&A complete) | Ledger Workflow | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-001` | - | - |
| DL-2026-02-17-002 | Consolidate Stripe Ops + Pricing Ops into one admin dashboard with overview and clear navigation | SaaS Admin UI | draft | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-001` | - | - |
| DL-2026-02-17-003 | Stripe dashboard links do not require user-provided Stripe account id | SaaS Admin UI | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-002` | - | - |
| DL-2026-02-17-004 | Stripe dashboard navigation blocks in Lovable preview are environment constraints (not app bugs) | SaaS Admin UI | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-003` | - | - |
| DL-2026-02-17-005 | Do not add Lovable-preview-specific workaround or note for Stripe dashboard navigation | SaaS Admin UI | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-004` | - | - |
| DL-2026-02-17-006 | Consolidated admin ops page remains restricted to admin_dev only | SaaS Admin UI | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-005` | - | - |

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

### DL-2026-02-17-003: Stripe dashboard links do not require user-provided Stripe account id
- Domain: SaaS Admin UI
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-002`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
The app does not require the operator to provide a Stripe "account id" to build Stripe dashboard links. The UI can link to the Stripe dashboard root (`https://dashboard.stripe.com/`) and, when available, to specific Stripe objects (customer/subscription) using the stored `stripe_customer_id` / `stripe_subscription_id`.

#### Why
Stripe authentication and account selection happens within Stripe; requiring additional account identifiers in the app would be confusing for non-technical users and is unnecessary for basic operational navigation.

#### Implementation impact
- Admin ops links can remain simple: dashboard root + object links when ids are present.
- Consolidated ops page should explain that the operator must be logged into Stripe to view these links.

### DL-2026-02-17-004: Stripe dashboard navigation blocks in Lovable preview are environment constraints (not app bugs)
- Domain: SaaS Admin UI
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-003`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
The "navigation was blocked by Cross-Origin-Opener-Policy" error for the Stripe dashboard link is attributable to the Lovable preview environment. When running the app normally (outside the embedded preview), the link works; therefore this is not an app-side Stripe link construction bug.

#### Why
Embedded preview environments may enforce browser isolation policies that affect new-window navigation to third-party domains. This is outside the app’s direct control.

#### Implementation impact
- Treat the Stripe dashboard link itself as correct (root dashboard link + object links).
- No Lovable-preview-specific workaround is required by default; focus on consolidation/usability improvements.

### DL-2026-02-17-005: Do not add Lovable-preview-specific workaround or note for Stripe dashboard navigation
- Domain: SaaS Admin UI
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-004`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
Do not implement any Lovable-preview-specific workaround or in-app warning note for the Stripe dashboard navigation block. Treat the issue as an environment constraint and prioritize the admin ops consolidation and usability redesign.

#### Why
The behavior works in normal usage (outside the embedded preview), and adding preview-specific messaging would add clutter/confusion for real operators.

#### Implementation impact
- Keep Stripe links intact and focus UI effort on consolidation, information architecture, and non-technical-friendly wording.

### DL-2026-02-17-006: Consolidated admin ops page remains restricted to admin_dev only
- Domain: SaaS Admin UI
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-005`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
The consolidated admin ops dashboard (Stripe + Pricing) will remain accessible to `admin_dev` only. We will not expand access to `tenant_admin` or other tenant roles in this redesign.

#### Why
These ops tools are internal/advanced and not intended for tenant-facing non-technical staff access.

#### Implementation impact
- Routing must keep `RequireRole role={['admin_dev']}` (or equivalent) on the consolidated route.
- Avoid adding tenant-visible navigation to these ops screens.

## Implementation Log Rows

| DLE-2026-02-17-001 | 2026-02-17 | DL-2026-02-17-002 | planned | - | builder | Pending Q&A: finalize scope, information architecture, wording, and link behavior before UI changes. |
| DLE-2026-02-17-002 | 2026-02-17 | DL-2026-02-17-003 | planned | - | builder | Ensure consolidated ops UI uses Stripe dashboard root + stored object id links without requiring manual Stripe account id input. |
| DLE-2026-02-17-003 | 2026-02-17 | DL-2026-02-17-004 | planned | - | builder | Add operator-friendly guidance (if desired) that embedded previews may block Stripe navigation; confirm behavior works on real domain. |
| DLE-2026-02-17-004 | 2026-02-17 | DL-2026-02-17-005 | completed | - | builder | Confirmed: no Lovable-preview workaround/note will be added; focus on consolidation + usability improvements. |
| DLE-2026-02-17-005 | 2026-02-17 | DL-2026-02-17-006 | completed | - | builder | Confirmed: consolidated ops access remains admin_dev only. |
