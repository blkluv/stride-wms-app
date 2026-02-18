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

- Q&A items extracted: `25`
- Existing decisions mapped: `-`
- New decisions added: `DL-2026-02-17-001, DL-2026-02-17-002, DL-2026-02-17-003, DL-2026-02-17-004, DL-2026-02-17-005, DL-2026-02-17-006, DL-2026-02-17-007, DL-2026-02-17-008, DL-2026-02-17-009, DL-2026-02-17-010, DL-2026-02-17-011, DL-2026-02-17-012, DL-2026-02-17-013, DL-2026-02-17-014, DL-2026-02-17-015, DL-2026-02-17-016, DL-2026-02-17-017, DL-2026-02-17-018, DL-2026-02-17-019, DL-2026-02-17-020, DL-2026-02-17-021, DL-2026-02-17-022, DL-2026-02-17-023, DL-2026-02-17-024, DL-2026-02-17-025, DL-2026-02-17-026, DL-2026-02-17-027, DL-2026-02-17-028, DL-2026-02-17-029, DL-2026-02-17-030`
- Unresolved/open (draft): `DL-2026-02-17-002, DL-2026-02-17-009, DL-2026-02-17-012`
- Supersedes: `-`

## Decision Index Rows

| DL-2026-02-17-001 | Admin ops UI changes require Q&A-first decision logging (no implementation until Q&A complete) | Ledger Workflow | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-001` | - | - |
| DL-2026-02-17-002 | Consolidate Stripe Ops + Pricing Ops into one admin dashboard with overview and clear navigation | SaaS Admin UI | draft | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-001` | - | - |
| DL-2026-02-17-003 | Stripe dashboard links do not require user-provided Stripe account id | SaaS Admin UI | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-002` | - | - |
| DL-2026-02-17-004 | Stripe dashboard navigation blocks in Lovable preview are environment constraints (not app bugs) | SaaS Admin UI | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-003` | - | - |
| DL-2026-02-17-005 | Do not add Lovable-preview-specific workaround or note for Stripe dashboard navigation | SaaS Admin UI | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-004` | - | - |
| DL-2026-02-17-006 | Consolidated admin ops page remains restricted to admin_dev only | SaaS Admin UI | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-005` | - | - |
| DL-2026-02-17-007 | Canonical consolidated SaaS ops route is /admin/saas-ops | SaaS Admin UI | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-006` | - | - |
| DL-2026-02-17-008 | Retire standalone Stripe Ops + Pricing Ops pages; manage via consolidated /admin/saas-ops only | SaaS Admin UI | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-007` | - | - |
| DL-2026-02-17-009 | Add Email Ops section into /admin/saas-ops with simplified non-technical UX | SaaS Admin UI | draft | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-007` | - | - |
| DL-2026-02-17-010 | Remove legacy /admin/stripe-ops and /admin/pricing-ops routes (no redirect) | SaaS Admin UI | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-007` | - | - |
| DL-2026-02-17-011 | Use Resend for tenant-branded email sending from tenant domains (DNS-based self-setup) | SaaS Email System | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-008` | - | - |
| DL-2026-02-17-012 | Add Email Ops controls for Resend domain verification status into /admin/saas-ops | SaaS Admin UI | draft | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-008` | - | - |
| DL-2026-02-17-013 | Tenant admins self-serve email sender domain setup in Settings → Organization | SaaS Email System | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-009` | - | - |
| DL-2026-02-17-014 | Add copy/paste ChatGPT prompt help tool to tailor DNS instructions for non-technical users | SaaS Email System | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-010` | - | - |
| DL-2026-02-17-015 | Help prompt is generic but instructs ChatGPT to ask provider questions and produce tailored DNS steps | SaaS Email System | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-011` | - | - |
| DL-2026-02-17-016 | Simplify tenant email sender setup UI to single-page guided steps with help tips on every field | SaaS Email System | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-012` | - | - |
| DL-2026-02-17-017 | Tenant enters full “From email address” (not just domain) for Resend sender setup | SaaS Email System | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-013` | - | - |
| DL-2026-02-17-018 | Platform default sender email is configurable in /admin/saas-ops Email section | SaaS Email System | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-014` | - | - |
| DL-2026-02-17-019 | Platform default sender does not include a configurable “From name” (email only) | SaaS Email System | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-015` | - | - |
| DL-2026-02-17-020 | Platform default sender uses tenant-configured Reply-To email address for replies | SaaS Email System | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-016` | - | - |
| DL-2026-02-17-021 | Reply-To fallback defaults to tenant owner/admin login email when Reply-To is unset | SaaS Email System | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-017` | - | - |
| DL-2026-02-17-022 | Add a separate tenant “Reply-To / inbound email” field to receive incoming replies | SaaS Email System | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-018` | - | - |
| DL-2026-02-17-023 | UI clearly explains platform-managed outbound From address when no custom sender domain is set up | SaaS Email System | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-018` | - | - |
| DL-2026-02-17-024 | Platform-managed fallback From address is per-tenant (tenantid@subdomain.stridewms.com style) | SaaS Email System | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-019` | - | - |
| DL-2026-02-17-025 | Platform-managed per-tenant fallback sender local-part uses tenant code/slug (human-friendly) | SaaS Email System | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-020` | - | - |
| DL-2026-02-17-026 | Fallback sender base domain/subdomain is not finalized yet; keep admin-configurable (no hardcoded final domain) | SaaS Email System | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-021` | - | - |
| DL-2026-02-17-027 | Admin Email Ops config stores fallback sender as domain-only; app generates tenant-slug@domain | SaaS Email System | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-022` | - | - |
| DL-2026-02-17-028 | Email Ops includes tenant status table with sortable columns, status filtering, and search autocomplete | SaaS Admin UI | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-023` | - | - |
| DL-2026-02-17-029 | Builder will define plain-language Email Ops status taxonomy and meanings for operators | SaaS Admin UI | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-024` | - | - |
| DL-2026-02-17-030 | Email Ops tenant table uses separate columns for Status and Sender Type | SaaS Admin UI | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-025` | - | - |

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

