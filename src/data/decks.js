// Deck registry — the artwork/presentation layer, kept deliberately separate from card
// identity and meaning (src/data/cards.js) and from card-selection mechanics
// (src/engine/tarot.js). Switching decks only changes which images are shown; it can
// never affect the shuffle, which cards exist, or how a card is drawn.
//
// Only properly-licensed, complete, reliably card-identified decks are registered here.
// A second deck (e.g. a public-domain Tarot de Marseille) was investigated for this phase
// but no complete, cleanly-labeled 78-card source could be verified within this pass — see
// README "Next planned phase". Shipping a deck with missing or misidentified cards would be
// worse than shipping one deck well, so only the default is registered for now. The engine
// below is deck-count-agnostic: adding a second deck later is a one-entry addition here plus
// its downloaded artwork, nothing else changes.
export const decks = [
  {
    id: 'rws',
    name: 'Rider-Waite-Smith',
    shortName: 'RWS',
    year: '1909',
    description: 'The classic Pamela Colman Smith / Arthur Edward Waite deck — the canonical tradition ARCANA\'s interpretations are grounded in.',
    license: 'Public domain (US) — see public/README.md for source and attribution.',
    basePath: 'public/deck',
  },
];

export const DEFAULT_DECK_ID = 'rws';

export function getDeck(deckId) {
  return decks.find(d => d.id === deckId) || decks.find(d => d.id === DEFAULT_DECK_ID);
}

export function isValidDeckId(deckId) {
  return decks.some(d => d.id === deckId);
}
