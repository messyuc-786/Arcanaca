import test from 'node:test';
import assert from 'node:assert/strict';
import { cards } from '../src/data/cards.js';
import { buildCardReading } from '../src/engine/tarot.js';

const majors = cards.filter(c => c.arcana === 'Major');
const minors = cards.filter(c => c.arcana === 'Minor');
const suits = ['Wands', 'Cups', 'Swords', 'Pentacles'];
const courtRanks = ['Page', 'Knight', 'Queen', 'King'];

// ---- Dataset shape ----

test('dataset: exactly 78 cards, 22 Major, 56 Minor, 4 suits of 14', () => {
  assert.equal(cards.length, 78);
  assert.equal(majors.length, 22);
  assert.equal(minors.length, 56);
  for (const suit of suits) {
    assert.equal(minors.filter(c => c.suit === suit).length, 14, `${suit} should have 14 cards`);
  }
});

test('dataset: exactly 16 court cards (4 ranks x 4 suits), correctly ranked', () => {
  const courts = minors.filter(c => courtRanks.includes(c.rank));
  assert.equal(courts.length, 16);
  for (const suit of suits) {
    for (const rank of courtRanks) {
      assert.ok(courts.some(c => c.suit === suit && c.rank === rank), `${rank} of ${suit} should exist`);
    }
  }
});

test('dataset: every card id and every card name is unique', () => {
  assert.equal(new Set(cards.map(c => c.id)).size, 78);
  assert.equal(new Set(cards.map(c => c.name)).size, 78);
});

// ---- Card-specificity: the biggest gap identified in the prior report ----

test('specificity: symbolism text is globally unique across all 78 cards (no cross-card boilerplate)', () => {
  const symbolismTexts = cards.map(c => c.symbolism);
  assert.equal(new Set(symbolismTexts).size, 78, 'every card must have its own distinct symbolism, including all 56 Minor Arcana');
});

test('specificity: upright meaning text is globally unique across all 78 cards', () => {
  assert.equal(new Set(cards.map(c => c.uprightMeaning)).size, 78);
});

test('specificity: reversed meaning text is globally unique across all 78 cards', () => {
  assert.equal(new Set(cards.map(c => c.reversedMeaning)).size, 78);
});

test('specificity: court cards of the same rank differ across suits (not a generic personality template)', () => {
  for (const rank of courtRanks) {
    const set = minors.filter(c => c.rank === rank);
    assert.equal(set.length, 4);
    assert.equal(new Set(set.map(c => c.symbolism)).size, 4, `the four ${rank}s must have distinct symbolism`);
    assert.equal(new Set(set.map(c => c.uprightMeaning)).size, 4, `the four ${rank}s must have distinct upright meanings`);
    // the suit's own theme must still be present in each court card's themes/keywords —
    // the rank archetype must not erase the suit's traditional correspondence
    for (const card of set) {
      const suitElement = { Wands: 'Fire', Cups: 'Water', Swords: 'Air', Pentacles: 'Earth' }[card.suit];
      assert.ok(card.uprightThemes.includes(suitElement), `${card.name} should retain its suit's elemental theme (${suitElement})`);
    }
  }
});

