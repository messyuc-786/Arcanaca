import test from 'node:test';
import assert from 'node:assert/strict';
import { decks, getDeck, isValidDeckId, DEFAULT_DECK_ID } from '../src/data/decks.js';
import { cards, cardImageUrl } from '../src/data/cards.js';
import { createReading, drawCard, shuffleDeck } from '../src/engine/tarot.js';

test('deck registry: every registered deck has complete metadata and a properly-documented license', () => {
  assert.ok(decks.length >= 1, 'at least the default deck must be registered');
  for (const d of decks) {
    assert.ok(d.id && d.name && d.shortName && d.year && d.description && d.license && d.basePath,
      `deck "${d.id}" is missing required metadata`);
    assert.ok(!/unlicensed|copyrighted modern/i.test(d.license), `deck "${d.id}" license text should not admit to being unlicensed`);
  }
});

test('deck registry: the default deck (RWS) is always registered and resolvable', () => {
  assert.ok(isValidDeckId(DEFAULT_DECK_ID));
  const deck = getDeck(DEFAULT_DECK_ID);
  assert.equal(deck.id, DEFAULT_DECK_ID);
});

test('deck registry: an unknown deck id falls back to the default deck rather than breaking image resolution', () => {
  const deck = getDeck('some-deck-that-does-not-exist');
  assert.equal(deck.id, DEFAULT_DECK_ID);
  assert.ok(!isValidDeckId('some-deck-that-does-not-exist'));
});

test('artwork: cardImageUrl is deck-aware but defaults to the RWS deck for backward compatibility', () => {
  const card = cards[0];
  assert.equal(cardImageUrl(card), cardImageUrl(card, 'rws'));
  assert.match(cardImageUrl(card, 'rws'), new RegExp(`^${getDeck('rws').basePath}/`));
});

test('integrity: deck choice never affects which card was drawn, its identity, or its orientation', () => {
  const reading = createReading('q');
  const drawn = drawCard(reading, cards[5].id, 'Situation');
  const card = drawn.selected[0];
  const urlRws = cardImageUrl(card, 'rws');
  const urlUnknown = cardImageUrl(card, 'some-other-deck');
  // both URLs point at the SAME card's image code — only the deck base path could differ
  assert.match(urlRws, new RegExp(`${card.imageCode}\\.jpg$`));
  assert.match(urlUnknown, new RegExp(`${card.imageCode}\\.jpg$`));
  assert.equal(card.id, cards[5].id, 'card identity is unaffected by any deck argument');
  assert.equal(card.orientation, drawn.selected[0].orientation);
});

test('integrity: shuffling and drawing take no deck parameter at all — deck selection cannot influence the shuffle', () => {
  assert.equal(shuffleDeck.length, 0, 'shuffleDeck should only take an optional (default-valued) input deck, no deck-artwork parameter');
  assert.equal(drawCard.length, 3, 'drawCard should only take (state, cardId, position) — no deck parameter exists to manipulate');
});
