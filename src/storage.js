// Local-first persistence for completed readings. No backend, no accounts — everything
// lives in the browser's localStorage (with a graceful in-memory fallback so this module
// also works under Node's test runner, where localStorage doesn't exist).
const KEY = 'arcana.readings.v1';

function memoryStore() {
  let value = null;
  return {
    getItem: () => value,
    setItem: (_, v) => { value = v; },
  };
}

const store = (typeof globalThis.localStorage !== 'undefined') ? globalThis.localStorage : memoryStore();

function readAll() {
  const raw = store.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Defensively drop any entry that doesn't look like a valid snapshot, rather than
    // letting one corrupted record break the whole history list.
    return parsed.filter(r => r && typeof r === 'object' && typeof r.id === 'string' && Array.isArray(r.cards));
  } catch {
    return [];
  }
}

function writeAll(readings) {
  try {
    store.setItem(KEY, JSON.stringify(readings));
    return true;
  } catch {
    // Storage full, disabled, or unavailable (private browsing, quota exceeded, etc.) —
    // fail silently rather than breaking the reading flow the user just completed.
    return false;
  }
}

function makeId() {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Builds an immutable snapshot of a completed reading. Everything the detail view needs
// (question, positions, cards, orientations, the already-computed interpretation) is baked
// in at save time, so revisiting it later never re-derives text from the live card data —
// if card content changes in a future release, previously saved readings stay exactly as
// they were read.
export function snapshotReading({ question, spreadId, spreadName, readings, story, themes, reflection }) {
  return {
    id: makeId(),
    createdAt: new Date().toISOString(),
    question,
    spreadId,
    spreadName,
    cards: readings.map(r => ({
      id: r.card.id,
      name: r.card.name,
      imageCode: r.card.imageCode,
      position: r.position,
      orientation: r.orientation,
      traditionalMeaning: r.traditionalMeaning,
      positionContext: r.positionContext,
      questionContext: r.questionContext,
    })),
    story,
    themes,
    reflection,
  };
}

export function saveReading(snapshot) {
  const all = readAll();
  all.unshift(snapshot);
  writeAll(all);
  return snapshot;
}

export function listReadings() {
  return readAll();
}

export function getReading(id) {
  return readAll().find(r => r.id === id) || null;
}

export function deleteReading(id) {
  const all = readAll().filter(r => r.id !== id);
  writeAll(all);
}

// Test-only escape hatch to exercise corrupted/malformed storage without needing a real
// browser localStorage. Not used by any production code path.
export function __setRawForTests(raw) {
  store.setItem(KEY, raw);
}