### DL-2026-02-17-007: Canonical consolidated SaaS ops route is /admin/saas-ops
- Domain: SaaS Admin UI
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-006`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
The canonical route for the consolidated SaaS admin ops dashboard will be `/admin/saas-ops`.

#### Why
It is clearer and more future-proof than `/admin/stripe-ops` or `/admin/pricing-ops`, and it matches the intent to consolidate SaaS operational controls into a single entry point.

#### Implementation impact
- Add route `/admin/saas-ops` guarded by `admin_dev`.
- Decide what to do with legacy routes `/admin/stripe-ops` and `/admin/pricing-ops` (redirect or keep as aliases) in a follow-up decision.

### DL-2026-02-17-008: Retire standalone Stripe Ops + Pricing Ops pages; manage via consolidated /admin/saas-ops only
- Domain: SaaS Admin UI
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-007`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
The standalone `/admin/stripe-ops` and `/admin/pricing-ops` pages are retired for day-to-day ops usage; Stripe and Pricing operational tooling will be managed from the consolidated `/admin/saas-ops` dashboard only.

#### Why
A single dashboard reduces navigation complexity and avoids “tabbed pages inside of tabbed pages” by centralizing SaaS operational tasks behind one entry point.

#### Implementation impact
- Remove internal navigation that encourages using `/admin/stripe-ops` or `/admin/pricing-ops`.
- Consolidated `/admin/saas-ops` must expose Stripe + Pricing sections/tabs that cover existing capabilities.
- Follow-up: determine whether legacy routes should redirect to `/admin/saas-ops` or return 404.

