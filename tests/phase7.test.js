import test from 'node:test';
import assert from 'node:assert/strict';
import { packages } from '../src/data/packages.js';
import { createPackageReading, drawPackageCard, buildPackageSynthesis, buildCardReading } from '../src/engine/tarot.js';
import { cards } from '../src/data/cards.js';

test('spread engine: every package is internally valid (card count matches position count, no 1-card spread, unique id)', () => {
  for (const p of packages) {
    assert.equal(p.cards, p.positions.length, `${p.id}: cards count must match positions length`);
    assert.notEqual(p.cards, 1, `${p.id}: no package may be a one-card reading`);
    assert.ok(typeof p.id === 'string' && p.id.length > 0);
    assert.ok(typeof p.category === 'string' && p.category.length > 0, `${p.id}: should carry a category`);
  }
  assert.equal(new Set(packages.map(p => p.id)).size, packages.length, 'package ids must be unique');
});

test('spread engine: the original six packages are unchanged (ids, card counts, and positions)', () => {
  const original = {
    question: { cards: 3, positions: ['Question', 'Challenge', 'Guidance'] },
    connection: { cards: 5, positions: ['You', 'The Other', 'The Dynamic', 'The Tension', 'The Guidance'] },
    path: { cards: 5, positions: ['Current Ground', 'Strength', 'Obstacle', 'Opportunity', 'Guidance'] },
    crossroads: { cards: 5, positions: ['Current Situation', 'Option A', 'Option B', 'What to Consider', 'Guidance'] },
    year: { cards: 12, positions: ['January','February','March','April','May','June','July','August','September','October','November','December'] },
    'deep-dive': { cards: 10, positions: ['Core','Challenge','Root','Past','Present','Near Influence','Self','Environment','Hope/Fear','Guidance'] },
  };
  for (const [id, expected] of Object.entries(original)) {
    const p = packages.find(x => x.id === id);
    assert.ok(p, `${id} should still exist`);
    assert.equal(p.cards, expected.cards, `${id}: card count changed`);
    assert.deepEqual(p.positions, expected.positions, `${id}: positions changed`);
  }
});

test('spread engine: categories cover relationship, decision, career, and self-reflection', () => {
  const categories = new Set(packages.map(p => p.category));
  for (const expected of ['relationship', 'decision', 'career', 'self-reflection']) {
    assert.ok(categories.has(expected), `no package is categorized as "${expected}"`);
  }
});

test('spread engine: package screens render generically from data, with no per-package-id branching', async () => {
  const { readFile } = await import('node:fs/promises');
  const mainSrc = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  const renderFnNames = ['packageScreen', 'packageQuestion', 'packageSelect', 'packageReveal', 'packageReading'];
  const lines = mainSrc.split('\n').filter(line => renderFnNames.some(name => line.startsWith(`function ${name}(`)));
  assert.equal(lines.length, renderFnNames.length, 'expected to find all five package screen render functions, one per line');
  for (const line of lines) {
    for (const p of packages) {
      assert.ok(!line.includes(`'${p.id}'`), `a package render function should not special-case package id "${p.id}" — it must render generically from the package definition`);
    }
  }
});

test('new spread: The Celtic Cross runs end to end through the generic package engine with no duplicates', () => {
  const definition = packages.find(p => p.id === 'celtic-cross');
  assert.ok(definition, 'celtic-cross package should exist');
  assert.equal(definition.cards, 10);
  let reading = createPackageReading('What does this situation ask of me?', definition);
  for (let i = 0; i < definition.cards; i++) {
    const next = reading.deck.find(c => !reading.selected.some(s => s.id === c.id));
    reading = drawPackageCard(reading, next.id);
  }
  assert.equal(reading.selected.length, 10);
  assert.equal(new Set(reading.selected.map(c => c.id)).size, 10, 'no duplicate cards in the Celtic Cross');
  const result = buildPackageSynthesis(reading);
  assert.equal(result.readings.length, 10);
  assert.deepEqual(result.readings.map(r => r.position), definition.positions);
});

test('new spread: every one of the ten Celtic Cross positions gets genuine, distinct contextual framing (not the generic fallback)', () => {
  const definition = packages.find(p => p.id === 'celtic-cross');
  const card = cards.find(c => c.id === 'the-tower');
  const contexts = definition.positions.map(position => buildCardReading(card, 'Upright', position, 'q').positionContext);
  contexts.forEach((ctx, i) => {
    assert.ok(!ctx.includes('the focus of this specific position'), `"${definition.positions[i]}" fell back to the generic position text — add a position rule for it`);
  });
  // most positions should be meaningfully distinct from each other, not all collapsing to one role
  assert.ok(new Set(contexts).size >= 6, 'Celtic Cross positions should map to several distinct interpretive roles, not just one or two');
});

test('layers: a position label that already starts with "The" does not produce a double article ("In the The X position")', () => {
  const card = cards.find(c => c.id === 'the-tower');
  for (const position of ['The Challenge', 'The Dynamic', 'The Other', 'The Guidance', 'The Outcome', 'The Foundation']) {
    const ctx = buildCardReading(card, 'Upright', position, 'q').positionContext;
    assert.ok(!/In the The /i.test(ctx), `"${position}" produced a double article: "${ctx}"`);
  }
});
