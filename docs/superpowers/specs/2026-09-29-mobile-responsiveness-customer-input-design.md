# Mobile Responsiveness and Customer Input Design

**Date:** 2026-09-29

**Status:** Approved in conversation

**Project:** Dashboard Sâmara

## Objective

Make the existing dashboard reliably usable on phones without changing its visual identity. The dashboard must scroll vertically, avoid accidental horizontal overflow, preserve its header, two-column metric grids, and bottom navigation, and keep controls reachable above device safe areas. The customer form must format Brazilian CPF and phone numbers and restrict the city field to the 102 municipalities of Alagoas.

## User intent and success criteria

The user reported that the Procedures page does not scroll, the mobile layout is clipped and poorly spaced, and the customer form accepts unformatted CPF, phone, and unrestricted city text. Supplied screenshots show clipping on Customers and Settings and inconsistent mobile spacing across the main sections.

Success means:

- Every primary section is usable from 320 px through 430 px wide without accidental page-level horizontal scrolling.
- The header and bottom navigation remain visible, while the central content is the single vertical scroll root.
- Only intentionally horizontal interfaces, such as tabs and the appointment board, scroll sideways.
- Fixed chrome and modal actions account for `env(safe-area-inset-*)`.
- CPF and phone fields format progressively and reject excess digits.
- City is selected from all 102 official municipalities of Alagoas and stored as `Cidade, AL`.
- The current monochrome visual language, information hierarchy, desktop layout, and Firebase data contracts remain intact.

## Non-goals

- No new visual identity, palette, typography system, or navigation model.
- No redesign of the desktop dashboard.
- No change to Firestore architecture or authentication.
- No remote municipality lookup at runtime; the official list is bundled so the form works without network access.
- No claim of real-device Safari/PWA verification without access to an authenticated physical device.

## Selected approach

Use a foundation-first responsive hardening pass. Fix the dashboard shell and shared width/scroll constraints first, then adapt only the page components that still violate the mobile contract. This avoids duplicated page-by-page patches and is less disruptive than a full mobile redesign.

Rejected alternatives:

1. **Page-by-page overflow patches:** faster initially, but duplicates fixes and leaves the shell fragile.
2. **Full mobile redesign:** could improve the interface more broadly, but conflicts with the request to preserve the current visual structure.

## Architecture

### Dashboard shell and scroll root

The authenticated dashboard shell owns the viewport. It uses a `100vh` fallback followed by `100dvh`, isolates its stacking context, and hides document-level overflow. Its main flex column and content area receive `min-width: 0` and `min-height: 0` so long descendants cannot expand the viewport.

The `<main>` element becomes the only vertical scroll root with momentum scrolling, contained overscroll, and horizontal overflow clipped. It retains safe-area-aware inline padding and gains enough bottom padding for the fixed mobile navigation. This fixes the Procedures scroll defect at its source and prevents tabs, long labels, or form values from widening the entire application.

### Fixed chrome

The header stays sticky inside the scroll architecture. Its title group can shrink and truncate while the menu, reminders, and avatar remain reachable. The bottom navigation stays fixed and keeps five destinations. It uses safe-area padding and a matching content offset so it never covers page actions or the final card.

### Intentional horizontal scrolling

Horizontal scrolling remains enabled only for components where it communicates real additional content:

- filter and settings tab lists;
- the appointment kanban board;
- desktop data tables when their columns cannot collapse.

These containers own their overflow and include a visible continuation cue through partial next-item visibility, preserved scrollbars where appropriate, or edge fade/spacing. Page-level horizontal scrolling is not allowed.

## Section behavior

### Overview

- Preserve two metric cards per row on supported phone widths.
- Allow metric labels to wrap or clamp without controlling the page's intrinsic width.
- Keep charts at the content width and prevent Recharts containers from imposing a minimum width.

### Appointments

- Preserve the two-column metric grid.
- Keep search, view controls, and filter tabs inside their containers.
- Keep the kanban board as an intentional horizontal scroller with card widths sized for a visible next-column cue.
- Ensure empty states and modal actions remain above the bottom navigation and safe area.

### Customers

