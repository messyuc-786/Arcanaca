# ARCANA — Ask the Cards.

A dependency-light Tarot reading web app built around one core idea: **the user always chooses the cards; ARCANA only interprets them.**

**Canonical tradition:** ARCANA uses the **Rider-Waite-Smith (RWS)** system as its sole interpretive framework — for Major Arcana, Minor Arcana, and all 16 Court Cards. Every one of the 78 cards' upright/reversed meanings, keywords, themes, and symbolism is individually authored from RWS imagery and established RWS reversal practice (not scraped or copied from any copyrighted modern guidebook). Where a card's tradition is ambiguous across decks, RWS is the deciding reference.

> The user brings the question.
> The user chooses the cards.
> The Tarot provides the symbolism.
> ARCANA provides the interpretation.

## Current feature set

- ARCANA branding, "Ask the Cards." tagline, Bhasad.org / Lumina Coproduct footer credit
- Home → Question → Spread explainer → Shuffle → Choose → Reveal → Reading, for the core 3-card spread
- A **Packages** catalog offering six real Tarot spreads (see below), each running the same select → ask → shuffle → choose → reveal → interpret → synthesize flow as the core reading
- Complete, canonical 78-card deck (22 Major + 56 Minor Arcana), no duplicates possible within a reading
- User-controlled card selection only — ARCANA never selects, replaces, or reorients a card
- Independent Upright/Reversed orientation per card, preserved exactly as drawn
- Card reveal with real Rider-Waite-Smith artwork, bundled locally (no third-party host dependency)
- Card-by-card reading: Traditional Meaning → In This Reading (position) → In Relation to Your Question
- Full-spread synthesis: Story of the Spread → What the Cards Are Highlighting → Reflect On This
- About / How It Works
- English / हिंदी (UI chrome, navigation, and all static screens are fully localized; card meanings and package names are currently English-only — see Next planned phase)
- Responsive desktop/mobile layout, reduced-motion and keyboard-focus support
- Position-aware interpretation: the same card produces genuinely different contextual framing depending on its spread position (Situation vs. Opportunity vs. The Other vs. a month of the year, etc.), not a single generic fallback sentence
- Real cross-card synthesis: detects Major Arcana emphasis, dominant suit, recurring themes, and reversed-majority patterns across the whole spread, for spreads of any size (3 to 12 cards) — not a per-card concatenation
- Restrained, reduced-motion-aware interactions: a physical shuffle animation, a card-lift on selection, a soft reveal entrance, already-drawn cards visibly disabled instead of silently failing, and an `aria-live` selection-progress announcement
- **My Readings**: a private, local-only reading history — save any completed reading, revisit it later exactly as it was read (never recalculated), or delete it. Handles corrupted/missing local data safely.
- **Share Reading**: a copy-link button that encodes the entire reading into the URL itself — no backend, no account, nothing stored anywhere. A checkbox lets you exclude your question from the link before sharing. A printable format is available from the same screen.
- **Multiple-deck architecture**: card artwork is deck-aware (`cardImageUrl(card, deckId)`), with a `Decks` screen showing metadata/license and letting you pick a registered deck. Currently ships one verified deck (Rider-Waite-Smith) — see "Next planned phase."
- **Seven Tarot spreads**: the original six plus **The Celtic Cross**, the classic 10-card traditional spread — added without any changes to the renderer, proving the spread engine is genuinely data-driven.
- Mobile navigation: a proper hamburger menu on narrow screens (every nav item was previously unreachable under 900px except the language toggle — fixed in Phase 12), lazy-loaded secondary card images, and a web app manifest for "Add to Home Screen" readiness.
- Node built-in test suite (88 tests) covering the deck, both engines (core + package), the app-flow/state contracts, the 78-card data audit, interpretation-layer separation, interaction/accessibility behavior, local persistence, the share-link encode/decode round-trip, the spread engine, multi-deck integrity, and mobile navigation/app-shell readiness

## Tarot integrity rules (non-negotiable)

These rules are enforced by the engine (`src/engine/tarot.js`) and covered by tests, not just by convention:

