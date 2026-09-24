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
export function snapshotReading({ question, spreadId, spreadName, readings, story, themes, reflection, noticings, relationships, agency }) {
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
      everydayLife: r.everydayLife,
      whatToConsider: r.whatToConsider,
    })),
    story,
    themes,
    reflection,
    noticings,
    relationships,
    agency,
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

// A personal journal note the user attaches to a saved reading after the fact — purely
// additive metadata, never fed back into the interpretation engine or any card data.
export function updateReadingNote(id, note) {
  const all = readAll();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], note: note.trim() };
  writeAll(all);
  return all[idx];
}

// Look Again — a later reflection the user attaches to a saved reading when they revisit it.
// Appended to a `lookAgains` array so a reading can carry several reflections over time,
// entirely separate from the original journal `note`, which is never overwritten by this.
export function addLookAgain(id, text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const all = readAll();
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return null;
  const entry = { date: new Date().toISOString(), text: trimmed };
  const lookAgains = [...(all[idx].lookAgains || []), entry];
  all[idx] = { ...all[idx], lookAgains };
  writeAll(all);
  return all[idx];
}

// Daily Card — one card per calendar day, persisted so returning to the app later the
// same day (or after a reload) shows the same card rather than a new random one each
// time. A user-initiated "Draw a Card" explicitly replaces today's card; ARCANA never
// silently swaps it. Stored separately from reading history since it isn't a reading.
const DAILY_KEY = 'arcana.daily.v1';
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
export function getDailyCard() {
  try {
    const raw = store.getItem(DAILY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.day !== todayKey() || typeof parsed.cardIndex !== 'number') return null;
    return parsed.cardIndex;
  } catch {
    return null;
  }
}
// Daily Card History — a small append-only record, one entry per calendar day, kept
// separate from `DAILY_KEY` (which only tracks *today's* pointer) so past days can never
// be overwritten by a later day's card. Reflection text is optional and stored per-day.
const DAILY_HISTORY_KEY = 'arcana.dailyHistory.v1';
function readDailyHistory() {
  try {
    const raw = store.getItem(DAILY_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function writeDailyHistory(list) {
  try {
    store.setItem(DAILY_HISTORY_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}
export function getDailyHistory() {
  return [...readDailyHistory()].sort((a, b) => b.day.localeCompare(a.day));
}
export function setDailyReflection(day, text) {
  const list = readDailyHistory();
  const idx = list.findIndex(e => e.day === day);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], reflection: text.trim() };
  writeDailyHistory(list);
  return list[idx];
}
export function setDailyCard(cardIndex) {
  try {
    const day = todayKey();
    const history = readDailyHistory();
    const idx = history.findIndex(e => e.day === day);
    if (idx === -1) history.push({ day, cardIndex, reflection: '' });
    else history[idx] = { ...history[idx], cardIndex };
    writeDailyHistory(history);
    store.setItem(DAILY_KEY, JSON.stringify({ day, cardIndex }));
    return true;
  } catch {
    return false;
  }
}

// Test-only escape hatch to exercise corrupted/malformed storage without needing a real
// browser localStorage. Not used by any production code path.
export function __setRawForTests(raw) {
  store.setItem(KEY, raw);
}
