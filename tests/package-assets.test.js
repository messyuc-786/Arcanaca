import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,statSync} from 'node:fs';
import {cards,cardImageUrl} from '../src/data/cards.js';
import {packages} from '../src/data/packages.js';
test('every card has an artwork mapping and no package is a one-card reading',()=>{assert.equal(cards.every(c=>cardImageUrl(c).includes(c.imageCode)),true);assert.equal(packages.every(p=>p.cards!==1),true);assert.ok(packages.length>=6,'the original six packages plus any Phase 7 additions')})

test('every card image is bundled locally in public/deck and is not empty', () => {
  for (const card of cards) {
    const path = new URL(`../public/deck/${card.imageCode}.jpg`, import.meta.url);
    assert.ok(existsSync(path), `${card.name}: public/deck/${card.imageCode}.jpg is missing`);
    assert.ok(statSync(path).size > 1000, `${card.name}: public/deck/${card.imageCode}.jpg looks empty/truncated`);
  }
});

test('card artwork is served from the local deck folder, not a third-party host', () => {
  assert.match(cardImageUrl(cards[0]), /^\/public\/deck\//);
  assert.ok(!/https?:\/\//.test(cardImageUrl(cards[0])), 'card artwork must not depend on a remote host at runtime');
});

test('package catalog exposes a real spread action and package-specific screens', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(source, /data-package-id/);
  assert.match(source, /package-select/);
  assert.match(source, /package-reveal/);
  assert.match(source, /buildPackageSynthesis/);
});


test('package styles define a compact position rail and responsive package spread summary', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(source, /\.package-positions/);
  assert.match(source, /\.package-spread-summary/);
});

test('every screen name assignable to state.screen has a matching render dispatch key', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  const renderLine = source.split('\n').find(line => line.startsWith('function render('));
  const assignedScreens = [...source.matchAll(/state\.screen\s*=\s*'([a-z-]+)'/g)].map(m => m[1]);
  assert.ok(assignedScreens.length > 0, 'expected to find state.screen assignments in main.js');
  for (const screen of new Set(assignedScreens)) {
    const isBareKey = new RegExp(`[{,]\\s*${screen}\\s*[,:}]`).test(renderLine);
    const isQuotedKey = renderLine.includes(`'${screen}':`);
    assert.ok(isBareKey || isQuotedKey, `render() has no dispatch entry for screen '${screen}' — it will silently fall back to home`);
  }
});