- The deck is always the complete, canonical 78-card Tarot deck.
- The user personally selects every card in every spread, in every package. The UI never auto-picks a card.
- The app never changes a card the user selected, and never changes its orientation after the draw.
- A card cannot be drawn twice in the same reading (`drawCard` / `drawPackageCard` throw on a repeat selection).
- Every reading shuffles a fresh deck (`shuffleDeck`), independent of any prior reading.
- Upright/Reversed orientation is randomized independently per card and preserved through reveal and the final reading.
- Card meaning is always derived from the actual card's canonical traditional meaning — never invented to fit the question.
- Position meaning is tied to the actual spread position definition, not generated ad hoc.
- The user's question is used only as interpretive **context** layered on top of the canonical meaning — it never overrides or replaces it.
- No astrology, zodiac, numerology, birth charts, or "cosmic energy" language anywhere in the product.
- No deterministic claims about relationships, cheating, marriage, death, pregnancy, health, legal outcomes, employment, or money. Readings are framed as reflection, not prediction.
- There is **no one-card reading** anywhere in the product. The smallest spread is the 3-card core reading.

## The interpretation engine's five layers

Kept conceptually and structurally separate in `buildCardReading` / `buildPackageSynthesis` (`src/engine/tarot.js`):

1. **Card identity** — the actual card and its actual orientation, exactly as drawn
2. **Traditional Tarot meaning** — the card's canonical upright/reversed meaning (`card.uprightMeaning` / `card.reversedMeaning`), returned verbatim and never rewritten by position or question (`r.traditionalMeaning`)
3. **Meaning in this specific spread position** — a `positionRole()` classifier maps any position label (from the core reading or any of the six packages) to an interpretive role — situation, challenge, guidance, opportunity, strength, self, other, dynamic, option, blindspot, timeframe, etc. — so the same card genuinely reads differently in "Opportunity" than in "The Other" than in "August" (`r.positionContext`)
4. **How this relates to the user's question** — the question is contextual framing only, referencing the card's actual keyword and orientation, never a determinant of meaning and never phrased as an instruction ("you should...") (`r.questionContext`)
5. **Synthesis across the entire spread** — `analyzeSpread()` looks at Major Arcana count, dominant suit, recurring themes, and reversed-majority across *all* selected cards (not just the first) to build a real narrative, a highlights list ordered by recurrence, and grounded reflection prompts — never a certainty claim

`r.traditionalMeaning`, `r.positionContext`, and `r.questionContext` are asserted to be textually distinct in tests (`tests/phase3.test.js`), so the UI's "Traditional Meaning" / "In This Reading" / "In Relation to Your Question" sections can never collapse into the same text.

## Packages — real Tarot spreads, not pricing tiers

Each package is a fully-defined Tarot experience (`src/data/packages.js`), not a UI skin or a different AI prompt. Every package runs: **select package → ask question → shuffle → user chooses cards → reveal one by one → upright/reversed → traditional meaning → position interpretation → question context → full spread synthesis.**

| Package | Cards | Positions |
|---|---|---|
| **The Question** | 3 | Question · Challenge · Guidance |
| **The Connection** | 5 | You · The Other · The Dynamic · The Tension · The Guidance |
| **The Path** | 5 | Current Ground · Strength · Obstacle · Opportunity · Guidance |
| **The Crossroads** | 5 | Current Situation · Option A · Option B · What to Consider · Guidance |
| **The Year Ahead** | 12 | January – December |
| **Deep Dive** | 10 | Core · Challenge · Root · Past · Present · Near Influence · Self · Environment · Hope/Fear · Guidance |
| **The Celtic Cross** | 10 | Heart of the Matter · Challenge · Foundation · Recent Past · What Crowns You · Near Future · Your Attitude · External Influences · Hopes and Fears · Outcome |

The package catalog screen shows each package's name, purpose, card count, and full position list before the user commits — it reads like choosing a spread, not buying a subscription tier. Each package also carries a `category` (relationship / career / decision / self-reflection) for future filtering; adding a new spread requires only a new entry in `src/data/packages.js` — no changes to the engine or the render functions.

## Run locally

No build step or bundler. You only need Node 18+ (and Python 3 or `npx http-server` for a static file server).

```bash
npm test
npm run serve
```

Then open `http://localhost:4173`. You can also open `index.html` directly in a modern browser, though a local HTTP server is preferable for ES module behavior.

## Architecture

