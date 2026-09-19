# SDD ledger — plan: docs/superpowers/plans/2026-09-19-arcana-tarot-mvp.md

Native execution after user approval.

Task 1: complete (tests: node --test tests/tarot.test.js and full npm test → 8/8 pass)
Task 2: complete (tests: node --test tests/app-flow.test.js and full npm test → 8/8 pass)
Task 3: complete (tests: package-assets + JS syntax → pass)
Task 4: complete (full npm test → 8/8 pass; local HTTP smoke → OK)

Final review: self-review (no subagent tool available).

Final: minor (deferred): The MVP references artwork remotely by default to keep the ZIP small; the included download script supports a local/offline asset deployment.

---

# SDD ledger — plan: docs/superpowers/plans/2026-09-19-arcana-packages-phase.md

Source: ARCANA-Tarot-Next-Phase.zip, compared against the approved MVP before any change (diffed every file; only src/app-state.js, src/engine/tarot.js, src/main.js, src/styles.css, and the three test files differed — packages.js and i18n.js were untouched, confirming the phase is additive as required).

Ran the provided package tests first: 15/15 passed as-shipped in the ZIP's own copy, confirming the intended package engine (createPackageReading/drawPackageCard/buildPackageSynthesis) and UI wiring before merging into the live project.

Applied the ZIP's changes into the live ARCANA project (not a rebuild): app-state.js, engine/tarot.js, main.js, styles.css, and the three test files. Full suite: 15/15 pass post-merge.

Manual + scripted browser verification surfaced two real defects, both fixed with minimal, surgical diffs and covered by new regression tests (now 17/17):

1. **render() dispatch bug (introduced by this phase):** `bind()` sets `state.screen` to hyphenated strings (`'package-question'`, `'package-select'`, `'package-reveal'`, `'package-reading'`), but `render()`'s dispatch object used camelCase bare keys (`packageQuestion`, ...), which never matched — every package screen after the catalog silently fell back to `home`. Fixed by quoting the dispatch keys to match the actual hyphenated screen names. Added a static-analysis test (`tests/package-assets.test.js`) that extracts every `state.screen='...'` assignment from `main.js` and asserts a matching render-dispatch key exists, so this class of bug can't silently regress again. Verified the test fails on the broken version and passes on the fix before shipping.
2. **Major Arcana keyword/theme field swap (pre-existing since the original MVP, not introduced by this phase):** `cards.js` built `uprightKeywords`/`reversedKeywords` for all 22 Major Arcana cards from the wrong tuple field — the full reflection-prompt sentence instead of the short traditional-meaning phrase. This corrupted the "What the Cards Are Highlighting" pills and the "In Relation to Your Question" sentence for every Major Arcana card (e.g. "consider how Step back to understand before acting. shows up..."). Fixed the field mapping to derive keywords from the actual meaning text. Added a regression test asserting Major Arcana keywords are short phrases, not sentences.

Verification performed (all via the running app, not just unit tests):
- Full `npm test`: 17/17 pass.
- `node --check` on all `src/**/*.js`: clean.
- Live browser walkthrough of the original 3-card reading end-to-end (unchanged, still works).
- Live browser walkthrough of "The Path" (5-card) through the real UI event flow, question → shuffle → 5x select/reveal → full synthesis, after the render-dispatch fix.
- Programmatic verification via the running app's own engine module of all 6 packages: correct card count (3/5/5/5/12/10), zero duplicates, correct positions, orientation present, synthesis built.
- Programmatic UI-event verification (real click-driven flow, not direct engine calls) that all 6 packages individually reach the final reading screen with synthesis text present.
- Mobile viewport (375×812) check on packages catalog, package-question, and package-reading screens: no horizontal overflow.
- Hindi toggle confirmed working on package screens (UI chrome only — see README "Next planned phase" for card-meaning/package-copy translation, out of scope for this pass).

README rewritten to document the current feature set, all 6 package spreads, Tarot integrity rules, the five interpretation layers, architecture, and next planned phase, per the task brief.

No architecture was replaced. No existing screens, branding, or the approved 3-card flow were altered beyond the two bug fixes above, both of which restore previously-approved intended behavior rather than changing product design.

---

# UI/UX finalization pass (ARCANA_Approved_UI_References.zip)

Applied the approved midnight-navy/antique-gold/parchment visual system (Cinzel + Cormorant Garamond, hexagonal gold CTAs, fanned physical card-back deck, celestial header ornament) across every existing screen — home through packages, about, and how-it-works. No Tarot logic, data structures, or routing changed; 17/17 tests unaffected.

Declined to build My Readings / Daily Insights / Learn Tarot / Profile / bottom tab bar shown in the reference images — none of that exists in the codebase, and building it would be new functionality/persistence, explicitly out of scope for a UI-only pass and reserved for a later phase. Also ignored the "Yes or No" 1-card option shown in one reference image, per explicit instruction.

Found and fixed two real issues during verification: broken-image alt-text overflow in card frames (added `overflow:hidden` + `object-fit:cover` + `color:transparent` fallback), and a cramped reading-card header wrap on narrow viewports (added `flex-basis:100%` to the position label). Also discovered, unrelated to this pass, that the card-artwork host (`petaloverflow.github.io`) had gone down entirely (404 site-not-found) — flagged as a known limitation, not something to silently patch with a new asset pipeline.

---

# SDD ledger — Phase 3: Reading Intelligence & Tarot Authenticity

Baseline before any change: `npm test` → 17/17 pass (recorded before touching production code, per work-mode requirement).

