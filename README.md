# ARCANA — Ask the Cards.

A dependency-light Tarot reading web app built around one core idea: **the user always chooses the cards; ARCANA only interprets them.**

**Canonical tradition:** ARCANA uses the **Rider-Waite-Smith (RWS)** system as its sole interpretive framework — for Major Arcana, Minor Arcana, and all 16 Court Cards. Every one of the 78 cards' upright/reversed meanings, keywords, themes, and symbolism is individually authored from RWS imagery and established RWS reversal practice (not scraped or copied from any copyrighted modern guidebook). Where a card's tradition is ambiguous across decks, RWS is the deciding reference.

> The user brings the question.
> The user chooses the cards.
> The Tarot provides the symbolism.
> ARCANA provides the interpretation.

## Screens / UI

A warm parchment/ivory/forest-green/antique-gold visual system (Playfair Display / Lora / Inter / Allura) runs across the whole app. Every screen sits on a **real photographic environment** (candles, botanicals, crystals, Tarot books, tabletop — clean assets with no baked-in text/UI, bundled in `public/images/arcana/env/`) behind a warm cream wash, with a shared **floating parchment app shell**:

- **Header** — a rounded, elevated parchment card (gold border + soft shadow), margined off the screen edges rather than a full-width bar; script wordmark in dark forest ink. The same surface is used on every screen, including the dark cinematic pages, so it never needs per-screen recoloring.
- **Bottom navigation** — a centered floating rounded parchment dock (not edge-to-edge), safe-area aware, with the same gold/forest treatment as the header.
- **Footer** — a compact editorial credit block (brand lockup + "Created by Bhasad.org · Designed by Urvashi Chandan" + About/How It Works/Profile links), shown only on screens that don't already have the bottom-nav dock (avoids a duplicate/overlapping bar).

Per-screen composition:

- **Home** — sun mark, script wordmark, tagline, a real 3-card artwork trio over the candlelit environment photo, a quote, and both a primary "Begin a Reading" CTA and a secondary Daily Insight shortcut.
- **Choose Your Reading** — real package data as icon-badge rows (category icon, name, card count + positions, chevron) over a botanical/floral environment photo.
- **Your Question** — textarea, inspiration-prompt chips, functional character counter, over a parchment-desk environment photo.
- **Shuffle the Deck** — a real 9-card fanned gold-sunburst deck sitting on a candlelit tabletop photo; see "Shuffle animation" below.
- **Choose Your Cards** — a slice of the real shuffled 78-card deck (12–18 cards depending on spread size) rendered as a 6-column (desktop) / 3-column (mobile) grid of gold-sunburst card backs inside a soft "table" panel, over the same tabletop environment — face-down until selected; card art is never revealed pre-selection. The full 78-card deck and its shuffle/draw/duplicate-prevention logic are untouched; only how many of the already-shuffled cards are *rendered* as tappable tiles changed (`VISIBLE_DECK_SIZE` in `main.js`).
- **Your Card** — real revealed card artwork in a bordered frame with a soft ambient glow, name, orientation, traditional meaning.
- **Your Spread / Detailed Insights / Bigger Picture** — real selected cards plus a per-card **accordion** (Traditional / In This Position / In Relation, expand-one-at-a-time with a live `+`/`−` indicator) on parchment-gradient panels with a gold top rule, and a real cross-card synthesis section.
- **My Readings** — real saved reading history with real card thumbnails, over a books/candle environment photo.
- **Daily Insights** — one real card in an ornate frame with a soft radial glow, name/keywords, and the day's quote — a single centered moment, not a dashboard card.
- **Learn Tarot** — a bespoke top banner (two real, tilted card images over a floral-toned gradient) overlapped by the heading, then the Major/Minor Arcana, Spreads & Meanings, and Tarot Basics rows.
- **Profile** — rows sit on a readable ivory parchment sheet (gold top rule, gold icon circles, dividers) over the environment photo, rather than boxed SaaS cards or floating transparent text.
- **Package sub-screens** — the package question screen shares the core "Your Question" composition (icon, eyebrow, heading, position tags, textarea); package card-selection, reveal, and reading screens share the same deck-grid/accordion components as the core flow.
- **How It Works / About ARCANA / Why ARCANA / Thank You** — intentionally keep a dark cinematic photographic backdrop (distinct from the other screens' light environment), under the same floating parchment header/nav as every other screen.
- **Menu overlay** — a dark forest-green-to-black panel (matching the header/nav's own forest tone) with a real, darkened environment photo behind it instead of flat black, gold icons, dividers, language toggle.

All of the above is real HTML/CSS driven by live application state — none of it is a screenshot-as-UI. Reference material (JPG mockups, environment photo packs) was used strictly as a visual spec/asset source, never as page content or baked-in text; the botanical corner decoration and card-back sunburst are inline SVG, not photography.

### App shell / viewport behavior

`#app` is a flex column (header → main → footer-or-nothing) with `main` taking `flex:1 0 auto`. This means a screen with short content (Home, Your Question, Shuffle, Choose Your Cards, Closing) renders at exactly one viewport height with no forced scroll, while a screen with genuinely long content (Choose Your Reading's package list, Detailed Insights, My Readings, About) grows naturally and scrolls — without hardcoding either behavior per screen. The static footer is only rendered when a screen's content doesn't already include the bottom-nav dock, so the two never overlap.

### Tarot atmosphere layer

Non-interactive screens carry a shared `decorCards()` component: a fixed, per-screen composition of real card images placed at the outer corners with rotation/scale/shadow, `aria-hidden`, `pointer-events:none`, and suppressed on all card-interaction screens (Choose Your Cards, Your Card, Shuffle, Your Spread) so they never compete with the actual reading. They are drawn from a fixed name list per composition (`DECOR_SETS` in `main.js`) — never randomized, never entering `state.reading`/`state.packageReading`, so they cannot affect shuffle, selection, orientation, or history.

### Shuffle animation

The Shuffle screen renders a 9-card fanned deck (`.deck-mark` / `.shuffle-card`, gold-sunburst backs). Pressing "Shuffle & enter the deck" disables the button, shows "Shuffling…", and plays a ~2.4s CSS keyframe animation (`shuffleMoveLeft` / `shuffleMoveRight`, staggered per card) where alternating cards lift, split, fan, interleave, and converge back into the deck — purely presentational. The actual draw (`createReading`) only runs after the animation's `setTimeout` resolves, so animation never influences randomization. `prefers-reduced-motion` skips straight to the draw with no animation, per `afterAnim()`'s reduced-motion branch.

## Current feature set

- ARCANA branding, "Ask the Cards." tagline, "Created by Bhasad.org · Designed by Urvashi Chandan" credit (footer + About page)
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
  styles.css       base responsive visual system
  arcana-reference.css  light-theme visual layer: app shell (header/nav/footer),
                    environment photo wiring, card/panel/accordion styling — loaded
                    after styles.css and wins on any selector collision

public/
  deck/            all 78 Rider-Waite-Smith card images
  images/arcana/
    env/           15 clean environment photos (one per screen — Home, Choose Your
                    Reading, Your Question, Shuffle, Choose Your Cards, Your Card,
                    Your Spread, Detailed Insights, Bigger Picture, My Readings,
                    Daily Insights, Learn Tarot, Profile, Why Arcana, Closing);
                    no baked-in text/UI, referenced from arcana-reference.css as
                    real CSS background layers, never as page screenshots
    home-hero.jpg  dark cinematic backdrop used only by How It Works / About /
                    Why / Thank You, cropped to a text-free corner (see comment
                    in arcana-reference.css for why the crop position matters)

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
