// Ask Differently — deterministic, offline detection that gently offers a reflection-focused
// rephrasing when a question is strongly prediction-focused ("Will he come back?"). No AI API,
// no rejection of the user's question — the original question is always preserved unless the
// user explicitly chooses a suggested one.
const PREDICTION_PATTERNS = [
  /\bwill\b/i,
  /\bwhen will\b/i,
  /\bam i going to\b/i,
  /\bis he\b/i,
  /\bis she\b/i,
  /\bdoes he\b/i,
  /\bdoes she\b/i,
  /\bwhat will happen\b/i,
  /\bfuture\b/i,
  /\bdestiny\b/i,
  /\bgoing to\b/i,
];

const RELATIONSHIP_WORDS = /\b(he|she|him|her|love|ex|partner|relationship|back|marry|marriage|boyfriend|girlfriend|husband|wife|crush|cheat(ing)?)\b/i;
const CAREER_WORDS = /\b(job|career|work|promotion|interview|business|hire|hired|fired|boss|company|salary)\b/i;
const DECISION_WORDS = /\b(should i|choose|choice|decision|option|decide|either)\b/i;

const SUGGESTIONS = {
  relationship: [
    'What do I need to understand about this connection?',
    'What am I holding onto?',
    'What is within my control here?',
  ],
  career: [
    'What do I need to understand about this situation?',
    'What might I be overlooking?',
    'What can I influence?',
  ],
  decision: [
    'What am I not considering?',
    'What matters most to me here?',
    'What would help me make this decision with more clarity?',
  ],
  general: [
    'What is making this difficult to see clearly?',
    'What might I be assuming?',
    'What perspective could help me understand this differently?',
  ],
};

// Returns true only for strongly prediction-focused phrasing. Already-reflective questions
// (containing none of these patterns) pass through untouched.
export function isPredictionFocused(question) {
  if (!question || !question.trim()) return false;
  return PREDICTION_PATTERNS.some(p => p.test(question));
}

export function categorizeQuestion(question) {
  if (RELATIONSHIP_WORDS.test(question)) return 'relationship';
  if (CAREER_WORDS.test(question)) return 'career';
  if (DECISION_WORDS.test(question)) return 'decision';
  return 'general';
}

export function suggestAlternateQuestions(question) {
  return SUGGESTIONS[categorizeQuestion(question)];
}
