import test from 'node:test';
import assert from 'node:assert/strict';
import { cards } from '../src/data/cards.js';
import { createReading, drawCard, shuffleDeck, buildCardReading, buildSynthesis, createPackageReading, drawPackageCard, buildPackageSynthesis } from '../src/engine/tarot.js';
import { packages } from '../src/data/packages.js';

test('canonical deck contains exactly 78 unique cards', () => {
  assert.equal(cards.length, 78);
  assert.equal(new Set(cards.map(c => c.id)).size, 78);
  assert.equal(cards.filter(c => c.arcana === 'Major').length, 22);
  assert.equal(cards.filter(c => c.arcana === 'Minor').length, 56);
});

test('major arcana keywords are short traditional descriptors, not full sentences', () => {
  const majors = cards.filter(c => c.arcana === 'Major');
  for (const card of majors) {
    assert.ok(card.uprightKeywords.length > 0, `${card.name} has upright keywords`);
    assert.ok(card.reversedKeywords.length > 0, `${card.name} has reversed keywords`);
    for (const kw of [...card.uprightKeywords, ...card.reversedKeywords]) {
      assert.ok(kw.split(' ').length <= 4, `${card.name} keyword "${kw}" reads like a sentence, not a keyword`);
    }
  }
});

test('fresh reading shuffles and selects three unique cards only when user draws them', () => {
  const reading = createReading('What should I understand about my work?');
  assert.equal(reading.deck.length, 78);
  assert.deepEqual(reading.selected, []);
  const one = drawCard(reading, cards[0].id, 'Situation');
  const two = drawCard(one, cards[1].id, 'Challenge');
  const three = drawCard(two, cards[2].id, 'Guidance');
  assert.equal(three.selected.length, 3);
  assert.equal(new Set(three.selected.map(c => c.id)).size, 3);
  assert.equal(three.selected[0].position, 'Situation');
});

test('card reading uses orientation-specific canonical meaning', () => {
  const card = cards.find(c => c.name === 'The Star');
  const upright = buildCardReading(card, 'Upright', 'Guidance', 'What should I focus on?');
  const reversed = buildCardReading(card, 'Reversed', 'Guidance', 'What should I focus on?');
  assert.notEqual(upright.traditionalMeaning, reversed.traditionalMeaning);
  assert.match(reversed.traditionalMeaning, /discouragement|delay|doubt/i);
});

test('synthesis references only the three selected cards', () => {
  const reading = createReading('What should I understand?');
  let state = drawCard(reading, 'the-fool', 'Situation');
  state = drawCard(state, 'the-magician', 'Challenge');
  state = drawCard(state, 'the-star', 'Guidance');
  const synthesis = buildSynthesis(state.selected, state.question);
  assert.match(synthesis.story, /The Fool/);
  assert.match(synthesis.story, /The Magician/);
  assert.match(synthesis.story, /The Star/);
  assert.ok(synthesis.themes.length >= 3);
});


test('package reading uses the package positions and exact card count', () => {
  const definition = packages.find(p => p.id === 'connection');
  const reading = createPackageReading('What should I understand about this connection?', definition);
  assert.equal(reading.packageId, 'connection');
  assert.equal(reading.positions.length, 5);
  assert.deepEqual(reading.positions, definition.positions);
  assert.equal(reading.selected.length, 0);
});

test('package drawing prevents duplicates and stops at the package card count', () => {
  const definition = packages.find(p => p.id === 'path');
  let reading = createPackageReading('What should I understand about work?', definition);
  reading = drawPackageCard(reading, cards[0].id);
  assert.throws(() => drawPackageCard(reading, cards[0].id), /already selected/i);
  for (let i = 1; i < definition.cards; i++) reading = drawPackageCard(reading, cards[i].id);
  assert.equal(reading.selected.length, definition.cards);
  assert.throws(() => drawPackageCard(reading, cards[definition.cards].id), /complete/i);
});

test('package synthesis preserves the selected cards and package positions', () => {
  const definition = packages.find(p => p.id === 'question');
  let reading = createPackageReading('What should I understand?', definition);
  reading = drawPackageCard(reading, 'the-fool');
  reading = drawPackageCard(reading, 'the-magician');
  reading = drawPackageCard(reading, 'the-star');
  const result = buildPackageSynthesis(reading);
  assert.equal(result.readings.length, 3);
  assert.deepEqual(result.readings.map(r => r.position), definition.positions);
  assert.match(result.story, /The Fool/);
  assert.match(result.story, /The Magician/);
  assert.match(result.story, /The Star/);
});
