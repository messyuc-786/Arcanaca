import test from 'node:test';
import assert from 'node:assert/strict';
import { cards } from '../src/data/cards.js';
import { packages } from '../src/data/packages.js';
import { createPackageReading, drawPackageCard, buildPackageSynthesis, buildCardReading } from '../src/engine/tarot.js';

// ---- 78-card data audit ----

test('audit: every card has a number, and numbers are correct per arcana', () => {
  const majors = cards.filter(c => c.arcana === 'Major').sort((a, b) => a.number - b.number);
  assert.deepEqual(majors.map(c => c.number), Array.from({ length: 22 }, (_, i) => i), 'majors should be numbered 0-21 in RWS order');
  const minorsBySuit = {};
  for (const c of cards.filter(c => c.arcana === 'Minor')) {
    (minorsBySuit[c.suit] ||= []).push(c.number);
  }
  for (const [suit, numbers] of Object.entries(minorsBySuit)) {
    assert.deepEqual(numbers.slice().sort((a, b) => a - b), Array.from({ length: 14 }, (_, i) => i + 1), `${suit} should have numbers 1-14 (Ace..King)`);
  }
});

test('audit: every card has structured upright and reversed data (keywords, meaning, themes)', () => {
  for (const card of cards) {
    assert.ok(Array.isArray(card.uprightKeywords) && card.uprightKeywords.length > 0, `${card.name} missing upright keywords`);
    assert.ok(Array.isArray(card.reversedKeywords) && card.reversedKeywords.length > 0, `${card.name} missing reversed keywords`);
    assert.ok(typeof card.uprightMeaning === 'string' && card.uprightMeaning.length > 0, `${card.name} missing upright meaning`);
    assert.ok(typeof card.reversedMeaning === 'string' && card.reversedMeaning.length > 0, `${card.name} missing reversed meaning`);
    assert.notEqual(card.uprightMeaning, card.reversedMeaning, `${card.name} upright/reversed meaning must differ`);
    assert.ok(Array.isArray(card.uprightThemes) && card.uprightThemes.length > 0, `${card.name} missing upright themes`);
    assert.ok(Array.isArray(card.reversedThemes) && card.reversedThemes.length > 0, `${card.name} missing reversed themes`);
    assert.ok(typeof card.symbolism === 'string' && card.symbolism.length > 10, `${card.name} missing symbolism`);
  }
});

test('audit: major arcana symbolism is distinct per card, not a generic template', () => {
  const majors = cards.filter(c => c.arcana === 'Major');
  const symbolismTexts = majors.map(c => c.symbolism);
  assert.equal(new Set(symbolismTexts).size, majors.length, 'every major arcana card should have unique symbolism text');
  // the pre-Phase-3 defect was a single boilerplate sentence reused for every major card
  for (const card of majors) {
    assert.ok(!/carries a major life-theme archetype/i.test(card.symbolism), `${card.name} still has the old generic symbolism placeholder`);
  }
});

test('audit: reversed meanings are not just the upright meaning with a negative word prepended', () => {
  for (const card of cards) {
    const upFirstWord = card.uprightMeaning.split(/[ ,]/)[0].toLowerCase();
    assert.notEqual(card.reversedMeaning.toLowerCase(), `blocked ${card.uprightMeaning.toLowerCase()}`);
    assert.ok(card.reversedMeaning.toLowerCase() !== `not ${card.uprightMeaning.toLowerCase()}`, `${card.name} reversed meaning is a lazy negation`);
  }
});

// ---- Interpretation layers stay separate ----

test('layers: traditional meaning, position context, and question context are distinct text', () => {
  const card = cards.find(c => c.id === 'the-hermit');
  const r = buildCardReading(card, 'Upright', 'Guidance', 'Should I change my career?');
  assert.notEqual(r.traditionalMeaning, r.positionContext);
  assert.notEqual(r.traditionalMeaning, r.questionContext);
  assert.notEqual(r.positionContext, r.questionContext);
  // traditional meaning must come verbatim from the card's own canonical data
  assert.equal(r.traditionalMeaning, card.uprightMeaning);
});