### DL-2026-02-17-009: Add Email Ops section into /admin/saas-ops with simplified non-technical UX
- Domain: SaaS Admin UI
- State: draft
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-007`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
Add an “Email Ops” section/tab into `/admin/saas-ops`, designed for non-technical operators, providing a simple way to understand and manage the email-related operational surfaces (status/health, logs, and key workflows) in the same consolidated dashboard.

#### Why
Email is a critical operational channel (invites, notices, and system alerts). A dedicated section improves observability and reduces support load when emails fail or configuration is incomplete.

#### Implementation impact
- Introduce Email Ops UI within `/admin/saas-ops`.
- If `/admin/email-ops` is missing, implement Email Ops in the consolidated page instead of a standalone admin page.
- Define concrete “Email Ops” scope (logs, test send, configuration visibility) via Q&A before implementation.

### DL-2026-02-17-010: Remove legacy /admin/stripe-ops and /admin/pricing-ops routes (no redirect)
- Domain: SaaS Admin UI
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-007`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
Remove the legacy `/admin/stripe-ops` and `/admin/pricing-ops` routes. The consolidated `/admin/saas-ops` dashboard will be the single route used for SaaS ops; legacy routes should not remain as redirects or aliases.

#### Why
Keeping multiple URLs for the same operational surface increases confusion and encourages continued use of legacy layouts.

#### Implementation impact
- Remove the `/admin/stripe-ops` and `/admin/pricing-ops` routes from `src/App.tsx`.
- Consolidate the existing Stripe Ops and Pricing Ops content into `/admin/saas-ops`.

### DL-2026-02-17-011: Use Resend for tenant-branded email sending from tenant domains (DNS-based self-setup)
- Domain: SaaS Email System
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-008`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
Use the platform Resend account to support tenant-branded email sending so tenants can send emails from the app using their own domains. Tenants will self-configure by updating required DNS records and filling out configuration fields in the app; emails should send from tenant domains once verified.

#### Why
Tenant-branded sending improves professionalism and deliverability, and enables customer-owned sender identities without requiring separate Resend accounts per tenant.

#### Implementation impact
- Backend: store per-tenant email domain configuration and verification status.
- Backend: add secure server-side integration to Resend Domains API to create/verify domains.
- Frontend: add tenant-facing setup UX (DNS records + status) and admin-dev oversight UX (Email Ops).
- Sending: update email-sending functions to select a tenant-specific verified From/Reply-To configuration (with safe fallback).

### DL-2026-02-17-012: Add Email Ops controls for Resend domain verification status into /admin/saas-ops
- Domain: SaaS Admin UI
- State: draft
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-008`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
Add an Email Ops section inside `/admin/saas-ops` that allows `admin_dev` users to validate Resend readiness for tenant-branded sending (domain verification status, required DNS records, and any failed/blocked states) so platform operators can quickly diagnose tenant email setup issues.

#### Why
Resend domain verification issues are a common operational blocker; centralizing status and remediation hints reduces support time and improves onboarding throughput.

#### Implementation impact
- Add Email Ops UI to `/admin/saas-ops` (admin_dev only).
- Decide the minimum actionable feature set (read-only status vs actions like refresh/resend/test) via Q&A before implementation.

### DL-2026-02-17-013: Tenant admins self-serve email sender domain setup in Settings → Organization
- Domain: SaaS Email System
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-009`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
Tenant admins will self-serve email sender domain setup within the tenant settings UI (Settings → Organization), entering a desired sender email/domain and following DNS instructions to verify the domain for sending (platform-managed Resend).

#### Why
This enables non-technical customers to complete setup without admin intervention, similar to the SMS add-on onboarding approach.

#### Implementation impact
- Ensure Settings → Organization includes a simple email sender setup flow (domain registration + DNS record list + verify status).
- Ensure actual outbound email sending respects the verified tenant sender configuration (with safe fallback if not verified).

### DL-2026-02-17-014: Add copy/paste ChatGPT prompt help tool to tailor DNS instructions for non-technical users
- Domain: SaaS Email System
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-010`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
Add an “i / Help” tool in the tenant email sender setup section that shows a copy/paste prompt the user can paste into ChatGPT (or similar) to get tailored, step-by-step DNS setup instructions in plain language (the prompt instructs the AI to ask the user questions about their domain/DNS or email provider).