```text
src/
  data/
    cards.js       canonical 78-card deck, Rider-Waite-Smith tradition: id, name, arcana, suit,
                    rank, number (0-21 majors, 1-14 minors), imageCode, uprightKeywords/
                    reversedKeywords, uprightMeaning/reversedMeaning, uprightThemes/
                    reversedThemes, symbolism — every one of the 78 cards (including all 56
                    Minor Arcana pip and court cards) is individually authored from its actual
                    RWS imagery, not generated from a suit+rank formula
    packages.js    package/spread definitions (id, name, cards, positions)
  engine/
    tarot.js       shuffle, draw, orientation, position-role classification, interpretation
                    layers + cross-card synthesis (analyzeSpread/buildStory/buildHighlights/
                    buildReflection) — core reading (createReading/drawCard) and package
                    reading (createPackageReading/drawPackageCard) share the same integrity
                    rules and the same interpretation engine
  app-state.js     approved screen list + flow-transition rules
  i18n.js          English/Hindi UI copy
  main.js          screen rendering + interaction wiring (no framework)
  styles.css       responsive visual system

tests/
  tarot.test.js           deck + core/package reading engine tests
  app-flow.test.js        approved screen/flow + package-state tests
  package-assets.test.js  artwork mapping, package catalog wiring, render-dispatch integrity
  phase3.test.js          78-card data audit, interpretation-layer separation, position-role
                           awareness, no-mutation guarantees, cross-card synthesis, all-package coverage
  accuracy-audit.test.js  dataset shape (suit/court counts), global symbolism/meaning
                           uniqueness across all 78 cards, court-card specificity per suit,
                           representative Major+Minor manual-audit assertions, deterministic-
                           language and astrology/numerology safety scan across the whole dataset
```

Package screens (`package-question`, `package-select`, `package-reveal`, `package-reading`) are additive to the original screen set — the original `home`/`question`/`spread`/`shuffle`/`select`/`reveal`/`reading` core flow is untouched.

## Tarot artwork

All 78 card images are bundled locally in `public/deck/` and served from there by `cardImageUrl()` — the app does not depend on any third-party image host at runtime. (An earlier version hotlinked a remote host that later went offline entirely; see `public/README.md` for that history.)

To (re)download the deck — e.g. after a fresh clone where `public/deck/` is empty:

```bash
node scripts/download-deck.mjs
```

This resolves and downloads the 1909 Pamela Colman Smith / Rider-Waite-Smith deck from Wikimedia Commons (public domain in the US). The script is resumable (skips files already present) and caches its Commons API lookups, since both the lookup API and the image CDN are rate-limited for anonymous requests.

The original 1909 Rider-Waite-Smith artwork is widely documented as public domain, but later recolors/editions can carry separate rights. Verify the exact assets and your jurisdiction before commercial deployment.

## Future AI integration

A future secure AI provider can replace the deterministic contextual layer (layer 4/5 above), but the provider must receive the already-selected cards, their orientations, canonical meanings, spread positions, and user question. It must never be allowed to select cards, alter orientation, or invent canonical meanings. Keep any API key server-side.

## Next planned phase

- Translate card traditional meanings, symbolism, themes, and package names/positions into Hindi (currently UI chrome is fully bilingual, but card-meaning text and package copy are English-only).
- Card-relationship detection beyond suit/theme frequency (e.g. explicit progression/reversal pairs between specific positions), if reading quality warrants it.
- The bundled `public/deck/` artwork is full-resolution Commons scans (~67MB total for 78 images); consider resizing/compressing for production if page-weight becomes a concern (secondary images are lazy-loaded as of Phase 12, but not resized).
- A second, properly-licensed, completely and reliably card-identified 78-card deck (e.g. Tarot de Marseille) for the multi-deck feature — several public-domain candidates were checked and rejected for being incomplete or unreliably labeled; see Phase 11 in `progress.md`.
- A purpose-designed square app icon for `public/manifest.json` (currently reuses an existing card image as a stand-in).
- Phases 8 (Accounts & Cloud Sync), 9 (AI Interpretation Layer), and 10 (Monetization/Payments) from the wider roadmap require a real backend, authentication, an external AI API, and payment processing — all explicitly out of scope for this project so far. Deliberately deferred pending an explicit decision to lift that constraint, not attempted or faked.

## Attribution / research notes

The project uses traditional Tarot concepts and original ARCANA copy. Card artwork is sourced from a documented public-domain Rider-Waite source; do not substitute a copyrighted modern recolor without checking its license.
