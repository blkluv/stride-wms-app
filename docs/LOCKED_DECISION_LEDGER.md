# Locked Decision Ledger

Last updated: 2026-02-18
Owner: Builders / Developers
Scope: Development artifact only (not an app feature)

## Purpose

This file is the authoritative, human-readable decision ledger for build work.
It captures high-impact implementation decisions, their status, and supersession chain.

## Non-negotiable rules

1. **Editable until locked**: A decision can be edited while in `draft` or `accepted`.
2. **Locked means immutable**: Once state is `locked`, do not edit decision content in place.
3. **Changes after lock require supersession**: Create a new decision and reference `supersedes`.
4. **Append-only implementation tracking**: Progress is logged in `docs/LOCKED_DECISION_IMPLEMENTATION_LOG.md`.
5. **Decision source required**: Each decision must reference source material (Q&A, plan doc, PDF, issue).
6. **Docs-only system**: Ledger lives in this GitHub repo under `docs/` for builders/developers.

## Decision lifecycle states

- `draft`: captured candidate, still being refined
- `accepted`: approved for implementation, still editable
- `locked`: final and immutable
- `superseded`: replaced by another decision
- `rejected`: intentionally not adopted

## Decision index

| Decision ID | Title | Domain | State | Source | Supersedes | Locked At |
|---|---|---|---|---|---|---|
| DL-2026-02-14-001 | Phase 5 v3 implementation record is authoritative for SaaS subscription automation | SaaS Subscription | locked | `uploads/Stride_SaaS_Authoritative_Implementation_Record_Phase5v3.pdf` | - | 2026-02-14 |
| DL-2026-02-14-002 | Ledger is a developer artifact in `docs/`, not an in-app feature | Governance | locked | Chat Q&A (2026-02-14) | - | 2026-02-14 |
| DL-2026-02-14-003 | Decisions are editable until locked; locked decisions are immutable | Governance | locked | Chat Q&A (2026-02-14) | - | 2026-02-14 |
| DL-2026-02-14-004 | Any post-lock change must use a new superseding decision | Governance | locked | Chat Q&A (2026-02-14) | - | 2026-02-14 |
| DL-2026-02-14-005 | Builder prompts must include phase and version labels | Governance | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-006 | Builder prompts must follow NVPC and include execution summary block | Governance | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-007 | Phase 5 is first SaaS/Stripe implementation in this codebase | SaaS Subscription | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-008 | Do not use super_admin in RLS; use current_user_is_admin_dev() | Security | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-009 | Use user_tenant_id() as tenant resolver standard | Security | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-010 | Keep routing in src/App.tsx; do not create src/routes/ | Frontend Architecture | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-011 | saas_plans is global and must not be tenant scoped | Database | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-012 | Stripe webhook is server-to-server: no CORS and no OPTIONS handler | Webhook | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-013 | Bootstrap first tenant_subscriptions row at checkout completion metadata.tenant_id | Webhook | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-014 | Checkout metadata.tenant_id is required; missing value logs and returns 200 | Webhook | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-015 | All webhook writes must be idempotent using UPSERT/SET semantics | Webhook | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-016 | Service-role-only RPCs must revoke public/authenticated and grant service_role | Security | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-017 | Gate RPC fail-open when tenant_subscriptions row is missing | Subscription Gate | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-018 | Do not modify ProtectedRoute; gate only specified routes via SubscriptionGate | Frontend Gating | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-019 | Client portal shipment creation routes are gated like internal routes | Frontend Gating | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-020 | Deployment order is merge -> migration -> webhook/env -> Stripe CLI tests | Operations | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-021 | Billing parity lock: no billing module redesign in Phase 5 | Billing | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-022 | Pricing remains DB-driven and Stripe-controlled; no hardcoded pricing logic | Billing | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-023 | Stripe is source of truth for subscription state | Subscription Lifecycle | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-024 | Enforce active access, 7-day grace on failure, then route restrictions | Subscription Lifecycle | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-025 | Never trust client tenant_id; derive via auth.uid() -> user_tenant_id() | Security | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-026 | tenant_subscriptions RLS allows tenant read isolation and no client writes | Security | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-027 | Stripe signature verification is mandatory before processing | Webhook | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-028 | Create saas_plans with specified fields, is_active index, updated_at trigger | Database | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-029 | Create tenant_subscriptions with specified fields/indexes/trigger | Database | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-030 | saas_plans RLS: authenticated SELECT active only | Security | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-031 | saas_plans write allowed only when current_user_is_admin_dev() is true | Security | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-032 | tenant_subscriptions RLS SELECT only own tenant row | Security | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-033 | rpc_get_my_subscription_gate() execute grant to authenticated only | Security | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-034 | Mutation RPCs execute grant to service_role only | Security | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-035 | Subscription status values are active, past_due, canceled, inactive | Subscription Lifecycle | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-036 | Grace calculation formula is exactly now() + interval '7 days' | Subscription Lifecycle | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-037 | rpc_get_my_subscription_gate() returns gate state with fail-open logic | Backend RPC | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-038 | rpc_initialize_tenant_subscription_from_checkout is service-role bootstrap UPSERT | Backend RPC | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-039 | rpc_upsert_tenant_subscription_from_stripe is service-role idempotent UPSERT | Backend RPC | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-040 | rpc_mark_payment_failed_and_start_grace records failure and starts grace | Backend RPC | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-041 | rpc_mark_payment_ok clears failure/grace and sets active | Backend RPC | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-042 | Webhook handles five Stripe event types and logs unknown types with 200 | Webhook | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-043 | checkout.session.completed missing tenant mapping logs and returns 200 | Webhook | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-044 | invoice.paid/payment_failed events toggle grace through service-role RPCs | Webhook | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-045 | subscription.updated/deleted resolve tenant and upsert mapped status | Webhook | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-046 | Global SubscriptionBlockedBanner sits in authenticated shell above routes | Frontend Gating | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-047 | Banner messaging rules are fixed for restricted vs grace states | Frontend Gating | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-048 | SubscriptionGate blocks specified creation routes when restricted | Frontend Gating | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-049 | useSubscriptionGate uses query key, stale time, and window-focus refetch policy | Frontend Gating | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-050 | Gated route list is exact and includes internal and client creation routes | Frontend Gating | locked | `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md` | - | 2026-02-14 |
| DL-2026-02-14-051 | Subscription enforcement scope moves to full-app restriction with payment-update redirect | SaaS Enforcement | accepted | Chat Q&A (2026-02-14) | DL-2026-02-14-018, DL-2026-02-14-019, DL-2026-02-14-048, DL-2026-02-14-050 | - |
| DL-2026-02-14-052 | Full-app redirect starts immediately at past_due (during grace) | SaaS Enforcement | accepted | Chat Q&A (2026-02-14) | DL-2026-02-14-024 | - |
| DL-2026-02-14-053 | Blocked page must auto-check subscription recovery and allow manual status refresh | SaaS UX | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-054 | Blocked-user destination route is /subscription/update-payment | SaaS UX | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-055 | Provide minimal admin_dev Stripe Ops observability page without credential editing | SaaS Ops | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-056 | Blocked-state allowlist includes auth, payment-update, logout, and help/support access | SaaS Enforcement | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-057 | Payment-state mutation RPC identity standard is stripe_subscription_id | Webhook/RPC Contract | accepted | Chat Q&A (2026-02-14) | DL-2026-02-14-040, DL-2026-02-14-041 | - |
| DL-2026-02-14-058 | subscription.updated tenant resolution must use customer_id fallback to subscription_id | Webhook Contract | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-059 | /subscription/update-payment auto-opens Stripe Customer Portal on page load | SaaS UX | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-060 | Client portal users use the same blocked destination route as internal users | SaaS Enforcement | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-061 | Payment data entry remains Stripe-hosted; app never collects raw card details | Security/Compliance | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-062 | Blocked-flow support uses external mailto contact (tenant company email when available) | SaaS UX | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-063 | Keep DL-051 through DL-062 in accepted state until post-deploy Stripe CLI validation | Release Governance | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-064 | Phase 5.1 checkout trigger lives on Billing page and uses dynamic Start/Manage label | SaaS Checkout | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-065 | Subscription offering remains single base plan with optional SMS add-on track | SaaS Pricing Model | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-066 | SMS add-on activation happens post-checkout in app Settings with form and terms acceptance | SaaS SMS Add-on | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-067 | Billing page must show consolidated subscription details including SMS add-on status | SaaS Billing UX | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-068 | SMS terms acceptance audit must capture version/time/user/ip/user-agent/source | SaaS Compliance | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-069 | Tenant admins can self-deactivate SMS add-on from Settings | SaaS SMS Add-on | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-070 | Historical SMS billing/report records remain visible as read-only after deactivation | SaaS Billing UX | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-071 | Substantive implementation Q&A must be logged append-only in docs | Governance | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-072 | SMS platform is centrally managed in Stride Twilio account with no tenant credential setup | SMS Platform Architecture | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-073 | SMS number provisioning and activation workflow must be fully automated | SMS Provisioning Automation | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-074 | Toll-free numbers are the default automated sender strategy | Messaging Compliance | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-075 | SMS remains disabled until toll-free verification is approved | Messaging Compliance | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-076 | SMS billing start trigger is verification approval timestamp | Billing Automation | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-077 | Global pricing includes app monthly plus SMS monthly and per-segment fees | Pricing | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-078 | Price-change notices send to company_email only with billing tooltip guidance | Billing UX/Notifications | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-079 | SMS usage billing includes inbound and outbound traffic | SMS Billing | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-080 | SMS usage metering uses Twilio-accurate segment counts | SMS Billing | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-081 | Subscription and SMS add-on charges are billed automatically through Stripe | Billing Automation | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-082 | Admin-dev pricing console manages live and scheduled app/SMS rates plus notice actions | Admin Ops | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-083 | Subscription invoices are surfaced in Tenant Account Settings > Billing | Billing UX | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-084 | Public SMS opt-in page is tenant-branded and resolved by subdomain | SMS Opt-In UX | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-085 | Tenant editing of SMS compliance content is locked for simplicity | SMS Governance | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-086 | Tenant-facing Twilio setup sections are removed from standard organization settings | SMS Governance | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-087 | Internal comped billing override supports multiple internal tenants | Billing Policy | accepted | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-088 | First-month SMS monthly fee proration policy remains open pending pricing research | Billing Policy | draft | `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md` | - | - |
| DL-2026-02-14-089 | SMS reactivation requires terms re-acceptance every time | SaaS Compliance | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-14-090 | Keep terms_version fixed at sms-addon-v1 for now; move configurable versioning to Phase 6 backlog | SaaS Compliance | accepted | Chat Q&A (2026-02-14) | - | - |
| DL-2026-02-15-001 | Remove Quick Add Bay and standardize Storage Locations terminology | Locations UX | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-001` | - | - |
| DL-2026-02-15-002 | Location types are limited to aisle, bay, shelf, bin, dock, area; zone deferred to separate grouping column | Locations Data Model | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-002` | - | - |
| DL-2026-02-15-003 | Location export and template downloads use .xlsx with synced column definitions | Locations Import/Export | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-001`, `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-003` | - | - |
| DL-2026-02-15-004 | Location import must preserve legacy area inference and archived/inactive status round-trip | Locations Import/Export | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-004` | - | - |
| DL-2026-02-15-005 | Locations capture dimensions and compute square/cubic totals | Locations Capacity | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-001` | - | - |
| DL-2026-02-15-006 | Location detail header must not show duplicate/inconsistent storage icons | Locations UX | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-001` | - | - |
| DL-2026-02-15-007 | Containers are movable sub-locations and container moves must cascade contained item location updates | Containers | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-001`, `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-006` | - | - |
| DL-2026-02-15-008 | Container assignment scan flow is item scan then container scan | ScanHub | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-007` | - | - |
| DL-2026-02-15-009 | Remove parent location hierarchy UI and clear existing parent_location_id data | Locations Data Model | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-011`, `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-012` | - | - |
| DL-2026-02-15-010 | Default inbound/outbound selectors use searchable combobox filtering by code and name | Locations UX | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-013` | - | - |
| DL-2026-02-15-011 | Container management belongs in location-adjacent workflow, not item detail | Containers UX | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-014` | - | - |
| DL-2026-02-15-012 | Stocktake/outbound container bulk-scan shortcuts are controlled by organization preference toggles | Containers/ScanHub | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-015` | - | - |
| DL-2026-02-15-013 | Existing locations must remain editable | Locations UX | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-016` | - | - |
| DL-2026-02-15-014 | Item location rendering for contained items is unresolved (combined string vs separate fields) | Containers Data Model | draft | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-008` | - | - |
| DL-2026-02-15-015 | Scanner identity model for containers is unresolved (location type vs separate entity) | Containers Data Model | draft | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-010` | - | - |
| DL-2026-02-15-016 | Container code default format/auto-generation details remain draft pending final approval | Containers Data Model | draft | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-010` | - | - |

