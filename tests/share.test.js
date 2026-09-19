import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSharePayload, encodeShareLink, decodeShareHash, isShareHash } from '../src/share.js';
import { snapshotReading } from '../src/storage.js';
import { createReading, drawCard, buildSynthesis } from '../src/engine/tarot.js';

function makeSnapshot(question = 'Should I change direction?') {
  const reading = createReading(question);
  let state = drawCard(reading, 'the-fool', 'Situation');
  state = drawCard(state, 'the-magician', 'Challenge');
  state = drawCard(state, 'the-star', 'Guidance');
  const result = buildSynthesis(state.selected, state.question);
  return snapshotReading({ question: state.question, spreadId: 'question', spreadName: 'The Question', ...result });
}

test('share: encode then decode round-trips the reading data exactly', () => {
  const snap = makeSnapshot('Career question');
  const payload = buildSharePayload(snap);
  const link = encodeShareLink(payload, 'https://example.test/');
  assert.match(link, /^https:\/\/example\.test\/#\/shared\?d=/);
  const hash = link.slice('https://example.test/'.length);
  const decoded = decodeShareHash(hash);
  assert.equal(decoded.q, 'Career question');
  assert.equal(decoded.s, 'The Question');
  assert.equal(decoded.c.length, 3);
  assert.equal(decoded.c[0].n, 'The Fool');
  assert.equal(decoded.c[0].p, 'Situation');
  assert.equal(decoded.story, snap.story);
});

test('share: privacy control — question can be excluded from the link', () => {
  const snap = makeSnapshot('A very private question');
  const payload = buildSharePayload(snap, { includeQuestion: false });
  const link = encodeShareLink(payload, 'https://example.test/');
  assert.ok(!link.includes(Buffer.from('A very private question').toString('base64').replace(/=+$/, '')));
  const decoded = decodeShareHash(link.slice('https://example.test/'.length));
  assert.equal(decoded.q, '');
});

test('share: only the shared reading itself is encoded, nothing about other readings or an account', () => {
  const snap = makeSnapshot();
  const payload = buildSharePayload(snap);
  assert.deepEqual(Object.keys(payload).sort(), ['c', 'q', 's', 'story', 'themes']);
});

test('share: decoding a non-share hash returns null, not a throw', () => {
  assert.equal(decodeShareHash('#/some-other-route'), null);
  assert.equal(decodeShareHash(''), null);
  assert.equal(decodeShareHash(undefined), null);
});

test('share: decoding a corrupted or tampered share hash fails safely', () => {
  assert.equal(decodeShareHash('#/shared?d=not-valid-base64-json!!!'), null);
  assert.equal(decodeShareHash('#/shared?d='), null);
});

test('share: isShareHash correctly identifies share links vs other routes', () => {
  assert.equal(isShareHash('#/shared?d=abc'), true);
  assert.equal(isShareHash('#/other'), false);
  assert.equal(isShareHash(''), false);
});

test('share: main.js handles a share link opened while the app is already running, not just on cold load', async () => {
  const { readFile } = await import('node:fs/promises');
  const mainSrc = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.match(mainSrc, /addEventListener\('hashchange'/, 'a hashchange listener should re-check for a share link, since a same-tab hash change does not reload the page');
});

test('share: round-trips card names containing unicode punctuation without corruption', () => {
  const snap = makeSnapshot('“Curly quotes” and — dashes, and देवनागरी too');
  const payload = buildSharePayload(snap);
  const link = encodeShareLink(payload, 'https://example.test/');
  const decoded = decodeShareHash(link.slice('https://example.test/'.length));
  assert.equal(decoded.q, '“Curly quotes” and — dashes, and देवनागरी too');
});