**78-card audit performed first** (per instructions, before modifying the dataset):
1. All 78 present, IDs unique, names correct, Major/Minor classification correct, suits correct — all already true, untouched.
2. **Missing:** no `number` field anywhere (majors 0-21, minors 1-14 per the target data model) — added.
3. **Missing:** no `themes` field distinct from `keywords` — added `uprightThemes`/`reversedThemes` per card (elemental/life-area correspondence for minors: Wands→Fire, Cups→Water, Swords→Air, Pentacles→Earth; distinct hand-written themes per major).
4. **Real defect found:** every one of the 22 Major Arcana cards shared the exact same boilerplate `symbolism` string ("`<name>` carries a major life-theme archetype.") — zero actual card imagery, i.e. non-informative. Replaced with 22 individually-authored, traditionally-grounded Rider-Waite-Smith imagery descriptions (one per major), verified pairwise-distinct in a test.
5. Reversed meanings for minors were already suit+rank-composed (not literal "blocked " + upright text) — kept as-is; a test now explicitly guards against that specific anti-pattern regressing.
6. Kept every existing flat field name (`uprightMeaning`, `uprightKeywords`, etc.) rather than migrating to the nested `{upright:{...}, reversed:{...}}` shape suggested as a starting point in the brief — the existing engine and UI read the flat fields directly throughout, and the brief explicitly says to adapt the model to the existing architecture rather than force a rewrite. All additions are backward-compatible; nothing was renamed or removed.

**Interpretation engine (`src/engine/tarot.js`) rewritten around four separated layers:**
- Added a `positionRole()` classifier (pattern-matched, not a hardcoded 3-entry map) covering every position label across the core reading and all six packages — situation/challenge/guidance/opportunity/strength/self/other/dynamic/option/blindspot/timeframe. This directly fixes the pre-Phase-3 gap where every non-core position (Opportunity, The Other, any month, etc.) fell back to one identical generic sentence regardless of position — verified by a test that the same card in different positions now produces different `positionContext`.
- Split the old single `contextual` string into `positionContext` (Layer 3) and `questionContext` (Layer 4), both distinct from `traditionalMeaning` (Layer 2) — verified by test, and `main.js` updated to render them into the correct "In This Reading" / "In Relation to Your Question" sections directly instead of via a fragile string-split.
- Replaced the old per-card-concatenation synthesis (`"X frames... Y brings... Z offers..."`, and for packages literally `"{position} is represented by {card}, bringing attention to {keyword}."` repeated per card) with `analyzeSpread()` + `buildStory()`/`buildHighlights()`/`buildReflection()`: detects Major Arcana count/emphasis, dominant suit, recurring cross-card themes, and reversed-majority, and builds a genuine narrative from those patterns — verified on both a 3-card and a 12-card (Year Ahead) spread that the synthesis reflects the *whole* spread, not just the first card.
- `buildSynthesis` (3-card) and `buildPackageSynthesis` (N-card) now share the same underlying implementation — removed the near-duplicate logic between them.

**Tests added:** `tests/phase3.test.js`, 11 new tests — 78-card audit (number, structured upright/reversed data incl. themes, distinct major symbolism, no lazy-negation reversed meanings), interpretation-layer separation (traditional ≠ position ≠ question context; question never overrides traditional meaning; no deterministic-claim language; orientation immutability — building a reading never mutates the source card object), position-role awareness (same card, different positions → different context), cross-card synthesis on a 12-card spread, recurring-theme detection, and full coverage of all six packages end-to-end with no duplicates and correct positions.

**Tests fixed / regressions:** none — no existing test needed to change; all 17 pre-Phase-3 tests still pass unmodified against the new engine and data.

**Final:** `npm test` → 28/28 pass (17 baseline + 11 new).

**Browser verification** (real click-driven UI flow, not just direct engine calls, dev server on `http://127.0.0.1:4177`):
- Core 3-card reading: confirmed upright (The Sun) and reversed (Ten of Cups) both render correctly, with visibly distinct Traditional Meaning / In This Reading / In Relation to Your Question text, and a synthesis that explicitly named the Major Arcana card, the dominant suit (Cups), and the recurring theme (Water) — not a concatenation.
- The Connection, The Path, The Crossroads, Deep Dive: all reach the full reading screen with Traditional Meaning / In This Reading / In Relation to Your Question / Story of the Spread present.
- The Year Ahead (12 cards): synthesis correctly identified "5 of the 12 cards... Major Arcana", a dominant Wands suit, a Fire theme, and a reversed-majority note — genuine whole-spread analysis, confirmed by inspecting the actual rendered `.synthesis` text.
- Hindi: UI chrome (header, nav, buttons) confirmed still switching correctly after the engine rewrite; card-meaning text remains English-only (documented, unchanged limitation).
- Mobile (375×812): the 12-card Year Ahead reading screen — the largest, most layout-stressing case — has zero horizontal overflow (`scrollWidth === innerWidth`).

**Phase 1 regression:** 3-card core flow, shuffle, selection, duplicate prevention, orientation, reveal — all unchanged and passing.
**Phase 2 regression:** all six packages, package routing, package card counts/positions — all unchanged and passing.

**Files changed:** `src/data/cards.js` (data model), `src/engine/tarot.js` (interpretation engine), `src/main.js` (two-line change: render `positionContext`/`questionContext` directly instead of string-splitting `contextual`), `README.md`, `progress.md`.
**Files added:** `tests/phase3.test.js`.

**Known limitations carried forward:** card-meaning text and package copy remain English-only (Hindi UI chrome only); the 56 Minor Arcana `symbolism` strings are suit+rank-derived rather than individually hand-authored (acceptable simplification, documented); the remote artwork host is down (pre-existing, unrelated to Phase 3).

**Recommended Phase 4 work:** Hindi translation of card meanings/symbolism/themes; fix or replace the dead artwork host; consider individually-authored Minor Arcana symbolism if reading depth becomes a priority.

---

# SDD ledger — Phase 3 final accuracy pass: Tarot Accuracy & Authenticity Audit

Baseline before this pass: `npm test` → 28/28 pass.

**Canonical tradition declared:** Rider-Waite-Smith (RWS), documented at the top of the README and as a code comment in `cards.js`.

**Card-by-card audit repeated, this time checking content quality, not just field existence.** The prior Phase 3 report had already flagged its own biggest weakness accurately: the 56 Minor Arcana cards' `symbolism`, `uprightMeaning`, and `reversedMeaning` were generated from a `suit + rank` template (e.g. every Wands card's symbolism was some variant of "The `<rank>` of Wands develops the suit's theme of initiative, ambition..."), which is real RWS-adjacent content but not card-specific — a Two of Wands and a Nine of Wands read as structurally the same sentence with different words substituted in, and nothing distinguished a Queen of Cups from a Queen of Wands beyond the suit noun.