| DL-2026-02-15-017 | Use packet-based chat workflow to prevent shared-ledger merge conflicts | Governance | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LEDGER_CONFLICT_PREVENTION_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-lg-001` | - | - |
| DL-2026-02-15-018 | Maintain one canonical master ledger/log; do not create separate full ledger per chat | Governance | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LEDGER_CONFLICT_PREVENTION_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-lg-002` | - | - |
| DL-2026-02-15-019 | Per-chat source artifacts must include topic slug and chat ID in standardized naming | Governance | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LEDGER_CONFLICT_PREVENTION_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-lg-003` | - | - |
| DL-2026-02-15-020 | Preserve existing decisions unchanged while migrating ledger workflow | Governance | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LEDGER_CONFLICT_PREVENTION_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-lg-003` | - | - |

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
| DL-2026-02-15-034 | Split workflow auto-prints all generated child labels immediately | Intake Label Printing | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-023` | - | - |
| DL-2026-02-15-035 | Parent-derived split child codes use simple non-padded numeric suffixes | Intake Labeling | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-024` | - | - |
| DL-2026-02-15-036 | Split child units default to parent's current location/container (warn user) | Intake Operations | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-025` | - | - |
| DL-2026-02-15-037 | Outbound partial shipping from grouped parent requires split & relabel first | Outbound Operations | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-026` | - | - |

| DL-2026-02-15-038 | Allow shipping full grouped qty without split (scan ships all N) | Outbound Operations | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-027` | - | - |
| DL-2026-02-15-039 | Partial outbound from grouped qty requires split-required workflow (client + internal) | Outbound Operations | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-028` | - | - |
| DL-2026-02-15-040 | Create split-required task + alerts immediately; client can proceed but job is blocked until split | Workflow/Tasks | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-029` | - | - |
| DL-2026-02-15-041 | Split-required work item is a high-priority Task auto-assigned to Warehouse and linked to job | Workflow/Tasks | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-030` | - | - |
| DL-2026-02-15-042 | Split-off-leftover model for partial outbound: parent qty becomes ship_qty, leftover becomes child labels | Outbound Inventory Model | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-031` | - | - |
| DL-2026-02-15-043 | Split-off-leftover outbound scanning: parent code fulfills; leftover child codes error “not this order” | Outbound Scanning | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-032` | - | - |
| DL-2026-02-15-044 | Leftover child items default to receiving location (override allowed), do not inherit container | Inventory Putaway | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-033` | - | - |
| DL-2026-02-15-045 | Split-required implementation: atomic RPC, preview exact child codes, monotonic suffixes (no reuse) | Inventory Operations | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-034` | - | - |
| DL-2026-02-15-046 | Split-required task completion requires scanning exactly N child labels; labels always reprintable | Labeling/Verification | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-035` | - | - |
| DL-2026-02-15-047 | Client portal split-required UX: prompt for notes, propagate notes to task, notify client on completion | Client Portal UX | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-036` | - | - |
| DL-2026-02-15-048 | Alert triggers/templates: split-required created vs split completed; manual-review alert type is separate | Communications/Alerts | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-037` | - | - |
| DL-2026-02-15-049 | Org toggle for client partial-from-grouped; when off, job is Pending review with manual-review alerts | Preferences/Client Portal | accepted | `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-038` | - | - |

