// Themes — a lightweight, deterministic pass over the user's own saved readings that notices
// which broad reflective categories keep recurring. No AI, no external data, no persisted
// calculation: always derived fresh from `listReadings()` so it auto-updates on save/delete.
import {cards} from '../data/cards.js';

const CATEGORY_MATCHERS = {
  Relationships: ['relationship','love','romance','connection','disconnection','reconnection','isolation','belonging','community','teamwork','codependence','reciprocity','union','exclusion','rivalry'],
  Decisions: ['decision','choice','choosing','evaluation','discernment'],
  Change: ['change','transformation','transition','renewal','turning point','upheaval','disrupted cycle'],
  Direction: ['direction','path','vision','focus','ambition','drive','momentum'],
  Confidence: ['confidence','self-assurance','self-doubt','insecurity','empowerment','overconfidence','pride','courage'],
  Boundaries: ['boundary','boundaries','restriction','withholding','possessiveness','domination','independence','constraint'],
  Patience: ['patience','impatience','stillness','restlessness','waiting'],
  Communication: ['communication','honesty','truth','misinformation','clarity','secret'],
  'New Beginnings': ['new beginning','beginning','innocent trust','leap of faith','potential','awakening','youthful energy'],
  Reflection: ['reflection','introspection','reevaluation','perspective','self-criticism'],
  Stability: ['stability','instability','balance','imbalance','structure','routine','stagnation','rigidity'],
  'Letting Go': ['letting go','release','surrender','detachment','grief','mourning','withdrawal'],
  Growth: ['growth','healing','recovery','recuperation','resilience','mastery','wisdom','vitality'],
  Uncertainty: ['uncertainty','confusion','ambiguity','doubt','chaos','volatility'],
};

const REFLECT_QUESTIONS = {
  Relationships: 'What do you need to understand about the people this theme touches?',
  Decisions: 'What would help you feel more at peace with a decision you’re facing?',
  Change: 'What feels ready to change, even if you haven’t decided what comes next?',
  Direction: 'What direction have you been circling back to, even without saying it outright?',
  Confidence: 'Where might a little more self-trust change how this feels?',
  Boundaries: 'What boundary might be asking for your attention right now?',
  Patience: 'What would it look like to give this more time than you’d like to?',
  Communication: 'What have you been leaving unsaid?',
  'New Beginnings': 'What beginning have you been circling without fully starting?',
  Reflection: 'What keeps drawing your attention back to this?',
  Stability: 'What would help this situation feel more steady?',
  'Letting Go': 'What might you be ready to set down, even partially?',
  Growth: 'What has this recurring theme already taught you?',
  Uncertainty: 'What feels hardest to know for certain right now, and is that okay for now?',
};

function matchCategories(themeWord) {
  const lower = themeWord.toLowerCase();
  return Object.keys(CATEGORY_MATCHERS).filter(cat => CATEGORY_MATCHERS[cat].some(s => lower.includes(s)));
}

// Returns only themes that recur across at least two distinct saved readings — a single
// occurrence isn't a "recurring thread" and would misrepresent the data as a pattern.
export function extractThemes(readings) {
  const byCategory = {};
  for (const reading of readings) {
    const seenInThisReading = new Set();
    for (const c of reading.cards) {
      const def = cards.find(x => x.id === c.id);
      if (!def) continue;
      const themeWords = (c.orientation === 'Reversed' ? def.reversedThemes : def.uprightThemes) || [];
      for (const word of themeWords) {
        for (const cat of matchCategories(word)) {
          if (!byCategory[cat]) byCategory[cat] = { name: cat, readingIds: new Set(), cardNames: new Set(), mostRecent: reading.createdAt };
          const entry = byCategory[cat];
          entry.readingIds.add(reading.id);
          entry.cardNames.add(c.name);
          if (new Date(reading.createdAt) > new Date(entry.mostRecent)) entry.mostRecent = reading.createdAt;
          seenInThisReading.add(cat);
        }
      }
    }
  }
  return Object.values(byCategory)
    .filter(e => e.readingIds.size >= 2)
    .map(e => ({
      name: e.name,
      count: e.readingIds.size,
      readingIds: [...e.readingIds],
      cardNames: [...e.cardNames].slice(0, 5),
      mostRecent: e.mostRecent,
      reflectQuestion: REFLECT_QUESTIONS[e.name],
    }))
    .sort((a, b) => b.count - a.count || new Date(b.mostRecent) - new Date(a.mostRecent));
}