test('layers: the question never overrides the traditional meaning (no forced deterministic claim)', () => {
  const card = cards.find(c => c.id === 'the-hermit');
  const r = buildCardReading(card, 'Upright', 'Guidance', 'Should I quit my job immediately?');
  assert.equal(r.traditionalMeaning, card.uprightMeaning, 'traditional meaning is unaffected by the question');
  assert.ok(!/you should/i.test(r.questionContext), 'question context must not issue a direct instruction');
  assert.ok(!/definitely|guaranteed|certainly will/i.test(r.interpretation), 'no deterministic claim language');
});

test('layers: the same card in different spread positions produces different position context', () => {
  const card = cards.find(c => c.id === 'the-tower');
  const asChallenge = buildCardReading(card, 'Upright', 'Challenge', 'q');
  const asGuidance = buildCardReading(card, 'Upright', 'Guidance', 'q');
  const asOpportunity = buildCardReading(card, 'Upright', 'Opportunity', 'q');
  assert.notEqual(asChallenge.positionContext, asGuidance.positionContext);
  assert.notEqual(asGuidance.positionContext, asOpportunity.positionContext);
  // and the traditional meaning stays identical regardless of position
  assert.equal(asChallenge.traditionalMeaning, asGuidance.traditionalMeaning);
});

test('layers: orientation is respected and immutable — building a reading never mutates the card', () => {
  const card = cards.find(c => c.id === 'the-star');
  const frozenUpright = card.uprightMeaning, frozenReversed = card.reversedMeaning;
  buildCardReading(card, 'Reversed', 'Situation', 'q');
  buildCardReading(card, 'Upright', 'Situation', 'q');
  assert.equal(card.uprightMeaning, frozenUpright);
  assert.equal(card.reversedMeaning, frozenReversed);
});

// ---- Cross-card synthesis considers the whole spread ----

test('synthesis: considers every card in a large spread, not just the first one', () => {
  const definition = packages.find(p => p.id === 'year');
  let reading = createPackageReading('What should this year focus on?', definition);
  const chosen = ['the-fool', 'the-magician', 'the-star', 'wands-ace', 'cups-ace', 'swords-ace', 'pentacles-ace', 'wands-two', 'cups-two', 'swords-two', 'pentacles-two', 'wands-three'];
  for (const id of chosen) reading = drawPackageCard(reading, id);
  const result = buildPackageSynthesis(reading);
  assert.equal(result.readings.length, 12);
  // three Major Arcana cards were drawn — the story must reflect that count, not just card #1
  assert.match(result.story, /3 of the 12 cards/);
  assert.match(result.story, /The Fool/);
  assert.match(result.story, /The Magician/);
  assert.match(result.story, /The Star/);
});

test('synthesis: detects a recurring theme shared by multiple cards', () => {
  const definition = packages.find(p => p.id === 'question');
  let reading = createPackageReading('q', definition);
  reading = drawPackageCard(reading, 'wands-ace');
  reading = drawPackageCard(reading, 'wands-two');
  reading = drawPackageCard(reading, 'the-star');
  const result = buildPackageSynthesis(reading);
  assert.ok(result.themes.includes('Fire') || result.themes.includes('Action') || result.themes.includes('Creativity'), 'shared Wands theme should surface in highlights');
});

// ---- All six packages work end to end with the interpretation engine ----

test('all six packages produce a full, position-correct reading with no duplicates', () => {
  for (const definition of packages) {
    let reading = createPackageReading(`Testing ${definition.name}`, definition);
    for (let i = 0; i < definition.cards; i++) {
      const next = reading.deck.find(c => !reading.selected.some(s => s.id === c.id));
      reading = drawPackageCard(reading, next.id);
    }
    assert.equal(reading.selected.length, definition.cards, `${definition.id} should have exactly ${definition.cards} cards`);
    assert.equal(new Set(reading.selected.map(c => c.id)).size, definition.cards, `${definition.id} must have no duplicate cards`);
    const result = buildPackageSynthesis(reading);
    assert.equal(result.readings.length, definition.cards);
    assert.deepEqual(result.readings.map(r => r.position), definition.positions);
    for (const r of result.readings) {
      assert.notEqual(r.traditionalMeaning, r.positionContext, `${definition.id}: layers must stay separate`);
    }
  }
});