#### Why
DNS steps differ by provider and are a frequent onboarding blocker; AI-guided Q&A can reduce confusion and support tickets for non-technical users.

#### Implementation impact
- UI: add a help affordance in Settings → Organization → Email Sender Configuration.
- Provide a pre-written prompt in a read-only text area with “Copy” action; no in-app LLM integration required.

### DL-2026-02-17-015: Help prompt is generic but instructs ChatGPT to ask provider questions and produce tailored DNS steps
- Domain: SaaS Email System
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-011`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
The help prompt shown in the Email Sender Configuration help tool will be generic (not auto-filled with tenant DNS record values), but it must explicitly instruct ChatGPT to ask the user clarifying questions about their domain registrar/DNS provider/email service and then produce simple, provider-tailored, step-by-step DNS instructions for verifying the sender domain.

#### Why
Keeping the prompt generic avoids copying sensitive/complex values into an external tool by default, while still enabling non-technical users to get tailored instructions based on their actual provider and situation.

#### Implementation impact
- Prompt copy must include: what the user is trying to do, what questions the AI should ask first, what the AI should output, and common pitfalls (proxying, TTL, propagation time).

### DL-2026-02-17-016: Simplify tenant email sender setup UI to single-page guided steps with help tips on every field
- Domain: SaaS Email System
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-012`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
Replace the existing multi-step email sender wizard UI with a simpler single-page, checklist-like setup flow written in layman’s terms. The flow should be extremely easy (assume a non-technical user), and every field must include a help tooltip/icon with short, clear tips.

#### Why
Email domain verification is a common onboarding blocker for non-technical users. A simplified, guided UI reduces confusion and support load.

#### Implementation impact
- Refactor `src/components/settings/preferences/EmailDomainSection.tsx` UI into a single-page guided layout:
  - Step 1: choose default sender vs custom sender
  - Step 2: enter desired From email (or domain)
  - Step 3: show DNS records to add + provider tips + copy buttons
  - Step 4: verify + show status
- Use consistent help-tip patterns (e.g., `HelpTip` / tooltips) on each input and section.

### DL-2026-02-17-017: Tenant enters full “From email address” (not just domain) for Resend sender setup
- Domain: SaaS Email System
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-013`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
When a tenant chooses to send from their own company email, the setup form will collect the full “From email address” (example: `alerts@yourcompany.com`) rather than only the domain.

#### Why
Non-technical users think in terms of the exact email address they want customers to see. Collecting the full address reduces ambiguity and aligns the setup with the final “From” identity.

#### Implementation impact
- Tenant UI should ask for the full From email and derive the domain from it for Resend domain verification.
- Sending logic should use this configured From email only when the associated domain is verified (safe fallback otherwise).

### DL-2026-02-17-018: Platform default sender email is configurable in /admin/saas-ops Email section
- Domain: SaaS Email System
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-014`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
Tenants who do not configure a custom sender domain will send from a platform default sender email address, and that default sender must be configurable by `admin_dev` within the consolidated `/admin/saas-ops` Email section (not hard-coded in the frontend or edge functions).

#### Why
The platform needs a reliable fallback sender for new/low-touch tenants, and admin-dev operators need to be able to update the default sender without code changes.

#### Implementation impact
- Add an admin-dev UI control in `/admin/saas-ops` → Email to set the platform default From email (no separate configurable From name; see `DL-2026-02-17-019`).
- Store the default sender configuration in the database (not environment variables), so it can be updated from the app.
- Update email sending functions to use:
  - tenant custom From email when verified
  - otherwise platform default From email

