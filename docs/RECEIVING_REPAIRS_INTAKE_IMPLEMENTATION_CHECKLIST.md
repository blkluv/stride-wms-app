# Repair Receiving Workflow — Implementation Checklist
Date: 2026-02-16

This checklist is derived from docs/RECEIVING_REPAIRS_INTAKE_QA_LOG_2026-02-16.md
and will be checked off during implementation so nothing is skipped.

## A) Stage 1 + Stage 2 combined page
- [ ] Render Stage 1 + Stage 2 on the same page (legacy combined layout).
- [ ] Implement "Complete Stage 1" button (sets inbound_status -> stage1_complete).
- [ ] After Stage 1 complete, show Stage 2 section on same page (collapsed).
- [ ] Add "Start Stage 2" button (persist to DB; inbound_status -> receiving).
- [ ] Once Stage 2 started, default Stage 2 expanded on reloads (unless user collapses locally).
- [ ] Keep Stage 1 visible/editable during Stage 2 (photos/docs/exceptions/notes/signature all editable).

## B) Piece counts redesign + mismatch prompting
- [ ] Rename counts:
  - [ ] "Carrier count" (manual, required) = what you sign for (paperwork).
  - [ ] "Dock Count" (required) = Stage 1 actual count.
  - [ ] "Entry Count" (read-only) = number of Stage 2 item rows (each row = 1 piece).
- [ ] Add help icon tooltips to all 3 count fields.
- [ ] Move Stage 2 "received pieces" input into Shipment Summary (and remove Stage 2 manual entry).
- [ ] Stage 1 mismatch logic (Carrier vs Dock):
  - [ ] Auto-sync Shortage/Overage chip based on mismatch direction.
  - [ ] Lock auto-synced Shortage/Overage chip until mismatch corrected.
  - [ ] Block Stage 1 completion if mismatch exists and required exception note missing.
- [ ] Stage 2 mismatch logic (Dock vs Entry):
  - [ ] On Complete Stage 2, if mismatch: prompt user to review.
  - [ ] Require user to either fix discrepancy (counts match) OR select exception chip(s) + notes to proceed.

## C) Shipment-level exception chips (save + notes + persistence)
- [ ] Implement shipment-level chip set:
  - [ ] Damage
  - [ ] Wet
  - [ ] Open
  - [ ] Missing Docs
  - [ ] Crushed/Torn
  - [ ] Mis-Ship
  - [ ] Shortage
  - [ ] Overage
  - [ ] Other
- [ ] Ensure multi-select behavior (no "No Exceptions" chip).
- [ ] Fix persistence: selecting chip creates/saves exception; notes persist across reload.
- [ ] Other requires note.
- [ ] Notes required for all chips for stage completion requirements (client-visible exception notes).
- [ ] Log chip add/remove and note add/remove in shipment activity/audit history.

## D) Item-level flags (Stage 2 rows + Item Detail) + alert tokens
- [ ] Ensure Stage 2 item rows can apply item-level flags:
  - [ ] Damage, Wet, Open, Missing documents, Crushed/Torn, Other.
- [ ] Ensure Item Detail flags area supports the same flag set (leveraging existing flag system).
- [ ] Implement alert tokens for item-level flags so alerts can reference the flag type/details.

## E) Notes system (Public/Internal/Exception) — shipment-level
- [ ] Implement shipment notes UI like Item Details notes UI:
  - [ ] New note composer toggle: Internal / Public / Exception.
  - [ ] Filters: All / Internal / Public / Exception.
- [ ] Store as shipment-level notes (client portal should see Public + Exception).
- [ ] Exception chip quick-entry:
  - [ ] When a chip is selected, show inline note field for that exception.
  - [ ] Saving that inline note creates an Exception note entry (tied to exception code/type).
  - [ ] Removing chip removes its corresponding exception note entry.
  - [ ] If user adds an Exception note from Notes tab directly, it may be untied to a chip.

## F) Signature UX (Stage 1 carrier sign-for)
- [ ] Signature optional overall.
- [ ] Support Draw OR Type signature.
- [ ] If Draw is used: require Driver name.
- [ ] After capture/save:
  - [ ] Render signature (image or typed) in the signature field.
  - [ ] Button changes from "Capture" -> "Edit".
  - [ ] Edit allows switching Draw/Type and allows Clear signature.
- [ ] Persist signature + metadata; display on intake page AND Shipment Details:
  - [ ] Driver name (typed)
  - [ ] Signed at timestamp

## G) Document scanner: "real scan" -> B/W multi-page PDF (mobile web v1)
- [ ] Multi-page scanning into a single PDF.
- [ ] Output is black & white PDF generated in-app (not device camera behavior).
- [ ] Auto edge detection + manual crop adjustment (scanner-style UX).
- [ ] No user naming prompt; auto-name using shipment number + date + unique component.
- [ ] Desktop behavior: upload only.
- [ ] Structure code so native iOS/Android scanner can replace web implementation later.

## H) Alerts / email template changes (avoid double-email)
- [ ] Do NOT send an extra "exception added" email at Stage 2 completion.
- [ ] Enhance existing Shipment Received email:
  - [ ] Add Exceptions section that is blank when no exceptions.
  - [ ] Include exception types + notes (bullet list).
  - [ ] Add tokens for exception types + notes for templating.

## I) Exception indicator near shipment number
- [ ] Show a warning indicator near shipment number anywhere it is displayed (e.g., hub lists),
      based on open shipment exceptions and item flags counts.