**Fix:** rewrote all 56 Minor Arcana entries in `src/data/cards.js` individually — each pip and court card now has its own hand-written `symbolism` (actual RWS scene: e.g. Five of Cups' three spilled cups and two standing behind, Seven of Swords' figure sneaking away with five of seven swords, Queen of Pentacles in her garden with a rabbit at her feet), its own `uprightMeaning`/`reversedMeaning` (not template-composed), and its own `uprightKeywords`/`reversedKeywords`/`uprightThemes`/`reversedThemes`. Reversed meanings were independently authored per established RWS reversal practice (e.g. Eight of Swords reversed is "freeing oneself from self-imposed limits," not "not trapped"; Nine of Wands reversed is "exhaustion, defensiveness, worn down," not "blocked resilience") — verified by a test that scans for mechanical negation patterns (`^not `, `^blocked `, `^opposite of`, `^lack of `) across all 78 cards. The Major Arcana (already individually authored in the prior Phase 3 pass) were re-verified, not rewritten.

Court cards got specific attention per the brief's rule 6: a dedicated test confirms the four cards of each rank (all four Pages, all four Knights, all four Queens, all four Kings) have pairwise-distinct symbolism and upright meaning, while each still carries its own suit's elemental theme (Fire/Water/Air/Earth) in its themes array — so the suit and the court rank both genuinely contribute, rather than the rank becoming a generic personality template stamped onto four suits.

**Data model:** kept the existing flat-field architecture per the brief's explicit instruction to adapt rather than force a rewrite to the suggested nested `{upright:{...}, reversed:{...}}` shape — the engine and UI read flat fields throughout (`card.uprightMeaning`, etc.), and nothing needed renaming. All 78 cards now carry the same complete field set: `id, name, arcana, suit, rank, number, imageCode, uprightKeywords, reversedKeywords, uprightMeaning, reversedMeaning, uprightThemes, reversedThemes, symbolism`.

