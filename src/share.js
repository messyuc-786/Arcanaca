// Shareable readings, entirely client-side: the reading data is encoded into the URL's
// hash fragment itself. There is no backend, no server-side storage, and no account —
// the link IS the data. Hash fragments are never sent to a server on navigation, so
// sharing a reading never transmits it anywhere ARCANA doesn't already run.
//
// This also makes privacy trivial to reason about: nothing is stored, so there is no
// "someone else's reading" to ever leak — the only choice a user makes is whether their
// own question text is included in the link they hand out.
const HASH_PREFIX = '#/shared?d=';

function toBase64Url(str) {
  const b64 = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(str))) : Buffer.from(str, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64Url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - (str.length % 4 || 4)) % 4, '=');
  return typeof atob === 'function' ? decodeURIComponent(escape(atob(b64))) : Buffer.from(b64, 'base64').toString('utf8');
}

// Builds the shareable payload — a trimmed-down version of a reading snapshot. Card
// identity, orientation, position, and the already-computed interpretation are included;
// the user's question is optional (privacy control).
export function buildSharePayload(snapshot, { includeQuestion = true } = {}) {
  return {
    q: includeQuestion ? snapshot.question : '',
    s: snapshot.spreadName,
    c: snapshot.cards.map(c => ({ n: c.name, p: c.position, o: c.orientation, m: c.traditionalMeaning, pc: c.positionContext })),
    story: snapshot.story,
    themes: snapshot.themes,
  };
}

export function encodeShareLink(payload, origin = (typeof location !== 'undefined' ? location.origin + location.pathname : '')) {
  const encoded = toBase64Url(JSON.stringify(payload));
  return `${origin}${HASH_PREFIX}${encoded}`;
}

// Returns the decoded payload, or null if the hash isn't a share link or the data is
// corrupted/malformed — callers must treat null as "show a retrieval-failed state",
// never throw a raw error to the user.
export function decodeShareHash(hash) {
  if (!hash || !hash.startsWith(HASH_PREFIX)) return null;
  const encoded = hash.slice(HASH_PREFIX.length);
  try {
    const parsed = JSON.parse(fromBase64Url(encoded));
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.c) || parsed.c.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isShareHash(hash) {
  return typeof hash === 'string' && hash.startsWith(HASH_PREFIX);
}
