# ARCANA Packages Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn ARCANA Packages from a catalog into real package-specific Tarot readings using the same user-selected 78-card integrity rules as the core three-card experience.

**Architecture:** Add a data-driven package reading engine that consumes a package definition's positions, then reuse the canonical deck, random orientation, card selection, and interpretation primitives. Extend app state and screens so a user selects a package, asks a question, draws the exact number of cards for that package, and receives position-specific readings plus a package synthesis.

**Tech Stack:** Vanilla ES modules, HTML/CSS, Node built-in test runner; no new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-09-19-arcana-tarot-design.md` plus the approved package definitions in `src/data/packages.js`.

## Global Constraints

- The core experience remains a three-card Situation / Challenge / Guidance reading.
- Packages are real Tarot spreads, not alternate AI prompts.
- The user chooses every card; ARCANA never chooses cards for the user.
- Every selected card receives an independent Upright / Reversed orientation.
- Canonical meanings come from the selected card and orientation before contextual interpretation.
- Package readings must not claim certainty about future events or another person's private behavior.
- No astrology, horoscope, zodiac, numerology, or birth-chart logic.
- Preserve English / हिंदी support and responsive UI.

## Review Focus

- Drawing more cards than the package defines must be impossible.
- Duplicate cards must remain impossible within a package reading.
- Package positions must appear in exact order and be preserved in readings.
- Orientation-specific traditional meanings must remain tied to the actual selected card.
- Restarting from a package must clear the previous package/question/selection state.

### Task 1: Package Reading Engine

**Files:**
- Modify: `src/engine/tarot.js`
- Modify: `tests/tarot.test.js`

**Interfaces:**
- Produces `createPackageReading(question, packageDefinition)` and `drawPackageCard(state, cardId)`.

- [ ] **Step 1: Write failing tests** for package position count, exact position order, duplicate protection, and package-specific synthesis.
- [ ] **Step 2: Run `node --test tests/tarot.test.js` and verify the new package tests fail because the package engine functions do not exist.
- [ ] **Step 3: Implement the minimal package engine by reusing `shuffleDeck()` and `buildCardReading()`.
- [ ] **Step 4: Run the focused test and then the full `npm test` suite.
- [ ] **Step 5: Commit the package engine change.

### Task 2: Package Flow UI and State

**Files:**
- Modify: `src/app-state.js`
- Modify: `src/main.js`
- Modify: `src/i18n.js`
- Modify: `tests/app-flow.test.js`

**Interfaces:**
- Consumes `packages`, `createPackageReading`, `drawPackageCard`.
- Produces package selection → package question → package deck → package reveal → package reading flow.

- [ ] **Step 1: Write failing tests** for package screen state, package selection, and package reset behavior.
- [ ] **Step 2: Run `node --test tests/app-flow.test.js` and verify failure.
- [ ] **Step 3: Add package state and event flow; keep the existing core three-card flow unchanged.
- [ ] **Step 4: Run focused tests and full suite.
- [ ] **Step 5: Commit the UI/state change.

### Task 3: Package Presentation and Documentation

**Files:**
- Modify: `src/styles.css`
- Modify: `README.md`
- Modify: `tests/package-assets.test.js`

**Interfaces:**
- Consumes package state and rendered package reading screens.

- [ ] **Step 1: Write failing asset/markup tests** for package metadata completeness and the package flow labels.
- [ ] **Step 2: Run focused tests and verify failure.
- [ ] **Step 3: Add package-specific visual treatment, progress indicators, and documentation.
- [ ] **Step 4: Run the complete test suite and a local HTTP smoke test.
- [ ] **Step 5: Commit the presentation/documentation change.

### Task 4: Release ZIP Verification

**Files:**
- Create: `ARCANA-Tarot-Next-Phase.zip`

- [ ] **Step 1: Run the complete automated suite.
- [ ] **Step 2: Start the local server and smoke-test the package route and module loading.
- [ ] **Step 3: Validate ZIP contents and exclude transient node/server artifacts.
- [ ] **Step 4: Create the release ZIP.
- [ ] **Step 5: Verify the ZIP can be listed/extracted cleanly.