## Detailed imports

- Phase 5 v3 detailed locked extraction:
  - `docs/LOCKED_DECISION_LEDGER_PHASE5V3_IMPORT.md`
  - Source: `/home/ubuntu/.cursor/projects/workspace/uploads/Stride_SaaS_Authoritative_Implementation_Record_Phase5v3.pdf`
- SMS/Twilio/billing Q&A trace source:
  - `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`

## Post-import working decisions

### DL-2026-02-14-051: Subscription enforcement scope moves to full-app restriction with payment-update redirect
- Domain: SaaS Enforcement
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: DL-2026-02-14-018, DL-2026-02-14-019, DL-2026-02-14-048, DL-2026-02-14-050
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
When subscription enforcement triggers, users should be routed to a subscription payment update page and blocked from normal app access until payment information is updated and access is restored.

#### Why
Business intent is to make subscription remediation the immediate path instead of route-by-route operational gating.

#### Implementation impact
- Introduces app-level restriction flow instead of limited route wrappers.
- Requires a dedicated payment-update destination route/page and allowlist behavior.
- Requires supersession plan for Phase 5 route-level gate decisions.

### DL-2026-02-14-052: Full-app redirect starts immediately at past_due (during grace)
- Domain: SaaS Enforcement
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: DL-2026-02-14-024
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Users are redirected to the subscription payment-update path immediately when status becomes `past_due` (during grace), not only after grace expires.

#### Why
Business priority is hard enforcement of billing remediation flow as soon as payment failure occurs.

#### Implementation impact
- Redefines grace as a payment-recovery window rather than an access-allowed window.
- App-level gate condition must block normal app routes for `past_due`, `canceled`, and `inactive`.
- Requires supersession-aware updates to banner/copy so in-grace users are still blocked but informed of grace deadline.

### DL-2026-02-14-053: Blocked page must auto-check subscription recovery and allow manual status refresh
- Domain: SaaS UX
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
The blocked payment-update page should automatically re-check subscription status on an interval (target ~10 seconds) and also provide a manual "Check status" action.

#### Why
Stripe recovery events are asynchronous; users need a low-friction path to regain access quickly once payment is fixed.

#### Implementation impact
- Add polling/refetch behavior to blocked flow.
- Add manual status refresh control on blocked page.
- On recovered status, immediately release app-level restriction and continue normal app navigation.

### DL-2026-02-14-054: Blocked-user destination route is /subscription/update-payment
- Domain: SaaS UX
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
The enforced payment-recovery flow uses a dedicated app route: `/subscription/update-payment`.

#### Why
A dedicated route keeps blocked-state logic isolated from normal billing/settings pages and simplifies allowlisting.

#### Implementation impact
- Add route/page for subscription payment update flow.
- Route allowlist while blocked must include `/subscription/update-payment`.
- Portal return URL should target `/subscription/update-payment`.

### DL-2026-02-14-055: Provide minimal admin_dev Stripe Ops observability page without credential editing
- Domain: SaaS Ops
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Build a dev-only (`admin_dev`) Stripe Ops page focused on observability and diagnostics, while keeping Stripe account settings, credentials, and key management outside the app.

#### Why
This gives operational visibility for troubleshooting and status checks without introducing security risk from in-app credential editing.

#### Implementation impact
- Add a restricted `admin_dev` route/page for Stripe observability.
- Include read-mostly data (subscription state lookups, webhook processing health, links to Stripe objects).
- Exclude any in-app editing of Stripe API keys or account-level credential material.

### DL-2026-02-14-056: Blocked-state allowlist includes auth, payment-update, logout, and help/support access
- Domain: SaaS Enforcement
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
While the app is globally blocked for unpaid subscription status, allowlisted access remains available for authentication, payment update flow, logout/sign-out, and help/support routes.

#### Why
Users must be able to remediate billing, recover sessions safely, and reach support without bypassing enforcement.

#### Implementation impact
- Global block middleware/guard must exempt:
  - `/auth`
  - `/subscription/update-payment`
  - logout/sign-out action route (if present)
  - help/support route(s) where available
- All other authenticated app routes are redirected to `/subscription/update-payment` during blocked states.

### DL-2026-02-14-057: Payment-state mutation RPC identity standard is stripe_subscription_id
- Domain: Webhook/RPC Contract
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: DL-2026-02-14-040, DL-2026-02-14-041
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Payment-state mutation RPCs are standardized on `stripe_subscription_id` as the identity key for failure/paid transitions.

#### Why
Stripe invoice/payment events naturally provide subscription IDs, reducing extra lookup complexity and minimizing mismatch risk.

#### Implementation impact
- Keep/refine mutation RPC signatures to accept `stripe_subscription_id`.
- Webhook invoice handlers call payment mutation RPCs using subscription ID directly.
- Documentation and gate diagnostics should reference this identity model.

### DL-2026-02-14-058: subscription.updated tenant resolution must use customer_id fallback to subscription_id
- Domain: Webhook Contract
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
For `customer.subscription.updated`, tenant resolution must first attempt `stripe_customer_id`; if unresolved, fallback to `stripe_subscription_id`.

#### Why
Customer-based mapping improves resilience when subscription IDs rotate, change timing, or are missing from expected mapping windows.

#### Implementation impact
- Update webhook resolution logic for `customer.subscription.updated` (and preferably keep parity for deleted event handling).
- Add logs that indicate which lookup path resolved the tenant.
- Ensure idempotent upsert still applies after resolution path branching.

### DL-2026-02-14-059: /subscription/update-payment auto-opens Stripe Customer Portal on page load
- Domain: SaaS UX
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
When users land on `/subscription/update-payment`, the app should automatically open Stripe Customer Portal immediately on page load.

#### Why
This minimizes remediation friction and gets blocked users into payment recovery flow without extra clicks.

#### Implementation impact
- Payment-update page should trigger portal session creation and redirect/open flow automatically.
- Include robust fallback UI for blocked popup/navigation failures (for example, retry button and support contact).
- Keep status polling/manual refresh from DL-2026-02-14-053 for post-return unlock behavior.