- Preserve two metric cards per row.
- Keep filter tabs horizontally scrollable inside their own viewport.
- Ensure patient identity, status, phone, totals, and action buttons can shrink or wrap without widening the page.
- Keep both `Anamnese` and `Ver Prontuário` actions fully visible with at least 44 px touch height.

### Procedures

- Restore vertical page scrolling through the shared scroll root.
- Preserve the two-column metric grid and mobile card list.
- Keep search and sort controls within the available width.
- Let procedure names and category badges wrap or shrink without clipping actions.
- Give edit and delete controls mobile-sized touch targets.

### Reports

- Stack period filters and the PDF export action on narrow widths.
- Keep the export action inset from the viewport edge.
- Preserve the two-column metric grid and one-column report cards on phones.

### Settings

- Keep the tab bar as a contained horizontal scroller rather than a source of page overflow.
- Ensure tab content, profile rows, cards, inputs, and long values use `min-width: 0` and available width.
- Use responsive card padding so the form retains a usable content measure at 320 px.

## Customer form data design

### Pure input formatters

Create focused, reusable helpers:

- `formatCpf(value: string): string` keeps at most 11 digits and progressively returns `000.000.000-00` formatting.
- `formatPhone(value: string): string` keeps at most 11 digits and formats 10 digits as `(82) 3456-7890` and 11 digits as `(82) 98765-4321`, including progressive intermediate states.
- `normalizeAlagoasLocation(value: string): string` recognizes a bundled municipality value and returns `Cidade, AL`; unknown legacy locations do not enter the valid selection.

The inputs use numeric keyboards, semantic autocomplete where applicable, and maximum formatted lengths. Existing records are formatted when loaded for editing. Saved CPF and phone values remain formatted strings to preserve the current `PatientRecord` contract and existing display behavior.

### Alagoas municipality list

Bundle the 102 municipality names returned by the official IBGE Localidades endpoint for state code 27, sorted by name. The selector stores each option as `Nome, AL`. New patients start with `Maceió, AL`; editing preserves an existing valid Alagoas location and requires the user to choose a valid option when a legacy location is outside the list.

### Validation and fallbacks

- Name, CPF, phone, and city are required.
- CPF must contain exactly 11 digits before submission.
- Phone must contain 10 or 11 digits before submission.
- City must match the bundled Alagoas list.
- Incomplete required values surface inline/browser validation and are not replaced with fictitious CPF, phone, birth date, profession, or city data.
- Optional e-mail stays optional; no synthetic Gmail address is generated.

## Mobile modals and keyboard

Customer and procedure forms remain bottom sheets on phones and centered dialogs on larger screens. Their outer surface is bounded by the available dynamic viewport. Header and action areas remain stable; only the form body scrolls. Bottom actions include safe-area padding so they remain reachable above the home indicator and on-screen keyboard.

The existing portal keeps document scroll locking. The implementation must also lock the application scroll root while an overlay is open, using a shared/re-entrant mechanism so multiple portals cannot leave scrolling permanently disabled. Pinch zoom and text selection remain available.

## Spacing, touch, and motion

- Mobile content uses the existing approximately 14–16 px inline margin plus physical safe-area insets.
- Related controls use the existing compact gaps; unrelated groups use at least twice the intra-group gap where the layout permits.
- Primary controls and navigation targets retain at least 44 px touch height.
- Full-width content actions remain inset and rounded; only deliberate platform chrome reaches viewport edges.
- Large slide/scale effects are removed under `prefers-reduced-motion: reduce`; short opacity, color, focus, and essential loading feedback remain.
- Body text remains selectable and pinch zoom is not disabled.