test('specificity: minor arcana symbolism is not a mechanical "Suit + rank" formula string', () => {
  for (const card of minors) {
    assert.ok(!/develops the suit's theme of/i.test(card.symbolism), `${card.name} still uses the old suit+rank template symbolism`);
    assert.ok(card.symbolism.length > 40, `${card.name} symbolism should describe actual card imagery, not a short label`);
  }
});

// ---- Reversed meanings are not mechanical negations ----

test('specificity: no reversed meaning is a mechanical "not/blocked + upright" transformation', () => {
  const lazyPatterns = [/^not /i, /^blocked /i, /^opposite of/i, /^lack of /i];
  for (const card of cards) {
    for (const pattern of lazyPatterns) {
      assert.ok(!pattern.test(card.reversedMeaning), `${card.name} reversed meaning "${card.reversedMeaning}" looks like a mechanical negation`);
    }
    assert.notEqual(card.reversedMeaning, `Not ${card.uprightMeaning}`);
  }
});

// ---- Manual representative audit (item 17) — assert traditional RWS content is actually present ----

const representativeChecks = [
  ['the-fool', 'uprightMeaning', /beginning/i],
  ['the-magician', 'uprightMeaning', /will|skill|action/i],
  ['the-lovers', 'uprightMeaning', /union|choice/i],
  ['death', 'uprightMeaning', /transition|transformation|ending/i],
  ['the-tower', 'uprightMeaning', /disruption|revelation|collapse/i],
  ['the-star', 'uprightMeaning', /hope|renewal/i],
  ['the-moon', 'uprightMeaning', /uncertainty|imagination|ambiguity/i],
  ['the-sun', 'uprightMeaning', /clarity|vitality|joy/i],
  ['wands-ace', 'uprightMeaning', /inspiration|creative spark/i],
  ['wands-three', 'uprightMeaning', /expansion|foresight/i],
  ['wands-seven', 'uprightMeaning', /defiance|perseverance/i],
  ['wands-ten', 'uprightMeaning', /burden|overextension/i],
  ['wands-queen', 'uprightMeaning', /confidence|warmth/i],
  ['cups-ace', 'uprightMeaning', /emotional beginning|open.*heart/i],
  ['cups-three', 'uprightMeaning', /celebration|friendship/i],
  ['cups-five', 'uprightMeaning', /grief|loss/i],
  ['cups-seven', 'uprightMeaning', /choices|fantasy/i],
  ['cups-queen', 'uprightMeaning', /emotional depth|compassion/i],
  ['swords-ace', 'uprightMeaning', /clarity|breakthrough/i],
  ['swords-three', 'uprightMeaning', /heartbreak|sorrow/i],
  ['swords-seven', 'uprightMeaning', /strategy|evasion/i],
  ['swords-ten', 'uprightMeaning', /painful ending|rock bottom/i],
  ['swords-king', 'uprightMeaning', /intellectual authority|truth|fair judgment/i],
  ['pentacles-ace', 'uprightMeaning', /material opportunity|prosperity/i],
  ['pentacles-five', 'uprightMeaning', /hardship|exclusion/i],
  ['pentacles-seven', 'uprightMeaning', /patience|assessment/i],
  ['pentacles-ten', 'uprightMeaning', /legacy|generational/i],
  ['pentacles-queen', 'uprightMeaning', /nurturing|groundedness/i],
];
test('manual audit: representative Major and Minor Arcana cards contain their expected traditional meaning', () => {
  for (const [id, field, pattern] of representativeChecks) {
    const card = cards.find(c => c.id === id);
    assert.ok(card, `card ${id} should exist`);
    assert.match(card[field], pattern, `${id}.${field} should match traditional RWS meaning ${pattern}`);
  }
});

test('manual audit: reversed states of representative cards differ meaningfully from upright', () => {
  const ids = ['the-tower', 'the-star', 'wands-ten', 'cups-seven', 'swords-ten', 'pentacles-five', 'cups-queen', 'swords-king'];
  for (const id of ids) {
    const card = cards.find(c => c.id === id);
    const upright = buildCardReading(card, 'Upright', 'Guidance', 'test question');
    const reversed = buildCardReading(card, 'Reversed', 'Guidance', 'test question');
    assert.notEqual(upright.traditionalMeaning, reversed.traditionalMeaning, `${id} upright/reversed must differ`);
    assert.notEqual(upright.keywords.join(','), reversed.keywords.join(','), `${id} upright/reversed keywords must differ`);
  }
});

// ---- Safety: no deterministic / fortune-telling language anywhere in the raw dataset ----

test('safety: no card data contains deterministic fortune-telling language', () => {
  const forbidden = /\bwill definitely\b|\bguaranteed\b|\bconfirms that\b|\bcertainly will\b|\bis cheating\b|\bwill die\b|\bpregnan(t|cy)\b/i;
  for (const card of cards) {
    for (const field of ['uprightMeaning', 'reversedMeaning', 'symbolism']) {
      assert.ok(!forbidden.test(card[field]), `${card.name}.${field} contains deterministic/fortune-telling language`);
    }
  }
});

test('safety: no card data references astrology, zodiac, numerology, or planetary systems', () => {
  const forbidden = /astrology|zodiac|numerology|birth chart|planetary|horoscope/i;
  for (const card of cards) {
    for (const field of ['uprightMeaning', 'reversedMeaning', 'symbolism', 'uprightKeywords', 'reversedKeywords', 'uprightThemes', 'reversedThemes']) {
      const value = Array.isArray(card[field]) ? card[field].join(' ') : card[field];
      assert.ok(!forbidden.test(value), `${card.name}.${field} references astrology/numerology`);
    }
  }
});
