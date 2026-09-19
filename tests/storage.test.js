import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshotReading, saveReading, listReadings, getReading, deleteReading, __setRawForTests } from '../src/storage.js';
import { cards } from '../src/data/cards.js';
import { createReading, drawCard, buildSynthesis } from '../src/engine/tarot.js';

function makeSnapshot(question = 'Should I change direction?') {
  const reading = createReading(question);
  let state = drawCard(reading, 'the-fool', 'Situation');
  state = drawCard(state, 'the-magician', 'Challenge');
  state = drawCard(state, 'the-star', 'Guidance');
  const result = buildSynthesis(state.selected, state.question);
  return snapshotReading({ question: state.question, spreadId: 'question', spreadName: 'The Question', ...result });
}

test('storage: starts empty and is safe when nothing has been saved yet', () => {
  __setRawForTests('');
  assert.deepEqual(listReadings(), []);
});

test('storage: save then list persists a completed reading with its full snapshot', () => {
  __setRawForTests('[]');
  const snap = saveReading(makeSnapshot('Career check'));
  const all = listReadings();
  assert.equal(all.length, 1);
  assert.equal(all[0].id, snap.id);
  assert.equal(all[0].question, 'Career check');
  assert.equal(all[0].cards.length, 3);
  assert.equal(all[0].cards[0].name, 'The Fool');
  assert.ok(all[0].story.length > 0);
});

test('storage: most recently saved reading appears first', () => {
  __setRawForTests('[]');
  saveReading(makeSnapshot('First question'));
  saveReading(makeSnapshot('Second question'));
  const all = listReadings();
  assert.equal(all[0].question, 'Second question');
  assert.equal(all[1].question, 'First question');
});

test('storage: getReading finds a saved reading by id, and revisiting it does not recompute anything', () => {
  __setRawForTests('[]');
  const snap = saveReading(makeSnapshot('Revisit test'));
  const found = getReading(snap.id);
  assert.deepEqual(found, snap);
  assert.equal(getReading('does-not-exist'), null);
});

test('storage: deleteReading removes only the targeted reading', () => {
  __setRawForTests('[]');
  const a = saveReading(makeSnapshot('Keep me'));
  const b = saveReading(makeSnapshot('Delete me'));
  deleteReading(b.id);
  const all = listReadings();
  assert.equal(all.length, 1);
  assert.equal(all[0].id, a.id);
});

test('storage: corrupted JSON in storage is handled safely, not thrown', () => {
  __setRawForTests('{not valid json');
  assert.deepEqual(listReadings(), []);
});

test('storage: non-array JSON in storage is handled safely', () => {
  __setRawForTests('{"oops":"this is an object, not a readings array"}');
  assert.deepEqual(listReadings(), []);
});

test('storage: malformed entries inside an otherwise valid array are dropped, not fatal', () => {
  __setRawForTests(JSON.stringify([{ id: 'good', cards: [] }, { not: 'a reading' }, null, 42]));
  const all = listReadings();
  assert.equal(all.length, 1);
  assert.equal(all[0].id, 'good');
});

test('storage: a saved snapshot is immutable — changing the live card data later does not affect it', () => {
  __setRawForTests('[]');
  const snap = saveReading(makeSnapshot());
  const originalMeaning = snap.cards[0].traditionalMeaning;
  // simulate "live Tarot data changing": the snapshot must not reference the live cards array
  const liveCard = cards.find(c => c.id === snap.cards[0].id);
  liveCard.uprightMeaning = 'MUTATED FOR TEST';
  const reloaded = getReading(snap.id);
  assert.equal(reloaded.cards[0].traditionalMeaning, originalMeaning);
  assert.notEqual(reloaded.cards[0].traditionalMeaning, 'MUTATED FOR TEST');
  liveCard.uprightMeaning = originalMeaning; // restore so other tests in this process aren't affected
});

test('snapshotReading: builds a complete, position-correct immutable record from a real reading', () => {
  const snap = makeSnapshot('Test question');
  assert.equal(snap.spreadId, 'question');
  assert.equal(snap.cards.length, 3);
  assert.deepEqual(snap.cards.map(c => c.position), ['Situation', 'Challenge', 'Guidance']);
  assert.ok(snap.createdAt);
  assert.ok(new Date(snap.createdAt).toString() !== 'Invalid Date');
  assert.ok(typeof snap.id === 'string' && snap.id.length > 0);
});