### DL-2026-02-17-019: Platform default sender does not include a configurable “From name” (email only)
- Domain: SaaS Email System
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-015`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
For the platform default sender settings (admin-dev configured), do not add a separate configurable “From name” field. Keep the configuration to the default sender email address only.

#### Why
This keeps the Email Ops UI simpler for non-technical operators and avoids confusion between a “company name” vs a “person name”.

#### Implementation impact
- `/admin/saas-ops` Email settings should collect only the default From email address.
- Outbound mail should format the From header using the configured email address without requiring an operator-provided display name.

### DL-2026-02-17-020: Platform default sender uses tenant-configured Reply-To email address for replies
- Domain: SaaS Email System
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-016`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
When a tenant is sending using the platform default sender (because they have not configured/verified their own sender), the email “Reply-To” should be set to the tenant’s configured Reply-To email address so customer replies go back to the tenant.

#### Why
This preserves a simple platform-managed sending setup while ensuring tenants still receive and can respond to customer email replies.

#### Implementation impact
- Add/confirm a tenant-configurable Reply-To email field in tenant settings (used regardless of whether the tenant uses a custom From sender or the platform default sender).
- Update send-email functions to set the Reply-To header to the tenant’s configured Reply-To email (with a safe fallback policy if not configured).

### DL-2026-02-17-021: Reply-To fallback defaults to tenant owner/admin login email when Reply-To is unset
- Domain: SaaS Email System
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-017`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
If a tenant has not configured a Reply-To email address yet, default the Reply-To header to the tenant owner/admin login email address.

#### Why
This avoids blocking email sending during onboarding while ensuring customer replies still route back to the tenant (not the platform).

#### Implementation impact
- Define a deterministic way to choose the tenant “owner/admin login email” for automated/system sends (e.g., primary admin user for the tenant).
- For user-initiated sends, consider using the initiating admin user email when available.

### DL-2026-02-17-022: Add a separate tenant “Reply-To / inbound email” field to receive incoming replies
- Domain: SaaS Email System
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-018`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
Tenant email settings will include a separate “Reply-To / inbound email” field so the tenant can control where incoming replies go.

#### Why
Outbound “From” identity (platform-managed or tenant-verified sender) is distinct from where replies should be delivered. A dedicated Reply-To field reduces confusion and ensures replies route correctly.

#### Implementation impact
- Add/confirm a tenant-stored Reply-To email field in the tenant settings UI.
- Use this field to set the Reply-To header on outbound emails.
- If unset, fall back per `DL-2026-02-17-021`.

### DL-2026-02-17-023: UI clearly explains platform-managed outbound From address when no custom sender domain is set up
- Domain: SaaS Email System
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-018`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
If a tenant has not set up a verified custom sender domain, the tenant-facing email settings UI must clearly state that outbound emails will be sent from a platform-managed address (example: `"tenantid"@subdomain.stridewms.com`). The UI must also clearly explain that the tenant should set their Reply-To / inbound email address to receive incoming replies.

#### Why
Non-technical users need a clear mental model:
- “From” = what customers see as the sender
- “Reply-To” = where customer replies will go

#### Implementation impact
- Update tenant email sender setup copy to explicitly show the platform-managed sender address used when the tenant has not configured a verified domain (exact domain/address may be updated later).
- Add prominent guidance that setting Reply-To is required to receive replies (with fallback behavior per `DL-2026-02-17-021`).

### DL-2026-02-17-024: Platform-managed fallback From address is per-tenant (tenantid@subdomain.stridewms.com style)
- Domain: SaaS Email System
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-019`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
If a tenant has not set up a verified custom sender domain, outbound emails should be sent from a platform-managed **per-tenant** sender address (example: `"tenantid"@subdomain.stridewms.com`) rather than a single global default sender shared by all tenants.

