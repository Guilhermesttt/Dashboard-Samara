# Mobile Responsiveness and Customer Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing dashboard usable from 320–430 px without accidental horizontal overflow, restore Procedures scrolling, and constrain customer CPF, phone, and city data.

**Architecture:** Establish one viewport-bound dashboard shell and one vertical content scroll root, then harden shared chrome and only the section components that still exceed their containers. Keep customer input rules in pure utilities backed by a bundled official Alagoas municipality list, and verify mobile behavior through Node unit tests plus Playwright against the installed Microsoft Edge channel.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Node.js 24 test runner, Playwright, Microsoft Edge

**Spec:** `docs/superpowers/specs/2026-09-29-mobile-responsiveness-customer-input-design.md`

## Global Constraints

- Preserve the current monochrome visual identity, header, two-column mobile metric grids, five-item bottom navigation, desktop layouts, Firebase architecture, and `PatientRecord` field types.
- Support phone widths from exactly 320 px through 430 px without accidental document-level horizontal scrolling.
- Keep `Maceió, AL` as the initial city for a new customer and bundle exactly 102 official Alagoas municipalities.
- Store CPF as `000.000.000-00`, 10-digit phone as `(82) 3456-7890`, 11-digit phone as `(82) 98765-4321`, and city as `Cidade, AL`.
- Do not synthesize CPF, phone, e-mail, birth date, profession, or city data when the user leaves optional fields empty or required fields invalid.
- Retain pinch zoom and body-text selection; keep safe-area handling and at least 44 px touch height for primary mobile controls.
- Honor reduced motion by removing large translate/scale effects while retaining short opacity, color, focus, and essential loading feedback.
- Treat real-device iPhone Safari/Home Screen keyboard and safe-area behavior as Unverified until checked on physical hardware.

## Review Focus

- At 320 px, long Portuguese header titles must truncate while menu, reminder, and avatar controls remain visible; Task 3 tests this boundary.
- Customers and Settings tab strips must scroll internally without increasing `documentElement.scrollWidth`; Tasks 3 and 4 test this min-content failure mode.
- A focused input in a short mobile viewport must not make the customer modal header or action footer unreachable; Task 5 tests the available viewport contract, while physical keyboard behavior remains a device check.
- Preformatted legacy CPF/phone values and legacy non-Alagoas locations must normalize predictably instead of duplicating punctuation or silently selecting a wrong city; Tasks 1 and 2 test these inputs.
- Opening and closing more than one portal must not leave the application scroll root locked; Task 5 tests re-entrant scroll locking.

---

### Task 1: Customer Input Domain Utilities

**Files:**

- Create: `lib/alagoas-municipalities.ts`
- Create: `lib/customer-input.ts`
- Create: `tests/unit/customer-input.test.ts`
- Modify: `package.json`

**Interfaces:**

- Produces: `ALAGOAS_MUNICIPALITIES: readonly string[]`, `ALAGOAS_LOCATIONS: readonly string[]`, and `DEFAULT_ALAGOAS_LOCATION: "Maceió, AL"`.
- Produces: `formatCpf(value: string): string`, `formatPhone(value: string): string`, `isCompleteCpf(value: string): boolean`, `isCompletePhone(value: string): boolean`, `normalizeAlagoasLocation(value: string): string`, and `calculateAgeFromBirthDate(value: string, today?: Date): number`.
- Consumes: no application state or browser APIs; every helper remains deterministic and unit-testable.

- [ ] **Step 1: Add the Node test command and write failing input-domain tests**

Add `"test": "node --test tests/unit/*.test.ts"` to `package.json`. Create tests that assert these exact outcomes:

```ts
assert.equal(formatCpf("12345678901"), "123.456.789-01");
assert.equal(formatCpf("123.456.789-0199"), "123.456.789-01");
assert.equal(formatCpf("1234"), "123.4");
assert.equal(formatPhone("8234567890"), "(82) 3456-7890");
assert.equal(formatPhone("82987654321"), "(82) 98765-4321");
assert.equal(formatPhone("(82) 98765-432199"), "(82) 98765-4321");
assert.equal(isCompleteCpf("123.456.789-01"), true);
assert.equal(isCompleteCpf("123.456"), false);
assert.equal(isCompletePhone("(82) 3456-7890"), true);
assert.equal(isCompletePhone("(82) 98765-4321"), true);
assert.equal(ALAGOAS_MUNICIPALITIES.length, 102);
assert.equal(new Set(ALAGOAS_MUNICIPALITIES).size, 102);
assert.equal(DEFAULT_ALAGOAS_LOCATION, "Maceió, AL");
assert.equal(normalizeAlagoasLocation("Arapiraca, AL"), "Arapiraca, AL");
assert.equal(normalizeAlagoasLocation("São Paulo, SP"), "");
assert.equal(calculateAgeFromBirthDate("15/05/1994", new Date(2026, 8, 29)), 32);
assert.equal(calculateAgeFromBirthDate("", new Date(2026, 8, 29)), 0);
```

- [ ] **Step 2: Run the unit test to verify RED**

Run: `npm test`

Expected: FAIL because `lib/customer-input.ts` and `lib/alagoas-municipalities.ts` do not exist yet.

- [ ] **Step 3: Implement the municipality constants and minimal pure helpers**

Use the 102 IBGE municipality names already recorded during discovery, sort the source array by its official name order, derive `ALAGOAS_LOCATIONS` with `, AL`, and implement progressive punctuation from digit-only substrings. `calculateAgeFromBirthDate` accepts only `DD/MM/AAAA`, returns `0` for empty/invalid/future values, and accounts for whether the birthday occurred by `today`.

- [ ] **Step 4: Run the unit suite to verify GREEN**

Run: `npm test`

Expected: all customer input domain tests PASS with zero warnings.

- [ ] **Step 5: Commit Task 1**

```bash
git add package.json lib/alagoas-municipalities.ts lib/customer-input.ts tests/unit/customer-input.test.ts
git commit -m "feat: add validated customer input utilities"
```

### Task 2: Customer Form Masking, City Selection, and Submission Rules

**Files:**

- Create: `playwright.config.ts`
- Create: `tests/e2e/customer-form-mobile.spec.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `components/dashboard/sections/customer-form-modal.tsx:34-130`
- Modify: `components/dashboard/sections/customer-form-modal.tsx:172-292`

**Interfaces:**

- Consumes: every Task 1 export.
- Produces: controlled form fields that save formatted CPF/phone and one value from `ALAGOAS_LOCATIONS` without synthetic optional data.
- Produces: Playwright configuration with `baseURL: http://127.0.0.1:3100`, a Next.js web server on port 3100, and the locally installed Edge `channel: "msedge"`.

- [ ] **Step 1: Install the browser test harness**

Run: `npm install --save-dev @playwright/test`

Add scripts `"test:e2e": "playwright test"` and `"test:all": "npm test && npm run test:e2e"`. Configure Playwright to reuse a local server only outside CI, capture traces on first retry, and define projects named `mobile-320`, `mobile-375`, `mobile-390`, and `mobile-430` at 320×568, 375×812, 390×844, and 430×932 respectively.

- [ ] **Step 2: Write the failing customer-form browser test**

Before navigation, seed `samara_auth_session=true` with `page.addInitScript`. At 375×812, navigate to `/`, open Clientes, choose `Cadastrar Cliente`, then assert:

```ts
await cpf.fill("12345678901");
await expect(cpf).toHaveValue("123.456.789-01");
await phone.fill("82987654321");
await expect(phone).toHaveValue("(82) 98765-4321");
await expect(city).toHaveValue("Maceió, AL");
await expect(city.locator("option")).toHaveCount(102);
await city.selectOption("Arapiraca, AL");
await expect(city).toHaveValue("Arapiraca, AL");
```

Also assert that an incomplete CPF and phone fail `checkValidity()`, and that the form does not submit while either is incomplete.

- [ ] **Step 3: Run the focused browser test to verify RED**

Run: `npx playwright test tests/e2e/customer-form-mobile.spec.ts --project=mobile-375`