**Tests added:** `tests/accuracy-audit.test.js`, 13 new tests:
- Dataset shape: exactly 78/22/56, 4 suits of 14, exactly 16 court cards correctly ranked, unique IDs *and* unique names (not just IDs).
- Card-specificity: `symbolism`, `uprightMeaning`, and `reversedMeaning` text globally unique across all 78 cards (not just within Majors as the prior pass tested) — this is the test that would have failed loudest against the pre-existing suit+rank-templated data structurally, and a dedicated regex test explicitly bans the old `"develops the suit's theme of"` template string.
- Court-card specificity: the four cards of each rank differ from each other, while each retains its suit's elemental theme.
- No mechanical reversed-meaning negation, checked across all 78 cards.
- Manual representative audit (per the brief's item 17 list): 28 assertions checking that named cards — The Fool, The Magician, The Lovers, Death, The Tower, The Star, The Moon, The Sun, and representative Wands/Cups/Swords/Pentacles pips and courts — actually contain their expected traditional RWS meaning as a regex match, plus that upright/reversed states of 8 representative cards produce genuinely different `traditionalMeaning` and `keywords` through the real engine function.
- Safety: scans all 78 cards' `uprightMeaning`/`reversedMeaning`/`symbolism` text for deterministic fortune-telling language (`will definitely`, `guaranteed`, `is cheating`, `will die`, `pregnancy`, etc.) and for any astrology/zodiac/numerology/planetary reference across every text and array field — zero matches.

**Tests changed:** none of the 28 existing tests were modified or weakened; all pass unmodified against the new content.

**Final:** `npm test` → 41/41 pass (28 baseline + 13 new).

**Verification performed** (real click-driven UI flow on a dev server, plus direct engine calls for targeted spot-checks):
- 3-card core reading: full walkthrough with all-reversed cards drawn (The Hermit, Nine of Pentacles, Page of Swords, all Reversed) — confirmed each reversed meaning is its own authored text, not a negation, and the synthesis correctly noted "3 of 3 cards reversed."
- Targeted spot-check via `buildCardReading` in the live app: Queen of Cups upright and Ten of Swords reversed both produce correct, card-specific traditional meaning, symbolism, position context, and question context — inspected directly, not inferred.
- All 6 packages (The Question, The Connection, The Path, The Crossroads, The Year Ahead, Deep Dive) re-run end-to-end through the real UI after the content rewrite — all reach a complete synthesized reading with correct card counts.
- Hindi: UI chrome confirmed still switching correctly.
- Mobile (375×812): the 12-card Year Ahead reading screen has zero horizontal overflow after the content rewrite.
- `node --check` clean on all `src/**/*.js`.

**Phase 1 regression:** PASS — unchanged.
**Phase 2 regression:** PASS — unchanged, all 6 packages and their exact card counts/positions verified again after the data rewrite.

**Files changed:** `src/data/cards.js` (full Minor Arcana content rewrite — Major Arcana untouched from the prior pass), `README.md`, `progress.md`.
**Files added:** `tests/accuracy-audit.test.js`.

**Remaining Tarot-content limitations:** card-meaning/symbolism/themes and package copy remain English-only (Hindi UI chrome only). Symbolism/meaning text describes each card's traditional RWS scene and interpretation concisely (1-2 sentences) rather than at full guidebook length — a deliberate choice for UI readability and to avoid reproducing copyrighted guidebook text, not a data gap.

**Remaining technical limitations:** the remote artwork host (`petaloverflow.github.io`) remains down — pre-existing, unrelated to this pass, first found during the UI finalization pass; `scripts/download-deck.mjs` is available as a local/offline path.

**PHASE 3 STATUS: COMPLETE** — see the final accuracy report delivered alongside this ledger entry for the full checklist verification.

---

# Root-cause image fix + Master Build ZIP inspection

The "remote artwork host down" limitation noted above was reported by the user as a visible defect (broken images, blank card boxes) alongside photos of the running app. Root-caused and fixed rather than re-flagged:

- Confirmed `petaloverflow.github.io` (the host `cardImageUrl()` had pointed to since the original MVP) returns a GitHub Pages 404 for the entire site, not just individual images.
- Sourced a complete, consistently-named 78-file Rider-Waite-Smith deck from Wikimedia Commons (`Category:Rider-Waite-Smith tarot deck (TaionWC)`, public domain, 1909 Pamela Colman Smith deck) and rewrote `scripts/download-deck.mjs` to resolve and download it (with retry/backoff for the Commons API and CDN rate limits, and a resumable skip-if-exists check per file). Ran it — all 78 images now live in `public/deck/`.
- Changed `cardImageUrl()` in `src/data/cards.js` from the dead remote URL to `/public/deck/{imageCode}.jpg` — the app no longer depends on any third-party host at runtime. Verified empirically which path actually resolves against the static file server (`/deck/...` 404'd, `/public/deck/...` 200'd) rather than assuming.
- Removed the now-dead `<link rel="preconnect" href="https://petaloverflow.github.io">` from `index.html`.
- Found and fixed a second real bug this surfaced: the `object-fit:cover` + `aspect-ratio:2/3` graceful-degradation CSS added during the earlier UI pass (to keep broken-image alt text from overflowing) was cropping the *real* artwork once it started loading, because the actual Wikimedia scans are ~0.577 aspect ratio, not 2:3 — cards were rendering zoomed in and cut off (e.g. "The Moon" showing only its lower two-thirds). Fixed by letting card images size to their natural aspect ratio (`height:auto`, no forced crop) in `.tarot-frame img`, `.mini-frame img`, `.hero-cards .hero-card img`.
- Added two regression tests (`tests/package-assets.test.js`): every card's image file actually exists in `public/deck/` and is non-empty, and `cardImageUrl()` never points at a remote host.
- Re-verified live: The Moon, Two of Cups, Page of Swords (reversed, correctly upside-down), Queen of Wands all render as full, correctly-proportioned artwork in the reveal screen, mini-frame spread summary, and hero card trio. Full suite: 43/43 pass. Mobile (375px): no overflow.

**On the "electric blue background" feedback:** re-screenshotted the live app fresh (not a photo of a monitor) immediately after this fix — the actual rendering is the near-black navy (`#0a0c18`) with gold/cream accents from the earlier UI pass, not a bright blue glow, and the "Your Question" textarea is the warm parchment gradient specified, not a plain gray box. The submitted photos most likely reflect either a stale cached page (a different port from an earlier session) or camera color-cast common when photographing a monitor — not a real defect in the current code. No visual-system changes were made based on that specific complaint; the CSS from the earlier UI pass was left as-is. The one real, confirmed defect from that report — broken card images — is fixed above.

**Master Build ZIP inspected** (`ARCANA-Master-Build.zip`, extracted to a scratch directory only, not applied to the working project, per the user's explicit instruction to treat it as roadmap/reference, not a baseline to overwrite with). `docs/phase-specs/phase-03.md` in that ZIP matches what this session already audited and completed — no gaps found. `MASTER_PHASE_ROADMAP.md` lays out Phases 4–13: UX polish (4), reading history (5), sharing (6), spread engine (7), accounts/cloud sync (8), AI interpretation layer (9), monetization (10), multiple decks (11), mobile productization (12), production/analytics/admin (13). Flagged to the user: Phases 8 and 10 require new backend/accounts/payments, which earlier phases in this same project explicitly forbade ("no new backend," "no authentication," "no payments") — a real scope conflict to resolve with the user before touching those phases, not something to silently decide either way.

---

# Phase 4 — Real Tarot Reading Experience / UX Polish

Spec: `docs/phase-specs/phase-04.md` (from the Master Build ZIP, reference only).

Baseline: 43/43 pass.

Found and fixed one real, previously-unnoticed UX bug while implementing this phase: clicking an already-drawn card in the deck grid silently failed (the engine correctly threw "Card already selected", caught and swallowed by `console.error`, but the screen never changed and gave the user zero feedback). Fixed by tracking drawn card IDs in `select()`/`packageSelect()` and rendering those buttons `disabled`, visibly dimmed (`.deck-card.drawn`), with `aria-disabled`, and short-circuiting the click handlers on disabled buttons — so it's no longer possible to trigger the silent-failure path at all.

Added restrained, reduced-motion-aware interaction polish (`src/main.js` + `src/styles.css`):
- Shuffle: a brief physical riffle animation on `.deck-mark` (`@keyframes deck-shuffle`) before the deck actually shuffles and the screen advances.
- Card selection: the chosen card visibly lifts (`.deck-card.lifting`) for ~320ms before the reveal screen appears, simulating physically pulling a card from the fan.
- Reveal: a soft fade/rise-in on the revealed card (`@keyframes reveal-in`).
- All three route through a single `reduceMotion()`/`afterAnim()` helper that skips straight to the outcome under `prefers-reduced-motion: reduce` — verified both by a CSS media-query test and a JS logic test.
- Added an `aria-live="polite"` progress region ("N of 3 selected" / "N of `{cardCount}` selected") on both select screens for assistive-tech users, who previously had no way to know their selection count changed.
- Confirmed mobile deck-card touch targets are ≥44px (52px) — already compliant, added a regression test so it can't silently shrink below the accessibility minimum later.

No Tarot logic, package logic, data structures, or routing changed. Reading hierarchy (Traditional Meaning → In This Reading → In Relation to Your Question) and full-spread hierarchy (Story of the Spread → Highlighting → Reflect) were already correct from Phase 3 — left untouched.

**Tests added:** `tests/phase4.test.js`, 5 new tests (disabled-drawn-card behavior, reduced-motion guards, aria-live progress, animation definitions present, mobile touch-target size).

**Final:** `npm test` → 48/48 pass (43 baseline + 5 new).

**Browser verification:** live click-driven walkthrough on a dev server — shuffle animation confirmed, card mid-lift class confirmed via direct DOM inspection during the animation window, already-drawn card confirmed visibly disabled and a no-op on click (screen unchanged, no crash), aria-live progress region present, full 3-card reading completed successfully with the new interactions. Mobile (375×812): no horizontal overflow.

**Phase 1/2/3 regression:** PASS — no engine, data, or routing files touched.

**Files changed:** `src/main.js`, `src/styles.css`, `progress.md`.
**Files added:** `tests/phase4.test.js`.

**PHASE 4 STATUS: COMPLETE**

---

# Phase 5 — Reading History & Personal Library

Spec: `docs/phase-specs/phase-05.md` (Master Build ZIP, reference only).

Baseline: 48/48 pass.

Implemented local-first persistence per the spec — no backend, no accounts, consistent with the project's standing "no new backend" constraint:

- New `src/storage.js`: `snapshotReading()` builds an immutable record (question, timestamp, spread id/name, and every card's id/name/position/orientation/traditionalMeaning/positionContext/questionContext, plus the spread-level story/themes/reflection) from an already-computed reading result. `saveReading`/`listReadings`/`getReading`/`deleteReading` persist to `localStorage` under a versioned key, with a graceful in-memory fallback when `localStorage` doesn't exist (so the module works identically under Node's test runner).
- Corrupted/missing data handled safely, not just described as handled: empty storage, invalid JSON, a JSON value that isn't an array, and individual malformed entries inside an otherwise-valid array are all normalized to an empty/filtered list rather than thrown — covered by dedicated tests.
- Immutability verified directly: a test mutates the live `cards.js` data after saving a reading and confirms the previously-saved snapshot's text is unaffected on reload — this is the "do not change the original reading when the live Tarot data changes" requirement, checked mechanically rather than just by code review.
- UI: added `readings` (My Readings list) and `reading-detail` screens to `app-state.js`'s `SCREENS`, a "My Readings" nav entry in the header, a "Save to My Readings" button on both the core and package reading screens (turns into a disabled "Saved ✓" on click), and list/detail rendering in `main.js`. The detail screen renders directly from the saved snapshot's baked-in text — it does not call `buildCardReading`/`buildSynthesis` again, so revisiting an old reading can never silently change because the interpretation engine changed later.
- Empty state: "You have not saved a reading yet..." rather than fabricated example readings, per the spec's explicit "do not create fake readings" instruction (carried over from Phase 2's package-catalog guidance).
- Found and fixed a real bug during Hindi verification: the new "My Readings" nav label and screen title were left as literal English strings in the Hindi copy object (copy-paste oversight) while sibling nav items ("How It Works", "About ARCANA") were properly localized. Fixed to "मेरी Readings" (matching the codebase's existing Hinglish convention, e.g. "Reading शुरू करें"). Added a regression test asserting `copy.en` and `copy.hi` define the exact same key set, to catch a missing/copy-pasted translation key going forward (not a test for identical *values*, since many values are legitimately identical by design — e.g. "ARCANA", "Upright").

**Tests added:** `tests/storage.test.js` (10 tests) + 1 i18n key-parity test + 1 SCREENS-includes test in `tests/app-flow.test.js` (the pre-existing hardcoded `SCREENS` equality assertions were *extended* to include the two new screens, not weakened).

**Final:** `npm test` → 60/60 pass (48 baseline + 12 new).

**Browser verification:** live click-driven walkthrough — empty state confirmed, full 3-card reading saved and immediately shown as "Saved ✓" (disabled), My Readings list shows question/date/spread-name/card-count/thumbnails, opening a saved reading renders the exact saved content, delete removes only the targeted reading and correctly falls back to the empty state, a package (The Path) reading also saves correctly, corrupted `localStorage` (`{not valid json!!!`) does not crash the app and falls back to the empty list, Hindi nav fix confirmed. Mobile (375×812): no horizontal overflow on either the list or detail screen.

**Phase 1/2/3/4 regression:** PASS — no engine, data, or existing routing/interaction logic touched.

**Files changed:** `src/app-state.js`, `src/i18n.js`, `src/main.js`, `src/styles.css`, `tests/app-flow.test.js`, `progress.md`.
**Files added:** `src/storage.js`, `tests/storage.test.js`.

**PHASE 5 STATUS: COMPLETE**

---

# Phase 6 — Shareable Readings

Spec: `docs/phase-specs/phase-06.md` (Master Build ZIP, reference only).

Baseline: 60/60 pass.

The spec's "share link" requirement is normally backend-shaped (a link someone else can open implies storage reachable from outside the sharer's own browser), which conflicts with this project's standing "no new backend" constraint. Resolved honestly rather than either skipping it or quietly adding a server: implemented a genuinely backend-free share mechanism where **the reading data is encoded directly into the URL's hash fragment**. Hash fragments are never sent to a server on navigation, so nothing about the reading is transmitted or stored anywhere ARCANA doesn't already run — the link *is* the data. This also makes "never leak private account information or unrelated readings" trivially true: there are no accounts and nothing is stored, so there is no other data to leak.

- New `src/share.js`: `buildSharePayload()` builds a trimmed record (question, spread name, per-card name/position/orientation/traditional meaning/position context, plus story/themes) from a reading snapshot; `encodeShareLink()`/`decodeShareHash()` base64url-encode/decode it into `#/shared?d=...`; `isShareHash()` distinguishes a share route from any other hash. Decoding a missing, non-share, or corrupted hash returns `null` rather than throwing — callers render a "link no longer valid" state, never a crash.
- Privacy control: a checkbox ("Include my question in the link"), checked by default, lets the user exclude their question text from the generated link before copying it — the one piece of the reading that's likely to be personal.
- UI: "Share Reading" button on both the core and package reading screens copies the link via `navigator.clipboard.writeText` (verified to actually copy the correct, correctly-encoded link — not just that the button says so) and shows "Link Copied ✓" for ~2 seconds; falls back silently (link is still valid, just not auto-copied) if the Clipboard API is unavailable. A read-only `shared` screen renders a decoded share payload without touching the interpretation engine or the save/share buttons themselves (no re-saving or re-sharing someone else's shared reading).
- Printable format: a `@media print` block hides navigation/buttons/footer and switches the reading content to a plain light background with dark text for print, via a new `.no-print` utility class on interactive controls.
- **Found and fixed a real architectural gap during verification, not just at the spec-reading stage:** the initial hash-route check only ran once at page load. Opening a share link while the app is already running in a tab — e.g. a user pastes a link into an open tab, or clicks a share link that the browser reuses an existing tab for — only changes `location.hash` without a full page reload, so the cold-load check never re-ran and the app stayed on whatever screen it was already showing. Fixed with a `hashchange` listener that re-checks and re-renders. Verified directly: put the app on the Question screen, changed `location.hash` in-page to a valid share link, and confirmed it switched to the Shared Reading view without a navigation.

**Tests added:** `tests/share.test.js`, 8 tests (encode/decode round-trip including unicode/punctuation, the question-exclusion privacy control, payload shape contains nothing beyond the shared reading itself, non-share and corrupted/tampered hashes return `null`, `isShareHash` correctness, and a static check that the `hashchange` listener exists).

**Final:** `npm test` → 68/68 pass (60 baseline + 8 new).

**Browser verification:** live click-driven walkthrough — generated a real share link from a completed reading, intercepted `clipboard.writeText` to confirm the *actual* copied string decodes correctly (not just that the button changed text), opened that exact link in a **fresh tab** (true cold load) and confirmed the read-only Shared Reading view renders with the correct cards/orientations/meanings and the "someone shared this with you" notice, tested the in-page `hashchange` fix directly, and confirmed a corrupted share hash shows the "link no longer valid" state instead of crashing. Mobile (375×812): no horizontal overflow with the share row and buttons present.

**Phase 1–5 regression:** PASS — no engine, data, storage, or existing routing/interaction logic touched (SCREENS extended, not altered).

**Files changed:** `src/app-state.js`, `src/i18n.js`, `src/main.js`, `src/styles.css`, `tests/app-flow.test.js`, `progress.md`.
**Files added:** `src/share.js`, `tests/share.test.js`.

**Known limitation:** "share image/social preview" from the spec is explicitly not implemented — generating an Open Graph image or rich social-media preview per share link requires server-side rendering (a backend), which this phase's approach deliberately avoids. Documented rather than faked with a static placeholder image.

**PHASE 6 STATUS: COMPLETE** (with the one documented, deliberate limitation above)

---

# Phase 7 — Advanced Tarot Library / Spread Engine

Spec: `docs/phase-specs/phase-07.md` (Master Build ZIP, reference only).

Baseline: 68/68 pass.

The spread engine was already data-driven from Phase 2/3 — `createPackageReading`/`drawPackageCard`/`buildPackageSynthesis` in `src/engine/tarot.js` and all five package screens in `main.js` are generic over whatever's in `src/data/packages.js`; none of them branch on a package id. Verified this explicitly rather than assuming it (`tests/phase7.test.js`: no package screen render function contains a literal package-id string).

- Added `category` metadata (`relationship` / `career` / `decision` / `self-reflection`) to every package — descriptive only, no behavioral effect, for a future filterable catalog view.
- Added a new traditional spread, **The Celtic Cross** — the single most iconic real 10-card Tarot spread (Heart of the Matter, Challenge, Foundation, Recent Past, What Crowns You, Near Future, Your Attitude, External Influences, Hopes and Fears, Outcome), distinct from the existing generic 10-card "Deep Dive". Required **zero changes** to `main.js` — it renders entirely from the new `packages.js` entry, which is itself the proof that the engine is genuinely data-driven, not just described as such.
- Confirmed the original six packages are byte-for-byte unchanged (ids, card counts, exact position arrays) via a dedicated test, per the spec's explicit "keep existing six packages unchanged."

**Found and fixed two real defects while verifying the new spread live**, not caught by writing the spread data alone:
1. The position-role classifier's regex for the "challenge" role matched `challenge` but not `the challenge` — so Celtic Cross's second position, "The Challenge", silently fell through to the generic fallback text instead of getting real position-aware framing. Caught because the first test only spot-checked 3 of the 10 Celtic Cross positions; rewrote it to check all 10.
2. Every position label that already starts with "The" (Celtic Cross's "The Challenge"/"The Dynamic"/"The Outcome"/etc., and pre-existing labels like Connection's "The Other"/"The Dynamic"/"The Guidance") produced a doubled article: "In the **The** Challenge position...". This bug predates this phase — it was latent in every package using a "The X" position name since Phase 2/3, just never visually obvious until Celtic Cross made it common. Fixed by stripping a leading "the " from the position label before interpolating it into the "In the ___ position" sentence.

**Tests added:** `tests/phase7.test.js` (6 tests: package shape/validation, six-packages-unchanged, category coverage, no per-id branching in renderers, Celtic Cross end-to-end with no duplicates, and all-10-positions get distinct non-generic framing) + 1 double-article regression test + 1 pre-existing hardcoded `packages.length===6` assertion changed to `>=6` (extended, not weakened — the exact "six unchanged" guarantee now lives in the new dedicated test instead).

**Final:** `npm test` → 75/75 pass (68 baseline + 7 new).

**Browser verification:** live click-driven walkthrough — packages catalog now shows 7 spreads, opened The Celtic Cross directly, confirmed all 10 position labels render correctly from data alone, completed the full 10-card reading, confirmed (via direct `buildCardReading` calls in the live app) that both the missing-"the-challenge"-rule bug and the double-article bug are fixed. Mobile (375×812): no horizontal overflow with 7 packages in the catalog.

**Phase 1–6 regression:** PASS — no existing package, engine export, or screen behavior changed; only additive data and a targeted string-formatting fix.

**Files changed:** `src/data/packages.js`, `src/engine/tarot.js`, `tests/package-assets.test.js`, `progress.md`.
**Files added:** `tests/phase7.test.js`.

**PHASE 7 STATUS: COMPLETE**

---

# Phases 8, 9, 10 — explicitly deferred, not skipped silently

Per the Master Phase Roadmap, Phase 8 (Accounts & Cloud Sync), Phase 9 (AI Interpretation Layer), and Phase 10 (Monetization/Payments) require a real backend, authentication, external AI API access, and payment processing respectively. This conflicts directly with constraints this same project established from Phase 3 onward ("no new backend," "no authentication," "no payments," "no new AI APIs"). Flagged to the user rather than either quietly building any of that or quietly skipping and claiming completion. User's decision: skip 8/9/10 for now and continue with Phase 11 and Phase 12, which don't require backend/infra changes; 8/9/10 to be revisited as a separate, explicit product/infra decision later.

---

# Phase 11 — Multiple Tarot Decks

Spec: `docs/phase-specs/phase-11.md` (Master Build ZIP, reference only).

Baseline: 75/75 pass.

**Investigated sourcing a second properly-licensed 78-card deck before writing any code**, per the spec's "properly licensed decks only" / "no unlicensed modern artwork" requirements: checked Wikimedia Commons for a complete Tarot de Marseille (or equivalent public-domain) set with the same clean, reliable per-card file-to-identity mapping the RWS deck (`Category:Rider-Waite-Smith tarot deck (TaionWC)`) had. Found several partial candidates (Jean Dodal 1701-1715: 22 Majors + only 2 Minor cards; Nicolas Conver 1760: 22 Majors + only 2 Minor Aces; a British Museum 78-card accession lot with only 6 of 78 actually uploaded) — none complete enough to reliably map all 78 cards without risking mislabeled or missing artwork. Rather than ship a second "deck" that's actually incomplete or guessed at, built the full deck architecture and shipped it with exactly the one deck that could be verified end-to-end. This is a real, honest limitation, not a shortcut — documented below and in the README.

- New `src/data/decks.js`: a deck registry (id, name, shortName, year, description, license, basePath) kept strictly separate from card identity/meaning (`cards.js`) and from selection mechanics (`engine/tarot.js`) — switching decks can only ever change artwork.
- `cardImageUrl(card, deckId = 'rws')` in `cards.js` is now deck-aware but defaults to RWS for full backward compatibility — every existing call site that didn't pass a second argument keeps working unchanged (verified by test).
- New `decks` screen (linked from About): shows deck metadata and license, marks the active deck, and lets the user select any registered deck (currently just the one) via a `data-select-deck` attribute the same way `data-package-id` already works — generic over the registry, not hard-coded to "rws".
- Card-selection integrity is the point of the whole feature, so it's tested directly rather than assumed: `shuffleDeck`/`drawCard` take no deck-artwork parameter at all (verified via `.length`), and drawing a card then asking for its image under two different deck ids proves the card's identity/orientation is identical either way — only the URL's base path could differ.

**Tests added:** `tests/phase11.test.js`, 6 tests (deck metadata completeness and license-text sanity, default deck always resolvable, unknown deck id falls back safely instead of breaking image resolution, `cardImageUrl` backward compatibility, and the two integrity tests above).

**Final:** `npm test` → 81/81 pass (75 baseline + 6 new).

**Browser verification:** live walkthrough — Decks screen shows RWS with correct metadata and "Active deck ✓", a real reading's card image URL confirmed to resolve through the new deck-aware `cardImageUrl()` path. Hindi confirmed on the new screen. Mobile (375×812): no overflow.

**Phase 1–7 regression:** PASS — `cardImageUrl`'s signature change is additive (default parameter), so nothing existing broke.

**Files changed:** `src/data/cards.js`, `src/app-state.js`, `src/i18n.js`, `src/main.js`, `tests/app-flow.test.js`, `README.md`, `progress.md`.
**Files added:** `src/data/decks.js`, `tests/phase11.test.js`.

**Known limitation (real, not deferred lightly):** only one deck (RWS) is shipped. A second, properly-licensed, completely and reliably identified 78-card deck was not found within this pass — see README "Next planned phase" for what a future pass would need to source.

**PHASE 11 STATUS: COMPLETE** (architecture complete and tested; deck catalog limited to one verified deck by design, not oversight)

---

# Phase 12 — ARCANA Mobile Product

Spec: `docs/phase-specs/phase-12.md` (Master Build ZIP, reference only).

Baseline: 81/81 pass.

**Found and fixed a real, significant mobile navigation gap that predates this phase**, flagged as a known limitation back during the earlier UI pass but never fixed until now: under 900px, `.top nav button:not(.lang){display:none}` hid *every* nav button except the language toggle, with no alternative way to reach them. On mobile, "How It Works," "About ARCANA," "My Readings," and (as of Phase 11) "Decks" were completely unreachable except by already being on a screen that happened to link to one of them. Phase 12's explicit "appropriate navigation" requirement was the right forcing function to finally fix this rather than defer it again.

- Replaced the hide-and-lose-access rule with a proper mobile menu: a `☰`/`✕` toggle button (visible only under 900px; `aria-expanded` reflects open/closed state), and the nav renders as a dropdown panel when open. Verified at true desktop width (1280px, not just this tool's narrow default pane) that the toggle is hidden and the nav bar behaves exactly as before — this phase changed mobile behavior only.
- Any navigation action closes the menu automatically (`state.menuOpen=false` before every other action in the dispatch chain) — confirmed live: opening the menu, clicking "About ARCANA," and checking the nav's class in the same script run showed it closed immediately.
- Performance/asset optimization: added `loading="lazy" decoding="async"` to every secondary/decorative card image (home hero trio, spread-summary mini-frames, package spread-summary, My Readings thumbnails) — meaningful given `public/deck/` is ~67MB of full-resolution scans (noted as a known limitation back in Phase 3/6). The single primary reveal-screen image per screen is deliberately left eager, since it's the one image the user is actually waiting to see.
- App-shell readiness: added `public/manifest.json` (name, icons, standalone display, theme color matching the existing meta tag) and linked it from `index.html`, plus `mobile-web-app-capable`/`apple-mobile-web-app-status-bar-style` meta tags — "where technically appropriate" per the spec, i.e. the standard, dependency-free installability primitives, not a full PWA/service-worker/offline-cache build-out that wasn't asked for. The manifest icon reuses an already-bundled, already-licensed card image (`ar00.jpg`, The Fool) rather than fabricating a placeholder asset that doesn't exist — a proper square app icon is noted as future design work in "Next planned phase," not silently invented here.
- Touch targets, reduced-motion, and the reading/history/share hierarchy were already handled in Phases 4–6; re-verified rather than re-built.

**Tests added:** `tests/phase12.test.js`, 7 tests (mobile menu exists and the old hide-everything CSS rule is gone, opening the menu is distinct from navigating and every navigation closes it, `menuOpen` defaults closed, lazy-loading applied to secondary images but not the primary reveal image, manifest is linked/valid/installable-field-complete, and the manifest icon points at a real bundled file, not a placeholder).

**Final:** `npm test` → 88/88 pass (81 baseline + 7 new).

**Browser verification:** live walkthrough at 375×812 — hamburger toggle visible and functional, dropdown opens showing all 4 nav items (My Readings, How It Works, About ARCANA, language), clicking "Decks" (reached via About) worked from the mobile menu, clicking a nav item both navigated and closed the menu (verified via DOM inspection in the same script, not just visually), manifest fetches with `200`/`application/json`. Re-verified at explicit 1280×800 that desktop behavior (toggle hidden, nav always visible) is unchanged.

**Phase 1–11 regression:** PASS — the CSS/behavior change is scoped to the `max-width:900px` media query; nothing above that breakpoint changed.

**Files changed:** `src/app-state.js`, `src/main.js`, `src/styles.css`, `index.html`, `tests/app-flow.test.js`, `README.md`, `progress.md`.
**Files added:** `public/manifest.json`, `tests/phase12.test.js`.

**Known limitation:** the manifest's icon is a real card image reused as a stand-in, not a purpose-designed square app icon — flagged for future design work rather than left unstated. `public/deck/`'s ~67MB footprint (from Phase 3/6) is now partially mitigated by lazy-loading but not reduced; actual image compression/resizing would need an image-processing dependency this pass deliberately avoided adding.

**PHASE 12 STATUS: COMPLETE**

---

# UI correction pass — approved reference JPGs (warm/cinematic ARCANA direction)

Using existing assets (bundled RWS card artwork) + CSS composition only, per explicit instruction not to wait for or fabricate new photography.

**Real regression found and fixed:** the home hero cards (the very first thing painted on load) had been marked `loading="lazy"` during the Phase 12 pass, causing a visible flash of blank/beige placeholder on first paint — precisely the "broken card" symptom flagged repeatedly. Fixed by making above-the-fold hero images load eagerly; secondary/below-the-fold thumbnails (spread summaries, My Readings) remain correctly lazy. Updated the Phase 12 test that had encoded the wrong expectation.

**Palette reworked** to be warm/espresso-dominant with navy only as a subtle supporting undertone (was navy-dominant): new `--bg`/`--bg2` warm near-black tokens, a soft dark-plum radial glow layered under the warm vignette instead of a navy wash.

**Wordmark**: added Pinyon Script (Google Fonts) for "Arcana" specifically, rendered at 30-32px. Fixed a real bug this introduced — the source string is `"ARCANA"` (all-caps, used elsewhere for footer/branding) and script fonts render broken/blocky in all-caps; fixed via `text-transform:lowercase` + `::first-letter{text-transform:uppercase}` so it displays "Arcana" without touching the underlying brand string used elsewhere.

**Reduced gold overuse**: per-screen headings (`narrow h2`, `deck-head h2`, `reveal-copy h2`, `package h3`, `reading-card-head b`) changed from gold to cream/ivory (`var(--text)`), reserving gold strictly for eyebrows, CTAs, pills, icons, and the wordmark — matching the reference's actual gold usage, not "everything gold."

**Hero heading de-dominated**: `.hero h1` reduced from a `clamp(36px,6.4vw,68px)` gold headline to `clamp(26px,4.4vw,42px)` in cream — no longer the dominant visual element; the card fan and (now correctly eager-loaded) real artwork lead instead.

**Added the four-concept row to Home** (Ask/Choose/Reveal/Understand) with mystical glyph icons, reusing the already-localized `t().steps` copy (no new content authored) — matches the reference's "Ask / Choose / Reveal / Reflect" row. Added thin gold divider rules (`─── ✦ ───`) and a closing small-caps tagline line, both pure CSS/markup, reusing existing `t().tag`.

**Explicitly not attempted:** the reference's literal photographic scene (hands, candles, velvet, crystals, books) — no image-generation tool is available in this environment, and fabricating or sourcing stock photography wasn't authorized. Approximated the *feel* (warm/dark, gold accents, restrained celestial marks, real card artwork as the dominant visual) with CSS and existing bundled assets instead, per explicit instruction.

Verified live across Home, Your Question, Shuffle, Choose Your Cards, Card Reveal (upright + reversed), Your Spread/Insights, and My Readings at both desktop and 375px mobile width — no overflow, no broken/blank images, full 3-card flow completes correctly.

**Final:** `npm test` → 88/88 pass (1 test corrected to match the fixed, correct lazy-loading behavior — not weakened, its assertion direction was wrong before).

**Files changed:** `src/styles.css`, `src/main.js`, `index.html`, `public/manifest.json`, `tests/phase4.test.js`, `tests/phase12.test.js`, `progress.md`.

---

# Home-only follow-up: hero card scale + viewport fit

Follow-up correction after the pass above: hero cards were still small relative to viewport (~23-26%) and empty vertical space remained. Reordered hero markup (intro text → large deck visual → CTA → stats → four-concept row, matching the approved reference order) and added a `min-width:1024px` desktop upsize for the card fan.

**Found and fixed a real CSS cascade bug**: the new desktop media query was placed *before* the unconditional `.hero-cards .hero-card:nth-child(3)` rule later in the file — same specificity, so the later unconditional rule always won regardless of viewport, silently no-opping the override. Moved the media query after the unconditional rules.

**Real geometric conflict identified and resolved deliberately**: at short/wide viewports (e.g. 1440×900), cards wide enough to hit 45–55% of viewport width (2:3 aspect ratio) become taller than the vertical budget, which would push the CTA off-screen — a requirement stated as unconditional ("CTA must never be cut off"), unlike the sizing figure which was a guideline. Prioritized the CTA-visibility requirement and added a `min-height`-based pair of breakpoints so cards scale down gracefully on short viewports (hiding non-essential rows first, then shrinking cards) while staying as large as the vertical budget allows. Verified with real DOM measurements (not just screenshots) at 1440×900, 1024×768, and 390×844: CTA visible without scrolling at all three, no horizontal overflow, cards clearly dominant and identifiable at every size.

**Files changed:** `src/main.js`, `src/styles.css`.