#### Why
Per-tenant platform-managed sender addresses reduce ambiguity for recipients and help operators/tenants recognize which tenant an outbound email is associated with.

#### Implementation impact
- Canonical identifier used in the local-part is the tenant code/slug (human-friendly) per `DL-2026-02-17-025`.
- Admin-dev Email Ops should configure the base domain/subdomain used for these platform-managed tenant senders (so it can be updated without code changes).
- Tenant UI should display the specific platform-managed From address that will be used for that tenant when they have not verified a custom domain.

### DL-2026-02-17-025: Platform-managed per-tenant fallback sender local-part uses tenant code/slug (human-friendly)
- Domain: SaaS Email System
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-020`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
For the platform-managed per-tenant fallback sender email address, the local-part identifier (the `"tenantid"` portion in examples like `"tenantid"@subdomain.stridewms.com`) will be the tenant’s human-friendly tenant code/slug (not UUID and not company name).

#### Why
Tenant code/slug is readable and stable while avoiding exposing UUIDs or relying on messy company-name sanitization.

#### Implementation impact
- Define where the tenant code/slug is stored and how it is generated/validated (must be unique).
- Ensure the code/slug is safe for email local-part usage (allowed characters, length, normalization).

### DL-2026-02-17-026: Fallback sender base domain/subdomain is not finalized yet; keep admin-configurable (no hardcoded final domain)
- Domain: SaaS Email System
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-021`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
The final app domain (and therefore the platform-managed fallback sender base domain/subdomain) has not been chosen yet because the product is still in development. We will not hardcode a final domain value into code; the base domain/subdomain used for platform-managed senders must remain admin-configurable and can be set/updated later in Email Ops.

#### Why
This avoids rework and prevents shipping assumptions about the final production domain while still letting development continue with configurable settings.

#### Implementation impact
- Add an admin-dev configurable setting for the platform-managed sender base domain/subdomain (used to build per-tenant From addresses).
- Tenant-facing UI should display whatever is currently configured, and if it is unset, show a clear “not configured yet” status rather than implying a fixed production domain.

### DL-2026-02-17-027: Admin Email Ops config stores fallback sender as domain-only; app generates tenant-slug@domain
- Domain: SaaS Email System
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-022`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
In `/admin/saas-ops` → Email Ops, the platform-managed fallback sender configuration will store the base domain/subdomain value only (example: `mail.yourapp.com`). The app will generate the full fallback From email automatically as `{tenant_slug}@<configured_domain>`.

#### Why
This keeps the operator-facing configuration simple and avoids exposing or maintaining a templating/pattern system for the From address format.

#### Implementation impact
- Admin Email Ops should store/validate a single domain/subdomain string (no pattern).
- App code should generate the fallback From email as `{tenant_slug}@<configured_domain>`.
- If the configured domain is unset, tenant-facing UI should show “not configured yet” and sending should use a safe fallback policy until configured.

### DL-2026-02-17-028: Email Ops includes tenant status table with sortable columns, status filtering, and search autocomplete
- Domain: SaaS Admin UI
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-023`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
`/admin/saas-ops` → Email Ops will include a tenant list/table that supports:
- Sorting by clicking/tapping any column header
- A Status column that supports filtering by status (e.g., show all “pending”)
- A search autocomplete dropdown/select to quickly find a tenant by typing

#### Why
Operators need fast ways to triage onboarding and email setup issues across many tenants.

#### Implementation impact
- Implement a tenant list table component with:
  - sortable columns
  - status filter UI
  - searchable tenant selector (autocomplete)
- Follow-up decision needed: define the exact set of statuses and which fields/criteria produce each status.