Expected: FAIL because the current inputs do not format and the city field is free text with `São Paulo, SP` default.

- [ ] **Step 4: Integrate the pure rules into `CustomerFormModal`**

Format values in `useEffect` and `onChange`, add `id`/`htmlFor`, `inputMode="numeric"`, `autoComplete`, exact `maxLength`, `pattern`, and accessible validation copy. Replace the city input with a required `<select>` over `ALAGOAS_LOCATIONS`. New records start at `DEFAULT_ALAGOAS_LOCATION`; invalid legacy locations normalize to an empty placeholder selection.

On submission, reject incomplete CPF/phone or invalid city, calculate age with `calculateAgeFromBirthDate`, and keep optional e-mail, birth date, and profession as trimmed empty strings rather than generated examples.

- [ ] **Step 5: Run unit and focused browser tests to verify GREEN**

Run: `npm test`

Run: `npx playwright test tests/e2e/customer-form-mobile.spec.ts --project=mobile-375`

Expected: both commands PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add package.json package-lock.json playwright.config.ts tests/e2e/customer-form-mobile.spec.ts components/dashboard/sections/customer-form-modal.tsx
git commit -m "feat: constrain customer contact and city fields"
```

### Task 3: Dashboard Scroll Root and Shared Mobile Chrome

**Files:**

- Create: `tests/e2e/mobile-shell.spec.ts`
- Modify: `app/page.tsx:199-228`
- Modify: `app/globals.css:452-485`
- Modify: `components/dashboard/header.tsx:34-105`
- Modify: `components/dashboard/mobile-bottom-nav.tsx:71-120`

**Interfaces:**

- Produces: `.dashboard-shell` as a viewport-bound isolated shell and `[data-app-scroll-root]` as the only vertical application scroller.
- Produces: CSS variables `--app-header-height` and `--mobile-nav-height` shared by chrome and content offsets.
- Consumes: existing `Section` state and navigation callbacks without changing their signatures.

- [ ] **Step 1: Write a failing shell regression test across every mobile project**

Assert after authentication that:

```ts
expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
  await page.evaluate(() => window.innerWidth),
);
expect(await main.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
await main.evaluate((el) => { el.scrollTop = el.scrollHeight; });
expect(await main.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
```

For the header, assert that the menu, reminders, and avatar bounding boxes are inside the viewport at 320 px. For Procedures, navigate through the bottom bar and assert the central `<main>`—not `body`—can reach its maximum scroll position.

- [ ] **Step 2: Run the shell test to verify RED**

Run: `npx playwright test tests/e2e/mobile-shell.spec.ts`

Expected: FAIL because `<main>` has no bounded height and the main flex column lacks `min-w-0`/`min-h-0`.

- [ ] **Step 3: Implement the shared shell and chrome constraints**

Add the viewport fallback (`height: 100vh` then `height: 100dvh`), stacking isolation, and overflow ownership in `app/globals.css`. Apply `min-w-0 min-h-0` to the dashboard content column and main scroller, add `data-app-scroll-root`, use `overflow-x-hidden overflow-y-auto`, and derive safe-area-aware padding from the shared navigation token.

Make the header title group `min-w-0 flex-1`, the title itself truncate, and trailing controls `shrink-0`. Make the bottom bar use the shared height and logical/safe-area-aware sizing without changing its five actions.

- [ ] **Step 4: Run the shell test to verify GREEN**

Run: `npx playwright test tests/e2e/mobile-shell.spec.ts`

Expected: all four mobile viewport projects PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add app/page.tsx app/globals.css components/dashboard/header.tsx components/dashboard/mobile-bottom-nav.tsx tests/e2e/mobile-shell.spec.ts
git commit -m "fix: establish mobile dashboard scroll root"
```

### Task 4: Section-Level Width, Spacing, and Touch Hardening

**Files:**

- Create: `tests/e2e/mobile-sections.spec.ts`
- Modify: `components/motion/sliding-tabs.tsx:72-120`
- Modify: `components/motion/border-beam.tsx:20-38`
- Modify: `components/ui/card.tsx:18-80`
- Modify: `components/dashboard/metric-card.tsx:25-57`
- Modify: `components/dashboard/charts/revenue-chart.tsx:37-119`
- Modify: `components/dashboard/sections/overview.tsx:60-126`
- Modify: `components/dashboard/sections/appointments.tsx:585-1029`
- Modify: `components/dashboard/sections/customers.tsx:258-585`
- Modify: `components/dashboard/sections/procedures.tsx:241-454`
- Modify: `components/dashboard/sections/reports.tsx:188-404`
- Modify: `components/dashboard/sections/settings.tsx:182-340`

**Interfaces:**

- Consumes: the Task 3 shell; no section state or callback signature changes.
- Produces: shrinkable section roots and contained horizontal scrollers, while preserving two-column metric grids and desktop tables.

- [ ] **Step 1: Write failing mobile-section containment tests**

At each configured viewport, visit Overview, Appointments, Customers, Procedures, Reports, and Settings through visible navigation. After each transition assert:

- `document.documentElement.scrollWidth === window.innerWidth`;
- the section root and every visible card remain within the main scroller bounds;
- Customers shows both 44 px action buttons completely;
- Settings tabs have `scrollWidth > clientWidth` when needed but the document does not;
- Procedures edit/delete controls are at least 44 px in their smaller dimension;
- Reports PDF export remains inset from both viewport edges;
- the appointment kanban scroller exposes horizontal overflow without causing document overflow.

- [ ] **Step 2: Run the section test to verify RED**

Run: `npx playwright test tests/e2e/mobile-sections.spec.ts`

Expected: FAIL on the supplied Customers and Settings clipping cases and on undersized procedure actions.

- [ ] **Step 3: Harden shared responsive primitives**

Add `min-w-0` and `max-w-full` at intrinsic-width boundaries in `SlidingTabs`, `BorderBeam`, metric/chart wrappers, and cards. Change card horizontal padding to `px-4 sm:px-6` while preserving current desktop spacing. Do not globally hide overflow on components that intentionally scroll.

- [ ] **Step 4: Apply focused section fixes**

Add `w-full min-w-0` to section roots and shrinkable flex children. Let customer/procedure identity rows wrap at 320 px, prevent status badges from forcing card width, and keep action grids complete. Give procedure actions 44 px mobile hit areas. Keep settings tabs in a full-width internal scroller, make tab content shrinkable, and keep form values inside cards. Preserve the appointment board as a snap/peek horizontal scroller and keep reports controls stacked and inset on phones.

- [ ] **Step 5: Run the section and prior browser tests to verify GREEN**

Run: `npx playwright test tests/e2e/mobile-sections.spec.ts tests/e2e/mobile-shell.spec.ts tests/e2e/customer-form-mobile.spec.ts`

Expected: every configured mobile project PASS with no accidental document overflow.

- [ ] **Step 6: Commit Task 4**

```bash
git add components/motion components/ui/card.tsx components/dashboard/metric-card.tsx components/dashboard/charts/revenue-chart.tsx components/dashboard/sections tests/e2e/mobile-sections.spec.ts
git commit -m "fix: harden dashboard sections for mobile widths"
```

### Task 5: Mobile Modal Viewport and Re-entrant Scroll Locking

**Files:**

- Create: `lib/app-scroll-lock.ts`
- Create: `tests/unit/app-scroll-lock.test.ts`
- Create: `tests/e2e/mobile-modals.spec.ts`
- Modify: `components/ui/modal-portal.tsx:1-35`
- Modify: `components/dashboard/sections/customer-form-modal.tsx:132-445`
- Modify: `components/dashboard/sections/procedures.tsx:647-780`
- Modify: `app/globals.css`

**Interfaces:**

- Produces: `acquireAppScrollLock(document: Document): () => void`, which locks both `document.body` and `[data-app-scroll-root]` and restores each original inline overflow value only after the final release.
- Produces: re-entrant `ModalPortal` locking through `acquireAppScrollLock`.
- Produces: accessible `role="dialog"`, `aria-modal="true"`, labelled modal surfaces with stable header/footer and a `min-h-0 overflow-y-auto` body.
- Consumes: existing `isOpen`, `onClose`, and form callback contracts unchanged.

- [ ] **Step 1: Write failing modal viewport and lock tests**

At 320×568, open the customer form and assert the dialog bounds remain inside the viewport, its heading and submit action are simultaneously reachable, and only the form body scrolls. Focus the final textarea and assert the action footer remains inside the visual viewport available to Playwright.

In `tests/unit/app-scroll-lock.test.ts`, call `acquireAppScrollLock` twice against a minimal document fixture, release once and assert the body/root remain locked, then release the second time and assert both original overflow values are restored. Add a second test that calls one cleanup twice and proves the reference count cannot underflow.

- [ ] **Step 2: Run the focused modal test to verify RED**

Run: `npm test`

Run: `npx playwright test tests/e2e/mobile-modals.spec.ts --project=mobile-320`

Expected: FAIL because the scroll-lock utility does not exist, the current action row lives inside the scrolling form, and `ModalPortal` only locks `body` independently per instance.

- [ ] **Step 3: Implement shared, re-entrant scroll locking**

Implement `acquireAppScrollLock` with a module-level open count and original style values. On the first acquisition, lock both body and the application scroll root; on the final cleanup, restore both. Make every returned cleanup idempotent so Strict Mode cleanup and overlapping portals cannot underflow the counter. Call it from `ModalPortal` while `isOpen` is true.

- [ ] **Step 4: Restructure customer and procedure modal surfaces**

Use a dynamic-viewport-bounded mobile sheet, stable labelled header, independently scrolling content body, and stable safe-area-aware action footer. Keep centered rounded dialogs at `sm` and above. Preserve pinch zoom, input selection, existing save/cancel semantics, and reduced-motion behavior.

- [ ] **Step 5: Run modal and complete browser suites to verify GREEN**

Run: `npx playwright test tests/e2e/mobile-modals.spec.ts`

Run: `npm test`

Run: `npm run test:e2e`

Expected: all modal tests and every browser project PASS.

- [ ] **Step 6: Commit Task 5**

```bash
git add lib/app-scroll-lock.ts tests/unit/app-scroll-lock.test.ts components/ui/modal-portal.tsx components/dashboard/sections/customer-form-modal.tsx components/dashboard/sections/procedures.tsx app/globals.css tests/e2e/mobile-modals.spec.ts
git commit -m "fix: keep mobile modal actions reachable"
```

### Task 6: Full Verification and Layout Audit Closure

**Files:**

- Modify only if verification exposes a regression in an already listed production or test file.

**Interfaces:**

- Consumes: all prior tasks.
- Produces: fresh evidence for unit tests, browser tests, lint, build, and the acceptance checklist; no new product interface.

- [ ] **Step 1: Run the full automated test suite**

Run: `npm run test:all`

Expected: Node unit tests and all Playwright mobile projects PASS with zero failures.

- [ ] **Step 2: Run lint and production build**

Run: `npm run lint`

Run: `npm run build`

Expected: both commands exit 0. Record any pre-existing warning by exact file and message; do not omit it.

- [ ] **Step 3: Run source and rendered acceptance checks**

Re-read the spec acceptance criteria. Confirm viewport metadata keeps `viewportFit: "cover"`, safe-area values retain usable zero-inset fallbacks, body text is selectable, pinch zoom is not disabled, and only intended controls use `select-none`/touch suppression. Capture screenshots at 320, 375, 390, and 430 px for all six sections and compare against the user-supplied failure cases.

- [ ] **Step 4: Close the layout audit**

Update the final report using the `BETTER_LAYOUT.MD` table format. Mark each former HIGH finding with its implemented location and evidence. End with `Approve` only if no HIGH issue remains; otherwise end with `Block` and name the remaining failure. Mark physical iPhone Safari/PWA safe-area and keyboard behavior `Unverified`.

- [ ] **Step 5: Inspect the final diff and status**

Run: `git diff --check HEAD~5..HEAD`

Run: `git status --short`

Expected: no whitespace errors and no unintended files. Do not amend or discard unrelated user changes.