### DL-2026-02-14-060: Client portal users use the same blocked destination route as internal users
- Domain: SaaS Enforcement
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Client portal users (`/client/*`) should follow the same blocked destination route (`/subscription/update-payment`) and remediation flow as internal users.

#### Why
Subscription enforcement is tenant-level and should remain consistent across user surfaces.

#### Implementation impact
- Global blocked-state routing logic applies uniformly to internal and client portal routes.
- Avoid creating a separate client-only blocked flow unless later superseded.

### DL-2026-02-14-061: Payment data entry remains Stripe-hosted; app never collects raw card details
- Domain: Security/Compliance
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Users update payment details only in Stripe-hosted surfaces (Customer Portal/Checkout). The app does not capture, process, or store raw card numbers, CVC, or full PAN data.

#### Why
This reduces PCI exposure and security risk while relying on Stripe for payment data handling.

#### Implementation impact
- `/subscription/update-payment` launches Stripe-hosted payment management only.
- App stores only non-sensitive billing metadata needed for subscription state and UX (for example status, grace deadlines, Stripe IDs).
- Maintain secure webhook verification and service-role controls because operational/security risk still exists outside raw card handling.

### DL-2026-02-14-062: Blocked-flow support uses external mailto contact (tenant company email when available)
- Domain: SaaS UX
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Help/support in blocked payment flow is external: use a mailto contact link (prefer tenant company email from settings when available).

#### Why
External support avoids adding another in-app route while access is restricted and ships quickly.

#### Implementation impact
- Payment update page renders support mailto link when company email is available.
- Fallback guidance remains visible if no support email exists.

### DL-2026-02-14-063: Keep DL-051 through DL-062 in accepted state until post-deploy Stripe CLI validation
- Domain: Release Governance
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Decisions DL-2026-02-14-051 through DL-2026-02-14-062 remain `accepted` and will not be moved to `locked` until deployment and Stripe CLI validation are completed.

#### Why
Final lock should occur only after live integration behavior is verified end-to-end.

#### Implementation impact
- Keep these decisions editable in accepted state until validation evidence is captured.
- After verification, update state to locked and append corresponding verification events in the implementation log.

### DL-2026-02-14-064: Phase 5.1 checkout trigger lives on Billing page and uses dynamic Start/Manage label
- Domain: SaaS Checkout
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Expose subscription initiation/management from the Billing page with one action button that changes label by scenario:
- `Start Subscription` for new subscribers (no subscription row / status `none`)
- `Manage Subscription` for existing subscribers (renew/recovery/management flow)

#### Why
This provides a single discoverable entry point while preserving clearer user intent by state.

#### Implementation impact
- Billing page button invokes:
  - checkout session creator for new subscribers
  - customer portal session creator for existing subscribers
- Phase 5.1 checkout creator must set `metadata.tenant_id` for webhook bootstrap reliability.

### DL-2026-02-14-065: Subscription offering remains single base plan with optional SMS add-on track
- Domain: SaaS Pricing Model
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
For current rollout, keep one primary subscription plan. Support an optional SMS-related add-on as a separate option.

#### Why
This preserves a simple base subscription while allowing extensibility for message usage/automation features.

#### Implementation impact
- Checkout and plan governance should remain compatible with a single base plan + optional add-on model.
- SMS add-on automation may be delivered in a parallel implementation stream.

### DL-2026-02-14-066: SMS add-on activation happens post-checkout in app Settings with form and terms acceptance
- Domain: SaaS SMS Add-on
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Users activate SMS add-on after subscription checkout from the app Settings page, where they complete required onboarding form fields and explicitly agree to terms.

#### Why
SMS onboarding has additional compliance/setup requirements that are separate from base subscription purchase.

#### Implementation impact
- Add or extend Settings SMS activation workflow with required form + terms acceptance capture.
- Activation should not be part of initial checkout flow.
- SMS billing eligibility should be gated by successful activation state.

### DL-2026-02-14-067: Billing page must show consolidated subscription details including SMS add-on status
- Domain: SaaS Billing UX
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Billing page should present complete subscription information, including base subscription state and SMS add-on status/activation visibility.

#### Why
Users need one billing view for account standing and add-on state.

#### Implementation impact
- Extend Billing page UI with subscription summary panel.
- Include SMS add-on status fields and billing-relevant metadata in that summary.

### DL-2026-02-14-068: SMS terms acceptance audit must capture version/time/user/ip/user-agent/source
- Domain: SaaS Compliance
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
When SMS add-on terms are accepted, persist the minimum required audit fields:
`terms_version`, `accepted_at`, `accepted_by`, `ip_address`, `user_agent`, and `acceptance_source`.

#### Why
These fields are the baseline evidence needed for operational traceability and compliance review when terms or consent flows are challenged.

#### Implementation impact
- Add tenant-level SMS activation/acceptance schema and append-only acceptance log.
- Capture acceptance metadata server-side during activation to avoid client-trust gaps.
- Surface resulting activation/acceptance status in Settings and Billing summary UX.

### DL-2026-02-14-069: Tenant admins can self-deactivate SMS add-on from Settings
- Domain: SaaS SMS Add-on
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Tenant admins should be able to self-deactivate the SMS add-on directly from the in-app Settings flow.

#### Why
Self-service deactivation reduces support dependency and gives tenant admins direct control over optional add-on lifecycle changes.

#### Implementation impact
- Add a tenant-admin deactivation RPC and audit log event for self-service deactivation.
- Expose a deactivation action in Settings SMS add-on activation UI with explicit confirmation.
- Reflect `disabled` SMS add-on status in Billing summary visibility.

### DL-2026-02-14-070: Historical SMS billing/report records remain visible as read-only after deactivation
- Domain: SaaS Billing UX
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
When SMS add-on is deactivated, existing SMS billing/report records stay visible to tenant users as read-only history.

#### Why
Preserving historical records supports auditability, operational reconciliation, and user trust without allowing retroactive edits.

#### Implementation impact
- Do not delete or hide historical SMS billing/report data during self-deactivation flow.
- Billing UX should communicate that deactivated SMS history remains visible in read-only mode.

### DL-2026-02-14-071: Substantive implementation Q&A must be logged append-only in docs
- Domain: Governance
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
All substantive implementation Q&A from active build threads must be captured in an append-only docs log and linked to decision IDs.

#### Why
This prevents decision drift and ensures implementation can be traced to explicit approvals.

#### Implementation impact
- Maintain dated append-only Q&A logs in `docs/`.
- Cross-link Q&A entries and decision IDs in ledger/log artifacts.

### DL-2026-02-14-072: SMS platform is centrally managed in Stride Twilio account with no tenant credential setup
- Domain: SMS Platform Architecture
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Stride centrally manages Twilio for SMS; tenant users do not configure Twilio credentials in their own settings.

#### Why
Tenant self-setup is high-friction and error-prone; central management simplifies onboarding and support.

#### Implementation impact
- Remove tenant-facing Twilio credential setup flows from standard settings UX.
- Provide centralized internal controls for Twilio operations and compliance.

### DL-2026-02-14-073: SMS number provisioning and activation workflow must be fully automated
- Domain: SMS Provisioning Automation
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
New tenant SMS sender provisioning and activation must be automated end-to-end; manual provisioning is not acceptable.

#### Why
Manual provisioning does not scale and introduces operational delay and inconsistency.

#### Implementation impact
- Build automated provisioning workflow, status tracking, and retry/error handling.
- Tie activation state directly to send-eligibility and billing activation.

