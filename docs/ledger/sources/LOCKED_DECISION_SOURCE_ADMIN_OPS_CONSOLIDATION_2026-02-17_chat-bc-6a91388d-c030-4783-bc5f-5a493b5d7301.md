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

### QA-2026-02-17-ADMINOPS-005
User decision:
- Access control for the consolidated admin ops page remains `admin_dev` only (do not expand to tenant_admin).

### QA-2026-02-17-ADMINOPS-006
User decision:
- Canonical route for the consolidated SaaS admin ops dashboard will be: `/admin/saas-ops`.

### QA-2026-02-17-ADMINOPS-007
User decision + new request:
- Old routes `/admin/stripe-ops` and `/admin/pricing-ops` can be discarded; only the new consolidated `/admin/saas-ops` will be used.
- User reports `/admin/email-ops` is not visible while logged in as `admin_dev` and requests it be added into `/admin/saas-ops` with the same UX simplicity.

### QA-2026-02-17-ADMINOPS-008
User requirements (Email Ops / Resend):
- Build email management analogous to the platform-managed Twilio SMS approach.
- Use the platform Resend account to support tenant-branded sending so clients can send emails from the app using their own domains.
- Tenant workflow intent: clients update DNS records and fill out fields in the app (self-service) to configure sending.
- Admin intent: “admin/email-ops” capability is for the operator (admin_dev) to ensure Resend is configured correctly to support this for tenants.

### QA-2026-02-17-ADMINOPS-009
User request (tenant-facing email setup UX + AI help):
- Check Settings → Organization → Company Info email settings to align with the new platform-managed Resend system.
- Build/revise tenant email setup fields + guide so non-technical users can set up email sending easily.
- Copy must be in layman’s terms.
- Add a help tool (“i”) that uses an AI prompt (ChatGPT-style) to:
  - Ask the user questions about their domain and/or email/DNS provider.
  - Provide tailored step-by-step DNS setup instructions.

### QA-2026-02-17-ADMINOPS-010
User decision (AI help delivery):
- Do not integrate the in-app AI bot for email setup instructions.
- Instead, provide a copy/paste prompt inside the help tool UI so users can paste it into ChatGPT (or similar) to get tailored step-by-step DNS instructions.

### QA-2026-02-17-ADMINOPS-011
User decision (prompt content):
- The help prompt should be generic (not auto-filled with tenant DNS records).
- The prompt must be detailed enough that ChatGPT asks the user questions about their domain registrar/DNS/email provider and then gives clear step-by-step instructions.

### QA-2026-02-17-ADMINOPS-012
User decision + requirements (email setup UX + Resend sync):
- Replace the existing email sender wizard with a simpler, extremely easy, step-by-step setup UI (single-page preferred).
- Treat the user as non-technical (“a child can figure it out”); use layman’s terms and a guided checklist-like flow.
- Every field should have a help tooltip/icon with simple tips.
- Build/complete the Resend API integration so when tenants enter info, the app syncs with Resend to configure/verify their sending domain (platform-managed Resend account).

### QA-2026-02-17-ADMINOPS-013
User decision (sender identity input):
- Tenant setup will collect the full “From email address” (example: `alerts@yourcompany.com`) rather than only the domain.

### QA-2026-02-17-ADMINOPS-014
User decision (default sender + admin config):
- Tenants who do not configure their own domain will use a platform default sender email.
- The platform default sender email must be configurable by `admin_dev` in the new `/admin/saas-ops` Email section (not hard-coded).

