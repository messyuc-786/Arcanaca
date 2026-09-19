# ARCANA Tarot Reading Experience — Design Specification

**Status:** Approved product direction; awaiting written-spec review before implementation.

## Goal
Build ARCANA as a genuine-feeling, traditional Tarot reading web app centered on one core experience: the user asks a question, physically chooses three cards from a complete 78-card Tarot deck, reveals them, and receives a clear reading grounded in each card's traditional meaning, orientation, and spread position.

## Product identity
- Brand: ARCANA
- Tagline: Ask the Cards.
- Product attribution: A product of Bhasad.org
- Coproduct attribution: A Lumina Coproduct
- Tone: mystical, grounded, premium, calm, intelligent, human.
- Visual direction: midnight/charcoal foundation, warm card surfaces, elegant typography, restrained atmospheric texture, fine borders, subtle motion, generous whitespace.
- Avoid: generic AI dashboard styling, excessive gradients/glow, neon purple, glassmorphism, cheesy witch aesthetic.

## Core reading
There is **NO 1-card reading**.

The MVP has exactly one primary reading: **3-Card Reading — Situation · Challenge · Guidance**.

Positions:
1. Situation — what is surrounding the question now.
2. Challenge — tension, blockage, lesson, or influence requiring attention.
3. Guidance — what the Tarot symbolism invites the user to consider.

The user chooses every card. ARCANA must never select cards for the user.

## Tarot integrity
Use the complete 78-card structure: 22 Major Arcana and 56 Minor Arcana (Wands, Cups, Swords, Pentacles; Ace–10 plus Page, Knight, Queen, King).

Every card has stable id, name, arcana, suit where applicable, rank/number, artwork reference, upright keywords, reversed keywords, upright traditional meaning, reversed traditional meaning, and symbolism/context notes where available.

Reading rules:
1. Start from established traditional meaning.
2. Respect the actual orientation.
3. Apply it to the exact spread position.
4. Relate it to the user's stated question.
5. Synthesize the three actual cards without changing their meanings to fit the question.

The engine must not choose cards, swap cards, alter orientation, invent meanings, turn Tarot into horoscope/astrology/zodiac/numerology/birth-chart/generic spiritual advice, present uncertain future events as facts, make medical diagnoses, make legal or financial predictions, or assert unverified claims about another person's behavior, intentions, infidelity, pregnancy, death, etc.

## Reading presentation
For each revealed card show:
- The Card: name, Upright/Reversed, artwork.
- Traditional Meaning: concise and orientation-specific.
- In This Reading: spread-position context.
- In Relation to Your Question: contextualized without certainty.

After all three cards show:
- The Story of Your Spread.
- What the Cards Are Highlighting: 3–5 themes derived from the three cards.
- Reflect On This: 2–3 reflective questions.

## User flow
1. Landing/Home
2. Ask Your Question
3. 3-Card Reading introduction / position explanation
4. Shuffle deck
5. Interactive face-down 78-card deck
6. Select Card 1
7. Reveal Card 1
8. Select Card 2
9. Reveal Card 2
10. Select Card 3
11. Reveal Card 3
12. Complete Spread
13. Card-by-card reading
14. Overall synthesis
15. Reflection
16. Packages
17. Restart reading

Supporting screens: About; How It Works.

Language: English and हिंदी. Hindi copy should be natural and human, not literal machine translation.

## Packages
Packages appear after the core reading and are modeled as real Tarot experiences, not alternate AI prompts.

Initial package definitions:
- The Question — focused 3-card reading.
- The Connection — relationship-focused spread.
- The Path — career/work-focused spread.
- The Crossroads — decision/choice spread.
- The Year Ahead — extended multi-card spread.
- Deep Dive — advanced spread with deeper interpretation.

Each package defines: **question type → spread → positions → card count → interpretation rules**.

Package implementation can be staged after the core 3-card MVP; the architecture must make package definitions data-driven.

## Architecture
Recommended stack: React, TypeScript, Vite, Tailwind CSS.

Keep the MVP client-simple. No unnecessary backend.

Suggested boundaries:
- `data/` — canonical 78-card definitions and package definitions.
- `engine/` — shuffle, orientation, selection, spread validation, interpretation assembly.
- `components/` — reusable deck, card, spread, reveal, reading, navigation, language controls.
- `pages/` — route-level screens.
- `i18n/` — English/Hindi strings.
- `tests/` — engine and flow tests.

AI interpretation, if connected later, must receive the already-selected cards, their orientations, canonical meanings, spread positions, and user question. It must not receive authority to choose or modify cards.

For the initial runnable build, provide a deterministic local interpretation layer so the app works without an API key. Keep the interpretation interface replaceable with a secure server-side AI provider later.

## Artwork
The application should support authentic Tarot artwork for all 78 cards through local assets.

Do not bundle random copyrighted scans without licensing. Use artwork only when its licensing permits redistribution, otherwise provide a clearly documented asset replacement path.

The card back should be consistent across the deck.

## Accessibility and responsive behavior
- Mobile-first.
- Large touch targets.
- Keyboard-accessible deck selection where practical.
- Visible focus states.
- Escape closes dialogs.
- Respect reduced-motion preferences.
- Readable contrast.
- Do not rely on animation alone to communicate orientation.

## Definition of done for the first implementation
- ARCANA branding.
- Home, question, spread intro, shuffle, selection, reveal, spread, reading, About, and How It Works screens.
- No 1-card reading exists.
- Complete 78-card data model.
- Fresh shuffle.
- Three unique user-selected cards.
- Independent randomized orientation.
- Licensed artwork where available.
- Traditional upright/reversed meanings.
- Reading based on card + orientation + position + question.
- Final synthesis using only the selected cards.
- English/Hindi.
- Restart.
- Responsive desktop/mobile.
- Core engine tests.
- Passing build.
- README covering setup, architecture, Tarot data, artwork licensing, and future AI integration.

## Product philosophy
> The user brings the question.
> The user chooses the cards.
> The Tarot provides the symbolism.
> ARCANA provides the interpretation.