### DL-2026-02-14-074: Toll-free numbers are the default automated sender strategy
- Domain: Messaging Compliance
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Automated sender provisioning defaults to toll-free numbers, not 10DLC.

#### Why
10DLC onboarding is slower/less predictable for current rollout goals.

#### Implementation impact
- Default provisioning/verification workflow targets toll-free numbers.

### DL-2026-02-14-075: SMS remains disabled until toll-free verification is approved
- Domain: Messaging Compliance
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Tenant SMS sending must remain disabled while toll-free verification is pending or rejected.

#### Why
This reduces compliance risk and prevents pre-approval messaging behavior.

#### Implementation impact
- Gate outbound sends by verification status.
- Expose clear pending/approved/rejected status in tenant billing/settings UX.

### DL-2026-02-14-076: SMS billing start trigger is verification approval timestamp
- Domain: Billing Automation
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
SMS recurring/usage billing starts when verification transitions to approved (approval timestamp is billing start trigger).

#### Why
Charging before approved service availability causes avoidable disputes.

#### Implementation impact
- Persist approval timestamp and use it as billing activation marker.
- Suppress SMS charges while status is pending/rejected.

### DL-2026-02-14-077: Global pricing includes app monthly plus SMS monthly and per-segment fees
- Domain: Pricing
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Pricing is globally managed and includes app monthly fee, SMS monthly add-on fee, and SMS per-segment fee.

#### Why
A single pricing set reduces complexity while pricing strategy is finalized.

#### Implementation impact
- Add global effective-rate model across subscription + SMS billing components.

### DL-2026-02-14-078: Price-change notices send to company_email only with billing tooltip guidance
- Domain: Billing UX/Notifications
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Pricing-change notices are sent to `company_email` only, and UI must clarify this near the billing email field.

#### Why
This keeps communication routing simple and explicit.

#### Implementation impact
- Add billing email help tooltip and route notice dispatches to `company_email`.

### DL-2026-02-14-079: SMS usage billing includes inbound and outbound traffic
- Domain: SMS Billing
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Bill SMS usage for both inbound and outbound traffic.

#### Why
Provider/carrier costs apply in both directions.

#### Implementation impact
- Usage aggregation includes both message directions.

### DL-2026-02-14-080: SMS usage metering uses Twilio-accurate segment counts
- Domain: SMS Billing
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Usage billing is based on Twilio-accurate segment counts, not simple per-message counts.

#### Why
Segment billing aligns with actual provider economics and protects margins.

#### Implementation impact
- Store and aggregate segment counts; keep reconciliation path with Twilio usage data.

### DL-2026-02-14-081: Subscription and SMS add-on charges are billed automatically through Stripe
- Domain: Billing Automation
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
App subscription and SMS add-on charges are billed automatically in Stripe.

#### Why
Automation improves reliability and reduces manual billing operations.

#### Implementation impact
- Integrate pricing/usage outputs into Stripe billing and sync invoice results back to app UX.

### DL-2026-02-14-082: Admin-dev pricing console manages live and scheduled app/SMS rates plus notice actions
- Domain: Admin Ops
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Build admin-dev pricing controls for current rates, scheduled changes, and price notice actions.

#### Why
Pricing is still evolving and needs operational control without code deploys.

#### Implementation impact
- Add pricing schedule model with effective dates and operational notice actions.

### DL-2026-02-14-083: Subscription invoices are surfaced in Tenant Account Settings > Billing
- Domain: Billing UX
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Subscription invoices are displayed in Tenant Account Settings > Billing (not operational warehouse invoice tabs).

#### Why
SaaS billing and operational service billing are different user workflows.

#### Implementation impact
- Add subscription invoice list/summary in tenant billing settings.

### DL-2026-02-14-084: Public SMS opt-in page is tenant-branded and resolved by subdomain
- Domain: SMS Opt-In UX
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Public SMS opt-in pages are tenant-branded and resolve tenant context from subdomain.

#### Why
Subdomain resolution avoids tenant IDs in URLs and improves public clarity.

#### Implementation impact
- Add subdomain-to-tenant resolution and tenant-brand rendering on public SMS routes.

### DL-2026-02-14-085: Tenant editing of SMS compliance content is locked for simplicity
- Domain: SMS Governance
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Tenant users do not edit SMS compliance/legal content in this phase.

#### Why
Centralized control reduces compliance inconsistency during rollout.

#### Implementation impact
- Restrict/remove tenant edit controls for SMS compliance settings.

### DL-2026-02-14-086: Tenant-facing Twilio setup sections are removed from standard organization settings
- Domain: SMS Governance
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Twilio setup/verification sections are removed from standard tenant-facing organization settings in platform-managed mode.

#### Why
Tenant self-configuration conflicts with centrally managed SMS architecture.

#### Implementation impact
- Hide/remove tenant Twilio setup surfaces and route users to billing/activation status UX.

### DL-2026-02-14-087: Internal comped billing override supports multiple internal tenants
- Domain: Billing Policy
- State: accepted
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Provide a comped billing override capability that supports multiple internal tenants.

#### Why
Internal self-use/testing requires no-charge operation for more than one internal tenant account.

#### Implementation impact
- Add tenant-level comp/waiver controls, audit trail, and billing exclusion logic.

### DL-2026-02-14-088: First-month SMS monthly fee proration policy remains open pending pricing research
- Domain: Billing Policy
- State: draft
- Source: `docs/LOCKED_DECISION_QA_LOG_2026-02-14.md`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
First-month recurring SMS fee policy (prorated vs full-cycle) remains open pending final pricing research.

#### Why
Final provider economics and customer pricing policy are still under review.

#### Implementation impact
- Billing engine must support a configurable first-cycle policy before this decision is locked.

### DL-2026-02-14-089: SMS reactivation requires terms re-acceptance every time
- Domain: SaaS Compliance
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
Whenever SMS add-on is reactivated, the user must re-accept terms again (no prior acceptance carry-forward).

#### Why
Per-activation terms acceptance provides stronger consent evidence and avoids ambiguity when activation state changes over time.

#### Implementation impact
- Keep explicit terms confirmation required in Settings activation flow for each activation/reactivation.
- Record a fresh acceptance timestamp/version on every activation event.
- Document this behavior in Billing/Settings UX so admins understand reactivation requirements.

### DL-2026-02-14-090: Keep terms_version fixed at sms-addon-v1 for now; move configurable versioning to Phase 6 backlog
- Domain: SaaS Compliance
- State: accepted
- Source: Chat Q&A (2026-02-14)
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-14
- Locked at: -

#### Decision
For current rollout, keep `terms_version` fixed as `sms-addon-v1`. Add admin-dev configurable terms-version management as a planned Phase 6 follow-up.

#### Why
This keeps current delivery simple while preserving a clear tracked path for future legal/version governance improvements.

#### Implementation impact
- No immediate schema or UI change required for version configurability in current phase.
- Phase 6 backlog must include admin-dev control for terms version value changes.
- Future implementation should preserve audit continuity across version transitions.
## Chat Q&A imports (2026-02-15)

### DL-2026-02-15-001: Remove Quick Add Bay and standardize Storage Locations terminology
- Domain: Locations UX
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-001`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
The locations management UI removes the "Quick Add Bay" section and uses "Storage Locations" terminology for the location list experience.

#### Why
The existing labels and quick-add pattern were confusing and did not match operational terminology.

#### Implementation impact
- Remove quick-add bay card/controls from locations settings.
- Rename list labels/placeholders/actions from bay-specific wording to storage-location wording.

### DL-2026-02-15-002: Location types are limited to aisle, bay, shelf, bin, dock, area; zone deferred to separate grouping column
- Domain: Locations Data Model
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-002`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Active location type vocabulary is restricted to `aisle`, `bay`, `shelf`, `bin`, `dock`, and `area`. `zone` is deferred to a future, separate grouping column.