### DL-2026-02-17-029: Builder will define plain-language Email Ops status taxonomy and meanings for operators
- Domain: SaaS Admin UI
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-024`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
Because the operator is non-technical and does not know which email statuses matter, the builder will define an initial, plain-language status taxonomy (and the meaning/criteria for each status) for the Email Ops tenant table, focused on actionable onboarding and support triage.

#### Why
An operator-focused status system should reflect “what needs attention next” rather than internal technical states. Delegating this to the builder reduces decision burden and keeps the UI coherent.

#### Implementation impact
- Status values should be:
  - understandable in plain English
  - filterable in the admin table
  - derived from concrete fields (so they remain accurate)
- The set can be iterated later as operators use it in real workflows.

### DL-2026-02-17-030: Email Ops tenant table uses separate columns for Status and Sender Type
- Domain: SaaS Admin UI
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_ADMIN_OPS_CONSOLIDATION_2026-02-17_chat-bc-6a91388d-c030-4783-bc5f-5a493b5d7301.md#qa-2026-02-17-adminops-025`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-17
- Locked at: -

#### Decision
In the Email Ops tenant table, “Status” (health/action-needed) and “Sender Type” (custom verified vs platform-managed fallback) will be separate columns, rather than combining both concepts into a single Status label.

#### Why
This makes the table clearer for non-technical operators: one column answers “is this OK / needs attention?”, and the other answers “who does it send as?”.

#### Implementation impact
- Implement both columns and allow sorting on both.
- Status filtering should be based on the Status column only (not conflated with sender type).

## Implementation Log Rows