## Layout audit findings

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| HIGH | `app/page.tsx:199`, `app/page.tsx:214`, `app/page.tsx:225` | Shell has minimum height but no bounded scroll viewport; flex children retain automatic minimum width/height. | Viewport-bound isolated shell; `min-w-0`, `min-h-0`, and a single vertical main scroller. | Scrolling and bars: blocked scrolling and descendant-driven horizontal clipping affect every mobile section. |
| HIGH | `components/dashboard/sections/customers.tsx:336`, `components/dashboard/sections/settings.tsx:205` | Long tab rows contribute intrinsic width to the page. | Tabs own horizontal overflow inside a shrinkable container with a continuation cue. | Progressive disclosure and clipping: Customers and Settings visibly extend beyond the supplied viewport. |
| HIGH | `components/dashboard/sections/customer-form-modal.tsx:135`, `components/dashboard/sections/customer-form-modal.tsx:173`, `components/dashboard/sections/customer-form-modal.tsx:425` | Fixed-height sheet and scrolling form can place its primary action below the mobile keyboard/safe area. | Dynamic-viewport sheet with stable header/footer and independently scrolling body. | Critical actions must not be parked in a clip-prone area. |
| MEDIUM | `components/dashboard/header.tsx:35`, `components/dashboard/header.tsx:36`, `components/dashboard/header.tsx:47` | Header title group cannot reliably shrink around fixed actions. | Shrinkable title region with explicit `min-w-0`; trailing controls stay fixed. | Shared edges and growth: long section titles must not push actions outside the viewport. |
| MEDIUM | `components/dashboard/sections/customers.tsx:461`, `components/dashboard/sections/customers.tsx:539`, `components/dashboard/sections/customers.tsx:558` | Patient metadata and action columns can retain min-content width and clip. | Shrinkable/wrapping metadata and complete two-action grid. | Plan for growth: the supplied screenshot shows the right action cut off. |
| MEDIUM | `components/dashboard/sections/procedures.tsx:400`, `components/dashboard/sections/procedures.tsx:426` | Long procedure names, badges, and compact actions compete in one row. | Shrinkable identity area, wrapping badge, and 44 px actions. | Breathing room and clipping: controls must remain distinct and reachable. |
| MEDIUM | `components/ui/card.tsx:23`, `components/ui/card.tsx:68`, `components/dashboard/sections/settings.tsx:246` | Desktop-oriented 24 px card padding leaves a narrow content measure on 320 px screens. | Responsive 16 px mobile padding, retaining 24 px at larger sizes. | Alignment and spacing: usable mobile margins without changing desktop density. |
| LOW | `components/dashboard/mobile-bottom-nav.tsx:74` | Content offsets and bar height are defined separately. | Shared navigation-height token drives both bar and content padding. | Stable chrome: one source of truth prevents the last item being covered. |

The current audit result is **Block** until all HIGH findings are implemented and verified.

## Testing strategy

Follow test-driven development for behavior changes:

1. Add failing unit tests for progressive CPF formatting, digit truncation, 10/11-digit phone formatting, legacy formatted input, municipality count, Maceió default, and rejection of non-Alagoas locations.
2. Add the minimal helpers and data required to pass those tests.
3. Add focused component or browser-level checks for width containment and scroll-root behavior if the repository's available runtime supports them without production-only test hooks.
4. Run the targeted tests after each change, then the complete test command.
5. Run ESLint, TypeScript/build, and inspect generated pages for unexpected horizontal overflow at 320, 375, 390, and 430 px.
6. Check normal and reduced-motion paths.

Static/source verification covers viewport metadata, safe-area usage, overflow ownership, DOM order, and logical sizing. Physical iPhone Safari/Home Screen behavior, keyboard resizing, and safe-area appearance remain **Unverified** until checked on the user's device.

## Acceptance criteria

- No supported mobile section has accidental page-level horizontal scrolling.
- Procedures scrolls to its final card and actions.
- The final content of every section clears the fixed bottom navigation and home indicator.
- Header actions remain visible at 320 px.
- Customer and procedure cards do not clip badges, values, or actions.
- Settings tabs scroll within the tab strip and all fields remain within the card.
- Mobile modal headers, fields, and save/cancel actions remain reachable with the keyboard open.
- CPF and phone formatting follows the exact examples above and prevents extra digits.
- The city selector contains exactly 102 Alagoas municipalities and stores `Cidade, AL`.
- No fictitious required customer data is generated on submission.
- Desktop layouts and existing Firebase record interfaces continue to work.
- Lint, automated tests, and production build complete without new failures.