#### Why
Type semantics must be explicit and stable while keeping zone/grouping concerns separate.

#### Implementation impact
- Restrict type options for add/edit and import inference outputs.
- Normalize existing display behavior to use only approved type labels.
- Exclude `zone` and `release` from forward-looking type selection.

### DL-2026-02-15-003: Location export and template downloads use .xlsx with synced column definitions
- Domain: Locations Import/Export
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-001`, `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-003`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Location export and template download outputs are Excel (`.xlsx`) files and must use the same synchronized column-definition source as the locations list.

#### Why
A single column contract prevents drift between UI columns, export schema, and import templates.

#### Implementation impact
- Use shared location column definitions for list/table/template/export.
- Generate `.xlsx` workbook output for both export and template.

### DL-2026-02-15-004: Location import must preserve legacy area inference and archived/inactive status round-trip
- Domain: Locations Import/Export
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-004`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Location import must infer legacy area/zone-style identifiers as area-like location type and preserve archived/inactive lifecycle state during export/re-import cycles.

#### Why
Misclassification to bin and archived-to-active conversion are semantic regressions that alter operations data.

#### Implementation impact
- Expand import type inference for legacy area/zone patterns.
- Map exported archived status back to inactive/`is_active=false` on import.

### DL-2026-02-15-005: Locations capture dimensions and compute square/cubic totals
- Domain: Locations Capacity
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-001`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Locations must support entering dimensions (length/width/height) so square footage and cubic footage totals can be computed and displayed.

#### Why
Capacity totals are shown in the list and require an explicit, user-maintainable input path.

#### Implementation impact
- Add/edit forms capture dimensions.
- Calculate and persist square/cubic totals from dimensions when needed.
- Keep list columns aligned with stored totals.

### DL-2026-02-15-006: Location detail header must not show duplicate/inconsistent storage icons
- Domain: Locations UX
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-001`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Location detail header should show one consistent location-type indicator and remove duplicate/conflicting storage icon/badge rendering.

#### Why
Duplicated iconography creates ambiguity and visual inconsistency in location details.

#### Implementation impact
- Consolidate header type/icon/badge rendering to one canonical source.

### DL-2026-02-15-007: Containers are movable sub-locations and container moves must cascade contained item location updates
- Domain: Containers
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-001`, `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-006`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Containers are treated operationally as movable storage sub-locations; when a container location changes, all contained item locations must update to reflect the container's new parent location.

#### Why
Warehouse teams need bulk movement without manual per-item relocation work while preserving item-level traceability.

#### Implementation impact
- Maintain explicit container-to-parent-location linkage.
- Implement/keep atomic container move behavior that cascades item location updates.

### DL-2026-02-15-008: Container assignment scan flow is item scan then container scan
- Domain: ScanHub
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-007`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
For assigning items into containers via scanners, the operational sequence is scan item code first, then scan container code.

#### Why
This mirrors physical workflow and provides a clear move action mental model for users.

#### Implementation impact
- ScanHub state machine must support item-then-container assignment flow.
- Assignment action records container linkage and updates location context.

### DL-2026-02-15-009: Remove parent location hierarchy UI and clear existing parent_location_id data
- Domain: Locations Data Model
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-011`, `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-012`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Remove parent-location selection from location add/edit UI and clear existing `parent_location_id` values.

#### Why
Parent hierarchy is unused and creates confusion; user explicitly approved clearing existing values.

#### Implementation impact
- Remove parent-location input/control from location forms.
- Run data cleanup to null/reset existing `parent_location_id` values.

### DL-2026-02-15-010: Default inbound/outbound selectors use searchable combobox filtering by code and name
- Domain: Locations UX
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-013`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Default inbound/outbound location selectors use searchable combobox behavior: open full list on click, then filter as user types by both location code and location name.

#### Why
Large location lists require fast lookup by either known code or remembered name.

#### Implementation impact
- Replace simple select dropdowns with combobox/autocomplete controls.
- Ensure filter keys include both `code` and `name`.

### DL-2026-02-15-011: Container management belongs in location-adjacent workflow, not item detail
- Domain: Containers UX
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-014`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Container creation/management belongs in a location-adjacent workflow and should not be nested inside item-detail views.

#### Why
Containers are shared storage artifacts and should be managed where physical location operations occur.

#### Implementation impact
- Move container management entry points out of item detail context.
- Add/expand container management surface under locations workflow.

### DL-2026-02-15-012: Stocktake/outbound container bulk-scan shortcuts are controlled by organization preference toggles
- Domain: Containers/ScanHub
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-015`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Container scanning as a bulk shortcut in stocktake and outbound workflows is controlled by organization preferences.

#### Why
Tenants need operational flexibility and controlled rollout for high-impact bulk actions.

#### Implementation impact
- Add org-level toggle(s) controlling container bulk shortcut behaviors.
- Gate stocktake/outbound scan handlers behind preference checks.

### DL-2026-02-15-013: Existing locations must remain editable
- Domain: Locations UX
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-016`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Existing location records must support edit operations.

#### Why
Warehouse teams need to correct or update location metadata over time.

#### Implementation impact
- Keep/enable edit path in locations list/detail flows.
- Ensure update validation and persistence match create behavior.

### DL-2026-02-15-014: Item location rendering for contained items is unresolved (combined string vs separate fields)
- Domain: Containers Data Model
- State: draft
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-008`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Pending final confirmation: represent contained-item location either as a combined display string (for example `A1.2E (CNT-123)`) or via separate parent-location/container fields with composed display.

#### Why
Both representations were discussed, but no explicit final selection was approved.

#### Implementation impact
- Keep display/data-model decision open until explicitly confirmed.
- Avoid locking downstream schema/UI assumptions to one representation.

### DL-2026-02-15-015: Scanner identity model for containers is unresolved (location type vs separate entity)
- Domain: Containers Data Model
- State: draft
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-010`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Pending final confirmation: scanner differentiation should either treat containers as `locations.type=container` or keep containers as a separate entity recognized by scanner logic.

#### Why
The proposal requested `location type=container`, but final explicit approval of this model was not captured.

#### Implementation impact
- Keep scanner parser and data-model contracts flexible until decision is finalized.
- Do not lock migration strategy for container identity yet.

### DL-2026-02-15-016: Container code default format/auto-generation details remain draft pending final approval
- Domain: Containers Data Model
- State: draft
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-010`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Pending final confirmation: new containers should auto-generate code in a `CNT-#####` style while allowing manual override/edit.

#### Why
Auto-generated, editable container codes were proposed but not explicitly finalized in a confirmation response.

#### Implementation impact
- Keep generator/validation behavior in draft status until approval.
- Defer locking code-format policy and uniqueness constraints.