| DLE-2026-02-17-001 | 2026-02-17 | DL-2026-02-17-002 | planned | - | builder | Pending Q&A: finalize scope, information architecture, wording, and link behavior before UI changes. |
| DLE-2026-02-17-002 | 2026-02-17 | DL-2026-02-17-003 | planned | - | builder | Ensure consolidated ops UI uses Stripe dashboard root + stored object id links without requiring manual Stripe account id input. |
| DLE-2026-02-17-003 | 2026-02-17 | DL-2026-02-17-004 | planned | - | builder | Add operator-friendly guidance (if desired) that embedded previews may block Stripe navigation; confirm behavior works on real domain. |
| DLE-2026-02-17-004 | 2026-02-17 | DL-2026-02-17-005 | completed | - | builder | Confirmed: no Lovable-preview workaround/note will be added; focus on consolidation + usability improvements. |
| DLE-2026-02-17-005 | 2026-02-17 | DL-2026-02-17-006 | completed | - | builder | Confirmed: consolidated ops access remains admin_dev only. |
| DLE-2026-02-17-006 | 2026-02-17 | DL-2026-02-17-007 | completed | - | builder | Confirmed: canonical consolidated SaaS ops route will be `/admin/saas-ops`. |
| DLE-2026-02-17-007 | 2026-02-17 | DL-2026-02-17-008 | completed | - | builder | Confirmed: retire standalone Stripe Ops + Pricing Ops pages; consolidated dashboard is the operational entry point. |
| DLE-2026-02-17-008 | 2026-02-17 | DL-2026-02-17-009 | planned | - | builder | Determine Email Ops scope (logs/test/config visibility) before implementing Email Ops section within /admin/saas-ops. |
| DLE-2026-02-17-009 | 2026-02-17 | DL-2026-02-17-010 | completed | - | builder | Confirmed: legacy Stripe/Pricing ops routes should be removed; use /admin/saas-ops only. |
| DLE-2026-02-17-010 | 2026-02-17 | DL-2026-02-17-011 | planned | - | builder | Define DB schema + Resend Domains API integration + tenant setup UX for tenant-branded sending via DNS verification. |
| DLE-2026-02-17-011 | 2026-02-17 | DL-2026-02-17-012 | planned | - | builder | Define Email Ops UI content for Resend domain verification status (admin_dev oversight) before implementation. |
| DLE-2026-02-17-012 | 2026-02-17 | DL-2026-02-17-013 | in_progress | `src/components/settings/preferences/EmailDomainSection.tsx` | builder | Existing tenant email sender setup wizard is present; evaluate copy + field alignment and ensure sending pipeline uses verified tenant sender settings. |
| DLE-2026-02-17-013 | 2026-02-17 | DL-2026-02-17-014 | planned | - | builder | Add help tool that shows a copy/paste ChatGPT prompt tailored to the tenant’s domain + DNS records (no in-app LLM integration). |
| DLE-2026-02-17-014 | 2026-02-17 | DL-2026-02-17-015 | planned | - | builder | Write a generic-but-detailed ChatGPT prompt that instructs the AI to ask about registrar/DNS provider and produce provider-specific DNS verification steps in layman terms. |
| DLE-2026-02-17-015 | 2026-02-17 | DL-2026-02-17-016 | planned | `src/components/settings/preferences/EmailDomainSection.tsx` | builder | Refactor Email Sender Configuration to a single-page guided flow with help tips on every field and layman copy. |
| DLE-2026-02-17-016 | 2026-02-17 | DL-2026-02-17-017 | completed | - | builder | Confirmed: tenant will enter full From email address; domain will be derived for Resend verification. |
| DLE-2026-02-17-017 | 2026-02-17 | DL-2026-02-17-018 | planned | - | builder | Add admin-dev configurable platform default sender settings (DB-backed) and ensure email sending respects tenant-verified sender or platform default fallback. |
| DLE-2026-02-17-018 | 2026-02-17 | DL-2026-02-17-019 | planned | - | builder | Keep platform default sender configuration to a single From email field (no separate configurable From name). |
| DLE-2026-02-17-019 | 2026-02-17 | DL-2026-02-17-020 | planned | - | builder | Set Reply-To to the tenant-configured Reply-To email even when using the platform default sender (so replies route to the tenant). |
| DLE-2026-02-17-020 | 2026-02-17 | DL-2026-02-17-021 | planned | - | builder | Implement Reply-To fallback to tenant owner/admin login email when tenant Reply-To is not configured. |
| DLE-2026-02-17-021 | 2026-02-17 | DL-2026-02-17-022 | planned | - | builder | Add a dedicated tenant Reply-To / inbound email field in tenant settings and use it for Reply-To headers. |
| DLE-2026-02-17-022 | 2026-02-17 | DL-2026-02-17-023 | planned | - | builder | Update tenant email setup copy to clearly explain platform-managed From address when no custom sender is configured and that Reply-To controls incoming replies. |
| DLE-2026-02-17-023 | 2026-02-17 | DL-2026-02-17-024 | planned | - | builder | Implement per-tenant platform-managed fallback From address and admin-dev configuration for the base domain/subdomain. |
| DLE-2026-02-17-024 | 2026-02-17 | DL-2026-02-17-025 | planned | - | builder | Use tenant code/slug as the local-part identifier for platform-managed per-tenant fallback sender addresses. |
| DLE-2026-02-17-025 | 2026-02-17 | DL-2026-02-17-026 | planned | - | builder | Keep fallback sender base domain/subdomain admin-configurable (do not hardcode final production domain while app domain is TBD). |
| DLE-2026-02-17-026 | 2026-02-17 | DL-2026-02-17-027 | planned | - | builder | Store fallback sender config as domain-only in Email Ops; app generates `{tenant_slug}@domain` automatically. |
| DLE-2026-02-17-027 | 2026-02-17 | DL-2026-02-17-028 | planned | - | builder | Add Email Ops tenant status table with sortable columns, status filtering, and search autocomplete/selector. |
| DLE-2026-02-17-028 | 2026-02-17 | DL-2026-02-17-029 | planned | - | builder | Define initial Email Ops tenant status taxonomy + criteria in plain language for non-technical operators. |
| DLE-2026-02-17-029 | 2026-02-17 | DL-2026-02-17-030 | planned | - | builder | Separate Email Ops tenant table into “Status” and “Sender Type” columns for clarity and filterability. |
