# ARCANA Tarot MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a dependency-light, runnable ARCANA web app whose only core reading is a user-selected three-card Tarot spread with accurate orientation-aware traditional meanings and contextual interpretation, followed by Tarot-based packages.

**Architecture:** A browser-first ES-module app keeps the Tarot engine and canonical card data separate from UI rendering. The initial interpretation layer is deterministic and local; its interface is designed so a secure AI provider can be added later without giving AI authority over card selection or orientation.

**Tech Stack:** HTML, CSS, modern JavaScript ES modules, Node's built-in test runner for engine tests.

**Spec:** `docs/superpowers/specs/2026-09-19-arcana-tarot-design.md`

## Global Constraints
- No 1-card reading.
- Exactly one core reading: Situation · Challenge · Guidance.
- Complete 78-card Tarot deck.
- User selects all cards; engine never selects on the user's behalf.
- Each selected card receives an independent randomized upright/reversed orientation.
- Traditional meaning is shown before contextual interpretation.
- No astrology, zodiac, numerology, horoscope, diagnosis, legal/financial prediction, or claims about third-party behavior as fact.
- English and Hindi UI/readings.
- Mobile-first, keyboard focus, Escape close, reduced motion.
- Authentic public-domain Rider-Waite artwork is referenced from a documented public-domain source; README documents replacement/licensing path.

## Review Focus
- Duplicate prevention: the same physical card cannot be selected twice in one spread.
- Orientation integrity: reversed cards use reversed meaning and do not mutate card identity.
- Question integrity: contextual interpretation must quote/reflect the user's question without changing canonical meanings.
- Refresh/restart integrity: every new reading creates a fresh 78-card state.
- Language integrity: switching language does not change the selected cards or orientation.

### Task 1: Tarot engine and canonical data
**Files:** `src/data/cards.js`, `src/data/packages.js`, `src/engine/tarot.js`, `tests/tarot.test.js`
- [ ] Write failing engine tests for 78 cards, fresh shuffle, three unique selections, independent orientation, and position-aware reading assembly.
- [ ] Run `node --test tests/tarot.test.js` and observe the expected failures.
- [ ] Implement canonical card data, deck state, shuffle, orientation, selection validation, and deterministic interpretation assembly.
- [ ] Re-run the focused tests and then the full suite.

### Task 2: Application shell and all screens
**Files:** `index.html`, `src/main.js`, `src/ui.js`, `src/i18n.js`, `src/styles.css`
- [ ] Add failing smoke tests for core flow state transitions in `tests/app-flow.test.js`.
- [ ] Run the tests and observe failure.
- [ ] Implement Home, Question, Spread Intro, Shuffle, Selection, Reveal, Complete Spread, Reading, Packages, About, How It Works, and Restart states.
- [ ] Add English/Hindi toggle, accessible controls, dialogs, reduced-motion behavior, and responsive layout.
- [ ] Run the full test suite and syntax checks.

### Task 3: Artwork integration and documentation
**Files:** `src/data/cards.js`, `README.md`, `public/README.md`, `scripts/download-deck.mjs`
- [ ] Add artwork URL mapping for all 78 cards and a local-download script that records the source path convention.
- [ ] Document the public-domain source and the need to independently verify jurisdiction/licensing before commercial deployment.
- [ ] Run syntax checks and a 78-URL mapping validation test.

### Task 4: Verification and ZIP
**Files:** generated project tree only
- [ ] Run full Node test suite.
- [ ] Run syntax checks on every JS module.
- [ ] Run a local HTTP server and smoke-test the entry page with a headless-capable browser if available; otherwise verify HTML/module paths and document the limitation.
- [ ] Create `ARCANA-Tarot-MVP.zip` and verify its contents and archive integrity.