### DL-2026-02-15-017: Use packet-based chat workflow to prevent shared-ledger merge conflicts
- Domain: Governance
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LEDGER_CONFLICT_PREVENTION_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-lg-001`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Chat/feature branches must stage decision updates as packet/source artifacts instead of directly editing shared master ledger files.

#### Why
Direct concurrent edits to shared index/log sections repeatedly create PR merge conflicts.

#### Implementation impact
- Use `docs/ledger/sources/` and `docs/ledger/packets/pending/` for chat updates.
- Reserve master file edits for controlled packet-apply integration passes.

### DL-2026-02-15-018: Maintain one canonical master ledger/log; do not create separate full ledger per chat
- Domain: Governance
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LEDGER_CONFLICT_PREVENTION_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-lg-002`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
The system keeps one canonical master decision ledger/log, with per-chat source artifacts for traceability; it does not create separate full ledgers per conversation.

#### Why
Single-source master governance avoids fragmentation while retaining chat-level evidence.

#### Implementation impact
- Keep canonical files at `docs/LOCKED_DECISION_LEDGER.md` and `docs/LOCKED_DECISION_IMPLEMENTATION_LOG.md`.
- Store per-chat evidence in `docs/ledger/sources/`.

### DL-2026-02-15-019: Per-chat source artifacts must include topic slug and chat ID in standardized naming
- Domain: Governance
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LEDGER_CONFLICT_PREVENTION_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-lg-003`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Per-chat source artifacts use standardized names that include topic slug and chat ID for deterministic traceability.

#### Why
Consistent naming makes multi-chat tracking reliable and reduces ambiguity during imports.

#### Implementation impact
- Enforce source naming convention in prompt templates and registry docs.

### DL-2026-02-15-020: Preserve existing decisions unchanged while migrating ledger workflow
- Domain: Governance
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LEDGER_CONFLICT_PREVENTION_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-lg-003`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Ledger workflow migration must not remove or rewrite existing decision content.

#### Why
Historical decision integrity is a hard requirement for auditability.

#### Implementation impact
- Maintain current canonical ledger/log contents intact.
- Add migration artifacts and workflow controls around, not over, existing history.

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

### DL-2026-02-15-034: Split workflow auto-prints all generated child labels immediately
- Domain: Intake Label Printing
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-023`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Immediately after a split/relabel action succeeds, the system should auto-print all newly generated child labels.

#### Why
Automatic print at split time minimizes missed labels and keeps physical workflow synchronized with digital state.

#### Implementation impact
- Trigger print job automatically on successful split completion.
- Include retry/error UX if printer unavailable while keeping split transaction committed.
- Mark printed status in audit event metadata when available.

### DL-2026-02-15-035: Parent-derived split child codes use simple non-padded numeric suffixes
- Domain: Intake Labeling
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-024`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Use a simple non-padded numeric suffix for parent-derived split child codes (for example: `PARENT-1`, `PARENT-2`, continuing sequentially on later splits).

#### Why
Simple suffixing is easier for floor teams to read and communicate while preserving parent-child visual linkage.

#### Implementation impact
- Child-code generator must issue sequential non-padded suffixes per parent code.
- Suffix allocator must continue sequence across multiple split sessions for the same parent.
- Validation must prevent duplicate child codes when concurrent split operations occur.

### DL-2026-02-15-036: Split child units default to parent's current location/container (warn user)
- Domain: Intake Operations
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-025`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
When a grouped parent is split into new child units, those child units should default to the parent's current location/container assignment. The split UI must warn/confirm that child location will be set to the current location and instruct users to scan/move if a different location is needed.

#### Why
Defaulting to the current location keeps physical workflow predictable while still making it explicit to operators when they need to perform an immediate move/putaway update.

#### Implementation impact
- Split modal/wizard must show the current location that will be applied to children and require acknowledgement before creating labels.
- Child record creation must copy location/container references from the parent at the time of split.
- Move/scan workflows must remain available immediately after split to relocate newly labeled child units when needed.

### DL-2026-02-15-037: Outbound partial shipping from grouped parent requires split & relabel first
- Domain: Outbound Operations
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-026`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
If outbound shipping requires only part of a grouped parent’s quantity, the system must not ship/decrement that partial quantity directly from the grouped parent record. Operators must run split & relabel first so shipped units have their own item labels.

#### Why
Shipping part of a grouped record without individual labels creates ambiguity and breaks per-unit traceability in outbound workflows.

#### Implementation impact
- Outbound pick/ship flows must block partial quantity fulfillment from grouped parent records without a split step.
- Provide a guided "split for outbound" path (or an explicit prerequisite) to mint child item codes/labels for the shipped quantity.
- Ensure outbound allocation/picking references the newly created child units, not the grouped parent quantity.

### DL-2026-02-15-038: Allow shipping full grouped qty without split (scan ships all N)
- Domain: Outbound Operations
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-027`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
If outbound shipping is for the full grouped parent quantity, allow shipping the grouped parent record as-is (no split required). Scanning the parent item code once may fulfill/ship all N units, with a clear confirmation prompt indicating that qty N will ship.

#### Why
This keeps the "ship everything in the carton" case fast and simple, while maintaining clear operator confirmation when one barcode represents multiple units.

#### Implementation impact
- Outbound fulfillment UI/scanner must support "scan once ships N" confirmation for grouped items.
- Outbound quantity logic must treat grouped items differently when the job is shipping the entire grouped quantity.

### DL-2026-02-15-039: Partial outbound from grouped qty requires split-required workflow (client + internal)
- Domain: Outbound Operations
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-028`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
If ship_qty is less than grouped_qty for a grouped parent record, do not allow shipping the partial quantity directly from the grouped parent without a split workflow. This split-required workflow can be triggered by both client portal users and internal users; internal users must follow the same warehouse split-required task workflow (no bypass / no internal toggle). Invalid split requests must be blocked and require correction.

#### Why
Partial shipping from a grouped record without a controlled split causes ambiguity and breaks traceability and floor correctness.

#### Implementation impact
- Detect grouped items (qty > 1) and enforce split-required gating when ship_qty < grouped_qty.
- Enforce validation that requested split quantity is <= (grouped_qty - 1); allow split at qty=2 (split qty=1).
- Ensure internal users cannot bypass this workflow via UI edits.

### DL-2026-02-15-040: Create split-required task + alerts immediately; client can proceed but job is blocked until split
- Domain: Workflow/Tasks
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-029`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
When a client creates/saves a job that requires a split, allow the client to proceed with job creation, but create split-required alerts immediately and block staff from starting the job until the split-required task is completed. The client should see a status indicating the job is waiting for warehouse split completion.

#### Why
Client UX must allow self-service booking while ensuring warehouse correctness and preventing downstream execution until prerequisites are completed.

#### Implementation impact
- Add "split required" gating state on jobs (outbound/task) and enforce a blocking start prompt for staff.
- Client portal should display "pending warehouse split" style status.
- Trigger split-required created notifications at job creation time.

### DL-2026-02-15-041: Split-required work item is a high-priority Task auto-assigned to Warehouse and linked to job
- Domain: Workflow/Tasks
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-030`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Represent split-required work as a Task: auto-assigned to Warehouse, default high priority, and linked to the originating job for click-through. Completing the split-required task should automatically unblock the originating job. If the originating job is canceled or changed later, do not automatically reverse the split (inventory changes stand).

#### Why
This provides a trackable, assignable operational work item with clear ownership, while avoiding risky automatic rollbacks after physical work occurred.

#### Implementation impact
- Introduce a Task type/category for split-required (or equivalent Task metadata).
- Link Task to originating job and item code and propagate notes.
- Auto-unblock job on Task completion.

