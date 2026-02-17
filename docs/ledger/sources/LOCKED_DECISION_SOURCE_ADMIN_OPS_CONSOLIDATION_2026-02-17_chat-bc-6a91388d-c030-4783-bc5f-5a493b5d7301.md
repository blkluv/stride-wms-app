# Locked Decision Source Artifact

- Topic: Consolidate Admin Ops pages (Stripe Ops + Pricing Ops)
- Topic Slug: `ADMIN_OPS_CONSOLIDATION`
- Date: `2026-02-17`
- Chat ID: `bc-6a91388d-c030-4783-bc5f-5a493b5d7301`
- Source Mode: `current_chat`

## Q&A excerpts

### QA-2026-02-17-ADMINOPS-001
User request:
- Consolidate `/admin/stripe-ops` and `/admin/pricing-ops` into one page.
- Make fields/data easier for non-technical users to understand and use.
- Improve layout/navigation; remove “tabbed pages inside of tabbed pages”.
- Prefer one main dashboard page (overview) with multiple tabs/sections.
- Fix Stripe dashboard button behavior: currently shows an error when opening the new page.
- Process requirement: before implementing any changes, ask questions one at a time and log decisions during Q&A; implement only after Q&A is complete.

### QA-2026-02-17-ADMINOPS-002
User clarification:
- The failing button is the "Stripe dashboard" button.
- Error shown: "navigation was blocked by Cross-Origin-Opener-Policy".
- User question: whether they need to provide a Stripe account id to build a Stripe dashboard link.

### QA-2026-02-17-ADMINOPS-003
User clarification:
- The COOP navigation block occurs only when running inside a Lovable preview page.
- When opening the app outside that preview context (normal browser tab on the real domain), the Stripe dashboard link works.

### QA-2026-02-17-ADMINOPS-004
User decision:
- Leave Stripe dashboard links as-is (no special Lovable preview workaround/note).
- Focus efforts on the Stripe Ops + Pricing Ops consolidation and usability redesign.