### DL-2026-02-15-042: Split-off-leftover model for partial outbound: parent qty becomes ship_qty, leftover becomes child labels
- Domain: Outbound Inventory Model
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-031`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
For ship_qty < grouped_qty, use a split-off-leftover model: the parent item code remains the job item code, the parent quantity is set to ship_qty, and the leftover quantity is split into new child labels. The split-required task requested split quantity is the leftover amount (grouped_qty - ship_qty). The warehouse UI must explicitly confirm that parent qty will be set to ship_qty.

#### Why
This keeps the job referencing the original carton identity while ensuring only the leftover units get new labels when removed from the carton.

#### Implementation impact
- Split RPC must:
  - compute leftover = grouped_qty - ship_qty,
  - create leftover child item records/labels,
  - set parent qty to ship_qty.
- Split UI must show and require confirmation of before/after quantities.
- Prompt staff to review notes and verify correct item assignment post-split.

### DL-2026-02-15-043: Split-off-leftover outbound scanning: parent code fulfills; leftover child codes error “not this order”
- Domain: Outbound Scanning
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-032`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
In the split-off-leftover model, outbound fulfillment is done by scanning the parent item code on the job. Any child codes not assigned to the outbound must error "not this order."

#### Why
Only the job-scoped identity should fulfill the job; leftover items removed from the carton must not be accidentally shipped on this order.

#### Implementation impact
- Enforce "only codes on this job can be scanned" rule in outbound scan flows.
- Ensure leftover child items are not considered scannable for the originating outbound.

### DL-2026-02-15-044: Leftover child items default to receiving location (override allowed), do not inherit container
- Domain: Inventory Putaway
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-033`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Leftover child items created by split-off-leftover default to the tenant default receiving location (not inherited from the parent). The warehouse can override this target location in the split flow, and location selection does not require a location barcode scan. If the parent is in a container, leftover child items do not automatically inherit that container relationship. Split-required tasks remain valid even if the parent location changed; show current location and proceed.

#### Why
Leftover items removed from a carton often require a new handling/putaway step; defaulting to receiving supports a consistent operational funnel, while allowing override for power users.

#### Implementation impact
- Resolve tenant default receiving location for the org/warehouse.
- Split UI: allow target location override (UI select/combobox).
- Ensure leftover child items are created outside the parent container relationship unless explicitly assigned later.

### DL-2026-02-15-045: Split-required implementation: atomic RPC, preview exact child codes, monotonic suffixes (no reuse)
- Domain: Inventory Operations
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-034`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Split-required execution must be atomic (single transaction/RPC). Before committing the split, show a preview list of the exact child codes that will be created. Child codes use a monotonic suffix sequence per parent and must never be reused.

#### Why
Atomicity prevents partial state (parent qty changed but children missing). Exact preview reduces operator mistakes and improves confidence before printing/applying labels.

#### Implementation impact
- Implement split-required as a backend RPC that returns the created child codes and updated parent state.
- To support "exact preview," introduce a reservation/allocator strategy that avoids concurrent collisions while keeping preview and commit consistent.
- Enforce monotonic suffix allocation per parent code.

### DL-2026-02-15-046: Split-required task completion requires scanning exactly N child labels; labels always reprintable
- Domain: Labeling/Verification
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-035`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Labels are always reprintable without re-splitting (including multiple times over item lifecycle). Do not require audit logging for reprints. To complete a split-required task, warehouse staff must scan exactly N newly created child labels after attaching them (no partial scans / no manual override). The task must be completed in one session. Scanning the child labels is sufficient for completion (parent scan optional).

#### Why
Strong verification prevents unlabeled items after a split. Reprint flexibility supports real-world printer failures and relabel needs without forcing data changes.

#### Implementation impact
- Split task UI must track child-code scan progress and enforce exact-N completion.
- Provide a reprint action on the task/split UI that prints existing child codes without creating new ones.
- Keep completion gating strict and non-bypassable.

### DL-2026-02-15-047: Client portal split-required UX: prompt for notes, propagate notes to task, notify client on completion
- Domain: Client Portal UX
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-036`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
When a client sets ship_qty < grouped_qty, the client UI should show a split-required prompt/notice and instruct the client to add detailed notes if specific units from the carton are required. Customer notes must be included both in the client-created job and in the auto-created split-required task. On split completion, notify the client via configurable alerts and branded HTML email.

#### Why
Clients often need specific units; notes are the only reliable signal. Notification on completion reduces follow-up calls and clarifies readiness.

#### Implementation impact
- Client portal: show split-required guidance copy and capture notes.
- Carry notes through to the split-required task and originating job views.
- Add completion notification trigger and templates with tenant branding.

### DL-2026-02-15-048: Alert triggers/templates: split-required created vs split completed; manual-review alert type is separate
- Domain: Communications/Alerts
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-037`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Implement separate alert triggers for (1) split-required created (notify office/warehouse) and (2) split completed (notify client). Manual review alerts are a separate type from automated split-required. Use existing branded HTML email template styles and tokenized templates for text and in-app alerts. Split-required created alerts must include parent item code, current location, requested split qty, and job reference.

#### Why
Different stakeholders need different notifications; separating triggers makes configuration clearer and reduces template complexity.

#### Implementation impact
- Extend alert trigger registry and default templates (email/text/in-app) for each alert type.
- Ensure templates support token substitution (e.g., item code, account, job id/link, location, qty).
- Use the existing branded HTML wrapper/template for consistency.

### DL-2026-02-15-049: Org toggle for client partial-from-grouped; when off, job is Pending review with manual-review alerts
- Domain: Preferences/Client Portal
- State: accepted
- Source: `docs/ledger/sources/LOCKED_DECISION_SOURCE_LOCATIONS_CONTAINERS_QA_2026-02-15_chat-bc-93553291-7523-4d63-93a4-b47dc68b42ad.md#qa-2026-02-15-038`
- Supersedes: -
- Superseded by: -
- Date created: 2026-02-15
- Locked at: -

#### Decision
Add an org preference toggle: allow client portal partial-qty requests from grouped parent items (which creates split-required tasks). If disabled, allow the client to submit but mark the job as "Pending review" and send manual-review alerts only (no Task). Staff can start the job; starting transitions the status out of Pending review. The job UI should include a magnifying-glass review icon and a highlighted review note explaining what needs review. Client UI should show a notice that the tenant team will review and ask for detailed notes.

#### Why
Some orgs may not want automated split-required flows via client portal. A manual review path maintains customer experience while protecting warehouse operations.

#### Implementation impact
- Add org preference storage and enforcement in client portal job creation.
- Implement "Pending review" status handling in both client and internal job UIs.
- Add manual-review alert trigger and templates (separate from split-required).
- Add UI affordances: review icon and highlighted review note content.

## Decision entry template (copy/paste)

```md
### <Decision ID>: <Short title>
- Domain: <Module or cross-cutting area>
- State: <draft|accepted|locked|superseded|rejected>
- Source: <links/paths to Q&A, docs, issue, PR>
- Supersedes: <Decision ID or ->
- Superseded by: <Decision ID or ->
- Date created: <YYYY-MM-DD>
- Locked at: <YYYY-MM-DD or ->

#### Decision
<single clear statement of what was decided>

#### Why
<rationale and constraints>

#### Implementation impact
<files/modules/routes/tables affected>

#### Notes
<optional>
```

## Supersession example

If `DL-2026-02-14-010` needs to change after it is locked:

1. Keep `DL-2026-02-14-010` unchanged.
2. Add `DL-2026-03-01-002` with `supersedes: DL-2026-02-14-010`.
3. Mark `DL-2026-02-14-010` state as `superseded` (metadata-only state transition).

